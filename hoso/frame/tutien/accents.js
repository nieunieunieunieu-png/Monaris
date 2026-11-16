// ===== hoso/frame/tutien/accents.js — PHỤ KIỆN góc: lá sen + hạt linh khí (chỉ BẠCH KIM trở lên) =====
// Tự chứa. accent(tier, W, H) -> SVG toạ độ thẻ, 4 góc, mỗi cái vừa ô 28x28 nhô ra ngoài khung góc.
function accent(tier, W, H) {
  // Nửa bậc + (BẠC II, cấp 15): chỉ 1 viên ngọc nhỏ + 2 hạt linh khí ở mỗi góc (3 phần tử/góc, nằm trong ô 28x28).
  if (tier.step === 1 && tier.name === 'BẠC' && !tier.star) {
    const Q = 'tutien-accents-p-';
    const acc = tier.accent || tier.light;
    const defsP = `<defs><radialGradient id="${Q}orb" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#ffffff"/><stop offset="0.45" stop-color="${acc}"/><stop offset="1" stop-color="${tier.dark}"/></radialGradient></defs>`;
    const oneP = `<circle cx="-7" cy="-7" r="4.4" fill="url(#${Q}orb)" stroke="${tier.dark}" stroke-width="0.8"/><circle cx="-17" cy="-5" r="1.7" fill="${acc}"/><circle cx="-5" cy="-17" r="1.7" fill="${acc}"/>`;
    const gP = (tx, ty, sx, sy) => `<g transform="translate(${tx} ${ty}) scale(${sx} ${sy})">${oneP}</g>`;
    return defsP + gP(0, 0, 1, 1) + gP(W, 0, -1, 1) + gP(0, H, 1, -1) + gP(W, H, -1, -1);
  }
  if (!tier.double) return '';
  const P = 'tutien-accents-';
  const rbDef = tier.rainbow ? `<defs><linearGradient id="${P}rb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6b6b"/><stop offset="0.25" stop-color="#ffd93d"/><stop offset="0.5" stop-color="#6bffb8"/><stop offset="0.75" stop-color="#6bb8ff"/><stop offset="1" stop-color="#d96bff"/></linearGradient></defs>` : '';
  const fill = `fill="${tier.rainbow ? `url(#${P}rb)` : tier.main}" stroke="${tier.dark}" stroke-width="1" stroke-linejoin="round"`;
  // gốc (0,0) = góc ngoài của thẻ; vẽ lá sen + hạt hướng ra ngoài (lên trái)
  const one =
    `<path d="M-3 -3 C-8 -8 -16 -8 -22 -14 C-14 -17 -6 -14 -3 -3 Z" ${fill}/>` +
    `<path d="M-3 -3 C-8 -3 -16 -1 -24 -6 C-18 -12 -8 -10 -3 -3 Z" ${fill} fill-opacity="0.85"/>` +
    `<circle cx="-8" cy="-17" r="2" fill="${tier.accent}"/><circle cx="-18" cy="-3" r="1.6" fill="${tier.accent}"/>`;
  const g = (tx, ty, sx, sy) => `<g transform="translate(${tx} ${ty}) scale(${sx} ${sy})">${one}</g>`;
  // HUYỀN THOẠI ★2+ (cấp 60+, tier.star >= 2): 3 tia sáng chéo toả ra ngoài theo hướng góc (r 17→22/28/22 từ góc thẻ, nằm trong ô 28x28; vẽ SAU lá sen để nhìn ra) màu nhấn viền tối mảnh + đầu hạt trắng = 3 phần tử/góc; cộng dồn cho mọi bậc sao sau; ★5+ (cấp 75+) tia đổi sang trắng-vàng
  let rays = '';
  if (tier.star >= 2) {
    const racc = tier.star >= 5 ? '#fff3c4' : (tier.accent || tier.light);
    const base = Math.atan2(-1, -1);
    let d = '';
    for (const [da, r1, r2] of [[-0.42, 17, 22], [0, 17.5, 28], [0.42, 17, 22]]) {
      const a = base + da;
      d += `M${(r1 * Math.cos(a)).toFixed(2)} ${(r1 * Math.sin(a)).toFixed(2)} L${(r2 * Math.cos(a)).toFixed(2)} ${(r2 * Math.sin(a)).toFixed(2)} `;
    }
    const one2 = `<path d="${d}" stroke="${tier.dark}" stroke-width="3" stroke-linecap="round" fill="none"/><path d="${d}" stroke="${racc}" stroke-width="1.5" stroke-linecap="round" fill="none"/><circle cx="${(29.5 * Math.cos(base)).toFixed(2)}" cy="${(29.5 * Math.sin(base)).toFixed(2)}" r="1.6" fill="#ffffff"/>`;
    const g2 = (tx, ty, sx, sy) => `<g transform="translate(${tx} ${ty}) scale(${sx} ${sy})">${one2}</g>`;
    rays = g2(0, 0, 1, 1) + g2(W, 0, -1, 1) + g2(0, H, 1, -1) + g2(W, H, -1, -1);
  }
  // HUYỀN THOẠI ★7+ (cấp 85+, tier.star >= 7): mỗi góc 2 cánh nhỏ (3 lông vũ dài 11/16/20, quạt từ tâm (-13,-13) vuông góc hướng góc ra hai phía dọc mép thẻ; trắng-vàng #fff3c4, viền tối) + cuống trắng = 2 phần tử/góc (+8); vẽ DƯỚI lá sen (lá sen che bớt gốc cánh nên gọn, chỉ phần lông vũ nhô ra hai phía dọc mép thẻ), TRƯỚC tia ★2; cộng dồn tới ★10
  let wings = '';
  if (tier.star >= 7) {
    const round1 = (n) => Number(n.toFixed(1));
    const base7 = Math.atan2(-1, -1);
    let fd = '', sd = '';
    for (const sg of [-1, 1]) {
      const a0 = base7 + sg * Math.PI / 2;
      for (const [off, len] of [[-0.34, 11], [0, 16], [0.34, 20]]) {
        const a = a0 + sg * off, c = Math.cos(a), sn = Math.sin(a), w = len * 0.14;
        const tx = -13 + len * c, ty = -13 + len * sn, mx = -13 + len * c / 2, my = -13 + len * sn / 2;
        fd += `M-13 -13Q${round1(mx - sn * w)} ${round1(my + c * w)} ${round1(tx)} ${round1(ty)}Q${round1(mx + sn * w)} ${round1(my - c * w)} -13 -13Z`;
      }
      sd += `M-13 -13L${round1(-13 + 6 * Math.cos(a0))} ${round1(-13 + 6 * Math.sin(a0))}`;
    }
    const one7 = `<path d="${fd}" fill="#fff3c4" stroke="${tier.dark}" stroke-width="0.7" stroke-linejoin="round"/><path d="${sd}" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" fill="none"/>`;
    const g7 = (tx, ty, sx, sy) => `<g transform="translate(${tx} ${ty}) scale(${sx} ${sy})">${one7}</g>`;
    wings = g7(0, 0, 1, 1) + g7(W, 0, -1, 1) + g7(0, H, 1, -1) + g7(W, H, -1, -1);
  }
  return rbDef + wings + g(0, 0, 1, 1) + g(W, 0, -1, 1) + g(0, H, 1, -1) + g(W, H, -1, -1) + rays;
}

module.exports = { accent };
