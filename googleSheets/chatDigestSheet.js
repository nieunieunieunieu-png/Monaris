// ===== googleSheets/chatDigestSheet.js — lưu lịch sử chat kênh để AI tóm tắt (AutoReply/chatDigest.js) =====
// Tab "ChatDigest" trong Google Sheet riêng (CHAT_DIGEST_SPREADSHEET_ID, xem config/sheets.js).
// Chỉ chứa cửa sổ 7 TIẾNG gần nhất: mỗi lần lưu là GHI ĐÈ toàn bộ cửa sổ hiện tại (giống pattern
// chatHistorySheet.js/stateSheet.js) nên tiếng cũ nhất tự biến mất, tin bị sửa/xoá cũng tự khớp.
// Cột: A = id tin nhắn, B = timestamp (ms), C = giờ VN (để người đọc xem), D = userId, E = tên hiển thị, F = nội dung.
// Lưu ý id/userId ghi dạng CHỮ (RAW) để Sheets không làm tròn số 18-19 chữ số của Discord.

const { google } = require('./googleClient');
const { getGoogleAuthClient } = require('./auth');
const { retryOnQuotaExceeded } = require('../utils/retry');
const { CHAT_DIGEST_SPREADSHEET_ID, CHAT_DIGEST_SHEET_NAME } = require('../config');

const HEADER_ROW = ['id', 'timestamp', 'giờ VN', 'userId', 'tên', 'nội dung'];
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

let sheetReady = false; // đã chắc chắn tab + header tồn tại (đỡ gọi API thừa mỗi lần lưu)
let lastRowCount = 0; // số dòng data đang có trên sheet sau lần lưu/đọc gần nhất

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatVnTime(ts) {
  const d = new Date(ts + VN_OFFSET_MS);
  return `${pad2(d.getUTCDate())}/${pad2(d.getUTCMonth() + 1)} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`;
}

async function getSheetsApi() {
  const authClient = await getGoogleAuthClient();
  if (!authClient) return null;
  return google.sheets({ version: 'v4', auth: authClient });
}

async function ensureDigestSheetExists(sheets) {
  if (sheetReady) return;

  const response = await sheets.spreadsheets.get({ spreadsheetId: CHAT_DIGEST_SPREADSHEET_ID });
  const exists = (response.data.sheets || []).some((s) => s.properties.title === CHAT_DIGEST_SHEET_NAME);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: CHAT_DIGEST_SPREADSHEET_ID,
      resource: { requests: [{ addSheet: { properties: { title: CHAT_DIGEST_SHEET_NAME } } }] },
    });
  }

  const head = await sheets.spreadsheets.values
    .get({ spreadsheetId: CHAT_DIGEST_SPREADSHEET_ID, range: `'${CHAT_DIGEST_SHEET_NAME}'!A1:F1` })
    .catch(() => ({ data: {} }));
  if (!(head.data.values || []).length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: CHAT_DIGEST_SPREADSHEET_ID,
      range: `'${CHAT_DIGEST_SHEET_NAME}'!A1:F1`,
      valueInputOption: 'RAW',
      resource: { values: [HEADER_ROW] },
    });
  }
  sheetReady = true;
}

// Đọc các dòng còn trong cửa sổ `retainMs` -> mảng { id, ts, authorId, name, text }. Lỗi thì ném ra cho chỗ gọi log.
async function loadDigestRows(retainMs) {
  if (!CHAT_DIGEST_SPREADSHEET_ID) return [];
  const sheets = await getSheetsApi();
  if (!sheets) return [];

  return retryOnQuotaExceeded(
    async () => {
      await ensureDigestSheetExists(sheets);
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: CHAT_DIGEST_SPREADSHEET_ID,
        range: `'${CHAT_DIGEST_SHEET_NAME}'!A2:F`,
      });
      const rows = response.data.values || [];
      lastRowCount = rows.length;

      const cutoff = Date.now() - retainMs;
      return rows
        .map((row) => ({
          id: String(row[0] || ''),
          ts: Number(row[1]),
          authorId: String(row[3] || ''),
          name: String(row[4] || ''),
          text: String(row[5] || ''),
        }))
        .filter((e) => e.id && Number.isFinite(e.ts) && e.ts >= cutoff && e.text);
    },
    { attempts: 3, baseDelayMs: 20_000, label: 'ChatDigest load' }
  );
}

// Ghi đè toàn bộ cửa sổ hiện tại (entries đã sắp CŨ -> MỚI). Ghi dữ liệu mới TRƯỚC rồi mới xoá phần dư phía dưới,
// để lỡ bot sập giữa chừng thì sheet vẫn còn dữ liệu (không bị trống).
async function saveDigestRows(entries) {
  if (!CHAT_DIGEST_SPREADSHEET_ID) return;
  const sheets = await getSheetsApi();
  if (!sheets) return;

  await retryOnQuotaExceeded(
    async () => {
      await ensureDigestSheetExists(sheets);

      if (entries.length) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: CHAT_DIGEST_SPREADSHEET_ID,
          range: `'${CHAT_DIGEST_SHEET_NAME}'!A2`,
          valueInputOption: 'RAW',
          resource: {
            values: entries.map((e) => [String(e.id), String(e.ts), formatVnTime(e.ts), String(e.authorId), e.name, e.text]),
          },
        });
      }

      if (lastRowCount > entries.length) {
        await sheets.spreadsheets.values.clear({
          spreadsheetId: CHAT_DIGEST_SPREADSHEET_ID,
          range: `'${CHAT_DIGEST_SHEET_NAME}'!A${entries.length + 2}:F${lastRowCount + 1}`,
        });
      }
      lastRowCount = entries.length;
    },
    { attempts: 3, baseDelayMs: 20_000, label: 'ChatDigest save' }
  );
}

module.exports = { loadDigestRows, saveDigestRows };
