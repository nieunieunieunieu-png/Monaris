// ===== hoso/frame/shop_mech/border.js — VIỀN THẺ: giáp tấm xếp chồng + đinh tán =====
// Hình học: nét ≤ 22px vào trong (tấm giáp cao 4..16); góc 44×44; chừa 28px giữa cạnh trên (x = W/2 ± 14).
const T = require('./colors').TIERS[0];
const P = 'shop_mech-border-';
const n = (v) => Number(v.toFixed(1));
function frameBorder(_tier, W, H) {
  const mx = W / 2;
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.45" stop-color="${T.plate}"/><stop offset="1" stop-color="${T.main}"/></linearGradient>`
    + `<g id="${P}s"><path d="M-10 11L-7 16H7L10 11Z" fill="${T.main}" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/><path d="M-16 4L-12 11H12L16 4Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.9" stroke-linejoin="round"/><path d="M-13.4 5H13.4" stroke="${T.light}" stroke-width="0.5" stroke-opacity="0.8"/><circle cx="-12.2" cy="6.8" r="1.1" fill="${T.main}" stroke="${T.dark}" stroke-width="0.5"/><circle cx="12.2" cy="6.8" r="1.1" fill="${T.main}" stroke="${T.dark}" stroke-width="0.5"/><rect x="-5" y="7.6" width="10" height="1.4" rx="0.5" fill="${T.accent}"/></g></defs>`;
  const path = `M${n(mx - 14)} 4H4V${H - 4}H${W - 4}V4H${n(mx + 14)}`;
  const band = `<path d="${path}" fill="none" stroke="${T.dark}" stroke-width="8" stroke-linejoin="miter"/><path d="${path}" fill="none" stroke="url(#${P}g)" stroke-width="5.4" stroke-linejoin="miter"/><path d="${path}" fill="none" stroke="${T.dark}" stroke-width="5.4" stroke-opacity="0.7" stroke-dasharray="0.8 15.2" stroke-linejoin="miter"/><path d="${path}" fill="none" stroke="${T.light}" stroke-width="0.6" stroke-opacity="0.8" transform="translate(-1.2 -1.2)" stroke-linejoin="miter"/>`;
  const rot = { t: 0, b: 180, l: -90, r: 90 };
  const pos = { t: (u) => [u, 4], b: (u) => [u, H - 4], l: (u) => [4, u], r: (u) => [W - 4, u] };
  let rows = '';
  const run = (side, len) => {
    for (let u = 90; u <= len - 90; u += 44) {
      if (side === 't' && Math.abs(u - mx) < 40) continue;
      const [x, y] = pos[side](u);
      rows += `<use href="#${P}s" transform="translate(${x} ${y}) rotate(${rot[side]})"/>`;
    }
  };
  run('t', W); run('b', W); run('l', H); run('r', H);
  const cr = `<g id="${P}k"><path d="M2 2H42L36 10H10V36L2 42Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="1" stroke-linejoin="round"/><path d="M12 12H30L26 18H18V26L12 30Z" fill="${T.main}" stroke="${T.dark}" stroke-width="0.9" stroke-linejoin="round"/><path d="M15 15H28" stroke="${T.light}" stroke-width="0.6" stroke-opacity="0.8"/><path d="M14 6H34" stroke="${T.dark}" stroke-width="2.6"/><path d="M14 6H34" stroke="${T.yellow}" stroke-width="2.6" stroke-dasharray="3 3"/><path d="M6 14V34" stroke="${T.dark}" stroke-width="2.6"/><path d="M6 14V34" stroke="${T.yellow}" stroke-width="2.6" stroke-dasharray="3 3"/><circle cx="38" cy="5.6" r="1.4" fill="${T.main}" stroke="${T.dark}" stroke-width="0.5"/><circle cx="5.6" cy="38" r="1.4" fill="${T.main}" stroke="${T.dark}" stroke-width="0.5"/><circle cx="22" cy="22" r="2.2" fill="${T.warn}" stroke="${T.dark}" stroke-width="0.8"/><circle cx="21.4" cy="21.4" r="0.6" fill="#FFFFFF"/></g>`;
  const u = (tx, ty, sx, sy) => `<use href="#${P}k" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return defs + band + rows + `<defs>${cr}</defs>` + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
}
module.exports = { frameBorder };
