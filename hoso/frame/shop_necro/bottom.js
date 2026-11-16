// ===== hoso/frame/shop_necro/bottom.js — CẠNH DƯỚI: đống xương + lửa xanh u linh =====
// Hình học: gốc giữa mép dưới; y ∈ [-6, 10] (xương đối xứng x=0); nửa rộng ≤ 40 (hệ thống phóng ×1.5).
const T = require('./colors').TIERS[0];
const P = 'shop_necro-bottom-';
function decorBottom(_tier, _W, _H) {
  const defs = `<defs><linearGradient id="${P}f" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${T.flameDark}"/><stop offset="0.6" stop-color="${T.flame}"/><stop offset="1" stop-color="#FFFFFF"/></linearGradient></defs>`;
  const bone = (x, rot) => `<g transform="translate(${x} 7) rotate(${rot})"><rect x="-7" y="-1.4" width="14" height="2.8" rx="1.4" fill="${T.bone}" stroke="${T.boneDark}" stroke-width="0.5"/><circle cx="-7" cy="0" r="2.3" fill="${T.bone}" stroke="${T.boneDark}" stroke-width="0.5"/><circle cx="7" cy="0" r="2.3" fill="${T.bone}" stroke="${T.boneDark}" stroke-width="0.5"/></g>`;
  const bones = bone(-32, 25) + bone(-12, -20) + bone(10, 22) + bone(32, -22) + bone(-1, 5);
  const flame = (x, sc) => `<g transform="translate(${x} 1) scale(${sc})"><path d="M0 1C-2.6 -1.4 -2 -4.4 0 -6.4C2 -4.4 2.6 -1.4 0 1Z" fill="url(#${P}f)"/><path d="M0 -0.4C-1 -1.6 -0.8 -3 0 -3.8C0.8 -3 1 -1.6 0 -0.4Z" fill="#FFFFFF" fill-opacity="0.6"/></g>`;
  const flames = flame(-20, 0.8) + flame(0, 1) + flame(20, 0.8);
  return defs + bones + flames;
}
module.exports = { decorBottom };
