// ===== hoso/frame/shop_thuymac/border.js — VIỀN THẺ: nét cọ đậm nhạt uốn lượn (polygon dày biến thiên) =====
// Hình học: nét tâm sâu 8±2.7, dày 1.5..6.5 (sâu ≤ 15) + lớp loang xám dày hơn; góc 44×44 (sâu ≤22); chừa x = W/2 ± 14 ở cạnh trên.
const T = require('./colors').TIERS[0];
const n = (v) => Number(v.toFixed(1));
function stroke(u0, u1, seed, map, scale) {
  const o = []; const i = [];
  for (let u = u0; ; u += 16) {
    if (u > u1) u = u1;
    const tp = Math.max(0.25, Math.min(1, (u - u0) / 36, (u1 - u) / 36));
    const c = 8 + 1.7 * Math.sin(u / 37 + seed) + 1 * Math.sin(u / 13 + seed * 2);
    const t = (2 + 4.5 * (0.5 + 0.5 * Math.sin(u / 53 + seed * 2)) * (0.65 + 0.35 * Math.sin(u / 17 + seed))) * tp * scale;
    o.push(map(u, c - t / 2)); i.unshift(map(u, c + t / 2));
    if (u >= u1) break;
  }
  return `M${o.join('L')}L${i.join('L')}Z`;
}
function frameBorder(_tier, W, H) {
  const mx = W / 2;
  const maps = {
    t: (u, v) => `${n(u)} ${n(v)}`, b: (u, v) => `${n(u)} ${n(H - v)}`,
    l: (u, v) => `${n(v)} ${n(u)}`, r: (u, v) => `${n(W - v)} ${n(u)}`,
  };
  const segs = [['t', 46, mx - 14, 1], ['t', mx + 14, W - 46, 2], ['b', 46, W - 46, 3], ['l', 46, H - 46, 4], ['r', 46, H - 46, 5]];
  let wash = ''; let ink = '';
  segs.forEach(([s, a, b, sd]) => { wash += stroke(a, b, sd + 0.7, maps[s], 1.5); ink += stroke(a, b, sd, maps[s], 1); });
  const defs = `<defs><g id="shop_thuymac-border-k"><path d="M4 40C2 24 6 10 14 6C24 2 34 3 42 5C34 8 26 8 21 12C15 16 12 28 10 40Z" fill="${T.ink}" fill-opacity="0.9"/><path d="M8 38C8 26 11 16 18 11C26 7 34 7 40 8" fill="none" stroke="${T.light}" stroke-opacity="0.35" stroke-width="0.7" stroke-linecap="round"/><rect x="14" y="14" width="7" height="7" rx="0.8" fill="${T.accent}"/><path d="M15.6 16H19.4M17.5 16V20M15.6 19.2H19.4" stroke="${T.light}" stroke-width="0.7" stroke-opacity="0.85" fill="none"/><circle cx="26" cy="19" r="1.6" fill="${T.ink}" fill-opacity="0.7"/><circle cx="31" cy="15" r="0.9" fill="${T.ink}" fill-opacity="0.6"/></g></defs>`;
  const u = (tx, ty, sx, sy) => `<use href="#shop_thuymac-border-k" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return defs + `<path d="${wash}" fill="${T.wash}" fill-opacity="0.3"/><path d="${ink}" fill="${T.ink}" fill-opacity="0.9"/>` + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
}
module.exports = { frameBorder };
