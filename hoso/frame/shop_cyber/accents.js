// ===== hoso/frame/shop_cyber/accents.js — ĐIỂM NHẤN GÓC: dãy ô 0/1 + sóng điện từ =====
// Hình học: 1 góc quanh (0,0) hướng lên trái, nằm trong x,y ∈ [-28, 0]; lật 4 góc bằng <use>.
const T = require('./colors').TIERS[0];
function bits(s, x0, y0, dx, dy) {
  let o = '';
  [...s].forEach((c, i) => {
    const x = Number((x0 + dx * i).toFixed(1)); const y = Number((y0 + dy * i).toFixed(1));
    o += c === '1' ? `<rect x="${x}" y="${y}" width="1.2" height="3.2" fill="${T.main}"/>` : `<rect x="${x}" y="${y}" width="2" height="3.2" fill="none" stroke="${T.main}" stroke-width="0.6"/>`;
  });
  return o;
}
function corner() {
  const wave = (r, o) => `<path d="M${-2 - r} -2A${r} ${r} 0 0 1 -2 ${-2 - r}" fill="none" stroke="${T.main}" stroke-width="1" stroke-opacity="${o}" stroke-linecap="round"/>`;
  return `<path d="M-2 -2H-24M-2 -2V-24" fill="none" stroke="${T.dark}" stroke-width="3" stroke-linecap="round"/><path d="M-2 -2H-24M-2 -2V-24" fill="none" stroke="${T.main}" stroke-width="1.2" stroke-linecap="round"/>`
    + wave(7, 0.95) + wave(11, 0.65) + wave(15, 0.4)
    + `<rect x="-6.5" y="-6.5" width="4.5" height="4.5" fill="${T.pink}" stroke="${T.bg}" stroke-width="0.5"/>`
    + bits('1011001', -26, -27, 3.4, 0) + bits('0110101', -27, -26, 0, 3.4).replace(/width="1.2" height="3.2"/g, 'width="3.2" height="1.2"').replace(/width="2" height="3.2"/g, 'width="3.2" height="2"')
    + `<circle cx="-24" cy="-24" r="1.2" fill="${T.pink}"/>`;
}
function accent(_tier, W, H) {
  const id = 'shop_cyber-accent-c';
  const u = (tx, ty, sx, sy) => `<use href="#${id}" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return `<defs><g id="${id}">${corner()}</g></defs>` + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
}
module.exports = { accent };
