// ===== hoso/frame/shop_rungthieng/bottom.js — CHÂN THẺ: dây leo gốc cây + quạt 5 lá + lá nhỏ hai bên + nụ vàng =====
// Hình học: x −62..62, y −2..11, đối xứng quanh x=0.
const T = require('./colors').TIERS[0];
const P = 'shop_rungthieng-bottom-';
function decorBottom(_tier, _W, _H) {
  const defs = `<defs><linearGradient id="${P}l" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${T.dark}"/><stop offset="0.6" stop-color="${T.main}"/><stop offset="1" stop-color="${T.light}"/></linearGradient><path id="${P}f" d="M0 0C3 -3 3 -7 0 -10C-3 -7 -3 -3 0 0Z" fill="url(#${P}l)" stroke="${T.dark}" stroke-width="0.4"/></defs>`;
  const vine = `<path d="M-62 9Q-31 4 0 9Q31 4 62 9" fill="none" stroke="${T.bark}" stroke-width="3" stroke-linecap="round"/>`;
  const fan = [-60, -30, 0, 30, 60].map((a) => `<use href="#${P}f" transform="translate(0 9) rotate(${a}) scale(1.05)"/>`).join('');
  const small = [22, 40, 56].map((x) => `<use href="#${P}f" transform="translate(${x} ${Number((7 - x * 0.04).toFixed(2))}) rotate(70) scale(0.7)"/><use href="#${P}f" transform="translate(${-x} ${Number((7 - x * 0.04).toFixed(2))}) rotate(-70) scale(0.7)"/>`).join('');
  const bud = `<circle cy="1" r="2.8" fill="${T.gold}" stroke="${T.bark}" stroke-width="0.8"/>`;
  return defs + vine + small + fan + bud;
}
module.exports = { decorBottom };
