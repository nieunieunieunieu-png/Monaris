// ===== hoso/frame/shop_sakura/accents.js — ĐIỂM NHẤN GÓC (cánh hoa đào rơi) =====
// Hình học: 1 góc quanh (0,0) hướng lên trái, nằm trong x,y ∈ [-28, 0]; lật 4 góc bằng <use>.
const T = require('./colors').TIERS[0];
const n = (v) => Number(v.toFixed(2));
function petal(cx, cy, a, L) {
  const t = (a * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t), w = L * 0.42;
  const q = (x, y) => `${n(cx + x * c - y * s)} ${n(cy + x * s + y * c)}`;
  return `M${q(0, 0)}Q${q(-w, -L * 0.55)} ${q(-w * 0.55, -L)}L${q(0, -L * 0.82)}L${q(w * 0.55, -L)}Q${q(w, -L * 0.55)} ${q(0, 0)}Z`;
}
function corner() {
  let bloom = '';
  for (let i = 0; i < 5; i++) bloom += petal(-10, -10, 20 + i * 72, 9);
  const loose = petal(-23, -8, 70, 5.5) + petal(-7, -23, 160, 5.5) + petal(-22, -21, 250, 4);
  return `<path d="${bloom}" fill="${T.main}" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/>`
    + `<circle cx="-10" cy="-10" r="2.2" fill="${T.dark}"/><circle cx="-10" cy="-10" r="0.9" fill="${T.accent}"/>`
    + `<path d="${loose}" fill="${T.accent}" stroke="${T.dark}" stroke-width="0.6" stroke-linejoin="round"/>`
    + `<circle cx="-2.5" cy="-17" r="0.9" fill="${T.main}"/><circle cx="-17" cy="-2.5" r="0.9" fill="${T.main}"/><circle cx="-26" cy="-14" r="0.8" fill="${T.dark}" fill-opacity="0.7"/>`;
}
function accent(_tier, W, H) {
  const id = 'shop_sakura-accent-c';
  const u = (tx, ty, sx, sy) => `<use href="#${id}" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return `<defs><g id="${id}">${corner()}</g></defs>` + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
}
module.exports = { accent };
