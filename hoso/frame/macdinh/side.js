// ===== hoso/frame/macdinh/side.js — HOẠ TIẾT CẠNH BÊN (1 đơn vị lặp) =====
// Tự chứa, không require file khác. Chữ ký sideUnit(tier, W, H) -> chuỗi SVG (id gradient tiền tố 'macdinh-side-').

const mirror = (half) => `<g>${half}</g><g transform="scale(-1 1)">${half}</g>`;

function sideUnit(tier, W, H) {
  const rb = `<linearGradient id="macdinh-side-rb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff6b6b"/><stop offset="0.25" stop-color="#ffd93d"/><stop offset="0.5" stop-color="#6bffb8"/><stop offset="0.75" stop-color="#6bb8ff"/><stop offset="1" stop-color="#d96bff"/></linearGradient>`;
  const defs = tier.rainbow ? `<defs>${rb}</defs>` : '';
  const line = `fill="none" stroke="${tier.rainbow ? 'url(#macdinh-side-rb)' : tier.light}" stroke-width="2" stroke-linecap="round"`;
  // Gốc cục bộ: giữa lề trái, 1 đơn vị cao 100px, lặp dọc. compose.js lặp ceil(H/100) lần và lật gương sang cạnh phải.
  // Nửa bậc + (ĐỒNG II, cấp 5): 1 hạt thoi ở y=96 (khe giữa 2 đơn vị lặp) nên chuỗi dọc có nhịp hạt đều mỗi 100px, vẫn nối liền.
  const plus = tier.step === 1 && tier.name === 'ĐỒNG' && !tier.star
    ? `<path d="M0 92.5 L2.6 96 L0 99.5 L-2.6 96 Z" fill="${tier.accent || tier.light}" stroke="${tier.dark}" stroke-width="0.7"/>`
    : '';
  // HUYỀN THOẠI ★3+ (cấp 65+, tier.star >= 3): sao 4 cánh nhỏ ở y=50 bên trái (x=-9, cánh 5 → x -14..-4, y 45..55; đường uốn của đơn vị chỉ lệch sang phải ở y 36..62 nên không đè) + lõi trắng = +2 phần tử/đơn vị; không vượt y 40..60 nên xếp chồng vẫn nối liền; cộng dồn cho các bậc sao sau
  const star3 = tier.star >= 3
    ? `<path d="M-9 45 L-7.6 48.6 L-4 50 L-7.6 51.4 L-9 55 L-10.4 51.4 L-14 50 L-10.4 48.6 Z" fill="${tier.accent || tier.light}" stroke="${tier.dark}" stroke-width="0.8" stroke-linejoin="round"/><circle cx="-9" cy="50" r="1.2" fill="#ffffff"/>`
    : '';
  // HUYỀN THOẠI ★7+ (cấp 85+, tier.star >= 7): chuỗi hạt sáng LIÊN TỤC dọc mép ngoài (x=-12): sợi chỉ mảnh suốt y 0..100 + 8 hạt cách đều 12.5 (y=6.25+12.5k → khoảng cách giữa 2 đơn vị xếp chồng vẫn đúng 12.5, nối liền không hở); hạt = quầng + hạt vàng nhạt + lõi trắng = +4 phần tử/đơn vị; x ∈ [-14, -10] ⊂ [-15, 15]
  let beads7 = '';
  if (tier.star >= 7) {
    let dots = '';
    for (let k = 0; k < 8; k++) dots += `M-12 ${6.25 + k * 12.5} h0.01 `;
    beads7 = `<path d="M-12 0 V100" stroke="#ffe9a6" stroke-opacity="0.45" stroke-width="0.8" fill="none"/>` +
      `<path d="${dots}" stroke="#ffe9a6" stroke-opacity="0.35" stroke-width="5" stroke-linecap="round"/>` +
      `<path d="${dots}" stroke="#ffe9a6" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="${dots}" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>`;
  }
  return `${defs}<path d="M0 10 C-7 18 -7 28 0 36 C7 44 7 54 0 62" ${line}/><path d="M0 68 C5 74 5 82 0 88" ${line} stroke-opacity="0.55"/>${plus}${star3}${beads7}`;
}

module.exports = { sideUnit };
