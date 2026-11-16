// ===== hoso/frame/shop_loidien/side.js — CẠNH BÊN: dây sét zigzag liền mạch + nhánh phụ + nút sáng (đơn vị 100px) =====
// Hình học: y 0..100, x −5..15, trục zigzag bắt đầu/kết thúc tại x=0 (nối liền khi xếp chồng).
const T = require('./colors').TIERS[0];
const P = 'shop_loidien-side-';
function sideUnit(_tier, _W, _H) {
  const d = 'M0 0L5 12L-4 24L4 38L-3 50L5 62L-4 76L4 88L0 100';
  return `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.main}"/><stop offset="0.5" stop-color="${T.light}"/><stop offset="1" stop-color="${T.main}"/></linearGradient></defs><path d="${d}" fill="none" stroke="url(#${P}g)" stroke-width="3.4" stroke-linejoin="round" opacity="0.9"/><path d="${d}" fill="none" stroke="${T.accent}" stroke-width="1.1" stroke-linejoin="round"/><path d="M5 62L12 66L9 68L15 74M4 38L10 33" fill="none" stroke="${T.accent}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/><circle cx="-3" cy="50" r="2.6" fill="${T.bolt}"/><circle cx="15" cy="74" r="1.6" fill="${T.bolt}"/>`;
}
module.exports = { sideUnit };
