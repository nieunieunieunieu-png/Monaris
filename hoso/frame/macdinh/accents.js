// ===== hoso/frame/macdinh/accents.js — PHỤ KIỆN góc: khung mặc định không có; riêng ĐỒNG II (cấp 5) có đinh đồng + tia sáng ở 4 góc =====
// Tự chứa. accent(tier, W, H) -> chuỗi SVG trong hệ toạ độ thẻ (0..W, 0..H), vẽ cả 4 góc; chuỗi rỗng = không vẽ.
function accent(tier, W, H) {
  // HUYỀN THOẠI ★2+ (cấp 60+, tier.star >= 2): 3 tia sáng chéo toả ra ngoài theo hướng góc (từ r=15 → 21/25/21 tính từ góc thẻ, nằm trong ô 28x28) màu nhấn viền tối mảnh + đầu hạt trắng = 3 phần tử/góc; cộng dồn cho mọi bậc sao sau; ★5+ (cấp 75+) tia đổi sang trắng-vàng
  if (tier.star >= 2) {
    const racc = tier.star >= 5 ? '#fff3c4' : (tier.accent || tier.light);
    const base = Math.atan2(-1, -1);
    let d = '';
    for (const [da, r1, r2] of [[-0.42, 15, 21], [0, 15.5, 25], [0.42, 15, 21]]) {
      const a = base + da;
      d += `M${(r1 * Math.cos(a)).toFixed(2)} ${(r1 * Math.sin(a)).toFixed(2)} L${(r2 * Math.cos(a)).toFixed(2)} ${(r2 * Math.sin(a)).toFixed(2)} `;
    }
    const rays = `<path d="${d}" stroke="${tier.dark}" stroke-width="3" stroke-linecap="round" fill="none"/><path d="${d}" stroke="${racc}" stroke-width="1.5" stroke-linecap="round" fill="none"/><circle cx="${(26.5 * Math.cos(base)).toFixed(2)}" cy="${(26.5 * Math.sin(base)).toFixed(2)}" r="1.6" fill="#ffffff"/>`;
    // HUYỀN THOẠI ★7+ (cấp 85+, tier.star >= 7): cánh nhỏ cạnh mỗi góc: 2 cánh (3 lông vũ/cánh, dài 20/16/12, xoè quạt) mọc từ tâm (-13,-13) sang hai phía vuông góc với hướng góc (nằm trong lề thẻ); lông vũ màu trắng-vàng viền tối + cuống trắng mảnh = 6 lông + 1 cuống = +7 phần tử/góc; vẽ DƯỚI tia sáng
    let wings = '';
    if (tier.star >= 7) {
      let quill = '';
      for (const sg of [-1, 1]) {
        [[0.0, 20], [0.38, 16], [0.76, 12]].forEach(([da, L]) => {
          const a = base + sg * (Math.PI / 2 + da * 0.55 - 0.18);
          const deg = ((a * 180) / Math.PI).toFixed(1);
          const w = (L * 0.24).toFixed(2);
          wings += `<path transform="rotate(${deg})" d="M7 0 C${(L * 0.3 + 7).toFixed(2)} -${w} ${(L * 0.75 + 7).toFixed(2)} -${w} ${L + 7} 0 C${(L * 0.75 + 7).toFixed(2)} ${w} ${(L * 0.3 + 7).toFixed(2)} ${w} 7 0 Z" fill="#fff3c4" stroke="${tier.dark}" stroke-width="1" stroke-linejoin="round"/>`;
          quill += `M${(7 * Math.cos(a)).toFixed(2)} ${(7 * Math.sin(a)).toFixed(2)} L${((L + 5) * Math.cos(a)).toFixed(2)} ${((L + 5) * Math.sin(a)).toFixed(2)} `;
        });
      }
      wings = `<g transform="translate(-13 -13)">${wings}<path d="${quill}" stroke="#ffffff" stroke-opacity="0.8" stroke-width="0.7" stroke-linecap="round" fill="none"/></g>`;
    }
    const gs = (tx, ty, sx, sy) => `<g transform="translate(${tx} ${ty}) scale(${sx} ${sy})">${wings}${rays}</g>`;
    return gs(0, 0, 1, 1) + gs(W, 0, -1, 1) + gs(0, H, 1, -1) + gs(W, H, -1, -1);
  }
  if (!(tier.step === 1 && tier.name === 'ĐỒNG' && !tier.star)) return '';
  const P = 'macdinh-accents-p';
  const acc = tier.accent || tier.light;
  // gốc (0,0) = góc ngoài của thẻ; mỗi góc 3 phần tử nằm trong ô 28x28 nhô ra ngoài (x,y từ -28 tới 0): đinh tán, tia 4 cánh, hạt sáng.
  const defs = `<defs><radialGradient id="${P}-nail" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="${tier.light}"/><stop offset="0.55" stop-color="${tier.main}"/><stop offset="1" stop-color="${tier.dark}"/></radialGradient></defs>`;
  const one =
    `<circle cx="-6" cy="-6" r="4.6" fill="url(#${P}-nail)" stroke="${tier.dark}" stroke-width="0.9"/>` +
    `<path d="M-17 -17 L-15.6 -13.4 L-12 -12 L-15.6 -10.6 L-17 -7 L-18.4 -10.6 L-22 -12 L-18.4 -13.4 Z" transform="translate(-3 -3)" fill="${acc}" stroke="${tier.dark}" stroke-width="0.6" stroke-linejoin="round"/>` +
    `<circle cx="-22.5" cy="-5" r="1.6" fill="${tier.light}" fill-opacity="0.9"/>`;
  const g = (tx, ty, sx, sy) => `<g transform="translate(${tx} ${ty}) scale(${sx} ${sy})">${one}</g>`;
  return defs + g(0, 0, 1, 1) + g(W, 0, -1, 1) + g(0, H, 1, -1) + g(W, H, -1, -1);
}

module.exports = { accent };
