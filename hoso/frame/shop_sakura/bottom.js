// ===== hoso/frame/shop_sakura/bottom.js — CẠNH DƯỚI: cổng Torii đỏ mini + cánh hoa rơi =====
// Hình học: gốc giữa mép dưới; y ∈ [-4, 12] (cao 16), nửa rộng ≤ 70, đối xứng quanh x=0 (hệ thống phóng ×1.5).
const T = require('./colors').TIERS[0];
const n = (v) => Number(v.toFixed(2));
function petal(cx, cy, a, L) {
  const t = (a * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t), w = L * 0.42;
  const q = (x, y) => `${n(cx + x * c - y * s)} ${n(cy + x * s + y * c)}`;
  return `M${q(0, 0)}Q${q(-w, -L * 0.55)} ${q(-w * 0.55, -L)}L${q(0, -L * 0.82)}L${q(w * 0.55, -L)}Q${q(w, -L * 0.55)} ${q(0, 0)}Z`;
}
const flower = (cx, cy, rot, L) => [0, 1, 2, 3, 4].map((i) => petal(cx, cy, rot + i * 72, L)).join("");
function decorBottom(_tier, W, H) {
  const dk = '#8E2327';
  const torii = `<path d="M-28 -3Q0 1 28 -3L24 1H-24Z" fill="${T.torii}" stroke="${dk}" stroke-width="0.8" stroke-linejoin="round"/><rect x="-20" y="3.5" width="40" height="2.6" fill="${T.torii}" stroke="${dk}" stroke-width="0.7"/><rect x="-17" y="1" width="3.6" height="11" fill="${T.torii}" stroke="${dk}" stroke-width="0.7"/><rect x="13.4" y="1" width="3.6" height="11" fill="${T.torii}" stroke="${dk}" stroke-width="0.7"/><rect x="-19" y="11" width="7.6" height="1.6" fill="${dk}"/><rect x="11.4" y="11" width="7.6" height="1.6" fill="${dk}"/><rect x="-3" y="1" width="6" height="2.5" fill="${T.accent}" stroke="${dk}" stroke-width="0.5"/>`;
  let pet = '';
  [[-34, 9, 20], [-44, 6, 140], [-56, 10, 250], [-66, 7, 60], [34, 9, 200], [45, 5, 320], [56, 10, 110], [66, 7, 280]].forEach(([x, y, a]) => { pet += petal(x, y, a, 4.2); });
  const ground = `<path d="M-70 12.5H-26M26 12.5H70" stroke="${T.main}" stroke-width="1.4" stroke-linecap="round"/>`;
  return ground + `<path d="${pet}" fill="${T.main}" stroke="${T.dark}" stroke-width="0.5" stroke-linejoin="round"/>` + torii;
}
module.exports = { decorBottom };
