// ===== hoso/frame/shop_glass/avatar.js — KHUNG AVATAR (nâng cấp): vòng kính mờ + glow đồng tâm + 4 khối kính thoi chéo + dải khúc xạ màu =====
// Hình học: vành r 70..77 (fill-opacity 0.35); 3 vòng glow r 77..83.8 giảm opacity; vệt phản quang cung góc 200°..250°; 4 thoi kính nhỏ ở 45°/135°/225°/315° (tâm r 78, nửa đường chéo 4.6, r ≤ 83); dải khúc xạ xanh/hồng cung 300°..350° r 73.5; vòng viền trong r 68.5; mọi nét r ≤ 83.8.
const T = require('./colors').TIERS[0];
const P = 'shop_glass-avatar-';
const n = (v) => Number(v.toFixed(2));
const rad = (d) => (d * Math.PI) / 180;
const pt = (r, a) => `${n(r * Math.cos(rad(a)))} ${n(r * Math.sin(rad(a)))}`;
function avatarFrame(_tier, R = 70) {
  const k = Number((R / 70).toFixed(4));
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.75"/><stop offset="0.5" stop-color="${T.frost}" stop-opacity="0.3"/><stop offset="1" stop-color="${T.accent}" stop-opacity="0.45"/></linearGradient></defs>`;
  const ring = `<path fill-rule="evenodd" fill="url(#${P}g)" d="M-77 0 A77 77 0 1 0 77 0 A77 77 0 1 0 -77 0 Z M-70 0 A70 70 0 1 0 70 0 A70 70 0 1 0 -70 0 Z"/>`;
  const glow = `<circle r="78.6" fill="none" stroke="#FFFFFF" stroke-opacity="0.26" stroke-width="3.2"/><circle r="81.2" fill="none" stroke="#FFFFFF" stroke-opacity="0.15" stroke-width="2"/><circle r="83.1" fill="none" stroke="${T.accent}" stroke-opacity="0.1" stroke-width="1.4"/>`;
  const edge = `<circle r="70.4" fill="none" stroke="#FFFFFF" stroke-opacity="0.8" stroke-width="0.8"/><circle r="77" fill="none" stroke="${T.dark}" stroke-opacity="0.4" stroke-width="0.6"/>`;
  const gloss = `<path d="M${pt(73.5, 200)}A73.5 73.5 0 0 1 ${pt(73.5, 252)}" fill="none" stroke="#FFFFFF" stroke-opacity="0.85" stroke-width="1.8" stroke-linecap="round"/><path d="M${pt(73.5, 262)}A73.5 73.5 0 0 1 ${pt(73.5, 272)}" fill="none" stroke="#FFFFFF" stroke-opacity="0.7" stroke-width="1.8" stroke-linecap="round"/><path d="M${pt(73.5, 18)}A73.5 73.5 0 0 1 ${pt(73.5, 62)}" fill="none" stroke="${T.accent}" stroke-opacity="0.7" stroke-width="1.4" stroke-linecap="round"/>`;
  const flare = `<circle cx="${pt(73.5, 226).split(' ')[0]}" cy="${pt(73.5, 226).split(' ')[1]}" r="2.2" fill="#FFFFFF" fill-opacity="0.9"/><circle cx="${pt(73.5, 40).split(' ')[0]}" cy="${pt(73.5, 40).split(' ')[1]}" r="1.4" fill="#FFFFFF" fill-opacity="0.7"/>`;
  const facets = [45, 135, 225, 315].map((ang, i) => { const [cx, cy] = pt(78, ang).split(' '); const s = i % 2 ? 3.8 : 4.6; return `<path d="M${cx} ${n(cy - s)}L${n(+cx + s)} ${cy}L${cx} ${n(+cy + s)}L${n(cx - s)} ${cy}Z" fill="url(#${P}g)" fill-opacity="0.95" stroke="#FFFFFF" stroke-opacity="0.85" stroke-width="0.9" stroke-linejoin="round"/><path d="M${cx} ${n(cy - s * 0.5)}L${n(+cx + s * 0.5)} ${cy}" stroke="#FFFFFF" stroke-opacity="0.7" stroke-width="0.7" stroke-linecap="round"/>`; }).join('');
  const refr = `<path d="M${pt(73.5, 300)}A73.5 73.5 0 0 1 ${pt(73.5, 322)}" fill="none" stroke="#8EC5FF" stroke-opacity="0.65" stroke-width="2" stroke-linecap="round"/><path d="M${pt(73.5, 326)}A73.5 73.5 0 0 1 ${pt(73.5, 350)}" fill="none" stroke="#F3B7DD" stroke-opacity="0.6" stroke-width="2" stroke-linecap="round"/><path d="M${pt(73.5, 100)}A73.5 73.5 0 0 1 ${pt(73.5, 122)}" fill="none" stroke="#C4F0D8" stroke-opacity="0.55" stroke-width="1.6" stroke-linecap="round"/>`;
  const inner = `<circle r="68.6" fill="none" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="1.2"/>`;
  const bokeh = [[88, 80.6, 1.3], [160, 80.2, 1], [20, 80.4, 1.1], [200, 81, 0.9]].map(([ang, r, rr]) => { const [x, y] = pt(r, ang).split(' '); return `<circle cx="${x}" cy="${y}" r="${rr}" fill="#FFFFFF" fill-opacity="0.65"/>`; }).join('');
  return `${defs}<g transform="scale(${k})">${glow}${ring}${inner}${edge}${gloss}${refr}${flare}${bokeh}${facets}</g>`;
}
module.exports = { avatarFrame };
