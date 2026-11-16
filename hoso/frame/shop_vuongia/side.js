// ===== hoso/frame/shop_vuongia/side.js — CẠNH TRÁI: cột trụ La Mã mini =====
// Hình học: 1 đơn vị cao 100 (y 0..100), rộng x ∈ [-10, 10]; thân cột x ±5 liền mạch ở y=0 và y=100.
const T = require('./colors').TIERS[0];
const P = 'shop_vuongia-side-';
function sideUnit(_tier, W, H) {
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${T.dark}"/><stop offset="0.35" stop-color="${T.light}"/><stop offset="0.7" stop-color="${T.main}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient></defs>`;
  const shaft = `<rect x="-5" y="0" width="10" height="100" fill="url(#${P}g)"/><path d="M-1.8 0V100M1.8 0V100" stroke="${T.dark}" stroke-opacity="0.55" stroke-width="0.7"/><path d="M-5 0V100M5 0V100" stroke="${T.dark}" stroke-width="0.9"/>`;
  const caps = `<path d="M-9 0H9V3H6V6H-6V3H-9Z" fill="${T.main}" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/><path d="M-9 100H9V97H6V94H-6V97H-9Z" fill="${T.main}" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/>`;
  const gem = `<path d="M0 41L6 50L0 59L-6 50Z" fill="${T.ruby}" stroke="${T.main}" stroke-width="1.4" stroke-linejoin="round"/><path d="M0 44L3 50L0 56L-3 50Z" fill="${T.rubyDark}" fill-opacity="0.45"/><path d="M-1.6 46.5L-0.4 46L-2.4 49Z" fill="#FFFFFF"/>`;
  const rings = `<rect x="-7" y="24" width="14" height="2.4" fill="${T.main}" stroke="${T.dark}" stroke-width="0.6"/><rect x="-7" y="73.6" width="14" height="2.4" fill="${T.main}" stroke="${T.dark}" stroke-width="0.6"/>`;
  return defs + shaft + rings + gem + caps;
}
module.exports = { sideUnit };
