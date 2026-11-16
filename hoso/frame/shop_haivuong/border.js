// ===== hoso/frame/shop_haivuong/border.js — VIỀN THẺ: vảy cá mạ vàng 2 hàng so le + rêu biển hướng vào trong + góc vảy quạt ngọc trai =====
// Hình học: nét ≤ 22px vào trong (vảy sâu 14, rêu sâu 20); góc 44×44; chừa 28px giữa cạnh trên (x = W/2 ± 14).
const T = require('./colors').TIERS[0];
const P = 'shop_haivuong-border-';
const n = (v) => Number(v.toFixed(2));
function frameBorder(_tier, W, H) {
  const mx = W / 2;
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.goldLight}"/><stop offset="0.5" stop-color="${T.gold}"/><stop offset="1" stop-color="${T.goldDark}"/></linearGradient><linearGradient id="${P}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="1" stop-color="${T.main}"/></linearGradient><radialGradient id="${P}p" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.5" stop-color="${T.pearl}"/><stop offset="1" stop-color="${T.light}"/></radialGradient>`
    + `<path id="${P}s" d="M-10 0Q-10 14 0 14Q10 14 10 0Z" fill="url(#${P}g)" stroke="${T.goldDark}" stroke-width="0.8" stroke-linejoin="round"/>`
    + `<path id="${P}t" d="M-7 0Q-7 9 0 9Q7 9 7 0Z" fill="url(#${P}b)" stroke="${T.dark}" stroke-width="0.7" stroke-linejoin="round"/>`
    + `<path id="${P}m" d="M0 0C-5 5 5 9 0 14C-4 18 3 20 0 20M0 6C-4 7 -6 9 -7 12M0 11C4 12 6 14 7 17" fill="none" stroke="#2FA4A0" stroke-width="1.4" stroke-linecap="round"/>`
    + `<g id="${P}k"><path d="M3 3H40V8H8V40H3Z" fill="url(#${P}g)" stroke="${T.goldDark}" stroke-width="0.8" stroke-linejoin="round"/><path d="M10 10C10 24 18 32 32 32C26 26 24 18 24 10Z" fill="url(#${P}g)" stroke="${T.goldDark}" stroke-width="0.8" stroke-linejoin="round"/><path d="M12 12Q16 24 28 29M17 12Q20 20 27 25" fill="none" stroke="${T.goldDark}" stroke-width="0.6"/><circle cx="15" cy="15" r="4.2" fill="url(#${P}p)" stroke="${T.goldDark}" stroke-width="0.6"/><circle cx="13.8" cy="13.8" r="1" fill="#FFFFFF"/></g></defs>`;
  const line = `<path d="M${n(mx - 14)} 3H3V${H - 3}H${W - 3}V3H${n(mx + 14)}" fill="none" stroke="url(#${P}g)" stroke-width="3" stroke-linejoin="miter"/><path d="M${n(mx - 14)} 8H8V${H - 8}H${W - 8}V8H${n(mx + 14)}" fill="none" stroke="${T.light}" stroke-opacity="0.5" stroke-width="1"/>`;
  const place = { t: (u) => `translate(${u} 3)`, b: (u) => `translate(${u} ${H - 3}) rotate(180)`, l: (u) => `translate(3 ${u}) rotate(-90)`, r: (u) => `translate(${W - 3} ${u}) rotate(90)` };
  const mrot = { t: 180, b: 0, l: 90, r: -90 };
  const mpos = { t: (u) => `translate(${u} ${n(3 + 20)})`, b: (u) => `translate(${u} ${n(H - 23)})`, l: (u) => `translate(${n(3 + 20)} ${u})`, r: (u) => `translate(${n(W - 23)} ${u})` };
  let back = '', front = '', moss = '';
  const run = (side, len) => {
    for (let u = 62, k = 0; u <= len - 62; u += 22, k++) {
      if (side === 't' && Math.abs(u - mx) < 26) continue;
      back += `<use href="#${P}t" transform="${place[side](u + 11)}"/>`;
      front += `<use href="#${P}s" transform="${place[side](u)}"/>`;
      if (k % 4 === 2) moss += `<use href="#${P}m" transform="${mpos[side](u + 11)} rotate(${mrot[side]})"/>`;
    }
  };
  run('t', W); run('b', W); run('l', H); run('r', H);
  const u = (tx, ty, sx, sy) => `<use href="#${P}k" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return defs + line + moss + back + front + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
}
module.exports = { frameBorder };
