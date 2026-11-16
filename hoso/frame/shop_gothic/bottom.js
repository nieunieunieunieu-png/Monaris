// ===== hoso/frame/shop_gothic/bottom.js — CẠNH DƯỚI: bệ đá nứt + hồng sẫm rơi cánh =====
// Hình học: gốc giữa mép dưới; y ∈ [-4, 12]; nửa rộng ≤ 66, đối xứng quanh x=0 (hệ thống phóng ×1.5).
const T = require('./colors').TIERS[0];
const P = 'shop_gothic-bottom-';
function decorBottom(_tier, _W, _H) {
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.main}"/><stop offset="1" stop-color="${T.wing}"/></linearGradient></defs>`;
  const slab = `<path d="M-58 11L-50 -2H50L58 11Z" fill="url(#${P}g)" stroke="${T.wing}" stroke-width="1" stroke-linejoin="round"/>`;
  const brickLines = `<path d="M-50 4H50M-42 -2V4M-20 4V11M4 -2V4M26 4V11M44 -2V4" stroke="${T.wing}" stroke-width="0.6" stroke-opacity="0.6"/>`;
  let cracks = '';
  [-30, -10, 14, 36].forEach((x, i) => { cracks += `<path d="M${x} ${i % 2 ? 0 : -1}L${x + 4} 4L${x + 1} 8" fill="none" stroke="${T.blood}" stroke-width="0.6" stroke-opacity="0.7"/>`; });
  const petal = (x, y, rot, r) => `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 ${-r}C${Number((r * 0.8).toFixed(2))} ${Number((-r * 0.4).toFixed(2))} ${Number((r * 0.8).toFixed(2))} ${Number((r * 0.4).toFixed(2))} 0 ${r}C${Number((-r * 0.8).toFixed(2))} ${Number((r * 0.4).toFixed(2))} ${Number((-r * 0.8).toFixed(2))} ${Number((-r * 0.4).toFixed(2))} 0 ${-r}Z" fill="${T.rose}" stroke="${T.bloodDark}" stroke-width="0.3"/></g>`;
  const petals = petal(-46, 0, -20, 1.8) + petal(-32, -2, 40, 1.4) + petal(30, -2, -30, 1.6)
    + petal(46, 0, 25, 1.8) + petal(0, -3, 10, 1.2) + petal(-18, 8, 60, 1.4) + petal(18, 8, -60, 1.4);
  return defs + slab + brickLines + cracks + petals;
}
module.exports = { decorBottom };
