// ===== googleSheets/levelWeekSheet.js — tab "Mốc Tuần" của spreadsheet Level (LEVEL_SPREADSHEET_ID) =====
// Ảnh chụp tổng EXP của MỌI thành viên vào đầu mỗi tuần (00:00 Thứ Hai giờ VN) — bot tự ghi (level/weekSnapshot.js), đừng sửa tay.
// EXP tuần vừa rồi = chênh lệch giữa 2 ảnh chụp liên tiếp -> dùng cấp role Top tuần. Chỉ giữ 3 tuần gần nhất (tự xoá tuần cũ). Cột:
//   A Tuần (YYYY-MM-DD = Thứ Hai BẮT ĐẦU tuần) | B Discord ID | C Tên | D EXP | E Chụp Lúc (giờ VN)
const { google } = require('./googleClient');
const { getGoogleAuthClient } = require('./auth');
const { LEVEL_SPREADSHEET_ID, LEVEL_WEEK_SHEET_NAME } = require('../config');

const HEADER = ['Tuần', 'Discord ID', 'Tên', 'EXP', 'Chụp Lúc'];
const KEEP_WEEKS = 3;

async function getSheetsClient() {
  const auth = await getGoogleAuthClient();
  if (!auth) throw new Error('Chưa cấu hình Google Sheets credentials cho bot.');
  return google.sheets({ version: 'v4', auth });
}

function vnTimeString(ms = Date.now()) {
  const d = new Date(ms + 7 * 60 * 60 * 1000);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

// Trả về sheetId của tab (tạo tab nếu chưa có).
async function ensureWeekSheet(sheets) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: LEVEL_SPREADSHEET_ID });
  const found = (meta.data.sheets || []).find((s) => s.properties.title === LEVEL_WEEK_SHEET_NAME);
  if (found) return found.properties.sheetId;
  const res = await sheets.spreadsheets.batchUpdate({
    spreadsheetId: LEVEL_SPREADSHEET_ID,
    resource: { requests: [{ addSheet: { properties: { title: LEVEL_WEEK_SHEET_NAME, gridProperties: { frozenRowCount: 1 } } } }] },
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId: LEVEL_SPREADSHEET_ID,
    range: `'${LEVEL_WEEK_SHEET_NAME}'!A1:E1`,
    valueInputOption: 'RAW',
    resource: { values: [HEADER] },
  });
  return res.data.replies[0].addSheet.properties.sheetId;
}

// -> { 'YYYY-MM-DD': { takenAt, members: Map(id -> { name, exp }) } }
async function readSnapshots() {
  const sheets = await getSheetsClient();
  await ensureWeekSheet(sheets);
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: LEVEL_SPREADSHEET_ID, range: `'${LEVEL_WEEK_SHEET_NAME}'!A2:E` });
  const out = {};
  for (const row of res.data.values || []) {
    const key = String(row[0] || '').trim();
    const id = String(row[1] || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !id) continue;
    if (!out[key]) out[key] = { takenAt: String(row[4] || ''), members: new Map() };
    out[key].members.set(id, { name: String(row[2] || ''), exp: Number(row[3]) || 0 });
  }
  return out;
}

// rows: [{ id, name, exp }]. Ghi xong thì xoá các tuần cũ hơn KEEP_WEEKS tuần (lỗi xoá chỉ log, không ảnh hưởng).
async function appendSnapshot(weekKey, rows) {
  if (!rows.length) return;
  const sheets = await getSheetsClient();
  const sheetId = await ensureWeekSheet(sheets);
  const at = vnTimeString();
  await sheets.spreadsheets.values.append({
    spreadsheetId: LEVEL_SPREADSHEET_ID,
    range: `'${LEVEL_WEEK_SHEET_NAME}'!A1`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: { values: rows.map((r) => [weekKey, r.id, r.name, Math.round(r.exp * 100) / 100, at]) },
  });
  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: LEVEL_SPREADSHEET_ID, range: `'${LEVEL_WEEK_SHEET_NAME}'!A2:A` });
    const keys = (res.data.values || []).map((r) => String(r[0] || '').trim());
    const weeks = [...new Set(keys.filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k)))].sort();
    if (weeks.length <= KEEP_WEEKS) return;
    const keepFrom = weeks[weeks.length - KEEP_WEEKS];
    let n = 0; // các dòng tuần cũ nằm liền nhau ở đầu tab (vì ghi theo thời gian)
    while (n < keys.length && keys[n] < keepFrom) n += 1;
    if (!n) return;
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: LEVEL_SPREADSHEET_ID,
      resource: { requests: [{ deleteDimension: { range: { sheetId, dimension: 'ROWS', startIndex: 1, endIndex: 1 + n } } }] },
    });
  } catch (error) {
    console.error('[level] Không dọn được tuần cũ ở tab Mốc Tuần:', error.message);
  }
}

module.exports = { readSnapshots, appendSnapshot };
