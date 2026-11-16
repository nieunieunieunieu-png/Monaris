// ===== hoso/frame/shop_loidien/avatar.js — KHUNG AVATAR: vành tím + 8 tia sét toả ngắn + 8 điểm điện =====
// Hình học: vành r70..76, viền điện r77.5; tia sét r76..84; vạch xanh phía trong r64..68.
const T = require('./colors').TIERS[0];
const P = 'shop_loidien-avatar-';
const n = (v) => Number(v.toFixed(2));
function avatarFrame(_tier, R = 70) {
  const k = n(R / 70);
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.45" stop-color="${T.main}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient><linearGradient id="${P}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.bolt}"/><stop offset="1" stop-color="${T.accent}"/></linearGradient><path id="${P}t" d="M2 -75.5L-3 -79.5L0.5 -80L-2.5 -84L4 -78.5L0.5 -78.2Z" fill="url(#${P}b)"/></defs>`;
  const ring = `<path fill-rule="evenodd" fill="url(#${P}g)" d="M-76 0 A76 76 0 1 0 76 0 A76 76 0 1 0 -76 0 Z M-70 0 A70 70 0 1 0 70 0 A70 70 0 1 0 -70 0 Z"/><circle r="77.5" fill="none" stroke="${T.accent}" stroke-width="1.2" opacity="0.85"/>`;
  let bolts = '', nodes = '', ticks = '';
  for (let i = 0; i < 8; i++) {
    bolts += `<use href="#${P}t" transform="rotate(${n(22.5 + i * 45)})"/>`;
    nodes += `<circle cy="-77.5" r="2" fill="${T.bolt}" transform="rotate(${n(i * 45)})"/>`;
    ticks += `<path d="M0 -64V-68" stroke="${T.accent}" stroke-width="1.6" stroke-linecap="round" opacity="0.75" transform="rotate(${n(22.5 + i * 45)})"/>`;
  }
  return `${defs}<g transform="scale(${k})">${ring}${bolts}${nodes}${ticks}</g>`;
}
module.exports = { avatarFrame };
