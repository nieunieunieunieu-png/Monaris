// ===== hoso/frame/shop_ulam/crest.js — ĐỈNH THẺ: quả cầu tinh linh quấn dây leo sáng xanh =====
// Hình học: gốc giữa cạnh trên; x ∈ [-62, 62], y ∈ [0, 36]; quả cầu tâm (0,17) r11; chân gốc cây chạm y=36.
const T = require('./colors').TIERS[0];
const P = 'shop_ulam-crest-';
const n = (v) => Number(v.toFixed(1));
const lf = (x, y, a, len) => `<path d="M0 0Q${n(len * 0.4)} ${n(-len * 0.4)} ${len} 0Q${n(len * 0.4)} ${n(len * 0.4)} 0 0Z" transform="translate(${x} ${y}) rotate(${a})" fill="${T.main}" stroke="${T.dark}" stroke-width="0.6" stroke-linejoin="round"/>`;
function crestTop(_tier, W, H) {
  const defs = `<defs><radialGradient id="${P}o" cx="0.35" cy="0.3" r="0.9"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.35" stop-color="${T.firefly}"/><stop offset="0.7" stop-color="${T.main}"/><stop offset="1" stop-color="${T.dark}"/></radialGradient><linearGradient id="${P}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.wood}"/><stop offset="1" stop-color="${T.woodDark}"/></linearGradient></defs>`;
  const half = `<path d="M-16 31C-30 31 -44 27 -60 14" fill="none" stroke="${T.woodDark}" stroke-width="3" stroke-linecap="round"/><path d="M-16 31C-30 31 -44 27 -60 14" fill="none" stroke="${T.wood}" stroke-width="1.6" stroke-linecap="round"/>${lf(-26, 30, -150, 9)}${lf(-26, 30, 25, 9)}${lf(-38, 28, -140, 9)}${lf(-38, 28, 35, 9)}${lf(-49, 23, -125, 8)}${lf(-49, 23, 55, 8)}${lf(-58, 15, -100, 7)}<circle cx="-60" cy="14" r="2" fill="${T.firefly}" stroke="${T.dark}" stroke-width="0.5"/><circle cx="-60" cy="14" r="4.6" fill="${T.firefly}" fill-opacity="0.22"/>`;
  const root = `<path d="M-30 36C-22 30 -12 31 0 31C12 31 22 30 30 36Z" fill="url(#${P}w)" stroke="${T.woodDark}" stroke-width="1" stroke-linejoin="round"/><path d="M-18 35C-14 32.6 -8 32.6 -4 33.4M6 33.4C10 32.6 16 32.8 20 35" fill="none" stroke="${T.light}" stroke-width="0.6" stroke-opacity="0.6"/>`;
  const orb = `<circle cx="0" cy="17" r="15" fill="${T.firefly}" fill-opacity="0.22"/><circle cx="0" cy="17" r="11" fill="url(#${P}o)" stroke="${T.dark}" stroke-width="0.9"/><path d="M-9 9C-14 16 -8 27 2 28M9 25C14 18 8 8 -1 6.6" fill="none" stroke="${T.dark}" stroke-width="2.4" stroke-linecap="round"/><path d="M-9 9C-14 16 -8 27 2 28M9 25C14 18 8 8 -1 6.6" fill="none" stroke="${T.main}" stroke-width="1.2" stroke-linecap="round"/><path d="M0 11L1.6 15.4L6 17L1.6 18.6L0 23L-1.6 18.6L-6 17L-1.6 15.4Z" fill="#FFFFFF" fill-opacity="0.9"/>`;
  const sprout = `<path d="M0 6C0 4 0 3 0 2" stroke="${T.main}" stroke-width="1.2" stroke-linecap="round"/>${lf(0, 3, -45, 7)}${lf(0, 3, -135, 7)}`;
  return defs + half + `<g transform="scale(-1 1)">${half}</g>` + root + orb + sprout;
}
module.exports = { crestTop };
