// ===== hoso/frame/shop_longvan/avatar.js — KHUNG AVATAR (làm lại): vành vàng khắc vảy rồng + 11 xoáy mây + sừng rồng + ngọc đỏ =====
// Hình học: vành r70..77, vảy r72..77, viền r79; mây r74..84; sừng ≤ r83; nét đứt đỏ phía trong r=66.5 (≥64).
const T = require('./colors').TIERS[0];
const P = 'shop_longvan-avatar-';
const n = (v) => Number(v.toFixed(2));
const pol = (r, a) => [n(r * Math.sin((a * Math.PI) / 180)), n(-r * Math.cos((a * Math.PI) / 180))];
function avatarFrame(_tier, R = 70) {
  const k = n(R / 70);
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.5" stop-color="${T.main}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient><radialGradient id="${P}p" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#FFB4A8"/><stop offset="0.5" stop-color="${T.red}"/><stop offset="1" stop-color="${T.redDark}"/></radialGradient><g id="${P}c"><path d="M-8.5 2C-9.5 -4 -4 -8 -0.5 -4.5C0 -9 7 -8.5 7.5 -4C9.5 -6 10.5 -1 9 2Z" fill="${T.cloud}" stroke="${T.main}" stroke-width="0.8"/><path d="M-1 -3C-1 -5.2 2 -5.2 2 -3C2 -1.8 0.3 -1.8 0.3 -3" fill="none" stroke="${T.main}" stroke-width="0.7"/></g></defs>`;
  const ring = `<path fill-rule="evenodd" fill="url(#${P}g)" d="M-77 0 A77 77 0 1 0 77 0 A77 77 0 1 0 -77 0 Z M-70 0 A70 70 0 1 0 70 0 A70 70 0 1 0 -70 0 Z"/><circle r="79" fill="none" stroke="${T.main}" stroke-width="0.9" opacity="0.8"/><circle r="70.7" fill="none" stroke="${T.dark}" stroke-width="0.7" opacity="0.6"/>`;
  let sc = '';
  for (let a = 0; a < 360; a += 12) { const [x1, y1] = pol(76.4, a - 5.5); const [cx, cy] = pol(72.6, a); const [x2, y2] = pol(76.4, a + 5.5); sc += `M${x1} ${y1}Q${cx} ${cy} ${x2} ${y2}`; }
  const scales = `<path d="${sc}" fill="none" stroke="${T.dark}" stroke-width="0.9" opacity="0.65"/>`;
  let clouds = '';
  for (let i = 1; i < 12; i++) clouds += `<use href="#${P}c" transform="rotate(${n(i * 30)}) translate(0 -76)"/>`;
  const horn = (s) => `<g transform="scale(${s} 1)"><path d="M5 -78.5C8 -82 12 -82.5 15 -80.5C11 -80.5 9 -78.5 8 -76.5Z" fill="${T.light}" stroke="${T.dark}" stroke-width="0.6" stroke-linejoin="round"/><path d="M5.5 -81C9 -84 5 -84 3.5 -83" fill="none" stroke="${T.main}" stroke-width="1" stroke-linecap="round"/></g>`;
  const pearl = `<circle cy="-76.5" r="6.4" fill="${T.main}" stroke="${T.dark}" stroke-width="0.6"/><circle cy="-76.5" r="4.9" fill="url(#${P}p)"/><ellipse cx="-1.6" cy="-78.2" rx="1.5" ry="1" fill="#FFF" opacity="0.75"/>`;
  const inner = `<circle r="66.5" fill="none" stroke="${T.red}" stroke-width="1.4" stroke-dasharray="2 6" opacity="0.8"/>`;
  return `${defs}<g transform="scale(${k})">${ring}${scales}${clouds}${horn(1)}${horn(-1)}${pearl}${inner}</g>`;
}
module.exports = { avatarFrame };
