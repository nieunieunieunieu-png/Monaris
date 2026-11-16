// ===== config/chonTeam.js — Nút "Chọn Team" trong menu Hub =====
// Thành viên chọn 1 trong 5 team muốn đi (+ tối đa 2 team DỰ PHÒNG, không bắt buộc)
// + chọn thêm tối đa 2 người đi cùng
// (chọn bằng ô chọn thành viên Discord, bot tự dò Ingame theo Discord ID trong tab "Bang" — xem googleSheets/memberSheet.js).
// Kết quả ghi vào tab CHON_TEAM_SHEET_NAME của sheet CHON_TEAM_SPREADSHEET_ID
// (mỗi người 1 dòng, chọn lại = ghi đè dòng cũ) — xem googleSheets/chonTeamSheet.js.
// Chỉ chứa giá trị, không chứa logic.

const CHON_TEAM_SPREADSHEET_ID = process.env.CHON_TEAM_SPREADSHEET_ID || process.env.GOOGLE_SHEET_ID || '';
const CHON_TEAM_SHEET_NAME = 'Chọn Team';

// Thứ tự khai báo = thứ tự hiển thị trong menu chọn. value PHẢI duy nhất.
const CHON_TEAM_OPTIONS = [
  { value: 'mid', label: 'Team Mid', leader: 'Ji Yuu' },
  { value: 'canh_trai', label: 'Team Cánh Trái', leader: 'Ji Zong' },
  { value: 'canh_phai', label: 'Team Cánh Phải', leader: 'Ji Rish' },
  { value: 'flex', label: 'Team Flex', leader: 'Ji Mei' },
  { value: 'luong', label: 'Team Lương', leader: 'Thắng Cỏ' },
];

// Số người đi cùng tối đa (ngoài chính người chọn).
const CHON_TEAM_MAX_PARTNERS = 2;
// Số team DỰ PHÒNG tối đa (ngoài team chính; không bắt buộc, bỏ trống thì người xếp team tự chọn).
const CHON_TEAM_MAX_BACKUPS = 2;
// Class được chọn thêm TUYỆT KỸ (so khớp không phân biệt dấu / hoa thường với cột Class ở tab "Bang").
const CHON_TEAM_TUYET_KY_CLASS = 'Tố Vấn';
// Tuyệt kỹ muốn mang (Tố Vấn chọn 1). value PHẢI duy nhất.
const CHON_TEAM_TUYET_KY_OPTIONS = [
  { value: 'truong_ca', label: 'Trường Ca' },
  { value: 'no_phai', label: 'Nộ Phái' },
];
// Phiên chọn (chưa bấm Xác nhận) hết hạn sau ngần này phút.
const CHON_TEAM_SESSION_MINUTES = 15;

module.exports = {
  CHON_TEAM_SPREADSHEET_ID,
  CHON_TEAM_SHEET_NAME,
  CHON_TEAM_OPTIONS,
  CHON_TEAM_MAX_PARTNERS,
  CHON_TEAM_MAX_BACKUPS,
  CHON_TEAM_SESSION_MINUTES,
  CHON_TEAM_TUYET_KY_CLASS,
  CHON_TEAM_TUYET_KY_OPTIONS,
};
