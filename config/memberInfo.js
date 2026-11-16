// ===== config/memberInfo.js — "Cập Nhật Thông Tin" thành viên (nút Hub) lưu vào tab "Cập nhật phái" =====
// Chỉ chứa giá trị, không chứa logic. Tab/cột của sheet khai báo ở config/sourceSheets.js
// (UPDATE_PROFILE_SHEET_NAME / UPDATE_PROFILE_SHEET_COLUMNS: A = Discord ID, B = Tên người dùng, D = Ingame, E = Hệ Phái).

// 8 Class hiện trong ô chọn (đúng thứ tự yêu cầu). Ghi vào cột E đúng chữ này.
const MEMBER_INFO_CLASSES = ['Cửu Linh', 'Huyết Hà', 'Thiết Y', 'Tố Vấn', 'Thần Tương', 'Huyền Cơ', 'Long Ngâm', 'Toái Mộng'];

// Độ dài tối đa tên Ingame (ký tự).
const MEMBER_INFO_INGAME_MAX_LENGTH = 30;

// Cột "Cập nhật lúc": bot tự tìm theo tiêu đề dòng 1 (khớp 1 trong các từ này, không phân biệt hoa/thường).
// Không thấy cột nào khớp thì dùng cột dưới đây (và ghi tiêu đề "Cập nhật lúc" nếu ô tiêu đề đang trống).
const MEMBER_INFO_TIME_HEADER_PATTERN = /cập nhật lúc|cập nhật|thời gian|dấu thời gian|timestamp/i;
const MEMBER_INFO_TIME_FALLBACK_COLUMN = 'F';
const MEMBER_INFO_TIME_FALLBACK_HEADER = 'Cập nhật lúc';

// Giờ Việt Nam (UTC+7, không có giờ mùa hè) — dùng để ghi thời gian cập nhật vào sheet.
const MEMBER_INFO_UTC_OFFSET_HOURS = 7;

// Chống bấm liên tục (mỗi người), ms.
const MEMBER_INFO_COOLDOWN_MS = 5000;

module.exports = {
  MEMBER_INFO_CLASSES,
  MEMBER_INFO_INGAME_MAX_LENGTH,
  MEMBER_INFO_TIME_HEADER_PATTERN,
  MEMBER_INFO_TIME_FALLBACK_COLUMN,
  MEMBER_INFO_TIME_FALLBACK_HEADER,
  MEMBER_INFO_UTC_OFFSET_HOURS,
  MEMBER_INFO_COOLDOWN_MS,
};
