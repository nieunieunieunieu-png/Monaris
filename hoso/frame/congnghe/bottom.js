// hoso/frame/congnghe/bottom.js — hoạ tiết CẠNH DƯỚI: dải thanh dữ liệu đối xứng (như bộ cân bằng âm thanh)
// Gốc toạ độ: giữa mép dưới thẻ, y xuống dưới. Vẽ ở khổ 24px rồi thu scale(0.66) -> cục bộ cao <= 16, nửa rộng <= 73 (compose.js scale 1.5, lề dưới 34px).
// Chữ ký: decorBottom(tier, W, H) -> chuỗi SVG. File tự chứa, không require file khác.

const ORDER = ['ĐỒNG', 'BẠC', 'VÀNG', 'BẠCH KIM', 'KIM CƯƠNG', 'HUYỀN THOẠI'];
const P = 'cnbottom';
const mirror = (half) => `<g>${half}</g><g transform="scale(-1 1)">${half}</g>`;

function decorBottom(tier /*, W, H */) {
  const idx = Math.max(0, ORDER.indexOf(tier.name));
  const rb = Boolean(tier.rainbow);
  const acc = tier.star >= 5 ? '#fff3c4' : (tier.accent || tier.light); // ★5+ (cấp 75+): LED nhấn đổi sang trắng-vàng
  const defs =
    `<defs><linearGradient id="${P}-g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="24"><stop offset="0" stop-color="${tier.light}"/><stop offset="0.55" stop-color="${tier.main}"/><stop offset="1" stop-color="${tier.dark}"/></linearGradient>` +
    `<linearGradient id="${P}-rb" gradientUnits="userSpaceOnUse" x1="-110" y1="0" x2="110" y2="0"><stop offset="0" stop-color="#ff6b6b"/><stop offset="0.25" stop-color="#ffd93d"/><stop offset="0.5" stop-color="#6bffb8"/><stop offset="0.75" stop-color="#6bb8ff"/><stop offset="1" stop-color="#d96bff"/></linearGradient></defs>`;
  const fillG = rb ? `url(#${P}-rb)` : `url(#${P}-g)`;
  const fill = `fill="${fillG}" stroke="${tier.dark}" stroke-width="1.2" stroke-linejoin="miter"`;

  // Chiều cao các thanh (px), từ giữa ra ngoài, thấp dần; bậc cao có nhiều thanh hơn (tối đa 8 thanh mỗi nửa)
  const bars = [
    [18, 12, 6],
    [20, 14, 8, 11],
    [22, 15, 20, 10, 6],
    [22, 16, 20, 12, 15, 7],
    [23, 17, 21, 13, 18, 9, 5],
    [24, 18, 22, 14, 20, 10, 15, 6],
  ][idx];
  let half = '';
  bars.forEach((h, i) => {
    const x = 12 + i * 12; // thanh rộng 8, cách nhau 4
    half += `<path d="M${x} 0 H${x + 8} V${h - 3} L${x + 5} ${h} H${x + 3} L${x} ${h - 3} Z" ${fill}/>`; // đầu thanh vát 45 độ
  });
  // Đường nền mảnh nối các thanh
  const w = 12 + bars.length * 12 - 4;
  half += `<path d="M0 1 H${w}" fill="none" stroke="${rb ? `url(#${P}-rb)` : tier.light}" stroke-width="1.5" stroke-linecap="round"/>`;
  // KIM CƯƠNG II (cấp 45, nửa bậc +): mỗi bên 1 ô dữ liệu cuối dải (x 96..108 trong khổ 24px → ≤ 71 sau scale 0.66) + vạch dữ liệu + LED + nối đường nền (+4 phần tử/bên)
  if (tier.step === 1 && tier.name === 'KIM CƯƠNG' && !tier.star) half += `<path d="M${w} 1 H100" fill="none" stroke="${acc}" stroke-width="1.5" stroke-linecap="round"/><rect x="96" y="4" width="12" height="10" rx="1.5" ${fill}/><path d="M98.5 7.5 H105.5 M98.5 10.5 H103.5" fill="none" stroke="${tier.dark}" stroke-width="1" stroke-linecap="round"/><circle cx="105.5" cy="10.5" r="1.3" fill="${acc}"/>`;
  // HUYỀN THOẠI ★3+ (cấp 65+): mỗi bên 1 LED nhỏ giữa lõi và thanh đầu (tâm (9.5,6) trong khổ 24px; quầng + lõi trắng) = +2 phần tử/bên; cộng dồn
  if (tier.star >= 3) half += `<circle cx="9.5" cy="6" r="2.4" fill="${acc}" fill-opacity="0.45"/><circle cx="9.5" cy="6" r="1.2" fill="#ffffff"/>`;
  // HUYỀN THOẠI ★8+ (cấp 90+): vạch đèn ngang trắng-vàng cắt ngang mỗi thanh (y=4.5, và y=9.5 với thanh cao ≥ 12) + LED cuối dải (tâm (${w + 4}, 1), khổ 24px → nửa rộng ≤ 71.3) = +3 phần tử/bên; cao ≤ 16; cộng dồn
  if (tier.star >= 8) {
    let tk = '';
    bars.forEach((h, i) => { const x = 12 + i * 12; tk += `M${x + 1.6} 4.5 H${x + 6.4} `; if (h >= 12) tk += `M${x + 1.6} 9.5 H${x + 6.4} `; });
    half += `<path d="${tk}" fill="none" stroke="#fff3c4" stroke-width="1.2" stroke-linecap="square"/><circle cx="${w + 4}" cy="1" r="2.8" fill="#fff3c4" fill-opacity="0.45"/><circle cx="${w + 4}" cy="1" r="1.5" fill="#ffffff" stroke="${tier.dark}" stroke-width="0.7"/>`;
  }
  // Lõi giữa: thoi nhỏ phát sáng
  const core = `<path d="M0 2 L7 10 L0 18 L-7 10 Z" ${fill}/><circle cx="0" cy="10" r="2" fill="${idx >= 2 ? acc : '#ffffff'}"/>`;
  return defs + `<g transform="scale(0.66)">` + mirror(half) + core + `</g>`;
}

module.exports = { decorBottom };
