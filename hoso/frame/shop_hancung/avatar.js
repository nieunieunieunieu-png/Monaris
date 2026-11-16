// ===== hoso/frame/shop_hancung/avatar.js — KHUNG AVATAR: vòng ngọc bích khắc rồng cuộn + dải lụa =====
// Hình học: vành ngọc r 70..77; rồng uốn sóng r 73.5±2.4; đầu rồng + sừng tối đa r=84; lụa r 70..80; viền vàng r 69..78.
const T = require('./colors').TIERS[0];
const P = 'shop_hancung-avatar-';
const n = (v) => Number(v.toFixed(2));
const pol = (r, deg) => { const t = (deg * Math.PI) / 180; return `${n(r * Math.cos(t))} ${n(r * Math.sin(t))}`; };
function wave(r0, amp, freq, a0, a1, ph) {
  let d = '';
  for (let a = a0; a <= a1; a += 5) d += `${d ? 'L' : 'M'}${pol(r0 + amp * Math.sin(((a - a0) * freq * Math.PI) / 180 + ph), a)}`;
  return d;
}
function avatarFrame(_tier, R = 70) {
  const k = Number((R / 70).toFixed(4));
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.5" stop-color="${T.jade}"/><stop offset="1" stop-color="${T.jadeDark}"/></linearGradient><linearGradient id="${P}d" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.5" stop-color="${T.main}"/><stop offset="1" stop-color="#8F6B12"/></linearGradient></defs>`;
  const ring = `<path fill-rule="evenodd" fill="url(#${P}g)" d="M-77 0 A77 77 0 1 0 77 0 A77 77 0 1 0 -77 0 Z M-70 0 A70 70 0 1 0 70 0 A70 70 0 1 0 -70 0 Z"/><circle r="70.6" fill="none" stroke="${T.main}" stroke-width="1.2"/><circle r="76.4" fill="none" stroke="${T.main}" stroke-width="1.2"/>`;
  // rồng cuộn: thân sóng vàng từ 295° quanh vòng đến 245° (chừa chỗ đầu), vảy là chấm
  const body = `<path d="${wave(73.5, 2.4, 9, 300, 600, 0)}" fill="none" stroke="${T.dark}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><path d="${wave(73.5, 2.4, 9, 300, 600, 0)}" fill="none" stroke="url(#${P}d)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  let sc = '';
  for (let a = 305; a < 600; a += 12) { const [x, y] = pol(73.5 + 2.4 * Math.sin(((a - 300) * 9 * Math.PI) / 180), a).split(' '); sc += `<circle cx="${x}" cy="${y}" r="0.55" fill="${T.dark}"/>`; }
  // đầu rồng ở đỉnh (270°): sừng, râu, mắt, ngọc
  const head = `<g transform="rotate(0)"><path d="M-9 -74C-9 -78 -4 -80 0 -80C4 -80 9 -78 9 -74C9 -71 5 -70 0 -70C-5 -70 -9 -71 -9 -74Z" fill="url(#${P}d)" stroke="${T.dark}" stroke-width="0.8"/><path d="M-4 -79L-8 -84L-2 -80.5M4 -79L8 -84L2 -80.5" fill="${T.main}" stroke="${T.dark}" stroke-width="0.7" stroke-linejoin="round"/><path d="M-9 -73C-14 -72 -17 -74 -19 -72M9 -73C14 -72 17 -74 19 -72" fill="none" stroke="${T.main}" stroke-width="1" stroke-linecap="round"/><circle cx="-3.4" cy="-75.5" r="1.2" fill="${T.dark}"/><circle cx="3.4" cy="-75.5" r="1.2" fill="${T.dark}"/><circle cx="0" cy="-71.6" r="1.7" fill="${T.jade}" stroke="${T.light}" stroke-width="0.5"/></g>`;
  // dải lụa đỏ quấn: r dao động 71..79, hai đoạn
  const silkP = wave(75, 3.4, 4, 40, 200, 0);
  const silk = `<path d="${silkP}" fill="none" stroke="${T.dark}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.9"/><path d="${silkP}" fill="none" stroke="${T.silk}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="${silkP}" fill="none" stroke="${T.light}" stroke-opacity="0.5" stroke-width="0.6" stroke-linecap="round" transform="translate(0.6 -0.6)"/><path d="M${pol(75, 200)}Q${pol(80, 205)} ${pol(83, 212)}M${pol(75, 40)}Q${pol(80, 36)} ${pol(83, 30)}" fill="none" stroke="${T.silk}" stroke-width="1.6" stroke-linecap="round"/>`;
  return `${defs}<g transform="scale(${k})">${ring}${body}${sc}${silk}${head}</g>`;
}
module.exports = { avatarFrame };
