// ===== hoso/frame/shop_sakura/side.js — CẠNH TRÁI: cành đào nghiêng nở hoa =====
// Hình học: 1 đơn vị cao 100 (y 0..100), rộng x ∈ [-15, 15]; thân đi qua (0,0) và (0,100) để nối liền.
const T = require('./colors').TIERS[0];
const n = (v) => Number(v.toFixed(2));
function petal(cx, cy, a, L) {
  const t = (a * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t), w = L * 0.42;
  const q = (x, y) => `${n(cx + x * c - y * s)} ${n(cy + x * s + y * c)}`;
  return `M${q(0, 0)}Q${q(-w, -L * 0.55)} ${q(-w * 0.55, -L)}L${q(0, -L * 0.82)}L${q(w * 0.55, -L)}Q${q(w, -L * 0.55)} ${q(0, 0)}Z`;
}
const flower = (cx, cy, rot, L) => [0, 1, 2, 3, 4].map((i) => petal(cx, cy, rot + i * 72, L)).join("");
function sideUnit(_tier, W, H) {
  const trunk = `<path d="M0 0C10 25-10 60 0 100" fill="none" stroke="${T.wood}" stroke-width="3.2" stroke-linecap="butt"/><path d="M0 0C10 25-10 60 0 100" fill="none" stroke="${T.accent}" stroke-opacity="0.55" stroke-width="0.9"/>`;
  const twigs = `<path d="M2.8 20.5L11 14M0 50L-9 44M0 50L8 57M-2.8 79.5L-11 86" fill="none" stroke="${T.wood}" stroke-width="1.6" stroke-linecap="round"/>`;
  const big = flower(11, 14, 15, 6.5) + flower(-9.5, 44, 40, 6) + flower(-11, 86, 70, 6.5);
  const small = flower(8.5, 57, 20, 4.5) + petal(4, 33, 300, 3.5) + petal(-4, 68, 100, 3.5);
  return trunk + twigs
    + `<path d="${big}" fill="${T.main}" stroke="${T.dark}" stroke-width="0.6" stroke-linejoin="round"/>`
    + `<path d="${small}" fill="${T.light}" stroke="${T.dark}" stroke-width="0.5" stroke-linejoin="round"/>`
    + `<circle cx="11" cy="14" r="1.2" fill="${T.dark}"/><circle cx="-9.5" cy="44" r="1.1" fill="${T.dark}"/><circle cx="-11" cy="86" r="1.2" fill="${T.dark}"/><circle cx="8.5" cy="57" r="0.9" fill="${T.dark}"/>`;
}
module.exports = { sideUnit };
