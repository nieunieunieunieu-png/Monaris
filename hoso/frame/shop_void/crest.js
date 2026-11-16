// ===== hoso/frame/shop_void/crest.js — ĐỈNH THẺ: hố đen hút mảnh vỡ thiên thể =====
// Hình học: gốc giữa cạnh trên; x ∈ [-60, 60], y ∈ [1, 36]; hố đen tâm (0,17) r7.2, đĩa bồi tụ rx20 ry5.5 nghiêng -12°; tảng đá chân chạm y=36.
const T = require('./colors').TIERS[0];
const P = 'shop_void-crest-';
const n = (v) => Number(v.toFixed(1));
const rk = (x, y, s) => `M${x} ${n(y - s)}L${n(x + s * 0.9)} ${n(y - s * 0.2)}L${n(x + s * 0.4)} ${n(y + s * 0.9)}L${n(x - s * 0.8)} ${n(y + s * 0.5)}Z`;
function crestTop(_tier, W, H) {
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${T.cyan}"/><stop offset="0.5" stop-color="${T.light}"/><stop offset="1" stop-color="${T.main}"/></linearGradient><linearGradient id="${P}r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8D7BB5"/><stop offset="0.55" stop-color="${T.main}"/><stop offset="1" stop-color="${T.deep}"/></linearGradient></defs>`;
  const half = `<path d="M-60 8C-42 5 -26 12 -14 17M-58 26C-42 28 -26 24 -14 19M-52 17C-38 15 -26 16 -14 17.6" fill="none" stroke="${T.light}" stroke-width="1.1" stroke-opacity="0.5" stroke-linecap="round"/><path d="M-36 11C-28 12 -22 14 -14 17M-34 24C-28 23 -22 21 -14 18.4" fill="none" stroke="${T.cyan}" stroke-width="0.8" stroke-linecap="round"/>`
    + `<path d="${rk(-48, 6, 4) + rk(-36, 9, 3.4) + rk(-26, 12, 2.8) + rk(-50, 27, 3.2) + rk(-34, 27, 2.6) + rk(-24, 22, 2)}" fill="url(#${P}r)" stroke="${T.deep}" stroke-width="0.8" stroke-linejoin="round"/><circle cx="-56" cy="14" r="0.8" fill="${T.star}"/><circle cx="-42" cy="19" r="0.7" fill="${T.cyan}"/><circle cx="-30" cy="17" r="0.7" fill="${T.star}"/>`;
  const hole = `<circle cx="0" cy="17" r="12" fill="${T.main}" fill-opacity="0.25"/><path d="M-1.8 9L0 1L1.8 9Z" fill="${T.cyan}" fill-opacity="0.75"/><path d="M-1.8 25L0 31L1.8 25Z" fill="${T.cyan}" fill-opacity="0.75"/><ellipse cx="0" cy="17" rx="20" ry="5.5" transform="rotate(-12 0 17)" fill="none" stroke="url(#${P}g)" stroke-width="3.4"/><circle cx="0" cy="17" r="7.2" fill="#05000F" stroke="${T.light}" stroke-width="0.8" stroke-opacity="0.8"/><path d="M-20 17A20 5.5 0 0 0 20 17" transform="rotate(-12 0 17)" fill="none" stroke="url(#${P}g)" stroke-width="3.4"/>`;
  const rockBase = `<path d="M-18 36L-13 31L-5 33.4L0 30.4L6 33.4L13 31L18 36Z" fill="url(#${P}r)" stroke="${T.deep}" stroke-width="1" stroke-linejoin="round"/><path d="M-9 34.6L-4 33.2M6 34.4L11 33" stroke="${T.light}" stroke-width="0.5" stroke-opacity="0.8"/>`;
  return defs + half + `<g transform="scale(-1 1)">${half}</g>` + rockBase + hole;
}
module.exports = { crestTop };
