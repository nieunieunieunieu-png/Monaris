// ===== hoso/frame/cd_lienhoa/bottom.js — CẠNH DƯỚI: đoá sen nhỏ giữa + dây hào quang 2 bên, bậc cao thêm búp sen dọc dây =====
// Hình học: gốc giữa mép dưới (hệ thống phóng ×1.5); y ∈ [-4, 12], nửa rộng ≤ 68, đối xứng x=0; bậc i chỉ THÊM so với bậc i−1.
const { TIERS, byRealm } = require('./colors');
const { lotus, pet } = require('./lotus');
const P = 'cd_lienhoa-bottom-';
const f = (v) => Number(v.toFixed(2));
function decorBottom(tier, _W, _H) {
  const t = tier && Number.isInteger(tier.i) ? tier : byRealm(tier && tier.i) || TIERS[0];
  const c = t.colors, n = c.length;
  // dây: gradient ngang đối xứng (ngoài → giữa = màu 0 → màu cuối) khi nhiều màu
  const stops = n === 1 ? `<stop offset="0" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[0]}"/>` : c.map((col, j) => `<stop offset="${f(0.5 * (1 - j / (n - 1)) * 0 + (j / (n - 1)) * 0.5)}" stop-color="${col}"/>`).join('') + [...c].reverse().map((col, j) => `<stop offset="${f(0.5 + (j / (n - 1)) * 0.5)}" stop-color="${col}"/>`).join('');
  let s = `<defs><linearGradient id="${P}g" gradientUnits="userSpaceOnUse" x1="-68" y1="0" x2="68" y2="0">${stops}</linearGradient></defs>`;
  s += `<path d="M-68 11.5Q-34 8.5 -14 11.5H14Q34 8.5 68 11.5" fill="none" stroke="url(#${P}g)" stroke-width="1.8" stroke-linecap="round"/>`;
  s += `<g transform="translate(0 11.5)">${lotus(t, { id: `${P}lt`, len: 15, pod: false })}</g>`;
  // búp sen nhỏ dọc dây: i≥3 ±30, i≥6 ±46, i≥8 ±60
  const bud = (x) => `<path d="${pet(x, 10, 0, 7, 2.6)}${pet(x, 10, -24, 5, 2)}${pet(x, 10, 24, 5, 2)}" fill="#F7A0B8" stroke="#FFF1F5" stroke-width="0.4" stroke-linejoin="round"/>`;
  [[3, 30], [6, 46], [8, 60]].forEach(([i, x]) => { if (t.i >= i) s += bud(-x) + bud(x); });
  if (t.i >= 1) s += `<circle cx="-22" cy="11" r="1.1" fill="${t.main}"/><circle cx="22" cy="11" r="1.1" fill="${t.main}"/>`;
  return s;
}
module.exports = { decorBottom };
