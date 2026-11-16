// ===== hoso/frame/shop_vuongia/accents.js — ĐIỂM NHẤN GÓC: tia lấp lánh kim cương 4 cánh =====
// Hình học: 1 góc quanh (0,0) hướng lên trái, nằm trong x,y ∈ [-28, 0]; lật 4 góc bằng <use>.
const T = require('./colors').TIERS[0];
const star = (cx, cy, r, fill, stroke) => `<path d="M${cx} ${cy - r}Q${cx + r * 0.14} ${cy - r * 0.14} ${cx + r} ${cy}Q${cx + r * 0.14} ${cy + r * 0.14} ${cx} ${cy + r}Q${cx - r * 0.14} ${cy + r * 0.14} ${cx - r} ${cy}Q${cx - r * 0.14} ${cy - r * 0.14} ${cx} ${cy - r}Z" fill="${fill}" stroke="${stroke}" stroke-width="0.5" stroke-linejoin="round"/>`;
function corner() {
  return star(-11, -11, 12, T.light, T.main)
    + star(-11, -11, 6, '#FFFFFF', T.main)
    + star(-24, -5, 4.5, T.main, T.dark) + star(-5, -24, 4.5, T.main, T.dark)
    + star(-23, -22, 3, T.silver, T.dark)
    + `<path d="M-3 -9L-1 -6.5L-3 -4L-5 -6.5Z" fill="${T.ruby}" stroke="${T.light}" stroke-width="0.4"/><path d="M-9 -3L-7 -0.5L-9 2L-11 -0.5Z" fill="${T.ruby}" stroke="${T.light}" stroke-width="0.4" transform="translate(0 -3)"/>`
    + `<circle cx="-18" cy="-2" r="0.8" fill="${T.light}"/><circle cx="-2" cy="-18" r="0.8" fill="${T.light}"/><circle cx="-26" cy="-13" r="0.7" fill="${T.main}"/><circle cx="-13" cy="-26" r="0.7" fill="${T.main}"/>`;
}
function accent(_tier, W, H) {
  const id = 'shop_vuongia-accent-c';
  const u = (tx, ty, sx, sy) => `<use href="#${id}" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return `<defs><g id="${id}">${corner()}</g></defs>` + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
}
module.exports = { accent };
