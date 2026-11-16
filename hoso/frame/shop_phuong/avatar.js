// ===== hoso/frame/shop_phuong/avatar.js — KHUNG AVATAR: đôi cánh lửa 3 lớp ôm vòng + vương miện lửa + vầng nhiệt =====
// Hình học: vành r 70..77; lông cánh ôm cung r 71.5..83.8; vương miện lửa 7 lưỡi đỉnh tối đa r=84; đuôi lửa dưới đáy r ≤ 84; vầng nhiệt/đốm than trong r ≥ 64.
const T = require('./colors').TIERS[0];
const P = 'shop_phuong-avatar-';
const n = (v) => Number(v.toFixed(2));
const pol = (r, deg) => { const t = (deg * Math.PI) / 180; return `${n(r * Math.cos(t))} ${n(r * Math.sin(t))}`; };
function avatarFrame(_tier, R = 70) {
  const k = Number((R / 70).toFixed(4));
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${T.dark}"/><stop offset="0.5" stop-color="${T.main}"/><stop offset="1" stop-color="${T.accent}"/></linearGradient><radialGradient id="${P}h" cx="0" cy="0" r="70" gradientUnits="userSpaceOnUse"><stop offset="0.9" stop-color="${T.ember}" stop-opacity="0"/><stop offset="1" stop-color="${T.accent}" stop-opacity="0.55"/></radialGradient></defs>`;
  const heatDisc = `<circle r="70" fill="url(#${P}h)"/>`;
  const ring = `<path fill-rule="evenodd" fill="url(#${P}g)" d="M-77 0 A77 77 0 1 0 77 0 A77 77 0 1 0 -77 0 Z M-70 0 A70 70 0 1 0 70 0 A70 70 0 1 0 -70 0 Z"/><circle r="73.5" fill="none" stroke="${T.light}" stroke-opacity="0.65" stroke-width="0.8"/><circle r="77" fill="none" stroke="${T.dark}" stroke-width="0.7"/>`;
  // cánh trái: 8 lông × 3 lớp, ôm cung từ đáy (100°) lên đỉnh (≈262°)
  let back = '', mid = '', front = '', hi = '';
  for (let i = 0; i < 8; i++) {
    const a = 100 + i * 20, e = a + 36;
    back += `M${pol(71.5, a - 2)}Q${pol(86, a + 9)} ${pol(83.8, e)}Q${pol(78.5, a + 22)} ${pol(71.5, a + 15)}Z`;
    mid += `M${pol(72, a + 1)}Q${pol(83, a + 10)} ${pol(81.5, e - 3)}Q${pol(77, a + 20)} ${pol(72, a + 14)}Z`;
    front += `M${pol(72.5, a + 4)}Q${pol(79.5, a + 11)} ${pol(79, e - 8)}Q${pol(76, a + 18)} ${pol(72.5, a + 13)}Z`;
    hi += `M${pol(73.5, a + 6)}Q${pol(79, a + 13)} ${pol(79.5, e - 10)}`;
  }
  const wing = `<path d="${back}" fill="${T.dark}" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/><path d="${mid}" fill="${T.main}" stroke="${T.ember}" stroke-width="0.5" stroke-linejoin="round"/><path d="${front}" fill="${T.accent}"/><path d="${hi}" fill="none" stroke="${T.light}" stroke-width="0.6" stroke-linecap="round"/>`;
  // vương miện lửa: 7 lưỡi, đỉnh ≤ r=84
  let fl = '', core = '';
  [[-24, 77], [-16, 80], [-8, 82.5], [0, 84], [8, 82.5], [16, 80], [24, 77]].forEach(([d, tip]) => {
    const a = 270 + d, w = 3.6;
    fl += `M${pol(75, a - w * 1.1)}Q${pol(tip - 4, a - w * 0.6)} ${pol(tip, a)}Q${pol(tip - 4, a + w * 0.6)} ${pol(75, a + w * 1.1)}Z`;
    core += `M${pol(75.5, a - w * 0.5)}Q${pol(tip - 6, a)} ${pol(tip - 3, a)}Q${pol(tip - 6, a)} ${pol(75.5, a + w * 0.5)}Z`;
  });
  const flame = `<path d="${fl}" fill="${T.ember}" stroke="${T.dark}" stroke-width="0.6" stroke-linejoin="round"/><path d="${core}" fill="${T.light}"/>`;
  // đuôi lửa dưới đáy: 3 lưỡi hướng xuống (giữa dài nhất)
  let tail = '';
  [[-11, 80], [0, 84], [11, 80]].forEach(([d, tip]) => {
    const a = 90 + d, w = 4;
    tail += `M${pol(75, a - w)}Q${pol(tip - 3, a - w * 0.5)} ${pol(tip, a)}Q${pol(tip - 3, a + w * 0.5)} ${pol(75, a + w)}Z`;
  });
  const tails = `<path d="${tail}" fill="${T.main}" stroke="${T.dark}" stroke-width="0.6" stroke-linejoin="round"/>`;
  // ngọc lửa đỉnh + vệt nóng + đốm than (r ≥ 64)
  const gem = `<circle cx="0" cy="-73.5" r="2.6" fill="${T.light}" stroke="${T.dark}" stroke-width="0.7"/><circle cx="-0.6" cy="-74.1" r="0.8" fill="#FFFFFF"/>`;
  let em = '';
  [[40, 66], [95, 66.5], [150, 66], [205, 66.5], [330, 66], [20, 80.5], [160, 80], [300, 65]].forEach(([d, r], i) => { const [x, y] = pol(r, d).split(' '); em += `<circle cx="${x}" cy="${y}" r="${i % 2 ? 1 : 1.4}" fill="${i % 2 ? T.light : T.ember}"/>`; });
  const heat = `<path d="M${pol(66.5, 300)}A66.5 66.5 0 0 1 ${pol(66.5, 345)}M${pol(66.5, 115)}A66.5 66.5 0 0 1 ${pol(66.5, 140)}M${pol(66.5, 195)}A66.5 66.5 0 0 1 ${pol(66.5, 225)}" fill="none" stroke="${T.accent}" stroke-opacity="0.6" stroke-width="1.8" stroke-linecap="round"/>`;
  return `${defs}<g transform="scale(${k})">${heatDisc}${wing}<g transform="scale(-1 1)">${wing}</g>${tails}${ring}${flame}${gem}${heat}${em}</g>`;
}
module.exports = { avatarFrame };
