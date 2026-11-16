// ===== hoso/frame/shop_cyber/avatar.js — KHUNG AVATAR: 3 vòng đồng tâm + vạch chỉ số góc =====
// Hình học: vành r 70..77; vòng ngoài r 77.5; vạch chia r 78.6..83.6; cung neon r 72.8 & 76.2; chấm mốc r ≤ 84.
const T = require('./colors').TIERS[0];
const P = 'shop_cyber-avatar-';
const n = (v) => Number(v.toFixed(2));
const pol = (r, deg) => { const t = (deg * Math.PI) / 180; return `${n(r * Math.cos(t))} ${n(r * Math.sin(t))}`; };
const arc = (r, a0, a1) => `M${pol(r, a0)}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${pol(r, a1)}`;
function avatarFrame(_tier, R = 70) {
  const k = Number((R / 70).toFixed(4));
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.5" stop-color="${T.main}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient></defs>`;
  const ring = `<path fill-rule="evenodd" fill="${T.bg}" fill-opacity="0.7" d="M-77 0 A77 77 0 1 0 77 0 A77 77 0 1 0 -77 0 Z M-70 0 A70 70 0 1 0 70 0 A70 70 0 1 0 -70 0 Z"/><circle r="70.8" fill="none" stroke="url(#${P}g)" stroke-width="1.6"/><circle r="74.4" fill="none" stroke="${T.main}" stroke-width="0.6" stroke-opacity="0.8" stroke-dasharray="6 3 1.5 3"/><circle r="77.4" fill="none" stroke="url(#${P}g)" stroke-width="1.2"/>`;
  const arcs = `<path d="${arc(72.8, 20, 100)}${arc(72.8, 200, 290)}" fill="none" stroke="${T.main}" stroke-width="2.4" stroke-linecap="butt"/><path d="${arc(76.2, 110, 160)}${arc(76.2, 300, 350)}" fill="none" stroke="${T.pink}" stroke-width="1.6"/>`;
  let ticks = '';
  for (let a = 0; a < 360; a += 10) ticks += `M${pol(78.6, a)}L${pol(a % 30 === 0 ? 83.6 : 81.2, a)}`;
  const tk = `<path d="${ticks}" fill="none" stroke="${T.main}" stroke-width="0.8"/>`;
  let mk = '';
  [0, 90, 180, 270].forEach((a) => { mk += `M${pol(83.8, a)}L${pol(79.4, a - 2.6)}L${pol(79.4, a + 2.6)}Z`; });
  const nodes = [45, 135, 225, 315].map((a) => `<rect x="-1.5" y="-1.5" width="3" height="3" transform="rotate(${a}) translate(74.4 0) rotate(45)" fill="${T.pink}" stroke="${T.bg}" stroke-width="0.4"/>`).join('');
  return `${defs}<g transform="scale(${k})">${ring}${arcs}${tk}<path d="${mk}" fill="${T.pink}"/>${nodes}</g>`;
}
module.exports = { avatarFrame };
