// ===== hoso/frame/shop_rungthieng/crest.js — ĐỈNH THẺ: gốc rễ vỏ cây + chùm 5 lá toả quạt + nụ vàng + dây leo hai bên =====
// Hình học: x −70..70, y 5..36, chân đỉnh chạm y=36.
const T = require('./colors').TIERS[0];
const P = 'shop_rungthieng-crest-';
function crestTop(_tier, _W, _H) {
  const defs = `<defs><linearGradient id="${P}l" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${T.dark}"/><stop offset="0.6" stop-color="${T.main}"/><stop offset="1" stop-color="${T.light}"/></linearGradient><linearGradient id="${P}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.barkLight}"/><stop offset="1" stop-color="#3B2412"/></linearGradient><path id="${P}f" d="M0 0C3 -3 3 -7 0 -10C-3 -7 -3 -3 0 0Z" fill="url(#${P}l)" stroke="${T.dark}" stroke-width="0.3"/></defs>`;
  const base = `<path d="M-70 36Q-35 27 0 29Q35 27 70 36Z" fill="url(#${P}b)" stroke="#3B2412" stroke-width="0.8"/>`;
  const vine = (s) => `<g transform="scale(${s} 1)"><path d="M-12 32C-30 33 -40 24 -50 28C-56 30 -58 26 -55 24" fill="none" stroke="${T.main}" stroke-width="2" stroke-linecap="round"/><use href="#${P}f" transform="translate(-30 31) rotate(-35) scale(1.1)"/><use href="#${P}f" transform="translate(-44 26) rotate(25) scale(1)"/></g>`;
  const fan = [[0, 2.8], [-32, 2.4], [32, 2.4], [-62, 1.8], [62, 1.8]].map(([a, s]) => `<use href="#${P}f" transform="translate(0 33) rotate(${a}) scale(${s})"/>`).join('');
  const bud = `<circle cy="8" r="3.4" fill="${T.gold}" stroke="${T.bark}" stroke-width="0.9"/><path d="M-3 12C0 15 0 15 3 12" fill="none" stroke="${T.dark}" stroke-width="0.9"/>`;
  return defs + vine(1) + vine(-1) + base + fan + bud;
}
module.exports = { crestTop };
