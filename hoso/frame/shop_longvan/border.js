// ===== hoso/frame/shop_longvan/border.js — VIỀN THẺ (làm lại): nẹp vàng đôi + chấm vàng + mây xoáy/ngọc đỏ xen kẽ mỗi 44px + góc xoáy mây =====
// Hình học: nẹp inset 10 và 17, chấm vàng inset 20 (≤22); mây ≤8px vào trong; góc 44×44; chừa 28px giữa cạnh trên.
const T = require('./colors').TIERS[0];
const P = 'shop_longvan-border-';
function frameBorder(_tier, W, H) {
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.5" stop-color="${T.main}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient><g id="${P}c"><path d="M-9 0C-10 -4 -6 -6 -3.5 -3.5C-3 -8 4 -8 4.5 -3.5C7 -6 10 -3 9 0Z" fill="${T.cloud}" stroke="${T.main}" stroke-width="0.7"/><path d="M-1 -3.5C-1 -5.5 2 -5.5 2 -3.5C2 -2.3 0.2 -2.3 0.2 -3.4" fill="none" stroke="${T.main}" stroke-width="0.6"/></g><path id="${P}d" d="M0 -3.4L2.4 0L0 3.4L-2.4 0Z" fill="${T.red}" stroke="${T.main}" stroke-width="0.7" stroke-linejoin="round"/><g id="${P}k"><path d="M5 41L5 15Q5 5 15 5L41 5" fill="none" stroke="${T.dark}" stroke-width="6.4" stroke-linecap="round" opacity="0.5"/><path d="M5 41L5 15Q5 5 15 5L41 5" fill="none" stroke="url(#${P}g)" stroke-width="4.6" stroke-linecap="round"/><path d="M14 31C12 23 20 17 27 21C31 25 27 31 23 29C20 27 22 24 24 25" fill="none" stroke="${T.main}" stroke-width="2" stroke-linecap="round"/><path d="M16 29C15 25 19 22 22 23" fill="none" stroke="${T.light}" stroke-width="0.9" stroke-linecap="round"/><path d="M11 6.5L14.5 11L11 15.5L7.5 11Z" fill="${T.red}" stroke="${T.light}" stroke-width="1" stroke-linejoin="round" transform="translate(0 -1)"/><circle cx="32" cy="12" r="1.7" fill="${T.main}"/><circle cx="12" cy="32" r="1.7" fill="${T.main}"/></g></defs>`;
  const lines = `<rect x="10" y="10" width="${W - 20}" height="${H - 20}" rx="6" fill="none" stroke="${T.dark}" stroke-width="4.6" opacity="0.45"/><rect x="10" y="10" width="${W - 20}" height="${H - 20}" rx="6" fill="none" stroke="url(#${P}g)" stroke-width="3.2"/><rect x="17" y="17" width="${W - 34}" height="${H - 34}" rx="3" fill="none" stroke="${T.light}" stroke-width="1" opacity="0.55"/><rect x="20.5" y="20.5" width="${W - 41}" height="${H - 41}" rx="2" fill="none" stroke="${T.main}" stroke-width="1.3" stroke-linecap="round" stroke-dasharray="0.1 6" opacity="0.8"/>`;
  let u = '';
  const use = (id, x, y, tf) => `<use href="#${P}${id}" transform="translate(${x} ${y}) ${tf}"/>`;
  let i = 0;
  for (let x = 44; x < W - 40; x += 44) { i++; if (Math.abs(x - W / 2) < 30) continue; const id = i % 2 ? 'c' : 'd'; u += use(id, x, 10, 'scale(1 -1)') + use(id, x, H - 10, ''); }
  for (let y = 44; y < H - 40; y += 44) { i++; const id = i % 2 ? 'c' : 'd'; u += use(id, 10, y, 'rotate(90)') + use(id, W - 10, y, 'rotate(-90)'); }
  const k = (tx, ty, sx, sy) => `<use href="#${P}k" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return defs + lines + u + k(0, 0, 1, 1) + k(W, 0, -1, 1) + k(0, H, 1, -1) + k(W, H, -1, -1);
}
module.exports = { frameBorder };
