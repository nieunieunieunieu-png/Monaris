// ===== config/chonSo.js — Kênh "Chọn số" (mỗi người chọn 1 số từ 00 đến 99, không được trùng) =====
// Thành viên nhắn 1 con số trong kênh CHON_SO_CHANNEL_ID; bot kiểm tra trùng (chỉ tính trong kênh này)
// rồi ghi vào tab CHON_SO_SHEET_NAME của sheet CHON_SO_SPREADSHEET_ID — xem chonSo/index.js + googleSheets/chonSoSheet.js.
// ENV: CHON_SO_ENABLED (mặc định bật; "0"/"false" để tắt), CHON_SO_CHANNEL_ID, CHON_SO_SPREADSHEET_ID, CHON_SO_MIN, CHON_SO_MAX.
// Phải share sheet cho email Service Account của bot với quyền Editor.
// Chỉ chứa giá trị, không chứa logic.

const CHON_SO_ENABLED = !/^(0|false|off)$/i.test(String(process.env.CHON_SO_ENABLED || '1').trim());
const CHON_SO_CHANNEL_ID = process.env.CHON_SO_CHANNEL_ID || '';
const CHON_SO_SPREADSHEET_ID = process.env.CHON_SO_SPREADSHEET_ID || process.env.GOOGLE_SHEET_ID || '';
const CHON_SO_SHEET_NAME = process.env.CHON_SO_SHEET_NAME || 'Chọn Số';
const CHON_SO_MIN = Number.isInteger(Number(process.env.CHON_SO_MIN)) && process.env.CHON_SO_MIN !== undefined && process.env.CHON_SO_MIN !== '' ? Number(process.env.CHON_SO_MIN) : 0;
const CHON_SO_MAX = Number(process.env.CHON_SO_MAX) || 99;
// Đọc lại Sheet nếu cache cũ hơn ngần này ms (để nhận cả chỉnh sửa tay trên Sheet).
const CHON_SO_CACHE_MS = Number(process.env.CHON_SO_CACHE_MS) || 30_000;
// Tin cảnh báo của bot tự xoá sau ngần này ms (mặc định 10 giây).
const CHON_SO_WARN_DELETE_MS = Number(process.env.CHON_SO_WARN_DELETE_MS) || 10_000;

module.exports = {
  CHON_SO_ENABLED,
  CHON_SO_CHANNEL_ID,
  CHON_SO_SPREADSHEET_ID,
  CHON_SO_SHEET_NAME,
  CHON_SO_MIN,
  CHON_SO_MAX,
  CHON_SO_CACHE_MS,
  CHON_SO_WARN_DELETE_MS,
};
