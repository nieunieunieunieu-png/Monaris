// Đọc/ghi 2 tab Auto DM (BOT_CHAT_HISTORY_SPREADSHEET_ID, cùng spreadsheet
// với "BotChatHistory"/"ChatGlobal" — bot đã có sẵn quyền ghi vào đó nên
// không cần thêm cấu hình credentials gì mới):
//
//   1) "Auto DM" (AUTO_DM_CONTENT_SHEET_NAME) — danh sách MẪU nội dung:
//        A = Id, B = Nội dung
//      Thêm qua /autoDM (mon!autoDM).
//
//   2) "Auto DM Schedule" (AUTO_DM_SCHEDULE_SHEET_NAME) — ai nhận tin, nội
//      dung nào, giờ nào:
//        A = Id, B = UserID Discord, C = ID DM (so với cột A của "Auto DM"
//        để lấy đúng nội dung), D = Thời Gian Gửi ("HH:mm", giờ VN)
//      Thêm qua /setUserDM (mon!setUserDM) — 1 user CÓ THỂ CÓ NHIỀU dòng
//      lịch cùng lúc, tối đa MAX_SCHEDULES_PER_USER dòng (vd 1 lịch 8h nhắc
//      PvE, 1 lịch 19h30 nhắc scrim) — mỗi lần gọi /setUserDM là THÊM 1 dòng
//      MỚI (Id mới, xem addAutoDmSchedule bên dưới), KHÔNG ghi đè lịch cũ
//      của user đó nữa. Muốn xoá đúng 1 lịch thì dùng /removeUserDM kèm Id
//      của dòng đó; không truyền Id thì xoá TOÀN BỘ lịch của user đó (xem
//      removeAutoDmSchedule bên dưới, nhận scheduleId tùy chọn).
//
// Cơ chế gửi thật sự nằm ở autoDm/scheduler.js (check mỗi phút, giống
// reminders/scheduler.js) — file này chỉ lo đọc/ghi sheet + đồng bộ bộ nhớ
// (state.autoDmContents / state.autoDmSchedules).

const { google } = require('./googleClient');
const { getGoogleAuthClient } = require('./auth');
const { autoDmContents, autoDmSchedules } = require('../state');
const {
  BOT_CHAT_HISTORY_SPREADSHEET_ID,
  AUTO_DM_CONTENT_SHEET_NAME,
  AUTO_DM_SCHEDULE_SHEET_NAME,
} = require('../config');
const { parseScrimTime } = require('../utils/time');

const CONTENT_HEADER_ROW = ['Id', 'Nội dung'];
const CONTENT_DATA_RANGE = `'${AUTO_DM_CONTENT_SHEET_NAME}'!A2:B`;

const SCHEDULE_HEADER_ROW = ['Id', 'UserID Discord', 'ID DM', 'Thời Gian Gửi'];
const SCHEDULE_DATA_RANGE = `'${AUTO_DM_SCHEDULE_SHEET_NAME}'!A2:D`;

async function getSheetsClient() {
  const authClient = await getGoogleAuthClient();
  if (!authClient) {
    throw new Error('Chưa cấu hình Google Sheets credentials cho bot.');
  }
  return google.sheets({ version: 'v4', auth: authClient });
}

// Tạo 1 tab (tabName) + dòng header (headerRow) nếu CHƯA có — không đụng gì
// nếu tab/header đã tồn tại. Dùng chung cho cả 2 tab Auto DM.
async function ensureSheetTabWithHeader(sheets, tabName, headerRow) {
  const response = await sheets.spreadsheets.get({ spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID });
  const existingSheets = response.data.sheets || [];
  const exists = existingSheets.some((sheet) => sheet.properties.title === tabName);

  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      resource: { requests: [{ addSheet: { properties: { title: tabName } } }] },
    });
  }

  const lastCol = String.fromCharCode('A'.charCodeAt(0) + headerRow.length - 1);
  const existingValues = await sheets.spreadsheets.values
    .get({ spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID, range: `'${tabName}'!A1:${lastCol}1` })
    .catch(() => ({ data: {} }));

  const rows = (existingValues.data && existingValues.data.values) || [];
  if (rows.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      range: `'${tabName}'!A1:${lastCol}1`,
      valueInputOption: 'RAW',
      resource: { values: [headerRow] },
    });
  }
}

async function ensureAutoDmSheetsExistWithClient(sheets) {
  await ensureSheetTabWithHeader(sheets, AUTO_DM_CONTENT_SHEET_NAME, CONTENT_HEADER_ROW);
  await ensureSheetTabWithHeader(sheets, AUTO_DM_SCHEDULE_SHEET_NAME, SCHEDULE_HEADER_ROW);
}

// Bản public — nhận thẳng authClient, gọi 1 lần lúc ClientReady (giống
// pattern ensureXSheetExists khác trong index.js).
async function ensureAutoDmSheetsExist(authClient) {
  if (!authClient) return;
  const sheets = google.sheets({ version: 'v4', auth: authClient });
  await ensureAutoDmSheetsExistWithClient(sheets);
}

// Nạp toàn bộ MẪU nội dung từ tab "Auto DM" vào bộ nhớ (state.autoDmContents
// — mutate trực tiếp, KHÔNG tạo mảng mới). Gọi 1 lần lúc ClientReady, TRƯỚC
// khi autoDm/scheduler.js chạy lần đầu. Best-effort: lỗi thì log lại, bot vẫn
// khởi động bình thường.
async function loadAutoDmContents() {
  try {
    const sheets = await getSheetsClient();
    await ensureAutoDmSheetsExistWithClient(sheets);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      range: CONTENT_DATA_RANGE,
    });
    const rows = response.data.values || [];

    autoDmContents.length = 0;
    for (const row of rows) {
      const id = row[0];
      const content = row[1];
      if (!id || !content) continue;
      autoDmContents.push({ id: String(id), content });
    }

    console.log(`Đã nạp ${autoDmContents.length} mẫu nội dung từ tab "${AUTO_DM_CONTENT_SHEET_NAME}".`);
  } catch (error) {
    console.error('Không thể nạp mẫu nội dung Auto DM từ Google Sheets:', error.message);
  }

  return autoDmContents;
}

// Nạp toàn bộ lịch Auto DM từ tab "Auto DM Schedule" vào bộ nhớ
// (state.autoDmSchedules). lastSentDateKey LUÔN reset về null khi nạp lại
// (kể cả lúc restart) — sheet không lưu cột này, xem giải thích ở state.js.
async function loadAutoDmSchedules() {
  try {
    const sheets = await getSheetsClient();
    await ensureAutoDmSheetsExistWithClient(sheets);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      range: SCHEDULE_DATA_RANGE,
    });
    const rows = response.data.values || [];

    autoDmSchedules.length = 0;
    for (const row of rows) {
      const id = row[0];
      const userId = row[1];
      const dmId = row[2];
      const time = row[3];
      if (!id || !userId || !dmId || !time) continue;
      autoDmSchedules.push({
        id: String(id),
        userId: String(userId),
        dmId: String(dmId),
        time: String(time).trim(),
        lastSentDateKey: null,
      });
    }

    console.log(`Đã nạp ${autoDmSchedules.length} lịch Auto DM từ tab "${AUTO_DM_SCHEDULE_SHEET_NAME}".`);
  } catch (error) {
    console.error('Không thể nạp lịch Auto DM từ Google Sheets:', error.message);
  }

  return autoDmSchedules;
}

// Thêm 1 mẫu nội dung mới vào CUỐI tab "Auto DM", Id tự tăng (= Id lớn nhất
// hiện có + 1, bắt đầu từ 1 nếu tab đang trống). Đọc TRỰC TIẾP (không dùng
// cache) để tính đúng Id kế tiếp ngay tại thời điểm ghi. Dùng cho /autoDM
// (mon!autoDM).
async function addAutoDmContent(content) {
  const trimmed = (content || '').trim();
  if (!trimmed) {
    throw new Error('Nội dung tin không được để trống.');
  }

  const sheets = await getSheetsClient();
  await ensureAutoDmSheetsExistWithClient(sheets);

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
    range: CONTENT_DATA_RANGE,
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
    range: `'${AUTO_DM_CONTENT_SHEET_NAME}'!A:B`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: { values: [[newId, trimmed]] },
  });

  autoDmContents.push({ id: newId, content: trimmed });

  return { id: newId, content: trimmed };
}

// Tra 1 mẫu nội dung theo Id, CHỈ từ bộ nhớ (không gọi Sheets API).
function getAutoDmContentById(id) {
  const targetId = String(id).trim();
  return autoDmContents.find((item) => item.id === targetId) || null;
}

// Mỗi user tối đa bao nhiêu lịch Auto DM cùng lúc (vd 1 lịch 8h nhắc PvE, 1
// lịch 19h30 nhắc scrim, ...). Đụng giới hạn thì addAutoDmSchedule() throw
// lỗi, phải /removeUserDM bớt lịch cũ trước khi thêm lịch mới.
const MAX_SCHEDULES_PER_USER = 5;

// Thêm 1 dòng lịch Auto DM MỚI cho 1 user — dùng cho /setUserDM
// (mon!setUserDM). Validate: dmId phải tồn tại trong "Auto DM"
// (autoDmContents, đọc từ bộ nhớ), time phải parse được qua parseScrimTime
// (utils/time.js — chấp nhận "19:00"/"19h00"/"19h"), và user đó CHƯA đạt
// MAX_SCHEDULES_PER_USER dòng lịch hiện có. Mỗi lần gọi LUÔN thêm 1 dòng mới
// (Id mới) — KHÔNG ghi đè lịch cũ của user đó nữa, nên 1 user có thể nhận
// nhiều Auto DM khác giờ/nội dung khác nhau cùng lúc.
async function addAutoDmSchedule(userId, dmId, time) {
  const targetUserId = String(userId).trim();
  const targetDmId = String(dmId).trim();
  const trimmedTime = String(time || '').trim();

  if (!targetUserId || !targetDmId || !trimmedTime) {
    throw new Error('Thiếu userId, ID DM, hoặc giờ gửi.');
  }

  const parsedTime = parseScrimTime(trimmedTime);
  if (!parsedTime) {
    throw new Error(`Giờ gửi "${trimmedTime}" không hợp lệ — dùng định dạng "HH:mm" (vd "19:30").`);
  }
  const normalizedTime = `${String(parsedTime.hour).padStart(2, '0')}:${String(parsedTime.minute).padStart(2, '0')}`;

  const content = getAutoDmContentById(targetDmId);
  if (!content) {
    throw new Error(`Không tìm thấy mẫu nội dung có ID DM \`${targetDmId}\` trong "Auto DM" — dùng /autoDM để thêm trước.`);
  }

  const sheets = await getSheetsClient();
  await ensureAutoDmSheetsExistWithClient(sheets);

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
    range: SCHEDULE_DATA_RANGE,
  });
  const rows = response.data.values || [];

  const existingRowsForUser = rows.filter((row) => String(row[1]) === targetUserId);
  if (existingRowsForUser.length >= MAX_SCHEDULES_PER_USER) {
    throw new Error(
      `<@${targetUserId}> đã có đủ ${MAX_SCHEDULES_PER_USER} lịch Auto DM (giới hạn tối đa) — dùng /removeUserDM bớt lịch cũ trước khi thêm lịch mới.`
    );
  }

  let maxId = 0;
  for (const row of rows) {
    const idNum = parseInt(row[0], 10);
    if (!Number.isNaN(idNum) && idNum > maxId) maxId = idNum;
  }
  const newId = String(maxId + 1);

  await sheets.spreadsheets.values.append({
    spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
    range: `'${AUTO_DM_SCHEDULE_SHEET_NAME}'!A:D`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: { values: [[newId, targetUserId, targetDmId, normalizedTime]] },
  });

  autoDmSchedules.push({ id: newId, userId: targetUserId, dmId: targetDmId, time: normalizedTime, lastSentDateKey: null });

  return {
    id: newId,
    userId: targetUserId,
    dmId: targetDmId,
    time: normalizedTime,
    countForUser: existingRowsForUser.length + 1,
    maxSchedules: MAX_SCHEDULES_PER_USER,
  };
}

// Xoá lịch Auto DM của 1 user. Dùng cho /removeUserDM (mon!removeUserDM).
//   - Có truyền scheduleId: chỉ xoá ĐÚNG 1 dòng có Id đó (và phải đúng của
//     user này), các lịch khác của user đó giữ nguyên.
//   - Không truyền scheduleId (null/undefined): xoá TOÀN BỘ lịch của user đó
//     (hành vi cũ, giữ lại để không phải gõ từng Id nếu muốn tắt hết).
// Trả về { removedCount, removedIds }.
async function removeAutoDmSchedule(userId, scheduleId = null) {
  const targetUserId = String(userId).trim();
  const targetScheduleId = scheduleId === null || scheduleId === undefined ? null : String(scheduleId).trim();

  const sheets = await getSheetsClient();
  await ensureAutoDmSheetsExistWithClient(sheets);

  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID });
  const sheetMeta = (spreadsheet.data.sheets || []).find(
    (sheet) => sheet.properties.title === AUTO_DM_SCHEDULE_SHEET_NAME
  );
  if (!sheetMeta) return { removedCount: 0, removedIds: [] };
  const sheetId = sheetMeta.properties.sheetId;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
    range: SCHEDULE_DATA_RANGE,
  });
  const rows = response.data.values || [];

  const matchingRowIndexes = [];
  const matchingIds = [];
  rows.forEach((row, index) => {
    if (String(row[1]) !== targetUserId) return;
    if (targetScheduleId !== null && String(row[0]) !== targetScheduleId) return;
    matchingRowIndexes.push(index);
    matchingIds.push(String(row[0]));
  });

  if (matchingRowIndexes.length === 0) {
    // Không tìm thấy trên sheet — vẫn dọn bộ nhớ cho khớp, phòng trường hợp
    // sheet đã bị sửa tay từ trước mà bộ nhớ chưa kịp đồng bộ lại.
    if (targetScheduleId !== null) {
      const memIndex = autoDmSchedules.findIndex((s) => s.userId === targetUserId && s.id === targetScheduleId);
      if (memIndex !== -1) autoDmSchedules.splice(memIndex, 1);
    } else {
      for (let i = autoDmSchedules.length - 1; i >= 0; i -= 1) {
        if (autoDmSchedules[i].userId === targetUserId) autoDmSchedules.splice(i, 1);
      }
    }
    return { removedCount: 0, removedIds: [] };
  }

  // Xoá từ DƯỚI lên (index giảm dần) trong CÙNG 1 batchUpdate — deleteDimension
  // áp dụng tuần tự theo thứ tự request, xoá dòng dưới trước thì index của
  // các dòng trên (chưa xoá) không bị lệch.
  const sortedDescending = [...matchingRowIndexes].sort((a, b) => b - a);
  const requests = sortedDescending.map((rowIndex) => {
    const sheetRowNumber = rowIndex + 2; // +2: bù header + mảng 0-based từ A2
    return {
      deleteDimension: {
        range: { sheetId, dimension: 'ROWS', startIndex: sheetRowNumber - 1, endIndex: sheetRowNumber },
      },
    };
  });

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
    resource: { requests },
  });

  for (const id of matchingIds) {
    const memIndex = autoDmSchedules.findIndex((s) => s.userId === targetUserId && s.id === id);
    if (memIndex !== -1) autoDmSchedules.splice(memIndex, 1);
  }

  return { removedCount: matchingIds.length, removedIds: matchingIds };
}

// Giới hạn 1900 ký tự/đoạn (Discord chặn tin nhắn text > 2000 ký tự) — dùng
// cho /viewAutoDm và mon!viewAutoDm.
const VIEW_CHUNK_MAX_LEN = 1900;

function formatOneScheduleLine(schedule) {
  const content = getAutoDmContentById(schedule.dmId);
  const preview = content
    ? (content.content.length > 150 ? `${content.content.slice(0, 150)}…` : content.content)
    : '⚠️ (không tìm thấy nội dung — ID DM có thể đã bị xoá khỏi "Auto DM")';
  return `**#${schedule.id}** — <@${schedule.userId}> lúc **${schedule.time}** mỗi ngày (ID DM: \`${schedule.dmId}\`)\n> ${preview}`;
}

function chunkScheduleLines(lines) {
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

// Nạp lại TOÀN BỘ lịch từ sheet (như lúc ClientReady) rồi trả về danh sách
// text đã chia đoạn để gửi Discord — dùng cho /viewAutoDm và mon!viewAutoDm.
// Gọi loadAutoDmSchedules() + loadAutoDmContents() ở đây có tác dụng phụ hữu
// ích: tự đồng bộ lại bộ nhớ với sheet (giống buildNoticeBoardListChunks).
async function buildAutoDmScheduleListChunks() {
  await loadAutoDmContents();
  await loadAutoDmSchedules();

  if (!autoDmSchedules.length) {
    return ['📋 Hiện chưa có lịch Auto DM nào đang chạy.'];
  }

  const sorted = [...autoDmSchedules].sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10));
  const lines = sorted.map(formatOneScheduleLine);
  const header = `📋 Lịch Auto DM đang chạy — ${sorted.length} người (đã đồng bộ lại từ sheet):\n`;

  const bodyChunks = chunkScheduleLines(lines);
  bodyChunks[0] = header + bodyChunks[0];
  return bodyChunks;
}

module.exports = {
  ensureAutoDmSheetsExist,
  loadAutoDmContents,
  loadAutoDmSchedules,
  addAutoDmContent,
  getAutoDmContentById,
  addAutoDmSchedule,
  removeAutoDmSchedule,
  buildAutoDmScheduleListChunks,
  MAX_SCHEDULES_PER_USER,
};