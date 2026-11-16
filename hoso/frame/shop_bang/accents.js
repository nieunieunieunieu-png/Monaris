// ===== hoso/frame/shop_bang/accents.js — ĐIỂM NHẤN GÓC (bông tuyết + đốm sáng băng) =====
// Hình học: 1 góc quanh (0,0) hướng lên trái, nằm trong x,y ∈ [-28, 0]; lật 4 góc bằng g().
const T = require('./colors').TIERS[0];
function flake(cx, cy, r, sw) {
  let d = '';
  for (let i = 0; i < 6; i++) {
    const t = (Math.PI / 3) * i;
    const c = Math.cos(t), s = Math.sin(t);
    const bx = cx + c * r * 0.6, by = cy + s * r * 0.6;
    const px = -s * r * 0.3, py = c * r * 0.3;
    const f = (v) => Number(v.toFixed(2));
    d += `M${f(cx)} ${f(cy)}L${f(cx + c * r)} ${f(cy + s * r)}M${f(bx - px + c * r * 0.25)} ${f(by - py + s * r * 0.25)}L${f(bx)} ${f(by)}L${f(bx + px + c * r * 0.25)} ${f(by + py + s * r * 0.25)}`;
  }
  return `<path d="${d}" fill="none" stroke="${T.accent}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
}
function corner() {
  return `<circle cx="-11" cy="-11" r="11" fill="${T.light}" fill-opacity="0.18"/>`
    + flake(-11, -11, 9, 1.3)
    + `<circle cx="-11" cy="-11" r="1.6" fill="${T.main}"/>`
    + flake(-24, -5, 3.6, 0.9) + flake(-5, -24, 3.6, 0.9)
    + `<path d="M-20 -22 L-18.8 -19.2 L-16 -18 L-18.8 -16.8 L-20 -14 L-21.2 -16.8 L-24 -18 L-21.2 -19.2 Z" fill="${T.light}" fill-opacity="0.9"/>`
    + `<circle cx="-2.5" cy="-14" r="1" fill="${T.accent}" fill-opacity="0.8"/><circle cx="-14" cy="-2.5" r="1" fill="${T.accent}" fill-opacity="0.8"/><circle cx="-26" cy="-14" r="0.8" fill="${T.main}" fill-opacity="0.9"/>`;
}
function accent(_tier, W, H) {
  const id = 'shop_bang-accent-c';
  const u = (tx, ty, sx, sy) => `<use href="#${id}" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return `<defs><g id="${id}">${corner()}</g></defs>` + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
}
module.exports = { accent };
