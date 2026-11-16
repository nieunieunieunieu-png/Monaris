// ===== hoso/frame/shop_luongtu/motif.js — hoạ tiết riêng (NÂNG CẤP 21): Lượng Tử Hư Không — sóng xác suất + electron có vệt + mạch điện + nguyên tử 3 quỹ đạo + biểu đồ lượng tử =====
// Hình học (giữ hợp đồng): avatar mọi nét r ≤ 84; crest x ∈ [-80,80], y ≥ 0, chân chạm y=36; bottom y ∈ [-4,12], nửa rộng ≤ 70. corner/edge/side/accent giữ nguyên bản cũ.
const { TIERS } = require('./colors');
const T = TIERS[0];
const hex = (x, y, r, fill, stroke, w = 1) => { let d = ''; for (let i = 0; i < 6; i += 1) { const t = (Math.PI / 3) * i + Math.PI / 6; d += `${i ? 'L' : 'M'}${Number((x + r * Math.cos(t)).toFixed(2))} ${Number((y + r * Math.sin(t)).toFixed(2))}`; } return `<path d="${d}Z" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round"/>`; };
const avatar = (T, P, h) => {
  const { radial, dot, polar } = h;
  const nodes = radial(6, 81, (x, y) => hex(x, y, 2.8, T.accent, T.dark, 0.5), 30);
  // sóng xác suất quanh vành: r = 80.4 + 1.6·sin(24θ), 24 chu kỳ (r 78.8..82)
  let wave = '';
  for (let a = 0; a <= 360; a += 4) { const [x, y] = polar(80.4 + 1.6 * Math.sin((a * 24 * Math.PI) / 180), a); wave += `${a ? 'L' : 'M'}${x} ${y}`; }
  // vạch chia nhỏ trên vành (r 74.2..76.2), bỏ các góc có đinh ngọc (bội 30°)
  let ticks = '';
  for (let a = 10; a < 360; a += 10) { if (a % 30) { const [x1, y1] = polar(74.2, a); const [x2, y2] = polar(76.2, a); ticks += `M${x1} ${y1}L${x2} ${y2}`; } }
  // 3 electron r72 kèm vệt sao chổi phía sau (3 đoạn nhạt dần, lùi 45°)
  const electron = (a, col) => {
    let s = '';
    [[-45, -30, 0.25], [-30, -15, 0.5], [-15, 0, 0.85]].forEach(([a0, a1, op]) => {
      let d = '';
      for (let t = a0; t <= a1; t += 5) { const [x, y] = polar(72, a + t); d += `${t === a0 ? 'M' : 'L'}${x} ${y}`; }
      s += `<path d="${d}" fill="none" stroke="${col}" stroke-opacity="${op}" stroke-width="1.7" stroke-linecap="round"/>`;
    });
    return s + dot(...polar(72, a), 3.6, col, 0.3) + dot(...polar(72, a), 2.2, col);
  };
  // 4 mạch điện ngắn mọc ra ở hướng chéo (chân r72, đỉnh ≤ r83)
  const trace = radial(4, 72, (x, y, th, i) => `<g transform="translate(${x} ${y}) rotate(${th})"><path d="M0 0V-3L${i % 2 ? -3 : 3} -6V-9.4" fill="none" stroke="${T.accent}" stroke-width="1.1" stroke-linejoin="round"/>${dot(i % 2 ? -3 : 3, -9.4, 1.3, T.pink)}</g>`, 45);
  return `<circle r="82.8" fill="none" stroke="${T.main}" stroke-opacity="0.55" stroke-width="0.8" stroke-dasharray="3 3"/><path d="${wave}" fill="none" stroke="${T.accent}" stroke-opacity="0.75" stroke-width="0.9" stroke-linejoin="round"/><circle r="66.5" fill="none" stroke="${T.accent}" stroke-opacity="0.6" stroke-width="1.3"/><circle r="68.4" fill="none" stroke="${T.pink}" stroke-opacity="0.45" stroke-width="0.6" stroke-dasharray="2 3"/><path d="${ticks}" stroke="${T.dark}" stroke-opacity="0.7" stroke-width="0.9"/>${trace}${nodes}${electron(40, T.accent)}${electron(160, T.pink)}${electron(280, T.light)}`;
};
const crest = (T, P, h) => {
  const { dot, mirror, star4 } = h;
  const cy = 18;
  // quầng sáng + 3 quỹ đạo (rx18.5, ry7 quay 0/60/120° quanh (0,18)): đỉnh cao nhất y≈1.6
  const aura = `<defs><radialGradient id="${P}a" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${T.main}" stop-opacity="0.6"/><stop offset="0.6" stop-color="${T.accent}" stop-opacity="0.18"/><stop offset="1" stop-color="${T.accent}" stop-opacity="0"/></radialGradient></defs><ellipse cx="0" cy="${cy}" rx="34" ry="19" fill="url(#${P}a)"/>`;
  const cols = [T.accent, T.pink, T.light];
  let orbits = '';
  [0, 60, 120].forEach((a, i) => { orbits += `<ellipse cx="0" cy="${cy}" rx="18.5" ry="7" transform="rotate(${a} 0 ${cy})" fill="none" stroke="${cols[i]}" stroke-opacity="0.9" stroke-width="1.3"/>`; });
  // electron nằm trên quỹ đạo (toạ độ tính tay: điểm cuối trục dài của từng quỹ đạo)
  const e = (a, col) => { const r = (a * Math.PI) / 180; return dot(Number((18.5 * Math.cos(r)).toFixed(2)), Number((cy + 18.5 * Math.sin(r)).toFixed(2)), 2, col) + dot(Number((-18.5 * Math.cos(r)).toFixed(2)), Number((cy - 18.5 * Math.sin(r)).toFixed(2)), 1.2, T.light, 0.9); };
  const electrons = e(0, T.accent) + e(60, T.pink) + e(120, T.light);
  // 2 tầng mạch điện mỗi bên: tầng trên có nút lục giác, tầng dưới nút tròn
  const trace = `<path d="M24 22H40L46 14H60L66 8H76" fill="none" stroke="${T.main}" stroke-width="1.6" stroke-linejoin="round"/><path d="M24 22H40L46 14H60L66 8H76" fill="none" stroke="${T.light}" stroke-opacity="0.55" stroke-width="0.5" stroke-linejoin="round"/><path d="M26 29H46L51 34H68" fill="none" stroke="${T.accent}" stroke-opacity="0.9" stroke-width="1.2" stroke-linejoin="round"/>${hex(46, 14, 2.6, T.dark, T.accent, 0.7)}${hex(66, 8, 2.4, T.dark, T.pink, 0.7)}${dot(76, 8, 1.8, T.pink)}${dot(40, 22, 1.4, T.light)}${dot(68, 34, 1.6, T.accent)}${dot(51, 34, 1.2, T.light)}`;
  const sparks = star4(-34, 6, 3, T.accent, 0.95) + star4(34, 6, 3, T.accent, 0.95) + dot(-58, 24, 1, T.light, 0.9) + dot(58, 24, 1, T.light, 0.9) + dot(-72, 18, 0.9, T.pink, 0.85) + dot(72, 18, 0.9, T.pink, 0.85);
  const base = `<path d="M-16 36L-12 29H12L16 36Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.7" stroke-linejoin="round"/><path d="M-9 36L-6 31H6L9 36" fill="none" stroke="${T.accent}" stroke-opacity="0.8" stroke-width="0.7" stroke-linejoin="round"/><path d="M-22 35H22" stroke="${T.main}" stroke-width="2"/><path d="M-22 35H22" stroke="${T.light}" stroke-opacity="0.7" stroke-width="0.5"/>`;
  const core = `<circle cx="0" cy="${cy}" r="7.4" fill="${T.dark}" fill-opacity="0.55" stroke="${T.accent}" stroke-opacity="0.7" stroke-width="0.6"/><circle cx="0" cy="${cy}" r="4.8" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.7"/>${dot(-1.4, cy - 1.6, 1.4, '#fff', 0.8)}`;
  return `${aura}${trace}${mirror(trace)}${orbits}${electrons}${core}${base}${sparks}${mirror(sparks)}`;
};
const corner = (T, P, h) => `<path d="M3 42V22L12 13V3H42" fill="none" stroke="${T.dark}" stroke-width="4.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M3 42V22L12 13V3H42" fill="none" stroke="${T.main}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><path d="M3 42V22L12 13V3H42" fill="none" stroke="${T.accent}" stroke-opacity="0.8" stroke-width="0.8" stroke-linejoin="round"/>${hex(19, 19, 6.2, T.dark, T.accent, 1.2)}${h.dot(19, 19, 2, T.pink)}${h.dot(33, 8, 1.4, T.light)}${h.dot(8, 33, 1.4, T.light)}`;
const edge = (T, P, h) => `<path d="M-17 4H-7L-2 11H17" fill="none" stroke="${T.main}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/><path d="M-17 4H-7L-2 11H17" fill="none" stroke="${T.light}" stroke-opacity="0.7" stroke-width="0.6"/>${h.dot(-17, 4, 1.6, T.accent)}${h.dot(17, 11, 1.6, T.pink)}${hex(-8, 14, 2.4, T.dark, T.accent, 0.7)}`;
const side = (T, P, h) => `<ellipse cx="0" cy="50" rx="13" ry="6" fill="none" stroke="${T.accent}" stroke-width="1.2"/><ellipse cx="0" cy="50" rx="13" ry="6" transform="rotate(60 0 50)" fill="none" stroke="${T.pink}" stroke-opacity="0.8" stroke-width="1.2"/><ellipse cx="0" cy="50" rx="13" ry="6" transform="rotate(120 0 50)" fill="none" stroke="${T.light}" stroke-opacity="0.8" stroke-width="1.2"/>${h.dot(0, 50, 3.6, T.main)}${hex(0, 14, 3.6, T.dark, T.accent, 0.9)}${hex(0, 86, 3.6, T.dark, T.accent, 0.9)}${h.dot(0, 28, 1.6, T.pink)}${h.dot(0, 72, 1.6, T.pink)}`;
const bottom = (T, P, h) => {
  const { dot } = h;
  // biểu đồ xác suất lượng tử: cột đáy y=12, chiều cao theo chuông Gauss × |cos| (cao nhất 14 → đỉnh y ≥ -2)
  let bars = '';
  for (let x = -60; x <= 60; x += 6) { const ht = Number((14 * Math.exp(-((x / 34) ** 2)) * Math.abs(Math.cos((x / 60) * Math.PI * 1.5)) + 1.2).toFixed(2)); bars += `M${x - 1} 12h2v${-ht}h-2Z`; }
  // 2 sóng giao thoa: tím/hồng lệch pha, biên độ tắt dần về hai đầu (y 0..10)
  const wv = (amp, ph) => { let d = ''; for (let x = -66; x <= 66; x += 3) d += `${x === -66 ? 'M' : 'L'}${x} ${Number((5 + amp * Math.sin((x / 66) * Math.PI * 3 + ph) * Math.max(0, 1 - Math.abs(x) / 90)).toFixed(2))}`; return d; };
  return `<path d="${bars}" fill="${T.main}" fill-opacity="0.5"/><path d="M-68 11.6H68" stroke="${T.main}" stroke-opacity="0.75" stroke-width="0.8"/><path d="${wv(5, 0)}" fill="none" stroke="${T.accent}" stroke-width="1.7" stroke-linejoin="round"/><path d="${wv(4, Math.PI)}" fill="none" stroke="${T.pink}" stroke-opacity="0.85" stroke-width="1.2" stroke-linejoin="round"/>${hex(0, 5, 6, T.dark, T.accent, 1.3)}${hex(0, 5, 3.2, T.main, T.light, 0.6)}${dot(0, 5, 1.2, T.pink)}${hex(-30, 5, 2.4, T.dark, T.accent, 0.7)}${hex(30, 5, 2.4, T.dark, T.accent, 0.7)}${dot(-66, 6, 1.6, T.pink)}${dot(66, 6, 1.6, T.pink)}${dot(-68, 10.8, 1.2, T.light)}${dot(68, 10.8, 1.2, T.light)}`;
};
const accent = (T, P, h) => `${hex(-12, -12, 9, T.main, T.accent, 1)}${hex(-12, -12, 5, T.dark, T.light, 0.8)}${h.dot(-12, -12, 1.8, T.pink)}${h.dot(-25, -6, 1.2, T.accent)}${h.dot(-6, -25, 1.2, T.accent)}`;
module.exports = { avatar, crest, corner, edge, side, bottom, accent };
