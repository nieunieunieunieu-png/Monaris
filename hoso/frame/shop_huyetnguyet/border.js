// ===== hoso/frame/shop_huyetnguyet/border.js — VIỀN THẺ: xích sắt chéo + gai nhọn ma đạo =====
// Hình học: nét ≤ 22px vào trong (gai cao 4..19.5); góc 44×44; chừa 28px giữa cạnh trên (x = W/2 ± 14).
const T = require('./colors').TIERS[0];
const P = 'shop_huyetnguyet-border-';
const n = (v) => Number(v.toFixed(1));
function frameBorder(_tier, W, H) {
  const mx = W / 2;
  const lk = (rot) => `<ellipse cx="0" cy="5" rx="9.5" ry="2.9" transform="rotate(${rot} 0 5)" fill="none" stroke="${T.black}" stroke-width="3.4"/><ellipse cx="0" cy="5" rx="9.5" ry="2.9" transform="rotate(${rot} 0 5)" fill="none" stroke="${T.iron}" stroke-width="2"/>`;
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.ironLight}"/><stop offset="0.5" stop-color="${T.iron}"/><stop offset="1" stop-color="${T.black}"/></linearGradient><linearGradient id="${P}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.4" stop-color="${T.main}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient>`
    + `<g id="${P}s">${lk(24)}${lk(-24)}<path d="M-5.5 4L0 19.5L5.5 4Z" fill="url(#${P}r)" stroke="${T.black}" stroke-width="1" stroke-linejoin="round"/><path d="M-1.4 6.5L0 15L1.4 6.5Z" fill="${T.light}" fill-opacity="0.55"/><circle cx="0" cy="5" r="1.5" fill="${T.ember}"/></g></defs>`;
  const path = `M${n(mx - 14)} 4H4V${H - 4}H${W - 4}V4H${n(mx + 14)}`;
  const band = `<path d="${path}" fill="none" stroke="${T.black}" stroke-width="7.6" stroke-linejoin="round"/><path d="${path}" fill="none" stroke="url(#${P}g)" stroke-width="4.6" stroke-linejoin="round"/><path d="${path}" fill="none" stroke="${T.main}" stroke-width="0.9" stroke-opacity="0.8" stroke-linejoin="round"/><path d="${path}" fill="none" stroke="${T.ironLight}" stroke-width="0.6" stroke-opacity="0.8" transform="translate(-1 -1)"/>`;
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
  const cr = `<g id="${P}k"><path d="M2 2H42V10H10V42H2Z" fill="url(#${P}g)" stroke="${T.black}" stroke-width="1" stroke-linejoin="round"/><path d="M10 18L36 36L18 10Z" fill="url(#${P}r)" stroke="${T.black}" stroke-width="1" stroke-linejoin="round"/><path d="M15 17L30 31L17 15Z" fill="${T.light}" fill-opacity="0.45"/><circle cx="14" cy="14" r="6" fill="${T.black}" stroke="${T.iron}" stroke-width="1.4"/><path d="M8.6 14Q14 10 19.4 14Q14 18 8.6 14Z" fill="${T.main}"/><circle cx="14" cy="14" r="1.8" fill="${T.ember}"/><ellipse cx="14" cy="14" rx="0.6" ry="1.8" fill="${T.black}"/><circle cx="36" cy="6" r="1.3" fill="${T.ember}"/><circle cx="6" cy="36" r="1.3" fill="${T.ember}"/></g>`;
  const u = (tx, ty, sx, sy) => `<use href="#${P}k" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return defs + band + rows + `<defs>${cr}</defs>` + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
}
module.exports = { frameBorder };
