// ===== hoso/frame/shop_loidien/border.js — VIỀN THẺ: nẹp tím đôi + dây điện zigzag xanh + góc chữ L có nút sét =====
// Hình học: nẹp inset 10 và 17 (≤22); zigzag biên độ ±3 quanh inset 10; góc 44×44; chừa 28px giữa cạnh trên.
const T = require('./colors').TIERS[0];
const P = 'shop_loidien-border-';
function frameBorder(_tier, W, H) {
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.45" stop-color="${T.main}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient></defs>`;
  const lines = `<rect x="10" y="10" width="${W - 20}" height="${H - 20}" rx="6" fill="none" stroke="url(#${P}g)" stroke-width="3.2"/><rect x="17" y="17" width="${W - 34}" height="${H - 34}" rx="3" fill="none" stroke="${T.accent}" stroke-width="0.9" opacity="0.5"/>`;
  const zig = (horiz, a, b, edge) => {
    let d = '', up = false;
    for (let t = a; t <= b + 0.1; t += 11) { const o = edge + (up ? 3 : -3); d += (d ? 'L' : 'M') + (horiz ? `${t} ${o}` : `${o} ${t}`); up = !up; }
    return `<path d="${d}" fill="none" stroke="${T.accent}" stroke-width="1.5" stroke-linejoin="round" opacity="0.9"/>`;
  };
  const m = W / 2;
  const z = zig(true, 55, m - 22, 10) + zig(true, m + 22, W - 55, 10) + zig(true, 55, W - 55, H - 10) + zig(false, 55, H - 55, 10) + zig(false, 55, H - 55, W - 10);
  const corner = `<path d="M5 41L5 15Q5 5 15 5L41 5" fill="none" stroke="url(#${P}g)" stroke-width="4.5" stroke-linecap="round"/><path d="M22 6L15 17L21 17L13 31L27 13L20 13Z" fill="${T.bolt}" stroke="${T.accent}" stroke-width="0.8" stroke-linejoin="round" transform="translate(-4 -2) scale(0.9)"/><circle cx="5" cy="5" r="3.6" fill="${T.accent}" stroke="${T.bolt}" stroke-width="1"/>`;
  const g = (tx, ty, sx, sy) => `<g transform="translate(${tx} ${ty}) scale(${sx} ${sy})">${corner}</g>`;
  return defs + lines + z + g(0, 0, 1, 1) + g(W, 0, -1, 1) + g(0, H, 1, -1) + g(W, H, -1, -1);
}
module.exports = { frameBorder };
