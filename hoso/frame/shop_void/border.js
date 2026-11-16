// ===== hoso/frame/shop_void/border.js — VIỀN THẺ: thạch anh tím viền kim loại =====
// Hình học: nét ≤ 22px vào trong (cụm thạch anh cao 3..18.4); góc 44×44; chừa 28px giữa cạnh trên (x = W/2 ± 14).
const T = require('./colors').TIERS[0];
const P = 'shop_void-border-';
const n = (v) => Number(v.toFixed(1));
function frameBorder(_tier, W, H) {
  const mx = W / 2;
  const shard = `<path d="M-3.4 4L3.4 4L4.6 11.6L0 18.4L-4.6 11.6Z" fill="url(#${P}c)" stroke="${T.deep}" stroke-width="0.8" stroke-linejoin="round"/><path d="M0 4V18.4M-3.4 4L-1.2 11.6L0 18.4M3.4 4L1.2 11.6" fill="none" stroke="${T.light}" stroke-width="0.5" stroke-opacity="0.7"/>`;
  const defs = `<defs><linearGradient id="${P}m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B9B3D6"/><stop offset="0.5" stop-color="#6E6890"/><stop offset="1" stop-color="${T.deep}"/></linearGradient><linearGradient id="${P}c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.5" stop-color="${T.main}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient>`
    + `<g id="${P}s"><g transform="translate(0 4) rotate(30) scale(0.62) translate(0 -4)">${shard}</g><g transform="translate(0 4) rotate(-30) scale(0.62) translate(0 -4)">${shard}</g>${shard}<rect x="-8" y="3" width="16" height="3.4" rx="1" fill="url(#${P}m)" stroke="${T.deep}" stroke-width="0.7"/><path d="M-1.4 9.4L0 7.8L1.4 9.4L0 11Z" fill="${T.star}"/></g></defs>`;
  const path = `M${n(mx - 14)} 4H4V${H - 4}H${W - 4}V4H${n(mx + 14)}`;
  const band = `<path d="${path}" fill="none" stroke="${T.deep}" stroke-width="8" stroke-linejoin="round"/><path d="${path}" fill="none" stroke="url(#${P}m)" stroke-width="5" stroke-linejoin="round"/><path d="${path}" fill="none" stroke="${T.main}" stroke-width="1" stroke-opacity="0.8" stroke-linejoin="round"/><path d="${path}" fill="none" stroke="${T.light}" stroke-width="0.6" stroke-opacity="0.8" transform="translate(-1 -1)"/>`;
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
  const cr = `<g id="${P}k"><path d="M2 2H42V10H10V42H2Z" fill="url(#${P}m)" stroke="${T.deep}" stroke-width="1" stroke-linejoin="round"/><path d="M6 6H40M6 6V40" fill="none" stroke="${T.light}" stroke-width="0.6" stroke-opacity="0.7"/><path d="M18 8.5L26.5 13.5V22.5L18 27.5L9.5 22.5V13.5Z" fill="url(#${P}c)" stroke="${T.deep}" stroke-width="1.2" stroke-linejoin="round"/><path d="M18 8.5V27.5M9.5 13.5L18 18L26.5 13.5M18 18L9.5 22.5M18 18L26.5 22.5" fill="none" stroke="${T.light}" stroke-width="0.6" stroke-opacity="0.8"/><path d="M14 12.5L16.6 11L15.4 15Z" fill="#FFFFFF" fill-opacity="0.85"/><path d="M33 6L34 8.6L36.6 9.6L34 10.6L33 13.2L32 10.6L29.4 9.6L32 8.6Z" fill="${T.star}"/><circle cx="6" cy="36" r="1.3" fill="${T.cyan}"/></g>`;
  const u = (tx, ty, sx, sy) => `<use href="#${P}k" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return defs + band + rows + `<defs>${cr}</defs>` + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
}
module.exports = { frameBorder };
