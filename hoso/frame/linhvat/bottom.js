// hoso/frame/linhvat/bottom.js — hoạ tiết CẠNH DƯỚI: đuôi/rêu cuộn dễ thương đối xứng + trái tim ở giữa
// Gốc toạ độ: giữa mép dưới thẻ, y xuống dưới. Vẽ ở khổ 24px rồi thu scale(0.66) -> cục bộ cao <= 16, nửa rộng <= 73 (compose.js scale 1.5, lề dưới 34px).
// Chữ ký: decorBottom(tier, W, H) -> chuỗi SVG. File tự chứa, không require file khác.

const ORDER = ['ĐỒNG', 'BẠC', 'VÀNG', 'BẠCH KIM', 'KIM CƯƠNG', 'HUYỀN THOẠI'];
const P = 'lvbottom';
const mirror = (half) => `<g>${half}</g><g transform="scale(-1 1)">${half}</g>`;

function decorBottom(tier /*, W, H */) {
  const idx = Math.max(0, ORDER.indexOf(tier.name));
  const rb = Boolean(tier.rainbow);
  const acc = tier.accent || tier.light;
  const defs =
    `<defs><linearGradient id="${P}-rb" gradientUnits="userSpaceOnUse" x1="-110" y1="0" x2="110" y2="0"><stop offset="0" stop-color="#ff6b6b"/><stop offset="0.25" stop-color="#ffd93d"/><stop offset="0.5" stop-color="#6bffb8"/><stop offset="0.75" stop-color="#6bb8ff"/><stop offset="1" stop-color="#d96bff"/></linearGradient></defs>`;
  const col = rb ? `url(#${P}-rb)` : tier.light;
  const line = `fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
  const leaf = (x, y, rot, k = 1) =>
    `<path transform="translate(${x} ${y}) rotate(${rot}) scale(${k})" d="M0 0 C3 -4 8 -4 11 0 C8 4 3 4 0 0 Z" fill="${rb ? `url(#${P}-rb)` : tier.main}" stroke="${tier.dark}" stroke-width="1" stroke-linejoin="round"/>`;
  const bud = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${tier.main}" stroke="${tier.dark}" stroke-width="1"/>`;

  // Dây cuộn chính từ giữa ra ngoài, kết thúc bằng nụ tròn (≤ 24px cao)
  let half = `<path d="M14 2 C32 14 52 14 66 5 C72 1 80 5 76 11 C73 15 67 12 69 9" ${line}/>` + bud(69, 9, 2.2) + leaf(30, 11, 20);
  if (idx >= 1) half += leaf(48, 12.5, -15, 0.9);
  if (idx >= 2) half += `<path d="M78 8 C88 8 96 14 100 8" ${line}/>` + bud(100, 8, 2);
  if (idx >= 3) half += leaf(86, 11, 25, 0.9) + bud(40, 16, 1.6);
  if (idx >= 4) half += `<path d="M102 8 C106 4 110 7 108 11" ${line}/>` + bud(108, 11, 1.8);
  if (idx >= 5) half += bud(58, 17, 1.6) + bud(92, 14, 1.6);

  // HUYỀN THOẠI ★3+ (cấp 65+, tier.star >= 3): mỗi bên 1 sao 4 cánh nhỏ dưới dây cuộn (x=22, y=18, cánh 4.6, trong khổ 24px nên cục bộ vẫn ≤ 16, nửa rộng ≤ 73) + lõi trắng (không quầng) = +2 phần tử/bên (+4), ≈+0.7KB; đối xứng, cộng dồn cho các bậc sao sau
  if (tier.star >= 3) {
    const sx = 21, sy = 18, r = 5.8, k = 1.7;
    half += `<path d="M${sx} ${sy - r} L${sx + k} ${sy - k} L${sx + r} ${sy} L${sx + k} ${sy + k} L${sx} ${sy + r} L${sx - k} ${sy + k} L${sx - r} ${sy} L${sx - k} ${sy - k} Z" fill="#ffe9a6" stroke="${tier.dark}" stroke-width="1" stroke-linejoin="round"/><circle cx="${sx}" cy="${sy}" r="1.2" fill="#ffffff"/>`;
  }

  // HUYỀN THOẠI ★8+ (cấp 90+, tier.star >= 8): dải sao/cánh đối xứng mỗi bên: 1 cánh quạt 3 lông vũ (gốc x=62,y=20, xoè -35°/-8°/19°) + 2 sao 8 điểm nhỏ (x=44,y=21 cánh 3.6; x=80,y=19 cánh 4.4) trong khổ 24px nên cục bộ vẫn ≤ 16, nửa rộng ≤ 73; = +5 phần tử/bên (+10), ≈+1.2KB; cộng dồn cho các bậc sau
  if (tier.star >= 8) {
    const fth = (rot, k) => `<path transform="translate(62 20) rotate(${rot}) scale(${k})" d="M0 0 C4 -3.4 11 -3.4 15 0 C11 3.4 4 3.4 0 0 Z" fill="#fff3c4" stroke="${tier.dark}" stroke-width="0.9" stroke-linejoin="round"/>`;
    const st8 = (sx, sy, r) => { const k = r * 0.3; return `<path d="M${sx} ${sy - r} L${sx + k} ${sy - k} L${sx + r} ${sy} L${sx + k} ${sy + k} L${sx} ${sy + r} L${sx - k} ${sy + k} L${sx - r} ${sy} L${sx - k} ${sy - k} Z" fill="#ffe9a6" stroke="${tier.dark}" stroke-width="0.9" stroke-linejoin="round"/>`; };
    half += fth(-35, 0.8) + fth(-8, 1) + fth(19, 0.8) + st8(44, 21, 3.6) + st8(80, 19, 4.4);
  }

  // Trái tim nhỏ ở giữa
  const heart = `<path d="M0 17 C-10 9 -7 1 0 6 C7 1 10 9 0 17 Z" fill="${acc}" stroke="${tier.dark}" stroke-width="1.2" stroke-linejoin="round"/>`;
  return defs + `<g transform="scale(0.66)">` + mirror(half) + heart + `</g>`;
}

module.exports = { decorBottom };
