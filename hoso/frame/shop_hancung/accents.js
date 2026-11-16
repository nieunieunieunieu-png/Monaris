// ===== hoso/frame/shop_hancung/accents.js — ĐIỂM NHẤN GÓC: hạt kim tuyến vàng =====
// Hình học: 1 góc quanh (0,0) hướng lên trái, nằm trong x,y ∈ [-28, 0]; lật 4 góc bằng <use>.
const T = require('./colors').TIERS[0];
const dia = (x, y, r, f) => `<path d="M${x} ${y - r}L${x + r * 0.65} ${y}L${x} ${y + r}L${x - r * 0.65} ${y}Z" fill="${f}"/>`;
function corner() {
  return `<path d="M-2 -2C-6 -14 -14 -20 -26 -24M-2 -2C-14 -6 -20 -14 -24 -26" fill="none" stroke="${T.main}" stroke-width="1.4" stroke-linecap="round"/>`
    + `<path d="M-2 -2C-6 -14 -14 -20 -26 -24" fill="none" stroke="${T.light}" stroke-width="0.5" stroke-linecap="round" stroke-opacity="0.8"/>`
    + `<path d="M-12 -12l-6.5 -9l9 6.5Z" fill="${T.jade}" stroke="${T.main}" stroke-width="0.6" stroke-linejoin="round"/><path d="M-12 -12l-9 -6.5l6.5 9Z" fill="${T.jade}" stroke="${T.main}" stroke-width="0.6" stroke-linejoin="round"/>`
    + dia(-8, -8, 5, T.main) + dia(-8, -8, 2.4, T.light) + dia(-22, -6, 3.2, T.main) + dia(-6, -22, 3.2, T.main) + dia(-24, -19, 2.4, T.light) + dia(-19, -24, 2.4, T.light)
    + `<circle cx="-16" cy="-3" r="1" fill="${T.main}"/><circle cx="-3" cy="-16" r="1" fill="${T.main}"/><circle cx="-26" cy="-11" r="0.8" fill="${T.light}"/><circle cx="-11" cy="-26" r="0.8" fill="${T.light}"/><circle cx="-4" cy="-7" r="0.7" fill="${T.jade}"/><circle cx="-7" cy="-4" r="0.7" fill="${T.jade}"/>`;
}
function accent(_tier, W, H) {
  const id = 'shop_hancung-accent-c';
  const u = (tx, ty, sx, sy) => `<use href="#${id}" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return `<defs><g id="${id}">${corner()}</g></defs>` + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
}
module.exports = { accent };
