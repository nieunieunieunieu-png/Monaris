// ===== hoso/frame/shop_sakura/crest.js — ĐỈNH THẺ: quạt giấy vẽ cành đào + cành hoa hai bên =====
// Hình học: gốc giữa cạnh trên; x ∈ [-72, 72], y ∈ [2, 36]; chốt quạt ở (0,36) chạm y=36; đối xứng quanh x=0.
const T = require('./colors').TIERS[0];
const P = 'shop_sakura-crest-';
const n = (v) => Number(v.toFixed(2));
function petal(cx, cy, a, L) {
  const t = (a * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t), w = L * 0.42;
  const q = (x, y) => `${n(cx + x * c - y * s)} ${n(cy + x * s + y * c)}`;
  return `M${q(0, 0)}Q${q(-w, -L * 0.55)} ${q(-w * 0.55, -L)}L${q(0, -L * 0.82)}L${q(w * 0.55, -L)}Q${q(w, -L * 0.55)} ${q(0, 0)}Z`;
}
const flower = (cx, cy, rot, L) => [0, 1, 2, 3, 4].map((i) => petal(cx, cy, rot + i * 72, L)).join('');
function crestTop(_tier, W, H) {
  const defs = `<defs><linearGradient id="${P}p" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${T.accent}"/><stop offset="1" stop-color="${T.light}"/></linearGradient></defs>`;
  const cy = 36, R = 34, r0 = 9, a0 = -170, a1 = -10;
  const pp = (r, a) => { const t = (a * Math.PI) / 180; return `${n(r * Math.cos(t))} ${n(cy + r * Math.sin(t))}`; };
  const sector = `<path d="M${pp(r0, a0)}L${pp(R, a0)}A${R} ${R} 0 0 1 ${pp(R, a1)}L${pp(r0, a1)}A${r0} ${r0} 0 0 0 ${pp(r0, a0)}Z" fill="url(#${P}p)" stroke="${T.wood}" stroke-width="1.2" stroke-linejoin="round"/>`;
  let ribs = '';
  for (let i = 0; i <= 8; i++) { const a = a0 + ((a1 - a0) / 8) * i; ribs += `M${pp(r0, a)}L${pp(R, a)}`; }
  const handle = `<path d="M${pp(r0, a0)}A${r0} ${r0} 0 0 1 ${pp(r0, a1)}L0 ${cy}Z" fill="${T.wood}"/><circle cx="0" cy="${cy - 5}" r="1.6" fill="${T.accent}"/>`;
  const branch = `<path d="M-26 31C-12 27 6 21 25 10" fill="none" stroke="${T.wood}" stroke-width="1.8" stroke-linecap="round"/><path d="M-6 25L-9 17M10 17L13 24M18 13L26 15" fill="none" stroke="${T.wood}" stroke-width="1" stroke-linecap="round"/>`;
  const bloom = `<path d="${flower(-17, 27, 10, 5.2)}${flower(2, 21, 40, 5.6)}${flower(14, 14, 70, 5)}${flower(-9, 16, 15, 4.2)}${flower(26, 15, 25, 4)}" fill="${T.main}" stroke="${T.dark}" stroke-width="0.5" stroke-linejoin="round"/>`
    + `<circle cx="-17" cy="27" r="0.9" fill="${T.dark}"/><circle cx="2" cy="21" r="0.9" fill="${T.dark}"/><circle cx="14" cy="14" r="0.9" fill="${T.dark}"/>`;
  const sprig = `<path d="M40 36C52 31 60 31 70 24M56 30L57 22" fill="none" stroke="${T.wood}" stroke-width="1.6" stroke-linecap="round"/><path d="${flower(52, 31, 12, 4.8)}${flower(66, 26, 55, 4.2)}${flower(57, 21, 30, 3.6)}" fill="${T.main}" stroke="${T.dark}" stroke-width="0.5" stroke-linejoin="round"/><path d="${petal(46, 25, 300, 3.4)}${petal(63, 17, 40, 3.2)}" fill="${T.accent}" stroke="${T.dark}" stroke-width="0.4"/>`;
  return defs + sector + `<path d="${ribs}" fill="none" stroke="${T.wood}" stroke-opacity="0.55" stroke-width="0.7"/>` + branch + bloom + handle + sprig + `<g transform="scale(-1 1)">${sprig}</g>`;
}
module.exports = { crestTop };
