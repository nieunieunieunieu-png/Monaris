// ===== config/healthCheck.js — Kiểm tra sức khỏe tự động mỗi ngày (monitoring/healthCheck.js) =====
// Mỗi ngày bot thử đọc các tab Sheet quan trọng, kiểm tra Cloudinary + Gemini còn quota rồi báo vào kênh admin.
// ENV (Render):
//   HEALTH_CHECK_CHANNEL_ID : kênh admin nhận báo cáo (mặc định = MEMORY_ALERT_CHANNEL_ID nếu có). Trống = TẮT tính năng.
//   HEALTH_CHECK_HOUR       : giờ chạy (giờ VN, 0-23, mặc định 8). HEALTH_CHECK_MINUTE: phút (mặc định 0).
//   HEALTH_CHECK_ONLY_PROBLEMS=on : ngày nào mọi thứ ổn thì KHÔNG gửi báo cáo (mặc định vẫn gửi 1 tin xanh mỗi ngày).
//   HEALTH_CHECK_AUTO=off   : tắt chạy tự động (vẫn dùng được lệnh /healthcheck).
//   MEMORY_ALERT_CHANNEL_ID : kênh cảnh báo RAM (memoryWatcher) — trước đây chưa được khai báo nên cảnh báo RAM không gửi; giờ mặc định = kênh admin ở trên.
const HEALTH_CHECK_CHANNEL_ID = process.env.HEALTH_CHECK_CHANNEL_ID || process.env.MEMORY_ALERT_CHANNEL_ID || '';
const MEMORY_ALERT_CHANNEL_ID = process.env.MEMORY_ALERT_CHANNEL_ID || HEALTH_CHECK_CHANNEL_ID;
const HEALTH_CHECK_AUTO = String(process.env.HEALTH_CHECK_AUTO || 'on').toLowerCase() !== 'off';
const hour = Number(process.env.HEALTH_CHECK_HOUR);
const minute = Number(process.env.HEALTH_CHECK_MINUTE);
const HEALTH_CHECK_HOUR = Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : 8;
const HEALTH_CHECK_MINUTE = Number.isInteger(minute) && minute >= 0 && minute <= 59 ? minute : 0;
const HEALTH_CHECK_ONLY_PROBLEMS = String(process.env.HEALTH_CHECK_ONLY_PROBLEMS || 'off').toLowerCase() === 'on';
// Ngưỡng cảnh báo dung lượng/credit Cloudinary (%): >= WARN thì 🟡, >= FAIL thì 🔴.
const CLOUDINARY_WARN_PERCENT = 80;
const CLOUDINARY_FAIL_PERCENT = 95;

module.exports = {
  HEALTH_CHECK_CHANNEL_ID,
  MEMORY_ALERT_CHANNEL_ID,
  HEALTH_CHECK_AUTO,
  HEALTH_CHECK_HOUR,
  HEALTH_CHECK_MINUTE,
  HEALTH_CHECK_ONLY_PROBLEMS,
  CLOUDINARY_WARN_PERCENT,
  CLOUDINARY_FAIL_PERCENT,
};
