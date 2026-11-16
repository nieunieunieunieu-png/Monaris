// ===== hoso/frame/shop_haivuong/avatar.js — KHUNG AVATAR: vòng sóng cuộn, vỏ ngọc, 12 hạt ngọc trai, bọt biển, vầng nước trong =====
// Hình học: vành r 70..77; sóng nền r 74.5±1.2; ngọn sóng cuộn 12 chiếc r 76..83.5; vỏ sò ở 90° r 72..83.6; ngọc trai r 73.5; vầng nước trong r 66–69 (≥64); bọt r ≤ 83.
const T = require('./colors').TIERS[0];
const P = 'shop_haivuong-avatar-';
const n = (v) => Number(v.toFixed(2));
const rad = (d) => (d * Math.PI) / 180;
const pt = (r, a) => `${n(r * Math.cos(rad(a)))} ${n(r * Math.sin(rad(a)))}`;
function avatarFrame(_tier, R = 70) {
  const k = Number((R / 70).toFixed(4));
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.5" stop-color="${T.main}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient><linearGradient id="${P}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${T.goldDark}"/><stop offset="0.5" stop-color="${T.goldLight}"/><stop offset="1" stop-color="${T.gold}"/></linearGradient><radialGradient id="${P}p" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.5" stop-color="${T.pearl}"/><stop offset="1" stop-color="${T.light}"/></radialGradient>`
    + `<g id="${P}c"><path d="M76 -9C80 -9 83 -5 83 -1.4C83 1.6 80 2.6 79 0.6C78.4 -0.6 79.6 -1.6 80.4 -0.8" fill="none" stroke="${T.dark}" stroke-width="2.8" stroke-linecap="round"/><path d="M76 -9C80 -9 83 -5 83 -1.4C83 1.6 80 2.6 79 0.6C78.4 -0.6 79.6 -1.6 80.4 -0.8" fill="none" stroke="${T.foam}" stroke-width="1.5" stroke-linecap="round"/></g>`
    + `<g id="${P}h"><path d="M72 0L82.4 -8C84.4 -3 84.4 3 82.4 8Z" fill="url(#${P}s)" stroke="${T.goldDark}" stroke-width="0.8" stroke-linejoin="round"/><path d="M72 0L82.6 -4.8M72 0L83.4 0M72 0L82.6 4.8M72 0L81 -7M72 0L81 7" stroke="${T.goldDark}" stroke-width="0.6" stroke-opacity="0.8"/><circle cx="77.4" cy="0" r="2.6" fill="url(#${P}p)" stroke="${T.goldDark}" stroke-width="0.5"/></g></defs>`;
  const ring = `<path fill-rule="evenodd" fill="url(#${P}g)" d="M-77 0 A77 77 0 1 0 77 0 A77 77 0 1 0 -77 0 Z M-70 0 A70 70 0 1 0 70 0 A70 70 0 1 0 -70 0 Z"/><circle r="70.6" fill="none" stroke="${T.gold}" stroke-width="1"/><circle r="76.5" fill="none" stroke="${T.gold}" stroke-width="0.8" stroke-opacity="0.8"/>`;
  let w = '';
  for (let a = 0; a <= 360; a += 5) w += `${a ? 'L' : 'M'}${pt(74.5 + 1.2 * Math.sin(rad(a * 12)), a)}`;
  const wave = `<path d="${w}Z" fill="none" stroke="${T.foam}" stroke-width="0.8" stroke-opacity="0.8"/>`;
  let cu = '';
  [0, 30, 60, 120, 150, 180, 210, 240, 270, 300, 330].forEach((a) => { if (a === 210 || a === 330) return; cu += `<use href="#${P}c" transform="rotate(${a})"/>`; });
  const shells = `<use href="#${P}h" transform="rotate(90)"/><use href="#${P}h" transform="rotate(210) translate(72 0) scale(0.7) translate(-72 0)"/><use href="#${P}h" transform="rotate(330) translate(72 0) scale(0.7) translate(-72 0)"/>`;
  const bub = [[80.5, 20], [81, 48], [79.5, 140], [82, 168], [80, 190], [81.5, 252], [80, 283], [66.5, 70], [66.5, 235]].map((d, i) => { const c = pt(d[0], d[1]).split(' '); const r = i % 3 ? 1.1 : 1.7; return `<circle cx="${c[0]}" cy="${c[1]}" r="${r}" fill="${T.foam}" fill-opacity="0.25" stroke="${T.foam}" stroke-width="0.5"/><circle cx="${n(Number(c[0]) - r * 0.3)}" cy="${n(Number(c[1]) - r * 0.3)}" r="${n(r * 0.28)}" fill="#FFFFFF"/>`; }).join('');
  const pr = [15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345].map((a) => { const c = pt(73.5, a).split(' '); return `<circle cx="${c[0]}" cy="${c[1]}" r="1.5" fill="url(#${P}p)" stroke="${T.goldDark}" stroke-width="0.5"/>`; }).join('');
  const glow = `<circle r="67.6" fill="none" stroke="${T.foam}" stroke-opacity="0.35" stroke-width="3"/><circle r="66" fill="none" stroke="${T.light}" stroke-opacity="0.5" stroke-width="0.8"/>`;
  return `${defs}<g transform="scale(${k})">${glow}${ring}${wave}${pr}${cu}${shells}${bub}</g>`;
}
module.exports = { avatarFrame };
