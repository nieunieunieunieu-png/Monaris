// ===== hoso/frame/shop_rungthieng/accents.js — điểm nhấn 4 góc: cành leo 3 lá + nụ vàng =====
// Hình học: mỗi góc trong ô x −26..0, y −26..0 (nhô ra ngoài thẻ), lật gương cho 3 góc còn lại.
const T = require('./colors').TIERS[0];
const P = 'shop_rungthieng-accents-';
function accent(_tier, W, H) {
  const defs = `<defs><linearGradient id="${P}l" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${T.dark}"/><stop offset="0.6" stop-color="${T.main}"/><stop offset="1" stop-color="${T.light}"/></linearGradient><path id="${P}f" d="M0 0C3 -3 3 -7 0 -10C-3 -7 -3 -3 0 0Z" fill="url(#${P}l)" stroke="${T.dark}" stroke-width="0.5"/></defs>`;
  const one = `<path d="M0 0C-6 -3 -12 -6 -19 -15" fill="none" stroke="${T.bark}" stroke-width="2.4" stroke-linecap="round"/><use href="#${P}f" transform="translate(-6 -3) rotate(-100) scale(1.1)"/><use href="#${P}f" transform="translate(-11 -6.5) rotate(-5) scale(1.1)"/><use href="#${P}f" transform="translate(-16 -11) rotate(-60) scale(1)"/><circle cx="-20" cy="-17" r="3.2" fill="${T.gold}" stroke="${T.bark}" stroke-width="0.8"/>`;
  const g = (tx, ty, sx, sy) => `<g transform="translate(${tx} ${ty}) scale(${sx} ${sy})">${one}</g>`;
  return defs + g(0, 0, 1, 1) + g(W, 0, -1, 1) + g(0, H, 1, -1) + g(W, H, -1, -1);
}
module.exports = { accent };
