// ===== booster/border.js — VIỀN THẺ: 3 vòng gradient hồng→tím, góc tinh thể =====
// Hình học: nét ≤ 11px vào trong (viền tại 2 / 5 / 10); góc 44×44; chừa x = W/2 ± 14 ở cạnh trên; opacity 0.3–1.
const T = require('./colors').TIERS[0];
const P = 'booster-border-';
const n = (v) => Number(v.toFixed(1));
function frameBorder(_tier, W, H) {
  const mx = W / 2;
  const ring = (i) => `M${n(mx - 14)} ${i}H${i}V${H - i}H${W - i}V${i}H${n(mx + 14)}`;
  const defs = `<defs><linearGradient id="${P}g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${W}" y2="${H}"><stop offset="0" stop-color="${T.light}"/><stop offset="0.35" stop-color="${T.main}"/><stop offset="0.7" stop-color="${T.violet}"/><stop offset="1" stop-color="${T.ice}"/></linearGradient>` +
    `<g id="${P}k"><path d="M4 44V12L12 4H44" fill="none" stroke="url(#${P}g)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M9 28L9 14L14 9H28" fill="none" stroke="${T.light}" stroke-opacity="0.7" stroke-width="1" stroke-linejoin="round"/><path d="M16 16l5 -6l5 6l-5 6Z" fill="url(#${P}g)" stroke="${T.light}" stroke-width="0.7" stroke-linejoin="round"/><path d="M21 10V22" stroke="${T.light}" stroke-opacity="0.6" stroke-width="0.5"/></g></defs>`;
  const outer = `<path d="${ring(2)}" fill="none" stroke="${T.dark}" stroke-opacity="0.7" stroke-width="1" stroke-linejoin="round"/>`;
  const main = `<path d="${ring(5)}" fill="none" stroke="url(#${P}g)" stroke-width="2" stroke-linejoin="round"/>`;
  const inner = `<path d="${ring(10)}" fill="none" stroke="${T.ice}" stroke-opacity="0.45" stroke-width="0.9" stroke-linejoin="round"/>`;
  const glint = `<path d="M${n(W * 0.22)} 5H${n(W * 0.3)}M${n(W - 5)} ${n(H * 0.7)}V${n(H * 0.62)}M${n(W * 0.78)} ${n(H - 5)}H${n(W * 0.7)}" stroke="#FFFFFF" stroke-opacity="0.85" stroke-width="1.6" stroke-linecap="round" fill="none"/>`;
  const u = (tx, ty, sx, sy) => `<use href="#${P}k" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return defs + outer + main + inner + glint + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
}
module.exports = { frameBorder };
