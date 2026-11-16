// ===== googleSheets/levelMonthSheet.js — tab "Mốc Tháng" của spreadsheet Level (LEVEL_SPREADSHEET_ID) =====
// Ảnh chụp tổng EXP / số tin / phút voice / chuỗi của MỌI thành viên vào đầu mỗi tháng (giờ VN) — bot tự ghi (level/monthly.js),
// đừng sửa tay. Báo cáo tháng = chênh lệch giữa 2 ảnh chụp liên tiếp. Cột:
//   A Tháng (YYYY-MM = tháng BẮT ĐẦU từ ảnh chụp này) | B Discord ID | C Tên | D EXP | E Tin Nhắn | F Voice (phút) | G Chuỗi Ngày | H Chụp Lúc (giờ VN)
const { google } = require('./googleClient');
const { getGoogleAuthClient } = require('./auth');
const { LEVEL_SPREADSHEET_ID, LEVEL_MONTH_SHEET_NAME } = require('../config');

const HEADER = ['Tháng', 'Discord ID', 'Tên', 'EXP', 'Tin Nhắn', 'Voice (phút)', 'Chuỗi Ngày', 'Chụp Lúc'];

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

async function ensureMonthSheet(sheets) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: LEVEL_SPREADSHEET_ID });
  if (!(meta.data.sheets || []).some((s) => s.properties.title === LEVEL_MONTH_SHEET_NAME)) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: LEVEL_SPREADSHEET_ID,
      resource: { requests: [{ addSheet: { properties: { title: LEVEL_MONTH_SHEET_NAME, gridProperties: { frozenRowCount: 1 } } } }] },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: LEVEL_SPREADSHEET_ID,
      range: `'${LEVEL_MONTH_SHEET_NAME}'!A1:H1`,
      valueInputOption: 'RAW',
      resource: { values: [HEADER] },
    });
  }
}

// -> { 'YYYY-MM': { takenAt, members: Map(id -> { name, exp, msgs, voice, streak }) } }
async function readSnapshots() {
  const sheets = await getSheetsClient();
  await ensureMonthSheet(sheets);
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: LEVEL_SPREADSHEET_ID, range: `'${LEVEL_MONTH_SHEET_NAME}'!A2:H` });
  const out = {};
  for (const row of res.data.values || []) {
    const key = String(row[0] || '').trim();
    const id = String(row[1] || '').trim();
    if (!/^\d{4}-\d{2}$/.test(key) || !id) continue;
    if (!out[key]) out[key] = { takenAt: String(row[7] || ''), members: new Map() };
    out[key].members.set(id, {
      name: String(row[2] || ''),
      exp: Number(row[3]) || 0,
      msgs: Number(row[4]) || 0,
      voice: Number(row[5]) || 0,
      streak: Number(row[6]) || 0,
    });
  }
  return out;
}

// rows: [{ id, name, exp, msgs, voice, streak }]
async function appendSnapshot(monthKey, rows) {
  if (!rows.length) return;
  const sheets = await getSheetsClient();
  await ensureMonthSheet(sheets);
  const at = vnTimeString();
  await sheets.spreadsheets.values.append({
    spreadsheetId: LEVEL_SPREADSHEET_ID,
    range: `'${LEVEL_MONTH_SHEET_NAME}'!A1`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: { values: rows.map((r) => [monthKey, r.id, r.name, Math.round(r.exp * 100) / 100, r.msgs, r.voice, r.streak, at]) },
  });
}

module.exports = { readSnapshots, appendSnapshot };
