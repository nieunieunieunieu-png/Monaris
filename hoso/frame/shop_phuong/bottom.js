// ===== hoso/frame/shop_phuong/bottom.js — CẠNH DƯỚI: bệ lửa thiêng, lưỡi lửa bùng + lông phượng toả hai bên + tàn lửa =====
// Hình học: gốc giữa mép dưới; y ∈ [-4, 12] (cao 16), nửa rộng ≤ 70, đối xứng quanh x=0 (hệ thống phóng ×1.5).
const T = require('./colors').TIERS[0];
const P = 'shop_phuong-bottom-';
const n = (v) => Number(v.toFixed(1));
function decorBottom(_tier, W, H) {
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${T.dark}"/><stop offset="0.6" stop-color="${T.main}"/><stop offset="1" stop-color="${T.accent}"/></linearGradient></defs>`;
  const altar = `<path d="M-46 12L-40 5H40L46 12Z" fill="${T.dark}" stroke="${T.accent}" stroke-width="1" stroke-linejoin="round"/><path d="M-32 8.4H32" stroke="${T.accent}" stroke-width="0.8"/><path d="M-6 12L-3 8.4H3L6 12Z" fill="${T.main}" stroke="${T.accent}" stroke-width="0.6"/>`;
  // lưỡi lửa (x, cao, rộng, nghiêng ra ngoài)
  const tongue = (x, h, w, lean) => `M${n(x - w)} 5.6Q${n(x - w * 0.5)} ${n(5.6 - h * 0.5)} ${n(x + lean)} ${n(5.6 - h)}Q${n(x + w * 0.6)} ${n(5.6 - h * 0.4)} ${n(x + w)} 5.6Z`;
  let half = '';
  [[8, 11, 4.2, -1], [17, 9, 3.6, 1], [26, 7, 3.2, 2], [34, 5, 2.8, 2]].forEach(([x, h, w, l]) => { half += tongue(x, h, w, l); });
  const flames = `<path d="${half}" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.5" stroke-linejoin="round"/><g transform="scale(-1 1)"><path d="${half}" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.5" stroke-linejoin="round"/></g><path d="${tongue(0, 14, 5.4, 0)}" fill="${T.main}" stroke="${T.dark}" stroke-width="0.6" stroke-linejoin="round"/><path d="${tongue(0, 9.5, 2.6, 0)}" fill="${T.accent}"/><path d="${tongue(0, 5, 1.2, 0)}" fill="${T.light}"/>`;
  // lông phượng toả ngang 2 bên bệ (3 chiếc, nửa phải lật gương)
  const fe = (a, L) => `<g transform="translate(44 9) rotate(${a})"><path d="M0 0Q${n(L * 0.4)} -3.2 ${L} 0Q${n(L * 0.4)} 3.2 0 0Z"/></g>`;
  const feathers = fe(-18, 24) + fe(-6, 26) + fe(8, 20);
  const wingR = `<g fill="${T.main}" stroke="${T.dark}" stroke-width="0.6" stroke-linejoin="round">${feathers}</g>`;
  const embers = `<circle cx="-52" cy="-1" r="1" fill="${T.light}"/><circle cx="-60" cy="2" r="0.9" fill="${T.accent}"/><circle cx="-66" cy="-2" r="0.8" fill="${T.ember}"/><circle cx="52" cy="-1" r="1" fill="${T.light}"/><circle cx="60" cy="2" r="0.9" fill="${T.accent}"/><circle cx="66" cy="-2" r="0.8" fill="${T.ember}"/><circle cx="-14" cy="-6" r="0.7" fill="${T.accent}"/><circle cx="16" cy="-6" r="0.7" fill="${T.ember}"/>`;
  return defs + wingR + `<g transform="scale(-1 1)">${wingR}</g>` + altar + flames + embers;
}
module.exports = { decorBottom };
