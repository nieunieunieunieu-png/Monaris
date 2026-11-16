// ===== hoso/frame/shop_gothic/side.js — CẠNH TRÁI: dây gai hồng đen quấn =====
// Hình học: 1 đơn vị cao 100 (y 0..100), rộng x ∈ [-10, 10]; thân dây x=0 liền mạch tại y=0/50/100.
const T = require('./colors').TIERS[0];
const P = 'shop_gothic-side-';
function sideUnit(_tier, _W, _H) {
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${T.wing}"/><stop offset="0.5" stop-color="${T.dark}"/><stop offset="1" stop-color="${T.wing}"/></linearGradient></defs>`;
  const vine = `<path d="M0 0C4 10 -4 20 0 30C4 40 -4 50 0 60C4 70 -4 80 0 90C4 95 -2 98 0 100" fill="none" stroke="url(#${P}g)" stroke-width="2.6" stroke-linecap="round"/>`;
  let thorns = '';
  for (let y = 4; y <= 96; y += 8) {
    const x = Number((3.2 * Math.sin((y / 30) * Math.PI)).toFixed(2));
    const sx = x >= 0 ? 1 : -1;
    const tx = Number((x + sx * 5).toFixed(2));
    thorns += `<path d="M${x} ${y}L${tx} ${y - 1.6}M${x} ${y}L${tx} ${y + 1.6}" stroke="${T.thorn}" stroke-width="0.9" stroke-linecap="round"/>`;
  }
  let roses = '';
  [18, 50, 82].forEach((y) => {
    const x = Number((3.2 * Math.sin((y / 30) * Math.PI)).toFixed(2));
    roses += `<circle cx="${x}" cy="${y}" r="2.6" fill="${T.rose}" stroke="${T.bloodDark}" stroke-width="0.5"/><circle cx="${x}" cy="${y}" r="1.1" fill="${T.thorn}"/>`;
  });
  return defs + vine + thorns + roses;
}
module.exports = { sideUnit };
