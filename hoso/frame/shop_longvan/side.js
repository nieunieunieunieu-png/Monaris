// ===== hoso/frame/shop_longvan/side.js — CẠNH BÊN (làm lại): thân rồng vàng khắc vảy + mây xoáy xen kẽ + ngọc đỏ (đơn vị 100px) =====
// Hình học: y 0..100, x −10..10, trục x=0 liền mạch ở y=0 và y=100.
const T = require('./colors').TIERS[0];
const P = 'shop_longvan-side-';
function sideUnit(_tier, _W, _H) {
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${T.dark}"/><stop offset="0.5" stop-color="${T.light}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient><g id="${P}c"><path d="M-9 0C-10 -4 -6 -6 -3.5 -3.5C-3 -8 4 -8 4.5 -3.5C7 -6 10 -3 9 0Z" fill="${T.cloud}" stroke="${T.main}" stroke-width="0.7"/><path d="M-1 -3.5C-1 -5.5 2 -5.5 2 -3.5C2 -2.3 0.2 -2.3 0.2 -3.4" fill="none" stroke="${T.main}" stroke-width="0.6"/></g></defs>`;
  const spine = `<path d="M0 0V100" stroke="${T.dark}" stroke-width="4.6" opacity="0.6"/><path d="M0 0V100" stroke="${T.main}" stroke-width="3.4"/><path d="M0 0V100" stroke="url(#${P}g)" stroke-width="1.6" opacity="0.9"/><path d="M0 0V100" stroke="${T.dark}" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="0.1 5" opacity="0.55"/>`;
  const clouds = `<use href="#${P}c" transform="translate(1.5 25) rotate(90)"/><use href="#${P}c" transform="translate(-1.5 75) rotate(-90)"/>`;
  const gem = `<path d="M0 42L5.5 50L0 58L-5.5 50Z" fill="${T.red}" stroke="${T.main}" stroke-width="1.2" stroke-linejoin="round"/><path d="M0 42L5.5 50L0 50Z" fill="#fff" opacity="0.4"/>`;
  const pearls = `<circle cy="8" r="1.6" fill="${T.light}" stroke="${T.main}" stroke-width="0.6"/><circle cy="92" r="1.6" fill="${T.light}" stroke="${T.main}" stroke-width="0.6"/><circle cy="38" r="1.3" fill="${T.red}"/><circle cy="62" r="1.3" fill="${T.red}"/>`;
  return defs + spine + clouds + gem + pearls;
}
module.exports = { sideUnit };
