// ===== hoso/frame/shop_longvan/bottom.js — CHÂN THẺ (làm lại): hai gò mây xoáy + đuôi rồng cuộn + ngọc đỏ có lửa =====
// Hình học: x −68..68, y −3..11, đối xứng quanh x=0.
const T = require('./colors').TIERS[0];
const P = 'shop_longvan-bottom-';
function decorBottom(_tier, _W, _H) {
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.6" stop-color="${T.main}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient><radialGradient id="${P}p" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#FFB4A8"/><stop offset="0.5" stop-color="${T.red}"/><stop offset="1" stop-color="${T.redDark}"/></radialGradient></defs>`;
  const half = `<path d="M0 11L-60 11C-60 5 -52 3 -48 6C-46 0 -36 0 -34 6C-31 -2 -18 -2 -15 5C-11 1 -5 2 0 6Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.8"/><path d="M-41 5C-41 2.5 -38 2.5 -38 4.5M-24 3C-24 0.5 -20 0.5 -20 2.5" fill="none" stroke="${T.dark}" stroke-width="0.8" opacity="0.7"/><path d="M-60 9C-65 9 -68 4 -64 1C-61 -1 -59 3 -62 4" fill="none" stroke="${T.main}" stroke-width="1.8" stroke-linecap="round"/>`;
  const pearl = `<path d="M0 -3C3 0 2 2 5 3C6 -1 4 -3 1 -4ZM0 -3C-3 0 -2 2 -5 3C-6 -1 -4 -3 -1 -4Z" fill="${T.main}"/><circle cy="3.5" r="6.2" fill="${T.main}" stroke="${T.dark}" stroke-width="0.6"/><circle cy="3.5" r="4.7" fill="url(#${P}p)"/><ellipse cx="-1.5" cy="1.8" rx="1.5" ry="1" fill="#FFF" opacity="0.75"/>`;
  return defs + half + `<g transform="scale(-1 1)">${half}</g>` + pearl;
}
module.exports = { decorBottom };
