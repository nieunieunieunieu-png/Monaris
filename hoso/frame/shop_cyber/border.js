// ===== hoso/frame/shop_cyber/border.js — VIỀN THẺ: nẹp kim loại góc cạnh + đường neon =====
// Hình học: nét ≤ 22px vào trong (tấm giáp cao 4..13); góc 44×44; chừa 28px giữa cạnh trên (x = W/2 ± 14).
const T = require('./colors').TIERS[0];
const P = 'shop_cyber-border-';
const n = (v) => Number(v.toFixed(1));
function frameBorder(_tier, W, H) {
  const mx = W / 2;
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4C6372"/><stop offset="0.5" stop-color="${T.steel}"/><stop offset="1" stop-color="${T.bg}"/></linearGradient>`
    + `<g id="${P}s"><path d="M-14 4L-9 13H9L14 4Z" fill="url(#${P}g)" stroke="${T.main}" stroke-width="0.8" stroke-linejoin="round"/><path d="M-6 10H6" stroke="${T.main}" stroke-width="1.2" stroke-linecap="round"/><rect x="-1.4" y="5.6" width="2.8" height="2.8" fill="${T.pink}"/><path d="M-24 4V8.5H-16M24 4V8.5H16" fill="none" stroke="${T.main}" stroke-width="0.8" stroke-opacity="0.85"/><circle cx="-16" cy="8.5" r="1.2" fill="${T.bg}" stroke="${T.main}" stroke-width="0.7"/><circle cx="16" cy="8.5" r="1.2" fill="${T.bg}" stroke="${T.main}" stroke-width="0.7"/></g></defs>`;
  const path = `M${n(mx - 14)} 4H4V${H - 4}H${W - 4}V4H${n(mx + 14)}`;
  const band = `<path d="${path}" fill="none" stroke="${T.bg}" stroke-width="8" stroke-linejoin="miter"/><path d="${path}" fill="none" stroke="url(#${P}g)" stroke-width="5.2" stroke-linejoin="miter"/><path d="${path}" fill="none" stroke="${T.main}" stroke-width="3.4" stroke-opacity="0.22" stroke-linejoin="miter"/><path d="${path}" fill="none" stroke="${T.main}" stroke-width="1" stroke-linejoin="miter"/><path d="${path}" fill="none" stroke="${T.light}" stroke-width="0.5" stroke-opacity="0.8" stroke-dasharray="14 30" stroke-linejoin="miter"/>`;
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
  const cr = `<g id="${P}k"><path d="M2 14L14 2H42V9H17L9 17V42H2Z" fill="url(#${P}g)" stroke="${T.main}" stroke-width="1" stroke-linejoin="miter"/><path d="M5.5 15L15 5.5H38M5.5 15V38" fill="none" stroke="${T.main}" stroke-width="0.9" stroke-opacity="0.8"/><rect x="11" y="11" width="6" height="6" fill="${T.bg}" stroke="${T.pink}" stroke-width="1"/><rect x="13" y="13" width="2" height="2" fill="${T.pink}"/><path d="M22 6.5H34M6 22V34" stroke="${T.light}" stroke-width="1.2"/><circle cx="40" cy="5.5" r="1.1" fill="${T.main}"/><circle cx="5.5" cy="40" r="1.1" fill="${T.main}"/></g>`;
  const u = (tx, ty, sx, sy) => `<use href="#${P}k" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return defs + band + rows + `<defs>${cr}</defs>` + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
}
module.exports = { frameBorder };
