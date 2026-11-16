// ===== hoso/frame/shop_glass/accents.js — ĐIỂM NHẤN GÓC: vệt sáng khúc xạ =====
// Hình học: 1 góc quanh (0,0) hướng lên trái, nằm trong x,y ∈ [-28, 0]; lật 4 góc bằng <use>.
const T = require('./colors').TIERS[0];
function corner() {
  return `<path d="M-26 -3L-22 -3L-3 -26L-7 -26Z" fill="#FFFFFF" fill-opacity="0.55"/>`
    + `<path d="M-20 -1.5L-18 -1.5L-1.5 -20L-3.5 -20Z" fill="${T.accent}" fill-opacity="0.6"/>`
    + `<path d="M-13 -13m-3.2 0a3.2 3.2 0 1 0 6.4 0a3.2 3.2 0 1 0 -6.4 0" fill="none" stroke="${T.accent}" stroke-opacity="0.5" stroke-width="0.7"/>`
    + `<circle cx="-13" cy="-13" r="1.2" fill="#FFFFFF" fill-opacity="0.85"/>`
    + `<path d="M-27 -8L-24 -8M-8 -27L-8 -24" stroke="${T.dark}" stroke-opacity="0.4" stroke-width="0.7" stroke-linecap="round"/>`;
}
function accent(_tier, W, H) {
  const id = 'shop_glass-accent-c';
  const defs = `<defs><g id="${id}">${corner()}</g></defs>`;
  const u = (tx, ty, sx, sy) => `<use href="#${id}" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return defs + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
}
module.exports = { accent };
