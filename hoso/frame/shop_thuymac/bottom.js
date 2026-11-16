// ===== hoso/frame/shop_thuymac/bottom.js — CẠNH DƯỚI (nâng cấp): 3 lớp núi xa mờ sương + trúc nhỏ + chim bay + mặt trời đỏ =====
// Hình học: gốc giữa mép dưới; y ∈ [-4, 12]; nửa rộng ≤ 70 (đối xứng x=0, hệ thống phóng ×1.5); gradient opacity giảm dần về chân núi.
const T = require('./colors').TIERS[0];
const P = 'shop_thuymac-bottom-';
function decorBottom(_tier, _W, _H) {
  const defs = `<defs><linearGradient id="${P}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.ink}" stop-opacity="0.85"/><stop offset="1" stop-color="${T.ink}" stop-opacity="0"/></linearGradient><linearGradient id="${P}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.wash}" stop-opacity="0.55"/><stop offset="1" stop-color="${T.main}" stop-opacity="0"/></linearGradient><linearGradient id="${P}v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.main}" stop-opacity="0.3"/><stop offset="1" stop-color="${T.main}" stop-opacity="0"/></linearGradient></defs>`;
  const far = `<path d="M-70 12L-60 3L-52 6L-44 -2L-34 5L-22 1L-10 6L4 -1L18 5L30 0L42 6L54 1L62 4L70 12Z" fill="url(#${P}v)"/>`;
  const back = `<path d="M-64 12L-48 1L-36 5L-20 -4L-2 3L14 -2L28 5L42 -1L54 5L64 12Z" fill="url(#${P}b)"/>`;
  const front = `<path d="M-70 12L-58 4L-50 7L-38 0L-26 6L-16 2L-4 7L8 -1L20 6L34 3L48 8L58 3L70 12Z" fill="url(#${P}f)"/>`;
  const mist = `<ellipse cx="0" cy="9" rx="60" ry="2.2" fill="${T.light}" fill-opacity="0.3"/><ellipse cx="-30" cy="5" rx="20" ry="1.3" fill="${T.light}" fill-opacity="0.25"/><ellipse cx="32" cy="6.5" rx="18" ry="1.2" fill="${T.light}" fill-opacity="0.22"/><ellipse cx="0" cy="3" rx="14" ry="0.9" fill="${T.light}" fill-opacity="0.2"/>`;
  const sun = `<circle cx="-30" cy="-0.5" r="1.4" fill="${T.accent}" fill-opacity="0.85"/>`;
  let bamboo = '';
  [[-64, 1], [-60, 0.8], [62, 0.9], [66, 0.7]].forEach(([x, s]) => { bamboo += `<path d="M${x} 11.5Q${x + 0.6 * s} 6 ${x - 0.4 * s} ${Number((11.5 - 9 * s).toFixed(2))}" fill="none" stroke="${T.ink}" stroke-opacity="0.6" stroke-width="0.7"/><path d="M${x - 0.2} ${Number((11.5 - 6 * s).toFixed(2))}l${-3 * s} ${-1.4 * s}M${x + 0.2} ${Number((11.5 - 4 * s).toFixed(2))}l${3 * s} ${-1.2 * s}" stroke="${T.ink}" stroke-opacity="0.55" stroke-width="0.5" stroke-linecap="round"/>`; });
  const birds = `<path d="M-44 -3Q-42.6 -4.4 -41.2 -3Q-39.8 -4.4 -38.4 -3M40 -2.4Q41 -3.4 42 -2.4Q43 -3.4 44 -2.4" fill="none" stroke="${T.ink}" stroke-opacity="0.6" stroke-width="0.5" stroke-linecap="round"/>`;
  return defs + far + back + sun + front + mist + bamboo + birds;
}
module.exports = { decorBottom };
