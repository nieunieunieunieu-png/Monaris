// ===== config/keywordFilter.js — Bộ lọc từ khoá nhạy cảm (tự xoá tin + báo log) =====
// Bot tự XOÁ tin nhắn (cả tin mới lẫn tin bị sửa) chứa từ khoá trong tab "Từ Khoá Nhạy Cảm"
// của spreadsheet BOT_CHAT_HISTORY_SPREADSHEET_ID (config/sheets.js), rồi gửi log vào kênh
// KEYWORD_FILTER_LOG_CHANNEL_ID. Xem keywordFilter/index.js + googleSheets/keywordFilterSheet.js.
const KEYWORD_FILTER_SHEET_NAME = 'Từ Khoá Nhạy Cảm';
const KEYWORD_FILTER_LOG_CHANNEL_ID = process.env.KEYWORD_FILTER_LOG_CHANNEL_ID || '';
// Bot đọc lại sheet mỗi N phút -> sửa sheet xong tối đa N phút sau là có hiệu lực (không cần restart).
const KEYWORD_FILTER_REFRESH_MINUTES = Number(process.env.KEYWORD_FILTER_REFRESH_MINUTES) || 3;
// Discord ID được MIỄN bị lọc (cách nhau bằng dấu phẩy). Mặc định để TRỐNG: ai cũng bị lọc,
// kể cả admin — để dễ test. Muốn miễn cho ai thì set ENV KEYWORD_FILTER_EXEMPT_IDS trên Railway.
const KEYWORD_FILTER_EXEMPT_IDS = String(process.env.KEYWORD_FILTER_EXEMPT_IDS || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

module.exports = {
  KEYWORD_FILTER_SHEET_NAME,
  KEYWORD_FILTER_LOG_CHANNEL_ID,
  KEYWORD_FILTER_REFRESH_MINUTES,
  KEYWORD_FILTER_EXEMPT_IDS,
};
