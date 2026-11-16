// ===== hoso/frame/shop_hancung/bottom.js — CẠNH DƯỚI: sen ngọc bích đỡ chân =====
// Hình học: gốc giữa mép dưới; y ∈ [-4, 12] (cao 16), nửa rộng ≤ 66, đối xứng quanh x=0 (hệ thống phóng ×1.5).
const T = require('./colors').TIERS[0];
const P = 'shop_hancung-bottom-';
function decorBottom(_tier, W, H) {
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.45" stop-color="${T.jade}"/><stop offset="1" stop-color="${T.jadeDark}"/></linearGradient><linearGradient id="${P}d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.5" stop-color="${T.main}"/><stop offset="1" stop-color="#8F6B12"/></linearGradient></defs>`;
  const r2 = (v) => Number(v.toFixed(2));
  const petal = (ang, len, w, tx = 0) => `<g transform="translate(${tx} 11) rotate(${ang})"><path d="M0 0C${-w} ${r2(-len * 0.35)} ${r2(-w * 0.6)} ${r2(-len * 0.8)} 0 ${-len}C${r2(w * 0.6)} ${r2(-len * 0.8)} ${w} ${r2(-len * 0.35)} 0 0Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.7" stroke-linejoin="round"/><path d="M0 -1.5V${r2(-len * 0.7)}" stroke="${T.light}" stroke-width="0.5" stroke-opacity="0.7"/></g>`;
  const leaf = (s) => `<g transform="scale(${s} 1)"><path d="M-8 10.5C-20 5 -40 6 -62 10.5C-40 13.5 -20 13.5 -8 10.5Z" fill="url(#${P}g)" stroke="${T.main}" stroke-width="1" stroke-linejoin="round"/><path d="M-12 10.5C-26 8.6 -42 9 -56 10.4" fill="none" stroke="${T.light}" stroke-width="0.5" stroke-opacity="0.7"/><path d="M-64 10.5L-60.4 8.4L-57 10.5L-60.4 12.6Z" fill="${T.main}" stroke="${T.dark}" stroke-width="0.6" stroke-linejoin="round"/></g>`;
  const bud = (s) => `<g transform="scale(${s} 1)">${petal(-14, 8, 3.2, -38)}${petal(14, 8, 3.2, -38)}${petal(0, 10, 3.4, -38)}<circle cx="-38" cy="11.2" r="1.3" fill="${T.main}" stroke="${T.dark}" stroke-width="0.5"/></g>`;
  const base = `<path d="M-64 11.2H64" stroke="${T.dark}" stroke-width="2.6" stroke-linecap="round"/><path d="M-64 11.2H64" stroke="url(#${P}d)" stroke-width="1.4" stroke-linecap="round"/>`;
  const lotus = petal(-68, 9, 3.8) + petal(68, 9, 3.8) + petal(-38, 12.5, 4.6) + petal(38, 12.5, 4.6) + petal(0, 15, 5.2)
    + `<circle cx="0" cy="3" r="1.9" fill="${T.main}" stroke="${T.dark}" stroke-width="0.6"/><circle cx="0" cy="3" r="0.8" fill="${T.silk}"/><path d="M-5 11.4Q0 8.4 5 11.4Z" fill="url(#${P}d)" stroke="${T.dark}" stroke-width="0.6" stroke-linejoin="round"/>`;
  return defs + leaf(1) + leaf(-1) + bud(1) + bud(-1) + base + lotus;
}
module.exports = { decorBottom };
