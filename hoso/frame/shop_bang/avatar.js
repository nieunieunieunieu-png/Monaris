// ===== hoso/frame/shop_bang/avatar.js — KHUNG AVATAR (màu cố định) =====
// Hình học: vành r 70..77; tinh thể nhọn tối đa r=84; lục giác tâm r=77; hơi lạnh vào trong tối thiểu r=65.
const T = require('./colors').TIERS[0];
const P = 'shop_bang-avatar-';
const n = (v) => Number(v.toFixed(2));
// điểm (x,y) cục bộ (y âm = hướng ra ngoài) xoay a độ quanh tâm
function rot(a, x, y) {
  const t = (a * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t);
  return `${n(x * c - y * s)} ${n(x * s + y * c)}`;
}
function arc(r, a0, a1) {
  const p = (a) => `${n(r * Math.cos(a))} ${n(r * Math.sin(a))}`;
  return `M${p(a0)} A${r} ${r} 0 0 1 ${p(a1)}`;
}
function avatarFrame(_tier, R = 70) {
  const k = Number((R / 70).toFixed(4));
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.5" stop-color="${T.main}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient></defs>`;
  const ring = `<path fill-rule="evenodd" fill="url(#${P}g)" d="M-77 0 A77 77 0 1 0 77 0 A77 77 0 1 0 -77 0 Z M-70 0 A70 70 0 1 0 70 0 A70 70 0 1 0 -70 0 Z"/><circle r="73.5" fill="none" stroke="${T.accent}" stroke-opacity="0.55" stroke-width="0.8"/>`;
  let shard = '', ridge = '', hex = '';
  for (let i = 0; i < 12; i++) {
    const a = i * 30, long = i % 3 === 0;
    const tip = long ? 84 : 81, w = long ? 4.2 : 3.4;
    shard += `M${rot(a, -w, -75)}L${rot(a, 0, -tip)}L${rot(a, w, -75)}L${rot(a, 0, -70)}Z`;
    ridge += `M${rot(a, 0, -tip + 1)}L${rot(a, 0, -72)}`;
    const b = a + 15;
    for (let j = 0; j < 6; j++) {
      const t = (Math.PI / 3) * j;
      hex += `${j ? 'L' : 'M'}${rot(b, 3.2 * Math.cos(t), -77 + 3.2 * Math.sin(t))}`;
    }
    hex += 'Z';
  }
  const shards = `<path d="${shard}" fill="${T.main}" stroke="${T.dark}" stroke-width="0.6" stroke-linejoin="round"/><path d="${ridge}" stroke="${T.accent}" stroke-opacity="0.8" stroke-width="0.7"/><path d="${hex}" fill="${T.light}" stroke="${T.dark}" stroke-width="0.6"/>`;
  const mist = `<path d="${arc(67.5, 0.2, 1.1)}${arc(67.5, 3.6, 4.4)}" fill="none" stroke="${T.accent}" stroke-opacity="0.45" stroke-width="1.6" stroke-linecap="round"/><path d="${arc(65.5, 2, 2.7)}${arc(65.5, 5, 5.9)}" fill="none" stroke="${T.accent}" stroke-opacity="0.3" stroke-width="2.4" stroke-linecap="round"/>`;
  return `${defs}<g transform="scale(${k})">${ring}${shards}${mist}</g>`;
}
module.exports = { avatarFrame };
