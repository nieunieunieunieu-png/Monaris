// ===== hoso/frame/shop_gothic/accents.js — ĐIỂM NHẤN GÓC: dơi nhỏ bay + giọt máu =====
// Hình học: 1 góc quanh (0,0) hướng lên trái, nằm trong x,y ∈ [-28, 0]; lật 4 góc bằng <use>.
const T = require('./colors').TIERS[0];
function corner() {
  const bat = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0C-4 -3 -8 -2 -9 1C-6 0 -4 1 -2.4 0.4C-3 2 -5 2.6 -7 2C-5.4 4 -2 4 0 2C2 4 5.4 4 7 2C5 2.6 3 2 2.4 0.4C4 1 6 0 9 1C8 -2 4 -3 0 0Z" fill="${T.wing}" stroke="${T.bloodDark}" stroke-width="0.4"/></g>`;
  const drop = (x, y, r) => `<path d="M${x} ${n(y - r)}C${n(x + r)} ${n(y - r * 0.2)} ${n(x + r * 0.6)} ${n(y + r)} ${x} ${n(y + r)}C${n(x - r * 0.6)} ${n(y + r)} ${n(x - r)} ${n(y - r * 0.2)} ${x} ${n(y - r)}Z" fill="${T.blood}" stroke="${T.bloodDark}" stroke-width="0.3"/>`;
  return `<path d="M-2 -2L-27 -8L-26 -5.4Z M-2 -2L-8 -27L-5.4 -26Z" fill="${T.dark}" fill-opacity="0.5"/>`
    + bat(-15, -6, 1) + bat(-8, -18, 0.75) + bat(-22, -16, 0.6)
    + drop(-5, -22, 1.6) + drop(-18, -9, 1.3) + drop(-24, -22, 1);
}
const n = (v) => Number(v.toFixed(2));
function accent(_tier, W, H) {
  const id = 'shop_gothic-accent-c';
  const u = (tx, ty, sx, sy) => `<use href="#${id}" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return `<defs><g id="${id}">${corner()}</g></defs>` + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
}
module.exports = { accent };
