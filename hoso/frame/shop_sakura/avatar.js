// ===== hoso/frame/shop_sakura/avatar.js — KHUNG AVATAR — cành đào 12 hoa + nụ + cánh rơi + vầng hồng =====
// Hình học: vành r 70..77; hoa nở tâm r=77, bán kính ≤ 7 (tối đa r=84); cánh rơi trong r ≥ 65.
const T = require('./colors').TIERS[0];
const P = 'shop_sakura-avatar-';
const n = (v) => Number(v.toFixed(2));
const pol = (r, deg) => { const t = (deg * Math.PI) / 180; return [r * Math.cos(t), r * Math.sin(t)]; };
// cánh hoa anh đào (có khía) tại (cx,cy), hướng a độ, dài L
function petal(cx, cy, a, L) {
  const t = (a * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t), w = L * 0.42;
  const q = (x, y) => `${n(cx + x * c - y * s)} ${n(cy + x * s + y * c)}`;
  return `M${q(0, 0)}Q${q(-w, -L * 0.55)} ${q(-w * 0.55, -L)}L${q(0, -L * 0.82)}L${q(w * 0.55, -L)}Q${q(w, -L * 0.55)} ${q(0, 0)}Z`;
}
const flower = (cx, cy, rot, L) => [0, 1, 2, 3, 4].map((i) => petal(cx, cy, rot + i * 72, L)).join('');
function avatarFrame(_tier, R = 70) {
  const k = Number((R / 70).toFixed(4));
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.5" stop-color="${T.main}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient></defs>`;
  const ring = `<path fill-rule="evenodd" fill="url(#${P}g)" d="M-77 0 A77 77 0 1 0 77 0 A77 77 0 1 0 -77 0 Z M-70 0 A70 70 0 1 0 70 0 A70 70 0 1 0 -70 0 Z"/>`;
  // cành: 2 cung r=76.5 + cành con
  const p = (r, d) => pol(r, d).map(n).join(' ');
  let twig = '';
  for (const d of [30, 75, 150, 215, 290, 335]) twig += `M${p(76.5, d)}L${p(80.5, d + 9)}`;
  const branch = `<path d="M${p(76.5, 15)}A76.5 76.5 0 0 1 ${p(76.5, 190)}M${p(76.5, 205)}A76.5 76.5 0 0 1 ${p(76.5, 350)}" fill="none" stroke="${T.wood}" stroke-width="3" stroke-linecap="round"/><path d="M${p(76.5, 15)}A76.5 76.5 0 0 1 ${p(76.5, 190)}M${p(76.5, 205)}A76.5 76.5 0 0 1 ${p(76.5, 350)}" fill="none" stroke="${T.accent}" stroke-opacity="0.55" stroke-width="0.7"/><path d="${twig}" fill="none" stroke="${T.wood}" stroke-width="1.5" stroke-linecap="round"/>`;
  // hoa nở trên cành: [góc, bán kính cánh]
  let big = '', mid = '', core = '';
  [[0, 6.8], [36, 4.8], [58, 5.6], [95, 4.6], [118, 6.8], [155, 4.8], [178, 5.6], [215, 4.8], [238, 6.8], [275, 4.6], [298, 5.6], [330, 4.8]].forEach(([d, L], i) => {
    const [x, y] = pol(77, d);
    big += flower(x, y, d + 90 + i * 11, L);
    core += `M${n(x + 1)} ${n(y)}A1 1 0 1 0 ${n(x - 1)} ${n(y)}A1 1 0 1 0 ${n(x + 1)} ${n(y)}Z`;
  });
  [30, 150, 270, 85, 205, 320].forEach((d, i) => { const [x, y] = pol(77, d); mid += flower(x, y, d + 40 + i * 17, 4); });
  const flowers = `<path d="${big}" fill="${T.main}" stroke="${T.dark}" stroke-width="0.6" stroke-linejoin="round"/><path d="${mid}" fill="${T.light}" stroke="${T.dark}" stroke-width="0.5" stroke-linejoin="round"/><path d="${core}" fill="${T.dark}"/>`;
  // cánh hoa rơi (trong r≥65 và ngoài r≤83)
  let fall = '';
  [[10, 66.5, 20], [100, 66.5, 140], [200, 66, 260], [250, 80, 80], [330, 66.5, 300], [60, 80.5, 200]].forEach(([d, r, a]) => { const [x, y] = pol(r, d); fall += petal(x, y, a, 3.6); });
  let buds = '';
  [[20, 80.6], [47, 81], [72, 80.6], [106, 81], [135, 80.6], [166, 81], [196, 80.6], [226, 81], [256, 80.6], [286, 81], [313, 80.6], [345, 81]].forEach(([d, r]) => { const [x, y] = pol(r, d); buds += `<circle cx="${n(x)}" cy="${n(y)}" r="1.7" fill="${T.main}" stroke="${T.dark}" stroke-width="0.5"/>`; });
  const glow = `<circle r="67.6" fill="none" stroke="${T.main}" stroke-opacity="0.35" stroke-width="3"/>`;
  return `${defs}<g transform="scale(${k})">${glow}${ring}${branch}${buds}${flowers}<path d="${fall}" fill="${T.accent}" stroke="${T.dark}" stroke-width="0.5" stroke-linejoin="round"/></g>`;
}
module.exports = { avatarFrame };
