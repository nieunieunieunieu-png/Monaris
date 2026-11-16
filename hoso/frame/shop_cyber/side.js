// ===== hoso/frame/shop_cyber/side.js — CẠNH TRÁI: thanh pin năng lượng nhiều vạch =====
// Hình học: 1 đơn vị cao 100 (y 0..100), rộng x ∈ [-9, 9]; vỏ pin x ±6.5 liền mạch; 10 ô cao 7 chu kỳ 10px; đầu cực ở y=50.
const T = require('./colors').TIERS[0];
const P = 'shop_cyber-side-';
function sideUnit(_tier, W, H) {
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${T.bg}"/><stop offset="0.5" stop-color="${T.steel}"/><stop offset="1" stop-color="${T.bg}"/></linearGradient></defs>`;
  const shell = `<rect x="-6.5" y="0" width="13" height="100" fill="url(#${P}g)"/><path d="M-6.5 0V100M6.5 0V100" stroke="${T.main}" stroke-width="1"/><path d="M-4.4 0V100M4.4 0V100" stroke="${T.main}" stroke-width="0.4" stroke-opacity="0.5"/>`;
  let cells = '';
  for (let i = 0; i < 10; i++) {
    const op = Number((1 - i * 0.055).toFixed(2));
    const col = i === 9 ? T.pink : T.main;
    cells += `<rect x="-3.4" y="${3 + i * 10}" width="6.8" height="7" rx="0.8" fill="${col}" fill-opacity="${op}"/>`;
  }
  const glow = `<rect x="-3.4" y="3" width="6.8" height="94" fill="${T.main}" fill-opacity="0.08"/>`;
  const term = `<path d="M-9 46L-6.5 44H6.5L9 46V54L6.5 56H-6.5L-9 54Z" fill="${T.steel}" stroke="${T.main}" stroke-width="1" stroke-linejoin="miter"/><rect x="-2" y="48" width="4" height="4" fill="${T.bg}" stroke="${T.pink}" stroke-width="0.8"/><path d="M-6 46.6H-3M3 46.6H6M-6 53.4H-3M3 53.4H6" stroke="${T.light}" stroke-width="0.6"/>`;
  return defs + shell + glow + cells + term;
}
module.exports = { sideUnit };
