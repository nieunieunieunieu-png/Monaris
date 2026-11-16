// ===== hoso/frame/shop_loidien/crest.js — ĐỈNH THẺ: mây bão tím + tia sét lớn giữa + hai nhánh sét nhỏ =====
// Hình học: x −70..70, y 0..36, chân đỉnh chạm y=36.
const T = require('./colors').TIERS[0];
const P = 'shop_loidien-crest-';
function crestTop(_tier, _W, _H) {
  const defs = `<defs><linearGradient id="${P}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.main}"/><stop offset="1" stop-color="${T.storm}"/></linearGradient><linearGradient id="${P}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.bolt}"/><stop offset="1" stop-color="${T.accent}"/></linearGradient></defs>`;
  const cloud = `<path d="M-70 36C-70 30 -62 28 -58 31C-56 25 -46 25 -44 30C-40 24 -30 24 -27 30L27 30C30 24 40 24 44 30C46 25 56 25 58 31C62 28 70 30 70 36Z" fill="url(#${P}c)" stroke="${T.accent}" stroke-width="1" opacity="0.95"/>`;
  const side = (s) => `<g transform="scale(${s} 1)"><path d="M34 6L28 17L33 17L28 29" fill="none" stroke="${T.accent}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><path d="M18 14C24 10 22 4 26 2" fill="none" stroke="${T.light}" stroke-width="1" opacity="0.7" stroke-linecap="round"/></g>`;
  const halo = `<circle cy="18" r="15" fill="none" stroke="${T.main}" stroke-width="1" opacity="0.5" stroke-dasharray="3 4"/>`;
  const bolt = `<path d="M5 0L-9 17L-1 17L-7 36L13 11L4 11Z" fill="url(#${P}b)" stroke="${T.main}" stroke-width="1.4" stroke-linejoin="round"/>`;
  return defs + side(1) + side(-1) + halo + cloud + bolt;
}
module.exports = { crestTop };
