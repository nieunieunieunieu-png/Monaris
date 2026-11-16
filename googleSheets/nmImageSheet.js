// ===== googleSheets/nmImageSheet.js — sheet "Cây Thư Mục" (danh sách ảnh) =====
// 1 dòng / 1 ảnh đã lưu qua /saveimg (mon!saveimg). Cột A-G:
//   A = Tên ảnh (khoá tra cứu, không phân biệt hoa/thường, PHẢI duy nhất)
//   B = ID ảnh — ID HIỂN THỊ, dùng để gõ vào /send_img cho tiện. Ảnh lưu MỚI
//       NHẤT (Cloudinary): 1 SỐ nguyên đơn giản tự tăng (1, 2, 3...), không
//       phải ID thật trên Cloudinary (ID thật nằm ở cột G, bot tự dùng nội
//       bộ, không cần gõ). Các dòng cũ hơn (Catbox/ImgBB/Drive) vẫn giữ
//       nguyên ID gốc kiểu cũ, vẫn gõ được y như trước.
//   C = Link ảnh — Cloudinary: KHÔNG phải link thật, chỉ là marker dạng
//       "cloudinary:<format>" (ảnh riêng tư, không có link công khai cố định,
//       phải tự ký lại mỗi lần tải — xem nmImage/cloudinary.js); Catbox/ImgBB
//       cũ: direct link tải thẳng được; Drive cũ nhất: webViewLink, chỉ xem
//       được, không tải trực tiếp
//   D = Loại file (mimeType gốc — dùng lại khi gửi ra chat cho đúng định dạng)
//   E = Người lưu (Discord ID)
//   F = Thời gian lưu (giờ VN, dạng chuỗi)
//   G = Cloudinary Public ID THẬT (chỉ có ở ảnh lưu qua Cloudinary — dùng nội
//       bộ để ký link tải, KHÔNG hiển thị/không cần gõ tay)
const { google } = require('./googleClient');
const { getGoogleAuthClient } = require('./auth');
const { NM_IMAGE_SPREADSHEET_ID, NM_IMAGE_SHEET_NAME } = require('../config');

const HEADER = ['Tên ảnh', 'ID Ảnh', 'Link Ảnh', 'Loại File', 'Người Lưu', 'Thời Gian Lưu', 'Cloudinary Public ID'];

async function getSheetsClient() {
  const auth = await getGoogleAuthClient();
  if (!auth) throw new Error('Chưa cấu hình Google Sheets credentials cho bot.');
  return google.sheets({ version: 'v4', auth });
}

async function sheetExists(sheets, title) {
  const response = await sheets.spreadsheets.get({ spreadsheetId: NM_IMAGE_SPREADSHEET_ID });
  return (response.data.sheets || []).some((s) => s.properties.title === title);
}

// Gọi 1 lần lúc ClientReady — tạo tab "Cây Thư Mục" nếu vì lý do gì đó chưa
// có (bình thường user đã tự tạo sẵn), và điền/vá lại đúng 7 cột tiêu đề nếu
// dòng 1 đang trống hoặc còn thiếu cột G (không đụng gì tới dữ liệu đã có).
async function ensureNmImageSheetExists() {
  if (!NM_IMAGE_SPREADSHEET_ID) return;

  const sheets = await getSheetsClient();

  if (!(await sheetExists(sheets, NM_IMAGE_SHEET_NAME))) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: NM_IMAGE_SPREADSHEET_ID,
      resource: { requests: [{ addSheet: { properties: { title: NM_IMAGE_SHEET_NAME } } }] },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: NM_IMAGE_SPREADSHEET_ID,
      range: `'${NM_IMAGE_SHEET_NAME}'!A1`,
      valueInputOption: 'RAW',
      resource: { values: [HEADER] },
    });
    return;
  }

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: NM_IMAGE_SPREADSHEET_ID,
    range: `'${NM_IMAGE_SHEET_NAME}'!A1:G1`,
  });
  const headerRow = (response.data.values || [])[0] || [];
  if (!headerRow[0]) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: NM_IMAGE_SPREADSHEET_ID,
      range: `'${NM_IMAGE_SHEET_NAME}'!A1:G1`,
      valueInputOption: 'RAW',
      resource: { values: [HEADER] },
    });
  } else if (!headerRow[6]) {
    // Sheet cũ chỉ có A-F (tạo trước khi có cột G) — vá thêm tiêu đề cột G,
    // không đụng gì tới các cột/dữ liệu khác.
    await sheets.spreadsheets.values.update({
      spreadsheetId: NM_IMAGE_SPREADSHEET_ID,
      range: `'${NM_IMAGE_SHEET_NAME}'!G1`,
      valueInputOption: 'RAW',
      resource: { values: [[HEADER[6]]] },
    });
  }
}

// Trả về toàn bộ danh sách, mỗi phần tử { name, fileId, link, mimeType,
// savedBy, savedAt, cloudinaryId, rowIndex } (rowIndex tính từ 1, khớp số
// dòng thật trên sheet — dòng 1 là header nên dữ liệu bắt đầu từ rowIndex =
// 2). cloudinaryId chỉ có giá trị ở ảnh lưu qua Cloudinary — dòng cũ hơn thì
// rỗng (không cần vì fileId của chúng đã là ID gốc dùng tải trực tiếp rồi).
async function getAllNmImageEntries() {
  if (!NM_IMAGE_SPREADSHEET_ID) return [];
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: NM_IMAGE_SPREADSHEET_ID,
    range: `'${NM_IMAGE_SHEET_NAME}'!A2:G`,
  });
  const rows = response.data.values || [];
  return rows
    .map((row, i) => ({
      name: (row[0] || '').trim(),
      fileId: (row[1] || '').trim(),
      link: (row[2] || '').trim(),
      mimeType: (row[3] || '').trim(),
      savedBy: (row[4] || '').trim(),
      savedAt: (row[5] || '').trim(),
      cloudinaryId: (row[6] || '').trim(),
      rowIndex: i + 2,
    }))
    .filter((entry) => entry.name && entry.fileId);
}

function normalizeName(name) {
  return String(name || '').trim().toLowerCase();
}

async function findNmImageEntryByName(name) {
  const target = normalizeName(name);
  if (!target) return null;
  const entries = await getAllNmImageEntries();
  return entries.find((entry) => normalizeName(entry.name) === target) || null;
}

async function findNmImageEntryById(fileId) {
  const target = String(fileId || '').trim();
  if (!target) return null;
  const entries = await getAllNmImageEntries();
  return entries.find((entry) => entry.fileId === target) || null;
}

// Tìm gần đúng theo tên (chứa chuỗi tìm, không phân biệt hoa/thường) — dùng
// khi /send_img không khớp tên/ID tuyệt đối nào, để gợi ý cho người dùng.
async function searchNmImageEntriesByPartialName(query) {
  const target = normalizeName(query);
  if (!target) return [];
  const entries = await getAllNmImageEntries();
  return entries.filter((entry) => normalizeName(entry.name).includes(target));
}

// Sinh ID HIỂN THỊ tiếp theo cho ảnh lưu qua Cloudinary — 1 số nguyên dạng
// chuỗi, bắt đầu từ "1". Chỉ tính những dòng đang có cột B là số nguyên
// thuần (tức ảnh kiểu mới); các dòng cũ (ID kiểu chuỗi Catbox/ImgBB/Drive)
// không tính vào, không bị đụng tới.
async function getNextDisplayId() {
  const entries = await getAllNmImageEntries();
  let max = 0;
  for (const entry of entries) {
    if (/^\d+$/.test(entry.fileId)) {
      const n = parseInt(entry.fileId, 10);
      if (n > max) max = n;
    }
  }
  return String(max + 1);
}

async function appendNmImageEntry({ name, fileId, link, mimeType, discordId, savedAt, cloudinaryId }) {
  if (!NM_IMAGE_SPREADSHEET_ID) throw new Error('Chưa cấu hình NM_IMAGE_SPREADSHEET_ID.');
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: NM_IMAGE_SPREADSHEET_ID,
    range: `'${NM_IMAGE_SHEET_NAME}'!A:G`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: { values: [[name, fileId, link, mimeType || '', discordId || '', savedAt || '', cloudinaryId || '']] },
  });
}

// Đổi tên 1 ảnh đã lưu (chỉ sửa cột A, giữ nguyên ID/link/mimeType/người lưu/
// thời gian). Trả về { ok: true } nếu thành công, hoặc { ok: false, reason }
// với reason = 'not_found' (không có ảnh tên oldName) hoặc 'name_taken'
// (newName đã bị 1 ảnh KHÁC dùng rồi — không tính chính oldName).
async function renameNmImageEntry(oldName, newName) {
  if (!NM_IMAGE_SPREADSHEET_ID) throw new Error('Chưa cấu hình NM_IMAGE_SPREADSHEET_ID.');
  const entries = await getAllNmImageEntries();
  const target = entries.find((entry) => normalizeName(entry.name) === normalizeName(oldName));
  if (!target) return { ok: false, reason: 'not_found' };

  if (normalizeName(newName) !== normalizeName(oldName)) {
    const clash = entries.find((entry) => normalizeName(entry.name) === normalizeName(newName));
    if (clash) return { ok: false, reason: 'name_taken' };
  }

  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: NM_IMAGE_SPREADSHEET_ID,
    range: `'${NM_IMAGE_SHEET_NAME}'!A${target.rowIndex}`,
    valueInputOption: 'RAW',
    resource: { values: [[newName]] },
  });
  return { ok: true };
}

module.exports = {
  ensureNmImageSheetExists,
  getAllNmImageEntries,
  findNmImageEntryByName,
  findNmImageEntryById,
  searchNmImageEntriesByPartialName,
  getNextDisplayId,
  appendNmImageEntry,
  renameNmImageEntry,
};
