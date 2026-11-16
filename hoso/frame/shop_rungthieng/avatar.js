// ===== hoso/frame/shop_rungthieng/avatar.js — KHUNG AVATAR: vành vỏ cây + dây leo uốn + 9 lá + 3 nụ vàng =====
// Hình học: vành r70..77; dây leo r72..75; lá r75..83.5; nụ vàng r≤81; chấm sáng phía trong r=66 (≥64).
const T = require('./colors').TIERS[0];
const P = 'shop_rungthieng-avatar-';
const n = (v) => Number(v.toFixed(2));
function avatarFrame(_tier, R = 70) {
  const k = n(R / 70);
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.barkLight}"/><stop offset="0.5" stop-color="${T.bark}"/><stop offset="1" stop-color="#3B2412"/></linearGradient><linearGradient id="${P}l" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${T.dark}"/><stop offset="0.6" stop-color="${T.main}"/><stop offset="1" stop-color="${T.light}"/></linearGradient><path id="${P}f" d="M0 0C3 -3 3 -6.5 0 -8.5C-3 -6.5 -3 -3 0 0Z" fill="url(#${P}l)" stroke="${T.dark}" stroke-width="0.5"/></defs>`;
  const ring = `<path fill-rule="evenodd" fill="url(#${P}g)" d="M-77 0 A77 77 0 1 0 77 0 A77 77 0 1 0 -77 0 Z M-70 0 A70 70 0 1 0 70 0 A70 70 0 1 0 -70 0 Z"/>`;
  let d = '';
  for (let a = 0; a <= 360; a += 6) { const r = 73.5 + 1.5 * Math.sin((a * 10 * Math.PI) / 180); const x = r * Math.cos((a * Math.PI) / 180), y = r * Math.sin((a * Math.PI) / 180); d += (d ? 'L' : 'M') + `${n(x)} ${n(y)}`; }
  const vine = `<path d="${d}Z" fill="none" stroke="${T.main}" stroke-width="1.4" stroke-linejoin="round"/>`;
  let leaves = '', dots = '';
  for (let i = 0; i < 12; i++) {
    const a = i * 30;
    if (i % 4 === 0) leaves += `<circle cy="-78" r="3.2" fill="${T.gold}" stroke="${T.bark}" stroke-width="0.8" transform="rotate(${a})"/>`;
    else leaves += `<use href="#${P}f" transform="rotate(${a}) translate(0 -75.5) rotate(${i % 2 ? 35 : -35}) scale(0.85)"/>`;
    dots += `<circle cy="-66" r="1.4" fill="${T.light}" opacity="0.7" transform="rotate(${a + 15})"/>`;
  }
  return `${defs}<g transform="scale(${k})">${ring}${vine}${leaves}${dots}</g>`;
}
module.exports = { avatarFrame };
