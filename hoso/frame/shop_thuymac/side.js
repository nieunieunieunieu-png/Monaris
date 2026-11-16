// ===== hoso/frame/shop_thuymac/side.js — CẠNH TRÁI: trúc mực tàu + lá =====
// Hình học: 1 đơn vị cao 100 (y 0..100), x ∈ [-26, 26]; thân trúc x=0 thẳng liền mạch tại y=0/100; 2 mắt trúc y=33/66; lá r ≤ 24 từ mắt.
const T = require('./colors').TIERS[0];
const n = (v) => Number(v.toFixed(2));
function sideUnit(_tier, _W, _H) {
  const stalk = `<rect x="-2.8" y="0" width="5.6" height="100" fill="${T.ink}" fill-opacity="0.88"/><rect x="-1.6" y="0" width="0.8" height="100" fill="${T.light}" fill-opacity="0.3"/>`;
  const node = (y) => `<rect x="-3.8" y="${y - 0.9}" width="7.6" height="1.8" rx="0.6" fill="${T.ink}"/><rect x="-3.8" y="${y + 0.9}" width="7.6" height="0.5" fill="${T.light}" fill-opacity="0.35"/>`;
  const leaf = (x, y, rot, len, op, col) => {
    const w = len * 0.17;
    return `<path transform="translate(${x} ${y}) rotate(${rot})" d="M0 0Q${n(len * 0.45)} ${n(-w)} ${len} ${n(-w * 0.2)}Q${n(len * 0.5)} ${n(w * 0.8)} 0 0Z" fill="${col}" fill-opacity="${op}"/>`;
  };
  const leaves = leaf(2.5, 33, -28, 22, 0.88, T.ink) + leaf(2.5, 33, 10, 17, 0.7, T.ink) + leaf(-2.5, 33, 200, 20, 0.6, T.wash)
    + leaf(-2.5, 66, 208, 22, 0.88, T.ink) + leaf(-2.5, 66, 170, 16, 0.7, T.ink) + leaf(2.5, 66, -12, 18, 0.55, T.wash);
  return stalk + node(33) + node(66) + leaves;
}
module.exports = { sideUnit };
