// ===== hoso/frame/shop_arcade/border.js — VIỀN THẺ: viền pixel dày gradient (toàn bằng rect) =====
// Hình học: băng gradient dày 14 + vạch tối 2 + răng pixel 4×4 (sâu 16..20); góc 44×44 (sâu ≤22); chừa x = W/2 ± 14 ở cạnh trên.
const T = require('./colors').TIERS[0];
const P = 'shop_arcade-border-';
const n = (v) => Number(v.toFixed(1));
function frameBorder(_tier, W, H) {
  const mx = W / 2;
  const stops = `<stop offset="0" stop-color="${T.main}"/><stop offset="0.33" stop-color="${T.accent}"/><stop offset="0.66" stop-color="${T.blue}"/><stop offset="1" stop-color="${T.main}"/>`;
  const defs = `<defs><linearGradient id="${P}h" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${W}" y2="0">${stops}</linearGradient><linearGradient id="${P}v" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${H}">${stops}</linearGradient>`
    + `<g id="${P}k"><rect x="0" y="0" width="44" height="14" fill="${T.main}"/><rect x="0" y="0" width="14" height="44" fill="${T.main}"/><rect x="14" y="14" width="8" height="8" fill="${T.dark}"/><rect x="16" y="16" width="4" height="4" fill="${T.accent}"/><rect x="4" y="4" width="6" height="6" fill="${T.light}"/><rect x="26" y="14" width="4" height="4" fill="${T.blue}"/><rect x="14" y="26" width="4" height="4" fill="${T.blue}"/><rect x="36" y="0" width="8" height="4" fill="${T.accent}"/><rect x="0" y="36" width="4" height="8" fill="${T.accent}"/></g></defs>`;
  const band = `<rect x="0" y="0" width="${n(mx - 14)}" height="14" fill="url(#${P}h)"/><rect x="${n(mx + 14)}" y="0" width="${n(W - mx - 14)}" height="14" fill="url(#${P}h)"/><rect x="0" y="${H - 14}" width="${W}" height="14" fill="url(#${P}h)"/><rect x="0" y="0" width="14" height="${H}" fill="url(#${P}v)"/><rect x="${W - 14}" y="0" width="14" height="${H}" fill="url(#${P}v)"/>`;
  const line = `<path fill="${T.dark}" d="M0 14H${n(mx - 14)}v2H0zM${n(mx + 14)} 14H${W}v2H${n(mx + 14)}zM0 ${H - 16}H${W}v2H0zM14 14h2V${H - 16}h-2zM${W - 16} 14h2V${H - 16}h-2z"/>`;
  let a = ''; let b = '';
  const tooth = (x, y, i) => { const s = `M${x} ${y}h4v4h-4z`; if (i % 2) b += s; else a += s; };
  for (let x = 20, i = 0; x < W - 20; x += 12, i++) { if (Math.abs(x + 2 - mx) > 30) tooth(n(x), 16, i); tooth(n(x), H - 20, i + 1); }
  for (let y = 44, i = 0; y < H - 44; y += 12, i++) { tooth(16, n(y), i); tooth(W - 20, n(y), i + 1); }
  const teeth = `<path fill="${T.accent}" d="${a}"/><path fill="${T.light}" d="${b}"/>`;
  const u = (tx, ty, sx, sy) => `<use href="#${P}k" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return `<g shape-rendering="crispEdges">${defs}${band}${line}${teeth}${u(0, 0, 1, 1)}${u(W, 0, -1, 1)}${u(0, H, 1, -1)}${u(W, H, -1, -1)}</g>`;
}
module.exports = { frameBorder };
