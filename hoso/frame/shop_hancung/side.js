// ===== hoso/frame/shop_hancung/side.js — CẠNH TRÁI: dải lụa đỏ uốn lượn quấn chỉ vàng =====
// Hình học: 1 đơn vị cao 100 (y 0..100), rộng x ∈ [-14, 14]; cả hai dải cắt trục x=0 tại y=0/50/100, tiếp tuyến khớp nên xếp chồng liền mạch.
const T = require('./colors').TIERS[0];
const P = 'shop_hancung-side-';
function sideUnit(_tier, W, H) {
  const a = 'M0 0C12 16 12 34 0 50C-12 66 -12 84 0 100';
  const b = 'M0 0C-12 16 -12 34 0 50C12 66 12 84 0 100';
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${T.dark}"/><stop offset="0.5" stop-color="${T.silk}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient></defs>`;
  const silk = `<path d="${a}" fill="none" stroke="${T.dark}" stroke-width="6.4" stroke-linecap="round"/><path d="${a}" fill="none" stroke="${T.silk}" stroke-width="4.6" stroke-linecap="round"/><path d="${a}" fill="none" stroke="${T.light}" stroke-width="0.8" stroke-opacity="0.55" stroke-linecap="round" transform="translate(-1 0)"/><path d="${a}" fill="none" stroke="${T.dark}" stroke-width="0.7" stroke-opacity="0.5" stroke-linecap="round" transform="translate(1.2 0)"/>`;
  const thread = `<path d="${b}" fill="none" stroke="${T.dark}" stroke-width="3" stroke-linecap="round"/><path d="${b}" fill="none" stroke="${T.main}" stroke-width="1.7" stroke-linecap="round"/><path d="${b}" fill="none" stroke="${T.light}" stroke-width="0.5" stroke-opacity="0.8" stroke-linecap="round" transform="translate(-0.6 0)"/>`;
  const bead = (x, y, f) => `<circle cx="${x}" cy="${y}" r="2.2" fill="${f}" stroke="${T.dark}" stroke-width="0.7"/><circle cx="${x - 0.7}" cy="${y - 0.7}" r="0.6" fill="#FFFFFF"/>`;
  const knot = `<path d="M0 42L5.6 50L0 58L-5.6 50Z" fill="${T.main}" stroke="${T.dark}" stroke-width="0.9" stroke-linejoin="round"/><path d="M0 45.4L3 50L0 54.6L-3 50Z" fill="${T.jade}" stroke="${T.light}" stroke-width="0.6" stroke-linejoin="round"/><path d="M-1.4 47.8L-0.3 47.2L-1.8 50Z" fill="#FFFFFF"/>`;
  return defs + silk + thread + bead(9, 25, T.main) + bead(-9, 25, T.jade) + bead(-9, 75, T.main) + bead(9, 75, T.jade) + knot;
}
module.exports = { sideUnit };
