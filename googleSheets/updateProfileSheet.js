// Tab "Cập nhật phái" trong Google Sheet nguồn (SRC_IMAGE_SPREADSHEET_ID, cùng spreadsheet với tab "Bang").
// Đây là NƠI LƯU thông tin thành viên tự cập nhật qua nút "Cập Nhật Thông Tin" ở menu Hub (memberInfo/index.js):
//   A = Discord User ID (chuỗi), B = Tên người dùng (username Discord), D = Ingame, E = Hệ Phái (Class),
//   + 1 cột "Cập nhật lúc" (tự tìm theo tiêu đề dòng 1, xem config/memberInfo.js).
// Tab "Bang" lấy Ingame/Class từ tab này bằng VLOOKUP (xem googleSheets/memberSheet.js -> registerGreetedMember),
// còn /ai, mon!ai và AI auto-chat đọc thẳng tab này (getMemberIngameInfo / getAllUpdateProfileMembers).
// Mỗi Discord ID chỉ 1 dòng: cập nhật lại (đổi tên/đổi class) = ghi đè dòng đó + đổi thời gian, không thêm dòng mới.

const { google } = require('./googleClient');
const { getGoogleAuthClient } = require('./auth');
const {
  SRC_IMAGE_SPREADSHEET_ID,
  UPDATE_PROFILE_SHEET_NAME,
  UPDATE_PROFILE_SHEET_COLUMNS,
  MEMBER_INFO_TIME_HEADER_PATTERN,
  MEMBER_INFO_TIME_FALLBACK_COLUMN,
  MEMBER_INFO_TIME_FALLBACK_HEADER,
  MEMBER_INFO_UTC_OFFSET_HOURS,
} = require('../config');

const COLUMN_INDEX = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6, H: 7, I: 8, J: 9 };
const COLUMN_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const READ_RANGE_LAST_COLUMN = 'J';
const READ_RANGE_LAST_ROW = 20000;

// Cache trong bộ nhớ (5 phút) — ghi xong thì xoá cache để lần đọc kế tiếp thấy ngay dữ liệu mới.
const CACHE_TTL_MS = 5 * 60 * 1000;
let cache = null; // { header: [], rows: [] (từ dòng 2), at }

async function getSheetsClient() {
  const auth = await getGoogleAuthClient();
  if (!auth) {
    throw new Error('Chưa cấu hình Google Sheets credentials cho bot.');
  }
  return google.sheets({ version: 'v4', auth });
}

async function fetchSheetValues(sheets) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SRC_IMAGE_SPREADSHEET_ID,
    range: `'${UPDATE_PROFILE_SHEET_NAME}'!A1:${READ_RANGE_LAST_COLUMN}${READ_RANGE_LAST_ROW}`,
  });
  const values = response.data.values || [];
  return { header: values[0] || [], rows: values.slice(1) };
}

async function getCached() {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache;
  const sheets = await getSheetsClient();
  cache = { ...(await fetchSheetValues(sheets)), at: Date.now() };
  return cache;
}

function invalidateUpdateProfileCache() {
  cache = null;
}

function cell(row, columnLetter) {
  const raw = row[COLUMN_INDEX[columnLetter]];
  const value = raw === undefined || raw === null ? '' : String(raw).trim();
  return value || null;
}

const idOf = (row) => String(cell(row, UPDATE_PROFILE_SHEET_COLUMNS.discordId) || '').replace(/\D/g, '');

// Cột thời gian: ưu tiên cột có tiêu đề khớp (không tính A/B/D/E là cột dữ liệu chính), không có thì cột dự phòng.
function findTimeColumnIndex(header) {
  const used = new Set(['discordId', 'username', 'ingame', 'className'].map((k) => COLUMN_INDEX[UPDATE_PROFILE_SHEET_COLUMNS[k]]));
  for (let i = 0; i < header.length; i++) {
    if (used.has(i)) continue;
    if (MEMBER_INFO_TIME_HEADER_PATTERN.test(String(header[i] || ''))) return { index: i, found: true };
  }
  return { index: COLUMN_INDEX[MEMBER_INFO_TIME_FALLBACK_COLUMN], found: false };
}

// discordId: string. Trả về { username, ingame, className, updatedAt } hoặc null nếu chưa có/lỗi đọc sheet.
async function getUpdateProfileInfoByDiscordId(discordId) {
  const targetId = String(discordId || '').replace(/\D/g, '');
  if (!targetId) return null;
  try {
    const { header, rows } = await getCached();
    const matchedRow = rows.find((row) => idOf(row) === targetId);
    if (!matchedRow) return null;
    const time = findTimeColumnIndex(header);
    return {
      username: cell(matchedRow, UPDATE_PROFILE_SHEET_COLUMNS.username),
      ingame: cell(matchedRow, UPDATE_PROFILE_SHEET_COLUMNS.ingame),
      className: cell(matchedRow, UPDATE_PROFILE_SHEET_COLUMNS.className),
      updatedAt: matchedRow[time.index] ? String(matchedRow[time.index]).trim() : null,
    };
  } catch (error) {
    console.error('Không thể tra cứu thông tin thành viên từ tab "Cập nhật phái":', error.message);
    return null;
  }
}

// Toàn bộ thành viên có Ingame trong tab này: [{ discordId, username, ingame, className }] — cho AI auto-chat.
async function getAllUpdateProfileMembers() {
  try {
    const { rows } = await getCached();
    return rows
      .map((row) => ({
        discordId: idOf(row) || null,
        username: cell(row, UPDATE_PROFILE_SHEET_COLUMNS.username),
        ingame: cell(row, UPDATE_PROFILE_SHEET_COLUMNS.ingame),
        className: cell(row, UPDATE_PROFILE_SHEET_COLUMNS.className),
      }))
      .filter((m) => m.discordId && m.ingame);
  } catch (error) {
    console.error('Không thể lấy danh sách thành viên từ tab "Cập nhật phái":', error.message);
    return [];
  }
}

// Dùng cho /ai và mon!ai: ƯU TIÊN tab "Cập nhật phái" (nguồn mới), không có Ingame thì lấy tab "Bang" như cũ.
async function getMemberIngameInfo(discordId) {
  const fresh = await getUpdateProfileInfoByDiscordId(discordId);
  if (fresh && fresh.ingame) return { ingame: fresh.ingame, className: fresh.className, updatedAt: fresh.updatedAt, source: 'cap-nhat-phai' };
  // require trễ để tránh vòng phụ thuộc giữa 2 file sheet.
  const { getMemberInfoByDiscordId } = require('./memberSheet');
  const bang = await getMemberInfoByDiscordId(String(discordId));
  if (bang && bang.ingame) return { ingame: bang.ingame, className: bang.className || (fresh && fresh.className) || null, updatedAt: null, source: 'bang' };
  return null;
}

// ---- Ghi (Hub -> "Cập Nhật Thông Tin") ----

// Ghi nối tiếp từng lượt: 2 người bấm cùng lúc không được chọn trùng "dòng trống kế tiếp".
let writeChain = Promise.resolve();

// Số serial ngày của Google Sheets cho thời điểm `date` theo giờ Việt Nam.
function toSheetSerial(date) {
  return date.getTime() / 86400000 + 25569 + MEMBER_INFO_UTC_OFFSET_HOURS / 24;
}

async function doUpsert({ discordId, username, ingame, className }) {
  const targetId = String(discordId || '').replace(/\D/g, '');
  if (!/^\d{15,25}$/.test(targetId)) throw new Error('discordId không hợp lệ.');

  const sheets = await getSheetsClient();
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SRC_IMAGE_SPREADSHEET_ID,
    fields: 'sheets.properties(sheetId,title,gridProperties)',
  });
  const sheetMeta = (meta.data.sheets || []).find((s) => s.properties.title === UPDATE_PROFILE_SHEET_NAME);
  if (!sheetMeta) throw new Error(`Không tìm thấy tab "${UPDATE_PROFILE_SHEET_NAME}" trong spreadsheet.`);
  const { sheetId, gridProperties } = sheetMeta.properties;

  // Đọc tươi (không dùng cache) để chọn đúng dòng.
  const { header, rows } = await fetchSheetValues(sheets);
  const time = findTimeColumnIndex(header);

  const existingIdx = rows.findIndex((row) => idOf(row) === targetId);
  const isNew = existingIdx === -1;
  let previous = null;
  let rowIndex; // 0-based trong sheet (dòng 1 = header = 0)
  if (!isNew) {
    const row = rows[existingIdx];
    rowIndex = existingIdx + 1;
    previous = {
      ingame: cell(row, UPDATE_PROFILE_SHEET_COLUMNS.ingame),
      className: cell(row, UPDATE_PROFILE_SHEET_COLUMNS.className),
      updatedAt: row[time.index] ? String(row[time.index]).trim() : null,
    };
  } else {
    let lastFilled = -1; // chỉ số trong `rows` của dòng cuối thật sự có Discord ID
    rows.forEach((row, i) => {
      if (idOf(row)) lastFilled = i;
    });
    rowIndex = lastFilled + 2; // +1 vì rows bắt đầu từ dòng 2, +1 để sang dòng kế tiếp
  }

  const requests = [];
  // Mở rộng lưới nếu dòng/cột cần ghi nằm ngoài kích thước hiện có.
  if (gridProperties && rowIndex + 1 > gridProperties.rowCount) {
    requests.push({ appendDimension: { sheetId, dimension: 'ROWS', length: Math.max(100, rowIndex + 1 - gridProperties.rowCount) } });
  }
  if (gridProperties && time.index + 1 > gridProperties.columnCount) {
    requests.push({ appendDimension: { sheetId, dimension: 'COLUMNS', length: time.index + 1 - gridProperties.columnCount } });
  }

  const text = (rIdx, colLetter, value) => ({
    updateCells: {
      start: { sheetId, rowIndex: rIdx, columnIndex: COLUMN_INDEX[colLetter] },
      rows: [{ values: [{ userEnteredValue: { stringValue: String(value) } }] }],
      fields: 'userEnteredValue',
    },
  });

  if (isNew) requests.push(text(rowIndex, UPDATE_PROFILE_SHEET_COLUMNS.discordId, targetId)); // ID dạng chuỗi, không bị làm tròn
  if (username) requests.push(text(rowIndex, UPDATE_PROFILE_SHEET_COLUMNS.username, username));
  requests.push(text(rowIndex, UPDATE_PROFILE_SHEET_COLUMNS.ingame, ingame));
  requests.push(text(rowIndex, UPDATE_PROFILE_SHEET_COLUMNS.className, className));

  const now = new Date();
  requests.push({
    updateCells: {
      start: { sheetId, rowIndex, columnIndex: time.index },
      rows: [{ values: [{ userEnteredValue: { numberValue: toSheetSerial(now) }, userEnteredFormat: { numberFormat: { type: 'DATE_TIME', pattern: 'dd/MM/yyyy HH:mm:ss' } } }] }],
      fields: 'userEnteredValue,userEnteredFormat.numberFormat',
    },
  });
  // Không có cột thời gian nào khớp tiêu đề -> dùng cột dự phòng và ghi tiêu đề nếu ô đang trống.
  if (!time.found && !String(header[time.index] || '').trim()) {
    requests.push({
      updateCells: {
        start: { sheetId, rowIndex: 0, columnIndex: time.index },
        rows: [{ values: [{ userEnteredValue: { stringValue: MEMBER_INFO_TIME_FALLBACK_HEADER } }] }],
        fields: 'userEnteredValue',
      },
    });
  }

  await sheets.spreadsheets.batchUpdate({ spreadsheetId: SRC_IMAGE_SPREADSHEET_ID, resource: { requests } });
  invalidateUpdateProfileCache();

  return {
    rowNumber: rowIndex + 1,
    added: isNew,
    previous,
    updatedAt: now,
    timeColumn: COLUMN_LETTERS[time.index] || String(time.index + 1),
  };
}

// Thêm mới hoặc cập nhật 1 thành viên (theo Discord ID). Ném lỗi nếu ghi thất bại — nơi gọi tự báo người dùng.
function upsertUpdateProfile(data) {
  const run = writeChain.then(() => doUpsert(data));
  writeChain = run.catch(() => {});
  return run;
}

module.exports = {
  getUpdateProfileInfoByDiscordId,
  getAllUpdateProfileMembers,
  getMemberIngameInfo,
  upsertUpdateProfile,
  invalidateUpdateProfileCache,
};
