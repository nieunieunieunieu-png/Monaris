// Tab "Spam Chat" (BOT_CHAT_HISTORY_SPREADSHEET_ID) — nhật ký người spam tin giống nhau, xem antiSpam/index.js.
// Cột: A Thời gian | B Discord ID | C Tên | D Kênh | E Loại (CẢNH BÁO / CẤM CHAT / BỊ COPY) | F Kết quả | G Nội dung
// Chỉ GHI THÊM dòng (append). Tổng kết đọc lại bằng readSpamRows().
const { google } = require('./googleClient');
const { getGoogleAuthClient } = require('./auth');
const { retryOnQuotaExceeded } = require('../utils/retry');
const { BOT_CHAT_HISTORY_SPREADSHEET_ID, ANTISPAM_SHEET_NAME } = require('../config');

const HEADER_ROW = ['Thời gian', 'Discord ID', 'Tên', 'Kênh', 'Loại', 'Kết quả', 'Nội dung'];

async function getSheetsClient() {
  const authClient = await getGoogleAuthClient();
  if (!authClient) throw new Error('Chưa cấu hình Google Sheets credentials cho bot.');
  return google.sheets({ version: 'v4', auth: authClient });
}

async function ensureAntiSpamSheetExists(authClient) {
  if (!authClient) return;
  const sheets = google.sheets({ version: 'v4', auth: authClient });
  const meta = await sheets.spreadsheets.get({ spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID });
  const exists = (meta.data.sheets || []).some((s) => s.properties.title === ANTISPAM_SHEET_NAME);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      resource: { requests: [{ addSheet: { properties: { title: ANTISPAM_SHEET_NAME } } }] },
    });
  }
  const head = await sheets.spreadsheets.values
    .get({ spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID, range: `'${ANTISPAM_SHEET_NAME}'!A1:G1` })
    .catch(() => ({ data: {} }));
  if (!(head.data && head.data.values && head.data.values[0])) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      range: `'${ANTISPAM_SHEET_NAME}'!A1:G1`,
      valueInputOption: 'RAW',
      resource: { values: [HEADER_ROW] },
    });
  }
}

// rows: mảng các dòng [thời gian, id, tên, kênh, loại, kết quả, nội dung]
async function appendSpamRows(rows) {
  if (!rows.length) return;
  const sheets = await getSheetsClient();
  const doAppend = () =>
    retryOnQuotaExceeded(
      () =>
        sheets.spreadsheets.values.append({
          spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
          range: `'${ANTISPAM_SHEET_NAME}'!A:G`,
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          resource: { values: rows },
        }),
      { label: 'ghi tab Spam Chat' }
    );
  try {
    await doAppend();
  } catch (error) {
    // Tab chưa tồn tại (khởi động chưa tạo được / bị xoá) -> tạo rồi ghi lại 1 lần.
    if (!/unable to parse range/i.test(String(error && error.message))) throw error;
    await ensureAntiSpamSheetExists(await getGoogleAuthClient());
    await doAppend();
  }
}

async function readSpamRows() {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
    range: `'${ANTISPAM_SHEET_NAME}'!A2:G`,
  });
  return res.data.values || [];
}

module.exports = { ensureAntiSpamSheetExists, appendSpamRows, readSpamRows };
