// ===== hoso/frame/shop_bang/border.js — VIỀN THẺ: tinh thể băng sắc nhọn xếp lớp =====
// Hình học: nét ≤ 22px vào trong; góc 44×44; chừa 28px giữa cạnh trên (x = W/2 ± 14).
const T = require('./colors').TIERS[0];
const P = 'shop_bang-border-';
const n = (v) => Number(v.toFixed(2));
function frameBorder(_tier, W, H) {
  const mx = W / 2;
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.5" stop-color="${T.main}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient><linearGradient id="${P}c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.accent}"/><stop offset="0.45" stop-color="${T.frost}"/><stop offset="1" stop-color="${T.main}"/></linearGradient></defs>`;
  // đường viền chính (hở 28px giữa cạnh trên) + đường mảnh lớp trong
  const line = `<path d="M${n(mx - 14)} 3H3V${H - 3}H${W - 3}V3H${n(mx + 14)}" fill="none" stroke="url(#${P}g)" stroke-width="3" stroke-linejoin="miter"/>`
    + `<path d="M${n(mx - 14)} 9H9V${H - 9}H${W - 9}V9H${n(mx + 14)}" fill="none" stroke="${T.light}" stroke-opacity="0.55" stroke-width="1"/>`;
  // gai băng: toạ độ (u dọc cạnh, d chiều sâu vào trong)
  const pt = { t: (u, d) => [u, d], b: (u, d) => [u, H - d], l: (u, d) => [d, u], r: (u, d) => [W - d, u] };
  let big = '', small = '';
  const spike = (side, u, w, h) => {
    const a = pt[side](u - w, 3), b = pt[side](u, 3 + h), c = pt[side](u + w, 3);
    return `M${n(a[0])} ${n(a[1])}L${n(b[0])} ${n(b[1])}L${n(c[0])} ${n(c[1])}Z`;
  };
  const run = (side, len) => {
    let k = 0;
    for (let u = 62; u <= len - 62; u += 24, k++) {
      if (side === 't' && Math.abs(u - mx) < 26) continue;
      big += spike(side, u, 6, k % 2 ? 13 : 21);
      small += spike(side, u + 12, 3.5, k % 2 ? 9 : 6);
    }
  };
  run('t', W); run('b', W); run('l', H); run('r', H);
  const spikes = `<path d="${big}" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.7" stroke-linejoin="round"/><path d="${small}" fill="${T.light}" fill-opacity="0.8"/>`;
  // góc 44×44: cụm tinh thể
  const cr = `<g id="${P}k"><path d="M3 3L40 8L17 17Z M3 3L8 40L17 17Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/><path d="M7 7L27 13L34 34L13 27Z" fill="url(#${P}c)" stroke="${T.dark}" stroke-width="1" stroke-linejoin="round"/><path d="M7 7L34 34M27 13L13 27" stroke="${T.accent}" stroke-opacity="0.85" stroke-width="0.8"/></g>`;
  const u = (tx, ty, sx, sy) => `<use href="#${P}k" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  const corners = `<defs>${cr}</defs>` + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
  return defs + line + spikes + corners;
}
module.exports = { frameBorder };
