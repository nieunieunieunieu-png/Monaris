// ===== config/loveRoom.js — Phòng Đôi (voice tạm chỉ dành cho 2 người yêu nhau + 1 bot nhạc) =====
// Chỉ chứa giá trị, không chứa logic. Logic nằm trong tempVoice/index.js (dùng chung khung với phòng voice tạm thường).
// ENV (đều tuỳ chọn): LOVE_ROOM_ENABLED, LOVE_ROOM_LOBBY_CHANNEL_ID, MUSIC_BOT_ROLE_ID

const num = (v, def, { min = -Infinity, int = false } = {}) => {
  const n = Number(v);
  if (v === undefined || v === '' || !Number.isFinite(n) || n < min) return def;
  return int ? Math.floor(n) : n;
};

// CÔNG TẮC TỔNG: Phòng Đôi đang TẮT (mặc định). Tắt = kênh cổng Phòng Đôi không tạo phòng, không tự phát hiện cặp đôi,
// không đếm thống kê, `mon!topdoi` báo đang tắt. Muốn bật lại: đặt ENV LOVE_ROOM_ENABLED=true.
const LOVE_ROOM_ENABLED = String(process.env.LOVE_ROOM_ENABLED || '').trim().toLowerCase() === 'true';

// Kênh voice "cổng" riêng cho Phòng Đôi: ai vào kênh này -> bot tạo 1 phòng voice chỉ-2-người kèm 1 slot cho bot nhạc.
const LOVE_ROOM_LOBBY_CHANNEL_ID = process.env.LOVE_ROOM_LOBBY_CHANNEL_ID || '';

// Role gán cho (các) bot phát nhạc — bot mang role này luôn thấy & vào được Phòng Đôi dù phòng đang khoá.
const MUSIC_BOT_ROLE_ID = process.env.MUSIC_BOT_ROLE_ID || '';

// Luôn thêm trước tên phòng để nhận biết đây là Phòng Đôi (không thể tắt/đổi qua đổi tên).
const LOVE_ROOM_PREFIX = '💕 ';

// Giới hạn cứng: tối đa 2 người thật (chủ phòng + 1 người được mời) + 1 bot nhạc.
const LOVE_ROOM_MAX_HUMANS = 2;
const LOVE_ROOM_SLOT_LIMIT = LOVE_ROOM_MAX_HUMANS + 1; // +1 cho bot nhạc, dùng làm userLimit của kênh

// ----- Tự nhận diện cặp đôi ngồi chung trong phòng thường -----
// 1 phòng voice tạm (bất kỳ, kể cả phòng thường) MÀ đúng 2 người thật ngồi chung LIÊN TỤC quá
// LOVE_ROOM_AUTO_DETECT_MINUTES phút (vẫn cho phép có thêm 1 bot, vd bot nhạc) -> bot TỰ:
//   - thêm tiền tố 💕 vào tên phòng (không đổi phần chữ còn lại)
//   - khoá phòng lại y như Phòng Đôi thường (chỉ 2 người đó + bot nhạc vào được)
const LOVE_ROOM_AUTO_DETECT_MINUTES = num(process.env.LOVE_ROOM_AUTO_DETECT_MINUTES, 5, { min: 1, int: true });
const LOVE_ROOM_AUTO_DETECT_MS = LOVE_ROOM_AUTO_DETECT_MINUTES * 60_000;
const LOVE_ROOM_AUTO_CHECK_MS = 60_000; // tần suất quét các phòng đang mở để bắt cặp ngồi chung

module.exports = {
  LOVE_ROOM_ENABLED,
  LOVE_ROOM_LOBBY_CHANNEL_ID,
  MUSIC_BOT_ROLE_ID,
  LOVE_ROOM_PREFIX,
  LOVE_ROOM_MAX_HUMANS,
  LOVE_ROOM_SLOT_LIMIT,
  LOVE_ROOM_AUTO_DETECT_MINUTES,
  LOVE_ROOM_AUTO_DETECT_MS,
  LOVE_ROOM_AUTO_CHECK_MS,
};
