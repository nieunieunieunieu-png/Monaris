// ===== hoso/frame/shop_necro/side.js — CẠNH TRÁI: linh hồn (orb) lơ lửng =====
// Hình học: 1 đơn vị cao 100 (y 0..100), rộng x ∈ [-8, 8]; sợi dẫn x=0 liền mạch tại y=0/100.
const T = require('./colors').TIERS[0];
const P = 'shop_necro-side-';
function sideUnit(_tier, _W, _H) {
  const defs = `<defs><radialGradient id="${P}o" cx="0.4" cy="0.3" r="0.8"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.5" stop-color="${T.accent}"/><stop offset="1" stop-color="${T.main}" stop-opacity="0.15"/></radialGradient></defs>`;
  const thread = `<path d="M0 0C1.4 10 -1.4 20 0 30C1.4 40 -1.4 50 0 60C1.4 70 -1.4 80 0 90C1.4 95 -0.6 98 0 100" fill="none" stroke="${T.main}" stroke-width="0.5" stroke-opacity="0.5" stroke-dasharray="1.5 2"/>`;
  const orb = (y, r) => `<circle cx="0" cy="${y}" r="${Number((r + 1.6).toFixed(2))}" fill="url(#${P}o)"/><circle cx="0" cy="${y}" r="${r}" fill="${T.accent}" fill-opacity="0.85" stroke="${T.main}" stroke-width="0.4"/><circle cx="${Number((-r * 0.3).toFixed(2))}" cy="${Number((y - r * 0.3).toFixed(2))}" r="${Number((r * 0.3).toFixed(2))}" fill="#FFFFFF"/>`;
  const orbs = orb(16, 2.6) + orb(50, 3.2) + orb(84, 2.6);
  return defs + thread + orbs;
}
module.exports = { sideUnit };
