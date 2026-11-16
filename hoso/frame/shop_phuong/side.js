// ===== hoso/frame/shop_phuong/side.js — CẠNH TRÁI: cánh chim lửa ôm hai bên =====
// Hình học: 1 đơn vị cao 100 (y 0..100), rộng x ∈ [-12, 15]; trục x=0 liền mạch ở y=0 và y=100.
const T = require('./colors').TIERS[0];
const P = 'shop_phuong-side-';
function sideUnit(_tier, W, H) {
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${T.dark}"/><stop offset="0.5" stop-color="${T.main}"/><stop offset="1" stop-color="${T.accent}"/></linearGradient></defs>`;
  const spine = `<path d="M0 0V100" stroke="${T.dark}" stroke-width="3.4"/><path d="M0 0V100" stroke="${T.accent}" stroke-width="1.4"/>`;
  // 3 lông cánh trong thẻ (phải) + 3 lông nhỏ ngoài (trái), cong xuống
  let a = '', b = '', c = '';
  [0, 34, 68].forEach((y) => {
    a += `M1 ${y + 2}C14 ${y + 8} 15 ${y + 26} 5 ${y + 40}C7 ${y + 28} 4 ${y + 14} 1 ${y + 2}Z`;
    b += `M2 ${y + 6}C9 ${y + 12} 9 ${y + 24} 4 ${y + 32}C5 ${y + 24} 3 ${y + 14} 2 ${y + 6}Z`;
    c += `M-1 ${y + 12}C-9 ${y + 17} -11 ${y + 28} -4 ${y + 38}C-5 ${y + 28} -3 ${y + 20} -1 ${y + 12}Z`;
  });
  return defs + spine + `<path d="${c}" fill="${T.main}" stroke="${T.dark}" stroke-width="0.7" stroke-linejoin="round"/><path d="${a}" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/><path d="${b}" fill="${T.light}" fill-opacity="0.75"/>`;
}
module.exports = { sideUnit };
