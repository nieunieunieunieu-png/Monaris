// ===== hoso/frame/shop_glass/border.js — VIỀN THẺ: viền kính mảnh 1–1.5px + vệt phản quang =====
// Hình học: nét ≤ 11px vào trong (viền tại 2 / 5 / 10); góc 44×44 (ô kính sâu ≤ 24); chừa x = W/2 ± 14 ở cạnh trên; mọi opacity 0.15–0.8.
const T = require('./colors').TIERS[0];
const P = 'shop_glass-border-';
const n = (v) => Number(v.toFixed(1));
function frameBorder(_tier, W, H) {
  const mx = W / 2;
  const ring = (i) => `M${n(mx - 14)} ${i}H${i}V${H - i}H${W - i}V${i}H${n(mx + 14)}`;
  const outer = `<path d="${ring(2)}" fill="none" stroke="${T.dark}" stroke-opacity="0.4" stroke-width="1" stroke-linejoin="round"/>`;
  const main = `<path d="${ring(5)}" fill="none" stroke="#FFFFFF" stroke-opacity="0.6" stroke-width="1.5" stroke-linejoin="round"/>`;
  const inner = `<path d="${ring(10)}" fill="none" stroke="${T.accent}" stroke-opacity="0.35" stroke-width="1" stroke-linejoin="round"/>`;
  const gl = (d, o, w) => `<path d="${d}" stroke="#FFFFFF" stroke-opacity="${o}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
  const gloss = gl(`M46 5H${n(W * 0.3)}`, 0.8, 1.4) + gl(`M${n(W * 0.32)} 5H${n(W * 0.36)}`, 0.5, 1.4)
    + gl(`M5 46V${n(H * 0.3)}`, 0.7, 1.4) + gl(`M${n(W - 46)} ${n(H - 5)}H${n(W * 0.7)}`, 0.55, 1.4) + gl(`M${n(W - 5)} ${n(H - 46)}V${n(H * 0.7)}`, 0.45, 1.4);
  const defs = `<defs><g id="${P}k"><rect x="4" y="4" width="20" height="20" rx="5" fill="#FFFFFF" fill-opacity="0.15" stroke="#FFFFFF" stroke-opacity="0.65" stroke-width="1"/><path d="M4 42V10Q4 4 10 4H42" fill="none" stroke="#FFFFFF" stroke-opacity="0.8" stroke-width="1.5" stroke-linecap="round"/><path d="M9 19L19 9" stroke="${T.accent}" stroke-opacity="0.8" stroke-width="1" stroke-linecap="round"/><circle cx="13.5" cy="13.5" r="1.1" fill="#FFFFFF" fill-opacity="0.8"/><path d="M42 9V4M9 42H4" stroke="${T.dark}" stroke-opacity="0.45" stroke-width="1"/></g></defs>`;
  const u = (tx, ty, sx, sy) => `<use href="#${P}k" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return defs + outer + main + inner + gloss + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
}
module.exports = { frameBorder };
