// ===== hoso/frame/shop_sakura/border.js — VIỀN THẺ: viền gỗ sáng + dải lụa hồng + hoa đào =====
// Hình học: nét ≤ 22px vào trong; góc 44×44; chừa 28px giữa cạnh trên (x = W/2 ± 14).
const T = require('./colors').TIERS[0];
const P = 'shop_sakura-border-';
const n = (v) => Number(v.toFixed(2));
function petal(cx, cy, a, L) {
  const t = (a * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t), w = L * 0.42;
  const q = (x, y) => `${n(cx + x * c - y * s)} ${n(cy + x * s + y * c)}`;
  return `M${q(0, 0)}Q${q(-w, -L * 0.55)} ${q(-w * 0.55, -L)}L${q(0, -L * 0.82)}L${q(w * 0.55, -L)}Q${q(w, -L * 0.55)} ${q(0, 0)}Z`;
}
const flower = (cx, cy, rot, L) => [0, 1, 2, 3, 4].map((i) => petal(cx, cy, rot + i * 72, L)).join("");
function frameBorder(_tier, W, H) {
  const mx = W / 2;
  const defs = `<defs><linearGradient id="${P}w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.5" stop-color="${T.accent}"/><stop offset="1" stop-color="#E8B99A"/></linearGradient></defs>`;
  const path = `M${n(mx - 14)} 5H5V${H - 5}H${W - 5}V5H${n(mx + 14)}`;
  const wood = `<path d="${path}" fill="none" stroke="${T.wood}" stroke-width="7.4" stroke-linejoin="round"/><path d="${path}" fill="none" stroke="url(#${P}w)" stroke-width="5.6" stroke-linejoin="round"/><path d="${path}" fill="none" stroke="${T.light}" stroke-opacity="0.7" stroke-width="0.9" transform="translate(-0.8 -0.8)"/>`;
  // dải lụa uốn sóng ở độ sâu 15 + cánh hoa nhỏ
  const pt = { t: (u, d) => [u, d], b: (u, d) => [u, H - d], l: (u, d) => [d, u], r: (u, d) => [W - d, u] };
  let rib = '', pet = '';
  const run = (side, a, b) => {
    const f = (u, d) => pt[side](u, d).map(n).join(' ');
    rib += `M${f(a, 15)}`;
    let k = 0;
    for (let u = a; u + 32 <= b; u += 32, k++) {
      rib += `Q${f(u + 16, 15 + (k % 2 ? -3.5 : 3.5))} ${f(u + 32, 15)}`;
      if (k % 2 === 1) { const p = pt[side](u + 16, 18.5); pet += petal(p[0], p[1], k * 47, 4.2); }
    }
  };
  run('t', 52, mx - 20); run('t', mx + 20, W - 52); run('b', 52, W - 52); run('l', 52, H - 52); run('r', 52, H - 52);
  const ribbon = `<path d="${rib}" fill="none" stroke="${T.dark}" stroke-width="3.6" stroke-linecap="round"/><path d="${rib}" fill="none" stroke="${T.main}" stroke-width="2.4" stroke-linecap="round"/><path d="${pet}" fill="${T.light}" stroke="${T.dark}" stroke-width="0.5" stroke-linejoin="round"/>`;
  // góc 44×44: nẹp gỗ + đoá hoa
  const cr = `<g id="${P}k"><path d="M3 3H41V9H9V41H3Z" fill="url(#${P}w)" stroke="${T.wood}" stroke-width="1" stroke-linejoin="round"/><path d="${flower(20, 20, 10, 15)}" fill="${T.main}" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/><path d="${flower(20, 20, 46, 8)}" fill="${T.light}" fill-opacity="0.85"/><circle cx="20" cy="20" r="2.6" fill="${T.dark}"/><circle cx="20" cy="20" r="1" fill="${T.accent}"/><path d="${petal(36, 30, 200, 5)}${petal(30, 37, 120, 4.5)}" fill="${T.accent}" stroke="${T.dark}" stroke-width="0.5"/></g>`;
  const u = (tx, ty, sx, sy) => `<use href="#${P}k" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return defs + wood + ribbon + `<defs>${cr}</defs>` + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
}
module.exports = { frameBorder };
