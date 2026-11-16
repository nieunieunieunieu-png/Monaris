// ===== hoso/frame/shop_mech/avatar.js — KHUNG AVATAR: vòng bánh răng giáp tấm + 4 càng kẹp thuỷ lực + lõi năng lượng cam + đèn cảnh báo =====
// Hình học: vành r 70..77; răng 24 chiếc r 77..82.5; 8 khe ghép tấm r 70..77; càng kẹp r 76..83.5 (4 góc chéo); lõi cam r 66..70 (≥64); đèn r 73.5.
const T = require('./colors').TIERS[0];
const P = 'shop_mech-avatar-';
const n = (v) => Number(v.toFixed(2));
const pol = (r, deg) => { const t = (deg * Math.PI) / 180; return `${n(r * Math.cos(t))} ${n(r * Math.sin(t))}`; };
function avatarFrame(_tier, R = 70) {
  const k = Number((R / 70).toFixed(4));
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.45" stop-color="${T.plate}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient><linearGradient id="${P}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.yellow}"/><stop offset="1" stop-color="${T.accent}"/></linearGradient></defs>`;
  let g = '';
  for (let i = 0; i < 24; i++) { const a = i * 15; g += `${i ? 'L' : 'M'}${pol(77, a - 4)}L${pol(82.5, a - 2.2)}L${pol(82.5, a + 2.2)}L${pol(77, a + 4)}`; }
  const gear = `<path fill-rule="evenodd" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round" d="${g}Z M-70 0A70 70 0 1 0 70 0A70 70 0 1 0 -70 0Z"/><circle r="73.5" fill="none" stroke="${T.dark}" stroke-width="0.9" stroke-opacity="0.8"/><circle r="70.6" fill="none" stroke="${T.light}" stroke-width="0.7" stroke-opacity="0.8"/>`;
  // lõi năng lượng cam bên trong mép ảnh (r 66..70) + vệt sáng
  const core = `<circle r="68" fill="none" stroke="${T.accent}" stroke-opacity="0.5" stroke-width="3.2"/><circle r="68" fill="none" stroke="${T.yellow}" stroke-opacity="0.7" stroke-width="0.9" stroke-dasharray="14 5 3 5"/>`;
  // khe ghép 8 tấm giáp + 2 đinh tán mỗi tấm
  let seam = '', rv = '';
  for (let i = 0; i < 8; i++) {
    const a = 22.5 + i * 45;
    seam += `M${pol(70.4, a)}L${pol(77, a)}`;
    [a + 9, a + 36].forEach((b) => { const p = pol(73.5, b).split(' '); rv += `<circle cx="${p[0]}" cy="${p[1]}" r="1.15" fill="${T.main}" stroke="${T.dark}" stroke-width="0.5"/>`; });
  }
  const seams = `<path d="${seam}" stroke="${T.dark}" stroke-width="1.1" stroke-linecap="butt"/>`;
  // 4 càng kẹp thuỷ lực ở góc chéo, lõi cam
  let claw = '';
  [45, 135, 225, 315].forEach((a) => { claw += `<g transform="rotate(${a})"><path d="M75.5 -7.5L80.5 -5.6H83.5V5.6H80.5L75.5 7.5Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.9" stroke-linejoin="round"/><rect x="78.8" y="-1.9" width="3.8" height="3.8" rx="0.8" fill="url(#${P}c)" stroke="${T.dark}" stroke-width="0.5"/><path d="M76.6 -5.6H79.4" stroke="${T.light}" stroke-width="0.6"/></g>`; });
  const lamp = (a, c) => { const p = pol(73.5, a).split(' '); return `<circle cx="${p[0]}" cy="${p[1]}" r="3.8" fill="${c}" fill-opacity="0.3"/><circle cx="${p[0]}" cy="${p[1]}" r="2.2" fill="${c}" stroke="${T.dark}" stroke-width="0.7"/><circle cx="${n(Number(p[0]) - 0.6)}" cy="${n(Number(p[1]) - 0.6)}" r="0.6" fill="#FFFFFF"/>`; };
  const lamps = lamp(90, T.warn) + lamp(270, T.warn) + lamp(0, T.yellow) + lamp(180, T.yellow);
  const hz = `<path d="M${pol(71.8, 110)}A71.8 71.8 0 0 1 ${pol(71.8, 160)}" fill="none" stroke="${T.dark}" stroke-width="2"/><path d="M${pol(71.8, 110)}A71.8 71.8 0 0 1 ${pol(71.8, 160)}" fill="none" stroke="${T.yellow}" stroke-width="2" stroke-dasharray="2.4 2.4"/><path d="M${pol(71.8, 20)}A71.8 71.8 0 0 1 ${pol(71.8, 70)}" fill="none" stroke="${T.dark}" stroke-width="2"/><path d="M${pol(71.8, 20)}A71.8 71.8 0 0 1 ${pol(71.8, 70)}" fill="none" stroke="${T.warn}" stroke-width="2" stroke-dasharray="2.4 2.4"/>`;
  return `${defs}<g transform="scale(${k})">${gear}${core}${seams}${hz}${rv}${claw}${lamps}</g>`;
}
module.exports = { avatarFrame };
