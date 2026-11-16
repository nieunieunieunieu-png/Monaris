// ===== hoso/frame/shop_mech/bottom.js — CẠNH DƯỚI: dãy động cơ xả khí, lửa cam =====
// Hình học: gốc giữa mép dưới; y ∈ [-4, 12] (cao 16), nửa rộng ≤ 70 (thanh chính 62 + 2 nắp cảnh báo), đối xứng quanh x=0 (hệ thống phóng ×1.5).
const T = require('./colors').TIERS[0];
const P = 'shop_mech-bottom-';
const n = (v) => Number(v.toFixed(1));
function decorBottom(_tier, W, H) {
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.5" stop-color="${T.plate}"/><stop offset="1" stop-color="${T.main}"/></linearGradient><linearGradient id="${P}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.yellow}"/><stop offset="0.5" stop-color="${T.accent}"/><stop offset="1" stop-color="${T.warn}"/></linearGradient></defs>`;
  const bar = `<path d="M-62 -4H62L58 1.6H-58Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="1" stroke-linejoin="round"/><path d="M-50 -2H-40M-34 -2H-24M24 -2H34M40 -2H50" stroke="${T.dark}" stroke-width="1.2" stroke-linecap="round"/><path d="M-6 -4H6L7 1.6H-7Z" fill="${T.main}" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/><circle cx="0" cy="-1.2" r="1.3" fill="${T.warn}" stroke="${T.dark}" stroke-width="0.5"/>`;
  const jet = (x, w, L) => {
    const a = n(x - w / 2); const b = n(x + w / 2);
    return `<path d="M${n(x - L * 0.0 - w / 2 + 0.8)} 4.6C${a} ${n(4.6 + L * 0.5)} ${n(x - 1)} ${n(4.6 + L * 0.8)} ${x} ${n(4.6 + L)}C${n(x + 1)} ${n(4.6 + L * 0.8)} ${b} ${n(4.6 + L * 0.5)} ${n(b - 0.8)} 4.6Z" fill="url(#${P}f)" stroke="${T.warn}" stroke-width="0.4"/><path d="M${n(x - w * 0.25)} 4.8C${n(x - w * 0.3)} ${n(4.6 + L * 0.4)} ${n(x - 0.4)} ${n(4.6 + L * 0.6)} ${x} ${n(4.6 + L * 0.7)}C${n(x + 0.4)} ${n(4.6 + L * 0.6)} ${n(x + w * 0.3)} ${n(4.6 + L * 0.4)} ${n(x + w * 0.25)} 4.8Z" fill="#FFFFFF" fill-opacity="0.85"/>`
      + `<path d="M${a} 1.6L${n(a - 1)} 4.6H${n(b + 1)}L${b} 1.6Z" fill="${T.main}" stroke="${T.dark}" stroke-width="0.7" stroke-linejoin="round"/><path d="M${n(a + 1)} 3H${n(b - 1)}" stroke="${T.light}" stroke-width="0.5" stroke-opacity="0.8"/>`;
  };
  const cap = `<path d="M-70 -4H-62L-58 1.6H-66Z" fill="${T.main}" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/><path d="M-67 -2.2L-63 -2.2" stroke="${T.yellow}" stroke-width="1.2" stroke-dasharray="1.6 1.2"/><circle cx="-62" cy="-0.6" r="1" fill="${T.warn}"/>`;
  const caps = cap + `<g transform="scale(-1 1)">${cap}</g>`;
  let jets = '';
  [[10, 8, 7.4], [28, 6.6, 6], [46, 5.2, 4.6]].forEach(([x, w, L]) => { jets += jet(x, w, L) + jet(-x, w, L); });
  return defs + jets + bar + caps;
}
module.exports = { decorBottom };
