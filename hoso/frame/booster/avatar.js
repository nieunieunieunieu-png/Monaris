// ===== booster/avatar.js — KHUNG AVATAR: vành gradient hồng→tím, hào quang, tinh thể boost ở đỉnh + 6 mảnh tinh thể quanh vành =====
// Hình học: vành r 70..77; glow r 77..83; tinh thể đỉnh r 72..88 (đỉnh nhọn ở -88); mọi nét r ≤ 88.
const T = require('./colors').TIERS[0];
const P = 'booster-avatar-';
const n = (v) => Number(v.toFixed(2));
const pol = (r, deg) => { const t = (deg * Math.PI) / 180; return [n(r * Math.cos(t)), n(r * Math.sin(t))]; };
function avatarFrame(_tier, R = 70) {
  const k = Number((R / 70).toFixed(4));
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.4" stop-color="${T.main}"/><stop offset="0.8" stop-color="${T.violet}"/><stop offset="1" stop-color="${T.ice}"/></linearGradient></defs>`;
  const ring = `<path fill-rule="evenodd" fill="url(#${P}g)" d="M-77 0 A77 77 0 1 0 77 0 A77 77 0 1 0 -77 0 Z M-70 0 A70 70 0 1 0 70 0 A70 70 0 1 0 -70 0 Z"/><circle r="70.4" fill="none" stroke="#FFFFFF" stroke-opacity="0.7" stroke-width="0.8"/><circle r="77" fill="none" stroke="${T.dark}" stroke-opacity="0.6" stroke-width="0.7"/>`;
  const glow = `<circle r="79" fill="none" stroke="${T.main}" stroke-opacity="0.35" stroke-width="3"/><circle r="81.6" fill="none" stroke="${T.violet}" stroke-opacity="0.2" stroke-width="2"/><circle r="83.4" fill="none" stroke="${T.ice}" stroke-opacity="0.12" stroke-width="1.4"/>`;
  // mảnh tinh thể (thoi) quanh vành, bỏ vị trí đỉnh
  let shards = '';
  [30, 70, 110, 150, 210, 330].forEach((deg, i) => {
    const [x, y] = pol(73.5, deg);
    const big = i % 2 === 0;
    const a = big ? 5.2 : 3.6;
    shards += `<g transform="translate(${x} ${y}) rotate(${deg + 90})"><path d="M0 ${-a * 1.5}L${a * 0.8} 0L0 ${a * 1.5}L${-a * 0.8} 0Z" fill="${big ? `url(#${P}g)` : T.ice}" stroke="${T.light}" stroke-width="0.7" stroke-linejoin="round"/><path d="M0 ${-a * 1.5}L${a * 0.8} 0L0 0Z" fill="#FFFFFF" fill-opacity="0.4"/></g>`;
  });
  // tinh thể boost lớn ở đỉnh
  const crown = `<path d="M0 -88L8 -80L0 -71L-8 -80Z" fill="url(#${P}g)" stroke="${T.light}" stroke-width="0.9" stroke-linejoin="round"/><path d="M0 -88L8 -80L0 -80Z" fill="#FFFFFF" fill-opacity="0.45"/><path d="M-8 -80L8 -80M0 -88L0 -71" stroke="${T.light}" stroke-opacity="0.5" stroke-width="0.5"/>` +
    `<path d="M-16 -75L-12 -72.5L-16 -70L-20 -72.5Z M16 -75L20 -72.5L16 -70L12 -72.5Z" fill="${T.ice}" stroke="${T.light}" stroke-width="0.6"/>`;
  // lấp lánh + vệt sáng
  const [sx, sy] = pol(73.5, 318);
  const spark = `<path d="M${sx} ${sy - 5}L${sx + 1.4} ${sy - 1.4}L${sx + 5} ${sy}L${sx + 1.4} ${sy + 1.4}L${sx} ${sy + 5}L${sx - 1.4} ${sy + 1.4}L${sx - 5} ${sy}L${sx - 1.4} ${sy - 1.4}Z" fill="#FFFFFF"/>`;
  const [g1x, g1y] = pol(73.5, 195); const [g2x, g2y] = pol(73.5, 240);
  const gloss = `<path d="M${g1x} ${g1y}A73.5 73.5 0 0 1 ${g2x} ${g2y}" fill="none" stroke="#FFFFFF" stroke-opacity="0.85" stroke-width="1.8" stroke-linecap="round"/>`;
  return `${defs}<g transform="scale(${k})">${glow}${ring}${gloss}${shards}${crown}${spark}</g>`;
}
module.exports = { avatarFrame };
