// Đọc/ghi tab "Từ Khoá Nhạy Cảm" (BOT_CHAT_HISTORY_SPREADSHEET_ID — cùng spreadsheet với
// "Hòm Thư Góp Ý", bot đã có quyền ghi sẵn) — danh sách từ khoá bot tự xoá tin, xem
// keywordFilter/index.js.
//
// Cấu trúc cột (dòng 1 là header, dòng 2 trở đi là data):
//   A = Từ khoá (có dấu)   vd "rời bang"
//   B = Không dấu          vd "roi bang"   (bỏ trống cũng được — bot tự bỏ dấu cột A)
//   C = Bật                'TRUE' / 'FALSE' (mặc định TRUE; FALSE = tạm tắt từ khoá này)
//   D = Ghi chú            tuỳ ý (lý do chặn...)
// Muốn thêm từ khoá: thêm 1 dòng mới vào sheet, tối đa vài phút sau bot tự nhận.
// Tab chỉ được seed dữ liệu mẫu lúc TẠO MỚI — xoá hết dòng đi bot sẽ không tự thêm lại.

const { google } = require('./googleClient');
const { getGoogleAuthClient } = require('./auth');
const { BOT_CHAT_HISTORY_SPREADSHEET_ID, KEYWORD_FILTER_SHEET_NAME } = require('../config');

const HEADER_ROW = ['Từ khoá (có dấu)', 'Không dấu', 'Bật', 'Ghi chú'];
const DATA_RANGE = `'${KEYWORD_FILTER_SHEET_NAME}'!A2:D`;
const SEED_ROWS = [
  ['out bang', 'out bang', 'TRUE', 'Gây mất đoàn kết nội bộ'],
  ['rời bang', 'roi bang', 'TRUE', 'Gây mất đoàn kết nội bộ'],
];

async function getSheetsClient() {
  const authClient = await getGoogleAuthClient();
  if (!authClient) {
    throw new Error('Chưa cấu hình Google Sheets credentials cho bot.');
  }
  return google.sheets({ version: 'v4', auth: authClient });
}

// Tạo tab (nếu chưa có) + header; seed từ khoá mẫu CHỈ khi vừa tạo tab mới.
async function ensureKeywordFilterSheetExistsWithClient(sheets) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID });
  const exists = (meta.data.sheets || []).some((s) => s.properties.title === KEYWORD_FILTER_SHEET_NAME);

  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      resource: { requests: [{ addSheet: { properties: { title: KEYWORD_FILTER_SHEET_NAME } } }] },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      range: `'${KEYWORD_FILTER_SHEET_NAME}'!A1:D${SEED_ROWS.length + 1}`,
      valueInputOption: 'RAW',
      resource: { values: [HEADER_ROW, ...SEED_ROWS] },
    });
    return;
  }

  const existing = await sheets.spreadsheets.values
    .get({ spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID, range: `'${KEYWORD_FILTER_SHEET_NAME}'!A1:D1` })
    .catch(() => ({ data: {} }));
  const header = (existing.data && existing.data.values && existing.data.values[0]) || [];
  if (!header.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      range: `'${KEYWORD_FILTER_SHEET_NAME}'!A1:D1`,
      valueInputOption: 'RAW',
      resource: { values: [HEADER_ROW] },
    });
  }
}

async function ensureKeywordFilterSheetExists(authClient) {
  if (!authClient) return;
  const sheets = google.sheets({ version: 'v4', auth: authClient });
  await ensureKeywordFilterSheetExistsWithClient(sheets);
}

// Đọc TRỰC TIẾP từ sheet. Trả về [{ accented, plain, enabled, note }]. Throw nếu đọc lỗi
// (nơi gọi giữ nguyên danh sách cũ, không ghi đè bằng rỗng).
async function readKeywordRows() {
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
    range: DATA_RANGE,
  });
  const rows = response.data.values || [];
  const result = [];
  for (const row of rows) {
    const accented = String(row[0] || '').trim();
    const plain = String(row[1] || '').trim();
    if (!accented && !plain) continue;
    const flag = String(row[2] === undefined ? 'TRUE' : row[2]).trim().toUpperCase();
    result.push({
      accented,
      plain,
      enabled: flag !== 'FALSE' && flag !== '0' && flag !== 'NO',
      note: String(row[3] || '').trim(),
    });
  }
  return result;
}

module.exports = { ensureKeywordFilterSheetExists, readKeywordRows };
