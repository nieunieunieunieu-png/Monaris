// ===== booster/side.js — CẠNH TRÁI: dải sáng hồng + viên kim cương nhỏ =====
// Hình học: 1 đơn vị cao 100 (y 0..100), x ∈ [-5, 5]; vạch liền mạch tại y=0/100.
const T = require('./colors').TIERS[0];
function sideUnit(_tier, _W, _H) {
  const line = (x, c, o, w) => `<path d="M${x} 0V100" stroke="${c}" stroke-opacity="${o}" stroke-width="${w}" fill="none"/>`;
  const gem = (y, r) => `<path d="M0 ${y - r}L${r * 0.75} ${y}L0 ${y + r}L${-r * 0.75} ${y}Z" fill="${T.main}" stroke="${T.light}" stroke-width="0.7" stroke-linejoin="round"/><path d="M0 ${y - r}L${r * 0.75} ${y}L0 ${y}Z" fill="#FFFFFF" fill-opacity="0.4"/>`;
  return line(-3, T.main, 0.7, 1.4) + line(3, T.ice, 0.45, 1) + gem(50, 5.5) + gem(14, 2.6) + gem(86, 2.6)
    + `<path d="M-3 28V40M3 60V72" stroke="#FFFFFF" stroke-opacity="0.8" stroke-width="1.4" stroke-linecap="round"/>`;
}
module.exports = { sideUnit };
