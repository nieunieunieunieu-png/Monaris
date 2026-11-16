// ===== hoso/frame/shop_ulam/accents.js — ĐIỂM NHẤN GÓC: đom đóm xanh, dây leo cuộn =====
// Hình học: 1 góc quanh (0,0) hướng lên trái, nằm trong x,y ∈ [-28, 0]; lật 4 góc bằng <use>.
const T = require('./colors').TIERS[0];
const lf = (x, y, a) => `<path d="M0 0Q2.6 -2.6 6 0Q2.6 2.6 0 0Z" transform="translate(${x} ${y}) rotate(${a})" fill="${T.main}" stroke="${T.dark}" stroke-width="0.5" stroke-linejoin="round"/>`;
const ff = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${Number((r * 2.8).toFixed(1))}" fill="${T.firefly}" fill-opacity="0.22"/><circle cx="${x}" cy="${y}" r="${r}" fill="${T.firefly}"/>`;
function corner() {
  return `<path d="M-2 -2C-6 -12 -14 -16 -23 -15C-27 -14.6 -27 -19.4 -23.6 -19.2M-2 -2C-12 -6 -16 -14 -15 -23C-14.6 -27 -19.4 -27 -19.2 -23.6" fill="none" stroke="${T.dark}" stroke-width="2.6" stroke-linecap="round"/><path d="M-2 -2C-6 -12 -14 -16 -23 -15C-27 -14.6 -27 -19.4 -23.6 -19.2M-2 -2C-12 -6 -16 -14 -15 -23C-14.6 -27 -19.4 -27 -19.2 -23.6" fill="none" stroke="${T.main}" stroke-width="1.4" stroke-linecap="round"/>`
    + lf(-8, -9, 200) + lf(-9, -8, -110) + lf(-16, -15.5, 215) + lf(-15.5, -16, -125)
    + `<circle cx="-3" cy="-3" r="2.2" fill="${T.wood}" stroke="${T.woodDark}" stroke-width="0.6"/>`
    + ff(-22, -5, 1.1) + ff(-5, -22, 1.1) + ff(-26, -12, 0.8) + ff(-12, -26, 0.8) + ff(-14, -3, 0.7) + ff(-3, -14, 0.7);
}
function accent(_tier, W, H) {
  const id = 'shop_ulam-accent-c';
  const u = (tx, ty, sx, sy) => `<use href="#${id}" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return `<defs><g id="${id}">${corner()}</g></defs>` + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
}
module.exports = { accent };
