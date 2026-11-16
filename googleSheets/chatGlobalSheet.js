// Đọc/ghi tab "ChatGlobal" — profile Ingame/Class/Biệt Danh KHÔNG giới hạn
// theo 1 server cụ thể (khác tab "Bang" ở memberSheet.js, chỉ dành cho
// thành viên server chính). Nằm CÙNG spreadsheet với "BotChatHistory"
// (BOT_CHAT_HISTORY_SPREADSHEET_ID, xem chatHistorySheet.js) — bot đã có
// sẵn quyền ghi vào đó nên không cần thêm cấu hình credentials gì mới.
//
// Cấu trúc cột trong tab "ChatGlobal" (khai báo ở config.js ->
// CHAT_GLOBAL_SHEET_COLUMNS): A = Discord ID, B = Ingame, C = Class,
// D = Biệt Danh (dòng 1 là header, dòng 2 trở đi là data).
//
// Dùng cho lệnh /setpf (commands/slashCommands.js): AI CHO PHÉP người
// dùng từ BẤT KỲ server nào bot có mặt tự set — hoặc set THAY người khác
// qua mention — Ingame/Class/Biệt Danh của họ, không giới hạn quyền theo
// yêu cầu ban đầu. Danh sách đọc ra từ đây cũng được gộp vào
// memberDirectory cho AI auto-chat (AutoReply/index.js) để AI nhận diện
// được cả người ngoài server chính khi được hỏi tới trong câu chat.

const { google } = require('./googleClient');
const { getGoogleAuthClient } = require('./auth');
const {
  BOT_CHAT_HISTORY_SPREADSHEET_ID,
  CHAT_GLOBAL_SHEET_NAME,
  CHAT_GLOBAL_SHEET_COLUMNS,
  CHAT_GLOBAL_RELATIONSHIP_COLUMNS,
  RELATIONSHIP_MAX_DISCIPLES,
  RELATIONSHIP_MAX_KIM_LAN_MEMBERS,
} = require('../config');

const COLUMN_INDEX = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6 };
const HEADER_ROW = ['Discord ID', 'Ingame', 'Class', 'Biệt Danh', 'Sư Phụ', 'Tri Kỷ', 'Kim Lan'];
// Mở rộng A:D -> A:G để chứa thêm 3 cột mối quan hệ (Sư Phụ / Tri Kỷ /
// Kim Lan, xem CHAT_GLOBAL_RELATIONSHIP_COLUMNS ở config.js).
const SHEET_RANGE_ALL = `'${CHAT_GLOBAL_SHEET_NAME}'!A1:G10000`;

// Cache trong bộ nhớ (giống memberSheet.js) — tránh gọi Sheets API mỗi lần
// AI auto-chat trigger (có thể rất thường xuyên). Bị xoá ngay (không đợi
// hết hạn) mỗi khi có ghi mới qua upsertChatGlobalMember(), để người vừa
// /setpf xong hỏi lại ngay lập tức vẫn thấy đúng dữ liệu mới nhất.
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 phút
let cachedRows = null;
let cachedAt = 0;

function invalidateCache() {
  cachedRows = null;
  cachedAt = 0;
}

async function getSheetsClient() {
  const auth = await getGoogleAuthClient();
  if (!auth) {
    throw new Error('Chưa cấu hình Google Sheets credentials cho bot.');
  }
  return google.sheets({ version: 'v4', auth });
}

// Tạo tab "ChatGlobal" + dòng header nếu CHƯA có (bạn đã tự tạo sẵn tab này
// rồi nên phần lớn trường hợp đây chỉ là no-op) — không đụng gì tới header
// nếu đã có sẵn dữ liệu ở dòng 1 (tránh ghi đè header bạn đã tự đặt).
async function ensureChatGlobalSheetExists(sheets) {
  const response = await sheets.spreadsheets.get({ spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID });
  const existingSheets = response.data.sheets || [];
  const exists = existingSheets.some((sheet) => sheet.properties.title === CHAT_GLOBAL_SHEET_NAME);

  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      resource: {
        requests: [{ addSheet: { properties: { title: CHAT_GLOBAL_SHEET_NAME } } }],
      },
    });
  }

  const existingValues = await sheets.spreadsheets.values
    .get({ spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID, range: `'${CHAT_GLOBAL_SHEET_NAME}'!A1:D1` })
    .catch(() => ({ data: {} }));

  const rows = (existingValues.data && existingValues.data.values) || [];
  if (rows.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      range: `'${CHAT_GLOBAL_SHEET_NAME}'!A1:D1`,
      valueInputOption: 'RAW',
      resource: { values: [HEADER_ROW.slice(0, 4)] },
    });
  }

  // Sheet có thể đã tồn tại TỪ TRƯỚC (chỉ có A:D, chưa có 3 cột mối quan
  // hệ E:G mới thêm) — kiểm tra riêng E1:G1, chỉ điền header nếu ĐANG
  // TRỐNG, không đụng gì tới A1:D1 đã có sẵn ở trên.
  const existingRelHeader = await sheets.spreadsheets.values
    .get({ spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID, range: `'${CHAT_GLOBAL_SHEET_NAME}'!E1:G1` })
    .catch(() => ({ data: {} }));
  const relRows = (existingRelHeader.data && existingRelHeader.data.values) || [];
  if (relRows.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      range: `'${CHAT_GLOBAL_SHEET_NAME}'!E1:G1`,
      valueInputOption: 'RAW',
      resource: { values: [HEADER_ROW.slice(4)] },
    });
  }
}

async function fetchChatGlobalRows() {
  const sheets = await getSheetsClient();
  await ensureChatGlobalSheetExists(sheets);

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
    range: SHEET_RANGE_ALL,
  });

  // Bỏ dòng 1 (header) — luôn coi dòng đầu tiên đọc được là header, không
  // cần so khớp chữ, vì ensureChatGlobalSheetExists() đảm bảo dòng 1 luôn
  // tồn tại (dù là header do bot ghi hay do bạn tự đặt).
  const rows = response.data.values || [];
  return rows.slice(1);
}

async function getChatGlobalRows() {
  const isExpired = Date.now() - cachedAt > CACHE_TTL_MS;
  if (cachedRows && !isExpired) return cachedRows;

  cachedRows = await fetchChatGlobalRows();
  cachedAt = Date.now();
  return cachedRows;
}

function readCell(row, columnLetter) {
  const raw = row[COLUMN_INDEX[columnLetter]];
  const value = raw === undefined || raw === null ? '' : String(raw).trim();
  return value || null;
}

// discordId -> { ingame, className, nickname } | null. Dùng cho AI auto-chat
// khi cần xưng hô đúng với CHÍNH người đang chat (nếu họ không có trong tab
// "Bang" của server chính nhưng đã tự /setpf ở đâu đó).
async function getChatGlobalMemberByDiscordId(discordId) {
  try {
    const rows = await getChatGlobalRows();

    const matchedRow = rows.find((row) => {
      const cellId = readCell(row, CHAT_GLOBAL_SHEET_COLUMNS.discordId);
      return cellId !== null && cellId === discordId;
    });

    if (!matchedRow) return null;

    const ingame = readCell(matchedRow, CHAT_GLOBAL_SHEET_COLUMNS.ingame);
    const className = readCell(matchedRow, CHAT_GLOBAL_SHEET_COLUMNS.className);
    const nickname = readCell(matchedRow, CHAT_GLOBAL_SHEET_COLUMNS.nickname);

    if (!ingame && !className && !nickname) return null;

    return { ingame, className, nickname };
  } catch (error) {
    console.error('Không thể tra cứu thông tin thành viên từ tab "ChatGlobal":', error.message);
    return null;
  }
}

// Trả về TOÀN BỘ danh sách trong tab "ChatGlobal" dưới dạng
// [{ discordId, ingame, className, nickname, suPhuId, triKyId, kimLan }]
// (bỏ qua các hàng không có CẢ ingame LẪN nickname — không đủ tên để đối
// chiếu khi ai đó nhắc tới họ trong câu chat). Đây là 1 trong 2 nguồn cho
// memberDirectory của AI auto-chat (AutoReply/index.js ->
// getCombinedMemberDirectory()) — được gộp CÙNG với tab "Bang"
// (memberSheet.js -> getAllBangMembers()), xem mergeMemberDirectories() ở
// AutoReply/index.js để biết cách gộp/ưu tiên dữ liệu khi 1 người có mặt ở
// cả 2 tab. 3 field mối quan hệ (suPhuId/triKyId/kimLan, đọc từ cột E/F/G —
// xem CHAT_GLOBAL_RELATIONSHIP_COLUMNS ở config.js) vẫn ở dạng THÔ (ID/tên
// kim lan) — việc TRA ngược ID -> tên ingame để hiển thị cho AI được làm ở
// AutoReply/index.js -> enrichMemberDirectoryWithRelationships(), vì bước
// đó cần nhìn thấy TOÀN BỘ danh sách đã gộp (kể cả người chỉ có trong tab
// "Bang") để tra đúng, không thể làm ở đây (mỗi hàng đọc độc lập).
async function getAllChatGlobalMembers() {
  try {
    const rows = await getChatGlobalRows();

    return rows
      .map((row) => ({
        discordId: readCell(row, CHAT_GLOBAL_SHEET_COLUMNS.discordId),
        ingame: readCell(row, CHAT_GLOBAL_SHEET_COLUMNS.ingame),
        className: readCell(row, CHAT_GLOBAL_SHEET_COLUMNS.className),
        nickname: readCell(row, CHAT_GLOBAL_SHEET_COLUMNS.nickname),
        suPhuId: readCell(row, CHAT_GLOBAL_RELATIONSHIP_COLUMNS.suPhu),
        triKyId: readCell(row, CHAT_GLOBAL_RELATIONSHIP_COLUMNS.triKy),
        kimLan: readCell(row, CHAT_GLOBAL_RELATIONSHIP_COLUMNS.kimLan),
      }))
      .filter((member) => member.ingame || member.nickname);
  } catch (error) {
    console.error('Không thể lấy danh sách thành viên từ tab "ChatGlobal":', error.message);
    return [];
  }
}

// Set (hoặc set THAY người khác) Ingame/Class/Biệt Danh của 1 discordId.
// Mỗi field là TÙY CHỌN riêng — field nào KHÔNG truyền vào (undefined) thì
// GIỮ NGUYÊN giá trị cũ đang có trên sheet (không bị xoá mất), chỉ field
// nào có truyền giá trị mới mới bị ghi đè — để lệnh /setpf có thể vừa
// dùng để tạo mới vừa dùng để sửa 1 phần mà không sợ mất dữ liệu 2 field
// còn lại. Nếu discordId chưa từng có dòng nào -> thêm dòng mới ở cuối
// sheet; nếu đã có -> cập nhật đúng dòng đó.
// Trả về { ingame, className, nickname } SAU KHI ghi (giá trị cuối cùng
// thực tế trên sheet) để lệnh gọi hàm này báo lại chính xác cho người dùng.
async function upsertChatGlobalMember({ discordId, ingame, className, nickname }) {
  if (!discordId) throw new Error('Thiếu discordId khi ghi vào tab "ChatGlobal".');

  const sheets = await getSheetsClient();
  await ensureChatGlobalSheetExists(sheets);

  // Đọc trực tiếp (KHÔNG dùng cache) để biết CHÍNH XÁC số dòng thật trên
  // sheet ngay tại thời điểm ghi — tránh ghi nhầm dòng nếu cache đang cũ.
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
    range: SHEET_RANGE_ALL,
  });
  const allRows = response.data.values || [];

  // Dòng 0 là header (index trong mảng) -> dòng thật trên sheet = index + 1.
  let matchedIndex = -1;
  for (let i = 1; i < allRows.length; i++) {
    const cellId = readCell(allRows[i], CHAT_GLOBAL_SHEET_COLUMNS.discordId);
    if (cellId === discordId) {
      matchedIndex = i;
      break;
    }
  }

  const existingRow = matchedIndex !== -1 ? allRows[matchedIndex] : [];
  const finalIngame = ingame !== undefined ? ingame : readCell(existingRow, CHAT_GLOBAL_SHEET_COLUMNS.ingame) || '';
  const finalClassName =
    className !== undefined ? className : readCell(existingRow, CHAT_GLOBAL_SHEET_COLUMNS.className) || '';
  const finalNickname =
    nickname !== undefined ? nickname : readCell(existingRow, CHAT_GLOBAL_SHEET_COLUMNS.nickname) || '';

  const newRowValues = [discordId, finalIngame, finalClassName, finalNickname];

  if (matchedIndex !== -1) {
    // allRows[0] = header (dòng 1 thật trên sheet) -> dòng thật của
    // allRows[matchedIndex] là (matchedIndex + 1), vì index mảng bắt đầu
    // từ 0 còn số dòng sheet bắt đầu từ 1.
    const sheetRowNumber = matchedIndex + 1;
    await sheets.spreadsheets.values.update({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      range: `'${CHAT_GLOBAL_SHEET_NAME}'!A${sheetRowNumber}:D${sheetRowNumber}`,
      valueInputOption: 'RAW',
      resource: { values: [newRowValues] },
    });
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
      range: `'${CHAT_GLOBAL_SHEET_NAME}'!A1:D1`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: { values: [newRowValues] },
    });
  }

  invalidateCache();

  return { ingame: finalIngame || null, className: finalClassName || null, nickname: finalNickname || null };
}

// --- Mối quan hệ (Sư Phụ / Tri Kỷ / Kim Lan) — dùng cho lệnh
// /setmqh và mon!setmqh (commands/slashCommands.js, commands/messageCommands.js).
// Cả 3 hàm bên dưới đều: (1) đọc TRỰC TIẾP từ sheet (không dùng cache, để
// luôn thấy đúng số dòng/giá trị mới nhất trước khi validate + ghi), (2) tự
// tạo dòng mới (giống upsertChatGlobalMember) nếu discordId truyền vào CHƯA
// có dòng nào trong "ChatGlobal", (3) throw Error với message tiếng Việt dễ
// hiểu khi vi phạm luật — để lệnh gọi hàm này chỉ việc bắt lỗi và reply lại
// nguyên văn message đó cho người dùng.

// Đọc toàn bộ rows TRỰC TIẾP từ sheet (không qua cache 5 phút của
// getChatGlobalRows/getAllChatGlobalMembers) — validate quan hệ cần dữ liệu
// đúng ngay tại thời điểm ghi, tránh set sai vì đọc phải dữ liệu cache cũ.
async function fetchChatGlobalRowsFresh(sheets) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
    range: SHEET_RANGE_ALL,
  });
  return (response.data.values || []).slice(1); // bỏ header
}

function findRowIndexById(rows, discordId) {
  for (let i = 0; i < rows.length; i++) {
    if (readCell(rows[i], 'A') === discordId) return i;
  }
  return -1;
}

// Đảm bảo discordId có 1 dòng trên sheet -> trả về { rows, rowIndex,
// sheetRowNumber } (rowIndex là index trong mảng rows đã đọc, sheetRowNumber
// là số dòng THẬT trên sheet, dùng để build range khi update/append).
async function ensureMemberRow(sheets, rows, discordId) {
  let rowIndex = findRowIndexById(rows, discordId);
  if (rowIndex !== -1) {
    return { rowIndex, sheetRowNumber: rowIndex + 2 }; // +1 header, +1 chuyển 0-index -> 1-index
  }

  // Chưa có dòng nào -> thêm mới, chỉ điền cột A (Discord ID), để trống
  // Ingame/Class/Biệt Danh, các hàm gọi sau đó sẽ tự ghi tiếp cột quan hệ.
  await sheets.spreadsheets.values.append({
    spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
    range: `'${CHAT_GLOBAL_SHEET_NAME}'!A1:D1`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: { values: [[discordId, '', '', '']] },
  });

  rows.push([discordId, '', '', '']);
  rowIndex = rows.length - 1;
  return { rowIndex, sheetRowNumber: rowIndex + 2 };
}

async function writeCell(sheets, sheetRowNumber, columnLetter, value) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: BOT_CHAT_HISTORY_SPREADSHEET_ID,
    range: `'${CHAT_GLOBAL_SHEET_NAME}'!${columnLetter}${sheetRowNumber}:${columnLetter}${sheetRowNumber}`,
    valueInputOption: 'RAW',
    resource: { values: [[value]] },
  });
}

// Set (hoặc xoá, nếu suPhuId rỗng/null) Sư Phụ của discordId. Validate:
// không tự nhận mình làm sư phụ chính mình, và sư phụ đó chưa đủ
// RELATIONSHIP_MAX_DISCIPLES đệ tử.
async function setSuPhu(discordId, suPhuId) {
  if (!discordId) throw new Error('Thiếu Discord ID.');
  const sheets = await getSheetsClient();
  await ensureChatGlobalSheetExists(sheets);

  const rows = await fetchChatGlobalRowsFresh(sheets);
  const { sheetRowNumber } = await ensureMemberRow(sheets, rows, discordId);
  const col = CHAT_GLOBAL_RELATIONSHIP_COLUMNS.suPhu;

  const normalizedSuPhuId = suPhuId ? String(suPhuId).trim() : '';

  if (!normalizedSuPhuId) {
    await writeCell(sheets, sheetRowNumber, col, '');
    invalidateCache();
    return { suPhuId: null };
  }

  if (normalizedSuPhuId === discordId) {
    throw new Error('Không thể tự nhận mình làm sư phụ của chính mình.');
  }

  let discipleCount = 0;
  for (const row of rows) {
    if (readCell(row, 'A') === discordId) continue; // dòng của chính người này (nếu đang ĐỔI sư phụ) không tính
    if (readCell(row, col) === normalizedSuPhuId) discipleCount++;
  }
  if (discipleCount >= RELATIONSHIP_MAX_DISCIPLES) {
    throw new Error(
      `Sư phụ ID \`${normalizedSuPhuId}\` đã có đủ ${RELATIONSHIP_MAX_DISCIPLES} đệ tử, không thể nhận thêm.`
    );
  }

  await writeCell(sheets, sheetRowNumber, col, normalizedSuPhuId);
  invalidateCache();
  return { suPhuId: normalizedSuPhuId };
}

// Set (hoặc xoá, nếu triKyId rỗng/null) Tri Kỷ của discordId —
// LUÔN mirror 2 chiều: set ID B vào dòng A thì tự set ngược lại ID A vào
// dòng B, và gỡ liên kết cũ (nếu có đổi người) ở CẢ 2 phía. Validate: không
// tự nhận mình, và người kia hiện CHƯA có tri kỷ khác (đảm bảo đúng 1-1).
async function setTriKy(discordId, triKyId) {
  if (!discordId) throw new Error('Thiếu Discord ID.');
  const sheets = await getSheetsClient();
  await ensureChatGlobalSheetExists(sheets);

  const rows = await fetchChatGlobalRowsFresh(sheets);
  const { rowIndex, sheetRowNumber } = await ensureMemberRow(sheets, rows, discordId);
  const col = CHAT_GLOBAL_RELATIONSHIP_COLUMNS.triKy;

  const normalizedTriKyId = triKyId ? String(triKyId).trim() : '';
  const oldTriKyId = readCell(rows[rowIndex], col);

  // Gỡ liên kết CŨ trước (nếu đang đổi sang người khác hoặc xoá hẳn) — chỉ
  // gỡ phía bên kia nếu nó ĐANG thực sự trỏ ngược lại discordId (tránh gỡ
  // nhầm nếu dữ liệu 2 bên đã lệch vì sửa tay).
  if (oldTriKyId && oldTriKyId !== normalizedTriKyId) {
    const oldPartnerIndex = findRowIndexById(rows, oldTriKyId);
    if (oldPartnerIndex !== -1 && readCell(rows[oldPartnerIndex], col) === discordId) {
      await writeCell(sheets, oldPartnerIndex + 2, col, '');
    }
  }

  if (!normalizedTriKyId) {
    await writeCell(sheets, sheetRowNumber, col, '');
    invalidateCache();
    return { triKyId: null };
  }

  if (normalizedTriKyId === discordId) {
    throw new Error('Không thể tự nhận mình là tri kỷ/chí duyên của chính mình.');
  }

  const { rowIndex: partnerRowIndex, sheetRowNumber: partnerSheetRowNumber } = await ensureMemberRow(
    sheets,
    rows,
    normalizedTriKyId
  );
  const partnerCurrentTriKy = readCell(rows[partnerRowIndex], col);
  if (partnerCurrentTriKy && partnerCurrentTriKy !== discordId) {
    throw new Error(
      `ID \`${normalizedTriKyId}\` hiện đã có tri kỷ/chí duyên khác (\`${partnerCurrentTriKy}\`). Mỗi người chỉ có 1 tri kỷ/chí duyên cùng lúc.`
    );
  }

  await writeCell(sheets, sheetRowNumber, col, normalizedTriKyId);
  await writeCell(sheets, partnerSheetRowNumber, col, discordId);
  invalidateCache();
  return { triKyId: normalizedTriKyId };
}

// Set (hoặc xoá, nếu tenKimLan rỗng/null) Kim Lan của discordId — chỉ là
// text, TRÙNG TÊN (không phân biệt hoa/thường, khoảng trắng thừa) = chung 1
// kim lan. Validate: kim lan đó chưa đủ RELATIONSHIP_MAX_KIM_LAN_MEMBERS
// người.
async function setKimLan(discordId, tenKimLan) {
  if (!discordId) throw new Error('Thiếu Discord ID.');
  const sheets = await getSheetsClient();
  await ensureChatGlobalSheetExists(sheets);

  const rows = await fetchChatGlobalRowsFresh(sheets);
  const { sheetRowNumber } = await ensureMemberRow(sheets, rows, discordId);
  const col = CHAT_GLOBAL_RELATIONSHIP_COLUMNS.kimLan;

  const normalizedName = tenKimLan ? String(tenKimLan).trim() : '';

  if (!normalizedName) {
    await writeCell(sheets, sheetRowNumber, col, '');
    invalidateCache();
    return { kimLan: null };
  }

  const normalizedKey = normalizedName.toLowerCase();
  let memberCount = 0;
  for (const row of rows) {
    if (readCell(row, 'A') === discordId) continue; // dòng của chính người này (nếu đang ĐỔI kim lan) không tính
    const cell = readCell(row, col);
    if (cell && cell.toLowerCase() === normalizedKey) memberCount++;
  }
  if (memberCount >= RELATIONSHIP_MAX_KIM_LAN_MEMBERS) {
    throw new Error(
      `Kim Lan "${normalizedName}" đã đủ ${RELATIONSHIP_MAX_KIM_LAN_MEMBERS} người, không thể thêm nữa.`
    );
  }

  await writeCell(sheets, sheetRowNumber, col, normalizedName);
  invalidateCache();
  return { kimLan: normalizedName };
}

module.exports = {
  getChatGlobalMemberByDiscordId,
  getAllChatGlobalMembers,
  upsertChatGlobalMember,
  setSuPhu,
  setTriKy,
  setKimLan,
};