// ===== hoso/frame/shop_void/side.js — CẠNH TRÁI: thiên thạch lơ lửng trên sợi quỹ đạo =====
// Hình học: 1 đơn vị cao 100 (y 0..100), rộng x ∈ [-14, 14]; sợi quỹ đạo x=0 thẳng liền mạch; đá nằm trọn trong y 12..93.
const T = require('./colors').TIERS[0];
const P = 'shop_void-side-';
const n = (v) => Number(v.toFixed(1));
function rock(cx, cy, r, seed) {
  let d = '';
  for (let i = 0; i < 8; i++) { const a = (i * 45 * Math.PI) / 180; const rr = r * (0.82 + 0.18 * Math.sin(seed + i * 2.3)); d += `${i ? 'L' : 'M'}${n(cx + rr * Math.cos(a))} ${n(cy + rr * Math.sin(a))}`; }
  const big = r > 4;
  return `<circle cx="${cx}" cy="${cy}" r="${n(r * 1.5)}" fill="${T.cyan}" fill-opacity="0.1"/><path d="${d}Z" fill="url(#${P}r)" stroke="${T.deep}" stroke-width="0.9" stroke-linejoin="round"/>`
    + (big ? `<circle cx="${n(cx + r * 0.25)}" cy="${n(cy - r * 0.2)}" r="${n(r * 0.22)}" fill="${T.deep}" fill-opacity="0.5"/><circle cx="${n(cx - r * 0.3)}" cy="${n(cy + r * 0.3)}" r="${n(r * 0.14)}" fill="${T.deep}" fill-opacity="0.5"/>` : '')
    + `<path d="M${n(cx - r * 0.6)} ${n(cy - r * 0.2)}Q${n(cx - r * 0.3)} ${n(cy - r * 0.7)} ${n(cx + r * 0.2)} ${n(cy - r * 0.75)}" fill="none" stroke="${T.light}" stroke-width="0.6" stroke-opacity="0.8" stroke-linecap="round"/>`;
}
function sideUnit(_tier, W, H) {
  const defs = `<defs><linearGradient id="${P}r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8D7BB5"/><stop offset="0.55" stop-color="${T.main}"/><stop offset="1" stop-color="${T.deep}"/></linearGradient></defs>`;
  const orbit = `<path d="M0 0V100" stroke="${T.cyan}" stroke-opacity="0.18" stroke-width="3.4"/><path d="M0 0V100" stroke="${T.star}" stroke-width="0.8" stroke-dasharray="2 3" stroke-opacity="0.8"/>`;
  return defs + orbit + rock(-6, 22, 6, 1) + rock(7, 62, 7, 2) + rock(-4, 87, 4.2, 3) + rock(6, 41, 2.6, 4) + rock(-7, 77, 2.4, 5)
    + `<circle cx="9" cy="14" r="0.8" fill="${T.star}"/><circle cx="-9" cy="50" r="0.8" fill="${T.cyan}"/><circle cx="10" cy="90" r="0.8" fill="${T.star}"/>`;
}
module.exports = { sideUnit };
