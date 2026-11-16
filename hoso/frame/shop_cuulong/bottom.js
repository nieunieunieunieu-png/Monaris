// ===== hoso/frame/shop_cuulong/bottom.js — CHÂN THẺ Chí Tôn (CLCT-2): đĩa Thao Thiết (rồng 8) ôm ngọc đáy + cánh vàng hai bên =====
// Gốc giữa mép dưới, đối xứng quanh x=0, nửa rộng ≤ 70, đĩa treo xuống (y 0..~28 cục bộ) — BOT_M 44–72 ở lề Chí Tôn chứa được.
const { ctxOf, dragonDisc, goldGrad, round2 } = require('./shared');
const { TIERS } = require('./colors');

function decorBottom(tier, W, H, rawCtx) {
  const T = TIERS[0];
  const c = ctxOf(rawCtx);
  const P = 'clbt-';
  let s = `<defs>${goldGrad(`${P}g`, T, 0, 1)}<g id="${P}w"><path d="M13 3Q36 8 68 2Q52 10 40 9Q26 12 13 8Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.7" stroke-linejoin="round"/>`
    + `<path d="M16 4.6Q38 8 62 3" fill="none" stroke="${T.light}" stroke-opacity="0.8" stroke-width="0.7"/>`
    + `<path d="M30 9L34 13L38 9Z M46 8L49 11.5L52.5 8Z" fill="${T.gold3}" stroke="${T.dark}" stroke-width="0.4"/><circle cx="68" cy="2" r="1.6" fill="${T.gold3}" stroke="${T.dark}" stroke-width="0.4"/></g></defs>`;
  s += `<use href="#${P}w"/><use href="#${P}w" transform="scale(-1 1)"/>`;
  // ngọc đáy (hạt châu) giữa 2 cánh, đĩa Thao Thiết đè lên
  s += dragonDisc(T, P, 7, c, 0, 14, 180, 14, 11);
  if (c.n >= 3) s += `<circle cx="-22" cy="4" r="1.8" fill="${T.gold3}" stroke="${T.dark}" stroke-width="0.4"/><circle cx="22" cy="4" r="1.8" fill="${T.gold3}" stroke="${T.dark}" stroke-width="0.4"/>`;
  return round2(s);
}
module.exports = { decorBottom };
