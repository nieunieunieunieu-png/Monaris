// ===== hoso/frame/cd_lienhoa/border.js — VIỀN HÀO QUANG: N đường bo tròn song song (N = số màu cộng dồn của bậc), vàng ngoài cùng =====
// Hình học: nét từ inset 2 → ≤ 22px vào trong (bước 2.4, nét 2); góc bo tròn bán kính 16 giảm dần theo lớp; chừa x = W/2 ± 14 ở cạnh trên; bậc 9 thêm dải gradient vàng-trắng ở lớp trong cùng.
// Cảnh 4 góc bo tròn (tháp chùa/trăng núi/hồ sen/đình + tre) do scenes.js vẽ, nối vào cuối chuỗi trả về (nằm ngay trong viền, inset 26).
const { TIERS, byRealm } = require('./colors');
const { scenes } = require('./scenes');
const P = 'cd_lienhoa-border-';
const n = (v) => Number(v.toFixed(2));

function ringPath(W, H, i, r, gap) {
  const mx = W / 2, x0 = i, x1 = W - i, y0 = i, y1 = H - i;
  return `M${n(mx + gap)} ${y0}H${n(x1 - r)}A${r} ${r} 0 0 1 ${x1} ${n(y0 + r)}V${n(y1 - r)}A${r} ${r} 0 0 1 ${n(x1 - r)} ${y1}H${n(x0 + r)}A${r} ${r} 0 0 1 ${x0} ${n(y1 - r)}V${n(y0 + r)}A${r} ${r} 0 0 1 ${n(x0 + r)} ${y0}H${n(mx - gap)}`;
}

function frameBorder(tier, W, H) {
  const t = tier && Number.isInteger(tier.i) ? tier : byRealm(tier && tier.i) || TIERS[0];
  const STEP = 2.4;
  let s = '';
  t.colors.forEach((c, j) => {
    const i = n(2 + j * STEP), r = Math.max(3, n(16 - j * 1.6));
    s += `<path d="${ringPath(W, H, i, r, 14)}" fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
  });
  if (t.rainbow) {
    const j = t.colors.length, i = n(2 + j * STEP), r = Math.max(3, n(16 - j * 1.6));
    s = `<defs><linearGradient id="${P}r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F5C518"/><stop offset="0.5" stop-color="#FFFFFF"/><stop offset="1" stop-color="#F5C518"/></linearGradient></defs>` + s +
      `<path d="${ringPath(W, H, i, r, 14)}" fill="none" stroke="url(#${P}r)" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>`;
  }
  return s; // 4 cảnh góc không còn vẽ ở đây: đã thành tranh nền liền mạch (backdrop.js, do hoso/congDucCard.js gọi)
}
module.exports = { frameBorder };
