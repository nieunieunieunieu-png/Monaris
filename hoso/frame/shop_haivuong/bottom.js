// ===== hoso/frame/shop_haivuong/bottom.js — CẠNH DƯỚI: vỏ sò ngọc trai phát sáng + 2 vỏ nhỏ + bọt =====
// Hình học: gốc giữa mép dưới; y ∈ [-3, 11] (cao 14), nửa rộng ≤ 66, đối xứng quanh x=0 (hệ thống phóng ×1.5).
const T = require('./colors').TIERS[0];
const P = 'shop_haivuong-bottom-';
function decorBottom(_tier, W, H) {
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.goldLight}"/><stop offset="0.5" stop-color="${T.gold}"/><stop offset="1" stop-color="${T.goldDark}"/></linearGradient><radialGradient id="${P}p" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.5" stop-color="${T.pearl}"/><stop offset="1" stop-color="${T.light}"/></radialGradient><radialGradient id="${P}o" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${T.foam}" stop-opacity="0.6"/><stop offset="1" stop-color="${T.light}" stop-opacity="0"/></radialGradient></defs>`;
  const glow = `<ellipse cx="0" cy="4" rx="30" ry="7" fill="url(#${P}o)"/>`;
  const shell = (s, y) => `<g transform="translate(0 ${y}) scale(${s})"><path d="M-24 10Q-26 -2 0 -3Q26 -2 24 10Z" fill="url(#${P}g)" stroke="${T.goldDark}" stroke-width="0.9" stroke-linejoin="round"/><path d="M0 10L-20 2M0 10L-12 -1M0 10L-4 -2M0 10L4 -2M0 10L12 -1M0 10L20 2" stroke="${T.goldDark}" stroke-width="0.7" stroke-opacity="0.85"/><path d="M-24 10Q-12 7 0 10Q12 7 24 10" fill="none" stroke="${T.goldLight}" stroke-width="0.8"/></g>`;
  const pearl = `<circle cx="0" cy="3.4" r="4" fill="url(#${P}p)" stroke="${T.goldDark}" stroke-width="0.6"/><circle cx="-1.2" cy="2.2" r="1.1" fill="#FFFFFF"/>`;
  const wing = (s) => `<g transform="scale(${s} 1)"><path d="M32 11Q31 5 40 5Q50 5 49 11Z" fill="url(#${P}g)" stroke="${T.goldDark}" stroke-width="0.7" stroke-linejoin="round"/><path d="M40.5 11L35 7.5M40.5 11L40.5 5.6M40.5 11L46 7.5" stroke="${T.goldDark}" stroke-width="0.5"/><path d="M52 11C54 8 58 9 60 6C62 9 62 11 62 11Z" fill="${T.coral}" stroke="${T.coralDark}" stroke-width="0.6" stroke-linejoin="round"/><circle cx="44" cy="2" r="1" fill="${T.foam}" fill-opacity="0.35" stroke="${T.foam}" stroke-width="0.4"/><circle cx="55" cy="1" r="1.4" fill="${T.foam}" fill-opacity="0.3" stroke="${T.foam}" stroke-width="0.4"/><circle cx="64" cy="4" r="0.9" fill="${T.foam}" fill-opacity="0.3" stroke="${T.foam}" stroke-width="0.4"/></g>`;
  return defs + glow + wing(1) + wing(-1) + shell(1, 0) + pearl;
}
module.exports = { decorBottom };
