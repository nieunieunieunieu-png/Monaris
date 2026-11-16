// hoso/frame/linhvat/side.js — hoạ tiết CẠNH BÊN: dấu chân bước đi + hạt đậu nhỏ (lặp mỗi 100px, ghép liền không hở)
// Gốc toạ độ: giữa lề trái, rộng tối đa 30px (x -15..15). Cạnh phải do bên ghép lật gương scale(-1 1).
// Chữ ký: sideUnit(tier) -> chuỗi SVG của 1 đơn vị cao 100px. File tự chứa, không require file khác.

const ORDER = ['ĐỒNG', 'BẠC', 'VÀNG', 'BẠCH KIM', 'KIM CƯƠNG', 'HUYỀN THOẠI'];
const P = 'lvside';

function sideUnit(tier /*, W, H */) {
  const idx = Math.max(0, ORDER.indexOf(tier.name));
  const rb = Boolean(tier.rainbow);
  const acc = tier.accent || tier.light;
  const defs = rb
    ? `<defs><linearGradient id="${P}-rb" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100"><stop offset="0" stop-color="#ff6b6b"/><stop offset="0.25" stop-color="#ffd93d"/><stop offset="0.5" stop-color="#6bffb8"/><stop offset="0.75" stop-color="#6bb8ff"/><stop offset="1" stop-color="#d96bff"/></linearGradient></defs>`
    : '';
  const col = rb ? `url(#${P}-rb)` : tier.light;
  const st = `fill="${col}" stroke="${tier.dark}" stroke-width="1" stroke-linejoin="round"`;
  const paw = (x, y, rot, k = 1) =>
    `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${k})"><ellipse cx="0" cy="2.2" rx="4" ry="3.3" ${st}/>` +
    [[-4.4, -3], [0, -5.4], [4.4, -3]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="1.8" ${st}/>`).join('') + `</g>`;
  const bean = (x, y, r = 1.8) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${tier.main}" stroke="${tier.dark}" stroke-width="0.8"/>`;

  // Bước chân so le trái/phải; bậc cao thêm chân + hạt đậu + tim nhỏ
  let s = paw(-6, 16, -12) + bean(5, 34) + bean(8, 40, 1.4);
  if (idx >= 1) s += paw(6, 56, 12);
  if (idx >= 2) s += bean(-6, 74) + bean(-9, 80, 1.4);
  if (idx >= 3) s += paw(-6, 90, -12);
  if (idx >= 4) s += bean(7, 8, 1.4) + bean(-4, 46, 1.4);
  if (idx >= 5)
    s += `<path d="M10 70 C7 67 7 64 9.2 64 C10 64 10.5 64.8 10.5 64.8 C10.5 64.8 11 64 11.8 64 C14 64 14 67 11 70 Z" fill="${acc}" stroke="${tier.dark}" stroke-width="0.8" stroke-linejoin="round"/>`;
  // HUYỀN THOẠI ★3+ (cấp 65+, tier.star >= 3): sao 4 cánh nhỏ ở y=50 bên trái (x=-9, cánh 5 → x -14..-4, y 45..55; chân mèo y=56 ở bên phải nên không đè) + lõi trắng (không quầng) = +2 phần tử/đơn vị, ≈+0.4KB; nối liền khi xếp chồng (không vượt y 40..60), cộng dồn cho các bậc sao sau
  if (tier.star >= 3) {
    const sx = -9, sy = 51, r = 6.4, k = 1.8;
    s += `<path d="M${sx} ${sy - r} L${sx + k} ${sy - k} L${sx + r} ${sy} L${sx + k} ${sy + k} L${sx} ${sy + r} L${sx - k} ${sy + k} L${sx - r} ${sy} L${sx - k} ${sy - k} Z" fill="#ffe9a6" stroke="${tier.dark}" stroke-width="0.9" stroke-linejoin="round"/><circle cx="${sx}" cy="${sy}" r="1.3" fill="#ffffff"/>`;
  }
  // HUYỀN THOẠI ★7+ (cấp 85+, tier.star >= 7): chuỗi hạt sáng LIÊN TỤC dọc mép ngoài (x=-12): sợi chỉ mảnh suốt y 0..100 + 8 hạt cách đều 12.5 (y=6.25+12.5k → khoảng cách giữa 2 đơn vị xếp chồng vẫn đúng 12.5, nối liền không hở); hạt = quầng + hạt vàng nhạt + lõi trắng (3 nét chồng trong 1 path) = +4 phần tử/đơn vị, ≈+0.5KB; x ∈ [-14, -10] ⊂ [-15, 15]
  if (tier.star >= 7) {
    let dots = '';
    for (let k = 0; k < 8; k++) dots += `M-12 ${6.25 + k * 12.5} h0.01 `;
    s += `<path d="M-12 0 V100" stroke="#ffe9a6" stroke-opacity="0.45" stroke-width="0.8" fill="none"/>` +
      `<path d="${dots}" stroke="#ffe9a6" stroke-opacity="0.35" stroke-width="5" stroke-linecap="round"/>` +
      `<path d="${dots}" stroke="#ffe9a6" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="${dots}" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>`;
  }
  return defs + s;
}

module.exports = { sideUnit };
