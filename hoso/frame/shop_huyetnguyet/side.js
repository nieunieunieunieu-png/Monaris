// ===== hoso/frame/shop_huyetnguyet/side.js — CẠNH TRÁI: luồng khói đen viền đỏ =====
// Hình học: 1 đơn vị cao 100 (y 0..100), rộng x ∈ [-14, 14]; hai luồng cắt trục x=0 tại y=0/50/100, tiếp tuyến khớp nên xếp chồng liền mạch.
const T = require('./colors').TIERS[0];
const r2 = (v) => Number(v.toFixed(2));
function sideUnit(_tier, W, H) {
  const a = 'M0 0C12 16 12 34 0 50C-12 66 -12 84 0 100';
  const b = 'M0 0C-12 16 -12 34 0 50C12 66 12 84 0 100';
  const s1 = `<path d="${a}" fill="none" stroke="${T.main}" stroke-opacity="0.55" stroke-width="8.4" stroke-linecap="round"/><path d="${a}" fill="none" stroke="${T.black}" stroke-width="6.2" stroke-linecap="round"/><path d="${a}" fill="none" stroke="${T.blood}" stroke-width="2.4" stroke-opacity="0.85" stroke-linecap="round"/><path d="${a}" fill="none" stroke="${T.light}" stroke-width="0.5" stroke-opacity="0.6" stroke-linecap="round" transform="translate(-1.2 0)"/>`;
  const s2 = `<path d="${b}" fill="none" stroke="${T.black}" stroke-opacity="0.8" stroke-width="3.4" stroke-linecap="round"/><path d="${b}" fill="none" stroke="${T.main}" stroke-width="0.9" stroke-opacity="0.8" stroke-linecap="round"/>`;
  const puff = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${T.black}" stroke="${T.main}" stroke-width="0.8"/><circle cx="${r2(x - r * 0.3)}" cy="${r2(y - r * 0.3)}" r="${Number((r * 0.35).toFixed(2))}" fill="${T.light}" fill-opacity="0.6"/>`;
  const flame = (x, y, s) => `<path d="M${x} ${r2(y + 3 * s)}C${r2(x - 2.4 * s)} ${r2(y + s)} ${r2(x - 1.4 * s)} ${r2(y - s)} ${x} ${r2(y - 3 * s)}C${r2(x + 0.4 * s)} ${r2(y - s)} ${r2(x + 2.4 * s)} ${r2(y + s)} ${x} ${r2(y + 3 * s)}Z" fill="${T.ember}" stroke="${T.main}" stroke-width="0.5"/>`;
  const rune = `<path d="M0 41L5 50L0 59L-5 50Z" fill="${T.black}" stroke="${T.main}" stroke-width="1.2" stroke-linejoin="round"/><circle cx="0" cy="50" r="1.9" fill="${T.main}"/><circle cx="0" cy="50" r="0.7" fill="${T.ember}"/>`;
  return s1 + s2 + puff(9, 25, 3.4) + puff(-9, 75, 3.4) + puff(-9, 25, 2) + puff(9, 75, 2) + flame(12.5, 12, 1.2) + flame(-12.5, 88, 1.2) + rune;
}
module.exports = { sideUnit };
