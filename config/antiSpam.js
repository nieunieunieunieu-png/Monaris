// ===== config/antiSpam.js — Chống spam tin nhắn giống nhau =====
// Cùng 1 nội dung (của 1 người HOẶC nhiều người, trong 1 server) được gửi >= 2 lần trong
// ANTISPAM_WINDOW_MINUTES phút -> bot gửi cảnh báo. Sau cảnh báo bot "thả" ANTISPAM_GRACE_SECONDS giây
// (tin giống nhau trong khoảng này không bị tính), rồi từ tin tương tự thứ 3 trở đi -> cấm chat
// (timeout Discord) ANTISPAM_TIMEOUT_MINUTES phút. Mọi người bị cảnh báo/cấm được ghi vào tab
// ANTISPAM_SHEET_NAME (cùng spreadsheet BOT_CHAT_HISTORY_SPREADSHEET_ID). Xem antiSpam/index.js.
// Bot cần quyền "Moderate Members" (Timeout members) + role bot phải CAO HƠN role người bị cấm.
const ANTISPAM_ENABLED = String(process.env.ANTISPAM_ENABLED || 'true').toLowerCase() !== 'false';
const ANTISPAM_SHEET_NAME = 'Spam Chat';
const ANTISPAM_WINDOW_MINUTES = Number(process.env.ANTISPAM_WINDOW_MINUTES) || 5;
const ANTISPAM_GRACE_SECONDS = Number(process.env.ANTISPAM_GRACE_SECONDS) || 3;
const ANTISPAM_TIMEOUT_MINUTES = Number(process.env.ANTISPAM_TIMEOUT_MINUTES) || 3;
// Tin ngắn hơn N ký tự (sau chuẩn hoá) không bị tính — tránh bắt nhầm "1", "ok", "+1" khi cả bang cùng gõ.
const ANTISPAM_MIN_LENGTH = Number(process.env.ANTISPAM_MIN_LENGTH) || 4;
// CHỈ kiểm tra spam ở các kênh này (ID cách nhau bằng dấu phẩy, ENV ANTISPAM_CHANNEL_IDS ghi đè). Kênh khác bot bỏ qua.
const ANTISPAM_CHANNEL_IDS = String(process.env.ANTISPAM_CHANNEL_IDS || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);
// Discord ID được miễn (mặc định trống: ai cũng bị tính). Admin/chủ server Discord không cho timeout được
// -> bot vẫn cảnh báo + ghi sheet, ghi rõ "không cấm được".
const ANTISPAM_EXEMPT_USER_IDS = String(process.env.ANTISPAM_EXEMPT_USER_IDS || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);
// Ghi sheet theo lô (tránh quota): gom tối đa N giây rồi ghi 1 lần.
const ANTISPAM_FLUSH_SECONDS = Number(process.env.ANTISPAM_FLUSH_SECONDS) || 20;

module.exports = {
  ANTISPAM_ENABLED,
  ANTISPAM_SHEET_NAME,
  ANTISPAM_WINDOW_MINUTES,
  ANTISPAM_GRACE_SECONDS,
  ANTISPAM_TIMEOUT_MINUTES,
  ANTISPAM_MIN_LENGTH,
  ANTISPAM_CHANNEL_IDS,
  ANTISPAM_EXEMPT_USER_IDS,
  ANTISPAM_FLUSH_SECONDS,
};
