// ===== hoso/frame/shop_cucquang/motif.js — hoạ tiết riêng (NÂNG CẤP 19): Cực Quang Thiên Hải — màn cực quang 3 lớp có vệt rủ + cụm pha lê 7 mũi + bông tuyết + sóng cực quang =====
// Hình học (giữ hợp đồng): avatar mọi nét r ≤ 84; crest x ∈ [-80,80], y ≥ 0, chân chạm y=36; bottom y ∈ [-4,12], nửa rộng ≤ 70 (bản cũ có mũi băng giữa vượt y=-6 — đã hạ ≤ 16). corner/edge/side/accent giữ nguyên bản cũ.
const { TIERS } = require('./colors');
const T = TIERS[0];
const shard = (x, y, a, len, w, T, P) => `<path ${`transform="translate(${x} ${y}) rotate(${a})"`} d="M${-w} 0L${-w * 0.7} ${-len * 0.7}L0 ${-len}L${w * 0.7} ${-len * 0.7}L${w} 0Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.55" stroke-linejoin="round"/><path ${`transform="translate(${x} ${y}) rotate(${a})"`} d="M0 ${-len}V0" stroke="${T.light}" stroke-opacity="0.8" stroke-width="0.5"/>`;
const avatar = (T, P, h) => {
  const { radial, n, polar, star4, dot } = h;
  const arcAt = (r, a0, a1) => { const [x0, y0] = polar(r, a0); const [x1, y1] = polar(r, a1); return `M${x0} ${y0}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`; };
  const crystals = radial(24, 77.2, (x, y, th, i) => shard(x, y, th, i % 2 ? 4.4 : 6.4, i % 2 ? 1.7 : 2.2, T, P), 7.5);
  // màn cực quang: lớp quầng rộng mờ + 3 dải sáng + dải viền mảnh
  const glow = `<path d="${arcAt(66.5, 14, 146)}" stroke="${T.accent}" stroke-opacity="0.22" stroke-width="6" fill="none" stroke-linecap="round"/><path d="${arcAt(66.5, 194, 336)}" stroke="${T.pink}" stroke-opacity="0.2" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  const aurora = `<path d="${arcAt(66.5, 20, 140)}" stroke="${T.accent}" stroke-opacity="0.75" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="${arcAt(66.5, 200, 330)}" stroke="${T.pink}" stroke-opacity="0.65" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="${arcAt(68.4, 150, 195)}" stroke="${T.main}" stroke-opacity="0.8" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="${arcAt(68.4, 340, 372)}" stroke="${T.main}" stroke-opacity="0.8" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="${arcAt(70.1, 40, 120)}" stroke="${T.light}" stroke-opacity="0.65" stroke-width="0.6" fill="none"/><path d="${arcAt(70.1, 220, 310)}" stroke="${T.light}" stroke-opacity="0.65" stroke-width="0.6" fill="none"/>`;
  // bông tuyết nhỏ 4 hướng chéo (r 71.4) + 16 hạt băng
  const flakes = radial(4, 71.4, (x, y) => star4(x, y, 3.2, T.light, 0.95), 45);
  const grains = radial(16, 73.6, (x, y, th, i) => dot(x, y, i % 2 ? 0.6 : 0.9, i % 2 ? T.main : T.light, 0.85), 11.25);
  return `${glow}${aurora}${grains}${crystals}${flakes}`;
};
const crest = (T, P, h) => {
  const { mirror, star4, dot } = h;
  // màn cực quang 3 lớp (x 10..76) + vệt sáng rủ xuống
  const ribbon = `<path d="M10 18C24 6 38 28 52 16C60 10 68 14 74 10" fill="none" stroke="${T.accent}" stroke-opacity="0.75" stroke-width="3.4" stroke-linecap="round"/><path d="M10 24C24 13 38 33 52 22C60 17 68 20 74 16" fill="none" stroke="${T.pink}" stroke-opacity="0.55" stroke-width="2.4" stroke-linecap="round"/><path d="M12 12C26 1.6 38 20 52 9.6C60 4 68 8 76 4" fill="none" stroke="${T.main}" stroke-opacity="0.6" stroke-width="2" stroke-linecap="round"/>`;
  let streaks = '';
  [[18, 12, 27], [28, 19, 30], [38, 20, 32], [48, 14, 28], [58, 11, 24], [68, 11, 22]].forEach(([x, y0, y1], i) => { streaks += `<path d="M${x} ${y0}V${y1}" stroke="${i % 2 ? T.pink : T.accent}" stroke-opacity="${i % 2 ? 0.35 : 0.45}" stroke-width="1.2" stroke-linecap="round"/>`; });
  const glow = `<ellipse cx="0" cy="22" rx="30" ry="16" fill="${T.main}" fill-opacity="0.16"/>`;
  // cụm pha lê 7 mũi: giữa cao nhất (đỉnh y=1), 2 cặp bên nghiêng ra
  const cluster = `${shard(-30, 36, -30, 14, 3.6, T, P)}${shard(30, 36, 30, 14, 3.6, T, P)}${shard(-24, 36, -22, 20, 4.4, T, P)}${shard(24, 36, 22, 20, 4.4, T, P)}${shard(-17, 36, -14, 18, 5, T, P)}${shard(17, 36, 14, 18, 5, T, P)}${shard(0, 36, 0, 35, 8, T, P)}`;
  const facet = `<path d="M-8 20H8" stroke="${T.light}" stroke-opacity="0.7" stroke-width="0.6"/><path d="M0 4V34" stroke="${T.light}" stroke-opacity="0.55" stroke-width="0.5"/>`;
  const flakes = star4(-44, 9, 3.2, T.light, 0.95) + star4(44, 9, 3.2, T.light, 0.95) + star4(-56, 22, 2, T.main, 0.9) + star4(56, 22, 2, T.main, 0.9);
  return `${glow}${ribbon}${mirror(ribbon)}${streaks}${mirror(streaks)}${cluster}${facet}${flakes}${dot(-66, 28, 1, T.pink, 0.9)}${dot(66, 28, 1, T.pink, 0.9)}`;
};
const corner = (T, P, h) => `${shard(4, 42, 0, 38, 4.5, T, P)}${shard(42, 4, 90, 38, 4.5, T, P)}${shard(12, 30, 28, 20, 4, T, P)}${shard(30, 12, 62, 20, 4, T, P)}${h.star4(12, 12, 6, T.light, 0.95)}${h.dot(24, 24, 1.5, T.accent)}`;
const edge = (T, P, h) => `${shard(-9, 2, 180, 14, 3, T, P)}${shard(0, 2, 180, 20, 3.6, T, P)}${shard(9, 2, 180, 14, 3, T, P)}`;
const side = (T, P, h) => `<path d="M0 0C9 12 -9 25 0 38C9 50 -9 62 0 75C9 88 -9 95 0 100" fill="none" stroke="${T.accent}" stroke-opacity="0.8" stroke-width="2.4" stroke-linecap="round"/><path d="M0 0C-8 12 8 25 0 38C-8 50 8 62 0 75C-8 88 8 95 0 100" fill="none" stroke="${T.pink}" stroke-opacity="0.55" stroke-width="1.6" stroke-linecap="round"/>${h.gem(0, 50, 8, T.accent, T)}${h.star4(0, 20, 3, T.light)}${h.star4(0, 80, 3, T.light)}`;
const bottom = (T, P, h) => {
  // mũi băng giữa: base y=12, len ≤ 16 để đỉnh ≥ y=-4
  let r = '';
  [[-48, 6, 2.2], [-40, 8, 2.6], [-30, 9, 2.8], [-20, 12, 3.2], [-10, 14, 3.8], [0, 16, 4.4], [10, 14, 3.8], [20, 12, 3.2], [30, 9, 2.8], [40, 8, 2.6], [48, 6, 2.2]].forEach(([x, len, w]) => { r += shard(x, 12, 0, len, w, T, P); });
  const wave = `<path d="M-68 8C-56 2 -46 14 -36 8M36 8C46 14 56 2 68 8" fill="none" stroke="${T.accent}" stroke-opacity="0.75" stroke-width="2" stroke-linecap="round"/><path d="M-66 11C-56 6 -48 15 -40 11M40 11C48 15 56 6 66 11" fill="none" stroke="${T.pink}" stroke-opacity="0.5" stroke-width="1.2" stroke-linecap="round"/><path d="M-60 4C-54 1 -48 5 -44 3M44 3C48 5 54 1 60 4" fill="none" stroke="${T.main}" stroke-opacity="0.7" stroke-width="1" stroke-linecap="round"/>`;
  return `${wave}${r}${h.star4(-58, 0.5, 2.2, T.light, 0.9)}${h.star4(58, 0.5, 2.2, T.light, 0.9)}${h.dot(-64, 5, 1.3, T.pink)}${h.dot(64, 5, 1.3, T.pink)}${h.dot(-26, 1, 0.8, T.light, 0.9)}${h.dot(26, 1, 0.8, T.light, 0.9)}${h.dot(-4, -1, 0.7, T.light, 0.9)}`;
};
const accent = (T, P, h) => { let s = ''; for (let i = 0; i < 6; i += 1) s += `<path transform="translate(-11 -11) rotate(${i * 60})" d="M0 0V-10M0 -6L-3 -9M0 -6L3 -9" stroke="${T.light}" stroke-width="1.2" stroke-linecap="round" fill="none"/>`; return `<circle cx="-11" cy="-11" r="11" fill="${T.main}" fill-opacity="0.2"/>${s}${h.dot(-11, -11, 2, T.accent)}${h.dot(-24, -4, 1.2, T.pink)}${h.dot(-4, -24, 1.2, T.pink)}`; };
module.exports = { avatar, crest, corner, edge, side, bottom, accent };
