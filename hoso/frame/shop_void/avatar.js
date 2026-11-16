// ===== hoso/frame/shop_void/avatar.js — KHUNG AVATAR: vòng xoáy tinh vân + vương miện sao =====
// Hình học: vành r 70..77; vệt xoáy r 71..78; vương miện sao ở đỉnh (246°..294°) r 77.8..83.9; bụi sao r ≤ 83.
const T = require('./colors').TIERS[0];
const P = 'shop_void-avatar-';
const n = (v) => Number(v.toFixed(2));
const pol = (r, deg) => { const t = (deg * Math.PI) / 180; return [n(r * Math.cos(t)), n(r * Math.sin(t))]; };
const ps = (r, deg) => pol(r, deg).join(' ');
const arc = (r, a0, a1) => `M${ps(r, a0)}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${ps(r, a1)}`;
function star(cx, cy, s, f) {
  const q = Number((s * 0.28).toFixed(2));
  return `<path d="M${n(cx)} ${n(cy - s)}L${n(cx + q)} ${n(cy - q)}L${n(cx + s)} ${n(cy)}L${n(cx + q)} ${n(cy + q)}L${n(cx)} ${n(cy + s)}L${n(cx - q)} ${n(cy + q)}L${n(cx - s)} ${n(cy)}L${n(cx - q)} ${n(cy - q)}Z" fill="${f}"/>`;
}
function avatarFrame(_tier, R = 70) {
  const k = Number((R / 70).toFixed(4));
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.dark}"/><stop offset="0.5" stop-color="${T.main}"/><stop offset="1" stop-color="${T.deep}"/></linearGradient></defs>`;
  const ring = `<path fill-rule="evenodd" fill="url(#${P}g)" d="M-77 0 A77 77 0 1 0 77 0 A77 77 0 1 0 -77 0 Z M-70 0 A70 70 0 1 0 70 0 A70 70 0 1 0 -70 0 Z"/><circle r="70.6" fill="none" stroke="${T.light}" stroke-width="0.8" stroke-opacity="0.8"/><circle r="76.5" fill="none" stroke="${T.light}" stroke-width="0.5" stroke-opacity="0.5"/>`;
  const swirl = (c, a0, len, r) => `<path d="${arc(r, a0, a0 + len)}" fill="none" stroke="${c}" stroke-width="4.2" stroke-opacity="0.22" stroke-linecap="round"/><path d="${arc(r, a0 + len * 0.25, a0 + len)}" fill="none" stroke="${c}" stroke-width="2.4" stroke-opacity="0.5" stroke-linecap="round"/><path d="${arc(r, a0 + len * 0.55, a0 + len)}" fill="none" stroke="${c}" stroke-width="1.1" stroke-linecap="round"/>`;
  const swirls = swirl(T.light, 20, 95, 73.5) + swirl(T.cyan, 140, 80, 73.5) + swirl(T.cyan, 320, 40, 73.5);
  const crown = `<path d="${arc(78.4, 246, 294)}" fill="none" stroke="${T.light}" stroke-width="0.9"/>` + [246, 258, 282, 294].map((a) => { const p = pol(79.6, a); return star(p[0], p[1], 3, T.star); }).join('') + (() => { const p = pol(79.6, 270); return star(p[0], p[1], 4.3, T.cyan); })();
  const dust = [[82, 20], [80.5, 66], [82.5, 118], [81, 160], [83, 205], [81, 322], [80, 350], [66.5, 40], [66.8, 205]].map((d, i) => { const p = pol(d[0], d[1]); return `<circle cx="${p[0]}" cy="${p[1]}" r="${i % 3 ? 0.7 : 1.1}" fill="${i % 2 ? T.cyan : T.star}"/>`; }).join('');
  return `${defs}<g transform="scale(${k})">${ring}${swirls}${crown}${dust}</g>`;
}
module.exports = { avatarFrame };
