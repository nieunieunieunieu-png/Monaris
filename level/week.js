// ===== level/week.js — mốc tuần của hệ thống Level (giờ VN, tuần chạy từ 00:00 Thứ Hai đến hết Chủ Nhật) =====
// Khoá tuần = ngày của Thứ Hai đầu tuần theo giờ VN, dạng "YYYY-MM-DD" (lưu ở cột "Tuần" của tab Level).
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

function weekKey(ms = Date.now()) {
  const vn = new Date(ms + VN_OFFSET_MS);
  const back = (vn.getUTCDay() + 6) % 7; // Thứ Hai = 0 ... Chủ Nhật = 6
  return new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate() - back)).toISOString().slice(0, 10);
}

// dow: 0 = Chủ Nhật ... 6 = Thứ Bảy (giờ VN).
function vnParts(ms = Date.now()) {
  const vn = new Date(ms + VN_OFFSET_MS);
  return { dow: vn.getUTCDay(), hour: vn.getUTCHours(), minute: vn.getUTCMinutes() };
}

// EXP tuần hiệu lực của 1 thành viên: dòng thuộc tuần cũ (chưa kịp reset trên sheet) coi như 0.
function effectiveWeekExp(member, key = weekKey()) {
  return member && member.weekKey === key ? Number(member.weekExp) || 0 : 0;
}

module.exports = { weekKey, vnParts, effectiveWeekExp };
