// hoso/frame/linhvat/accents.js — PHỤ KIỆN góc: chân mèo và trái tim nhỏ xen kẽ (BẠCH KIM trở lên mới vẽ)
// Mỗi phụ kiện vừa ô 28x28, tâm ở (0,0), nhô ra ngoài khung.
// Chữ ký: accent(x, y, rot, tier) -> 1 phụ kiện; accent(tier, W, H) -> cả 4 phụ kiện ở 4 góc thẻ.
// File tự chứa, không require file khác.

const ORDER = ['ĐỒNG', 'BẠC', 'VÀNG', 'BẠCH KIM', 'KIM CƯƠNG', 'HUYỀN THOẠI'];
const P = 'lvacc';

function one(x, y, rot, tier) {
  const idx = ORDER.indexOf(tier.name);
  if (idx < 3) return ''; // chỉ từ BẠCH KIM
  const rb = Boolean(tier.rainbow);
  const acc = tier.accent || tier.light;
  const defs =
    `<defs><linearGradient id="${P}-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tier.light}"/><stop offset="0.55" stop-color="${tier.main}"/><stop offset="1" stop-color="${tier.dark}"/></linearGradient>` +
    `<linearGradient id="${P}-rb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6b6b"/><stop offset="0.25" stop-color="#ffd93d"/><stop offset="0.5" stop-color="#6bffb8"/><stop offset="0.75" stop-color="#6bb8ff"/><stop offset="1" stop-color="#d96bff"/></linearGradient></defs>`;
  const g = rb ? `url(#${P}-rb)` : `url(#${P}-g)`;
  const st = `stroke="${tier.dark}" stroke-width="1.3" stroke-linejoin="round"`;
  // Quy ước: góc xoay chẵn (bội 180) là chân mèo, lẻ (bội 90) là trái tim
  const isPaw = Math.round(rot / 90) % 2 === 0;
  const body = isPaw
    ? `<ellipse cx="0" cy="4" rx="8" ry="6.4" fill="${g}" ${st}/>` +
      [[-9, -3.5], [-3.2, -9], [3.2, -9], [9, -3.5]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="3.2" fill="${g}" ${st}/>`).join('') +
      `<circle cx="0" cy="4" r="2" fill="${acc}"/>`
    : `<path d="M0 11 C-15 1 -11 -10 0 -3 C11 -10 15 1 0 11 Z" fill="${g}" ${st}/>` +
      `<path d="M-6 -3 C-8 -5 -6 -7 -4 -6" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>`;
  // Chân mèo luôn đứng thẳng theo hướng ra ngoài; tim không xoay nghiêng quá
  // HUYỀN THOẠI ★2+ (cấp 60+, tier.star >= 2): 3 tia sáng chéo toả ra ngoài theo hướng góc thẻ (x, y đã nằm lệch ra ngoài góc; hướng = rot: 0 TL, 90 TR, 180 BR, 270 BL) từ r=15 → 20/24/20 (trong lề thẻ), màu nhấn viền tối mảnh + đầu hạt = +4 phần tử/góc, ≈+0.5KB
  let rays = '';
  if (tier.star >= 2) {
    const dir = { 0: [-1, -1], 90: [1, -1], 180: [1, 1], 270: [-1, 1] }[((Math.round(rot / 90) % 4) + 4) % 4 * 90];
    const base = Math.atan2(dir[1], dir[0]);
    let d = '';
    for (const [da, r1, r2] of [[-0.42, 15, 21], [0, 15.5, 25], [0.42, 15, 21]]) {
      const a = base + da;
      d += `M${(r1 * Math.cos(a)).toFixed(2)} ${(r1 * Math.sin(a)).toFixed(2)} L${(r2 * Math.cos(a)).toFixed(2)} ${(r2 * Math.sin(a)).toFixed(2)} `;
    }
    const racc = tier.star >= 5 ? '#fff3c4' : acc; // ★5+ (cấp 75+): tia đổi sang trắng-vàng
    rays = `<path d="${d}" stroke="${tier.dark}" stroke-width="3" stroke-linecap="round" fill="none"/><path d="${d}" stroke="${racc}" stroke-width="1.5" stroke-linecap="round" fill="none"/><circle cx="${(26.5 * Math.cos(base)).toFixed(2)}" cy="${(26.5 * Math.sin(base)).toFixed(2)}" r="1.6" fill="#ffffff"/>`;
  }
  // HUYỀN THOẠI ★7+ (cấp 85+, tier.star >= 7): cánh nhỏ cạnh mỗi góc: 2 cánh (3 lông vũ/cánh, dài 24/20/15, xoè quạt) mọc từ tâm phụ kiện sang hai phía vuông góc với hướng góc (nằm trong lề thẻ, dưới chân mèo/tim); lông vũ màu sáng (trắng-vàng ★5+) viền tối + cuống trắng mảnh = 6 lông + 1 path cuống = +7 phần tử/góc, ≈+1.1KB
  let wings = '';
  if (tier.star >= 7) {
    const dir7 = { 0: [-1, -1], 90: [1, -1], 180: [1, 1], 270: [-1, 1] }[((Math.round(rot / 90) % 4) + 4) % 4 * 90];
    const b7 = Math.atan2(dir7[1], dir7[0]);
    let quill = '';
    for (const sg of [-1, 1]) {
      [[0.0, 24], [0.38, 20], [0.76, 15]].forEach(([da, len]) => {
        const a = b7 + sg * (Math.PI / 2 + da * 0.55 - 0.18);
        const deg = ((a * 180) / Math.PI).toFixed(1);
        const ex = (len * Math.cos(a)).toFixed(2), ey = (len * Math.sin(a)).toFixed(2);
        const w = (len * 0.24).toFixed(2), L = len;
        wings += `<path transform="rotate(${deg})" d="M7 0 C${(L * 0.3 + 7).toFixed(2)} -${w} ${(L * 0.75 + 7).toFixed(2)} -${w} ${L + 7} 0 C${(L * 0.75 + 7).toFixed(2)} ${w} ${(L * 0.3 + 7).toFixed(2)} ${w} 7 0 Z" fill="${tier.star >= 5 ? '#fff3c4' : tier.light}" stroke="${tier.dark}" stroke-width="1" stroke-linejoin="round"/>`;
        quill += `M${(7 * Math.cos(a)).toFixed(2)} ${(7 * Math.sin(a)).toFixed(2)} L${((L + 5) * Math.cos(a)).toFixed(2)} ${((L + 5) * Math.sin(a)).toFixed(2)} `;
      });
    }
    wings += `<path d="${quill}" stroke="#ffffff" stroke-opacity="0.8" stroke-width="0.7" stroke-linecap="round" fill="none"/>`;
  }
  return `${defs}<g transform="translate(${x} ${y})">${wings}${rays}${isPaw ? `<g transform="rotate(${rot === 180 ? 25 : -25})">${body}</g>` : body}</g>`;
}

function accent(a, b, c, d) {
  if (a && typeof a === 'object') {
    const tier = a, W = b, H = c, o = 10;
    return one(-o, -o, 0, tier) + one(W + o, -o, 90, tier) + one(W + o, H + o, 180, tier) + one(-o, H + o, 270, tier);
  }
  return one(a, b, c, d);
}

module.exports = { accent };
