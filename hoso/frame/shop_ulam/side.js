// ===== hoso/frame/shop_ulam/side.js — CẠNH TRÁI: thân gỗ nảy chồi lá xanh =====
// Hình học: 1 đơn vị cao 100 (y 0..100), rộng x ∈ [-13, 13]; thân x ±3 thẳng liền mạch; dây leo sin cắt trục x=0 tại y=0/25/50/75/100, tiếp tuyến khớp.
const T = require('./colors').TIERS[0];
const P = 'shop_ulam-side-';
const lf = (x, y, a, len) => `<path d="M0 0Q${Number((len * 0.4).toFixed(1))} ${Number((-len * 0.4).toFixed(1))} ${len} 0Q${Number((len * 0.4).toFixed(1))} ${Number((len * 0.4).toFixed(1))} 0 0Z" transform="translate(${x} ${y}) rotate(${a})" fill="${T.main}" stroke="${T.dark}" stroke-width="0.6" stroke-linejoin="round"/><path d="M0 0L${len * 0.8} 0" transform="translate(${x} ${y}) rotate(${a})" stroke="${T.light}" stroke-width="0.4" stroke-opacity="0.8"/>`;
function sideUnit(_tier, W, H) {
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${T.woodDark}"/><stop offset="0.45" stop-color="${T.wood}"/><stop offset="1" stop-color="${T.woodDark}"/></linearGradient></defs>`;
  const trunk = `<rect x="-3.2" y="0" width="6.4" height="100" fill="url(#${P}g)"/><path d="M-3.2 0V100M3.2 0V100" stroke="${T.woodDark}" stroke-width="0.9"/><path d="M-1 6V22M1.2 30V44M-1.2 56V70M1 78V94" stroke="${T.woodDark}" stroke-width="0.6" stroke-opacity="0.7" stroke-linecap="round"/>`;
  let d = 'M0 0';
  for (let i = 0; i < 4; i++) { const s = i % 2 ? -1 : 1; d += `C${s * 5} ${i * 25 + 8} ${s * 5} ${i * 25 + 17} 0 ${(i + 1) * 25}`; }
  const vine = `<path d="${d}" fill="none" stroke="${T.dark}" stroke-width="2.2" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${T.main}" stroke-width="1.1" stroke-linecap="round"/>`;
  const leaves = lf(3, 18, -35, 11) + lf(-3, 36, 215, 11) + lf(3, 66, -35, 11) + lf(-3, 84, 215, 11) + lf(0, 50, -75, 8) + lf(0, 50, 255, 8);
  const bud = `<circle cx="0" cy="50" r="2.4" fill="${T.firefly}" stroke="${T.dark}" stroke-width="0.6"/><circle cx="0" cy="50" r="5" fill="${T.firefly}" fill-opacity="0.22"/>`;
  return defs + trunk + vine + leaves + bud;
}
module.exports = { sideUnit };
