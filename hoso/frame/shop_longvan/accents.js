// ===== hoso/frame/shop_longvan/accents.js — điểm nhấn 4 góc (làm lại): xoáy mây vàng hai lớp + ngọc đỏ + sao sáng =====
// Hình học: mỗi góc trong ô x −26..0, y −26..0 (nhô ra ngoài thẻ), lật gương cho 3 góc còn lại.
const T = require('./colors').TIERS[0];
const P = 'shop_longvan-accents-';
function accent(_tier, W, H) {
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.5" stop-color="${T.main}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient><g id="${P}c"><path d="M0 0C-8 -1 -15 -3 -19 -9C-23 -16 -16 -23 -10 -19C-14 -16 -13 -12 -9 -12" fill="none" stroke="${T.dark}" stroke-width="4.4" stroke-linecap="round" opacity="0.5"/><path d="M0 0C-8 -1 -15 -3 -19 -9C-23 -16 -16 -23 -10 -19C-14 -16 -13 -12 -9 -12" fill="none" stroke="url(#${P}g)" stroke-width="3" stroke-linecap="round"/><path d="M-3 -6C-8 -7 -10 -13 -14 -14M-2 -2C-10 -2 -14 -5 -17 -6" fill="none" stroke="${T.light}" stroke-width="1" stroke-linecap="round" opacity="0.85"/><path d="M-20 -19L-17 -22L-14 -19L-17 -16Z" fill="${T.red}" stroke="${T.main}" stroke-width="0.8" stroke-linejoin="round"/><path d="M-5 -22L-4 -19L-1 -18L-4 -17L-5 -14L-6 -17L-9 -18L-6 -19Z" fill="${T.light}"/><circle cx="-1" cy="-1" r="2.2" fill="${T.main}" stroke="${T.dark}" stroke-width="0.6"/></g></defs>`;
  const u = (tx, ty, sx, sy) => `<use href="#${P}c" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return defs + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
}
module.exports = { accent };
