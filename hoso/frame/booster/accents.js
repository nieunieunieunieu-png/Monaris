// ===== booster/accents.js — ĐIỂM NHẤN GÓC: tia lấp lánh 4 cánh + chấm ánh sáng =====
// Hình học: 1 góc quanh (0,0) hướng lên trái, nằm trong x,y ∈ [-28, 0]; lật 4 góc bằng <use>.
const T = require('./colors').TIERS[0];
function corner() {
  const star = (x, y, r, f) => `<path d="M${x} ${y - r}L${x + r * 0.26} ${y - r * 0.26}L${x + r} ${y}L${x + r * 0.26} ${y + r * 0.26}L${x} ${y + r}L${x - r * 0.26} ${y + r * 0.26}L${x - r} ${y}L${x - r * 0.26} ${y - r * 0.26}Z" fill="${f}"/>`;
  return star(-14, -14, 8, T.main) + star(-14, -14, 3.6, '#FFFFFF')
    + star(-24, -5, 3.2, T.ice) + star(-5, -24, 3.2, T.ice)
    + `<circle cx="-24" cy="-24" r="1.2" fill="${T.light}" fill-opacity="0.85"/>`;
}
function accent(_tier, W, H) {
  const id = 'booster-accent-c';
  const defs = `<defs><g id="${id}">${corner()}</g></defs>`;
  const u = (tx, ty, sx, sy) => `<use href="#${id}" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return defs + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
}
module.exports = { accent };
