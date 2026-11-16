// ===== config/nmImage.js — Lưu & gửi lại ảnh theo tên ("NM_image") =====
// /saveimg + mon!saveimg lưu ảnh vào 1 folder Google Drive cố định rồi ghi
// thông tin (tên/fileId/link) vào 1 sheet để tra cứu; /send_img + mon!send_img
// gửi lại đúng ảnh đó vào chat theo tên hoặc theo Drive File ID; /viewlistimg
// liệt kê toàn bộ tên đã lưu. Xem nmImage/index.js.

// Folder Drive chứa toàn bộ ảnh đã lưu — user đã tạo sẵn và cho phép Service
// Account của bot ghi vào (Editor). Link gốc:
// https://drive.google.com/drive/u/0/folders/
const NM_IMAGE_DRIVE_FOLDER_ID = process.env.NM_IMAGE_DRIVE_FOLDER_ID || '';

// Spreadsheet + tab lưu danh sách ảnh (Tên | Drive File ID | Link | Loại file |
// Người lưu | Thời gian) — user đã tạo sẵn, tab tên "Cây Thư Mục". Link gốc:
// https://docs.google.com/spreadsheets/d/
const NM_IMAGE_SPREADSHEET_ID = process.env.NM_IMAGE_SPREADSHEET_ID || process.env.GOOGLE_SHEET_ID || '';
const NM_IMAGE_SHEET_NAME = 'Cây Thư Mục';

// Ảnh MỚI lưu qua /saveimg upload lên Cloudinary ở chế độ "authenticated" —
// RIÊNG TƯ thật (không có link công khai cho ai cũng xem được như ImgBB/
// Catbox trước đây). Cần đăng ký tài khoản FREE tại
// https://cloudinary.com/users/register/free rồi lấy 3 giá trị trong
// Dashboard, dán vào 3 biến môi trường dưới đây (KHÔNG hard-code giá trị
// thật vào code). Xem nmImage/cloudinary.js.
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

module.exports = {
  NM_IMAGE_DRIVE_FOLDER_ID,
  NM_IMAGE_SPREADSHEET_ID,
  NM_IMAGE_SHEET_NAME,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
};
