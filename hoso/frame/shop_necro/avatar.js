// ===== hoso/frame/shop_necro/avatar.js — KHUNG AVATAR: vòng đốt xương sống + 8 lưỡi lửa u linh + 4 linh hồn + vầng năng lượng =====
// Hình học: vành r 70..77; đốt xương r 73.5; 8 lưỡi lửa r 76.5..83.5; 4 linh hồn r 80.5±3.2 (≤83.9); vầng năng lượng r 66–69 (≥64); tua khói r≤80.
const T = require('./colors').TIERS[0];
const P = 'shop_necro-avatar-';
const n = (v) => Number(v.toFixed(2));
const rad = (d) => (d * Math.PI) / 180;
const pt = (r, a) => `${n(r * Math.cos(rad(a)))} ${n(r * Math.sin(rad(a)))}`;
function avatarFrame(_tier, R = 70) {
  const k = Number((R / 70).toFixed(4));
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.5" stop-color="${T.main}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient><radialGradient id="${P}s" cx="0.4" cy="0.3" r="0.8"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.5" stop-color="${T.accent}"/><stop offset="1" stop-color="${T.main}" stop-opacity="0"/></radialGradient></defs>`;
  const ring = `<path fill-rule="evenodd" fill="url(#${P}g)" d="M-77 0 A77 77 0 1 0 77 0 A77 77 0 1 0 -77 0 Z M-70 0 A70 70 0 1 0 70 0 A70 70 0 1 0 -70 0 Z"/>`;
  const ripple = (baseR, amp, freq, op) => {
    let w = '';
    for (let a = 0; a <= 360; a += 5) w += `${a ? 'L' : 'M'}${pt(baseR + amp * Math.sin(rad(a * freq)), a)}`;
    return `<path d="${w}Z" fill="none" stroke="${T.accent}" stroke-width="0.7" stroke-opacity="${op}"/>`;
  };
  const waves = ripple(73.5, 1.3, 10, 0.5) + ripple(78.5, 1.4, 12, 0.3);
  // đốt xương sống: 24 hạt xương trên vành (r 73.5)
  let vert = '';
  for (let a = 0; a < 360; a += 15) { const c = pt(73.5, a).split(' '); vert += `<ellipse cx="${c[0]}" cy="${c[1]}" rx="2.5" ry="1.7" transform="rotate(${a + 90} ${c[0]} ${c[1]})" fill="${T.bone}" stroke="${T.boneDark}" stroke-width="0.5"/>`; }
  // lửa u linh: 8 lưỡi (22.5° + 45°·i), cong theo chiều gió, đỉnh r ≤ 83.9
  let fl = '', fc = '';
  for (let i = 0; i < 8; i++) {
    const a = 22.5 + i * 45, tip = i % 2 ? 80 : 83.5;
    fl += `M${pt(76.5, a - 5)}Q${pt(tip - 3, a - 3)} ${pt(tip, a + 4)}Q${pt(tip - 4, a + 3)} ${pt(76.5, a + 5)}Z`;
    fc += `M${pt(77, a - 2)}Q${pt(tip - 5, a)} ${pt(tip - 2.5, a + 3)}Q${pt(tip - 6, a + 2)} ${pt(77, a + 2)}Z`;
  }
  const fire = `<path d="${fl}" fill="${T.flame}" stroke="${T.flameDark}" stroke-width="0.6" stroke-linejoin="round" fill-opacity="0.9"/><path d="${fc}" fill="${T.light}" fill-opacity="0.9"/>`;
  const glow = `<circle r="67.6" fill="none" stroke="${T.accent}" stroke-opacity="0.3" stroke-width="3"/><circle r="66" fill="none" stroke="${T.light}" stroke-opacity="0.45" stroke-width="0.7"/>`;
  const souls = [0, 90, 180, 270].map((a) => { const c = pt(80.5, a).split(' '); return `<circle cx="${c[0]}" cy="${c[1]}" r="3.2" fill="url(#${P}s)"/><circle cx="${c[0]}" cy="${c[1]}" r="1.1" fill="#FFFFFF"/>`; }).join('');
  let wisp = '';
  [40, 160, 280].forEach((a) => {
    const a1 = pt(73, a); const a2 = pt(80, a + 14); const a3 = pt(74, a + 26);
    wisp += `<path d="M${a1}C${a2} ${a2} ${a3}" fill="none" stroke="${T.accent}" stroke-width="0.9" stroke-linecap="round" stroke-opacity="0.6"/>`;
  });
  return `${defs}<g transform="scale(${k})">${glow}${ring}${waves}${vert}${fire}${souls}${wisp}</g>`;
}
module.exports = { avatarFrame };
