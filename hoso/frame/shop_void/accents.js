// ===== hoso/frame/shop_void/accents.js — ĐIỂM NHẤN GÓC: sao băng + bụi sao =====
// Hình học: 1 góc quanh (0,0) hướng lên trái, nằm trong x,y ∈ [-28, 0]; lật 4 góc bằng <use>.
const T = require('./colors').TIERS[0];
function corner() {
  const st = (x, y, s) => `<path d="M${x} ${y - s}L${Number((x + s * 0.28).toFixed(2))} ${Number((y - s * 0.28).toFixed(2))}L${x + s} ${y}L${Number((x + s * 0.28).toFixed(2))} ${Number((y + s * 0.28).toFixed(2))}L${x} ${y + s}L${Number((x - s * 0.28).toFixed(2))} ${Number((y + s * 0.28).toFixed(2))}L${x - s} ${y}L${Number((x - s * 0.28).toFixed(2))} ${Number((y - s * 0.28).toFixed(2))}Z" fill="${T.star}"/>`;
  return `<path d="M-3 -3L-27 -11L-26 -8.4Z" fill="${T.light}" fill-opacity="0.55"/><path d="M-3 -3L-17 -7.6L-16.6 -6.2Z" fill="${T.star}"/><path d="M-3 -3L-11 -27L-8.4 -26Z" fill="${T.cyan}" fill-opacity="0.55"/><path d="M-3 -3L-7.6 -17L-6.2 -16.6Z" fill="${T.star}"/>`
    + `<circle cx="-3" cy="-3" r="2.4" fill="${T.star}" stroke="${T.light}" stroke-width="0.8"/><circle cx="-3" cy="-3" r="5" fill="${T.light}" fill-opacity="0.2"/>`
    + st(-20, -20, 3.4) + st(-9, -9, 2)
    + `<circle cx="-24" cy="-5" r="0.8" fill="${T.cyan}"/><circle cx="-5" cy="-24" r="0.8" fill="${T.cyan}"/><circle cx="-14" cy="-3" r="0.6" fill="${T.star}"/><circle cx="-3" cy="-14" r="0.6" fill="${T.star}"/><circle cx="-26" cy="-17" r="0.6" fill="${T.light}"/><circle cx="-17" cy="-26" r="0.6" fill="${T.light}"/>`;
}
function accent(_tier, W, H) {
  const id = 'shop_void-accent-c';
  const u = (tx, ty, sx, sy) => `<use href="#${id}" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return `<defs><g id="${id}">${corner()}</g></defs>` + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
}
module.exports = { accent };
