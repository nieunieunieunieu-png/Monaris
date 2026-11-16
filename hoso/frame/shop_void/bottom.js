// ===== hoso/frame/shop_void/bottom.js — CẠNH DƯỚI: tinh vân + ngân hà thu nhỏ =====
// Hình học: gốc giữa mép dưới; y ∈ [-4, 12] (cao 16), nửa rộng ≤ 64, đối xứng quanh x=0 (hệ thống phóng ×1.5).
const T = require('./colors').TIERS[0];
const P = 'shop_void-bottom-';
function decorBottom(_tier, W, H) {
  const defs = `<defs><radialGradient id="${P}n" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${T.light}" stop-opacity="0.6"/><stop offset="0.5" stop-color="${T.main}" stop-opacity="0.45"/><stop offset="1" stop-color="${T.dark}" stop-opacity="0"/></radialGradient><radialGradient id="${P}c" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.35" stop-color="${T.star}"/><stop offset="1" stop-color="${T.main}" stop-opacity="0.2"/></radialGradient></defs>`;
  const neb = `<ellipse cx="0" cy="6.5" rx="64" ry="6.5" fill="url(#${P}n)"/><ellipse cx="-30" cy="6" rx="22" ry="3.4" fill="${T.cyan}" fill-opacity="0.2"/><ellipse cx="32" cy="7" rx="20" ry="3" fill="${T.cyan}" fill-opacity="0.2"/>`;
  const gal = `<g transform="rotate(-10 0 6)"><ellipse cx="0" cy="6" rx="17" ry="5.2" fill="url(#${P}c)" stroke="${T.light}" stroke-width="0.5" stroke-opacity="0.7"/><path d="M-16 7.6C-9 10 -3 4 2 2.2M16 4.4C9 2 3 8 -2 9.8" fill="none" stroke="${T.deep}" stroke-width="1" stroke-opacity="0.55" stroke-linecap="round"/><path d="M-16 7.6C-9 10 -3 4 2 2.2M16 4.4C9 2 3 8 -2 9.8" fill="none" stroke="${T.star}" stroke-width="0.5" stroke-linecap="round"/><circle cx="0" cy="6" r="2.4" fill="#FFFFFF"/></g>`;
  let st = '';
  for (let i = 0; i < 14; i++) {
    const x = -59 + i * 9.1; const y = -2 + ((i * 5) % 11);
    if (Math.abs(x) < 20) continue;
    st += `<circle cx="${Number(x.toFixed(1))}" cy="${y}" r="${i % 3 ? 0.6 : 0.95}" fill="${i % 2 ? T.cyan : T.star}"/>`;
  }
  const r = (v) => Number(v.toFixed(1));
  const star = (x, y) => `<path d="M${x} ${r(y - 3.4)}L${r(x + 0.9)} ${r(y - 0.9)}L${r(x + 3.4)} ${y}L${r(x + 0.9)} ${r(y + 0.9)}L${x} ${r(y + 3.4)}L${r(x - 0.9)} ${r(y + 0.9)}L${r(x - 3.4)} ${y}L${r(x - 0.9)} ${r(y - 0.9)}Z" fill="${T.star}"/>`;
  const base = `<path d="M-64 11.6H64" stroke="${T.light}" stroke-width="0.8" stroke-opacity="0.6" stroke-linecap="round"/>`;
  return defs + neb + gal + st + star(-44, 1) + star(46, 2.4) + base;
}
module.exports = { decorBottom };
