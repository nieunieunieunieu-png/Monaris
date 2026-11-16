// ===== booster/bottom.js — CẠNH DƯỚI: 3 viên kim cương boost trên dải sáng =====
// Hình học: gốc giữa mép dưới; y ∈ [-3, 11]; nửa rộng ≤ 34 (đối xứng x=0, hệ thống phóng ×1.5).
const T = require('./colors').TIERS[0];
const P = 'booster-bottom-';
function decorBottom(_tier, _W, _H) {
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.55" stop-color="${T.main}"/><stop offset="1" stop-color="${T.violet}"/></linearGradient></defs>`;
  const d = (cx, cy, hw, hh) => `<path d="M${cx} ${cy - hh}L${cx + hw} ${cy}L${cx} ${cy + hh}L${cx - hw} ${cy}Z" fill="url(#${P}g)" stroke="${T.light}" stroke-width="0.8" stroke-linejoin="round"/><path d="M${cx} ${cy - hh}L${cx + hw} ${cy}L${cx} ${cy}Z" fill="#FFFFFF" fill-opacity="0.38"/>`;
  const bar = `<path d="M-34 4H-14M14 4H34" stroke="${T.main}" stroke-opacity="0.75" stroke-width="1.2" stroke-linecap="round"/><path d="M-30 7H-20M20 7H30" stroke="${T.ice}" stroke-opacity="0.6" stroke-width="0.8" stroke-linecap="round"/>`;
  return defs + bar + d(0, 4, 8, 7.5) + d(-14, 4, 4, 4.2) + d(14, 4, 4, 4.2);
}
module.exports = { decorBottom };
