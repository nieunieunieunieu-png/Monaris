// ===== config/tempVoice.js — Phòng voice tạm (tự tạo khi vào kênh "Tạo phòng") =====
// Chỉ chứa giá trị, không chứa logic.

// Kênh voice "cổng": ai vào kênh này thì bot tạo 1 phòng voice riêng cho người đó
// rồi kéo họ sang phòng mới. Override qua ENV TEMP_VOICE_LOBBY_CHANNEL_ID.
const TEMP_VOICE_LOBBY_CHANNEL_ID = process.env.TEMP_VOICE_LOBBY_CHANNEL_ID || '';

// 2 tab nằm trong spreadsheet "Monaris Auto Bot" (BOT_CHAT_HISTORY_SPREADSHEET_ID,
// xem config/sheets.js) — bot tự tạo nếu chưa có.
//  - Tab tên phòng: mỗi người 1 dòng = Discord ID | Tên Discord | Tên phòng đã lưu | Dùng lần cuối
//  - Tab phòng đang mở: Channel ID | Owner ID (để khôi phục menu/quyền chủ phòng sau khi bot restart)
const TEMP_VOICE_NAMES_SHEET_NAME = 'Voice Nickname';
const TEMP_VOICE_ACTIVE_SHEET_NAME = 'Voice Tạm Đang Mở';
// Tab thống kê Phòng Đôi: mỗi cặp 1 dòng = Người A | Người B | Tổng phút ngồi chung | Lần cuối (dùng cho mon!topdoi)
const TEMP_VOICE_LOVE_STATS_SHEET_NAME = 'Phòng Đôi Thống Kê';

module.exports = {
  TEMP_VOICE_LOBBY_CHANNEL_ID,
  TEMP_VOICE_NAMES_SHEET_NAME,
  TEMP_VOICE_ACTIVE_SHEET_NAME,
  TEMP_VOICE_LOVE_STATS_SHEET_NAME,
};
