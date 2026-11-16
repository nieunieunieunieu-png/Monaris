// ===== googleSheets/knowledgeImageSheet.js — tab "Ảnh Kiến Thức" (kho ảnh RIÊNG của kiến thức) =====
// Tách hẳn khỏi tab "Cây Thư Mục" của /saveimg: ảnh gắn vào mục kiến thức chỉ nằm ở đây nên /viewlistimg, /send_img,
// /renameimg không thấy, và ngược lại ảnh /saveimg không lẫn vào danh sách chọn của trang web "Kiến Thức Bot".
// Cấu trúc cột GIỐNG HỆT "Cây Thư Mục" (A-G) để dùng lại logic tải ảnh (downloadNmImageEntry ở nmImage/index.js):
//   A = Tên ảnh (khoá tra cứu, không phân biệt hoa/thường, PHẢI duy nhất TRONG TAB NÀY)
//   B = ID ảnh hiển thị — số nguyên tự tăng riêng của tab này (1, 2, 3...). Cột F tab "Kiến thức bang" lưu ID này.
//   C = Link — marker "cloudinary:<format>" (ảnh riêng tư, link tải được bot ký lại mỗi lần cần)
//   D = Loại file (mimeType)
//   E = Người lưu (Discord ID / "web-kienthuc")
//   F = Thời gian lưu (giờ VN)
//   G = Cloudinary Public ID thật (dùng nội bộ để ký link tải)
const { google } = require('./googleClient');
const { getGoogleAuthClient } = require('./auth');
const { KNOWLEDGE_IMAGE_SPREADSHEET_ID, KNOWLEDGE_IMAGE_SHEET_NAME } = require('../config');

const HEADER = ['Tên ảnh', 'ID Ảnh', 'Link Ảnh', 'Loại File', 'Người Lưu', 'Thời Gian Lưu', 'Cloudinary Public ID'];

async function getSheetsClient() {
  const auth = await getGoogleAuthClient();
  if (!auth) throw new Error('Chưa cấu hình Google Sheets credentials cho bot.');
  return google.sheets({ version: 'v4', auth });
}

// Tạo tab + header nếu chưa có (không đụng dữ liệu đã có). Chỉ chạy thật 1 lần / lần bot chạy; lỗi thì lần sau thử lại.
let ensurePromise = null;
function ensureKnowledgeImageSheetExists() {
  if (!KNOWLEDGE_IMAGE_SPREADSHEET_ID) return Promise.resolve();
  if (!ensurePromise) {
    ensurePromise = (async () => {
      const sheets = await getSheetsClient();
      const meta = await sheets.spreadsheets.get({
        spreadsheetId: KNOWLEDGE_IMAGE_SPREADSHEET_ID,
        fields: 'sheets.properties.title',
      });
      const exists = (meta.data.sheets || []).some((s) => s.properties.title === KNOWLEDGE_IMAGE_SHEET_NAME);
      if (!exists) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: KNOWLEDGE_IMAGE_SPREADSHEET_ID,
          resource: { requests: [{ addSheet: { properties: { title: KNOWLEDGE_IMAGE_SHEET_NAME } } }] },
        });
      }
      const head = await sheets.spreadsheets.values.get({
        spreadsheetId: KNOWLEDGE_IMAGE_SPREADSHEET_ID,
        range: `'${KNOWLEDGE_IMAGE_SHEET_NAME}'!A1:G1`,
      });
      const headerRow = (head.data.values || [])[0] || [];
      if (!headerRow[0]) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: KNOWLEDGE_IMAGE_SPREADSHEET_ID,
          range: `'${KNOWLEDGE_IMAGE_SHEET_NAME}'!A1:G1`,
          valueInputOption: 'RAW',
          resource: { values: [HEADER] },
        });
      }
    })().catch((error) => {
      ensurePromise = null;
      throw error;
    });
  }
  return ensurePromise;
}

// Toàn bộ ảnh: [{ name, fileId, link, mimeType, savedBy, savedAt, cloudinaryId, rowIndex }] (cùng dạng "Cây Thư Mục").
async function getAllKnowledgeImageEntries() {
  if (!KNOWLEDGE_IMAGE_SPREADSHEET_ID) return [];
  await ensureKnowledgeImageSheetExists();
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: KNOWLEDGE_IMAGE_SPREADSHEET_ID,
    range: `'${KNOWLEDGE_IMAGE_SHEET_NAME}'!A2:G`,
  });
  return (response.data.values || [])
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

function findByNameIn(entries, name) {
  const target = normalizeName(name);
  return target ? entries.find((entry) => normalizeName(entry.name) === target) || null : null;
}

function nextDisplayIdFrom(entries) {
  let max = 0;
  for (const entry of entries) {
    if (/^\d+$/.test(entry.fileId)) max = Math.max(max, parseInt(entry.fileId, 10));
  }
  return String(max + 1);
}

async function appendKnowledgeImageEntry({ name, fileId, link, mimeType, discordId, savedAt, cloudinaryId }) {
  if (!KNOWLEDGE_IMAGE_SPREADSHEET_ID) throw new Error('Chưa cấu hình spreadsheet cho kho ảnh kiến thức.');
  await ensureKnowledgeImageSheetExists();
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: KNOWLEDGE_IMAGE_SPREADSHEET_ID,
    range: `'${KNOWLEDGE_IMAGE_SHEET_NAME}'!A:G`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: { values: [[name, fileId, link, mimeType || '', discordId || '', savedAt || '', cloudinaryId || '']] },
  });
}

module.exports = {
  ensureKnowledgeImageSheetExists,
  getAllKnowledgeImageEntries,
  findByNameIn,
  nextDisplayIdFrom,
  appendKnowledgeImageEntry,
};
