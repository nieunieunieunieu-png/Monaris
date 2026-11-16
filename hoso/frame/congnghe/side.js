// hoso/frame/congnghe/side.js — hoạ tiết CẠNH BÊN: đường mạch chạy dọc + đèn LED (lặp mỗi 100px, đầu/cuối nối liền ở x=0)
// Gốc toạ độ: giữa lề trái, rộng tối đa 30px (x -15..15). Cạnh phải do bên ghép lật gương scale(-1 1).
// Chữ ký: sideUnit(tier) -> chuỗi SVG của 1 đơn vị cao 100px. File tự chứa, không require file khác.

const ORDER = ['ĐỒNG', 'BẠC', 'VÀNG', 'BẠCH KIM', 'KIM CƯƠNG', 'HUYỀN THOẠI'];
const P = 'cnside';

function sideUnit(tier /*, W, H */) {
  const idx = Math.max(0, ORDER.indexOf(tier.name));
  const rb = Boolean(tier.rainbow);
  const acc = tier.star >= 5 ? '#fff3c4' : (tier.accent || tier.light); // ★5+ (cấp 75+): LED nhấn đổi sang trắng-vàng
  const defs = rb
    ? `<defs><linearGradient id="${P}-rb" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100"><stop offset="0" stop-color="#ff6b6b"/><stop offset="0.25" stop-color="#ffd93d"/><stop offset="0.5" stop-color="#6bffb8"/><stop offset="0.75" stop-color="#6bb8ff"/><stop offset="1" stop-color="#d96bff"/></linearGradient></defs>`
    : '';
  const col = rb ? `url(#${P}-rb)` : tier.light;
  const line = `fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
  const thin = `fill="none" stroke="${tier.main}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"`;
  const led = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${acc}" stroke="${tier.dark}" stroke-width="1"/>`;

  // Đường mạch chính: thẳng - vát 45 độ sang trái - thẳng - vát về giữa (liền ở y=0 và y=100)
  let s = `<path d="M0 0 V14 L-8 22 V46 L0 54 V100" ${line}/>`;
  s += led(-8, 34, 2.4);
  if (idx >= 1) s += `<path d="M-8 62 H-14" ${thin}/>` + `<path d="M0 74 L8 82 V92" ${thin}/>`; // nhánh phụ
  if (idx >= 2) s += `<circle cx="8" cy="92" r="2.2" fill="none" stroke="${col}" stroke-width="1.5"/>`;
  if (idx >= 3) s += `<path d="M0 62 H8" ${thin}/>` + led(0, 62, 2.2);
  if (idx >= 4) s += `<path d="M8 6 V16 L12 20 V30" ${thin}/>`;
  if (idx >= 5) s += `<path d="M-8 22 L-12.5 26.5 V40" ${line} stroke-opacity="0.8"/>` + led(-12.5, 40, 1.6) + led(8, 82, 1.8) + led(12, 30, 1.6);
  // KIM CƯƠNG II (cấp 45, nửa bậc +): ô dữ liệu nhỏ cuối nhánh phải (x 9.5..14.5, y 40..48) + nhánh neon phụ bên trái kèm LED (+6 phần tử, x -15..15, nối liền)
  if (tier.step === 1 && tier.name === 'KIM CƯƠNG' && !tier.star) {
    s += `<path d="M12 30 V40" ${thin}/>` +
      `<rect x="9.5" y="40" width="5" height="8" rx="1" fill="${tier.dark}" fill-opacity="0.85" stroke="${acc}" stroke-width="1"/>` +
      `<circle cx="12" cy="44" r="1.1" fill="#ffffff"/>` +
      `<path d="M-8 46 H-12 V56" fill="none" stroke="${acc}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.9"/>` + led(-12, 58, 1.5);
  }
  // HUYỀN THOẠI ★3+ (cấp 65+): nút dữ liệu lục giác ở giữa đường mạch y=50 (tâm (-4,50), r=4.6: viền sáng + lõi trắng, nằm trên đoạn vát) = +2 phần tử (x -15..15, nối liền); cộng dồn
  if (tier.star >= 3) {
    const hx = [0, 1, 2, 3, 4, 5].map((i) => { const a = (Math.PI / 3) * i - Math.PI / 6; return `${(-4 + 4.6 * Math.cos(a)).toFixed(2)} ${(50 + 4.6 * Math.sin(a)).toFixed(2)}`; });
    s += `<path d="M${hx.join(' L')} Z" fill="${tier.dark}" stroke="${acc}" stroke-width="1.3" stroke-linejoin="miter"/><circle cx="-4" cy="50" r="1.5" fill="#ffffff"/>`;
  }
  // HUYỀN THOẠI ★7+ (cấp 85+): chuỗi 8 hạt sáng bám đường mạch chính (y 6..95, né LED/nút y=34/50/62 và nhánh phụ), 2 path nét dài 0 (quầng + lõi) = +2 phần tử; nối liền khi xếp chồng (không đụng y=0/100)
  if (tier.star >= 7) {
    const bd = 'M0 6h0.01M0 11h0.01M-3.2 18.8h0.01M-8 27h0.01M-8 40h0.01M0 68h0.01M0 80h0.01M0 94h0.01';
    s += `<path d="${bd}" fill="none" stroke="#fff3c4" stroke-opacity="0.4" stroke-width="4.2" stroke-linecap="round"/><path d="${bd}" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>`;
  }
  return defs + s;
}

module.exports = { sideUnit };
