// ===== hoso/frame/cd_lienhoa/avatar.js — KHUNG AVATAR: NỬA DƯỚI = một đoá sen kiểu tranh (lấn vào ảnh), NỬA TRÊN = búp sen xếp vòng cung =====
// Đã bỏ vành viền. Ánh sáng cầu vồng mềm quanh sau avatar, sáng dần theo bậc. Sen: gốc (0,88), len 96, ép dọc ×0.82 (đỉnh cánh giữa y≈20, nửa rộng ≈ 90), đè lên đáy ảnh.
// Búp sen nửa trên: gốc r=73 hướng ra ngoài (dài 14/21 xen kẽ, tối đa r≈94), 5+2i búp.
const { TIERS, byRealm } = require('./colors');
const { lotus, pet } = require('./lotus');
const P = 'cd_lienhoa-avatar-';
const f = (n) => Number(n.toFixed(2));
const RAD = Math.PI / 180;

function buds(t) {   // búp sen nửa trên, mỗi búp = 3 cánh nhọn gộp 1 path
  const n = 5 + 2 * t.i;
  let s = '';
  for (let k = 0; k < n; k += 1) {
    const a = -165 + (150 * k) / (n - 1);
    const L = k % 2 ? 14 : 21, w = Math.max(3.2, Math.min(6.5, (73 * (150 / (n - 1)) * RAD) * 0.5));
    const bx = 73 * Math.cos(a * RAD), by = 73 * Math.sin(a * RAD), d = a + 90;
    s += `<path d="${pet(bx, by, d, L, w)}${pet(bx, by, d - 24, L * 0.72, w * 0.8)}${pet(bx, by, d + 24, L * 0.72, w * 0.8)}" fill="#F7A0B8" stroke="#FFF1F5" stroke-width="0.7" stroke-linejoin="round"/>`;
  }
  return s;
}

// Ánh sáng cầu vồng MỀM toả quanh sau avatar (vành r 70..86, không phủ ảnh): đỏ→cam→vàng→lục→lam→chàm→tím hoà mượt dần ra ngoài, trắng sáng sát mép ảnh; độ sáng tăng theo bậc (0.45 → 1.0, từ bậc 5 vẽ chồng 2 lớp).
const RB = ['#FF5A5A', '#FFA64D', '#FFE75A', '#6BE08A', '#5CC8FF', '#7A7CF0', '#C08AF0'];
function cauVong(t) {
  const op = f(0.45 + 0.55 * (t.i / 9));
  const stops = RB.map((c, j) => `<stop offset="${f(0.82 + 0.025 * j)}" stop-color="${c}" stop-opacity="${op}"/>`).join('');
  const defs = `<defs><radialGradient id="${P}rb" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="86"><stop offset="0.8" stop-color="#FFFFFF" stop-opacity="${f(op * 0.9)}"/>${stops}<stop offset="1" stop-color="#C08AF0" stop-opacity="0"/></radialGradient></defs>`;
  const ann = (x) => `<path fill-rule="evenodd" fill="url(#${P}rb)" d="M-86 0 A86 86 0 1 0 86 0 A86 86 0 1 0 -86 0 Z M-70 0 A70 70 0 1 0 70 0 A70 70 0 1 0 -70 0 Z"/>`.repeat(x);
  return `${defs}${ann(t.i >= 5 ? 2 : 1)}`;
}

function avatarFrame(tier, R = 70) {
  const t = tier && Number.isInteger(tier.i) ? tier : byRealm(tier && tier.i) || TIERS[0];
  const k = f(R / 70);
  const sen = `<g transform="translate(0 88) scale(1 0.82)">${lotus(t, { id: `${P}lt`, len: 96, pod: false })}</g>`;
  return `<g transform="scale(${k})">${cauVong(t)}${buds(t)}${sen}</g>`;
}
module.exports = { avatarFrame };
