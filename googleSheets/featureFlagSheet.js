// ===== googleSheets/featureFlagSheet.js — lưu công tắt tính năng vui/giải trí =====
// Tab "Công Tắc Tính Năng" (config/featureFlags.js) trong sheet chính GOOGLE_SHEET_ID:
//   A1: id | B1: Tên | C1: Trạng thái (bật/tắt, để trống = theo mặc định) | D1: Người đổi | E1: Thời gian
// Mỗi lần lưu ghi đè cả bảng (chỉ ~20 dòng) bằng 1 request update — an toàn với quota Sheets.

const { google } = require('./googleClient');
const { getGoogleAuthClient } = require('./auth');
const { SPREADSHEET_ID, FEATURE_FLAGS_SHEET_NAME } = require('../config');
const { recordSheetOk, recordSheetError } = require('../monitoring/status');

const STATUS_SOURCE = 'Công tắc tính năng';
const HEADER_ROW = ['id', 'Tên', 'Trạng thái', 'Người đổi', 'Thời gian'];

async function ensureFeatureFlagSheetExists(authClient) {
  if (!SPREADSHEET_ID) return;
  const sheets = google.sheets({ version: 'v4', auth: authClient });
  const response = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const exists = (response.data.sheets || []).some((s) => s.properties.title === FEATURE_FLAGS_SHEET_NAME);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: { requests: [{ addSheet: { properties: { title: FEATURE_FLAGS_SHEET_NAME } } }] },
    });
  }
  const head = await sheets.spreadsheets.values
    .get({ spreadsheetId: SPREADSHEET_ID, range: `${FEATURE_FLAGS_SHEET_NAME}!A1:E1` })
    .catch(() => ({ data: {} }));
  if (!((head.data && head.data.values) || []).length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${FEATURE_FLAGS_SHEET_NAME}!A1:E1`,
      valueInputOption: 'RAW',
      resource: { values: [HEADER_ROW] },
    });
  }
}

// Trả về [{ id, on: true|false, by, at }] — chỉ các dòng có trạng thái bật/tắt rõ ràng. Ném lỗi nếu không đọc được.
async function loadFeatureFlagRows() {
  if (!SPREADSHEET_ID) return [];
  try {
    const authClient = await getGoogleAuthClient();
    if (!authClient) return [];
    await ensureFeatureFlagSheetExists(authClient);
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${FEATURE_FLAGS_SHEET_NAME}!A2:E`,
    });
    const out = [];
    for (const row of response.data.values || []) {
      const id = String(row[0] || '').trim();
      const word = String(row[2] || '').trim().toLowerCase();
      if (!id) continue;
      if (word === 'bật' || word === 'bat' || word === 'on' || word === '1' || word === 'true') out.push({ id, on: true, by: row[3] || '', at: row[4] || '' });
      else if (word === 'tắt' || word === 'tat' || word === 'off' || word === '0' || word === 'false') out.push({ id, on: false, by: row[3] || '', at: row[4] || '' });
    }
    recordSheetOk(STATUS_SOURCE);
    return out;
  } catch (error) {
    recordSheetError(STATUS_SOURCE, error);
    throw error;
  }
}

// rows: [{ id, name, on: true|false|null, by, at }] — ghi đè toàn bộ bảng.
async function saveFeatureFlagRows(rows) {
  if (!SPREADSHEET_ID) throw new Error('Chưa cấu hình GOOGLE_SHEET_ID nên không lưu được công tắt.');
  try {
    const authClient = await getGoogleAuthClient();
    if (!authClient) throw new Error('Chưa đăng nhập được Google.');
    await ensureFeatureFlagSheetExists(authClient);
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    const values = rows.map((r) => [r.id, r.name || '', r.on === true ? 'bật' : r.on === false ? 'tắt' : '', r.by || '', r.at || '']);
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${FEATURE_FLAGS_SHEET_NAME}!A2:E${values.length + 1}`,
      valueInputOption: 'RAW',
      resource: { values },
    });
    recordSheetOk(STATUS_SOURCE);
  } catch (error) {
    recordSheetError(STATUS_SOURCE, error);
    throw error;
  }
}

module.exports = { ensureFeatureFlagSheetExists, loadFeatureFlagRows, saveFeatureFlagRows };
