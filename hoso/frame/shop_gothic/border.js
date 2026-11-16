// ===== hoso/frame/shop_gothic/border.js — VIỀN THẺ: khung gạch Gothic nứt nẻ =====
// Hình học: nét ≤ 22px vào trong; góc 44×44; chừa 28px giữa cạnh trên (x = W/2 ± 14).
const T = require('./colors').TIERS[0];
const P = 'shop_gothic-border-';
const n = (v) => Number(v.toFixed(1));
function frameBorder(_tier, W, H) {
  const mx = W / 2;
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.main}"/><stop offset="0.5" stop-color="${T.dark}"/><stop offset="1" stop-color="${T.wing}"/></linearGradient>`
    + `<g id="${P}b"><rect x="-11" y="-4.5" width="22" height="9" fill="url(#${P}g)" stroke="${T.wing}" stroke-width="0.7"/><path d="M-7 -4.5V4.5M3 -4.5V0M7 0V4.5" stroke="${T.wing}" stroke-width="0.5" stroke-opacity="0.7"/></g>`
    + `<g id="${P}crack"><path d="M-6 -3L-2 1L-4 4L0 8L-3 11" fill="none" stroke="${T.blood}" stroke-width="0.6" stroke-opacity="0.8"/></g></defs>`;
  const path = `M${n(mx - 14)} 4H4V${H - 4}H${W - 4}V4H${n(mx + 14)}`;
  const band = `<path d="${path}" fill="none" stroke="${T.wing}" stroke-width="20" stroke-linejoin="round"/>`;
  const rot = { t: 0, b: 180, l: -90, r: 90 };
  const pos = { t: (u) => [u, 4], b: (u) => [u, H - 4], l: (u) => [4, u], r: (u) => [W - 4, u] };
  let bricks = '';
  const run = (side, len) => {
    let row = 0;
    for (let u = 11; u <= len - 11; u += 22) {
      if (side === 't' && Math.abs(u - mx) < 40) { row += 1; continue; }
      const [x, y] = pos[side](u);
      bricks += `<use href="#${P}b" transform="translate(${n(x)} ${n(y)}) rotate(${rot[side]})"/>`;
      row += 1;
    }
  };
  run('t', W); run('b', W); run('l', H); run('r', H);
  let cracks = '';
  [0.12, 0.4, 0.68, 0.9].forEach((f, i) => {
    const u = 30 + f * (W - 60);
    cracks += `<use href="#${P}crack" transform="translate(${n(u)} 4) rotate(${(i % 2 ? 1 : -1) * 20})"/>`;
  });
  [0.2, 0.55, 0.85].forEach((f, i) => {
    const u = 30 + f * (H - 60);
    cracks += `<use href="#${P}crack" transform="translate(4 ${n(u)}) rotate(${90 + (i % 2 ? 1 : -1) * 15})"/>`;
    cracks += `<use href="#${P}crack" transform="translate(${W - 4} ${n(u)}) rotate(${-90 + (i % 2 ? 1 : -1) * 15})"/>`;
  });
  const cr = `<g id="${P}k"><path d="M2 2H42V10H10V42H2Z" fill="${T.wing}" stroke="${T.blood}" stroke-width="1" stroke-linejoin="round"/>`
    + `<path d="M22 4L30 16H14Z" fill="${T.dark}" stroke="${T.blood}" stroke-width="0.8" stroke-linejoin="round"/>`
    + `<circle cx="22" cy="22" r="4" fill="${T.blood}" stroke="${T.bloodDark}" stroke-width="0.6"/>`
    + `<path d="M6 36L10 40M36 6L40 10" stroke="${T.blood}" stroke-width="0.8" stroke-opacity="0.8"/></g>`;
  const u = (tx, ty, sx, sy) => `<use href="#${P}k" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return defs + band + bricks + cracks + `<defs>${cr}</defs>` + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
}
module.exports = { frameBorder };
