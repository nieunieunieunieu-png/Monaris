// ===== hoso/frame/shop_ulam/border.js — VIỀN THẺ: cành cổ thụ uốn quấn viền =====
// Hình học: nét ≤ 22px vào trong (lá/dây cao 4..17); góc 44×44; chừa 28px giữa cạnh trên (x = W/2 ± 14).
const T = require('./colors').TIERS[0];
const P = 'shop_ulam-border-';
const n = (v) => Number(v.toFixed(1));
const lf = (a, len) => `<path d="M0 0Q${n(len * 0.4)} ${n(-len * 0.4)} ${len} 0Q${n(len * 0.4)} ${n(len * 0.4)} 0 0Z" transform="rotate(${a})" fill="${T.main}" stroke="${T.dark}" stroke-width="0.6" stroke-linejoin="round"/>`;
function frameBorder(_tier, W, H) {
  const mx = W / 2;
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.wood}"/><stop offset="0.5" stop-color="${T.woodDark}"/><stop offset="1" stop-color="${T.wood}"/></linearGradient>`
    + `<g id="${P}s"><g transform="translate(0 4)">${lf(55, 10)}${lf(125, 10)}</g><path d="M0 5C-4 9 -10 8 -10 12C-10 15.5 -5.6 15.5 -5.8 12.6M0 5C4 9 10 8 10 12C10 15.5 5.6 15.5 5.8 12.6" fill="none" stroke="${T.main}" stroke-width="1" stroke-linecap="round"/><circle cx="0" cy="8.5" r="1.8" fill="${T.firefly}" stroke="${T.dark}" stroke-width="0.5"/></g></defs>`;
  const path = `M${n(mx - 14)} 4H4V${H - 4}H${W - 4}V4H${n(mx + 14)}`;
  const band = `<path d="${path}" fill="none" stroke="${T.woodDark}" stroke-width="8.4" stroke-linejoin="round"/><path d="${path}" fill="none" stroke="url(#${P}g)" stroke-width="5.8" stroke-linejoin="round"/><path d="${path}" fill="none" stroke="${T.light}" stroke-width="0.6" stroke-opacity="0.6" stroke-dasharray="9 7 3 11" transform="translate(-1 -1)"/><path d="${path}" fill="none" stroke="${T.dark}" stroke-width="0.7" stroke-opacity="0.55" stroke-dasharray="5 13" transform="translate(1 1)"/>`;
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
  const fl = (cx, cy) => { let d = ''; for (let i = 0; i < 5; i++) { const a = (i * 72 * Math.PI) / 180; d += `M${n(cx + 3.4 * Math.cos(a) - 3)} ${n(cy + 3.4 * Math.sin(a))}a3 3 0 1 0 6 0a3 3 0 1 0 -6 0`; } return `<path d="${d}" fill="${T.bloom}" stroke="${T.bloomEdge}" stroke-width="0.6"/><circle cx="${cx}" cy="${cy}" r="2.2" fill="${T.core}" stroke="${T.woodDark}" stroke-width="0.5"/>`; };
  const cr = `<g id="${P}k"><path d="M2 2H42V10H10V42H2Z" fill="url(#${P}g)" stroke="${T.woodDark}" stroke-width="1" stroke-linejoin="round"/><path d="M6 6H40M6 6V40" fill="none" stroke="${T.light}" stroke-width="0.6" stroke-opacity="0.6"/><g transform="translate(24 24)">${lf(20, 11)}${lf(70, 11)}${lf(-30, 9)}${lf(110, 9)}</g>${fl(14, 14)}<circle cx="36" cy="6" r="1.4" fill="${T.firefly}"/><circle cx="6" cy="36" r="1.4" fill="${T.firefly}"/></g>`;
  const u = (tx, ty, sx, sy) => `<use href="#${P}k" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return defs + band + rows + `<defs>${cr}</defs>` + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
}
module.exports = { frameBorder };
