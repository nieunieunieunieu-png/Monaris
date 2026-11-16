// ===== hoso/frame/shop_rungthieng/border.js — VIỀN THẺ: nẹp vỏ cây đôi + dây leo uốn + lá mỗi 44px + góc chùm lá =====
// Hình học: nẹp inset 10 và 17 (≤22); dây leo inset 13±2.5; lá dài ≤9.5 hướng vào trong; góc 44×44; chừa 28px giữa cạnh trên.
const T = require('./colors').TIERS[0];
const P = 'shop_rungthieng-border-';
function frameBorder(_tier, W, H) {
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.barkLight}"/><stop offset="0.5" stop-color="${T.bark}"/><stop offset="1" stop-color="#3B2412"/></linearGradient><linearGradient id="${P}l" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${T.dark}"/><stop offset="0.6" stop-color="${T.main}"/><stop offset="1" stop-color="${T.light}"/></linearGradient><path id="${P}f" d="M0 0C3 -3 3 -7 0 -9.5C-3 -7 -3 -3 0 0Z" fill="url(#${P}l)" stroke="${T.dark}" stroke-width="0.4"/></defs>`;
  const lines = `<rect x="10" y="10" width="${W - 20}" height="${H - 20}" rx="6" fill="none" stroke="url(#${P}g)" stroke-width="3.2"/><rect x="17" y="17" width="${W - 34}" height="${H - 34}" rx="3" fill="none" stroke="${T.main}" stroke-width="0.9" opacity="0.55"/>`;
  const wave = (horiz, a, b, edge) => {
    let d = '';
    for (let t = a; t <= b; t += 6) { const o = edge + 2.5 * Math.sin(t / 9); d += (d ? 'L' : 'M') + (horiz ? `${t} ${Number(o.toFixed(2))}` : `${Number(o.toFixed(2))} ${t}`); }
    return `<path d="${d}" fill="none" stroke="${T.main}" stroke-width="1.5" stroke-linecap="round"/>`;
  };
  const m = W / 2;
  const w = wave(true, 52, m - 22, 13) + wave(true, m + 22, W - 52, 13) + wave(true, 52, W - 52, H - 13) + wave(false, 52, H - 52, 13) + wave(false, 52, H - 52, W - 13);
  let u = '', i = 0;
  const leaf = (x, y, rot) => `<use href="#${P}f" transform="translate(${x} ${y}) rotate(${rot})"/>`;
  for (let x = 66; x < W - 50; x += 44) { i++; if (Math.abs(x - m) < 30) continue; const t = i % 2 ? 30 : -30; u += leaf(x, 13, 180 + t) + leaf(x, H - 13, t); }
  for (let y = 66; y < H - 50; y += 44) { i++; const t = i % 2 ? 30 : -30; u += leaf(13, y, 90 + t) + leaf(W - 13, y, -90 + t); }
  const corner = `<path d="M5 41L5 15Q5 5 15 5L41 5" fill="none" stroke="url(#${P}g)" stroke-width="4.5" stroke-linecap="round"/><use href="#${P}f" transform="translate(14 14) rotate(135) scale(1.2)"/><use href="#${P}f" transform="translate(14 14) rotate(180) scale(1.1)"/><use href="#${P}f" transform="translate(14 14) rotate(90) scale(1.1)"/><circle cx="11" cy="11" r="3.2" fill="${T.gold}" stroke="${T.bark}" stroke-width="0.9"/>`;
  const g = (tx, ty, sx, sy) => `<g transform="translate(${tx} ${ty}) scale(${sx} ${sy})">${corner}</g>`;
  return defs + lines + w + u + g(0, 0, 1, 1) + g(W, 0, -1, 1) + g(0, H, 1, -1) + g(W, H, -1, -1);
}
module.exports = { frameBorder };
