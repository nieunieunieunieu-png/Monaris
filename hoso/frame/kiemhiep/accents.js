// ===== hoso/frame/kiemhiep/accents.js — PHỤ KIỆN góc: phi tiêu + đồng tiền (chỉ BẠCH KIM trở lên) =====
// Tự chứa. accent(tier, W, H) -> SVG toạ độ thẻ, 4 góc, mỗi cái vừa ô 28x28 nhô ra ngoài khung góc.
function accent(tier, W, H) {
  // Nửa bậc + (VÀNG II, cấp 25): mỗi góc 2 vết kiếm khí chéo (1 đậm, 1 mờ) + 1 hạt ở đầu vết (3 phần tử/góc, trong ô 28x28).
  if (tier.step === 1 && tier.name === 'VÀNG' && !tier.star) {
    const oneP = `<path d="M-4 -4 L-24 -24" stroke="#f2f5f9" stroke-width="2" stroke-linecap="round"/><path d="M-11 -3 L-24 -16" stroke="#f2f5f9" stroke-opacity="0.5" stroke-width="1.4" stroke-linecap="round"/><circle cx="-26" cy="-26" r="1.8" fill="${tier.accent}"/>`;
    const gP = (tx, ty, sx, sy) => `<g transform="translate(${tx} ${ty}) scale(${sx} ${sy})">${oneP}</g>`;
    return gP(0, 0, 1, 1) + gP(W, 0, -1, 1) + gP(0, H, 1, -1) + gP(W, H, -1, -1);
  }
  if (!tier.double) return '';
  const P = 'kiemhiep-accents-';
  const rbDef = tier.rainbow ? `<defs><linearGradient id="${P}rb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6b6b"/><stop offset="0.25" stop-color="#ffd93d"/><stop offset="0.5" stop-color="#6bffb8"/><stop offset="0.75" stop-color="#6bb8ff"/><stop offset="1" stop-color="#d96bff"/></linearGradient></defs>` : '';
  const fill = `fill="${tier.rainbow ? `url(#${P}rb)` : tier.main}" stroke="${tier.dark}" stroke-width="1" stroke-linejoin="round"`;
  const f = (n) => Number(n.toFixed(2));
  // HUYỀN THOẠI ★2+ (cấp 60+, tier.star >= 2): mỗi góc 3 VỆT ĐAO chéo toả ra ngoài (mũi nhọn dẹt: đáy r=14 rộng 2.4 → mũi r=27/22/22 theo hướng 225°/198°/252° tính từ góc thẻ; nét tối đệm + lõi trắng-bạc + hạt sáng đầu mũi) = 3 path + 1 hạt/góc; vẽ TRƯỚC phi tiêu/đồng tiền (không đè), nằm trong ô 28x28; từ ★5 (cấp 75+) đổi trắng-vàng; cộng dồn tới TỐI THƯỢNG
  const rayCol = tier.star >= 5 ? '#fff3c4' : '#f2f5f9';
  let rays = '';
  if (tier.star >= 2) {
    let rd = '', tips = '';
    for (const [deg, tip] of [[225, 27], [198, 22], [252, 22]]) {
      const a = (deg * Math.PI) / 180, c = Math.cos(a), sn = Math.sin(a), px = -sn * 1.2, py = c * 1.2;
      const q = (r, o) => `${f(c * r + (o ? px : -px))} ${f(sn * r + (o ? py : -py))}`;
      rd += `M${q(14, 1)} L${f(c * tip)} ${f(sn * tip)} L${q(14, 0)} Z `;
      tips += `M${f(c * (tip + 1.6))} ${f(sn * (tip + 1.6))} h0.01 `;
    }
    rays = `<path d="${rd}" fill="${rayCol}" stroke="${tier.dark}" stroke-width="0.9" stroke-linejoin="round"/><path d="${tips}" stroke="${tier.accent}" stroke-width="2.2" stroke-linecap="round"/>`;
  }
  // phi tiêu 4 cánh (tâm -12,-12) + đồng tiền nhỏ (tâm -20,-3)
  const one0 =
    `<path d="M-12 -23 L-9.5 -14.5 L-1 -12 L-9.5 -9.5 L-12 -1 L-14.5 -9.5 L-23 -12 L-14.5 -14.5 Z" ${fill}/><circle cx="-12" cy="-12" r="2" fill="${tier.dark}"/>` +
    `<circle cx="-22" cy="-2" r="3.4" fill="${tier.accent}" stroke="${tier.dark}" stroke-width="1"/><rect x="-23.2" y="-3.2" width="2.4" height="2.4" fill="${tier.dark}"/>`;
  const one = rays + one0;
  const g = (tx, ty, sx, sy) => `<g transform="translate(${tx} ${ty}) scale(${sx} ${sy})">${one}</g>`;
  // HUYỀN THOẠI ★7+ (cấp 85+, tier.star >= 7): mỗi góc 2 cánh nhỏ (3 lông vũ dài 11/16/20, quạt từ (-13,-13) vuông góc hướng góc ra hai phía dọc mép thẻ; trắng-vàng #fff3c4 viền tối + cuống trắng) = 2 path/góc; vẽ DƯỚI phi tiêu/đồng tiền; cộng dồn tới TỐI THƯỢNG
  let wings = '';
  if (tier.star >= 7) {
    const r1 = (n) => Number(n.toFixed(1));
    const base7 = Math.atan2(-1, -1);
    let fd = '', sd = '';
    for (const sg of [-1, 1]) {
      const a0 = base7 + sg * Math.PI / 2;
      for (const [off, len] of [[-0.34, 11], [0, 16], [0.34, 20]]) {
        const a = a0 + sg * off, c = Math.cos(a), sn = Math.sin(a), w = len * 0.14;
        const tx = -13 + len * c, ty = -13 + len * sn, mx = -13 + len * c / 2, my = -13 + len * sn / 2;
        fd += `M-13 -13Q${r1(mx - sn * w)} ${r1(my + c * w)} ${r1(tx)} ${r1(ty)}Q${r1(mx + sn * w)} ${r1(my - c * w)} -13 -13Z`;
      }
      sd += `M-13 -13L${r1(-13 + 6 * Math.cos(a0))} ${r1(-13 + 6 * Math.sin(a0))}`;
    }
    const one7 = `<path d="${fd}" fill="#fff3c4" stroke="${tier.dark}" stroke-width="0.7" stroke-linejoin="round"/><path d="${sd}" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" fill="none"/>`;
    const g7 = (tx, ty, sx, sy) => `<g transform="translate(${tx} ${ty}) scale(${sx} ${sy})">${one7}</g>`;
    wings = g7(0, 0, 1, 1) + g7(W, 0, -1, 1) + g7(0, H, 1, -1) + g7(W, H, -1, -1);
  }
  return rbDef + wings + g(0, 0, 1, 1) + g(W, 0, -1, 1) + g(0, H, 1, -1) + g(W, H, -1, -1);
}

module.exports = { accent };
