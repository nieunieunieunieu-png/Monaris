// ===== hoso/frame/shop_thuymac/avatar.js — KHUNG AVATAR (nâng cấp): vòng cọ enso loang đậm nhạt + nét cọ bay (phi bạch) + vân mực + 2 con dấu =====
// Hình học: nét cọ polygon 30°→390° dày biến thiên 1.5..7 quanh r≈74 (trong r ≥ 70.4); lớp loang r≤79; giọt mực r≤82.5; nét cọ bay: 2 cụm tia thuôn ôm vòng (cung 285°..345° và 150°..215°, r 76..83.6); vân mực r 66..69; con dấu đỏ r≤83.
const T = require('./colors').TIERS[0];
const n = (v) => Number(v.toFixed(2));
const rad = (d) => (d * Math.PI) / 180;
const pt = (r, a) => `${n(r * Math.cos(rad(a)))} ${n(r * Math.sin(rad(a)))}`;
function brush(a0, a1, rm, tmax, tmin, ph) {
  const o = []; const i = [];
  for (let a = a0; a <= a1; a += 6) {
    const u = (a - a0) / (a1 - a0);
    const t = tmin + (tmax - tmin) * Math.pow(Math.sin(Math.PI * Math.min(1, u * 0.95 + 0.04)), 0.6) * (0.75 + 0.25 * Math.sin(a * 0.11 + ph));
    const r = rm + 1.1 * Math.sin(a * 0.07 + ph) + 0.6 * Math.sin(a * 0.31);
    o.push(pt(r + t / 2, a)); i.unshift(pt(r - t / 2, a));
  }
  return `M${o.join('L')}L${i.join('L')}Z`;
}
function avatarFrame(_tier, R = 70) {
  const k = Number((R / 70).toFixed(4));
  const wash = `<path d="${brush(40, 380, 75.5, 6.5, 1, 2)}" fill="${T.wash}" fill-opacity="0.35"/>`;
  const ink = `<path d="${brush(30, 390, 74, 7, 1.5, 0)}" fill="${T.ink}" fill-opacity="0.92"/>`;
  const dry = `<path d="M${pt(74.6, 70)}A74.6 74.6 0 0 1 ${pt(74.6, 150)}M${pt(73, 200)}A73 73 0 0 1 ${pt(73, 250)}M${pt(74.2, 290)}A74.2 74.2 0 0 1 ${pt(74.2, 335)}" fill="none" stroke="${T.light}" stroke-opacity="0.45" stroke-width="0.6" stroke-linecap="round"/>`;
  const edge = `<circle r="70.3" fill="none" stroke="${T.light}" stroke-opacity="0.5" stroke-width="0.6"/>`;
  const drops = [[18, 80.5, 1.6], [112, 79.5, 1.1], [262, 81, 1.9], [318, 79, 1.2], [352, 81.5, 0.9]].map(([a, r, s]) => { const [x, y] = pt(r, a).split(' '); return `<circle cx="${x}" cy="${y}" r="${s}" fill="${T.ink}" fill-opacity="0.75"/>`; }).join('');
  const tick = (ang, r0, len, w, op) => { const a1 = ang + len; const o = []; const inn = []; for (let s = 0; s <= 4; s++) { const u = s / 4; const aa = ang + (a1 - ang) * u; const rr = r0 + 4.4 * Math.sin(Math.PI * u * 0.5); const t = w * (1 - u) * (0.4 + 0.6 * Math.sin(Math.PI * Math.min(1, u + 0.2))); o.push(pt(rr + t / 2, aa)); inn.unshift(pt(rr - t / 2, aa)); } return `<path d="M${o.join('L')}L${inn.join('L')}Z" fill="${T.main}" fill-opacity="${op}"/>`; };
  let ticks = '';
  for (let i = 0; i < 9; i++) ticks += tick(285 + i * 6.5, 75.4 + (i % 3) * 1, 14 - (i % 3) * 3, 2.2 - (i % 3) * 0.3, n(0.95 - i * 0.05));
  for (let i = 0; i < 7; i++) ticks += tick(150 + i * 9.5, 75.4 + (i % 2) * 1.2, 12 - (i % 3) * 2, 1.9, n(0.9 - i * 0.07));
  const inner = `<path d="M${pt(67.6, 200)}A67.6 67.6 0 0 1 ${pt(67.6, 300)}" fill="none" stroke="${T.main}" stroke-opacity="0.4" stroke-width="2" stroke-linecap="round"/><path d="M${pt(68.2, 20)}A68.2 68.2 0 0 1 ${pt(68.2, 75)}" fill="none" stroke="${T.wash}" stroke-opacity="0.4" stroke-width="1.6" stroke-linecap="round"/>`;
  const [qx, qy] = pt(78.4, 232).split(' ');
  const seal2 = `<g transform="translate(${qx} ${qy}) rotate(-10)"><rect x="-2.4" y="-2.4" width="4.8" height="4.8" rx="0.7" fill="${T.accent}"/><path d="M-1.1 -1.2H1.1M0 -1.2V1.2" stroke="${T.light}" stroke-width="0.5" stroke-opacity="0.85" fill="none"/></g>`;
  const [sx, sy] = pt(79.5, 50).split(' ');
  const seal = `<g transform="translate(${sx} ${sy}) rotate(8)"><rect x="-3.4" y="-3.4" width="6.8" height="6.8" rx="0.8" fill="${T.accent}"/><path d="M-1.6 -1.8H1.6M0 -1.8V1.8M-1.6 1.2H1.6" stroke="${T.light}" stroke-width="0.7" stroke-opacity="0.85" fill="none"/></g>`;
  return `<g transform="scale(${k})">${wash}${inner}${ink}${ticks}${dry}${edge}${drops}${seal}${seal2}</g>`;
}
module.exports = { avatarFrame };
