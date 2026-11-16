// ===== hoso/frame/shop_phuong/accents.js — ĐIỂM NHẤN GÓC (cánh hoa lửa + hạt than hồng) =====
// Hình học: 1 góc quanh (0,0) hướng lên trái, nằm trong x,y ∈ [-28, 0]; lật 4 góc bằng <use>.
const T = require('./colors').TIERS[0];
const n = (v) => Number(v.toFixed(2));
// cánh lửa: gốc (cx,cy), a độ (0 = hướng lên), dài L
function drop(cx, cy, a, L, w) {
  const t = (a * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t);
  const q = (x, y) => `${n(cx + x * c - y * s)} ${n(cy + x * s + y * c)}`;
  return `M${q(0, 0)}Q${q(w, -L * 0.45)} ${q(0, -L)}Q${q(-w, -L * 0.45)} ${q(0, 0)}Z`;
}
function corner() {
  let big = '', mid = '';
  [-50, -15, 20, -85, 55].forEach((a, i) => { big += drop(-6, -6, a - 45, i < 3 ? 20 : 14, i < 3 ? 6 : 4.5); mid += drop(-6, -6, a - 45, i < 3 ? 13 : 9, i < 3 ? 3.2 : 2.4); });
  return `<path d="${big}" fill="${T.main}" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/>`
    + `<path d="${mid}" fill="${T.accent}"/>`
    + `<circle cx="-6" cy="-6" r="2.6" fill="${T.light}" stroke="${T.dark}" stroke-width="0.6"/>`
    + `<circle cx="-24" cy="-4" r="1.4" fill="${T.ember}"/><circle cx="-4" cy="-24" r="1.4" fill="${T.ember}"/><circle cx="-26" cy="-17" r="0.9" fill="${T.accent}"/><circle cx="-17" cy="-26" r="0.9" fill="${T.accent}"/><circle cx="-12" cy="-2" r="0.8" fill="${T.light}"/><circle cx="-2" cy="-12" r="0.8" fill="${T.light}"/>`;
}
function accent(_tier, W, H) {
  const id = 'shop_phuong-accent-c';
  const u = (tx, ty, sx, sy) => `<use href="#${id}" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return `<defs><g id="${id}">${corner()}</g></defs>` + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
}
module.exports = { accent };
