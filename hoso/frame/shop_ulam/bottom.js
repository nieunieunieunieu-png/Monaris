// ===== hoso/frame/shop_ulam/bottom.js — CẠNH DƯỚI: thảm cỏ ngọc + hoa rừng =====
// Hình học: gốc giữa mép dưới; y ∈ [-4, 12] (cao 16), nửa rộng ≤ 66, đối xứng quanh x=0 (hệ thống phóng ×1.5).
const T = require('./colors').TIERS[0];
const P = 'shop_ulam-bottom-';
const n = (v) => Number(v.toFixed(1));
function decorBottom(_tier, W, H) {
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.5" stop-color="${T.main}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient></defs>`;
  let gr = '';
  for (let x = -64, i = 0; x <= 64; x += 4, i++) { const h = 4 + 5 * Math.abs(Math.sin(i * 1.7)); const lean = ((i % 3) - 1) * 2; gr += `M${x - 1.4} 12Q${n(x + lean * 0.5)} ${n(12 - h * 0.6)} ${n(x + lean)} ${n(12 - h)}Q${n(x + 0.6 + lean * 0.5)} ${n(12 - h * 0.5)} ${n(x + 1.4)} 12Z`; }
  const grass = `<path d="${gr}" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.4" stroke-linejoin="round"/><path d="M-66 11.6H66" stroke="${T.woodDark}" stroke-width="1.6" stroke-linecap="round"/><path d="M-66 11.6H66" stroke="${T.wood}" stroke-width="0.7" stroke-linecap="round"/>`;
  const flower = (cx, cy, r, f, e) => { let d = ''; for (let i = 0; i < 5; i++) { const a = (i * 72 - 90) * Math.PI / 180; d += `M${n(cx + r * 0.9 * Math.cos(a) - r * 0.8)} ${n(cy + r * 0.9 * Math.sin(a))}a${n(r * 0.8)} ${n(r * 0.8)} 0 1 0 ${n(r * 1.6)} 0a${n(r * 0.8)} ${n(r * 0.8)} 0 1 0 ${n(-r * 1.6)} 0`; } return `<path d="M${cx} 11.6C${cx + 1} ${n(cy + 6)} ${cx - 1} ${n(cy + 3)} ${cx} ${cy}" fill="none" stroke="${T.dark}" stroke-width="0.9" stroke-linecap="round"/><path d="${d}" fill="${f}" stroke="${e}" stroke-width="0.5"/><circle cx="${cx}" cy="${cy}" r="${n(r * 0.42)}" fill="${T.core}" stroke="${T.woodDark}" stroke-width="0.3"/>`; };
  const flowers = flower(0, 0, 3.4, T.bloom, T.bloomEdge) + flower(-22, 3, 2.7, T.bloom, T.bloomEdge) + flower(22, 3, 2.7, T.bloom, T.bloomEdge) + flower(-44, 4.4, 2.2, T.light, T.main) + flower(44, 4.4, 2.2, T.light, T.main);
  const flies = `<circle cx="-12" cy="-1" r="2.6" fill="${T.firefly}" fill-opacity="0.22"/><circle cx="-12" cy="-1" r="0.9" fill="${T.firefly}"/><circle cx="12" cy="-1" r="2.6" fill="${T.firefly}" fill-opacity="0.22"/><circle cx="12" cy="-1" r="0.9" fill="${T.firefly}"/><circle cx="-56" cy="1" r="0.8" fill="${T.firefly}"/><circle cx="56" cy="1" r="0.8" fill="${T.firefly}"/>`;
  return defs + grass + flowers + flies;
}
module.exports = { decorBottom };
