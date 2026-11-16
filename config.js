// Tất cả các hằng số cấu hình của bot — không chứa logic, chỉ chứa giá trị.
//
// File này CHỈ gộp lại các module trong thư mục config/ (tách theo nhóm chức
// năng) và export ĐÚNG tập key như trước đây, nên mọi nơi khác vẫn
// `require('../config')` / `require('./config')` bình thường — không cần sửa.
// Muốn sửa 1 hằng số: tìm đúng nhóm trong bảng dưới rồi sửa ở file tương ứng.
//
//   - config/core.js             : Định danh server/role/user, emoji, kênh lẻ và hằng số dùng chung toàn bot
//   - config/sheets.js           : Google Sheet chính: tab vote/state/broadcast + spreadsheet lịch sử chat, Auto DM, ChatGlobal, quan hệ
//   - config/sourceSheets.js     : Google Sheet NGUỒN: chụp ảnh, Nhật Ký Đội Hình, DKScrim, /where, tab Bang, Cập nhật phái
//   - config/schedule.js         : Kênh nhắc lịch, giờ các sự kiện định kỳ (Bang Chiến, GCMN, Thứ 5, Box) và auto chat tình hình vote
//   - config/autoChat.js         : Auto chat theo giờ: Bảng Tin Monaris, chào buổi sáng, nhắc PvP
//   - config/ai.js               : AI auto-reply: Gemini/Serper, cụm từ gọi bot, cooldown, người tạo bot
//   - config/hub.js              : Kênh Hub (menu tính năng), bảo vệ kênh, Thư Viện Hệ Phái, Hòm Thư Góp Ý
//   - config/chonTeam.js         : Nút "Chọn Team" ở menu Hub — sheet đích, danh sách 5 team, số người đi cùng tối đa
//   - config/chonSo.js           : Kênh "Chọn số" 1–80 không trùng — kênh, sheet đích, khoảng số
//   - config/thiKiemVinhDanh.js  : Đua Rank Thí Kiếm Thiên Hạ + Sảnh Vinh Danh Bang Chiến
//   - config/bcstat.js           : /bcstat — tổng hợp chỉ số Bang Chiến (các tab Google Sheet + timeout chờ ảnh)
//   - config/checkGear.js        : Check Gear — kênh, lớp, giới hạn ảnh, Google Sheet riêng + tab theo phiên bản
//   - config/highlight.js        : "Highlight Nghịch Thuỷ Hàn" — kênh quét link Youtube + tên tab Google Sheet
//   - config/nmImage.js          : Lưu/gửi lại ảnh theo tên — folder Drive + sheet "Cây Thư Mục"
//   - config/level.js            : Hệ thống Level/EXP — sheet, danh sách hoạt động + EXP, kênh thảo luận, cooldown
//   - config/profile.js          : Hồ Sơ Cá Nhân — ảnh bìa/avatar/biệt danh trên thẻ /level (cấp tối thiểu, cooldown đổi ảnh)
//   - config/keywordFilter.js    : Bộ lọc từ khoá nhạy cảm — tab sheet, kênh log, danh sách miễn lọc
//   - config/antiSpam.js         : Chống spam tin giống nhau — cảnh báo, cấm chat (timeout), tab sheet "Spam Chat"
//   - config/activityLog.js      : Nhật ký hoạt động của bot — kênh log, bật/tắt, chu kỳ gửi gom lô
//   - config/voiceStats.js       : Thống kê voice Bang Chiến/Scrim (danh mục voice, tab sheet) + Lịch Bang
//   - config/tempVoice.js        : Phòng voice tạm tự tạo (kênh cổng, tab sheet tên phòng đã lưu)
//   - config/memberInfo.js       : Nút Hub "Cập Nhật Thông Tin" — danh sách Class, giới hạn Ingame, cột thời gian (lưu vào tab "Cập nhật phái")
//   - config/welcome.js          : Thành viên mới vào server — tự gán role + gửi ảnh chào
//   - config/knowledge.js        : Kho kiến thức bang cho AI (tab "Kiến thức bang": AI chỉ trả lời kiến thức game theo kho)
//   - config/backup.js           : Sao lưu Google Sheet hằng ngày sang folder Drive (BACKUP_DRIVE_FOLDER_ID)
//   - config/healthCheck.js      : Kiểm tra sức khỏe tự động mỗi ngày (Sheet/Cloudinary/Gemini) báo vào kênh admin
//   - config/congDuc.js          : Farm Công Đức — ngồi voice nghe gõ mõ, thắp/đốt hương, Cảnh Giới, Cửa hàng Công Đức
//   - config/featureFlags.js     : Công tắc bật/tắt tính năng vui/giải trí (tab Sheet "Công Tắc Tính Năng", chỉnh trên web Monaris Admin)
//   - config/loveRoom.js         : Phòng Đôi — kênh cổng riêng, role bot nhạc, giới hạn 2 người, cơ chế "cho thuê" trừ Công Đức/phút
//   - config/teamRole.js         : Role team cho bảng xếp đội hình — 5 role dùng chung 3 đội hình, tab "Team Role", chốt an toàn, số lệnh song song

module.exports = {
  ...require('./config/branding'),
  ...require('./config/core'),
  ...require('./config/sheets'),
  ...require('./config/sourceSheets'),
  ...require('./config/schedule'),
  ...require('./config/autoChat'),
  ...require('./config/ai'),
  ...require('./config/hub'),
  ...require('./config/chonTeam'),
  ...require('./config/chonSo'),
  ...require('./config/poll'),
  ...require('./config/thiKiemVinhDanh'),
  ...require('./config/bcstat'),
  ...require('./config/checkGear'),
  ...require('./config/highlight'),
  ...require('./config/nmImage'),
  ...require('./config/level'),
  ...require('./config/profile'),
  ...require('./config/keywordFilter'),
  ...require('./config/antiSpam'),
  ...require('./config/activityLog'),
  ...require('./config/voiceStats'),
  ...require('./config/tempVoice'),
  ...require('./config/welcome'),
  ...require('./config/memberInfo'),
  ...require('./config/knowledge'),
  ...require('./config/backup'),
  ...require('./config/healthCheck'),
  ...require('./config/pickRole'),
  ...require('./config/congDuc'),
  ...require('./config/loveRoom'),
  ...require('./config/featureFlags'),
  ...require('./config/shop'),
  ...require('./config/teamRole'),
};
