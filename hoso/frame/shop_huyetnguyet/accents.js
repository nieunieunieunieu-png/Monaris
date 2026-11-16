// ===== hoso/frame/shop_huyetnguyet/accents.js — ĐIỂM NHẤN GÓC: gai ma đạo, ma khí đỏ, tro than =====
// Hình học: 1 góc quanh (0,0) hướng lên trái, nằm trong x,y ∈ [-28, 0]; lật 4 góc bằng <use>.
const T = require('./colors').TIERS[0];
function corner() {
  return `<path d="M-2 -2C-8 -10 -16 -14 -27 -16C-19 -10 -12 -6 -2 -2Z M-2 -2C-10 -8 -14 -16 -16 -27C-10 -19 -6 -12 -2 -2Z" fill="${T.black}" stroke="${T.main}" stroke-width="0.8" stroke-linejoin="round"/>`
    + `<path d="M-4 -4C-12 -6 -10 -14 -19 -17M-4 -4C-6 -12 -14 -10 -17 -19" fill="none" stroke="${T.main}" stroke-opacity="0.5" stroke-width="1.6" stroke-linecap="round"/>`
    + `<circle cx="-5" cy="-5" r="3" fill="${T.iron}" stroke="${T.black}" stroke-width="0.8"/><circle cx="-5" cy="-5" r="1.3" fill="${T.main}"/><circle cx="-5.5" cy="-5.5" r="0.4" fill="#FFFFFF"/>`
    + `<circle cx="-14" cy="-4" r="1" fill="${T.ember}"/><circle cx="-4" cy="-14" r="1" fill="${T.ember}"/><circle cx="-22" cy="-8" r="0.8" fill="${T.light}"/><circle cx="-8" cy="-22" r="0.8" fill="${T.light}"/><circle cx="-24" cy="-3" r="0.6" fill="${T.ember}"/><circle cx="-3" cy="-24" r="0.6" fill="${T.ember}"/><circle cx="-18" cy="-12" r="0.6" fill="${T.main}"/><circle cx="-12" cy="-18" r="0.6" fill="${T.main}"/>`;
}
function accent(_tier, W, H) {
  const id = 'shop_huyetnguyet-accent-c';
  const u = (tx, ty, sx, sy) => `<use href="#${id}" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return `<defs><g id="${id}">${corner()}</g></defs>` + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
}
module.exports = { accent };
