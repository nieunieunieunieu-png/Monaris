// ===== hoso/frame/cd_lienhoa/side.js — CẠNH TRÁI: dây vàng + chuỗi hạt/búp sen, bậc cao thêm hạt, lá, búp, vòng sáng =====
// Hình học: 1 đơn vị cao 100 (y 0..100), x ∈ [-12, 12]; dây x=0 liền mạch tại y=0/100; bậc i chỉ THÊM so với bậc i−1.
const { TIERS, byRealm } = require('./colors');
const f = (v) => Number(v.toFixed(2));
const leaf = (x, y, s, fill) => `<path d="M${x} ${y}Q${f(x + s * 5)} ${f(y - 3)} ${f(x + s * 9)} ${y}Q${f(x + s * 5)} ${f(y + 3)} ${x} ${y}Z" fill="${fill}" stroke="#FFF1F5" stroke-width="0.5"/>`;
function sideUnit(tier, _W, _H) {
  const t = tier && Number.isInteger(tier.i) ? tier : byRealm(tier && tier.i) || TIERS[0];
  const c = t.colors;
  let s = `<path d="M0 0V100" stroke="${c[0]}" stroke-width="1.6" stroke-linecap="butt"/>`;
  const bead = (y, r, col) => `<path d="M0 ${f(y - r * 1.4)}L${r} ${y}L0 ${f(y + r * 1.4)}L${-r} ${y}Z" fill="${col}" stroke="${t.dark}" stroke-width="0.6" stroke-linejoin="round"/>`;
  s += bead(50, 4, t.main);                                                    // luôn có: 1 viên thoi vàng giữa
  if (t.i >= 1) s += `<circle cx="0" cy="50" r="1.3" fill="${t.light}"/>`;
  if (t.i >= 2) s += bead(25, 2.6, c[1] || t.main) + bead(75, 2.6, c[1] || t.main);
  if (t.i >= 4) s += leaf(3, 50, 1, '#F7A9BC') + leaf(-3, 50, -1, '#F7A9BC');   // lá/cánh nhỏ hai bên viên giữa
  if (t.i >= 5) s += `<circle cx="0" cy="12" r="1.5" fill="${c[Math.min(4, c.length - 1)]}"/><circle cx="0" cy="88" r="1.5" fill="${c[Math.min(4, c.length - 1)]}"/>`;
  if (t.i >= 6) s += leaf(2.5, 25, 1, '#F4929F') + leaf(-2.5, 25, -1, '#F4929F') + leaf(2.5, 75, 1, '#F4929F') + leaf(-2.5, 75, -1, '#F4929F');
  if (t.i >= 8) s += `<circle cx="0" cy="50" r="7.5" fill="none" stroke="${t.light}" stroke-width="0.9" stroke-opacity="0.9"/>`;
  if (t.i >= 9) s += `<circle cx="0" cy="50" r="10.5" fill="none" stroke="${c[c.length - 1]}" stroke-width="0.8" stroke-opacity="0.8"/>`;
  return s;
}
module.exports = { sideUnit };
