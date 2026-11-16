// ===== hoso/frame/shop_cuulong/border.js — VIỀN & GÓC Chí Tôn (CLCT-2) =====
// Nẹp vàng kim 2 lớp + hàng vảy; 4 góc 44×44 (ngọc nguyên tố ở accents); 4 đĩa rồng theo docs 9A.4:
// giữa cạnh trái = 7 Phụ Hí · giữa cạnh phải = 9 Toan Nghê · chân thẻ trái (W/2−150) = 4 Xi Vẫn · chân thẻ phải (W/2+150) = 3 Nhai Tí.
// Mốc: n≥3 hàng vảy dày + đinh; n≥6 vạch trong đổi dải 9 nguyên tố; n=9 vạch sáng ngoài.
const { ctxOf, dragonDisc, goldGrad, round2, n2 } = require('./shared');
const { TIERS } = require('./colors');

function frameBorder(tier, W, H, rawCtx) {
  const T = TIERS[0];
  const c = ctxOf(rawCtx);
  const P = 'clbd-';
  const D = T.dragons;
  let defs = `<defs>${goldGrad(`${P}g`, T)}`;
  // dải nguyên tố chạy ngang (n≥6): 9 màu theo thứ tự rồng, chưa có = vàng
  defs += `<linearGradient id="${P}el" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${W}" y2="0">${D.map((d, i) => `<stop offset="${n2(i / 8)}" stop-color="${c.owned.has(d.id) ? d.main : T.gold2}"/>`).join('')}</linearGradient>`;
  // góc 44×44: tấm vàng chéo + móng vuốt + thoi giữa
  defs += `<g id="${P}k"><path d="M2 2H40L34 8H8V34L2 40Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/>`
    + `<path d="M8 8H30L26 12H12V26L8 30Z" fill="${T.void}" fill-opacity="0.55" stroke="${T.gold3}" stroke-width="0.7"/>`
    + `<path d="M13 13L19 19" stroke="${T.gold3}" stroke-width="1.6" stroke-linecap="round"/><circle cx="21" cy="21" r="3" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.6"/><circle cx="20.2" cy="20.2" r="0.9" fill="#fff"/>`
    + `<path d="M40 2L46 4L40 8Z M2 40L4 46L8 40Z" fill="${T.gold3}" stroke="${T.dark}" stroke-width="0.5"/></g>`;
  // vảy cạnh: 1 viên vảy vàng 22px (nhìn từ trên xuống)
  defs += `<g id="${P}s"><path d="M-9 0Q0 14 9 0Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.6"/><path d="M-5 0Q0 7 5 0" fill="none" stroke="${T.light}" stroke-opacity="0.7" stroke-width="0.7"/></g></defs>`;

  let s = defs;
  s += `<rect x="5.5" y="5.5" width="${W - 11}" height="${H - 11}" rx="5" fill="none" stroke="${T.dark}" stroke-width="9"/>`;
  s += `<rect x="5.5" y="5.5" width="${W - 11}" height="${H - 11}" rx="5" fill="none" stroke="url(#${P}g)" stroke-width="7"/>`;
  s += `<rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="6" fill="none" stroke="${T.light}" stroke-opacity="0.8" stroke-width="0.9"/>`;
  s += `<rect x="9" y="9" width="${W - 18}" height="${H - 18}" rx="4" fill="none" stroke="${T.gold3}" stroke-opacity="${c.n >= 3 ? 0.7 : 0.45}" stroke-width="1.4" stroke-dasharray="${c.n >= 3 ? '3 1.6' : '6 5'}"/>`;
  s += `<rect x="14" y="14" width="${W - 28}" height="${H - 28}" rx="3" fill="none" stroke="${c.n >= 6 ? `url(#${P}el)` : T.main}" stroke-opacity="0.9" stroke-width="${c.n >= 6 ? 2 : 1.2}"/>`;
  if (c.n >= 9) s += `<rect x="19" y="19" width="${W - 38}" height="${H - 38}" rx="2" fill="none" stroke="${T.light}" stroke-opacity="0.55" stroke-width="0.8"/>`;

  // hàng vảy dọc 4 cạnh (cách 44px; chừa giữa cạnh trên cho đỉnh, và chừa chỗ đĩa rồng)
  const run = (len, fn) => { const cnt = Math.max(1, Math.floor((len - 88) / 44)); const off = 44 + (len - 88 - cnt * 44) / 2 + 22; for (let i = 0; i < cnt; i += 1) fn(n2(off + i * 44)); };
  const keepTop = (x) => Math.abs(x - W / 2) >= 60;
  const keepBot = (x) => Math.abs(x - (W / 2 - 150)) >= 42 && Math.abs(x - (W / 2 + 150)) >= 42;
  const keepSide = (y) => Math.abs(y - H / 2) >= 44;
  run(W, (x) => { if (keepTop(x)) s += `<use href="#${P}s" transform="translate(${x} 11)"/>`; });
  run(W, (x) => { if (keepBot(x)) s += `<use href="#${P}s" transform="translate(${x} ${H - 11}) rotate(180)"/>`; });
  run(H, (y) => { if (keepSide(y)) s += `<use href="#${P}s" transform="translate(11 ${y}) rotate(-90)"/>`; });
  run(H, (y) => { if (keepSide(y)) s += `<use href="#${P}s" transform="translate(${W - 11} ${y}) rotate(90)"/>`; });

  const k = (tx, ty, sx, sy) => `<use href="#${P}k" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  s += k(0, 0, 1, 1) + k(W, 0, -1, 1) + k(0, H, 1, -1) + k(W, H, -1, -1);

  // 4 đĩa rồng (9A.4): giữa cạnh trái/phải, hai chân thẻ
  s += dragonDisc(T, P, 6, c, 0, H / 2, -90, 29, 24);
  s += dragonDisc(T, P, 8, c, W, H / 2, 90, 29, 24);
  s += dragonDisc(T, P, 3, c, W / 2 - 150, H, 180, 29, 24);
  s += dragonDisc(T, P, 2, c, W / 2 + 150, H, 180, 29, 24);
  return round2(s);
}
module.exports = { frameBorder };
