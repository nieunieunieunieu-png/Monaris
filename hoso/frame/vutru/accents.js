// hoso/frame/vutru/accents.js — PHỤ KIỆN góc phong cách Vũ trụ: sao bốn cánh kèm vệt sao băng hướng vào tâm thẻ (BẠCH KIM trở lên)
// Mỗi phụ kiện vừa ô 28x28, tâm ở (0,0), nhô ra ngoài khung. Chỉ vẽ từ BẠCH KIM trở lên.
// Chữ ký: accent(x, y, rot, tier) -> 1 phụ kiện; accent(tier, W, H) -> cả 4 phụ kiện ở 4 góc thẻ (cho bên ghép gọi gọn).
// File tự chứa, không require file khác.

const ORDER = ['ĐỒNG', 'BẠC', 'VÀNG', 'BẠCH KIM', 'KIM CƯƠNG', 'HUYỀN THOẠI'];
const P = 'vtacc';
const f = (n) => Number(n.toFixed(2));

// Sao bốn cánh tâm (cx,cy), bán kính r
const star4 = (cx, cy, r, attrs) => {
  const k = r * 0.28;
  const pts = [[0, -r], [k, -k], [r, 0], [k, k], [0, r], [-k, k], [-r, 0], [-k, -k]]
    .map(([x, y]) => `${f(cx + x)} ${f(cy + y)}`);
  return `<path d="M${pts.join(' L')} Z" ${attrs}/>`;
};

// defs dùng chung cho cả 4 phụ kiện (chỉ phát 1 lần mỗi lần gọi)
const defsOf = (tier) =>
  `<defs>` +
  `<linearGradient id="${P}-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tier.light}"/><stop offset="0.55" stop-color="${tier.main}"/><stop offset="1" stop-color="${tier.dark}"/></linearGradient>` +
  `<linearGradient id="${P}-rb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6b6b"/><stop offset="0.25" stop-color="#ffd93d"/><stop offset="0.5" stop-color="#6bffb8"/><stop offset="0.75" stop-color="#6bb8ff"/><stop offset="1" stop-color="#d96bff"/></linearGradient>` +
  `</defs>`;

function one(x, y, rot, tier, withDefs) {
  const idx = ORDER.indexOf(tier.name);
  if (idx < 3) return ''; // chỉ từ BẠCH KIM
  const rb = Boolean(tier.rainbow);
  const acc = tier.star >= 5 ? '#fff3c4' : (tier.accent || tier.light); // ★5+ (cấp 75+): sao nhấn đổi sang trắng-vàng
  const dark = tier.dark;
  const fillG = rb ? `url(#${P}-rb)` : `url(#${P}-g)`;
  const tailCol = rb ? `url(#${P}-rb)` : tier.light;

  // Vệt sao băng: tam giác thon từ sao (3,-3) về phía (-12,12) = hướng vào tâm thẻ sau khi xoay theo góc
  let s =
    `<path d="M4.7 -1.3 L-12 12 L1.3 -4.7 Z" fill="${tailCol}" fill-opacity="0.85" stroke="${dark}" stroke-width="0.8" stroke-linejoin="round"/>` +
    star4(3, -3, 7.5, `fill="${fillG}" stroke="${dark}" stroke-width="1.4" stroke-linejoin="round"`) +
    `<circle cx="3" cy="-3" r="1.8" fill="#ffffff"/>`;
  // KIM CƯƠNG trở lên: thêm vệt phụ mảnh song song và sao nhỏ màu nhấn
  if (idx >= 4) {
    s +=
      `<path d="M8 3 L-3 13" fill="none" stroke="${tailCol}" stroke-width="1.4" stroke-linecap="round" stroke-opacity="0.8"/>` +
      star4(-8, -8, 2.8, `fill="${acc}" stroke="${dark}" stroke-width="1" stroke-linejoin="round"`);
  }
  // HUYỀN THOẠI: thêm sao thứ hai và đốm sáng
  if (idx >= 5) {
    s +=
      star4(11, 8, 2.4, `fill="${acc}" stroke="${dark}" stroke-width="1" stroke-linejoin="round"`) +
      `<circle cx="-12" cy="-2" r="1.2" fill="#ffffff"/>`;
  }
  // HUYỀN THOẠI ★2+ (cấp 60+): 2 vệt sao băng chéo song song với đuôi sao (1 nét tối đệm + 1 nét sáng mỗi vệt gộp trong 2 path) = +2 phần tử; cộng dồn
  if (tier.star >= 2) {
    s += `<path d="M14.5 -9 L7.5 -2.5 M-14 3 L-9.5 7.5" fill="none" stroke="${dark}" stroke-width="2.8" stroke-linecap="round" stroke-opacity="0.5"/>` +
      `<path d="M14.5 -9 L7.5 -2.5 M-14 3 L-9.5 7.5" fill="none" stroke="${rb ? `url(#${P}-rb)` : acc}" stroke-width="1.3" stroke-linecap="round"/>`;
  }
  // HUYỀN THOẠI ★7+ (cấp 85+): cánh tinh vân — 2 cánh lông 3 nhịp vươn ra hai bên sao chính (phải-xuống / trái-lên, vuông góc đuôi sao), viền tối + gân sáng = +3 phần tử; vẽ dưới sao nhấn ★ KIM CƯƠNG+; cộng dồn
  if (tier.star >= 7) {
    const wing = `fill="#fff3c4" fill-opacity="0.92" stroke="${dark}" stroke-width="0.7" stroke-linejoin="round"`;
    s += `<path d="M5.5 -0.5 Q10 -0.5 14.5 4.5 Q10.5 3.6 8.8 5.6 Q9.2 2.8 5.5 0.8 Z" ${wing}/>` +
      `<path d="M0.5 -5.5 Q0.5 -10 -4.5 -14.5 Q-3.6 -10.5 -5.6 -8.8 Q-2.8 -9.2 -0.8 -5.5 Z" ${wing}/>` +
      `<path d="M6 0.2 Q10 1.2 13 4M0.2 -6 Q1.2 -10 4 -13" fill="none" stroke="#ffffff" stroke-width="0.6" stroke-linecap="round" stroke-opacity="0.9"/>`;
  }
  // Nửa bậc + (BẠCH KIM II, cấp 35): thêm 1 đốm sao nhỏ lấp lánh cạnh sao chính (tinh vân li ti).
  if (tier.step === 1 && tier.name === 'BẠCH KIM' && !tier.star) {
    s += star4(13, -4, 1.8, `fill="${acc}" stroke="${dark}" stroke-width="0.7" stroke-linejoin="round"`) + `<circle cx="9" cy="-9" r="1" fill="#ffffff" fill-opacity="0.9"/>`;
  }
  return `${withDefs ? defsOf(tier) : ''}<g transform="translate(${x} ${y}) rotate(${rot})">${s}</g>`;
}

function accent(a, b, c, d) {
  if (a && typeof a === 'object') {
    // accent(tier, W, H): 4 góc thẻ, tâm lệch ra ngoài 6px; defs chỉ phát 1 lần
    const tier = a, W = b, H = c, o = 6;
    if (ORDER.indexOf(tier.name) < 3) return '';
    return defsOf(tier) + one(-o, -o, -90, tier, false) + one(W + o, -o, 0, tier, false) + one(W + o, H + o, 90, tier, false) + one(-o, H + o, 180, tier, false);
  }
  return one(a, b, c, d, true);
}

module.exports = { accent };
