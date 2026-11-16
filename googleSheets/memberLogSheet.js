// ===== googleSheets/memberLogSheet.js — tab "Nhật Ký Tin Nhắn" (MEMBER_LOG_SPREADSHEET_ID) =====
// Lưu BỀN VỮNG mọi tin người thật gửi / sửa / xoá (activityLog/memberLog.js) để:
//   - bot restart vẫn lấy lại được nguyên văn tin bị xoá/sửa (nạp lại bản chụp từ đây lúc khởi động),
//   - tra cứu bằng /logtim hoặc mở thẳng sheet.
// Chỉ GHI NỐI TIẾP (append) — mỗi sự kiện 1 dòng, theo thứ tự thời gian. Cột:
//   A Thời gian (giờ VN, YYYY-MM-DD HH:mm:ss) | B Loại (GỬI / SỬA / XOÁ) | C ID người | D Tên | E ID kênh | F Tên kênh |
//   G Nội dung TRƯỚC (chỉ dòng SỬA) | H Nội dung (GỬI: nội dung · SỬA: nội dung mới · XOÁ: nội dung bị xoá) | I File đính kèm (mỗi file 1 dòng) |
//   J Người xoá (chỉ dòng XOÁ) | K ID tin | L Link tin
// Dòng cũ hơn MEMBER_LOG_SHEET_KEEP_DAYS ngày được bot tự xoá (prune). Ghi RAW nên nội dung bắt đầu bằng "=" không thành công thức.
const { google } = require('./googleClient');
const { getGoogleAuthClient } = require('./auth');
const { MEMBER_LOG_SPREADSHEET_ID, MEMBER_LOG_SHEET_NAME } = require('../config');

const HEADER = ['Thời gian', 'Loại', 'ID người', 'Tên', 'ID kênh', 'Tên kênh', 'Nội dung trước', 'Nội dung', 'File đính kèm', 'Người xoá', 'ID tin', 'Link'];
const LAST_COL = 'L';
const CELL_MAX = 2000;

async function getSheetsClient() {
  const auth = await getGoogleAuthClient();
  if (!auth) throw new Error('Chưa cấu hình Google Sheets credentials cho bot.');
  return google.sheets({ version: 'v4', auth });
}

function vnTimeString(ms = Date.now()) {
  const d = new Date(ms + 7 * 60 * 60 * 1000);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
}

function parseVnTime(text) {
  const t = Date.parse(`${String(text || '').trim().replace(' ', 'T')}+07:00`);
  return Number.isFinite(t) ? t : 0;
}

const cell = (v) => String(v === undefined || v === null ? '' : v).slice(0, CELL_MAX);

// Tạo tab + header nếu chưa có. Trả về sheetId (cần cho prune).
async function ensureMemberLogSheet() {
  const sheets = await getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: MEMBER_LOG_SPREADSHEET_ID });
  let tab = (meta.data.sheets || []).find((s) => s.properties.title === MEMBER_LOG_SHEET_NAME);
  if (!tab) {
    const res = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: MEMBER_LOG_SPREADSHEET_ID,
      resource: { requests: [{ addSheet: { properties: { title: MEMBER_LOG_SHEET_NAME, gridProperties: { frozenRowCount: 1 } } } }] },
    });
    tab = { properties: res.data.replies[0].addSheet.properties };
  }
  const head = await sheets.spreadsheets.values
    .get({ spreadsheetId: MEMBER_LOG_SPREADSHEET_ID, range: `'${MEMBER_LOG_SHEET_NAME}'!A1:${LAST_COL}1` })
    .catch(() => ({ data: {} }));
  if (!((head.data && head.data.values && head.data.values[0]) || []).length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: MEMBER_LOG_SPREADSHEET_ID,
      range: `'${MEMBER_LOG_SHEET_NAME}'!A1:${LAST_COL}1`,
      valueInputOption: 'RAW',
      resource: { values: [HEADER] },
    });
  }
  return tab.properties.sheetId;
}

// event: { at, type, userId, userName, channelId, channelName, before, content, files[], deletedBy, messageId, link }
function toRow(e) {
  return [
    vnTimeString(e.at || Date.now()),
    e.type,
    cell(e.userId),
    cell(e.userName),
    cell(e.channelId),
    cell(e.channelName),
    cell(e.before),
    cell(e.content),
    cell((e.files || []).join('\n')),
    cell(e.deletedBy),
    cell(e.messageId),
    cell(e.link),
  ];
}

async function appendEvents(events) {
  if (!events.length) return;
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: MEMBER_LOG_SPREADSHEET_ID,
    range: `'${MEMBER_LOG_SHEET_NAME}'!A1`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: { values: events.map(toRow) },
  });
}

function fromRow(row) {
  const r = (i) => String((row && row[i]) || '');
  return {
    at: parseVnTime(r(0)),
    time: r(0),
    type: r(1),
    userId: r(2),
    userName: r(3),
    channelId: r(4),
    channelName: r(5),
    before: r(6),
    content: r(7),
    files: r(8) ? r(8).split('\n').filter(Boolean) : [],
    deletedBy: r(9),
    messageId: r(10),
    link: r(11),
  };
}

// Đọc toàn bộ tab (đã bỏ header) -> mảng sự kiện theo thứ tự thời gian.
async function readAllEvents() {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: MEMBER_LOG_SPREADSHEET_ID,
    range: `'${MEMBER_LOG_SHEET_NAME}'!A2:${LAST_COL}`,
  });
  return (res.data.values || []).map(fromRow).filter((e) => e.type);
}

// Xoá các dòng cũ hơn keepDays ngày (dòng sắp theo thời gian nên chỉ cần xoá 1 khoảng liên tục ở đầu). Trả về số dòng đã xoá.
async function pruneOld(sheetId, keepDays) {
  if (!keepDays || sheetId === undefined) return 0;
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: MEMBER_LOG_SPREADSHEET_ID,
    range: `'${MEMBER_LOG_SHEET_NAME}'!A2:A`,
  });
  const times = (res.data.values || []).map((r) => parseVnTime(r[0]));
  const cutoff = Date.now() - keepDays * 24 * 60 * 60 * 1000;
  let count = 0;
  while (count < times.length && times[count] && times[count] < cutoff) count += 1;
  if (!count) return 0;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: MEMBER_LOG_SPREADSHEET_ID,
    resource: { requests: [{ deleteDimension: { range: { sheetId, dimension: 'ROWS', startIndex: 1, endIndex: 1 + count } } }] },
  });
  return count;
}

module.exports = { ensureMemberLogSheet, appendEvents, readAllEvents, pruneOld, vnTimeString, parseVnTime };
