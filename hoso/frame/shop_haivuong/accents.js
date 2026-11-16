// ===== hoso/frame/shop_haivuong/accents.js — ĐIỂM NHẤN GÓC: bọt khí + vệt khúc xạ =====
// Hình học: 1 góc quanh (0,0) hướng lên trái, nằm trong x,y ∈ [-28, 0]; lật 4 góc bằng <use>.
const T = require('./colors').TIERS[0];
function corner() {
  const b = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${T.foam}" fill-opacity="0.22" stroke="${T.foam}" stroke-width="0.6"/><circle cx="${Number((x - r * 0.35).toFixed(2))}" cy="${Number((y - r * 0.35).toFixed(2))}" r="${Number((r * 0.28).toFixed(2))}" fill="#FFFFFF"/>`;
  return `<path d="M-2 -2L-27 -8L-26 -5.4Z M-2 -2L-8 -27L-5.4 -26Z M-2 -2L-20 -18L-17.6 -19.4Z" fill="${T.light}" fill-opacity="0.35"/><path d="M-3 -3L-16 -6.4M-3 -3L-6.4 -16" fill="none" stroke="${T.foam}" stroke-width="0.7" stroke-opacity="0.9" stroke-linecap="round"/>`
    + `<path d="M-2 -2C-9 -6 -14 -4 -18 -8M-2 -2C-6 -9 -4 -14 -8 -18" fill="none" stroke="${T.gold}" stroke-width="1.3" stroke-linecap="round"/><path d="M-4 -13L-2.4 -10.6L-4 -8.2L-5.6 -10.6Z M-13 -4L-10.6 -2.4L-8.2 -4L-10.6 -5.6Z" fill="${T.goldLight}" stroke="${T.goldDark}" stroke-width="0.4"/>`
    + b(-8, -9, 3.2) + b(-20, -12, 2.4) + b(-12, -21, 2.4) + b(-24, -4, 1.6) + b(-4, -24, 1.6) + b(-18, -22, 1.2) + b(-23, -18, 1.2);
}
function accent(_tier, W, H) {
  const id = 'shop_haivuong-accent-c';
  const u = (tx, ty, sx, sy) => `<use href="#${id}" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return `<defs><g id="${id}">${corner()}</g></defs>` + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
}
module.exports = { accent };
