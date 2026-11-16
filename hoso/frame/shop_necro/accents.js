// ===== hoso/frame/shop_necro/accents.js — ĐIỂM NHẤN GÓC: linh hồn xanh ngọc bay =====
// Hình học: 1 góc quanh (0,0) hướng lên trái, nằm trong x,y ∈ [-28, 0]; lật 4 góc bằng <use>.
const T = require('./colors').TIERS[0];
const GID = 'shop_necro-accent-g';
function corner() {
  const soul = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 -4C2.4 -4 3.6 -1.6 3 0.8C2.4 3.2 0.8 4.4 0 4.4C-0.8 4.4 -2.4 3.2 -3 0.8C-3.6 -1.6 -2.4 -4 0 -4Z" fill="url(#${GID})" fill-opacity="0.85"/><circle cx="-0.8" cy="-1.2" r="0.6" fill="#FFFFFF"/></g>`;
  return `<path d="M-2 -2C-10 -5 -16 -3 -19 -9M-2 -2C-5 -10 -3 -16 -9 -19" fill="none" stroke="${T.accent}" stroke-width="0.8" stroke-opacity="0.55" stroke-linecap="round"/>`
    + soul(-9, -10, 1.3) + soul(-18, -6, 0.9) + soul(-6, -20, 0.9) + soul(-22, -18, 0.7);
}
function accent(_tier, W, H) {
  const id = 'shop_necro-accent-c';
  const defs = `<defs><radialGradient id="${GID}" cx="0.4" cy="0.3" r="0.8"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.5" stop-color="${T.accent}"/><stop offset="1" stop-color="${T.main}"/></radialGradient><g id="${id}">${corner()}</g></defs>`;
  const u = (tx, ty, sx, sy) => `<use href="#${id}" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return defs + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
}
module.exports = { accent };
