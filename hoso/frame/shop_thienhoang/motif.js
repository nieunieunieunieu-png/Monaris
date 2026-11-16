// ===== hoso/frame/shop_thienhoang/motif.js — hoạ tiết riêng (NÂNG CẤP 17): Thiên Hoàng Chí Tôn — vương miện 5 chóp + 2 tầng tia mặt trời + cánh lông + sen ngọc 9 cánh =====
// Hình học (giữ hợp đồng): avatar mọi nét r ≤ 84; crest x ∈ [-80,80], y ≥ 0, chân chạm y=36; bottom y ∈ [-4,12], nửa rộng ≤ 70. corner/edge/side/accent giữ nguyên bản cũ.
const { TIERS } = require('./colors');
const T = TIERS[0];
const avatar = (T, P, h) => {
  const { radial, spike, dot, n, polar, pearl } = h;
  const rays = radial(24, 80.2, (x, y, th, i) => spike(x, y, th, i % 2 ? 2.4 : 3.6, 1.1, T.main, T, 0.3), 7.5);
  const pearls = radial(36, 73.5, (x, y) => dot(x, y, 0.8, T.light, 0.9), 5);
  // 4 chóp vương miện ở 0°/90°/180°/270°: tam xoa 3 tia, chân r 79.4, đỉnh ≤ r 83.9
  const crowns = radial(4, 79.4, (x, y, th) => spike(x, y, th, 4.5, 1.8, T.light, T, 0.35) + spike(x, y, th - 14, 3.4, 1.3, T.main, T, 0.3) + spike(x, y, th + 14, 3.4, 1.3, T.main, T, 0.3), 0);
  // vòng tia mảnh thứ 2 (xen kẽ 24 tia chính) ngay trong vành
  const fine = radial(48, 71.2, (x, y, th) => spike(x, y, th, 1.7, 0.5, T.light, T, 0.15), 3.75);
  const [hx, hy] = polar(76.2, 315);
  const shine = `<path d="M${polar(76.2, 300).join(' ')}A76.2 76.2 0 0 1 ${polar(76.2, 335).join(' ')}" fill="none" stroke="#fff" stroke-opacity="0.75" stroke-width="1.2" stroke-linecap="round"/><circle cx="${hx}" cy="${hy}" r="1.1" fill="#fff" fill-opacity="0.9"/>`;
  return `<circle r="73.5" fill="none" stroke="${T.dark}" stroke-opacity="0.7" stroke-width="1.6"/><circle r="75.8" fill="none" stroke="${T.main}" stroke-opacity="0.6" stroke-width="0.6" stroke-dasharray="1.2 1.6"/>${pearls}${fine}${rays}${crowns}${shine}`;
};
const crest = (T, P, h) => {
  const { spike, gem, pearl, mirror, petal, star4, n } = h;
  // tầng tia 1 (dài, mảnh) + tầng tia 2 (ngắn, dày) toả từ tâm vương miện (0,19)
  let rays = '';
  for (let a = -84; a <= 84; a += 12) rays += spike(0, 19, a, 17, 1.2, T.light, T, 0.25);
  for (let a = -78; a <= 78; a += 24) rays += spike(0, 19, a, 12, 2.2, T.main, T, 0.4);
  const halo = `<circle cx="0" cy="19" r="14" fill="${T.main}" fill-opacity="0.22"/><circle cx="0" cy="19" r="11.5" fill="none" stroke="${T.light}" stroke-opacity="0.7" stroke-width="0.7"/>`;
  // cánh lông 3 chiếc mỗi bên, gốc (±17,29)
  let wing = '';
  [58, 72, 86].forEach((a, i) => { wing += petal(17, 29, a, 15 - i * 2, 3.6 - i * 0.4, `url(#${P}g)`, T); });
  const scroll = `<path d="M14 31C24 33 34 31 42 26C50 21 56 22 58 26C60 30 54 32 52 29" fill="none" stroke="${T.main}" stroke-width="2.4" stroke-linecap="round"/><path d="M14 31C24 33 34 31 42 26" fill="none" stroke="${T.light}" stroke-opacity="0.8" stroke-width="0.8"/>${pearl(60, 27, 2.2, T)}`;
  // vương miện 5 chóp, đáy y=27, đỉnh giữa y=3
  const crown = `<path d="M-13 27L-14 13L-8 19L-7 8L-2 17L0 3L2 17L7 8L8 19L14 13L13 27Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/><path d="M-13 27H13" stroke="${T.dark}" stroke-width="0.8"/><path d="M-12 24.5H12" stroke="${T.light}" stroke-opacity="0.7" stroke-width="0.6"/>`
    + pearl(0, 4.2, 1.5, T) + pearl(-7, 9.2, 1.2, T) + pearl(7, 9.2, 1.2, T) + pearl(-14, 14.2, 1.1, T) + pearl(14, 14.2, 1.1, T)
    + gem(0, 18, 4.4, T.ruby, T) + gem(-7.5, 21.5, 2, T.accent, T) + gem(7.5, 21.5, 2, T.accent, T);
  const base = `<path d="M-19 36L-15 27H15L19 36Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/>${gem(0, 32, 3, T.ruby, T)}${gem(-8.5, 32, 1.8, T.accent, T)}${gem(8.5, 32, 1.8, T.accent, T)}`;
  const sparks = star4(-40, 10, 2.6, T.light, 0.9) + star4(40, 10, 2.6, T.light, 0.9) + star4(-62, 14, 1.8, T.main, 0.85) + star4(62, 14, 1.8, T.main, 0.85);
  return `${mirror(wing)}${wing}${mirror(scroll)}${scroll}${rays}${halo}${sparks}${crown}${base}`;
};
const corner = (T, P, h) => {
  const { gem, pearl, spike } = h;
  return `<path d="M3 42V10Q3 3 10 3H42" fill="none" stroke="${T.dark}" stroke-width="5.4" stroke-linecap="round"/><path d="M3 42V10Q3 3 10 3H42" fill="none" stroke="${T.main}" stroke-width="3.4" stroke-linecap="round"/><path d="M3 42V10Q3 3 10 3H42" fill="none" stroke="${T.light}" stroke-opacity="0.8" stroke-width="0.8" stroke-linecap="round"/>`
    + gem(14, 14, 6.5, T.ruby, T, 45) + pearl(28, 6.5, 1.8, T) + pearl(6.5, 28, 1.8, T) + spike(21, 21, 135, 7, 2, T.main, T);
};
const edge = (T, P, h) => {
  const { pearl, mirror, gem } = h;
  const hook = `<path d="M-3 9C-6 3 -14 3 -15 9C-16 14 -10 15 -9.5 11" fill="none" stroke="${T.main}" stroke-width="2.2" stroke-linecap="round"/><path d="M-15 9C-18 6 -21 8 -21 11" fill="none" stroke="${T.light}" stroke-opacity="0.8" stroke-width="0.8"/>`;
  return `${hook}${mirror(hook)}${gem(0, 10, 3.6, T.ruby, T)}${pearl(-19, 14, 1.4, T)}${pearl(19, 14, 1.4, T)}`;
};
const side = (T, P, h) => {
  const { gem, pearl, mirror } = h;
  const curl = `<path d="M3 50C10 46 14 38 10 33C7 29 2 32 5 36" fill="none" stroke="${T.main}" stroke-width="2" stroke-linecap="round"/><path d="M3 50C10 54 14 62 10 67C7 71 2 68 5 64" fill="none" stroke="${T.main}" stroke-width="2" stroke-linecap="round"/>`;
  return `${curl}${mirror(curl)}${gem(0, 50, 7.5, T.ruby, T)}${pearl(0, 12, 3, T)}${pearl(0, 28, 2.2, T)}${pearl(0, 72, 2.2, T)}${pearl(0, 88, 3, T)}`;
};
const bottom = (T, P, h) => {
  const { petal, gem, pearl, mirror, dot } = h;
  // sen ngọc 9 cánh: 2 lớp ngoài (±76, ±62, ±48), 2 lớp giữa (±34, ±18), 1 cánh giữa; gốc y=12, đỉnh ≥ y=-4
  let lotus = '';
  [-76, -62, -48, 48, 62, 76].forEach((a) => { lotus += petal(0, 12, a, Math.abs(a) > 70 ? 9 : 11, 3.6, `url(#${P}g)`, T); });
  [-34, -18, 18, 34].forEach((a) => { lotus += petal(0, 12, a, 14, 4, `url(#${P}g)`, T); });
  lotus += petal(0, 12, 0, 16, 4.6, `url(#${P}g)`, T);
  const scroll = `<path d="M16 9C28 11 40 10 48 6C54 3 60 4 61 8C62 11 58 12 56 10" fill="none" stroke="${T.main}" stroke-width="2" stroke-linecap="round"/>${pearl(65, 8, 2, T)}<path d="M18 11.2C32 12 46 11.6 56 11.2" fill="none" stroke="${T.light}" stroke-opacity="0.6" stroke-width="0.6"/>`;
  let chain = '';
  for (let x = 28; x <= 68; x += 5.5) chain += dot(x, 11.4, 0.7, T.light, 0.85) + dot(-x, 11.4, 0.7, T.light, 0.85);
  return `${scroll}${mirror(scroll)}${chain}${lotus}${gem(0, 3, 3.6, T.ruby, T)}${gem(-9, 6, 2, T.accent, T)}${gem(9, 6, 2, T.accent, T)}`;
};
const accent = (T, P, h) => {
  const { star4, gem, dot } = h;
  return `<circle cx="-11" cy="-11" r="11" fill="${T.main}" fill-opacity="0.2"/>${star4(-11, -11, 10, T.main)}${star4(-11, -11, 5, T.light)}${gem(-11, -11, 3, T.ruby, T)}${dot(-24, -4, 1.3, T.light, 0.9)}${dot(-4, -24, 1.3, T.light, 0.9)}${dot(-24, -20, 0.9, T.accent)}${dot(-20, -24, 0.9, T.accent)}`;
};
module.exports = { avatar, crest, corner, edge, side, bottom, accent };
