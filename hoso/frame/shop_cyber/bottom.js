// ===== hoso/frame/shop_cyber/bottom.js — CẠNH DƯỚI: bảng mạch PCB + cổng cắm =====
// Hình học: gốc giữa mép dưới; y ∈ [-4, 12] (cao 16), nửa rộng ≤ 64, đối xứng quanh x=0 (hệ thống phóng ×1.5).
const T = require('./colors').TIERS[0];
const P = 'shop_cyber-bottom-';
function decorBottom(_tier, W, H) {
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4C6372"/><stop offset="1" stop-color="${T.steel}"/></linearGradient></defs>`;
  const board = `<path d="M-64 12V8L-60 5H60L64 8V12Z" fill="${T.bg}" stroke="${T.main}" stroke-width="0.9" stroke-linejoin="miter"/><path d="M-60 12V9.4M60 12V9.4" stroke="${T.main}" stroke-width="0.4"/>`;
  const half = `<path d="M-10 6H-24L-28 2H-36M-10 9H-44M-44 9L-47 6H-58" fill="none" stroke="${T.main}" stroke-width="0.9" stroke-linejoin="miter"/><rect x="-36" y="-1" width="9" height="5.4" fill="url(#${P}g)" stroke="${T.main}" stroke-width="0.7"/><path d="M-34.5 4.4V5.4M-31.5 4.4V5.4M-28.5 4.4V5.4M-34.5 -1V-2M-31.5 -1V-2M-28.5 -1V-2" stroke="${T.light}" stroke-width="0.7"/><circle cx="-31.5" cy="1.7" r="0.9" fill="${T.main}"/><circle cx="-58" cy="6" r="1.2" fill="${T.bg}" stroke="${T.main}" stroke-width="0.7"/><circle cx="-44" cy="9" r="1" fill="${T.bg}" stroke="${T.main}" stroke-width="0.6"/><rect x="-53" y="0.4" width="2.6" height="2.6" fill="${T.pink}"/>`;
  const port = `<path d="M-10 -3H10V8H-10Z" fill="url(#${P}g)" stroke="${T.main}" stroke-width="1" stroke-linejoin="miter"/><rect x="-7" y="-0.6" width="14" height="5.2" fill="${T.bg}" stroke="${T.main}" stroke-width="0.6"/><path d="M-5.4 0.6V3.6M-2.7 0.6V3.6M0 0.6V3.6M2.7 0.6V3.6M5.4 0.6V3.6" stroke="${T.light}" stroke-width="0.9"/><rect x="-2" y="5.4" width="4" height="1.6" fill="${T.pink}"/>`;
  return defs + board + half + `<g transform="scale(-1 1)">${half}</g>` + port;
}
module.exports = { decorBottom };
