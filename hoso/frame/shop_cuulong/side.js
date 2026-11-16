// ===== hoso/frame/shop_cuulong/side.js — CẠNH BÊN Chí Tôn (CLCT-2): 1 đoạn 100px nối khớp y=0/100 =====
// Xương sống vàng kim 3 lớp + 4 mảnh vảy thoi + 2 hạt ngọc: có rồng thì ngọc mang màu nguyên tố của rồng đã sở hữu (lần lượt), chưa có = ngọc trai vàng.
const { ctxOf, goldGrad, round2, n2 } = require('./shared');
const { TIERS } = require('./colors');

function sideUnit(tier, W, H, rawCtx) {
  const T = TIERS[0];
  const c = ctxOf(rawCtx);
  const P = 'clsd-';
  const own = T.dragons.filter((d) => c.owned.has(d.id));
  const bead = (y, i) => {
    const d = own.length ? own[i % own.length] : null;
    return d
      ? `<circle cx="0" cy="${y}" r="5.4" fill="${d.main}" fill-opacity="0.3"/><circle cx="0" cy="${y}" r="3" fill="${d.main}" stroke="${d.light}" stroke-width="0.7"/><circle cx="-0.9" cy="${y - 1}" r="0.9" fill="#fff"/>`
      : `<circle cx="0" cy="${y}" r="3" fill="${T.gold3}" stroke="${T.dark}" stroke-width="0.6"/><circle cx="-0.9" cy="${y - 1}" r="0.9" fill="#fff"/>`;
  };
  let s = `<defs>${goldGrad(`${P}g`, T, 1, 0)}</defs>`;
  s += `<path d="M0 0V100" stroke="${T.dark}" stroke-width="5" /><path d="M0 0V100" stroke="url(#${P}g)" stroke-width="3.4"/><path d="M0 0V100" stroke="${T.light}" stroke-opacity="0.85" stroke-width="0.8"/>`;
  [13, 37, 63, 87].forEach((y) => { s += `<path d="M0 ${y - 9}L8 ${y}L0 ${y + 9}L-8 ${y}Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.7" stroke-linejoin="round"/><path d="M0 ${y - 5}L3.6 ${y}L0 ${y + 5}L-3.6 ${y}Z" fill="${T.light}" fill-opacity="0.45"/>`; });
  // gai ngoài (ra phía x âm) + gai trong ở mốc n≥3
  s += `<path d="M-8 25L-16 25L-8 28Z M-8 75L-16 75L-8 72Z" fill="${T.gold3}" stroke="${T.dark}" stroke-width="0.5"/>`;
  if (c.n >= 3) s += `<path d="M8 25L15 25L8 28Z M8 75L15 75L8 72Z" fill="${T.gold3}" stroke="${T.dark}" stroke-width="0.5"/>`;
  s += bead(50, 0);
  if (c.n >= 1) s += bead(25, 1).replace(/r="5.4"/, 'r="3.6"').replace(/r="3"/, 'r="1.8"').replace(/r="0.9"/g, 'r="0.6"'); // hạt nhỏ nguyên tố ở 25/75 không đè gai
  return round2(s);
}
module.exports = { sideUnit };
