// ===== utils/numberFormat.js — định dạng số dùng chung (thẻ /level, /hoso, embed, báo cáo) =====
// Game tính chỉ số theo "vạn" (1 vạn = 10.000): từ 10.000 trở lên hiện theo vạn (vd 22.350.000 -> "2.235 vạn", 15.000 -> "1,5 vạn"),
// dưới 10.000 giữ nguyên số. CHỈ dùng để HIỂN THỊ — số ghi Sheet / log admin giữ số đầy đủ.
const NUM = (n) => Number(n).toLocaleString('vi-VN');

function fmtVan(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  if (Math.abs(v) < 10000) return NUM(Math.round(v * 10) / 10);
  return `${NUM(Math.round((v / 10000) * 100) / 100)} vạn`;
}

// Phút -> "45 phút" / "3 giờ 20 phút".
function formatMinutes(total) {
  const m = Math.round(total);
  if (m < 60) return `${m} phút`;
  return `${Math.floor(m / 60)} giờ ${m % 60} phút`;
}

module.exports = { NUM, fmtVan, formatMinutes };
