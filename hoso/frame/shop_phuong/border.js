// ===== hoso/frame/shop_phuong/border.js — VIỀN THẺ: lông vũ phượng mạ vàng ghép hàng =====
// Hình học: nét ≤ 22px vào trong; góc 44×44 (3 lông xoè + ngọc); chừa 28px giữa cạnh trên (x = W/2 ± 14).
const T = require('./colors').TIERS[0];
const P = 'shop_phuong-border-';
const n = (v) => Number(v.toFixed(1));
const fp = (L, w) => `M0 0Q${n(L * 0.4)} ${-w} ${L} 0Q${n(L * 0.4)} ${w} 0 0Z`;
function frameBorder(_tier, W, H) {
  const mx = W / 2;
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.5" stop-color="${T.accent}"/><stop offset="1" stop-color="${T.main}"/></linearGradient>`
    + `<g id="${P}f"><path d="M0 0Q-5 8 0 19Q5 8 0 0Z" fill="${T.main}" stroke="${T.dark}" stroke-width="0.7" stroke-linejoin="round"/><path d="M0 1Q-2.5 7 0 14Q2.5 7 0 1Z" fill="${T.accent}"/><path d="M0 1V17" stroke="${T.dark}" stroke-width="0.5"/></g></defs>`;
  const path = `M${n(mx - 14)} 4H4V${H - 4}H${W - 4}V4H${n(mx + 14)}`;
  const band = `<path d="${path}" fill="none" stroke="${T.dark}" stroke-width="6.4" stroke-linejoin="round"/><path d="${path}" fill="none" stroke="url(#${P}g)" stroke-width="4.2" stroke-linejoin="round"/><path d="${path}" fill="none" stroke="${T.light}" stroke-opacity="0.8" stroke-width="0.8" transform="translate(-0.7 -0.7)"/>`;
  // hàng lông vũ nghiêng 22°, mỗi cạnh một hướng cơ sở
  const base = { t: [0, 0], b: [180, 0], l: [-90, 0], r: [90, 0] };
  const pos = { t: (u) => [u, 7], b: (u) => [u, H - 7], l: (u) => [7, u], r: (u) => [W - 7, u] };
  let rows = '';
  const run = (side, len) => {
    for (let u = 60; u <= len - 60; u += 24) {
      if (side === 't' && Math.abs(u - mx) < 28) continue;
      const [x, y] = pos[side](u);
      rows += `<use href="#${P}f" transform="translate(${x} ${y}) rotate(${base[side][0] + 22})"/>`;
    }
  };
  run('t', W); run('b', W); run('l', H); run('r', H);
  // góc 44×44: 3 lông xoè + ngọc đỏ
  let fan = '';
  [[18, 40, 5.5], [45, 44, 6.5], [72, 40, 5.5]].forEach(([a, L, w]) => { fan += `<g transform="translate(6 6) rotate(${a})"><path d="${fp(L - 4, w)}" fill="${T.main}" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/><path d="${fp(L - 14, w * 0.5)}" fill="${T.accent}"/></g>`; });
  const cr = `<g id="${P}k">${fan}<circle cx="9" cy="9" r="5.2" fill="${T.dark}" stroke="${T.accent}" stroke-width="1.4"/><circle cx="9" cy="9" r="2.2" fill="${T.light}"/></g>`;
  const u = (tx, ty, sx, sy) => `<use href="#${P}k" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return defs + band + rows + `<defs>${cr}</defs>` + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
}
module.exports = { frameBorder };
