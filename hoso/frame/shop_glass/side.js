// ===== hoso/frame/shop_glass/side.js — CẠNH TRÁI: 2 vạch kính thẳng mảnh =====
// Hình học: 1 đơn vị cao 100 (y 0..100), x ∈ [-4, 4]; 2 vạch x=±3 liền mạch tại y=0/100; opacity 0.15–0.85.
const T = require('./colors').TIERS[0];
function sideUnit(_tier, _W, _H) {
  const line = (x, c, o, w) => `<path d="M${x} 0V100" stroke="${c}" stroke-opacity="${o}" stroke-width="${w}" fill="none"/>`;
  const gl = (x, y1, y2, o) => `<path d="M${x} ${y1}V${y2}" stroke="#FFFFFF" stroke-opacity="${o}" stroke-width="1.4" stroke-linecap="round" fill="none"/>`;
  return line(-3, '#FFFFFF', 0.55, 1.2) + line(3, T.accent, 0.4, 1) + gl(-3, 8, 34, 0.85) + gl(-3, 40, 44, 0.6) + gl(3, 62, 90, 0.55)
    + `<circle cx="0" cy="50" r="1.3" fill="#FFFFFF" fill-opacity="0.75"/><circle cx="0" cy="50" r="2.8" fill="none" stroke="${T.dark}" stroke-opacity="0.35" stroke-width="0.6"/>`;
}
module.exports = { sideUnit };
