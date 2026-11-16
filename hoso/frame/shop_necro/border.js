// ===== hoso/frame/shop_necro/border.js — VIỀN THẺ: đốt xương sống đan vào nhau =====
// Hình học: nét ≤ 22px vào trong; góc 44×44; chừa 28px giữa cạnh trên (x = W/2 ± 14).
const T = require('./colors').TIERS[0];
const P = 'shop_necro-border-';
const n = (v) => Number(v.toFixed(1));
function frameBorder(_tier, W, H) {
  const mx = W / 2;
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.bone}"/><stop offset="1" stop-color="${T.boneDark}"/></linearGradient>`
    + `<g id="${P}v"><rect x="-11" y="-3.6" width="22" height="7.2" rx="3.6" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.6"/><circle cx="-9" cy="0" r="3.2" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.6"/><circle cx="9" cy="0" r="3.2" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.6"/><circle cx="-9" cy="0" r="1.1" fill="${T.dark}"/><circle cx="9" cy="0" r="1.1" fill="${T.dark}"/></g></defs>`;
  const path = `M${n(mx - 14)} 4H4V${H - 4}H${W - 4}V4H${n(mx + 14)}`;
  const band = `<path d="${path}" fill="none" stroke="${T.dark}" stroke-width="12" stroke-linejoin="round"/><path d="${path}" fill="none" stroke="${T.boneDark}" stroke-width="9" stroke-linejoin="round" stroke-opacity="0.5"/>`;
  const rot = { t: 0, b: 180, l: -90, r: 90 };
  const pos = { t: (u) => [u, 4], b: (u) => [u, H - 4], l: (u) => [4, u], r: (u) => [W - 4, u] };
  let verts = '';
  const run = (side, len) => {
    for (let u = 11; u <= len - 11; u += 18) {
      if (side === 't' && Math.abs(u - mx) < 40) continue;
      const [x, y] = pos[side](u);
      verts += `<use href="#${P}v" transform="translate(${n(x)} ${n(y)}) rotate(${rot[side]})"/>`;
    }
  };
  run('t', W); run('b', W); run('l', H); run('r', H);
  const cr = `<g id="${P}k"><path d="M2 2H42V10H10V42H2Z" fill="${T.dark}" stroke="${T.boneDark}" stroke-width="1" stroke-linejoin="round"/><circle cx="19" cy="19" r="7" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="1"/><path d="M14 19H24M19 14V24M15.5 15.5L22.5 22.5M22.5 15.5L15.5 22.5" stroke="${T.dark}" stroke-width="0.9"/><circle cx="19" cy="19" r="2" fill="${T.accent}"/></g>`;
  const u = (tx, ty, sx, sy) => `<use href="#${P}k" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return defs + band + verts + `<defs>${cr}</defs>` + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
}
module.exports = { frameBorder };
