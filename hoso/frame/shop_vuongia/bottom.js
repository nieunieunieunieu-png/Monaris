// ===== hoso/frame/shop_vuongia/bottom.js — CẠNH DƯỚI: thảm nhung đỏ thắt nơ vàng =====
// Hình học: gốc giữa mép dưới; y ∈ [-4, 12] (cao 16), nửa rộng ≤ 66, đối xứng quanh x=0 (hệ thống phóng ×1.5).
const T = require('./colors').TIERS[0];
const P = 'shop_vuongia-bottom-';
function decorBottom(_tier, W, H) {
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.5" stop-color="${T.main}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient><linearGradient id="${P}v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.ruby}"/><stop offset="1" stop-color="${T.rubyDark}"/></linearGradient></defs>`;
  const carpet = `<path d="M-64 10L-56 -1H56L64 10Z" fill="url(#${P}v)" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/><path d="M-60 7L-54 1H54L60 7Z" fill="none" stroke="${T.main}" stroke-width="1"/><path d="M-64 10H64" stroke="${T.main}" stroke-width="1.4"/>`;
  let fr = '';
  for (let x = -62; x <= 62; x += 4) fr += `M${x} 10.7V12.4`;
  const fringe = `<path d="${fr}" stroke="${T.main}" stroke-width="0.9"/>`;
  const bow = `<path d="M0 3C-6 -5 -16 -3 -14 3C-12 8 -5 6 0 3Z M0 3C6 -5 16 -3 14 3C12 8 5 6 0 3Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/><path d="M-1 5L-8 12L-4 10L-2 12.5Z M1 5L8 12L4 10L2 12.5Z" fill="${T.main}" stroke="${T.dark}" stroke-width="0.6" stroke-linejoin="round"/><circle cx="0" cy="3" r="2.8" fill="${T.main}" stroke="${T.dark}" stroke-width="0.8"/><circle cx="0" cy="3" r="1.2" fill="${T.ruby}"/>`;
  return defs + carpet + fringe + bow;
}
module.exports = { decorBottom };
