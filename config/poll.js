// ===== Cấu hình mon!poll: lưu danh sách người bình chọn (kèm Ingame, Hệ phái) vào Google Sheet =====
// Phải share sheet cho Service Account của bot (Editor). ENV: POLL_SPREADSHEET_ID. Mỗi poll 1 tab, tên tab = tiêu đề poll.
const POLL_SPREADSHEET_ID = process.env.POLL_SPREADSHEET_ID || process.env.GOOGLE_SHEET_ID || '';

module.exports = { POLL_SPREADSHEET_ID };
