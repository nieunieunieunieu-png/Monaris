// ===== hoso/frame/shop_hancung/border.js — VIỀN THẺ: cuộn mây tường vân + nẹp vàng =====
// Hình học: nét ≤ 22px vào trong (mây cao 4..20); góc 44×44; chừa 28px giữa cạnh trên (x = W/2 ± 14).
const T = require('./colors').TIERS[0];
const P = 'shop_hancung-border-';
const n = (v) => Number(v.toFixed(1));
function frameBorder(_tier, W, H) {
  const mx = W / 2;
  const half = `<path d="M0 5C-5 5 -9 8 -9 12C-9 15.5 -4.6 16.4 -3.8 13.2C-3.2 10.8 -6 10 -7 12" fill="none" stroke="${T.dark}" stroke-width="3" stroke-linecap="round"/><path d="M0 5C-5 5 -9 8 -9 12C-9 15.5 -4.6 16.4 -3.8 13.2C-3.2 10.8 -6 10 -7 12" fill="none" stroke="url(#${P}g)" stroke-width="1.6" stroke-linecap="round"/><path d="M-9 6C-14 6 -17 4 -22 5.4" fill="none" stroke="${T.main}" stroke-width="1.2" stroke-linecap="round"/><circle cx="-22" cy="5.4" r="1.1" fill="${T.light}"/>`;
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.5" stop-color="${T.main}"/><stop offset="1" stop-color="#8F6B12"/></linearGradient>`
    + `<g id="${P}s"><g>${half}</g><g transform="scale(-1 1)">${half}</g><path d="M0 6.5C-2.6 9.6 -2.6 12.6 0 15C2.6 12.6 2.6 9.6 0 6.5Z" fill="${T.jade}" stroke="${T.main}" stroke-width="0.8" stroke-linejoin="round"/><path d="M-0.6 9L-0.3 12" stroke="${T.light}" stroke-width="0.7" stroke-linecap="round"/></g></defs>`;
  const path = `M${n(mx - 14)} 4H4V${H - 4}H${W - 4}V4H${n(mx + 14)}`;
  const band = `<path d="${path}" fill="none" stroke="${T.dark}" stroke-width="7.6" stroke-linejoin="round"/><path d="${path}" fill="none" stroke="url(#${P}g)" stroke-width="5" stroke-linejoin="round"/><path d="${path}" fill="none" stroke="${T.silk}" stroke-width="1" stroke-opacity="0.75" stroke-linejoin="round"/><path d="${path}" fill="none" stroke="${T.light}" stroke-width="0.7" stroke-opacity="0.9" transform="translate(-1 -1)"/>`;
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
  const cr = `<g id="${P}k"><path d="M2 2H42V10H10V42H2Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="1" stroke-linejoin="round"/><path d="M14 14C26 14 34 18 34 28C34 35 27 36 26 31C25.4 28 29 27 30 29" fill="none" stroke="${T.dark}" stroke-width="2.6" stroke-linecap="round"/><path d="M14 14C26 14 34 18 34 28C34 35 27 36 26 31" fill="none" stroke="${T.light}" stroke-width="1.1" stroke-linecap="round"/><circle cx="18" cy="18" r="6.6" fill="${T.main}" stroke="${T.dark}" stroke-width="1"/><circle cx="18" cy="18" r="4" fill="${T.jade}" stroke="${T.light}" stroke-width="0.8"/><path d="M18 14.6L19.4 18L18 21.4L16.6 18Z" fill="${T.jadeDark}" fill-opacity="0.5"/><circle cx="16.8" cy="16.8" r="0.9" fill="#FFFFFF"/><path d="M30 6L31.2 8.8L34 10L31.2 11.2L30 14L28.8 11.2L26 10L28.8 8.8Z" fill="${T.light}"/><circle cx="6" cy="34" r="1.3" fill="${T.silk}" stroke="${T.main}" stroke-width="0.5"/></g>`;
  const u = (tx, ty, sx, sy) => `<use href="#${P}k" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return defs + band + rows + `<defs>${cr}</defs>` + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
}
module.exports = { frameBorder };
