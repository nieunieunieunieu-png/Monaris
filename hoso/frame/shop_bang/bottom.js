// ===== hoso/frame/shop_bang/bottom.js — CẠNH DƯỚI: khối băng khắc hoa văn cổ =====
// Hình học: gốc giữa mép dưới; y ∈ [-4, 12] (cao 16), nửa rộng ≤ 70, đối xứng quanh x=0 (hệ thống phóng ×1.5).
const T = require('./colors').TIERS[0];
const P = 'shop_bang-bottom-';
function decorBottom(_tier, W, H) {
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.55" stop-color="${T.main}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient></defs>`;
  const half = (s) => `<g transform="scale(${s} 1)"><path d="M0 0H30L36 12H0Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.9" stroke-linejoin="round"/><path d="M0 -4L8 0H30L24 -2L16 0Z" fill="${T.light}" stroke="${T.dark}" stroke-width="0.7" stroke-linejoin="round"/><path d="M6 4H24V9H12V6.5H18" fill="none" stroke="${T.accent}" stroke-width="1" stroke-linejoin="miter"/><path d="M40 12L50 5L46 12Z M52 12L62 2L58 12Z M64 12L70 8L68 12Z" fill="${T.main}" stroke="${T.dark}" stroke-width="0.7" stroke-linejoin="round"/><path d="M-0.5 12H70" stroke="${T.light}" stroke-opacity="0.6" stroke-width="0.8"/></g>`;
  const mid = `<path d="M-6 0L0 -4L6 0L0 12Z" fill="${T.accent}" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/>`;
  return defs + half(1) + half(-1) + mid;
}
module.exports = { decorBottom };
