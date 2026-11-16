// ===== hoso/frame/shop_ulam/avatar.js — KHUNG AVATAR: vòng dây leo, hoa tiên nở, đom đóm =====
// Hình học: vành gỗ r 70..77; dây leo r 73.5±1.8; lá ngoài tối đa r≈83; lá trong tối thiểu r≈66; hoa r 70..80; đom đóm r ≤ 84.
const T = require('./colors').TIERS[0];
const P = 'shop_ulam-avatar-';
const n = (v) => Number(v.toFixed(2));
const rad = (d) => (d * Math.PI) / 180;
const pt = (r, deg) => [r * Math.cos(rad(deg)), r * Math.sin(rad(deg))];
const f2 = (p) => `${n(p[0])} ${n(p[1])}`;
// lá: gốc ở (r0, a), hướng lệch dir độ so với phương bán kính
function leaf(r0, a, dir, len, w) {
  const B = pt(r0, a); const phi = rad(a + dir);
  const c = [Math.cos(phi), Math.sin(phi)]; const pp = [-c[1], c[0]];
  const tip = [B[0] + len * c[0], B[1] + len * c[1]]; const mid = [B[0] + len * 0.5 * c[0], B[1] + len * 0.5 * c[1]];
  const c1 = [mid[0] + w * pp[0], mid[1] + w * pp[1]]; const c2 = [mid[0] - w * pp[0], mid[1] - w * pp[1]];
  return { d: `M${f2(B)}Q${f2(c1)} ${f2(tip)}Q${f2(c2)} ${f2(B)}Z`, v: `M${f2(B)}L${f2([B[0] + len * 0.8 * c[0], B[1] + len * 0.8 * c[1]])}` };
}
function flower(a) {
  const C = pt(75, a); let d = '';
  for (let i = 0; i < 5; i++) { const q = [C[0] + 2.7 * Math.cos(rad(a + i * 72)), C[1] + 2.7 * Math.sin(rad(a + i * 72))]; d += `M${n(q[0] - 2.4)} ${n(q[1])}a2.4 2.4 0 1 0 4.8 0a2.4 2.4 0 1 0 -4.8 0`; }
  return `<path d="${d}" fill="${T.bloom}" stroke="${T.bloomEdge}" stroke-width="0.5"/><circle cx="${n(C[0])}" cy="${n(C[1])}" r="1.5" fill="${T.core}" stroke="${T.woodDark}" stroke-width="0.4"/>`;
}
function avatarFrame(_tier, R = 70) {
  const k = Number((R / 70).toFixed(4));
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.wood}"/><stop offset="0.5" stop-color="${T.woodDark}"/><stop offset="1" stop-color="${T.wood}"/></linearGradient></defs>`;
  const ring = `<path fill-rule="evenodd" fill="url(#${P}g)" d="M-77 0 A77 77 0 1 0 77 0 A77 77 0 1 0 -77 0 Z M-70 0 A70 70 0 1 0 70 0 A70 70 0 1 0 -70 0 Z"/><circle r="70.6" fill="none" stroke="${T.light}" stroke-width="0.6" stroke-opacity="0.7"/>`;
  let vine = '';
  for (let a = 0; a <= 360; a += 5) vine += `${a ? 'L' : 'M'}${f2(pt(73.5 + 1.8 * Math.sin(rad(a * 10)), a))}`;
  const vineEl = `<path d="${vine}Z" fill="none" stroke="${T.dark}" stroke-width="2.8" stroke-linejoin="round"/><path d="${vine}Z" fill="none" stroke="${T.main}" stroke-width="1.6" stroke-linejoin="round"/>`;
  let ld = ''; let lv = '';
  for (let a = 6, i = 0; a < 360; a += 24, i++) {
    const o = leaf(76, a, i % 2 ? 38 : -38, 7, 5); ld += o.d; lv += o.v;
    const q = leaf(71, a + 12, i % 2 ? 142 : 218, 6, 4.4); ld += q.d; lv += q.v;
  }
  const leaves = `<path d="${ld}" fill="${T.main}" stroke="${T.dark}" stroke-width="0.6" stroke-linejoin="round"/><path d="${lv}" fill="none" stroke="${T.light}" stroke-width="0.4" stroke-opacity="0.8"/>`;
  const ff = (r, a) => { const c = pt(r, a); return `<circle cx="${n(c[0])}" cy="${n(c[1])}" r="3.2" fill="${T.firefly}" fill-opacity="0.25"/><circle cx="${n(c[0])}" cy="${n(c[1])}" r="1.1" fill="${T.firefly}"/>`; };
  const flies = ff(81, 14) + ff(79.5, 77) + ff(81.5, 130) + ff(80, 204) + ff(81, 247) + ff(79, 332) + ff(66, 100);
  return `${defs}<g transform="scale(${k})">${ring}${vineEl}${leaves}${flower(40)}${flower(160)}${flower(280)}${flies}</g>`;
}
module.exports = { avatarFrame };
