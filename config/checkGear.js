// ===== config/checkGear.js — Check Gear — kênh, lớp, giới hạn ảnh, Google Sheet riêng + tab theo phiên bản =====
// Tách khỏi config.js (file gốc giờ chỉ gộp lại các module trong thư mục config/).
// Chỉ chứa giá trị, không chứa logic.

// --- Check Gear: kênh bot đăng 1 tin CỐ ĐỊNH ("Check gear phiên bản
// x.y.z" + nút bấm) — mỗi lần deploy lại bot, tin cũ trong kênh này bị xoá
// và đăng lại tin mới, nhưng phiên bản game đang check gear (CURRENT
// VERSION, ví dụ 1.3.1/1.3.2/1.3.3) vẫn được nhớ lại (lưu trong sheet
// "BotState", xem checkGearData trong state.js + googleSheets/stateSheet.js)
// — KHÔNG bị reset về rỗng mỗi lần deploy. Luồng bấm nút (select class,
// modal nhập ingame, nhận ảnh, đăng tin nhắn vào kênh chat...).
// Mặc định = kênh Check Gear theo phiên bản riêng (ENV CHECK_GEAR_CHANNEL_ID). Người dùng vẫn gửi ảnh gear THẲNG
// vào kênh này sau khi chọn Check Gear ở menu (bot chỉ xử lý ảnh của người đang
// có phiên chờ, xoá ảnh ngay sau khi đăng bài).
const CHECK_GEAR_CHANNEL_ID = process.env.CHECK_GEAR_CHANNEL_ID || '';

// Kênh CHAT nhận bài check gear — thay cho kênh Forum cũ (không còn tạo Forum
// Post/thread nữa). Mỗi lượt check gear = 1 TIN NHẮN THƯỜNG do bot gửi vào
// kênh này, nội dung đúng form "<Ingame> - <Class> - <Phiên bản>" kèm ảnh gear
// đính kèm. Link tin nhắn (message.url) được lưu vào cột "Link Thread Đã
// Đăng" của tab tracking như cũ. QUAN TRỌNG: bot cần quyền View Channel, Send
// Messages, Attach Files ở kênh này; và Manage Messages ở CHECK_GEAR_CHANNEL_ID
// (để tự xoá tin ảnh tạm sau khi đăng xong). Tính năng chủ đề thảo luận
// (checkGear/discussion.js) cần thêm ở kênh chat: Create Public Threads, Send
// Messages in Threads, Manage Messages. KHÔNG được thêm kênh này vào
// utils/channelReset.js — đó là kênh chat thật, bị dọn sạch mỗi lần deploy là
// mất hết bài check gear.
const CHECK_GEAR_POST_CHANNEL_ID = process.env.CHECK_GEAR_POST_CHANNEL_ID || '';

// Có người reply vào bài check gear -> bot tạo chủ đề (thread) ngay từ bài đó,
// tag người đăng + người phản hồi và CHUYỂN tin phản hồi vào chủ đề (xem
// checkGear/discussion.js). true (mặc định) = xoá tin phản hồi gốc trong kênh
// sau khi đã chuyển, để kênh không bị trôi; đặt biến môi trường
// CHECK_GEAR_DELETE_MOVED_REPLY=false nếu muốn giữ lại tin gốc. Xoá được cần
// bot có quyền Manage Messages ở CHECK_GEAR_POST_CHANNEL_ID.
const CHECK_GEAR_DELETE_MOVED_REPLY = process.env.CHECK_GEAR_DELETE_MOVED_REPLY !== 'false';

// 8 Class hiển thị trong Select Menu + ghi vào tin nhắn/tab tracking. (Trước
// đây là object Class -> id tag Forum; Forum đã bỏ nên chỉ còn danh sách tên.)
const CHECK_GEAR_CLASSES = [
  'Long Ngâm',
  'Huyết Hà',
  'Tố Vấn',
  'Cửu Linh',
  'Toái Mộng',
  'Thiết Y',
  'Thần Tương',
  'Huyền Cơ',
];

// Số ảnh tối thiểu/tối đa chấp nhận cho 1 lượt gửi ảnh check gear.
const CHECK_GEAR_MIN_IMAGES = 1;
const CHECK_GEAR_MAX_IMAGES = 10;

// Timeout chờ người dùng gửi ảnh sau khi đã chọn Class + nhập Ingame (hoặc
// sau khi bấm "Cập Nhật Ảnh") — tự huỷ lượt đó nếu quá hạn, tránh treo vô
// hạn nếu người dùng quên/thoát app giữa chừng.
const CHECK_GEAR_IMAGE_TIMEOUT_MS = 5 * 60 * 1000;

// Google Sheet RIÊNG để lưu dữ liệu Check Gear (tab tracking + các tab
// snapshot theo từng phiên bản) — KHÔNG còn dùng chung SRC_IMAGE_SPREADSHEET_ID
// (sheet "Bang") như trước nữa, theo yêu cầu người dùng. Tab "Bang" vẫn là
// nguồn dữ liệu ĐỌC (snapshotBangToVersionTab đọc "Bang" từ
// SRC_IMAGE_SPREADSHEET_ID) nhưng kết quả snapshot + tab tracking giờ được
// GHI vào sheet này.
const CHECK_GEAR_SPREADSHEET_ID = process.env.CHECK_GEAR_SPREADSHEET_ID || process.env.GOOGLE_SHEET_ID || '';

// Tab theo dõi "những người đã gửi" — MỖI PHIÊN BẢN 1 TAB RIÊNG trong
// CHECK_GEAR_SPREADSHEET_ID, tên = CHECK_GEAR_TRACKING_TAB_PREFIX + phiên bản
// (vd "NTH _ Check Gear 1.3.1"). Mỗi dòng: Discord ID | Ingame | Class |
// Phiên Bản | Link Thread Đã Đăng | Thời Gian. Dùng để lưu vết ai đã check gear
// phiên bản đó + link thread ảnh gear, tránh tạo trùng thread cho 1 người/1
// phiên bản. PHẢI khớp CHECK_GEAR_TRACKING_TAB_PREFIX bên repo Monaris Admin.
const CHECK_GEAR_TRACKING_TAB_PREFIX = 'NTH _ Check Gear ';

// Tên tab tracking CŨ (trước đây dồn mọi phiên bản vào 1 tab chung) — chỉ còn
// dùng để tự chuyển dữ liệu cũ sang các tab theo phiên bản (xem
// checkGear/sheet.js::migrateLegacyTrackingTab), KHÔNG ghi vào đây nữa.
const CHECK_GEAR_TRACKING_SHEET_NAME = 'NTH _ Check Gear';

module.exports = {
  CHECK_GEAR_CHANNEL_ID,
  CHECK_GEAR_POST_CHANNEL_ID,
  CHECK_GEAR_DELETE_MOVED_REPLY,
  CHECK_GEAR_CLASSES,
  CHECK_GEAR_MIN_IMAGES,
  CHECK_GEAR_MAX_IMAGES,
  CHECK_GEAR_IMAGE_TIMEOUT_MS,
  CHECK_GEAR_SPREADSHEET_ID,
  CHECK_GEAR_TRACKING_TAB_PREFIX,
  CHECK_GEAR_TRACKING_SHEET_NAME,
};
