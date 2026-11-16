// ===== nmImage/knowledgeStore.js — lưu ảnh cho MỤC KIẾN THỨC (trang web "Kiến Thức Bot") =====
// Tách riêng khỏi nmImage/index.js (file đó còn chứa lệnh Discord /saveimg, /send_img...). NƠI LƯU GIỮ NGUYÊN:
//   - Cloudinary (riêng tư, "authenticated") vào folder KNOWLEDGE_IMAGE_CLOUDINARY_FOLDER (mặc định nm_kienthuc)
//   - 1 dòng vào tab "Ảnh Kiến Thức" (KNOWLEDGE_IMAGE_SHEET_NAME), cột A-G như cũ
// Khác trước: mỗi bước có hạn chờ riêng (tổng tối đa ~65 giây) nên bước nào kẹt sẽ báo rõ "kẹt ở bước nào"
// thay vì treo tới 5 phút (timeout mặc định của Google API) làm web báo "Bot phản hồi quá lâu".
const {
  getAllKnowledgeImageEntries,
  findByNameIn,
  nextDisplayIdFrom,
  appendKnowledgeImageEntry,
} = require('../googleSheets/knowledgeImageSheet');
const { KNOWLEDGE_IMAGE_CLOUDINARY_FOLDER } = require('../config');
const { uploadImageToCloudinary } = require('./cloudinary');
const { getFormattedDateTime } = require('../utils/time');

const READ_SHEET_TIMEOUT_MS = 15000;
const APPEND_SHEET_TIMEOUT_MS = 20000;
// Upload Cloudinary tự có hạn 30 giây bên trong cloudinary.js.

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error(`${label}: quá ${Math.round(ms / 1000)} giây không phản hồi`), { code: 'STEP_TIMEOUT' })), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// Trả { ok, text, id, name, code? } — cùng dạng storeImageBuffer.
async function storeKnowledgeImageBuffer({ name, buffer, mimeType, filename, discordId }) {
  const t0 = Date.now();
  const lap = (step) => console.log(`[kienthuc-img] ${step} — ${Date.now() - t0}ms`);
  lap(`bắt đầu lưu "${name}" (${buffer.length} bytes)`);
  let entries;
  try {
    entries = await withTimeout(getAllKnowledgeImageEntries(), READ_SHEET_TIMEOUT_MS, 'Đọc tab "Ảnh Kiến Thức"');
    lap('đã đọc tab Ảnh Kiến Thức');
  } catch (error) {
    console.error('Lỗi đọc tab "Ảnh Kiến Thức":', error.message);
    const hung = error.code === 'STEP_TIMEOUT';
    return { ok: false, code: hung ? 'STEP_TIMEOUT' : undefined, text: hung
      ? '❌ Google Sheet phản hồi quá chậm khi đọc tab "Ảnh Kiến Thức" (chưa tải gì lên). Thử lại sau ít phút.'
      : '❌ Không đọc được tab "Ảnh Kiến Thức" trên Google Sheet. Kiểm tra quyền của bot với spreadsheet rồi thử lại.' };
  }
  if (findByNameIn(entries, name)) {
    return { ok: false, code: 'NAME_TAKEN', text: `❌ Tên **${name}** đã có trong kho ảnh kiến thức, chọn 1 tên khác.` };
  }

  let uploadResult;
  try {
    uploadResult = await uploadImageToCloudinary(buffer, filename, mimeType, KNOWLEDGE_IMAGE_CLOUDINARY_FOLDER);
    lap('đã upload Cloudinary');
  } catch (error) {
    console.error('Lỗi upload ảnh kiến thức lên Cloudinary:', error.message);
    return { ok: false, text: '❌ Không lưu được ảnh lên Cloudinary (có thể Cloudinary đang chậm hoặc cấu hình CLOUDINARY_* chưa đúng). Thử lại sau ít phút.' };
  }

  const displayId = nextDisplayIdFrom(entries);
  try {
    await withTimeout(appendKnowledgeImageEntry({
      name,
      fileId: displayId,
      link: `cloudinary:${uploadResult.format || ''}`,
      mimeType,
      discordId,
      savedAt: getFormattedDateTime(),
      cloudinaryId: uploadResult.id,
    }), APPEND_SHEET_TIMEOUT_MS, 'Ghi tab "Ảnh Kiến Thức"');
    lap('đã ghi dòng vào tab Ảnh Kiến Thức');
  } catch (error) {
    console.error('Lỗi ghi tab "Ảnh Kiến Thức":', error.message);
    const hung = error.code === 'STEP_TIMEOUT';
    return { ok: false, code: hung ? 'STEP_TIMEOUT' : undefined, text: hung
      ? '⚠️ Ảnh đã lên Cloudinary nhưng Google Sheet ghi quá chậm. Bấm "Chọn từ kho" kiểm tra xem ảnh đã có chưa trước khi tải lại (tránh bị trùng tên).'
      : '⚠️ Đã lưu ảnh lên Cloudinary nhưng KHÔNG ghi được vào tab "Ảnh Kiến Thức" — kiểm tra lại quyền ghi của bot với spreadsheet.' };
  }
  return { ok: true, id: displayId, name, text: `✅ Đã lưu ảnh kiến thức **${name}** (ID: **${displayId}**).` };
}

module.exports = { storeKnowledgeImageBuffer };
