// ===== hoso/frame/shop_arcade/accents.js — ĐIỂM NHẤN GÓC: sao 4 cánh 8-bit =====
// Hình học: 1 góc quanh (0,0) hướng lên trái, nằm trong x,y ∈ [-28, 0]; lật 4 góc bằng <use>.
const T = require('./colors').TIERS[0];
function corner() {
  const star = (cx, cy, c, col, arm) => {
    let d = `M${cx - c / 2} ${cy - c / 2}h${c}v${c}h-${c}z`;
    for (let i = 1; i <= arm; i++) {
      const o = c / 2 + (i - 1) * c;
      d += `M${cx + o} ${cy - c / 2}h${c}v${c}h-${c}zM${cx - o - c} ${cy - c / 2}h${c}v${c}h-${c}zM${cx - c / 2} ${cy + o}h${c}v${c}h-${c}zM${cx - c / 2} ${cy - o - c}h${c}v${c}h-${c}z`;
    }
    return `<path fill="${col}" d="${d}"/>`;
  };
  return star(-14, -14, 3, T.accent, 2) + star(-14, -14, 1.5, '#FFFFFF', 0)
    + star(-5, -23, 1.5, T.light, 1) + star(-24, -5, 1.5, T.blue, 1)
    + `<path fill="${T.main}" d="M-24 -22h2v2h-2zM-6 -8h2v2h-2zM-20 -26h1.5v1.5h-1.5z"/>`;
}
function accent(_tier, W, H) {
  const id = 'shop_arcade-accent-c';
  const defs = `<defs><g id="${id}" shape-rendering="crispEdges">${corner()}</g></defs>`;
  const u = (tx, ty, sx, sy) => `<use href="#${id}" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return defs + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
}
module.exports = { accent };
