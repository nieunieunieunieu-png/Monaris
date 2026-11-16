// ===== hoso/frame/shop_gothic/crest.js — ĐỈNH THẺ: cánh dơi ôm huyết tinh =====
// Hình học: gốc giữa cạnh trên; x ∈ [-80,80], y ∈ [0,36]; chân chạm y=36; hệ thống phóng ×2.
const T = require('./colors').TIERS[0];
const P = 'shop_gothic-crest-';
function crestTop(_tier, _W, _H) {
  const defs = `<defs><linearGradient id="${P}w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.wing}"/><stop offset="1" stop-color="${T.blood}"/></linearGradient><radialGradient id="${P}c" cx="0.4" cy="0.3" r="0.8"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.4" stop-color="${T.blood}"/><stop offset="1" stop-color="${T.bloodDark}"/></radialGradient></defs>`;
  const base = `<path d="M-6 36C-6 30 6 30 6 36Z" fill="${T.wing}" stroke="${T.bloodDark}" stroke-width="0.6"/>`;
  const crystal = `<path d="M0 10L7 19L0 32L-7 19Z" fill="url(#${P}c)" stroke="${T.bloodDark}" stroke-width="0.8" stroke-linejoin="round"/><path d="M0 13.6L4 19L0 27L-4 19Z" fill="#FFFFFF" fill-opacity="0.3"/>`;
  const wing = (sx) => `<path d="M${2 * sx} 22C${8 * sx} 16 ${10 * sx} 10 ${20 * sx} 7C${17 * sx} 10 ${16 * sx} 13 ${22 * sx} 12C${18 * sx} 15 ${16 * sx} 17 ${24 * sx} 17C${19 * sx} 19 ${17 * sx} 20 ${22 * sx} 22C${16 * sx} 22 ${12 * sx} 21 ${8 * sx} 25C${6 * sx} 29 ${3 * sx} 30 ${2 * sx} 28Z" fill="url(#${P}w)" stroke="${T.bloodDark}" stroke-width="0.6" stroke-linejoin="round"/>`;
  return defs + base + wing(1) + wing(-1) + crystal;
}
module.exports = { crestTop };
