// ===== config/activityLog.js — Nhật ký hoạt động của bot (gửi vào 1 kênh Discord) =====
// Gom MỌI hoạt động của bot (lệnh được dùng, nút/form được bấm, tin bot gửi, vote, lỗi,
// khởi động/tắt...) thành các dòng log ngắn, gửi GOM LÔ (mỗi vài giây 1 tin) vào
// ACTIVITY_LOG_CHANNEL_ID — xem activityLog/index.js.
// Mặc định gửi vào kênh 1562326481089335376 (tách khỏi kênh log bộ lọc từ khoá). Đổi bằng ENV
// ACTIVITY_LOG_CHANNEL_ID. Tắt hẳn: ACTIVITY_LOG_ENABLED=false.
const { KEYWORD_FILTER_LOG_CHANNEL_ID } = require('./keywordFilter');

const ACTIVITY_LOG_ENABLED = String(process.env.ACTIVITY_LOG_ENABLED || 'true').toLowerCase() !== 'false';
// Mặc định: MỌI log (hoạt động bot + nhật ký thành viên + cảnh báo) vào kênh này; đổi bằng ENV ACTIVITY_LOG_CHANNEL_ID (hoặc các MEMBER_*_CHANNEL_ID để tách riêng).
const ACTIVITY_LOG_CHANNEL_ID = process.env.ACTIVITY_LOG_CHANNEL_ID || '';
const ACTIVITY_LOG_FLUSH_SECONDS = Number(process.env.ACTIVITY_LOG_FLUSH_SECONDS) || 5;

// ----- Nhật ký THÀNH VIÊN (activityLog/memberLog.js, memberEvents.js, memberAlerts.js, logSearch.js) -----
// Ghi gửi / sửa / xoá tin của mọi người để chống chối ("nói rồi xoá"). Mọi thứ đều có thể tắt/chỉnh bằng ENV:
//   MEMBER_LOG_ENABLED=false      : tắt hẳn nhật ký thành viên (mặc định bật; vẫn cần ACTIVITY_LOG_ENABLED).
//   MEMBER_LOG_CREATE=true        : đăng cả dòng "gửi tin" lên Discord. Mặc định TẮT: kênh chỉ hiện tin SỬA / XOÁ (Sheet vẫn lưu mọi tin để lấy nguyên văn khi bị xoá/sửa).
//   MEMBER_LOG_VOICE=false        : tắt ghi ra/vào/chuyển voice của thành viên.
//   MEMBER_LOG_REACTIONS=false    : tắt ghi thả/gỡ reaction (các tin vote scrim/bang chiến đã có log riêng nên không ghi lại ở đây).
//   MEMBER_LOG_MEMBERS=false      : tắt ghi vào/rời server, kick/ban, đổi biệt danh/avatar, đổi role, timeout.
//   MEMBER_LOG_CHANNELS=false     : tắt ghi tạo/xoá/đổi tên/đổi mô tả kênh.
//   MEMBER_LOG_CACHE_MAX / MEMBER_LOG_CACHE_HOURS : số tin / số giờ giữ trong RAM để lấy nguyên văn (mặc định 10000 / 48).
//   MEMBER_LOG_MAX_CHARS          : số ký tự tối đa ghi cho mỗi tin trên Discord (mặc định 1500; Sheet lưu tối đa 2000).
//   MEMBER_LOG_IGNORE_CHANNEL_IDS : kênh KHÔNG ghi (cách nhau dấu phẩy).
// Tách kênh (mặc định tất cả về ACTIVITY_LOG_CHANNEL_ID — nên tách để log tin xoá/sửa không chìm):
//   MEMBER_LOG_CHANNEL_ID         : gửi / sửa / xoá tin nhắn.
//   MEMBER_SERVER_LOG_CHANNEL_ID  : voice, reaction, vào/rời, ban, role, biệt danh, kênh (mặc định = MEMBER_LOG_CHANNEL_ID).
//   MEMBER_ALERT_CHANNEL_ID       : cảnh báo (mặc định = MEMBER_LOG_CHANNEL_ID). MEMBER_ALERT_PING_ROLE_ID: role được ping khi có cảnh báo (trống = không ping).
// Cảnh báo (memberAlerts.js): MEMBER_ALERT_ENABLED=false để tắt; MEMBER_ALERT_MIN_CHARS (80) = tin tự xoá dài từ ngần này ký tự;
//   MEMBER_ALERT_DELETE_COUNT (3) tin tự xoá trong MEMBER_ALERT_WINDOW_MINUTES (10) phút; MEMBER_ALERT_COOLDOWN_MINUTES (10) = cảnh báo lại cùng 1 người/loại.
// Lưu bền vững vào Google Sheet (googleSheets/memberLogSheet.js), tab "Nhật Ký Tin Nhắn":
//   MEMBER_LOG_SHEET_ENABLED=false : tắt lưu Sheet (khi đó bot restart là mất nguyên văn các tin chưa xoá).
//   MEMBER_LOG_SPREADSHEET_ID      : mặc định = BOT_CHAT_HISTORY_SPREADSHEET_ID.
//   MEMBER_LOG_SHEET_FLUSH_SECONDS : ghi gom lô mỗi N giây (mặc định 20).
//   MEMBER_LOG_SHEET_KEEP_DAYS     : tự xoá dòng cũ hơn N ngày (mặc định 90; 0 = giữ mãi).
const { BOT_CHAT_HISTORY_SPREADSHEET_ID } = require('./sheets');

const bool = (v, def) => (v === undefined || String(v).trim() === '' ? def : !/^(0|false|off|no)$/i.test(String(v).trim()));
const num = (v, def, min = 0) => (Number.isFinite(Number(v)) && String(v || '').trim() !== '' ? Math.max(min, Number(v)) : def);
const ids = (raw) => new Set(String(raw || '').split(/[,\s]+/).map((x) => x.trim()).filter(Boolean));

const MEMBER_LOG_ENABLED = bool(process.env.MEMBER_LOG_ENABLED, true);
const MEMBER_LOG_CREATE = bool(process.env.MEMBER_LOG_CREATE, false);
const MEMBER_LOG_VOICE = bool(process.env.MEMBER_LOG_VOICE, true);
const MEMBER_LOG_REACTIONS = bool(process.env.MEMBER_LOG_REACTIONS, true);
const MEMBER_LOG_MEMBERS = bool(process.env.MEMBER_LOG_MEMBERS, true);
const MEMBER_LOG_CHANNELS = bool(process.env.MEMBER_LOG_CHANNELS, true);
const MEMBER_LOG_CACHE_MAX = num(process.env.MEMBER_LOG_CACHE_MAX, 10000, 100);
const MEMBER_LOG_CACHE_HOURS = num(process.env.MEMBER_LOG_CACHE_HOURS, 48, 1);
const MEMBER_LOG_MAX_CHARS = Math.min(3000, num(process.env.MEMBER_LOG_MAX_CHARS, 1500, 100));
const MEMBER_LOG_IGNORE_CHANNEL_IDS = ids(process.env.MEMBER_LOG_IGNORE_CHANNEL_IDS);

const MEMBER_LOG_CHANNEL_ID = process.env.MEMBER_LOG_CHANNEL_ID || ACTIVITY_LOG_CHANNEL_ID;
const MEMBER_SERVER_LOG_CHANNEL_ID = process.env.MEMBER_SERVER_LOG_CHANNEL_ID || MEMBER_LOG_CHANNEL_ID;
const MEMBER_ALERT_CHANNEL_ID = process.env.MEMBER_ALERT_CHANNEL_ID || MEMBER_LOG_CHANNEL_ID;
const MEMBER_ALERT_PING_ROLE_ID = process.env.MEMBER_ALERT_PING_ROLE_ID || '';
const MEMBER_ALERT_ENABLED = bool(process.env.MEMBER_ALERT_ENABLED, true);
const MEMBER_ALERT_MIN_CHARS = num(process.env.MEMBER_ALERT_MIN_CHARS, 80, 1);
const MEMBER_ALERT_DELETE_COUNT = num(process.env.MEMBER_ALERT_DELETE_COUNT, 3, 2);
const MEMBER_ALERT_WINDOW_MINUTES = num(process.env.MEMBER_ALERT_WINDOW_MINUTES, 10, 1);
const MEMBER_ALERT_COOLDOWN_MINUTES = num(process.env.MEMBER_ALERT_COOLDOWN_MINUTES, 10, 1);

const MEMBER_LOG_SHEET_ENABLED = bool(process.env.MEMBER_LOG_SHEET_ENABLED, true);
const MEMBER_LOG_SPREADSHEET_ID = process.env.MEMBER_LOG_SPREADSHEET_ID || BOT_CHAT_HISTORY_SPREADSHEET_ID;
const MEMBER_LOG_SHEET_NAME = 'Nhật Ký Tin Nhắn';
const MEMBER_LOG_SHEET_FLUSH_SECONDS = num(process.env.MEMBER_LOG_SHEET_FLUSH_SECONDS, 20, 5);
const MEMBER_LOG_SHEET_KEEP_DAYS = num(process.env.MEMBER_LOG_SHEET_KEEP_DAYS, 90, 0);

// Mọi kênh mà bot dùng để ghi log: tin trong các kênh này không bị ghi lại và không tính EXP.
const MEMBER_LOG_ALL_CHANNEL_IDS = new Set(
  [ACTIVITY_LOG_CHANNEL_ID, KEYWORD_FILTER_LOG_CHANNEL_ID, MEMBER_LOG_CHANNEL_ID, MEMBER_SERVER_LOG_CHANNEL_ID, MEMBER_ALERT_CHANNEL_ID].filter(Boolean)
);

module.exports = {
  ACTIVITY_LOG_ENABLED,
  ACTIVITY_LOG_CHANNEL_ID,
  ACTIVITY_LOG_FLUSH_SECONDS,
  MEMBER_LOG_ENABLED,
  MEMBER_LOG_CREATE,
  MEMBER_LOG_VOICE,
  MEMBER_LOG_REACTIONS,
  MEMBER_LOG_MEMBERS,
  MEMBER_LOG_CHANNELS,
  MEMBER_LOG_CACHE_MAX,
  MEMBER_LOG_CACHE_HOURS,
  MEMBER_LOG_MAX_CHARS,
  MEMBER_LOG_IGNORE_CHANNEL_IDS,
  MEMBER_LOG_CHANNEL_ID,
  MEMBER_SERVER_LOG_CHANNEL_ID,
  MEMBER_ALERT_CHANNEL_ID,
  MEMBER_ALERT_PING_ROLE_ID,
  MEMBER_ALERT_ENABLED,
  MEMBER_ALERT_MIN_CHARS,
  MEMBER_ALERT_DELETE_COUNT,
  MEMBER_ALERT_WINDOW_MINUTES,
  MEMBER_ALERT_COOLDOWN_MINUTES,
  MEMBER_LOG_SHEET_ENABLED,
  MEMBER_LOG_SPREADSHEET_ID,
  MEMBER_LOG_SHEET_NAME,
  MEMBER_LOG_SHEET_FLUSH_SECONDS,
  MEMBER_LOG_SHEET_KEEP_DAYS,
  MEMBER_LOG_ALL_CHANNEL_IDS,
};
