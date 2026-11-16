// ===== hoso/frame/shop_rungthieng/side.js — CẠNH BÊN: thân dây leo vỏ cây + lá xen kẽ + nụ vàng (đơn vị 100px) =====
// Hình học: y 0..100, x −12..12, trục x=0 liền mạch ở y=0 và y=100.
const T = require('./colors').TIERS[0];
const P = 'shop_rungthieng-side-';
function sideUnit(_tier, _W, _H) {
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3B2412"/><stop offset="0.5" stop-color="${T.barkLight}"/><stop offset="1" stop-color="#3B2412"/></linearGradient><linearGradient id="${P}l" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${T.dark}"/><stop offset="0.6" stop-color="${T.main}"/><stop offset="1" stop-color="${T.light}"/></linearGradient><path id="${P}f" d="M0 0C3 -3 3 -7 0 -10C-3 -7 -3 -3 0 0Z" fill="url(#${P}l)" stroke="${T.dark}" stroke-width="0.4"/></defs>`;
  const spine = `<path d="M0 0V100" stroke="url(#${P}g)" stroke-width="3.6"/>`;
  const leaves = [[20, 70], [45, -70], [70, 70], [95, -70]].map(([y, a]) => `<use href="#${P}f" transform="translate(${a > 0 ? 1 : -1} ${y}) rotate(${a}) scale(1.1)"/>`).join('');
  const tendril = `<path d="M0 32C7 30 9 38 5 40M0 82C-7 80 -9 88 -5 90" fill="none" stroke="${T.main}" stroke-width="1.1" stroke-linecap="round"/>`;
  const bud = `<circle cy="50" r="2.8" fill="${T.gold}" stroke="${T.bark}" stroke-width="0.8"/>`;
  return defs + spine + tendril + leaves + bud;
}
module.exports = { sideUnit };
