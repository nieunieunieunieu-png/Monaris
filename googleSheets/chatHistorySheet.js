// Lưu lịch sử chat GIỮA BOT VÀ NGƯỜI DÙNG (tối đa BOT_CHAT_HISTORY_MAX_ENTRIES
// tin nhắn gần nhất, tính chung toàn server) vào tab "BotChatHistory" trong 1
// Google Sheet riêng — để AI (AutoReply/aiClient.js) có "trí nhớ" ngữ cảnh,
// trả lời được những câu hỏi nhắc lại điều đã nói trước đó (vd "lúc nãy tao
// hỏi gì ấy nhỉ", "ừ đúng rồi đó" tiếp nối câu trước...) thay vì mỗi lượt
// chat là hoàn toàn mất trí nhớ như trước (askGemini() chỉ nhận đúng 1 tin
// nhắn hiện tại, không có ngữ cảnh trước đó).
//
// Cấu trúc sheet "BotChatHistory":
//   A1: "timestamp"  B1: "channelId"  C1: "userId"  D1: "userDisplayName"
//   E1: "userMessage" F1: "botReply"
//   (dòng 2 trở đi là data, dòng CUỐI CÙNG = tin nhắn MỚI NHẤT)
//
// Toàn bộ lịch sử được giữ 1 bản mirror trong bộ nhớ (historyCache) để: (1)
// đọc ngữ cảnh cho AI KHÔNG cần gọi Sheets API mỗi lần chat (auto-chat có
// thể trigger dồn dập), (2) mỗi khi có tin nhắn mới thì GHI ĐÈ lại toàn bộ
// sheet từ cache — giống pattern "full overwrite" đã dùng ở stateSheet.js —
// đơn giản & an toàn hơn append+trim từng dòng, vì cache luôn <=
// BOT_CHAT_HISTORY_MAX_ENTRIES phần tử nên chi phí ghi lại không đáng kể.

const { google } = require('./googleClient');
const { getGoogleAuthClient } = require('./auth');
const {
  BOT_CHAT_HISTORY_SPREADSHEET_ID,
  BOT_CHAT_HISTORY_SHEET_NAME,
  BOT_CHAT_HISTORY_MAX_ENTRIES,
} = require('../config');

const PRIVATE_CHANNEL = '1566701909270601758';
const HEADER_ROW = ['timestamp', 'channelId', 'userId', 'userDisplayName', 'userMessage', 'botReply'];

// Cắt bớt nội dung tin nhắn/câu trả lời trước khi lưu — phòng trường hợp
// hiếm gặp 1 tin nhắn cực dài làm phình sheet không cần thiết (đủ dài để
// giữ ngữ cảnh, không cần nguyên văn 100%).
const MAX_ENTRY_TEXT_LENGTH = 500;

// Mirror trong bộ nhớ của toàn bộ lịch sử đang lưu trên sheet — luôn tối đa
// BOT_CHAT_HISTORY_MAX_ENTRIES phần tử, phần tử CUỐI MẢNG là tin MỚI NHẤT.
let historyCache = [];

async function ensureHistorySheetExists(authClient) {
  if (!BOT_CHAT_HISTORY_SPREADSHEET_ID) return;

  const sheets = google.sheets({ version: 'v4', auth: authClient });
  const response = await sheets.spreadsheets.get({ spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID });
  const existingSheets = response.data.sheets || [];
  const exists = existingSheets.some((sheet) => sheet.properties.title === BOT_CHAT_HISTORY_SHEET_NAME);

  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      resource: {
        requests: [{ addSheet: { properties: { title: BOT_CHAT_HISTORY_SHEET_NAME } } }],
      },
    });
  }

  const existingValues = await sheets.spreadsheets.values
    .get({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      range: `'${BOT_CHAT_HISTORY_SHEET_NAME}'!A1:F1`,
    })
    .catch(() => ({ data: {} }));

  const rows = (existingValues.data && existingValues.data.values) || [];
  if (rows.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      range: `'${BOT_CHAT_HISTORY_SHEET_NAME}'!A1:F1`,
      valueInputOption: 'RAW',
      resource: { values: [HEADER_ROW] },
    });
  }
}

// Đọc toàn bộ lịch sử đã lưu từ sheet vào historyCache — gọi 1 lần lúc
// ClientReady (giống loadState() ở stateSheet.js), TRƯỚC khi bot xử lý bất
// kỳ tin nhắn nào, để không bị mất "trí nhớ" mỗi lần bot restart/redeploy.
async function loadChatHistory() {
  if (!BOT_CHAT_HISTORY_SPREADSHEET_ID) {
    console.warn('Chưa cấu hình BOT_CHAT_HISTORY_SPREADSHEET_ID — bỏ qua khôi phục lịch sử chat AI.');
    return;
  }

  try {
    const authClient = await getGoogleAuthClient();
    if (!authClient) return;

    const sheets = google.sheets({ version: 'v4', auth: authClient });
    await ensureHistorySheetExists(authClient);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      // +1 vì dòng 1 là header — đọc dư ra chút cũng không sao, chỉ lấy
      // đúng BOT_CHAT_HISTORY_MAX_ENTRIES dòng data gần nhất bên dưới.
      range: `'${BOT_CHAT_HISTORY_SHEET_NAME}'!A2:F${BOT_CHAT_HISTORY_MAX_ENTRIES + 1}`,
    });

    const rows = response.data.values || [];
    historyCache = rows
      .filter((row) => row && row.length && (row[4] || row[5]) && row[1] !== PRIVATE_CHANNEL) // bỏ dòng trống
      .map((row) => ({
        timestamp: row[0] || '',
        channelId: row[1] || '',
        userId: row[2] || '',
        userDisplayName: row[3] || '',
        userMessage: row[4] || '',
        botReply: row[5] || '',
      }));

    console.log(`Đã khôi phục ${historyCache.length} tin nhắn lịch sử chat AI từ Google Sheets.`);
  } catch (error) {
    console.error('Failed to load bot chat history from Google Sheets:', error.message);
  }
}

// Ghi TOÀN BỘ historyCache hiện tại xuống sheet (ghi đè hoàn toàn, giống
// pattern saveState() ở stateSheet.js). Xoá sạch phần data cũ TRƯỚC khi ghi
// lại (không đụng header) — tránh sót dòng rác cũ phía dưới nếu số dòng mới
// ít hơn số dòng cũ (hiếm khi xảy ra vì cache chỉ tăng dần tới khi đầy, nhưng
// vẫn xử lý cho chắc chắn).
async function persistHistoryCache() {
  if (!BOT_CHAT_HISTORY_SPREADSHEET_ID) return;

  try {
    const authClient = await getGoogleAuthClient();
    if (!authClient) return;

    const sheets = google.sheets({ version: 'v4', auth: authClient });
    await ensureHistorySheetExists(authClient);

    await sheets.spreadsheets.values.clear({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      range: `'${BOT_CHAT_HISTORY_SHEET_NAME}'!A2:F100000`,
    });

    if (historyCache.length) {
      const values = historyCache.map((entry) => [
        entry.timestamp,
        entry.channelId,
        entry.userId,
        entry.userDisplayName,
        entry.userMessage,
        entry.botReply,
      ]);

      await sheets.spreadsheets.values.update({
        spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
        range: `'${BOT_CHAT_HISTORY_SHEET_NAME}'!A2`,
        valueInputOption: 'RAW',
        resource: { values },
      });
    }
  } catch (error) {
    // Best-effort: nếu lưu thất bại (lỗi mạng, quota Google Sheets...),
    // không được làm gián đoạn luồng chat chính — lúc gọi hàm này bot đã
    // trả lời xong người dùng rồi, chỉ log lại để biết.
    console.error('Failed to save bot chat history to Google Sheets:', error.message);
  }
}

// Thêm 1 LƯỢT trao đổi (tin nhắn người dùng + câu trả lời của bot) vào lịch
// sử — cắt bớt nếu vượt quá BOT_CHAT_HISTORY_MAX_ENTRIES (giữ lại các tin
// MỚI NHẤT, bỏ tin CŨ NHẤT). Bỏ qua nếu thiếu 1 trong 2 vế (không có gì để
// AI tham khảo lại nếu chỉ có 1 phía).
async function addChatHistoryEntry({ channelId, userId, userDisplayName, userMessage, botReply }) {
  if (!userMessage || !botReply || channelId === PRIVATE_CHANNEL) return;

  historyCache.push({
    timestamp: new Date().toISOString(),
    channelId: channelId || '',
    userId: userId || '',
    userDisplayName: userDisplayName || '',
    userMessage: String(userMessage).slice(0, MAX_ENTRY_TEXT_LENGTH),
    botReply: String(botReply).slice(0, MAX_ENTRY_TEXT_LENGTH),
  });

  if (historyCache.length > BOT_CHAT_HISTORY_MAX_ENTRIES) {
    historyCache = historyCache.slice(historyCache.length - BOT_CHAT_HISTORY_MAX_ENTRIES);
  }

  await persistHistoryCache();
}

// Lấy `limit` LƯỢT trao đổi GẦN NHẤT trong ĐÚNG 1 channel cụ thể (đọc từ
// historyCache đang có sẵn trong bộ nhớ, không gọi Sheets API) — lọc theo
// channelId (KHÔNG còn tách riêng theo userId nữa) để bot nắm được mạch
// chuyện chung của cả kênh: ai vừa nhắc gì, người khác tiếp lời ra sao,
// tránh tình trạng tin nhắn liền kề nhưng bot trả lời như mất trí nhớ giữa
// chừng chỉ vì khác người gõ. Trả về mảng theo thứ tự CŨ -> MỚI (đúng thứ
// tự hội thoại thật) để nhét vào prompt cho tự nhiên; mỗi entry vẫn giữ
// userDisplayName để AI phân biệt được lời của từng người trong kênh.
// limit mặc định = 3 (thay vì lấy hết) để tiết kiệm token mỗi lần gọi Gemini
// — con số này CHỈ ảnh hưởng số lượt được nhét vào prompt, KHÔNG ảnh hưởng
// tới BOT_CHAT_HISTORY_MAX_ENTRIES (config.js) là giới hạn LƯU TRỮ tổng
// trong cache/Sheet (300), 2 cái độc lập nhau.
function getRecentChatHistoryForChannel(channelId, limit = 3) {
  const entries = channelId
    ? historyCache
        .filter((entry) => entry.channelId === channelId)
        .slice(-limit)
    : [];

  Object.defineProperty(entries, 'channelId', {
    value: String(channelId || ''),
    enumerable: false
  });

  return entries;
}

module.exports = {
  loadChatHistory,
  addChatHistoryEntry,
  getRecentChatHistoryForChannel,
};