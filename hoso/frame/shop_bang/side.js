// ===== hoso/frame/shop_bang/side.js — CẠNH TRÁI: băng đăng chóp nhọn rủ xuống =====
// Hình học: 1 đơn vị cao 100 (y 0..100), rộng x ∈ [-15, 15]; trục x=0 liền mạch ở y=0 và y=100.
const T = require('./colors').TIERS[0];
const P = 'shop_bang-side-';
function sideUnit(_tier, W, H) {
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${T.light}"/><stop offset="0.5" stop-color="${T.main}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient></defs>`;
  const spine = `<path d="M0 0V100" stroke="${T.main}" stroke-width="2.4"/><path d="M0 0V100" stroke="${T.accent}" stroke-opacity="0.6" stroke-width="0.8"/>`;
  const lamp = `<path d="M0 8L10 28L6 52L0 88L-6 52L-10 28Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="1" stroke-linejoin="round"/><path d="M0 8V88M-10 28L-6 52M10 28L6 52M-10 28L10 28" fill="none" stroke="${T.accent}" stroke-opacity="0.8" stroke-width="0.7"/>`;
  const drops = `<path d="M-3 4L-13 14L-4 22Z M3 4L13 14L4 22Z" fill="${T.light}" fill-opacity="0.85" stroke="${T.dark}" stroke-width="0.6" stroke-linejoin="round"/><path d="M-3 60L-12 72L-4 80Z M3 60L12 72L4 80Z" fill="${T.main}" stroke="${T.dark}" stroke-width="0.6" stroke-linejoin="round"/><path d="M0 92L3 96L0 100L-3 96Z" fill="${T.light}" stroke="${T.dark}" stroke-width="0.6"/>`;
  return defs + spine + drops + lamp;
}
module.exports = { sideUnit };
