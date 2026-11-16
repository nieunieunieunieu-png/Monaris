// Lưu/đọc danh sách kênh chat được phép của từng server (state.chatChannels
// trong state.js) vào sheet RIÊNG "ChatChanelAllows" — KHÁC với BotState
// (nơi lưu scrimData/bcData/srcImageData dạng blob JSON). Tách riêng ra
// sheet này để dễ mở lên xem/sửa tay trực tiếp bằng mắt thường, và để
// tránh lưu trùng lặp 1 loại dữ liệu ở 2 chỗ khác nhau.
//
// Cấu trúc sheet "ChatChanelAllows":
//   A1: "serverId"     B1: "channelId"
//   A2: <guildId 1>    B2: <channelId 1 của guildId 1>
//   A3: <guildId 1>    B3: <channelId 2 của guildId 1, nếu có>
//   A4: <guildId 2>    B4: <channelId của guildId 2>
//   ...
// Mỗi DÒNG là 1 cặp (server, channel) — 1 server cho phép nhiều kênh thì có
// nhiều dòng cùng serverId, mỗi dòng 1 channelId khác nhau.

const { google } = require('./googleClient');
const { getGoogleAuthClient } = require('./auth');
const { chatChannels } = require('../state');
const { SPREADSHEET_ID, CHAT_CHANNEL_ALLOWS_SHEET_NAME } = require('../config');

const HEADER_ROW = ['serverId', 'channelId'];

async function ensureChatChannelAllowsSheetExists(authClient) {
  if (!SPREADSHEET_ID) {
    return;
  }

  const sheets = google.sheets({ version: 'v4', auth: authClient });
  const response = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existingSheets = response.data.sheets || [];
  const exists = existingSheets.some((sheet) => sheet.properties.title === CHAT_CHANNEL_ALLOWS_SHEET_NAME);

  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [
          {
            addSheet: {
              properties: {
                title: CHAT_CHANNEL_ALLOWS_SHEET_NAME,
              },
            },
          },
        ],
      },
    });
  }

  // Đảm bảo có header dòng 1 — kể cả khi sheet đã được TỰ TAY tạo sẵn từ
  // trước (vd tạo thẳng trên Google Sheets UI) mà chưa có header đúng chuẩn.
  const existingValues = await sheets.spreadsheets.values
    .get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${CHAT_CHANNEL_ALLOWS_SHEET_NAME}!A1:B1`,
    })
    .catch(() => ({ data: {} }));

  const rows = (existingValues.data && existingValues.data.values) || [];

  if (rows.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${CHAT_CHANNEL_ALLOWS_SHEET_NAME}!A1:B1`,
      valueInputOption: 'RAW',
      resource: { values: [HEADER_ROW] },
    });
  }
}

// Đọc toàn bộ danh sách (server, channel) từ sheet và merge vào object
// chatChannels đang được các module khác import (mutate trực tiếp, KHÔNG
// tạo object mới — giữ đúng nguyên tắc "state.js là nguồn sự thật trong bộ
// nhớ" của cả project). Gọi 1 lần lúc ClientReady, TRƯỚC khi bot xử lý bất
// kỳ lệnh nào.
//
// TỰ THỬ LẠI (retry) nếu lượt đọc chính (values.get) thất bại — ClientReady
// bắn liên tiếp ~13 lượt gọi Google Sheets API khác nhau chỉ trong vài giây
// (xem index.js), rất dễ dính lỗi quota 429/timeout mạng thoáng qua đúng
// lúc gọi hàm này. TRƯỚC ĐÂY: gặp lỗi là bỏ cuộc luôn, chatChannels ở lại
// RỖNG (giá trị mặc định trong state.js) cho tới lần restart kế tiếp —
// nhìn như "mất danh sách kênh chat" dù dữ liệu thật trên sheet vẫn còn
// nguyên. Retry vài lần cách nhau vài giây giúp tự vượt qua phần lớn lỗi
// thoáng qua này mà không cần restart lại bot.
async function loadChatChannelAllows(retriesLeft = 3) {
  if (!SPREADSHEET_ID) {
    console.warn('GOOGLE_SHEET_ID chưa được set. Bỏ qua việc khôi phục chatChannels từ sheet ChatChanelAllows.');
    return;
  }

  try {
    const authClient = await getGoogleAuthClient();
    if (!authClient) {
      return;
    }

    const sheets = google.sheets({ version: 'v4', auth: authClient });

    await ensureChatChannelAllowsSheetExists(authClient);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${CHAT_CHANNEL_ALLOWS_SHEET_NAME}!A2:B`,
    });

    const rows = response.data.values || [];

    // Xoá sạch dữ liệu cũ trong bộ nhớ trước khi nạp lại từ sheet, để nếu 1
    // dòng đã bị xoá trực tiếp trên sheet (bằng tay) thì bot cũng đồng bộ
    // theo, không giữ dữ liệu "mồ côi" trong bộ nhớ. Chỉ chạy tới đây khi
    // ĐÃ đọc sheet THÀNH CÔNG (response ở trên không throw) — nên không có
    // chuyện xoá sạch rồi bỏ dở nếu bước đọc thất bại.
    for (const key of Object.keys(chatChannels)) {
      delete chatChannels[key];
    }

    for (const row of rows) {
      const guildId = row[0];
      const channelId = row[1];
      if (!guildId || !channelId) continue;

      if (!chatChannels[guildId]) {
        chatChannels[guildId] = [];
      }
      if (!chatChannels[guildId].includes(channelId)) {
        chatChannels[guildId].push(channelId);
      }
    }

    console.log('Đã khôi phục chatChannels từ sheet ChatChanelAllows.');
  } catch (error) {
    if (retriesLeft > 0) {
      console.warn(
        `Lỗi đọc "ChatChanelAllows" (${error.message}), thử lại sau 3 giây... (còn ${retriesLeft} lần thử)`
      );
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return loadChatChannelAllows(retriesLeft - 1);
    }
    // Best-effort: đã thử lại hết số lần cho phép mà vẫn lỗi, bot vẫn khởi
    // động bình thường với giá trị mặc định (rỗng) trong state.js — chỉ
    // log lại để biết. Chạy mon!chatchannels để kiểm tra lại thủ công, hoặc
    // đợi lần restart kế tiếp bot sẽ tự thử nạp lại từ đầu.
    console.error('Failed to load chatChannels from ChatChanelAllows sheet (đã hết số lần thử lại):', error.message);
  }
}

// Thêm 1 dòng (guildId, channelId) mới vào cuối sheet. Gọi sau khi đã cập
// nhật xong state.chatChannels trong bộ nhớ (mon!setchatchannel).
async function addChatChannelRow(guildId, channelId) {
  if (!SPREADSHEET_ID) {
    console.warn('GOOGLE_SHEET_ID chưa được set. Kênh chat không được lưu vào Google Sheets.');
    return;
  }

  try {
    const authClient = await getGoogleAuthClient();
    if (!authClient) {
      return;
    }

    const sheets = google.sheets({ version: 'v4', auth: authClient });

    await ensureChatChannelAllowsSheetExists(authClient);

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${CHAT_CHANNEL_ALLOWS_SHEET_NAME}!A:B`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: { values: [[guildId, channelId]] },
    });
  } catch (error) {
    console.error('Failed to add chat channel row to ChatChanelAllows sheet:', error.message);
  }
}

// Xoá (các) dòng khớp đúng cặp (guildId, channelId) khỏi sheet. Gọi sau khi
// đã cập nhật xong state.chatChannels trong bộ nhớ (mon!removechatchannel).
async function removeChatChannelRow(guildId, channelId) {
  if (!SPREADSHEET_ID) {
    console.warn('GOOGLE_SHEET_ID chưa được set. Không thể xoá kênh chat khỏi Google Sheets.');
    return;
  }

  try {
    const authClient = await getGoogleAuthClient();
    if (!authClient) {
      return;
    }

    const sheets = google.sheets({ version: 'v4', auth: authClient });

    await ensureChatChannelAllowsSheetExists(authClient);

    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheetMeta = (spreadsheet.data.sheets || []).find(
      (sheet) => sheet.properties.title === CHAT_CHANNEL_ALLOWS_SHEET_NAME
    );
    if (!sheetMeta) return;
    const sheetId = sheetMeta.properties.sheetId;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${CHAT_CHANNEL_ALLOWS_SHEET_NAME}!A2:B`,
    });

    const rows = response.data.values || [];

    // Xoá theo thứ tự TỪ DƯỚI LÊN — xoá dòng phía trên trước sẽ làm lệch
    // chỉ số (index) của các dòng phía dưới còn lại.
    const rowIndexesToDelete = [];
    rows.forEach((row, i) => {
      if (row[0] === guildId && row[1] === channelId) {
        // +2: bù lại header (dòng 1) + values.get trả về mảng 0-based
        // bắt đầu từ A2 (dòng thứ 2 thật trên sheet).
        rowIndexesToDelete.push(i + 2);
      }
    });

    if (rowIndexesToDelete.length === 0) return;

    const deleteRequests = rowIndexesToDelete
      .sort((a, b) => b - a)
      .map((rowNumber) => ({
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            // Sheets API dùng index 0-based, nửa khoảng [start, end).
            startIndex: rowNumber - 1,
            endIndex: rowNumber,
          },
        },
      }));

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: { requests: deleteRequests },
    });
  } catch (error) {
    console.error('Failed to remove chat channel row from ChatChanelAllows sheet:', error.message);
  }
}

module.exports = {
  ensureChatChannelAllowsSheetExists,
  loadChatChannelAllows,
  addChatChannelRow,
  removeChatChannelRow,
};