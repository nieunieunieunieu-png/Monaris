// ===== hoso/frame/shop_huyetnguyet/crest.js — ĐỈNH THẺ: trăng máu quấn xích sắt, mắt ma thuật giữa =====
// Hình học: gốc giữa cạnh trên; x ∈ [-60, 60], y ∈ [1, 36]; chân bệ chạm y=36; trăng tâm (0,18) r11.5; vòng xích r13.5.
const T = require('./colors').TIERS[0];
const P = 'shop_huyetnguyet-crest-';
function crestTop(_tier, W, H) {
  const defs = `<defs><radialGradient id="${P}m" cx="0.35" cy="0.3" r="0.9"><stop offset="0" stop-color="${T.light}"/><stop offset="0.5" stop-color="${T.main}"/><stop offset="1" stop-color="${T.dark}"/></radialGradient><linearGradient id="${P}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.main}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.ironLight}"/><stop offset="0.5" stop-color="${T.iron}"/><stop offset="1" stop-color="${T.black}"/></linearGradient>`
    + `<g id="${P}a"><ellipse cx="13.5" cy="0" rx="1.7" ry="3" fill="none" stroke="${T.black}" stroke-width="2.2"/><ellipse cx="13.5" cy="0" rx="1.7" ry="3" fill="none" stroke="${T.iron}" stroke-width="1.2"/></g><g id="${P}b"><ellipse cx="13.5" cy="0" rx="0.8" ry="2.6" fill="${T.iron}" stroke="${T.black}" stroke-width="0.5"/></g></defs>`;
  const blade = `<path d="M-20 35C-40 34 -52 24 -60 6C-54 16 -44 22 -20 31Z" fill="url(#${P}r)" stroke="${T.black}" stroke-width="1" stroke-linejoin="round"/><path d="M-26 33C-40 31 -50 24 -56 12" fill="none" stroke="${T.light}" stroke-width="0.6" stroke-opacity="0.7"/>`;
  const chainSide = `<path d="M-15 18C-30 18 -40 22 -50 28" fill="none" stroke="${T.black}" stroke-width="3.4" stroke-linecap="round"/><path d="M-15 18C-30 18 -40 22 -50 28" fill="none" stroke="${T.iron}" stroke-width="2" stroke-dasharray="3 1.6" stroke-linecap="round"/>`;
  const side = blade + chainSide;
  const pedestal = `<path d="M-26 36L-20 31.5H20L26 36Z" fill="url(#${P}g)" stroke="${T.black}" stroke-width="1" stroke-linejoin="round"/><path d="M-16 34H16" stroke="${T.main}" stroke-width="0.8" stroke-opacity="0.8"/>`;
  let ring = '';
  for (let a = 0, i = 0; a < 360; a += 30, i++) ring += `<use href="#${P}${i % 2 ? 'b' : 'a'}" transform="translate(0 18) rotate(${a})"/>`;
  const moon = `<circle cx="0" cy="18" r="11.5" fill="url(#${P}m)" stroke="${T.black}" stroke-width="1"/><path d="M-9.4 12A11 11 0 0 1 2 7" fill="none" stroke="${T.light}" stroke-width="0.9" stroke-opacity="0.6" stroke-linecap="round"/>`;
  const eye = `<path d="M-8.5 18Q0 10.5 8.5 18Q0 25.5 -8.5 18Z" fill="${T.light}" stroke="${T.black}" stroke-width="1" stroke-linejoin="round"/><circle cx="0" cy="18" r="3.4" fill="${T.ember}" stroke="${T.black}" stroke-width="0.6"/><ellipse cx="0" cy="18" rx="0.9" ry="3" fill="${T.black}"/><path d="M-4.4 12.6L-5.4 10.4M0 11.4V9M4.4 12.6L5.4 10.4" fill="none" stroke="${T.black}" stroke-width="0.9" stroke-linecap="round"/>`;
  return defs + side + `<g transform="scale(-1 1)">${side}</g>` + pedestal + moon + ring + eye;
}
module.exports = { crestTop };
