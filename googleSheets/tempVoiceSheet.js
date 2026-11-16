// Lưu dữ liệu cho tính năng "phòng voice tạm" (tempVoice/index.js) vào spreadsheet
// "Monaris Auto Bot" (BOT_CHAT_HISTORY_SPREADSHEET_ID). Bot TỰ TẠO 3 tab nếu chưa có:
//
//  Tab "Voice Nickname"  (lịch sử tên phòng — mỗi người 1 dòng)
//    A: Discord ID   B: Tên Discord   C: Tên phòng đã lưu   D: Dùng lần cuối
//    -> C rỗng = chưa từng đổi tên, lần sau phòng đặt theo tên Discord hiện tại.
//    -> C có giá trị (người đó đã bấm "Đổi tên") = lần sau tạo phòng dùng đúng tên này.
//
//  Tab "Voice Tạm Đang Mở"  (phòng đang tồn tại)
//    A: Channel ID   B: Owner ID
//    -> để sau khi bot restart vẫn biết ai là chủ phòng nào (menu vẫn bấm được, phòng trống vẫn được dọn).
//
//  Tab "Phòng Đôi Thống Kê"  (mỗi cặp 1 dòng — dùng cho mon!topdoi)
//    A: Người A   B: Người B (ID đã sắp xếp)   C: Tổng phút ngồi chung trong Phòng Đôi   D: Lần cuối
//
// Toàn bộ dữ liệu được mirror trong RAM (nạp 1 lần, lười — lần đầu có ai cần), nên mỗi lần
// tạo phòng KHÔNG phải đọc Sheets; mọi lượt ghi đi qua 1 hàng đợi tuần tự để không ghi chồng.

const { google } = require('./googleClient');
const { getGoogleAuthClient } = require('./auth');
const {
  BOT_CHAT_HISTORY_SPREADSHEET_ID,
  TEMP_VOICE_NAMES_SHEET_NAME,
  TEMP_VOICE_ACTIVE_SHEET_NAME,
  TEMP_VOICE_LOVE_STATS_SHEET_NAME,
} = require('../config');

const NAMES_HEADER = ['Discord ID', 'Tên Discord', 'Tên phòng đã lưu', 'Dùng lần cuối'];
const ACTIVE_HEADER = ['Channel ID', 'Owner ID'];
const LOVE_STATS_HEADER = ['Người A', 'Người B', 'Tổng phút ngồi chung', 'Lần cuối'];

// userId -> { row, discordName, roomName, lastUsed }   (row = số dòng thật trên sheet, >= 2)
const nameCache = new Map();
let nextNameRow = 2;
// channelId -> ownerId
const activeRooms = new Map();
// "idA|idB" (đã sắp xếp) -> { a, b, minutes, last } — thống kê Phòng Đôi, ghi lên sheet theo lô (flushLoveStats)
const loveStats = new Map();
let loveStatsDirty = false;

let loadPromise = null;
let writeChain = Promise.resolve();

function q(name) {
  return `'${name}'`;
}

// Xếp lượt ghi vào hàng đợi — lỗi của lượt này không làm gãy các lượt sau.
function enqueue(fn) {
  const run = writeChain.then(fn);
  writeChain = run.catch(() => {});
  return run;
}

function nowVN() {
  return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).slice(0, 16); // YYYY-MM-DD HH:mm
}

async function getSheetsClient() {
  const authClient = await getGoogleAuthClient();
  if (!authClient) throw new Error('Chưa cấu hình Google Sheets credentials cho bot.');
  return google.sheets({ version: 'v4', auth: authClient });
}

async function ensureTab(sheets, existingTitles, title, header, lastCol) {
  if (!existingTitles.has(title)) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      resource: { requests: [{ addSheet: { properties: { title } } }] },
    });
  }
  const head = await sheets.spreadsheets.values
    .get({ spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID, range: `${q(title)}!A1:${lastCol}1` })
    .catch(() => ({ data: {} }));
  if (!((head.data && head.data.values) || []).length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      range: `${q(title)}!A1:${lastCol}1`,
      valueInputOption: 'RAW',
      resource: { values: [header] },
    });
  }
}

async function doLoad() {
  if (!BOT_CHAT_HISTORY_SPREADSHEET_ID) return;
  const sheets = await getSheetsClient();
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
    fields: 'sheets.properties.title',
  });
  const titles = new Set((meta.data.sheets || []).map((s) => s.properties.title));
  await ensureTab(sheets, titles, TEMP_VOICE_NAMES_SHEET_NAME, NAMES_HEADER, 'D');
  await ensureTab(sheets, titles, TEMP_VOICE_ACTIVE_SHEET_NAME, ACTIVE_HEADER, 'B');
  await ensureTab(sheets, titles, TEMP_VOICE_LOVE_STATS_SHEET_NAME, LOVE_STATS_HEADER, 'D');

  const [namesRes, activeRes] = await Promise.all([
    sheets.spreadsheets.values.get({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      range: `${q(TEMP_VOICE_NAMES_SHEET_NAME)}!A2:D`,
    }),
    sheets.spreadsheets.values.get({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      range: `${q(TEMP_VOICE_ACTIVE_SHEET_NAME)}!A2:B`,
    }),
  ]);

  nameCache.clear();
  const nameRows = namesRes.data.values || [];
  nameRows.forEach((r, i) => {
    const id = String(r[0] || '').trim();
    if (!id) return;
    nameCache.set(id, {
      row: i + 2,
      discordName: String(r[1] || ''),
      roomName: String(r[2] || ''),
      lastUsed: String(r[3] || ''),
    });
  });
  nextNameRow = nameRows.length + 2;

  activeRooms.clear();
  for (const r of activeRes.data.values || []) {
    const ch = String(r[0] || '').trim();
    const owner = String(r[1] || '').trim();
    if (ch && owner) activeRooms.set(ch, owner);
  }

  const statsRes = await sheets.spreadsheets.values.get({
    spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
    range: `${q(TEMP_VOICE_LOVE_STATS_SHEET_NAME)}!A2:D`,
  });
  loveStats.clear();
  for (const r of statsRes.data.values || []) {
    const a = String(r[0] || '').trim();
    const b = String(r[1] || '').trim();
    const minutes = Math.floor(Number(r[2]) || 0);
    if (a && b && minutes > 0) loveStats.set(`${a}|${b}`, { a, b, minutes, last: String(r[3] || '') });
  }
  loveStatsDirty = false;
}

// Nạp dữ liệu (tạo tab nếu thiếu). Gọi nhiều lần an toàn — chỉ chạy thật 1 lần; nếu lỗi thì lần gọi sau thử lại.
function ensureTempVoiceSheets() {
  if (!loadPromise) {
    loadPromise = doLoad().catch((error) => {
      loadPromise = null;
      throw error;
    });
  }
  return loadPromise;
}

function getSavedRoomName(userId) {
  const entry = nameCache.get(String(userId));
  return entry && entry.roomName ? entry.roomName : '';
}

// Ghi nhận 1 người vừa dùng phòng. roomName === undefined -> giữ nguyên tên phòng đã lưu.
function saveUserVoiceInfo(userId, discordName, roomName) {
  userId = String(userId);
  const old = nameCache.get(userId);
  const entry = {
    row: old ? old.row : nextNameRow++,
    discordName: String(discordName || ''),
    roomName: roomName === undefined ? (old ? old.roomName : '') : String(roomName),
    lastUsed: nowVN(),
  };
  nameCache.set(userId, entry);
  const values = [[userId, entry.discordName, entry.roomName, entry.lastUsed]];
  // Discord ID để dạng chuỗi (USER_ENTERED sẽ biến số dài thành 1.56E+18 nên dùng RAW).
  return enqueue(async () => {
    const sheets = await getSheetsClient();
    await sheets.spreadsheets.values.update({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      range: `${q(TEMP_VOICE_NAMES_SHEET_NAME)}!A${entry.row}:D${entry.row}`,
      valueInputOption: 'RAW',
      resource: { values },
    });
  });
}

function getActiveRooms() {
  return activeRooms;
}

function getRoomOwner(channelId) {
  return activeRooms.get(String(channelId)) || null;
}

function persistActiveRooms() {
  const rows = [...activeRooms].map(([ch, owner]) => [ch, owner]);
  return enqueue(async () => {
    const sheets = await getSheetsClient();
    await sheets.spreadsheets.values.clear({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      range: `${q(TEMP_VOICE_ACTIVE_SHEET_NAME)}!A2:B`,
    });
    if (!rows.length) return;
    await sheets.spreadsheets.values.update({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      range: `${q(TEMP_VOICE_ACTIVE_SHEET_NAME)}!A2:B${rows.length + 1}`,
      valueInputOption: 'RAW',
      resource: { values: rows },
    });
  });
}

function setActiveRoom(channelId, ownerId) {
  activeRooms.set(String(channelId), String(ownerId));
  return persistActiveRooms();
}

function removeActiveRoom(channelId) {
  if (!activeRooms.delete(String(channelId))) return Promise.resolve();
  return persistActiveRooms();
}

// ---- Thống kê Phòng Đôi: cộng phút trong RAM, ghi lên sheet theo lô để khỏi vượt quota Google Sheets.
function addLovePairMinutes(idA, idB, minutes = 1) {
  const [a, b] = [String(idA), String(idB)].sort();
  const key = `${a}|${b}`;
  const entry = loveStats.get(key) || { a, b, minutes: 0, last: '' };
  entry.minutes += minutes;
  entry.last = nowVN();
  loveStats.set(key, entry);
  loveStatsDirty = true;
}

function getLoveStats() {
  return loveStats;
}

function flushLoveStats() {
  if (!loveStatsDirty || !BOT_CHAT_HISTORY_SPREADSHEET_ID) return Promise.resolve();
  loveStatsDirty = false;
  const rows = [...loveStats.values()].sort((x, y) => y.minutes - x.minutes).map((e) => [e.a, e.b, e.minutes, e.last]);
  return enqueue(async () => {
    const sheets = await getSheetsClient();
    await sheets.spreadsheets.values.clear({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      range: `${q(TEMP_VOICE_LOVE_STATS_SHEET_NAME)}!A2:D`,
    });
    if (!rows.length) return;
    await sheets.spreadsheets.values.update({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      range: `${q(TEMP_VOICE_LOVE_STATS_SHEET_NAME)}!A2:D${rows.length + 1}`,
      valueInputOption: 'RAW',
      resource: { values: rows },
    });
  }).catch((error) => {
    loveStatsDirty = true; // lần flush sau thử lại
    throw error;
  });
}

module.exports = {
  addLovePairMinutes,
  getLoveStats,
  flushLoveStats,
  ensureTempVoiceSheets,
  getSavedRoomName,
  saveUserVoiceInfo,
  getActiveRooms,
  getRoomOwner,
  setActiveRoom,
  removeActiveRoom,
};
