// ===== hoso/frame/shop_thuymac/accents.js — ĐIỂM NHẤN GÓC: giọt mực loang + con dấu đỏ =====
// Hình học: 1 góc quanh (0,0) hướng lên trái, nằm trong x,y ∈ [-28, 0]; lật 4 góc bằng <use>.
const T = require('./colors').TIERS[0];
const n = (v) => Number(v.toFixed(2));
function blob(cx, cy, r, seed) {
  let d = '';
  for (let a = 0; a < 360; a += 30) {
    const rr = r * (1 + 0.28 * Math.sin(a * 0.05 + seed) + 0.16 * Math.sin(a * 0.17 + seed * 2));
    d += `${a ? 'L' : 'M'}${n(cx + rr * Math.cos((a * Math.PI) / 180))} ${n(cy + rr * Math.sin((a * Math.PI) / 180))}`;
  }
  return d + 'Z';
}
function corner() {
  return `<path d="${blob(-10, -10, 5.2, 1)}" fill="${T.ink}" fill-opacity="0.85"/><path d="${blob(-11, -9, 7.6, 3)}" fill="${T.wash}" fill-opacity="0.25"/>`
    + `<path d="${blob(-19, -6, 2.2, 2)}" fill="${T.ink}" fill-opacity="0.75"/><path d="${blob(-6, -19, 1.8, 4)}" fill="${T.ink}" fill-opacity="0.75"/><path d="${blob(-16, -17, 1.1, 5)}" fill="${T.ink}" fill-opacity="0.6"/>`
    + `<g transform="translate(-23 -23) rotate(-6)"><rect x="-4" y="-4" width="8" height="8" rx="1" fill="${T.accent}"/><path d="M-2 -2.2H2M0 -2.2V2.4M-2 1.6H2" stroke="${T.light}" stroke-width="0.8" stroke-opacity="0.85" fill="none"/></g>`;
}
function accent(_tier, W, H) {
  const id = 'shop_thuymac-accent-c';
  const defs = `<defs><g id="${id}">${corner()}</g></defs>`;
  const u = (tx, ty, sx, sy) => `<use href="#${id}" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return defs + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
}
module.exports = { accent };
