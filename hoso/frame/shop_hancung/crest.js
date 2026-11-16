// ===== hoso/frame/shop_hancung/crest.js — ĐỈNH THẺ: mây vàng ôm trăng khuyết ngọc bích =====
// Hình học: gốc giữa cạnh trên; x ∈ [-77, 77], y ∈ [0, 36]; chân mây chạm y=36; trăng khuyết mở lên tâm (0,9), ngọc tròn (0,11.5) r6.
const T = require('./colors').TIERS[0];
const P = 'shop_hancung-crest-';
function crestTop(_tier, W, H) {
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.5" stop-color="${T.main}"/><stop offset="1" stop-color="#8F6B12"/></linearGradient><linearGradient id="${P}j" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.45" stop-color="${T.jade}"/><stop offset="1" stop-color="${T.jadeDark}"/></linearGradient></defs>`;
  const half = `<path d="M0 22C-6 22 -10 26 -16 26C-22 26 -24 21 -31 21C-39 21 -41 29 -49 29C-57 29 -59 25 -67 25C-73 25 -77 29 -77 33C-77 35 -76 36 -74 36H0Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="1" stroke-linejoin="round"/><path d="M-10 36C-10 32 -5 31 -4 34M-27 36C-27 31 -21 29 -19 33M-45 36C-45 32 -39 31 -37 34M-63 36C-63 32 -58 31 -56 34" fill="none" stroke="${T.dark}" stroke-width="1" stroke-linecap="round"/><path d="M-6 24C-12 24 -16 28 -22 28M-34 23C-42 23 -46 31 -54 31" fill="none" stroke="${T.light}" stroke-width="0.6" stroke-opacity="0.8"/><path d="M-31 25.5C-33.5 28 -33.5 31 -31 33C-28.5 31 -28.5 28 -31 25.5Z" fill="${T.jade}" stroke="${T.dark}" stroke-width="0.6"/>`;
  const star = (x, y) => `<path d="M${x} ${y - 4}L${x + 1} ${y - 1}L${x + 4} ${y}L${x + 1} ${y + 1}L${x} ${y + 4}L${x - 1} ${y + 1}L${x - 4} ${y}L${x - 1} ${y - 1}Z" fill="${T.light}" stroke="${T.main}" stroke-width="0.5" stroke-linejoin="round"/>`;
  const moon = `<path d="M-14 9A14 14 0 0 0 14 9A17 17 0 0 1 -14 9Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.9" stroke-linejoin="round"/><path d="M-11.5 9.6A11.5 11.5 0 0 0 11.5 9.6" fill="none" stroke="${T.light}" stroke-width="0.6" stroke-opacity="0.8"/>`;
  const pearl = `<circle cx="0" cy="11.5" r="6" fill="url(#${P}j)" stroke="${T.main}" stroke-width="0.9"/><path d="M-3.4 9.6A4 4 0 0 1 -0.6 7.6" fill="none" stroke="#FFFFFF" stroke-width="1" stroke-linecap="round"/><path d="M0 0L2.4 3L0 5.4L-2.4 3Z" fill="${T.main}" stroke="${T.dark}" stroke-width="0.6" stroke-linejoin="round"/>`;
  return defs + half + `<g transform="scale(-1 1)">${half}</g>` + moon + pearl + star(-24, 10) + star(24, 10);
}
module.exports = { crestTop };
