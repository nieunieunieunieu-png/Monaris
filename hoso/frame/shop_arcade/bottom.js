// ===== hoso/frame/shop_arcade/bottom.js — CẠNH DƯỚI (nâng cấp): đường chân trời lưới 3D synthwave + mặt trời sọc + đầu mút pixel =====
// Hình học: gốc giữa mép dưới; y ∈ [-4, 12]; nửa rộng ≤ 70 (đối xứng x=0, hệ thống phóng ×1.5); mặt trời nửa vòng tâm (0,2) r6.
const T = require('./colors').TIERS[0];
const P = 'shop_arcade-bottom-';
function decorBottom(_tier, _W, _H) {
  const HW = 70;
  const defs = `<defs><linearGradient id="${P}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.accent}"/><stop offset="1" stop-color="${T.main}"/></linearGradient><linearGradient id="${P}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.main}" stop-opacity="0.5"/><stop offset="1" stop-color="${T.bg}" stop-opacity="0.9"/></linearGradient><linearGradient id="${P}h" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${T.accent}" stop-opacity="0"/><stop offset="0.2" stop-color="${T.accent}"/><stop offset="0.5" stop-color="${T.light}"/><stop offset="0.8" stop-color="${T.accent}"/><stop offset="1" stop-color="${T.accent}" stop-opacity="0"/></linearGradient><clipPath id="${P}c"><path d="M-6 2A6 6 0 0 1 6 2Z"/></clipPath></defs>`;
  const floor = `<path d="M0 2L-${HW} 12H${HW}Z" fill="url(#${P}f)"/>`;
  let radial = '';
  for (let x = -HW; x <= HW; x += 10) radial += `M0 2L${x} 12`;
  let hz = '';
  [3.2, 4.8, 7, 10].forEach((y) => { const w = Number(Math.min(HW, 7 * (y - 2)).toFixed(2)); hz += `M${-w} ${y}H${w}`; });
  const grid = `<path d="${radial}${hz}" fill="none" stroke="${T.light}" stroke-width="0.35" stroke-opacity="0.85"/>`;
  const glow = `<rect x="-${HW}" y="1.2" width="${HW * 2}" height="1.6" fill="url(#${P}h)" fill-opacity="0.35"/>`;
  const sun = `<g clip-path="url(#${P}c)"><rect x="-6" y="-4" width="12" height="6" fill="url(#${P}s)"/><rect x="-6" y="-1.2" width="12" height="0.4" fill="${T.bg}"/><rect x="-6" y="-0.2" width="12" height="0.6" fill="${T.bg}"/><rect x="-6" y="1.1" width="12" height="0.9" fill="${T.bg}"/></g>`;
  const horizon = `<rect x="-${HW}" y="1.7" width="${HW * 2}" height="0.7" fill="url(#${P}h)"/><path d="M-${HW} 2H-9M9 2H${HW}" stroke="#FFFFFF" stroke-width="0.25" stroke-opacity="0.8"/>`;
  // đầu mút pixel 4 màu hai bên + sao pixel rải
  let caps = '';
  const cols = [T.main, T.accent, T.blue, T.light];
  [-1, 1].forEach((sx) => cols.forEach((c, i) => { caps += `<rect x="${sx > 0 ? 60 + i * 2.5 : -60 - (i + 1) * 2.5}" y="${-1 + (i % 2) * 1}" width="2" height="2" fill="${c}" fill-opacity="${Number((1 - i * 0.15).toFixed(2))}"/>`; }));
  const stars = `<path fill="${T.accent}" d="M-30 -2h1v1h-1zM30 -2h1v1h-1zM-44 -1h1v1h-1zM44 -1h1v1h-1zM-18 -3h1v1h-1zM18 -3h1v1h-1z"/><path fill="${T.light}" d="M-52 -3h1v1h-1zM52 -3h1v1h-1z"/>`;
  return defs + floor + grid + glow + horizon + sun + caps + stars;
}
module.exports = { decorBottom };
