// ===== googleSheets/manualAchievementSheet.js — tab "Thành Tựu Đặt Tay" (CÙNG spreadsheet với "Hồ Sơ Cá Nhân", NM_IMAGE_SPREADSHEET_ID) =====
// Thành tựu gắn TAY cho từng người (bên cạnh thành tựu tự tính ở LEVEL_ACHIEVEMENTS) — vd thưởng sự kiện, vinh danh đặc
// biệt. Chỉ ADMIN_USER_ID được gắn/gỡ (xem hoso/manualAchievements.js). Append-only + cột Trạng Thái (soft-delete, giống
// cách làm của googleSheets/highlightSheet.js) — KHÔNG xoá dòng để giữ lịch sử.
//
//   A = Discord ID       (người được gắn thành tựu)
//   B = Tên Thành Tựu
//   C = Ghi Chú          (tuỳ chọn — hiện thay cho "mốc kế tiếp" trên thẻ /hoso)
//   D = Người Gắn        (Discord ID admin đã gắn)
//   E = Thời Gian Gắn    (ISO timestamp)
//   F = Trạng Thái       ('Còn' | 'Đã gỡ')

const { google } = require('./googleClient');
const { getGoogleAuthClient } = require('./auth');
const { NM_IMAGE_SPREADSHEET_ID, MANUAL_ACHIEVEMENT_SHEET_NAME } = require('../config');

const HEADER_ROW = ['Discord ID', 'Tên Thành Tựu', 'Ghi Chú', 'Người Gắn', 'Thời Gian Gắn', 'Trạng Thái'];
const DATA_RANGE_SUFFIX = 'A2:F';
const DISCORD_ID_COLUMN_INDEX = 0; // cột A
const NAME_COLUMN_INDEX = 1; // cột B
const STATUS_COLUMN_INDEX = 5; // cột F

async function getSheetsClient() {
  const authClient = await getGoogleAuthClient();
  if (!authClient) {
    throw new Error('Chưa cấu hình Google Sheets credentials cho bot.');
  }
  return google.sheets({ version: 'v4', auth: authClient });
}

function a1(title, range) {
  return `'${String(title).replace(/'/g, "''")}'!${range}`;
}

// Google trả 400 "Unable to parse range" khi tab không tồn tại.
function isMissingRangeError(error) {
  const status = Number((error && (error.status || error.code)) || (error && error.response && error.response.status));
  return status === 400 && /Unable to parse range/i.test(String((error && error.message) || ''));
}

// Tạo tab "Thành Tựu Đặt Tay" (nếu chưa có) + ghi header — gọi lúc khởi động, gọi lại nhiều lần vô hại.
async function ensureManualAchievementSheetExists() {
  const sheets = await getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: NM_IMAGE_SPREADSHEET_ID });
  const exists = (meta.data.sheets || []).some((s) => s.properties.title === MANUAL_ACHIEVEMENT_SHEET_NAME);

  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: NM_IMAGE_SPREADSHEET_ID,
      resource: { requests: [{ addSheet: { properties: { title: MANUAL_ACHIEVEMENT_SHEET_NAME } } }] },
    });
  }

  const existingHeader = await sheets.spreadsheets.values
    .get({ spreadsheetId: NM_IMAGE_SPREADSHEET_ID, range: a1(MANUAL_ACHIEVEMENT_SHEET_NAME, 'A1:F1') })
    .catch(() => ({ data: {} }));
  const currentHeader = (existingHeader.data && existingHeader.data.values && existingHeader.data.values[0]) || [];
  if (currentHeader.length < HEADER_ROW.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: NM_IMAGE_SPREADSHEET_ID,
      range: a1(MANUAL_ACHIEVEMENT_SHEET_NAME, 'A1:F1'),
      valueInputOption: 'RAW',
      resource: { values: [HEADER_ROW] },
    });
  }
}

// Đọc TOÀN BỘ dòng (kể cả đã gỡ) -> dùng để nạp cache RAM lúc khởi động (xem hoso/manualAchievements.js).
// Trả [{ discordId, tenThanhTuu, ghiChu, nguoiGan, thoiGianGan, trangThai }], tab chưa có thì trả [].
async function getAllManualAchievements() {
  const sheets = await getSheetsClient();
  let rows;
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: NM_IMAGE_SPREADSHEET_ID,
      range: a1(MANUAL_ACHIEVEMENT_SHEET_NAME, DATA_RANGE_SUFFIX),
    });
    rows = res.data.values || [];
  } catch (error) {
    if (isMissingRangeError(error)) return [];
    throw error;
  }
  return rows
    .filter((row) => row[DISCORD_ID_COLUMN_INDEX])
    .map((row) => ({
      discordId: String(row[DISCORD_ID_COLUMN_INDEX] || ''),
      tenThanhTuu: String(row[NAME_COLUMN_INDEX] || ''),
      ghiChu: String(row[2] || ''),
      nguoiGan: String(row[3] || ''),
      thoiGianGan: String(row[4] || ''),
      trangThai: String(row[STATUS_COLUMN_INDEX] || 'Còn'),
    }));
}

// Ghi 1 dòng thành tựu đặt tay mới.
async function appendManualAchievement({ discordId, tenThanhTuu, ghiChu, nguoiGan, createdAt }) {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: NM_IMAGE_SPREADSHEET_ID,
    range: a1(MANUAL_ACHIEVEMENT_SHEET_NAME, DATA_RANGE_SUFFIX),
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values: [[discordId, tenThanhTuu, ghiChu || '', nguoiGan, createdAt.toISOString(), 'Còn']],
    },
  });
}

// Đánh dấu "Đã gỡ" cho dòng ĐANG "Còn" KHỚP ĐÚNG discordId + tên (không phân biệt hoa/thường, đã trim) —
// trả true nếu gỡ được 1 dòng, false nếu không tìm thấy. Chỉ gỡ 1 dòng đầu tiên khớp (phòng khi lỡ gắn trùng tên).
async function removeManualAchievementByName(discordId, tenThanhTuu) {
  const sheets = await getSheetsClient();
  let rows;
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: NM_IMAGE_SPREADSHEET_ID,
      range: a1(MANUAL_ACHIEVEMENT_SHEET_NAME, DATA_RANGE_SUFFIX),
    });
    rows = res.data.values || [];
  } catch (error) {
    if (isMissingRangeError(error)) return false;
    throw error;
  }
  const want = String(tenThanhTuu || '').trim().toLowerCase();
  const rowIndex = rows.findIndex(
    (row) =>
      String(row[DISCORD_ID_COLUMN_INDEX] || '') === String(discordId) &&
      String(row[NAME_COLUMN_INDEX] || '').trim().toLowerCase() === want &&
      String(row[STATUS_COLUMN_INDEX] || 'Còn') === 'Còn'
  );
  if (rowIndex === -1) return false;
  await sheets.spreadsheets.values.update({
    spreadsheetId: NM_IMAGE_SPREADSHEET_ID,
    range: a1(MANUAL_ACHIEVEMENT_SHEET_NAME, `F${rowIndex + 2}`),
    valueInputOption: 'RAW',
    resource: { values: [['Đã gỡ']] },
  });
  return true;
}

module.exports = {
  ensureManualAchievementSheetExists,
  getAllManualAchievements,
  appendManualAchievement,
  removeManualAchievementByName,
};
