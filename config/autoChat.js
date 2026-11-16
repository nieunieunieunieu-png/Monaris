// ===== config/autoChat.js — Auto chat theo giờ: Bảng Tin Monaris, chào buổi sáng, nhắc PvP =====
// Tách khỏi config.js (file gốc giờ chỉ gộp lại các module trong thư mục config/).
// Chỉ chứa giá trị, không chứa logic.

const { REMINDER_CHANNEL_ID } = require('./schedule');

// IDLE_CHAT_CHANNEL_ID — kênh chat cố định, dùng chung cho chào buổi sáng +
// nhắc PvP (sendAutoChatMessage trong AutoReply/index.js) VÀ cho tính năng
// Bảng Tin Monaris bên dưới. Tên biến giữ nguyên (không đổi) để không phải
// đổi tên ENV IDLE_CHAT_CHANNEL_ID đã set sẵn trên Railway.
const IDLE_CHAT_CHANNEL_ID = process.env.IDLE_CHAT_CHANNEL_ID || '';

// --- Bảng Tin Monaris: tự động đăng tin lấy từ Google Sheet vào kênh
// IDLE_CHAT_CHANNEL_ID — THAY THẾ HOÀN TOÀN tính năng "idle chat" cũ (chat
// ngẫu nhiên/AI khi kênh im lặng). Logic chọn tin + gửi nằm ở
// AutoReply/index.js (checkNoticeBoard), dữ liệu tin đọc/ghi ở
// googleSheets/noticeBoardSheet.js.
//
// Lịch cố định: cứ đều đặn mỗi NOTICE_BOARD_INTERVAL_MINUTES phút đăng 1 tin
// (KHÔNG còn phụ thuộc kênh im lặng hay không như trước) — trừ khung giờ yên
// lặng bên dưới.
const NOTICE_BOARD_INTERVAL_MINUTES = 30;
const NOTICE_BOARD_INTERVAL_MS = NOTICE_BOARD_INTERVAL_MINUTES * 60 * 1000;

// Khung giờ "yên lặng" — trong khoảng này (giờ VN, [start, end)) thì KHÔNG
// tự động đăng tin dù đã đủ điều kiện ở trên, để không làm phiền lúc mọi
// người đang ngủ. Vd 1 -> 7 nghĩa là từ 01:00 tới trước 07:00.
const NOTICE_BOARD_QUIET_HOUR_START = 1;
const NOTICE_BOARD_QUIET_HOUR_END = 7;

// Kênh dùng riêng cho lệnh /testnotice — gửi thử 1 tin Bảng Tin Monaris mà
// KHÔNG đăng vào kênh thật (IDLE_CHAT_CHANNEL_ID) và không ảnh hưởng vòng
// xoay đăng tin (không đánh dấu "đã đăng"). Mặc định trùng kênh test sẵn có
// (REMINDER_CHANNEL_ID) theo đúng yêu cầu.
const NOTICE_BOARD_TEST_CHANNEL_ID = process.env.NOTICE_BOARD_TEST_CHANNEL_ID || REMINDER_CHANNEL_ID;

// Tên tab trong Google Sheet (BOT_CHAT_HISTORY_SPREADSHEET_ID, khai báo ở
// config/sheets.js) lưu danh sách tin của Bảng Tin Monaris — xem
// googleSheets/noticeBoardSheet.js.
const NOTICE_BOARD_SHEET_NAME = 'Bảng Tin Monaris';

// Tự xoá tin Bảng Tin Monaris sau NOTICE_BOARD_AUTO_DELETE_SECONDS giây kể
// từ lúc đăng (chỉ xoá TIN NHẮN trên Discord — KHÔNG đụng gì tới bản ghi
// trong Google Sheet, tin vẫn còn nguyên trong vòng xoay LRU để lần sau tới
// lượt vẫn được chọn đăng lại bình thường) — xem
// postNextNoticeBoardMessage() trong AutoReply/index.js. Đặt = 0 (hoặc giá
// trị falsy) để TẮT hẳn tính năng tự xoá này nếu sau này không muốn nữa.
const NOTICE_BOARD_AUTO_DELETE_SECONDS = 20;
const NOTICE_BOARD_AUTO_DELETE_MS = NOTICE_BOARD_AUTO_DELETE_SECONDS * 1000;


// Chào buổi sáng — mỗi ngày đúng giờ này (giờ VN), bot tự chat 1 câu chào cả
// bang do AI tạo (không dùng preset cố định, để câu
// chào tự nhiên/đa dạng hơn mỗi ngày).
const MORNING_GREETING_HOUR = 7;
const MORNING_GREETING_MINUTE = 0;

// Nhắc lịch PvP — chat thường (KHÔNG mention ai), nội dung cố định (không
// qua AI, khác chào buổi sáng), nhắc 2 khung giờ PvP mở mỗi ngày.
const PVP_OPEN_HOUR = 10;
const PVP_OPEN_MINUTE = 0;
const PVP_OPEN_MESSAGE = 'Thí Kiếm / Luận Võ mở cửa rồi kìa vô mà try hard đi !!!!';

const PVP_PEAK_HOUR = 20;
const PVP_PEAK_MINUTE = 0;
const PVP_PEAK_MESSAGE = 'Cao điểm PvP tới rồi kìa, vô đánh được cộng thêm điểm ó.';

module.exports = {
  IDLE_CHAT_CHANNEL_ID,
  NOTICE_BOARD_INTERVAL_MINUTES,
  NOTICE_BOARD_INTERVAL_MS,
  NOTICE_BOARD_QUIET_HOUR_START,
  NOTICE_BOARD_QUIET_HOUR_END,
  NOTICE_BOARD_TEST_CHANNEL_ID,
  NOTICE_BOARD_SHEET_NAME,
  NOTICE_BOARD_AUTO_DELETE_SECONDS,
  NOTICE_BOARD_AUTO_DELETE_MS,
  MORNING_GREETING_HOUR,
  MORNING_GREETING_MINUTE,
  PVP_OPEN_HOUR,
  PVP_OPEN_MINUTE,
  PVP_OPEN_MESSAGE,
  PVP_PEAK_HOUR,
  PVP_PEAK_MINUTE,
  PVP_PEAK_MESSAGE,
};
