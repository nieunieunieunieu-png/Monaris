// ===== hoso/frame/shop_mech/accents.js — ĐIỂM NHẤN GÓC: tia lửa điện ở khớp góc =====
// Hình học: 1 góc quanh (0,0) hướng lên trái, nằm trong x,y ∈ [-28, 0]; lật 4 góc bằng <use>.
const T = require('./colors').TIERS[0];
function corner() {
  const bolt = 'M-5 -5L-9 -8L-7.4 -9.2L-12 -13L-10.4 -14.4L-16 -19.5';
  const bolt2 = 'M-5 -5L-8 -9L-9.4 -7.4L-13 -12L-14.4 -10.4L-19.5 -16';
  return `<path d="M-2 -2H-17V-6.4H-6.4V-17H-2Z" fill="${T.plate}" stroke="${T.dark}" stroke-width="0.9" stroke-linejoin="round"/><path d="M-4.6 -4.6H-15M-4.6 -4.6V-15" fill="none" stroke="${T.light}" stroke-width="0.5" stroke-opacity="0.8"/>`
    + `<circle cx="-4.4" cy="-4.4" r="1.5" fill="${T.main}" stroke="${T.dark}" stroke-width="0.5"/>`
    + `<path d="${bolt}M${bolt2.slice(1)}" fill="none" stroke="${T.accent}" stroke-width="2.4" stroke-opacity="0.45" stroke-linecap="round" stroke-linejoin="round"/><path d="${bolt}M${bolt2.slice(1)}" fill="none" stroke="${T.yellow}" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/><path d="${bolt}" fill="none" stroke="#FFFFFF" stroke-width="0.4" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<circle cx="-16" cy="-19.5" r="1.2" fill="${T.yellow}"/><circle cx="-19.5" cy="-16" r="1.2" fill="${T.yellow}"/><circle cx="-23" cy="-21" r="0.8" fill="${T.accent}"/><circle cx="-21" cy="-23" r="0.8" fill="${T.accent}"/><circle cx="-12" cy="-4" r="0.7" fill="${T.accent}"/><circle cx="-4" cy="-12" r="0.7" fill="${T.accent}"/><circle cx="-24.6" cy="-13" r="0.6" fill="${T.yellow}"/><circle cx="-13" cy="-24.6" r="0.6" fill="${T.yellow}"/>`;
}
function accent(_tier, W, H) {
  const id = 'shop_mech-accent-c';
  const u = (tx, ty, sx, sy) => `<use href="#${id}" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
  return `<defs><g id="${id}">${corner()}</g></defs>` + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
}
module.exports = { accent };
