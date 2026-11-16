// ===== hoso/frame/macdinh/bottom.js — CẠNH DƯỚI (mây đôi) =====
// Tự chứa, không require file khác. Chữ ký decorBottom(tier, W, H) -> chuỗi SVG (id gradient tiền tố 'macdinh-bottom-').

const mirror = (half) => `<g>${half}</g><g transform="scale(-1 1)">${half}</g>`;

function decorBottom(tier, W, H) {
  const rb = `<linearGradient id="macdinh-bottom-rb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff6b6b"/><stop offset="0.25" stop-color="#ffd93d"/><stop offset="0.5" stop-color="#6bffb8"/><stop offset="0.75" stop-color="#6bb8ff"/><stop offset="1" stop-color="#d96bff"/></linearGradient>`;
  const defs = tier.rainbow ? `<defs>${rb}</defs>` : '';
  const line = `fill="none" stroke="${tier.rainbow ? 'url(#macdinh-bottom-rb)' : tier.light}" stroke-width="2" stroke-linecap="round"`;
  // Gốc cục bộ: giữa mép dưới thẻ. Cụm mây đôi, compose.js scale 1.5.
  const half =
    `<path d="M12 0 C26 -2 34 -10 46 -8 C54 -7 56 0 50 1 C46 2 44 -3 48 -4" ${line}/>` +
    `<path d="M16 -1 C30 -2 40 -6 56 -4" ${line} stroke-opacity="0.6"/>`;
  // Nửa bậc + (ĐỒNG II, cấp 5): mỗi bên thêm 1 hạt sáng + 1 vòng xoáy nhỏ ở đuôi mây (đối xứng; cao ≤ 16, nửa rộng ≤ 70).
  const plus = tier.step === 1 && tier.name === 'ĐỒNG' && !tier.star
    ? `<circle cx="64" cy="-3" r="2" fill="${tier.accent || tier.light}"/><path d="M58 4 C63 8 69 5 67 1" ${line} stroke-opacity="0.8"/>`
    : '';
  // HUYỀN THOẠI ★3+ (cấp 65+, tier.star >= 3): mỗi bên 1 sao 4 cánh nhỏ dưới đuôi mây (x=24, y=7, cánh 4.2 → y 2.8..11.2 ≤ 16; nửa rộng ≤ 70) + lõi trắng = +2 phần tử/bên (+4); đối xứng, cộng dồn cho các bậc sao sau
  const star3 = tier.star >= 3
    ? `<path d="M24 2.8 L25.2 5.8 L28.2 7 L25.2 8.2 L24 11.2 L22.8 8.2 L19.8 7 L22.8 5.8 Z" fill="${tier.accent || tier.light}" stroke="${tier.dark}" stroke-width="0.8" stroke-linejoin="round"/><circle cx="24" cy="7" r="1" fill="#ffffff"/>`
    : '';
  return `${defs}${mirror(half + plus + star3)}`;
}

module.exports = { decorBottom };
