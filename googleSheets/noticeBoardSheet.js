// Đọc/ghi tab "Bảng Tin Monaris" (BOT_CHAT_HISTORY_SPREADSHEET_ID, cùng
// spreadsheet với "BotChatHistory"/"ChatGlobal" — bot đã có sẵn quyền ghi
// vào đó nên không cần thêm cấu hình credentials gì mới) — nơi lưu danh
// sách tin bot sẽ luân phiên đăng vào kênh IDLE_CHAT_CHANNEL_ID, thay thế
// hoàn toàn tính năng idle chat cũ (xem AutoReply/index.js -> checkNoticeBoard).
//
// Cấu trúc cột (dòng 1 là header, dòng 2 trở đi là data):
//   A = Id            (số thứ tự, tự tăng khi /addnotice)
//   B = Nội dung       (nội dung tin, KHÔNG bao gồm tiền tố "Bảng Tin Monaris:")
//   C = Lần đăng gần nhất (ISO timestamp, RỖNG nếu chưa từng được đăng)
//   D = Người đăng     (Discord ID người ĐĂNG GỐC — nếu tin qua luồng duyệt
//                        thì vẫn là ID người gửi ban đầu, KHÔNG phải ID
//                        người bấm "Đồng Ý" duyệt — xem commands/noticeApproval.js)
//   E = Tự xoá sau (giây) (RIÊNG cho tin này — số giây kể từ lúc đăng thì tự
//                        xoá tin nhắn Discord đi, xem scheduleNoticeBoardAutoDelete
//                        trong AutoReply/noticeBoard.js. RỖNG = dùng mặc định
//                        chung NOTICE_BOARD_AUTO_DELETE_SECONDS (config/autoChat.js);
//                        0 = KHÔNG tự xoá tin này, đăng vĩnh viễn. Đặt được khi
//                        thêm/sửa tin trên trang quản lý web — xem
//                        addNoticeBoardNotice/updateNoticeBoardNotice bên dưới.)
//
// Cột C là cột THÊM để quản lý việc đăng tin đồng đều: mỗi lần chọn tin kế
// tiếp để đăng, bot luôn ưu tiên (các) tin có "Lần đăng gần nhất" CŨ NHẤT
// (tin chưa từng đăng coi như cũ nhất, tức luôn được ưu tiên trước) — nếu có
// nhiều tin cùng cũ nhất (vd tất cả đều chưa từng đăng) thì chọn NGẪU NHIÊN
// 1 trong số đó. Cơ chế này (kiểu LRU) tự đảm bảo: mọi tin đều được đăng ít
// nhất 1 lần trước khi có tin nào đó bị lặp lại, thứ tự giữa các tin có thể
// khác nhau mỗi vòng — đúng yêu cầu ban đầu. Lưu persistent trên sheet (thay
// vì chỉ giữ trong RAM) để không bị mất/reset khi bot restart (redeploy,
// crash, OOM-kill).

const { google } = require('./googleClient');
const { getGoogleAuthClient } = require('./auth');
const { noticeBoardNotices } = require('../state');
const { BOT_CHAT_HISTORY_SPREADSHEET_ID, NOTICE_BOARD_SHEET_NAME } = require('../config');

const HEADER_ROW = ['Id', 'Nội dung', 'Lần đăng gần nhất', 'Người đăng', 'Tự xoá sau (giây)'];
const DATA_RANGE = `'${NOTICE_BOARD_SHEET_NAME}'!A2:E`;

// Parse giá trị "Tự xoá sau (giây)" nhập từ web (số, chuỗi số, rỗng, null,
// undefined) thành 1 trong 2 dạng chuẩn: null (RỖNG = dùng mặc định chung)
// hoặc 1 số nguyên >= 0 (0 = không tự xoá, >0 = số giây tuỳ chỉnh riêng cho
// tin này). Throw lỗi nếu người dùng nhập thứ gì đó không phải số hợp lệ
// (vd chữ, số âm) — tránh lưu rác vào sheet.
function parseAutoDeleteSecondsInput(raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  const num = Number(raw);
  if (!Number.isFinite(num) || num < 0) {
    throw new Error('Thời gian tự xoá phải là 1 số giây >= 0 (để trống nếu muốn dùng mặc định chung).');
  }
  return Math.floor(num);
}

async function getSheetsClient() {
  const authClient = await getGoogleAuthClient();
  if (!authClient) {
    throw new Error('Chưa cấu hình Google Sheets credentials cho bot.');
  }
  return google.sheets({ version: 'v4', auth: authClient });
}

// Tạo tab "Bảng Tin Monaris" + dòng header nếu CHƯA có — không đụng gì
// tới header nếu đã có sẵn dữ liệu ở dòng 1 (tránh ghi đè header đã tự đặt).
async function ensureNoticeBoardSheetExistsWithClient(sheets) {
  const response = await sheets.spreadsheets.get({ spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID });
  const existingSheets = response.data.sheets || [];
  const exists = existingSheets.some((sheet) => sheet.properties.title === NOTICE_BOARD_SHEET_NAME);

  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      resource: {
        requests: [{ addSheet: { properties: { title: NOTICE_BOARD_SHEET_NAME } } }],
      },
    });
  }

  const existingValues = await sheets.spreadsheets.values
    .get({ spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID, range: `'${NOTICE_BOARD_SHEET_NAME}'!A1:E1` })
    .catch(() => ({ data: {} }));

  const rows = (existingValues.data && existingValues.data.values) || [];
  if (rows.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      range: `'${NOTICE_BOARD_SHEET_NAME}'!A1:E1`,
      valueInputOption: 'RAW',
      resource: { values: [HEADER_ROW] },
    });
    return;
  }

  // Sheet Values API chỉ trả về TỚI Ô CÓ DỮ LIỆU CUỐI CÙNG trong dòng — nếu
  // A1:C1 đã có sẵn header (sheet cũ, trước khi có cột D/E) mà D1/E1 đang
  // TRỐNG, `rows[0]` sẽ chỉ dài 3 (hoặc 4) phần tử, không phải length 0, nên
  // khối if ở trên bị bỏ qua và D1/E1 bị bỏ trống MÃI MÃI. Kiểm tra riêng
  // từng cột, chỉ điền header nếu ĐANG TRỐNG, không đụng các cột đã có sẵn.
  const firstRow = rows[0] || [];
  const hasHeaderD = firstRow.length >= 4 && String(firstRow[3] || '').trim() !== '';
  if (!hasHeaderD) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      range: `'${NOTICE_BOARD_SHEET_NAME}'!D1:D1`,
      valueInputOption: 'RAW',
      resource: { values: [[HEADER_ROW[3]]] },
    });
  }
  const hasHeaderE = firstRow.length >= 5 && String(firstRow[4] || '').trim() !== '';
  if (!hasHeaderE) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      range: `'${NOTICE_BOARD_SHEET_NAME}'!E1:E1`,
      valueInputOption: 'RAW',
      resource: { values: [[HEADER_ROW[4]]] },
    });
  }
}

// Bản public — nhận thẳng authClient (giống pattern ensureXSheetExists khác
// được gọi 1 lần lúc ClientReady trong index.js), tự build sheets client.
async function ensureNoticeBoardSheetExists(authClient) {
  if (!authClient) return;
  const sheets = google.sheets({ version: 'v4', auth: authClient });
  await ensureNoticeBoardSheetExistsWithClient(sheets);
}

// Đọc toàn bộ tin từ sheet, nạp vào mảng noticeBoardNotices trong bộ nhớ
// (state.js — mutate trực tiếp, KHÔNG tạo mảng mới, giữ đúng nguyên tắc
// "state.js là nguồn sự thật trong bộ nhớ" của cả project). Gọi 1 lần lúc
// ClientReady, TRƯỚC khi checkNoticeBoard() chạy lần đầu. Best-effort: lỗi
// thì log lại, bot vẫn khởi động bình thường (chỉ là chưa có tin nào để đăng).
async function loadNoticeBoardNotices() {
  try {
    const sheets = await getSheetsClient();
    await ensureNoticeBoardSheetExistsWithClient(sheets);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      range: DATA_RANGE,
    });
    const rows = response.data.values || [];

    noticeBoardNotices.length = 0;
    for (const row of rows) {
      const id = row[0];
      const content = row[1];
      if (!id || !content) continue;

      const lastPostedRaw = row[2];
      const parsed = lastPostedRaw ? Date.parse(lastPostedRaw) : NaN;
      const postedByUserId = row[3] ? String(row[3]) : null;
      // Cột E rỗng/không hợp lệ -> null (dùng mặc định chung khi đăng, xem
      // scheduleNoticeBoardAutoDelete trong AutoReply/noticeBoard.js).
      const autoDeleteRaw = row[4];
      const autoDeleteParsed = autoDeleteRaw !== undefined && autoDeleteRaw !== '' ? parseInt(autoDeleteRaw, 10) : NaN;
      const autoDeleteSeconds = Number.isNaN(autoDeleteParsed) || autoDeleteParsed < 0 ? null : autoDeleteParsed;
      noticeBoardNotices.push({
        id: String(id),
        content,
        lastPostedAt: Number.isNaN(parsed) ? null : parsed,
        postedByUserId,
        autoDeleteSeconds,
      });
    }

    console.log(`Đã nạp ${noticeBoardNotices.length} tin từ sheet "${NOTICE_BOARD_SHEET_NAME}".`);
  } catch (error) {
    console.error('Không thể nạp Bảng Tin Monaris từ Google Sheets:', error.message);
  }

  return noticeBoardNotices;
}

// Thêm 1 tin mới vào CUỐI sheet, Id tự tăng (= Id lớn nhất hiện có + 1, bắt
// đầu từ 1 nếu sheet đang trống). Đọc TRỰC TIẾP (không dùng cache) để tính
// đúng Id kế tiếp ngay tại thời điểm ghi. Dùng cho lệnh /addnotice — cả
// trường hợp Bông đăng thẳng lẫn trường hợp qua duyệt (approve xong mới gọi
// hàm này, xem commands/noticeApproval.js), postedByUserId LUÔN là ID người
// ĐĂNG GỐC (không phải người duyệt).
// autoDeleteSecondsInput: giá trị RAW từ web (số/chuỗi/rỗng/null/undefined)
// — xem parseAutoDeleteSecondsInput() ở trên. RỖNG = dùng mặc định chung.
async function addNoticeBoardNotice(content, postedByUserId = null, autoDeleteSecondsInput = null) {
  const trimmed = (content || '').trim();
  if (!trimmed) {
    throw new Error('Nội dung tin không được để trống.');
  }
  const autoDeleteSeconds = parseAutoDeleteSecondsInput(autoDeleteSecondsInput);

  const sheets = await getSheetsClient();
  await ensureNoticeBoardSheetExistsWithClient(sheets);

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
    range: DATA_RANGE,
  });
  const rows = response.data.values || [];

  let maxId = 0;
  for (const row of rows) {
    const idNum = parseInt(row[0], 10);
    if (!Number.isNaN(idNum) && idNum > maxId) maxId = idNum;
  }
  const newId = String(maxId + 1);

  await sheets.spreadsheets.values.append({
    spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
    range: `'${NOTICE_BOARD_SHEET_NAME}'!A:E`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values: [[newId, trimmed, '', postedByUserId || '', autoDeleteSeconds === null ? '' : String(autoDeleteSeconds)]],
    },
  });

  noticeBoardNotices.push({
    id: newId,
    content: trimmed,
    lastPostedAt: null,
    postedByUserId: postedByUserId || null,
    autoDeleteSeconds,
  });

  return { id: newId, content: trimmed, postedByUserId: postedByUserId || null, autoDeleteSeconds };
}

// Sửa nội dung 1 tin đã có (giữ nguyên Id, "Lần đăng gần nhất" và "Người
// đăng" cũ) — dùng cho tính năng Quản lý Bảng Tin trên web (KHÔNG có lệnh
// Discord tương đương, trước giờ muốn sửa nội dung phải xoá rồi thêm lại,
// mất "Lần đăng gần nhất" cũ). Trả về false nếu không tìm thấy Id.
// autoDeleteSecondsInput: truyền `undefined` để GIỮ NGUYÊN giá trị tự xoá cũ
// (không đụng cột E) — dùng khi chỉ sửa nội dung không kèm ô này (vd sửa tin
// chờ duyệt qua notice/pending/update, không liên quan cột E). Truyền
// null/''/0/số giây để CẬP NHẬT cột E — dùng khi sửa tin đã đăng qua web
// (notice/update), nơi form luôn có sẵn ô "Tự xoá sau (giây)".
async function updateNoticeBoardNotice(id, content, autoDeleteSecondsInput = undefined) {
  const targetId = String(id).trim();
  const trimmed = (content || '').trim();
  if (!trimmed) {
    throw new Error('Nội dung tin không được để trống.');
  }
  const shouldUpdateAutoDelete = autoDeleteSecondsInput !== undefined;
  const autoDeleteSeconds = shouldUpdateAutoDelete ? parseAutoDeleteSecondsInput(autoDeleteSecondsInput) : undefined;

  const sheets = await getSheetsClient();
  await ensureNoticeBoardSheetExistsWithClient(sheets);

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
    range: DATA_RANGE,
  });
  const rows = response.data.values || [];

  const rowIndex = rows.findIndex((row) => String(row[0]) === targetId);
  if (rowIndex === -1) return false;

  const sheetRowNumber = rowIndex + 2;
  await sheets.spreadsheets.values.update({
    spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
    range: `'${NOTICE_BOARD_SHEET_NAME}'!B${sheetRowNumber}:B${sheetRowNumber}`,
    valueInputOption: 'RAW',
    resource: { values: [[trimmed]] },
  });
  if (shouldUpdateAutoDelete) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      range: `'${NOTICE_BOARD_SHEET_NAME}'!E${sheetRowNumber}:E${sheetRowNumber}`,
      valueInputOption: 'RAW',
      resource: { values: [[autoDeleteSeconds === null ? '' : String(autoDeleteSeconds)]] },
    });
  }

  const memEntry = noticeBoardNotices.find((notice) => String(notice.id) === targetId);
  if (memEntry) {
    memEntry.content = trimmed;
    if (shouldUpdateAutoDelete) memEntry.autoDeleteSeconds = autoDeleteSeconds;
  }

  return true;
}

// Tra 1 tin theo Id CHỈ từ bộ nhớ (không gọi Sheets API) — dùng để kiểm tra
// quyền xoá ở lệnh /removenotice (so postedByUserId với người bấm lệnh)
// trước khi thật sự gọi removeNoticeBoardNotice bên dưới.
function getNoticeBoardNoticeById(id) {
  const targetId = String(id).trim();
  return noticeBoardNotices.find((notice) => String(notice.id) === targetId) || null;
}

// Xoá dòng khớp đúng Id khỏi sheet + khỏi bộ nhớ. Trả về true nếu tìm thấy
// và đã xoá, false nếu không tìm thấy Id đó. Dùng cho lệnh /removenotice.
async function removeNoticeBoardNotice(id) {
  const targetId = String(id).trim();

  const sheets = await getSheetsClient();
  await ensureNoticeBoardSheetExistsWithClient(sheets);

  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID });
  const sheetMeta = (spreadsheet.data.sheets || []).find(
    (sheet) => sheet.properties.title === NOTICE_BOARD_SHEET_NAME
  );
  if (!sheetMeta) return false;
  const sheetId = sheetMeta.properties.sheetId;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
    range: DATA_RANGE,
  });
  const rows = response.data.values || [];

  const rowIndex = rows.findIndex((row) => String(row[0]) === targetId);
  if (rowIndex === -1) {
    // Không tìm thấy trên sheet nhưng có thể vẫn còn "kẹt" trong bộ nhớ —
    // xảy ra khi ai đó xoá dòng TRỰC TIẾP trên sheet (không qua lệnh
    // /removenotice) nên loadNoticeBoardNotices() lúc khởi động đã nạp nó
    // vào rồi, và checkNoticeBoard vẫn đọc từ bộ nhớ nên tiếp tục đăng
    // "tin ma" này. Tự dọn luôn khỏi bộ nhớ ở đây để không phải đợi bot
    // restart mới hết bị lặp, đồng thời khiến câu trả lời cho người gọi
    // lệnh rõ ràng hơn (biết là do lệch bộ nhớ/sheet, không phải Id sai).
    const memIndex = noticeBoardNotices.findIndex((notice) => String(notice.id) === targetId);
    if (memIndex !== -1) noticeBoardNotices.splice(memIndex, 1);
    return false;
  }

  // +2: bù lại header (dòng 1) + values.get trả về mảng 0-based bắt đầu từ
  // A2 (dòng thứ 2 thật trên sheet).
  const sheetRowNumber = rowIndex + 2;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
    resource: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              // Sheets API dùng index 0-based, nửa khoảng [start, end).
              startIndex: sheetRowNumber - 1,
              endIndex: sheetRowNumber,
            },
          },
        },
      ],
    },
  });

  const memIndex = noticeBoardNotices.findIndex((notice) => String(notice.id) === targetId);
  if (memIndex !== -1) noticeBoardNotices.splice(memIndex, 1);

  return true;
}

// Chọn tin KẾ TIẾP để đăng, theo cơ chế LRU (xem giải thích ở đầu file):
// ưu tiên (các) tin có lastPostedAt CŨ NHẤT (null = chưa từng đăng = cũ nhất),
// nếu có nhiều tin cùng cũ nhất thì chọn ngẫu nhiên 1 trong số đó. Trả về
// null nếu sheet chưa có tin nào. CHỈ đọc từ bộ nhớ (noticeBoardNotices),
// không gọi Sheets API — dùng cho vòng check mỗi phút (checkNoticeBoard),
// cần nhanh và không tốn quota.
function pickNextNoticeBoardNotice() {
  if (!noticeBoardNotices.length) return null;

  let minTime = Infinity;
  for (const notice of noticeBoardNotices) {
    const t = notice.lastPostedAt === null ? 0 : notice.lastPostedAt;
    if (t < minTime) minTime = t;
  }

  const candidates = noticeBoardNotices.filter(
    (notice) => (notice.lastPostedAt === null ? 0 : notice.lastPostedAt) === minTime
  );

  return candidates[Math.floor(Math.random() * candidates.length)];
}

// Chọn NGẪU NHIÊN 1 tin bất kỳ (KHÔNG theo cơ chế LRU ở trên) — dùng riêng
// cho lệnh /testnotice, vì đây chỉ là gửi thử xem định dạng, không nên ảnh
// hưởng tới vòng xoay đăng tin thật (không mark posted).
function pickRandomNoticeBoardNotice() {
  if (!noticeBoardNotices.length) return null;
  return noticeBoardNotices[Math.floor(Math.random() * noticeBoardNotices.length)];
}

// Đánh dấu 1 tin VỪA được đăng — cập nhật cả bộ nhớ (ngay lập tức, để lần
// chọn tiếp theo trong cùng runtime không bị trúng lại) lẫn cột C trên sheet
// (để giữ đúng thứ tự LRU kể cả sau khi bot restart). Ghi sheet lỗi thì chỉ
// log lại, KHÔNG throw — tin đã gửi lên Discord rồi, không nên coi là thất
// bại toàn bộ chỉ vì bước ghi log phụ này lỗi.
async function markNoticeBoardNoticeAsPosted(id, timestampMs) {
  const targetId = String(id);
  const isoString = new Date(timestampMs).toISOString();

  const memEntry = noticeBoardNotices.find((notice) => String(notice.id) === targetId);
  if (memEntry) memEntry.lastPostedAt = timestampMs;

  try {
    const sheets = await getSheetsClient();
    await ensureNoticeBoardSheetExistsWithClient(sheets);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      range: DATA_RANGE,
    });
    const rows = response.data.values || [];

    const rowIndex = rows.findIndex((row) => String(row[0]) === targetId);
    if (rowIndex === -1) return;

    const sheetRowNumber = rowIndex + 2;
    await sheets.spreadsheets.values.update({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      range: `'${NOTICE_BOARD_SHEET_NAME}'!C${sheetRowNumber}:C${sheetRowNumber}`,
      valueInputOption: 'RAW',
      resource: { values: [[isoString]] },
    });
  } catch (error) {
    console.error('Không thể cập nhật "Lần đăng gần nhất" cho Bảng Tin Monaris:', error.message);
  }
}

// Giới hạn 1900 ký tự/đoạn (Discord chặn tin nhắn text > 2000 ký tự) — dùng
// cho /viewnotice và mon!viewnotice, nội dung có thể dài hơn 1 tin.
const VIEW_CHUNK_MAX_LEN = 1900;

function formatOneNoticeLine(notice) {
  const preview = notice.content.length > 200 ? `${notice.content.slice(0, 200)}…` : notice.content;
  const lastPosted = notice.lastPostedAt
    ? `<t:${Math.floor(notice.lastPostedAt / 1000)}:R>`
    : 'chưa từng đăng';
  const postedBy = notice.postedByUserId ? `<@${notice.postedByUserId}>` : 'không rõ';
  const autoDelete =
    notice.autoDeleteSeconds === null || notice.autoDeleteSeconds === undefined
      ? 'mặc định'
      : notice.autoDeleteSeconds === 0
        ? 'không tự xoá'
        : `${notice.autoDeleteSeconds}s`;
  return (
    `**#${notice.id}** — ${preview}\n` +
    `> Đăng lần cuối: ${lastPosted} • Người đăng: ${postedBy} • Tự xoá sau: ${autoDelete}`
  );
}

function chunkNoticeLines(lines) {
  const chunks = [];
  let current = '';
  for (const line of lines) {
    const candidate = current ? `${current}\n\n${line}` : line;
    if (candidate.length > VIEW_CHUNK_MAX_LEN) {
      if (current) chunks.push(current);
      current = line;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

// Nạp lại TOÀN BỘ từ sheet (như lúc ClientReady) rồi trả về danh sách text
// đã chia đoạn để gửi Discord — dùng cho /viewnotice và mon!viewnotice. Gọi
// loadNoticeBoardNotices() ở đây có tác dụng phụ RẤT hữu ích: tự đồng bộ lại
// bộ nhớ với sheet (kể cả khi ai đó xoá/sửa tay trên sheet), nên xem danh
// sách 1 lần cũng coi như "làm mới" luôn — không cần restart bot lẫn không
// cần thêm lệnh /reloadnotice riêng.
async function buildNoticeBoardListChunks() {
  await loadNoticeBoardNotices();

  if (!noticeBoardNotices.length) {
    return ['📋 Bảng Tin Monaris hiện chưa có tin nào.'];
  }

  const sorted = [...noticeBoardNotices].sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10));
  const lines = sorted.map(formatOneNoticeLine);
  const header = `📋 Bảng Tin Monaris — ${sorted.length} tin (đã đồng bộ lại từ sheet):\n`;

  const bodyChunks = chunkNoticeLines(lines);
  bodyChunks[0] = header + bodyChunks[0];
  return bodyChunks;
}

module.exports = {
  ensureNoticeBoardSheetExists,
  loadNoticeBoardNotices,
  addNoticeBoardNotice,
  updateNoticeBoardNotice,
  removeNoticeBoardNotice,
  getNoticeBoardNoticeById,
  pickNextNoticeBoardNotice,
  pickRandomNoticeBoardNotice,
  markNoticeBoardNoticeAsPosted,
  buildNoticeBoardListChunks,
};