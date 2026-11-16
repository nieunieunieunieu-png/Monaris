// ===== hoso/frame/shop_sonha/motif.js — hoạ tiết riêng (NÂNG CẤP 18): Sơn Hà Họa Quyển — núi 3 tầng + mặt trời + tùng + mây + sóng nước + thuyền buồm + hoa đào =====
// Hình học (giữ hợp đồng): avatar mọi nét r ≤ 84; crest x ∈ [-80,80], y ≥ 0, chân chạm y=36; bottom y ∈ [-4,12], nửa rộng ≤ 70. corner/edge/side/accent giữ nguyên bản cũ.
const { TIERS } = require('./colors');
const T = TIERS[0];
const blossom = (x, y, r, T, h) => { let s = ''; for (let i = 0; i < 5; i += 1) s += h.petal(x, y, i * 72, r, r * 0.55, T.accent, T); return `${s}${h.dot(x, y, r * 0.22, T.gold)}`; };
const cloud = (x, y, s, T, h) => `<g ${h.tf(x, y, 0, s)}><circle cx="-3" cy="0" r="2.6" fill="${T.light}" stroke="${T.dark}" stroke-width="0.5"/><circle cx="0.5" cy="-1.5" r="3.4" fill="${T.light}" stroke="${T.dark}" stroke-width="0.5"/><circle cx="4" cy="0" r="2.6" fill="${T.light}" stroke="${T.dark}" stroke-width="0.5"/><rect x="-5" y="0.3" width="11" height="2.4" rx="1.2" fill="${T.light}"/></g>`;
const avatar = (T, P, h) => {
  const { radial, dot, n, polar } = h;
  const clouds = radial(8, 79.5, (x, y, th, i) => (i % 2 ? '' : `<g ${h.tf(x, y, th, 1)}>${cloud(0, 0, 0.95, T, h)}</g>`), 22.5);
  const blossoms = radial(4, 78.5, (x, y) => blossom(x, y, 4.2, T, h), 45);
  // 4 hoa nhỏ ở các hướng chính (r 79.5, ≤ 83.3) + cánh hoa rơi rải trong vành
  const small = radial(4, 79.6, (x, y) => blossom(x, y, 3.2, T, h), 0);
  const petals = radial(16, 71.6, (x, y, th, i) => dot(x, y, i % 2 ? 0.8 : 1.1, i % 2 ? T.accent : T.light, 0.85), 11.25);
  // vòng núi mảnh: 8 đỉnh núi nhỏ r 73..77 giữa các đám mây (xoay theo góc)
  const hills = radial(8, 75.2, (x, y, th) => `<path ${h.tf(x, y, th, 1)} d="M-4 1.2L-1.2 -2.4L0.6 -0.2L2 -1.6L4 1.2Z" fill="${T.main}" fill-opacity="0.85" stroke="${T.dark}" stroke-width="0.35" stroke-linejoin="round"/>`, 0);
  const gold = `<circle r="72.2" fill="none" stroke="${T.gold}" stroke-opacity="0.7" stroke-width="0.7"/>`;
  return `<circle r="66.8" fill="none" stroke="${T.accent}" stroke-opacity="0.55" stroke-width="1.4"/>${gold}${petals}${hills}${clouds}${blossoms}${small}`;
};
const crest = (T, P, h) => {
  const { mirror, dot } = h;
  const peak = (cx, top, w) => `<path d="M${cx - w} 36L${cx} ${top}L${cx + w} 36Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/><path d="M${cx - w * 0.28} ${top + (36 - top) * 0.28}L${cx} ${top}L${cx + w * 0.28} ${top + (36 - top) * 0.28}L${cx + 1} ${top + (36 - top) * 0.2}L${cx - 1} ${top + (36 - top) * 0.34}Z" fill="${T.light}"/>`;
  const sidecloud = `${cloud(46, 26, 1.3, T, h)}${cloud(62, 31, 0.9, T, h)}`;
  // dãy núi xa mờ 2 bên (x ±78) + tùng nhỏ ở ±70
  const far = `<path d="M-78 36L-70 27L-62 31L-54 22L-44 36Z" fill="${T.main}" fill-opacity="0.45" stroke="${T.dark}" stroke-opacity="0.5" stroke-width="0.5" stroke-linejoin="round"/>`;
  const pine = (x) => `<path d="M${x} 33V36" stroke="${T.dark}" stroke-width="0.9"/><path d="M${x - 3} 33L${x} 27L${x + 3} 33Z" fill="${T.main}" stroke="${T.dark}" stroke-width="0.5" stroke-linejoin="round"/><path d="M${x - 2.4} 29.6L${x} 24.4L${x + 2.4} 29.6Z" fill="${T.main}" stroke="${T.dark}" stroke-width="0.5" stroke-linejoin="round"/>`;
  // mặt trời đào + vòng vàng + tia nhẹ
  const sun = `<circle cx="0" cy="14" r="12" fill="${T.accent}" fill-opacity="0.25"/><circle cx="0" cy="15" r="9" fill="${T.accent}"/><circle cx="0" cy="15" r="9" fill="none" stroke="${T.gold}" stroke-width="0.8"/>`;
  const fall = `<path d="M3 36C2.4 30 3.4 26 2.6 22" fill="none" stroke="${T.light}" stroke-opacity="0.85" stroke-width="0.9" stroke-linecap="round"/>`;
  return `${mirror(far)}${far}${sun}${peak(-30, 20, 12)}${peak(30, 20, 12)}${peak(-17, 15, 13)}${peak(17, 15, 13)}${peak(0, 3, 13)}${fall}`
    + `<rect x="-24" y="33" width="48" height="3" rx="1.5" fill="${T.dark}"/>${sidecloud}${mirror(sidecloud)}${pine(-72)}${pine(72)}${dot(-6, 12, 0.9, T.light, 0.9)}${dot(-36, 12, 1, T.gold, 0.9)}${dot(36, 12, 1, T.gold, 0.9)}`;
};
const corner = (T, P, h) => {
  const branch = `<path d="M3 42C5 28 12 14 24 8C31 5 38 4 42 3" fill="none" stroke="${T.dark}" stroke-width="3.4" stroke-linecap="round"/><path d="M3 42C5 28 12 14 24 8C31 5 38 4 42 3" fill="none" stroke="${T.main}" stroke-width="2" stroke-linecap="round"/>`;
  return `${branch}${blossom(13, 18, 5.5, T, h)}${blossom(28, 8, 4.6, T, h)}${blossom(7, 33, 3.8, T, h)}${h.petal(20, 14, 130, 7, 2.6, T.main, T)}${h.petal(18, 28, 200, 6, 2.2, T.main, T)}`;
};
const edge = (T, P, h) => {
  let w = '';
  [[0, 6, 9], [0, 6, 6]].forEach(([cx, cy, r]) => { w += `<path d="M${cx - r} ${cy + 4}A${r} ${r} 0 0 1 ${cx + r} ${cy + 4}" fill="none" stroke="${T.main}" stroke-width="1.6" stroke-linecap="round"/>`; });
  return `${w}<path d="M-15 10A15 15 0 0 1 15 10" fill="none" stroke="${T.light}" stroke-opacity="0.8" stroke-width="0.9"/>${h.dot(0, 11, 1.8, T.accent)}${h.dot(-19, 12, 1.1, T.accent)}${h.dot(19, 12, 1.1, T.accent)}`;
};
const side = (T, P, h) => {
  const { petal, mirror } = h;
  let s = '';
  [33, 66].forEach((y) => {
    s += `<rect x="-4.2" y="${y - 1.6}" width="8.4" height="3.2" rx="1.2" fill="${T.dark}" stroke="${T.main}" stroke-width="0.6"/>`;
    s += petal(2, y, 60, 12, 3.4, T.main, T) + petal(-2, y, -60, 12, 3.4, T.main, T) + petal(2, y, 100, 8, 2.6, T.light, T) + petal(-2, y, -100, 8, 2.6, T.light, T);
  });
  return `${s}${blossom(0, 50, 6, T, h)}${h.dot(0, 12, 1.6, T.accent)}${h.dot(0, 88, 1.6, T.accent)}`;
};
const bottom = (T, P, h) => {
  const { mirror, dot } = h;
  const wave = `<path d="M18 11C26 5 34 5 42 11C48 15 56 15 62 9" fill="none" stroke="${T.main}" stroke-width="1.8" stroke-linecap="round"/><path d="M24 12C30 8 36 8 42 12" fill="none" stroke="${T.light}" stroke-opacity="0.8" stroke-width="0.9"/>`;
  const wave2 = `<path d="M30 8.4C36 5.8 42 6.4 46 8.6" fill="none" stroke="${T.light}" stroke-opacity="0.55" stroke-width="0.7" stroke-linecap="round"/><path d="M52 3.6C57 1.6 62 2.4 66 4.2" fill="none" stroke="${T.main}" stroke-opacity="0.7" stroke-width="1.1" stroke-linecap="round"/>`;
  // thuyền buồm nhỏ bên phải (x 44..56, y 0..11)
  const boat = `<path d="M44 9.4H56L53.6 11.6H46.4Z" fill="${T.dark}" stroke="${T.main}" stroke-width="0.5" stroke-linejoin="round"/><path d="M50 9.2V0.4" stroke="${T.dark}" stroke-width="0.7"/><path d="M50.6 1L55 8.4H50.6Z" fill="${T.light}" stroke="${T.dark}" stroke-width="0.4" stroke-linejoin="round"/>`;
  const bridge = `<path d="M-20 11V6A20 14 0 0 1 20 6V11Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/><path d="M-11 11V7A11 8 0 0 1 11 7V11Z" fill="${T.dark}" fill-opacity="0.75"/><path d="M-22 -4H22" stroke="${T.dark}" stroke-width="1.6"/><path d="M-22 -2.4H22" stroke="${T.light}" stroke-opacity="0.7" stroke-width="0.5"/>`;
  const petals = dot(-38, 2, 1, T.accent, 0.9) + dot(-44, 6, 0.8, T.accent, 0.85) + dot(-66, 8, 1.1, T.accent, 0.9) + dot(36, 3, 0.8, T.accent, 0.85);
  return `${wave}${mirror(wave)}${wave2}${mirror(wave2)}${boat}${bridge}${blossom(-26, 2, 3.6, T, h)}${blossom(26, 2, 3.6, T, h)}${petals}`;
};
const accent = (T, P, h) => `<circle cx="-11" cy="-11" r="10.5" fill="${T.main}" fill-opacity="0.18"/>${blossom(-11, -11, 8, T, h)}${blossom(-24, -5, 3.2, T, h)}${blossom(-5, -24, 3.2, T, h)}${h.dot(-22, -22, 1, T.light, 0.9)}`;
module.exports = { avatar, crest, corner, edge, side, bottom, accent };
