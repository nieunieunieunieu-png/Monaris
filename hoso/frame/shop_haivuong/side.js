// ===== hoso/frame/shop_haivuong/side.js — CẠNH TRÁI: thân san hô liền mạch + polyp đỏ xen kẽ + sóng bọt =====
// Hình học: 1 đơn vị cao 100 (y 0..100), rộng x ∈ [-15, 15]; trục x=0 liền mạch ở y=0 / 50 / 100.
const T = require('./colors').TIERS[0];
const P = 'shop_haivuong-side-';
function sideUnit(_tier, W, H) {
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${T.coral}"/><stop offset="1" stop-color="${T.coralDark}"/></linearGradient><radialGradient id="${P}p" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="${T.pearl}"/></radialGradient></defs>`;
  const wave = `<path d="M-9 0C-4 12 -14 24 -8 37C-3 50 -13 62 -8 75C-4 87 -11 94 -9 100" fill="none" stroke="${T.foam}" stroke-opacity="0.6" stroke-width="1"/><path d="M0 0V100" stroke="${T.goldDark}" stroke-width="3.4"/><path d="M0 0V100" stroke="${T.gold}" stroke-width="1.6"/>`;
  const branch = (y, s) => `<path d="M0 ${y}C${5 * s} ${y - 2} ${9 * s} ${y - 6} ${10 * s} ${y - 13}C${11 * s} ${y - 15} ${13 * s} ${y - 14} ${12 * s} ${y - 11}C${11 * s} ${y - 5} ${8 * s} ${y + 1} 0 ${y + 4}Z" fill="url(#${P}g)" stroke="${T.coralDark}" stroke-width="0.7" stroke-linejoin="round"/><path d="M${3 * s} ${y - 1}C${6 * s} ${y - 4} ${8 * s} ${y - 8} ${9 * s} ${y - 11}" fill="none" stroke="${T.pearl}" stroke-opacity="0.7" stroke-width="0.6"/>`;
  const polyps = branch(24, 1) + branch(48, -1) + branch(72, 1) + branch(96, -1) + branch(12, -1) + branch(60, 1);
  const pearls = `<circle cx="0" cy="36" r="2.4" fill="url(#${P}p)" stroke="${T.goldDark}" stroke-width="0.5"/><circle cx="0" cy="84" r="2.4" fill="url(#${P}p)" stroke="${T.goldDark}" stroke-width="0.5"/>`;
  return defs + wave + polyps + pearls;
}
module.exports = { sideUnit };
