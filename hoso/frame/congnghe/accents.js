// hoso/frame/congnghe/accents.js — PHỤ KIỆN góc: ốc lục giác (BẠCH KIM trở lên), thêm tia điện từ KIM CƯƠNG
// Mỗi phụ kiện vừa ô 28x28, tâm ở (0,0), nhô ra ngoài khung. Chỉ vẽ từ BẠCH KIM trở lên.
// Chữ ký: accent(x, y, rot, tier) -> 1 phụ kiện; accent(tier, W, H) -> cả 4 phụ kiện ở 4 góc thẻ (cho bên ghép gọi gọn).
// File tự chứa, không require file khác.

const ORDER = ['ĐỒNG', 'BẠC', 'VÀNG', 'BẠCH KIM', 'KIM CƯƠNG', 'HUYỀN THOẠI'];
const P = 'cnacc';
const f = (n) => Number(n.toFixed(2));
const hexPath = (r) => 'M' + [0, 1, 2, 3, 4, 5].map((i) => { const a = (Math.PI / 3) * i - Math.PI / 6; return `${f(r * Math.cos(a))} ${f(r * Math.sin(a))}`; }).join(' L') + ' Z';

function one(x, y, rot, tier) {
  const idx = ORDER.indexOf(tier.name);
  if (idx < 3) return ''; // chỉ từ BẠCH KIM
  const rb = Boolean(tier.rainbow);
  const acc = tier.star >= 5 ? '#fff3c4' : (tier.accent || tier.light); // ★5+ (cấp 75+): LED/tia nhấn đổi sang trắng-vàng
  const defs =
    `<defs><linearGradient id="${P}-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tier.light}"/><stop offset="0.55" stop-color="${tier.main}"/><stop offset="1" stop-color="${tier.dark}"/></linearGradient>` +
    `<linearGradient id="${P}-rb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6b6b"/><stop offset="0.25" stop-color="#ffd93d"/><stop offset="0.5" stop-color="#6bffb8"/><stop offset="0.75" stop-color="#6bb8ff"/><stop offset="1" stop-color="#d96bff"/></linearGradient></defs>`;
  const fillG = rb ? `url(#${P}-rb)` : `url(#${P}-g)`;
  // Ốc lục giác: lục giác ngoài + lỗ tròn + chấm LED
  let s =
    `<path d="${hexPath(11)}" fill="${fillG}" stroke="${tier.dark}" stroke-width="1.4" stroke-linejoin="round"/>` +
    `<circle r="5" fill="${tier.dark}" fill-opacity="0.75" stroke="${tier.light}" stroke-width="1.2"/>` +
    `<circle r="1.8" fill="${acc}"/>`;
  // Tia điện toả ra từ ốc (KIM CƯƠNG trở lên)
  if (idx >= 4) s += `<path d="M11 -2 L15 -6 L13 -1 L17 -3" fill="none" stroke="${rb ? `url(#${P}-rb)` : acc}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
  // HUYỀN THOẠI ★2+ (cấp 60+): 2 tia điện chéo phụ toả từ ốc ra hai hướng còn trống (trái-trên và dưới) = 1 nét tối đệm + 1 nét sáng (+2 phần tử); cộng dồn
  if (tier.star >= 2) {
    const bolt = 'M-9.5 -5.5 L-14 -9.5 L-12 -5 L-16.5 -7.5 M0 11 L-2.5 15.5 L0.5 14.5 L-1.5 18.5';
    s += `<path d="${bolt}" fill="none" stroke="${tier.dark}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.6"/><path d="${bolt}" fill="none" stroke="${rb ? `url(#${P}-rb)` : acc}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  // HUYỀN THOẠI ★7+ (cấp 85+): 2 cánh tản nhiệt vát (phải-dưới và trái) có gân + 1 LED ở mép cánh = +3 phần tử; cộng dồn
  if (tier.star >= 7) {
    const wing = `fill="#fff3c4" fill-opacity="0.92" stroke="${tier.dark}" stroke-width="0.8" stroke-linejoin="miter"`;
    s += `<path d="M10 3 L17 6.5 V15 L10 9.5 Z" ${wing}/><path d="M-10.5 -3.5 L-17.5 0 V8.5 L-10.5 5 Z" ${wing}/>` +
      `<path d="M12 6.5 L15 8.2 M12 9.5 L15 11.2 M-12.5 -0.5 L-15.5 1.2 M-12.5 2.5 L-15.5 4.2" fill="none" stroke="${tier.dark}" stroke-width="0.7" stroke-linecap="round"/>`;
  }
  // KIM CƯƠNG II (cấp 45, nửa bậc +): viền lục giác phụ đứt nét + mạch neon phụ chạy ra mép ô + LED cuối mạch (+3 phần tử/góc, trong ô 28x28)
  if (tier.step === 1 && tier.name === 'KIM CƯƠNG' && !tier.star) {
    s +=
      `<path d="${hexPath(13.4)}" fill="none" stroke="${tier.light}" stroke-width="0.9" stroke-dasharray="3 2.2" stroke-opacity="0.8"/>` +
      `<path d="M-5.5 9.6 V12.6 H-11.5" fill="none" stroke="${acc}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<circle cx="-12.4" cy="12.6" r="1.5" fill="#ffffff" stroke="${acc}" stroke-width="0.9"/>`;
  }
  return `${defs}<g transform="translate(${x} ${y}) rotate(${rot})">${s}</g>`;
}

function accent(a, b, c, d) {
  if (a && typeof a === 'object') {
    // accent(tier, W, H): 4 góc thẻ, tâm lệch ra ngoài 10px
    const tier = a, W = b, H = c, o = 10;
    return one(-o, -o, -90, tier) + one(W + o, -o, 0, tier) + one(W + o, H + o, 90, tier) + one(-o, H + o, 180, tier);
  }
  return one(a, b, c, d);
}

module.exports = { accent };
