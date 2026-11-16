// ===== hoso/frame/shop_vuongia/border.js — VIỀN THẺ: gờ Baroque dát vàng =====
// Hình học: nét ≤ 22px vào trong; góc 44×44; chừa 28px giữa cạnh trên (x = W/2 ± 14).
const T = require('./colors').TIERS[0];
const P = 'shop_vuongia-border-';
const n = (v) => Number(v.toFixed(1));
function frameBorder(_tier, W, H) {
  const mx = W / 2;
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.5" stop-color="${T.main}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient>`
    + `<g id="${P}s"><path d="M0 4C-14 4 -16 18 -7 18C-2 18 -2 11 -6 11M0 4C14 4 16 18 7 18C2 18 2 11 6 11" fill="none" stroke="${T.dark}" stroke-width="3.2" stroke-linecap="round"/><path d="M0 4C-14 4 -16 18 -7 18C-2 18 -2 11 -6 11M0 4C14 4 16 18 7 18C2 18 2 11 6 11" fill="none" stroke="url(#${P}g)" stroke-width="1.8" stroke-linecap="round"/><path d="M0 8L2.6 11.5L0 15L-2.6 11.5Z" fill="${T.ruby}" stroke="${T.light}" stroke-width="0.5"/></g></defs>`;
  const path = `M${n(mx - 14)} 4H4V${H - 4}H${W - 4}V4H${n(mx + 14)}`;
  const band = `<path d="${path}" fill="none" stroke="${T.velvet}" stroke-width="7" stroke-linejoin="round"/><path d="${path}" fill="none" stroke="url(#${P}g)" stroke-width="4.4" stroke-linejoin="round"/><path d="${path}" fill="none" stroke="${T.velvet}" stroke-width="0.9" stroke-opacity="0.6"/><path d="${path}" fill="none" stroke="${T.light}" stroke-width="0.7" stroke-opacity="0.9" transform="translate(-0.9 -0.9)"/>`;
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
  const cr = `<g id="${P}k"><path d="M2 2H42V10H10V42H2Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="1" stroke-linejoin="round"/><path d="M12 12Q34 12 34 34Q22 34 12 34" fill="none" stroke="${T.dark}" stroke-width="2.6" stroke-linecap="round"/><path d="M12 12Q34 12 34 34" fill="none" stroke="${T.light}" stroke-width="1.2" stroke-linecap="round"/><circle cx="19" cy="19" r="6.4" fill="${T.main}" stroke="${T.dark}" stroke-width="1"/><circle cx="19" cy="19" r="3.8" fill="${T.ruby}" stroke="${T.light}" stroke-width="0.8"/><circle cx="17.8" cy="17.8" r="1" fill="#FFFFFF"/><path d="M36 6L37.4 9L40.4 10.4L37.4 11.8L36 14.8L34.6 11.8L31.6 10.4L34.6 9Z" fill="${T.light}"/></g>`;
  const u = (tx, ty, sx, sy) => `<use href="#${P}k" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return defs + band + rows + `<defs>${cr}</defs>` + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
}
module.exports = { frameBorder };
