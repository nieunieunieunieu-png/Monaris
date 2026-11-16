// ===== hoso/frame/shop_cyber/crest.js — ĐỈNH THẺ: bánh răng vi mạch + hologram =====
// Hình học: gốc giữa cạnh trên; x ∈ [-60, 60], y ∈ [5, 36]; bánh răng tâm (0,17) r12.5; bệ + chùm hologram chạm y=36.
const T = require('./colors').TIERS[0];
const P = 'shop_cyber-crest-';
const n = (v) => Number(v.toFixed(1));
const pol = (r, deg) => { const t = (deg * Math.PI) / 180; return `${n(r * Math.cos(t))} ${n(17 + r * Math.sin(t))}`; };
function crestTop(_tier, W, H) {
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4C6372"/><stop offset="0.5" stop-color="${T.steel}"/><stop offset="1" stop-color="${T.bg}"/></linearGradient><linearGradient id="${P}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.main}" stop-opacity="0.05"/><stop offset="1" stop-color="${T.main}" stop-opacity="0.4"/></linearGradient></defs>`;
  const half = `<path d="M-12 17H-28L-36 25H-58M-12 21H-22L-28 27H-42M-12 13H-22L-30 7H-52" fill="none" stroke="${T.bg}" stroke-width="3" stroke-linejoin="miter"/><path d="M-12 17H-28L-36 25H-58M-12 21H-22L-28 27H-42M-12 13H-22L-30 7H-52" fill="none" stroke="${T.main}" stroke-width="1.1" stroke-linejoin="miter"/><circle cx="-58" cy="25" r="2" fill="${T.pink}" stroke="${T.bg}" stroke-width="0.6"/><circle cx="-52" cy="7" r="1.8" fill="${T.main}" stroke="${T.bg}" stroke-width="0.6"/><rect x="-44.6" y="25.6" width="2.8" height="2.8" fill="${T.bg}" stroke="${T.main}" stroke-width="0.7"/><path d="M-18 33H-56" stroke="${T.main}" stroke-width="0.7" stroke-opacity="0.7" stroke-dasharray="4 3"/>`;
  const beam = `<path d="M-15 36L-4 24H4L15 36Z" fill="url(#${P}h)" stroke="${T.main}" stroke-width="0.6" stroke-opacity="0.8" stroke-linejoin="miter"/><path d="M-8 36L-2 26M8 36L2 26" stroke="${T.light}" stroke-width="0.5" stroke-opacity="0.8"/>`;
  let g = '';
  for (let i = 0; i < 10; i++) { const a = i * 36; g += `${i ? 'L' : 'M'}${pol(10, a - 9)}L${pol(12.5, a - 6)}L${pol(12.5, a + 6)}L${pol(10, a + 9)}`; }
  const gear = `<path d="${g}Z" fill="url(#${P}g)" stroke="${T.main}" stroke-width="1" stroke-linejoin="miter"/><circle cx="0" cy="17" r="6.6" fill="${T.bg}" stroke="${T.main}" stroke-width="0.9"/><rect x="-3.2" y="13.8" width="6.4" height="6.4" fill="${T.dark}" stroke="${T.light}" stroke-width="0.7"/><rect x="-1.2" y="15.8" width="2.4" height="2.4" fill="${T.pink}"/><path d="M-3.2 15.4H-5M-3.2 18.6H-5M3.2 15.4H5M3.2 18.6H5M-1.6 13.8V12M1.6 13.8V12M-1.6 20.2V22M1.6 20.2V22" stroke="${T.main}" stroke-width="0.7"/>`;
  const base = `<path d="M-24 36L-18 31.5H18L24 36Z" fill="url(#${P}g)" stroke="${T.main}" stroke-width="1" stroke-linejoin="miter"/><path d="M-14 34H14" stroke="${T.main}" stroke-width="1"/>`;
  return defs + half + `<g transform="scale(-1 1)">${half}</g>` + beam + base + gear;
}
module.exports = { crestTop };
