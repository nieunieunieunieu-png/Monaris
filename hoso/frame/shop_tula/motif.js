// ===== hoso/frame/shop_tula/motif.js — hoạ tiết riêng (NÂNG CẤP 20): Tu La Huyết Ngục — vòng lửa 2 tầng + sừng quỷ + tàn lửa + sọ nhỏ + nền lửa bệ =====
// Hình học (giữ hợp đồng): avatar mọi nét r ≤ 84; crest x ∈ [-80,80], y ≥ 0, chân chạm y=36; bottom y ∈ [-4,12], nửa rộng ≤ 70. corner/edge/side/accent giữ nguyên bản cũ.
const { TIERS } = require('./colors');
const T = TIERS[0];
const flame = (x, y, a, len, w, T, P) => `<path transform="translate(${x} ${y}) rotate(${a})" d="M${-w} 0C${-w} ${-len * 0.4} ${-w * 0.2} ${-len * 0.6} ${w * 0.3} ${-len}C${w * 0.5} ${-len * 0.55} ${w} ${-len * 0.35} ${w} 0Z" fill="url(#${P}g)" stroke="${T.black}" stroke-width="0.5" stroke-linejoin="round"/>`;
const avatar = (T, P, h) => {
  const { radial, gem, polar, dot, spike } = h;
  const blades = radial(16, 77.6, (x, y, th, i) => flame(x, y, th + (i % 2 ? 8 : -8), i % 2 ? 4 : 6.3, 2, T, P), 11.25);
  // 16 lưỡi lửa nhỏ xen kẽ ở tầng trong (chân r 76, dài 3.2, nghiêng ngược chiều)
  const small = radial(16, 76, (x, y, th) => flame(x, y, th + 22.5, 3.2, 1.2, T, P), 0);
  const horns = radial(4, 79, (x, y, th) => gem(x, y, 4, T.accent, T, th), 45);
  // 4 sừng quỷ nhỏ cong ở 0°/90°/180°/270° (chân r 78.4, đỉnh ≤ r 83.9)
  const horn = radial(4, 78.4, (x, y, th) => `<path transform="translate(${x} ${y}) rotate(${th})" d="M-2.2 0C-2 -2.4 -1 -4.2 1.6 -5.4C0.6 -3.6 1.2 -1.8 2.2 0Z" fill="${T.black}" stroke="${T.main}" stroke-width="0.4" stroke-linejoin="round"/>`, 0);
  const embers = radial(24, 71.2, (x, y, th, i) => dot(x, y, i % 3 ? 0.7 : 1, i % 3 ? T.ember : T.accent, 0.9), 3.75);
  const vein = `<circle r="68.6" fill="none" stroke="${T.main}" stroke-opacity="0.55" stroke-width="0.6"/><circle r="73.4" fill="none" stroke="${T.black}" stroke-opacity="0.7" stroke-width="1.4"/>`;
  return `<circle r="66.2" fill="none" stroke="${T.ember}" stroke-opacity="0.65" stroke-width="1.4" stroke-dasharray="6 4"/>${vein}${embers}${small}${blades}${horn}${horns}`;
};
const crest = (T, P, h) => {
  const { gem, mirror, dot, star4 } = h;
  const horn = `<path d="M7 34C10 24 18 18 28 17C36 16 44 10 48 2C47 12 42 22 32 25C24 27 18 30 16 34Z" fill="url(#${P}g)" stroke="${T.black}" stroke-width="0.8" stroke-linejoin="round"/><path d="M20 30C28 24 38 22 44 10" fill="none" stroke="${T.light}" stroke-opacity="0.6" stroke-width="0.7"/><path d="M14 31L18 27M20 25L25 22M28 20L33 19" stroke="${T.black}" stroke-opacity="0.8" stroke-width="0.8" stroke-linecap="round"/>`;
  const aura = `<defs><radialGradient id="${P}a" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${T.ember}" stop-opacity="0.55"/><stop offset="1" stop-color="${T.ember}" stop-opacity="0"/></radialGradient></defs><ellipse cx="0" cy="22" rx="30" ry="18" fill="url(#${P}a)"/>`;
  const flames = `${flame(-30, 34, -30, 9, 2.8, T, P)}${flame(30, 34, 30, 9, 2.8, T, P)}${flame(-20, 34, -24, 16, 3.6, T, P)}${flame(20, 34, 24, 16, 3.6, T, P)}${flame(0, 34, 0, 30, 7, T, P)}${flame(-9, 34, -14, 18, 4, T, P)}${flame(9, 34, 14, 18, 4, T, P)}`;
  const eye = `<path d="M-6 24C-3 20.4 3 20.4 6 24C3 27.6 -3 27.6 -6 24Z" fill="${T.black}" stroke="${T.accent}" stroke-width="0.6"/><ellipse cx="0" cy="24" rx="1.1" ry="2.6" fill="${T.ember}"/>`;
  const sparks = star4(-40, 8, 2.4, T.accent, 0.95) + star4(40, 8, 2.4, T.accent, 0.95) + dot(-56, 14, 1, T.ember, 0.9) + dot(56, 14, 1, T.ember, 0.9) + dot(-30, 4, 0.8, T.accent, 0.9) + dot(30, 4, 0.8, T.accent, 0.9) + dot(-74, 20, 0.9, T.ember, 0.85) + dot(74, 20, 0.9, T.ember, 0.85);
  return `${aura}${horn}${mirror(horn)}${flames}${gem(0, 24, 5.5, T.ember, T)}${eye}<path d="M-16 36H16" stroke="${T.black}" stroke-width="3"/><path d="M-12 36H12" stroke="${T.main}" stroke-opacity="0.7" stroke-width="0.6"/>${sparks}`;
};
const corner = (T, P, h) => `${flame(6, 40, 0, 36, 4, T, P)}${flame(40, 6, 90, 36, 4, T, P)}${flame(14, 28, 30, 22, 3.4, T, P)}${flame(28, 14, 60, 22, 3.4, T, P)}${h.gem(13, 13, 5, T.accent, T, 45)}`;
const edge = (T, P, h) => `${flame(-9, 1, 180, 15, 3.4, T, P)}${flame(9, 1, 180, 15, 3.4, T, P)}${flame(0, 1, 180, 21, 4, T, P)}${h.dot(0, 5, 1.5, T.accent)}`;
const side = (T, P, h) => {
  let s = `<rect x="-4" y="0" width="8" height="100" fill="${T.black}" stroke="${T.main}" stroke-width="0.9"/><path d="M0 0V100" stroke="${T.main}" stroke-opacity="0.6" stroke-width="0.8"/>`;
  [15, 35, 65, 85].forEach((y, i) => { s += h.spike(i % 2 ? 4 : -4, y, i % 2 ? 90 : -90, 8, 2.4, T.main, T); });
  return `${s}${h.gem(0, 50, 7, T.ember, T)}`;
};
const bottom = (T, P, h) => {
  const { dot, star4 } = h;
  let f = '';
  [[-58, 6, -16], [-50, 8, -14], [-40, 8, -12], [-32, 12, -8], [-24, 12, -6], [-16, 14, -3], [-8, 15, 0], [8, 15, 0], [16, 14, 3], [24, 12, 6], [32, 12, 8], [40, 8, 12], [50, 8, 14], [58, 6, 16]].forEach(([x, len, a]) => { f += flame(x, 12, a, len, 3.4, T, P); });
  // sọ nhỏ hai bên (x ±62..68) — hộp sọ + 2 hốc mắt
  const skull = (x) => `<g transform="translate(${x} 6)"><path d="M-3.4 2.4C-4.4 -2.4 -2 -4 0 -4C2 -4 4.4 -2.4 3.4 2.4L2 3.4V4.6H-2V3.4Z" fill="${T.light}" fill-opacity="0.92" stroke="${T.black}" stroke-width="0.5" stroke-linejoin="round"/><circle cx="-1.5" cy="-0.4" r="0.9" fill="${T.black}"/><circle cx="1.5" cy="-0.4" r="0.9" fill="${T.black}"/></g>`;
  const lava = `<path d="M-68 10H68" stroke="${T.black}" stroke-width="2.4"/><path d="M-68 10H68" stroke="${T.main}" stroke-opacity="0.7" stroke-width="0.8"/><path d="M-30 10.4H30" stroke="${T.ember}" stroke-opacity="0.8" stroke-width="0.6"/>`;
  const embers = dot(-44, 0, 0.8, T.ember, 0.9) + dot(44, 0, 0.8, T.ember, 0.9) + dot(-20, -2, 0.7, T.accent, 0.9) + dot(20, -2, 0.7, T.accent, 0.9) + star4(-12, 0, 1.8, T.accent, 0.9) + star4(12, 0, 1.8, T.accent, 0.9);
  return `${lava}${f}${skull(-65)}${skull(65)}${h.gem(0, 3, 4, T.accent, T)}${embers}`;
};
const accent = (T, P, h) => `${flame(-2, -2, -40, 24, 4, T, P)}${flame(-2, -2, -85, 18, 3.2, T, P)}${h.gem(-9, -9, 4, T.accent, T, 45)}${h.dot(-22, -22, 1.2, T.ember, 0.9)}`;
module.exports = { avatar, crest, corner, edge, side, bottom, accent };
