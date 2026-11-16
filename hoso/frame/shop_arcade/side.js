// ===== hoso/frame/shop_arcade/side.js — CẠNH TRÁI: thanh equalizer =====
// Hình học: 1 đơn vị cao 100 (y 0..100), x ∈ [-14, 14]; trục x=0 liền mạch tại y=0/100; 10 hàng cao 6 cách 10.
const T = require('./colors').TIERS[0];
function sideUnit(_tier, _W, _H) {
  const half = [12, 7, 14, 5, 10, 14, 6, 12, 8, 13];
  const col = [T.main, T.main, T.light, T.main, T.blue, T.accent, T.main, T.light, T.blue, T.main];
  let bars = ''; let caps = '';
  half.forEach((l, i) => {
    const y = 2 + i * 10;
    bars += `<rect x="${-l}" y="${y}" width="${l * 2}" height="6" fill="${col[i]}"/>`;
    caps += `<rect x="${l - 3}" y="${y}" width="3" height="6" fill="#FFFFFF" fill-opacity="0.8"/><rect x="${-l}" y="${y}" width="3" height="6" fill="#FFFFFF" fill-opacity="0.8"/>`;
  });
  return `<g shape-rendering="crispEdges"><rect x="-1" y="0" width="2" height="100" fill="${T.dark}"/>${bars}${caps}</g>`;
}
module.exports = { sideUnit };
