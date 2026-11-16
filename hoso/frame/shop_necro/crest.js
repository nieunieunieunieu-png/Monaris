// ===== hoso/frame/shop_necro/crest.js — ĐỈNH THẺ: sọ cừu + ngũ giác ngược =====
// Hình học: gốc giữa cạnh trên; x ∈ [-80,80], y ∈ [0,36]; chân chạm y=36; hệ thống phóng ×2.
const T = require('./colors').TIERS[0];
const P = 'shop_necro-crest-';
function crestTop(_tier, _W, _H) {
  const defs = `<defs><linearGradient id="${P}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.bone}"/><stop offset="1" stop-color="${T.boneDark}"/></linearGradient><radialGradient id="${P}e" cx="0.5" cy="0.3" r="0.8"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="${T.flame}"/></radialGradient></defs>`;
  const penta = `<path d="M0 6L7.6 11.2L4.8 19.6H-4.8L-7.6 11.2Z" fill="none" stroke="${T.main}" stroke-width="1" stroke-opacity="0.8"/>`;
  const skull = `<path d="M-13 20C-13 11 -7.6 5 0 5C7.6 5 13 11 13 20C13 27 9 30 9 36L-9 36C-9 30 -13 27 -13 20Z" fill="url(#${P}b)" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/>`;
  const horn = (sx) => `<path d="M${9 * sx} 11C${16 * sx} 8 ${19 * sx} 3 ${16 * sx} 0C${17 * sx} 5 ${14 * sx} 7 ${8 * sx} 8Z" fill="url(#${P}b)" stroke="${T.dark}" stroke-width="0.7" stroke-linejoin="round"/>`;
  const eyes = `<circle cx="-5.4" cy="18" r="2.6" fill="url(#${P}e)"/><circle cx="5.4" cy="18" r="2.6" fill="url(#${P}e)"/>`;
  const nose = `<path d="M-2.4 25H2.4L1.6 30H-1.6Z" fill="${T.dark}"/><path d="M-3 36H3" stroke="${T.dark}" stroke-width="1"/>`;
  return defs + penta + horn(1) + horn(-1) + skull + eyes + nose;
}
module.exports = { crestTop };
