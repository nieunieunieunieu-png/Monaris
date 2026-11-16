// ===== hoso/frame/shop_arcade/avatar.js — KHUNG AVATAR (nâng cấp): viền pixel 8-bit nhiều lớp + đèn LED + 4 sao pixel chéo =====
// Hình học: ô 4×4 (lưới -80..80); vòng LED r 68..72, lớp màu r 72..76 (8 cung 45°), lớp tối r 76..80, 4 sao pixel dấu cộng ở 45° (mọi ô ≤ r 82.9).
const T = require('./colors').TIERS[0];
function avatarFrame(_tier, R = 70) {
  const k = Number((R / 70).toFixed(4));
  const cs = 4;
  const cols = [T.main, T.accent, T.blue, T.light];
  const n = 40; // số ô mỗi chiều: chỉ số 0..39 ứng toạ độ -80..76
  const grid = {}; // 'i,j' -> màu
  const set = (i, j, c) => { grid[`${i},${j}`] = c; };
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const cx = (i - 20) * cs + cs / 2; const cy = (j - 20) * cs + cs / 2;
      const rc = Math.hypot(cx, cy);
      const ang = ((Math.atan2(cy, cx) * 180) / Math.PI + 360) % 360;
      if (rc >= 68 && rc < 72) set(i, j, Math.floor(ang / 15) % 2 === 0 ? T.bg : T.dark); // vòng đèn nền
      if (rc >= 68 && rc < 72 && Math.floor(ang / 15) % 2 === 0 && Math.floor(ang / 30) % 2 === 0) set(i, j, T.light); // LED sáng mỗi 30°
      if (rc >= 72 && rc < 76) set(i, j, cols[Math.floor(ang / 45) % 4]);
      else if (rc >= 76 && rc < 80) set(i, j, Math.floor(ang / 11.25) % 2 === 0 ? T.dark : T.bg);
    }
  }
  // vệt sáng phản quang cung trên-trái (225°..250°) trên lớp màu
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const cx = (i - 20) * cs + cs / 2; const cy = (j - 20) * cs + cs / 2;
    const rc = Math.hypot(cx, cy); const ang = ((Math.atan2(cy, cx) * 180) / Math.PI + 360) % 360;
    if (rc >= 72 && rc < 74 && ang >= 215 && ang <= 250) set(i, j, '#FFFFFF');
  }
  // 4 sao pixel dấu cộng ở các góc chéo: tâm ô chứa (±55, ±55)
  [[1, 1], [-1, 1], [-1, -1], [1, -1]].forEach(([sx, sy], idx) => {
    const ci = sx > 0 ? 20 + 13 : 20 - 14; const cj = sy > 0 ? 20 + 13 : 20 - 14;
    const c = idx % 2 === 0 ? T.accent : T.blue;
    [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([di, dj]) => set(ci + di, cj + dj, c));
    set(ci, cj, '#FFFFFF');
  });
  // gộp ô liền kề thành run ngang cho từng màu
  const buf = {};
  for (let j = 0; j < n; j++) {
    let key = null; let x0 = 0; let w = 0;
    const y = (j - 20) * cs;
    const flush = () => { if (key !== null) buf[key] = (buf[key] || '') + `M${x0} ${y}h${w}v${cs}h-${w}z`; key = null; w = 0; };
    for (let i = 0; i < n; i++) {
      const c = grid[`${i},${j}`] || null;
      if (c !== key) { flush(); if (c !== null) { key = c; x0 = (i - 20) * cs; w = cs; } } else if (c !== null) w += cs;
    }
    flush();
  }
  const order = [T.bg, T.dark, T.main, T.accent, T.blue, T.light, '#FFFFFF'];
  const parts = order.filter((c) => buf[c]).map((c) => `<path fill="${c}" d="${buf[c]}"/>`).join('');
  return `<g transform="scale(${k})" shape-rendering="crispEdges">${parts}</g>`;
}
module.exports = { avatarFrame };
