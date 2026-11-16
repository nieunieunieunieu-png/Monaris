// ===== hoso/frame/shop_loidien/accents.js — điểm nhấn 4 góc: tia sét zigzag xanh điện + nút sáng =====
// Hình học: mỗi góc trong ô x −26..0, y −27..0 (nhô ra ngoài thẻ), lật gương cho 3 góc còn lại.
const T = require('./colors').TIERS[0];
const P = 'shop_loidien-accents-';
function accent(_tier, W, H) {
  const one = `<path d="M0 0L-9 -5L-5 -8L-16 -15L-11 -17L-23 -25" fill="none" stroke="${T.main}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" opacity="0.8"/><path d="M0 0L-9 -5L-5 -8L-16 -15L-11 -17L-23 -25" fill="none" stroke="${T.accent}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/><path d="M-5 -8L-12 -6" stroke="${T.bolt}" stroke-width="1.2" stroke-linecap="round"/><circle cx="-23.5" cy="-25.5" r="2.6" fill="${T.bolt}"/><circle cx="-1" cy="-1" r="2" fill="${T.accent}"/>`;
  const g = (tx, ty, sx, sy) => `<g transform="translate(${tx} ${ty}) scale(${sx} ${sy})">${one}</g>`;
  return g(0, 0, 1, 1) + g(W, 0, -1, 1) + g(0, H, 1, -1) + g(W, H, -1, -1);
}
module.exports = { accent };
