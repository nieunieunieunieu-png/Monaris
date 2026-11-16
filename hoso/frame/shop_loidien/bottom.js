// ===== hoso/frame/shop_loidien/bottom.js — CHÂN THẺ: mây bão đối xứng + tia sét giáng xuống giữa =====
// Hình học: x −58..58, y −3..11, đối xứng quanh x=0.
const T = require('./colors').TIERS[0];
const P = 'shop_loidien-bottom-';
function decorBottom(_tier, _W, _H) {
  const defs = `<defs><linearGradient id="${P}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.main}"/><stop offset="1" stop-color="${T.storm}"/></linearGradient></defs>`;
  const half = `<path d="M0 4L-58 4C-58 -1 -50 -3 -46 0C-44 -5 -34 -5 -32 0C-29 -4 -18 -4 -15 1C-11 -3 -4 -2 0 1Z" fill="url(#${P}c)" stroke="${T.accent}" stroke-width="0.8"/><circle cx="-40" cy="7" r="1.4" fill="${T.accent}" opacity="0.8"/><circle cx="-22" cy="8" r="1.2" fill="${T.light}" opacity="0.7"/>`;
  return defs + half + `<g transform="scale(-1 1)">${half}</g>` + `<path d="M2 2L-4 6L0 6L-3 11L4 4L0.5 4Z" fill="${T.bolt}" stroke="${T.accent}" stroke-width="0.8" stroke-linejoin="round"/>`;
}
module.exports = { decorBottom };
