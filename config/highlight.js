// ===== config/highlight.js — "Highlight Nghịch Thuỷ Hàn" (quét link Youtube) =====
// Kênh "2 light" chứa các clip Youtube do thành viên đăng (đã có định dạng
// sẵn: 1 dòng mô tả + link Youtube, Discord tự tạo embed tiêu đề video bên
// dưới). Bot quét kênh này (cả lịch sử cũ lẫn tin mới) và ghi lại vào tab
// "Highlight" của CHÍNH sheet Thư Viện Hệ Phái (LIBRARY_SPREADSHEET_ID,
// config/hub.js) — dùng lại luôn, không tạo spreadsheet mới. Trang Monaris Admin
// (/highlight) đọc thẳng tab này để hiển thị danh sách video, xem
// highlight/index.js + googleSheets/highlightSheet.js.
const HIGHLIGHT_CHANNEL_ID = process.env.HIGHLIGHT_CHANNEL_ID || '';
const HIGHLIGHT_SHEET_NAME = 'Highlight';

module.exports = {
  HIGHLIGHT_CHANNEL_ID,
  HIGHLIGHT_SHEET_NAME,
};
