// ===== hoso/frame/shop_thanlong/motif.js — hoạ tiết riêng: Cửu Thiên Thần Long — rồng vàng chầu ngọc + sấm xanh điện + lá lục bảo =====
// Hình học (giữ hợp đồng): avatar mọi nét r ≤ 84; crest x ∈ [-80,80], y ≥ 0, chân chạm y=36; bottom y ∈ [-4,12], nửa rộng ≤ 70; edge ≤ 22px vào trong.
const bolt = (T, d, w = 1.4) => `<path d="${d}" fill="none" stroke="${T.accent}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
const cloud = (T) => `<path d="M-9 0C-10 -4 -6 -6 -3.5 -3.5C-3 -8 4 -8 4.5 -3.5C7 -6 10 -3 9 0Z" fill="${T.light}" stroke="${T.main}" stroke-width="0.7"/><path d="M-1 -3.5C-1 -5.5 2 -5.5 2 -3.5C2 -2.3 0.2 -2.3 0.2 -3.4" fill="none" stroke="${T.main}" stroke-width="0.6"/>`;

const avatar = (T, P, h) => {
  const { radial, polar, spike, dot, petal } = h;
  let sc = '';
  for (let a = 0; a < 360; a += 15) { const [x1, y1] = polar(76.4, a - 6); const [cx, cy] = polar(72.4, a); const [x2, y2] = polar(76.4, a + 6); sc += `M${x1} ${y1}Q${cx} ${cy} ${x2} ${y2}`; }
  const scales = `<path d="${sc}" fill="none" stroke="${T.dark}" stroke-opacity="0.65" stroke-width="0.9"/>`;
  const spikes = radial(12, 80.2, (x, y, th) => spike(x, y, th, 3.7, 1.8, T.light, T), 15);
  const leaves = radial(6, 80.4, (x, y, th) => petal(x, y, th + 90, 3.6, 1.5, T.jade, T) + petal(x, y, th - 90, 3.6, 1.5, T.jade, T), 15 + 30);
  let zig = '';
  for (let i = 0; i < 6; i += 1) { const a = 15 + i * 60; const [x1, y1] = polar(68.4, a); const [x2, y2] = polar(65.6, a + 3); const [x3, y3] = polar(64.4, a - 2); zig += bolt(T, `M${x1} ${y1}L${x2} ${y2}L${x3} ${y3}`, 1.1); }
  const jd = radial(12, 66.5, (x, y) => dot(x, y, 1.1, T.jade, 0.9), 0);
  return `${scales}${spikes}${zig}${jd}<circle r="66.5" fill="none" stroke="${T.accent}" stroke-opacity="0.6" stroke-width="1.1"/>`;
};

const dragonSide = (T, P) => {
  const d = 'M-33 16C-43 24 -49 12 -58 19C-66 25 -65 31 -73 34';
  return `<path d="${d}" fill="none" stroke="${T.dark}" stroke-width="7.8" stroke-linecap="round"/><path d="${d}" fill="none" stroke="url(#${P}d)" stroke-width="5.8" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${T.dark}" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="0.1 4.2" opacity="0.7"/><path d="M-37 12L-41 6.5L-39 13ZM-47 11L-50 4.5L-49 12ZM-58 15L-60 9L-58 16Z" fill="${T.accent}" stroke="${T.dark}" stroke-width="0.5"/><g transform="translate(-32 14.5) scale(0.95)"><path d="M-2 -5C-8 -7 -9 -1 -14 -3C-10 0 -10 4 -5 4Z" fill="${T.accent}" stroke="${T.dark}" stroke-width="0.5"/><path d="M0 0C3 -5 11 -7 19 -4L26 -3.5L21 0L25 3C19 5.5 9 6.5 3 4Z" fill="url(#${P}d)" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/><path d="M5 -5C3 -12 -3 -15 -9 -13C-3 -10 0 -8 1 -4Z" fill="${T.jade}" stroke="${T.jadeDark}" stroke-width="0.6" stroke-linejoin="round"/><path d="M4 3L7 6M9 3.5L11 6.5M14 3.5L15.5 6" stroke="#FFF" stroke-width="0.8"/><circle cx="9" cy="-2" r="1.7" fill="${T.ruby}"/><circle cx="9.4" cy="-2.4" r="0.6" fill="#FFF"/><path d="M20 -3C28 -9 33 -6 38 -12M19 2C27 6 32 4 36 9" fill="none" stroke="${T.main}" stroke-width="1.4" stroke-linecap="round"/></g>`;
};
const crest = (T, P, h) => {
  const { gem, petal, star4 } = h;
  const defs = `<defs><linearGradient id="${P}d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE27A"/><stop offset="1" stop-color="${T.main}"/></linearGradient><radialGradient id="${P}a" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${T.accent}" stop-opacity="0.45"/><stop offset="1" stop-color="${T.accent}" stop-opacity="0"/></radialGradient></defs>`;
  const aura = `<ellipse cy="17" rx="30" ry="17" fill="url(#${P}a)"/>`;
  const base = `<path d="M-72 36C-72 29 -62 27 -58 31C-56 23 -44 23 -42 30C-40 21 -28 19 -24 27C-18 21 -8 23 -6 30L6 30C8 23 18 21 24 27C28 19 40 21 42 30C44 23 56 23 58 31C62 27 72 29 72 36Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="1"/>`;
  const dr = dragonSide(T, P);
  const sides = (s) => `<g transform="scale(${s} 1)">${dr}${bolt(T, 'M22 3L17 10L21 10L16 18', 1.5)}${bolt(T, 'M30 6L26 12L29 12L25 18', 1.1)}${petal(-62, 33, -75, 9, 2.6, T.jade, T)}</g>`;
  const pearl = `<circle cy="17" r="13" fill="none" stroke="${T.main}" stroke-width="1.5"/><circle cy="17" r="13" fill="none" stroke="${T.accent}" stroke-width="0.7" stroke-dasharray="2 3"/>${gem(0, 17, 9.5, T.ruby, T)}${star4(0, 3.5, 3, T.accent, 0.95)}`;
  return defs + aura + base + sides(1) + sides(-1) + pearl;
};
const corner = (T, P, h) => {
  const { gem, petal, star4, dot } = h;
  return `<path d="M14 31C12 23 20 17 27 21C31 25 27 31 23 29C20 27 22 24 24 25" fill="none" stroke="${T.main}" stroke-width="2" stroke-linecap="round"/><path d="M16 29C15 25 19 22 22 23" fill="none" stroke="${T.light}" stroke-width="0.9" stroke-linecap="round"/>${gem(11, 11, 5, T.ruby, T)}${petal(22, 7.5, 90, 10, 3, T.jade, T)}${petal(7.5, 22, 180, 10, 3, T.jade, T)}${bolt(T, 'M33 10L30 15L33 15L30 20', 1.2)}${bolt(T, 'M10 33L15 30L15 33L20 30', 1.2)}${star4(33, 33, 2.6, T.accent, 0.9)}${dot(30, 5.5, 1.3, T.light)}${dot(5.5, 30, 1.3, T.light)}`;
};
const edge = (T, P, h) => {
  const { petal, dot } = h;
  return `${petal(-5, 11, 165, 8.5, 2.4, T.jade, T)}${petal(5, 11, 195, 8.5, 2.4, T.jade, T)}${petal(0, 11, 180, 10.5, 2.2, T.main, T)}${dot(0, 10, 1.9, T.light)}${bolt(T, 'M-14 9L-11 12L-14 12L-11 16', 1)}${bolt(T, 'M14 9L11 12L14 12L11 16', 1)}`;
};
const side = (T, P, h) => {
  const { gem, petal, dot } = h;
  return `${petal(1.5, 25, 75, 11, 3.4, T.jade, T)}${petal(-1.5, 25, -75, 11, 3.4, T.jade, T)}${petal(1.5, 75, 75, 11, 3.4, T.jade, T)}${petal(-1.5, 75, -75, 11, 3.4, T.jade, T)}${gem(0, 50, 6.5, T.ruby, T)}${bolt(T, 'M6 44L9 48L6 48L9 53', 1)}${bolt(T, 'M-6 44L-9 48L-6 48L-9 53', 1)}${dot(0, 12.5, 1.7, T.accent)}${dot(0, 37.5, 1.5, T.light)}${dot(0, 62.5, 1.5, T.light)}${dot(0, 87.5, 1.7, T.accent)}`;
};
const bottom = (T, P, h) => {
  const { gem, petal, mirror, dot } = h;
  const half = `<path d="M0 11L-66 11C-66 5 -57 2 -52 6C-50 -1 -38 -1 -35 6C-31 -3 -18 -3 -14 5C-10 1 -4 3 0 6Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.8"/>${petal(-26, 4, -55, 8, 2.4, T.jade, T)}${petal(-44, 3, -60, 7, 2.2, T.jade, T)}${dot(-58, 6, 1.4, T.light)}${bolt(T, 'M-20 8L-17 4L-14 8', 0.9)}`;
  return half + mirror(half) + bolt(T, 'M2 7L-2 9.5L1 9.5L-2 12', 1.2) + gem(0, 2.5, 6.2, T.ruby, T);
};
const accent = (T, P, h) => {
  const { gem, petal, star4 } = h;
  return `<path d="M0 0C-8 -1 -15 -3 -19 -9C-23 -16 -16 -23 -10 -19C-14 -16 -13 -12 -9 -12" fill="none" stroke="${T.dark}" stroke-width="4.4" stroke-linecap="round" opacity="0.5"/><path d="M0 0C-8 -1 -15 -3 -19 -9C-23 -16 -16 -23 -10 -19C-14 -16 -13 -12 -9 -12" fill="none" stroke="${T.main}" stroke-width="3" stroke-linecap="round"/>${petal(-3, -3, -55, 11, 3, T.jade, T)}${bolt(T, 'M-6 -24L-9 -19L-6 -19L-9 -14', 1.2)}${gem(-20, -19, 3.4, T.ruby, T)}${star4(-23, -5, 2.6, T.accent, 0.95)}`;
};
module.exports = { avatar, crest, corner, edge, side, bottom, accent };
