// ===== hoso/frame/macdinh/border.js — VIỀN + ngọc (khung mặc định) =====
// Tự chứa. frameBorder(tier, W, H) -> SVG trong hệ toạ độ thẻ (0..W, 0..H); viền không lấn quá 22px vào trong. gem(cx, cy, r, color, dark) dùng chung.
const RB = ['#ff6b6b', '#ffd93d', '#6bffb8', '#6bb8ff', '#d96bff'];

// Trộn 2 màu #RRGGBB (t = 0 -> a, 1 -> b).
function mix(a, b, t) {
  const ch = (h, i) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  return `#${[0, 1, 2].map((i) => Math.round(ch(a, i) * (1 - t) + ch(b, i) * t).toString(16).padStart(2, '0')).join('')}`;
}
const stopsOf = (colors) => {
  const last = Math.max(1, colors.length - 1);
  return colors.map((c, i) => `<stop offset="${(i / last).toFixed(3)}" stop-color="${c}"/>`).join('');
};

// Ngọc hình thoi.
function gem(cx, cy, r, color, dark) {
  return (
    `<path d="M${cx} ${cy - r} L${cx + r} ${cy} L${cx} ${cy + r} L${cx - r} ${cy} Z" fill="${color}" stroke="${dark}" stroke-width="1.6"/>` +
    `<path d="M${cx} ${cy - r * 0.45} L${cx + r * 0.45} ${cy} L${cx} ${cy + r * 0.45} L${cx - r * 0.45} ${cy} Z" fill="#ffffff" fill-opacity="0.75"/>`
  );
}

function frameBorder(tier, W, H) {
  const id = 'macdinh-border-';
  const grad = tier.rainbow
    ? stopsOf([...RB, RB[0]])
    : stopsOf([tier.light, tier.main, mix(tier.main, tier.dark, 0.35), tier.main, tier.light, tier.main]);
  const defs =
    `<defs><linearGradient id="${id}outer" x1="0" y1="0" x2="1" y2="1">${grad}</linearGradient>` +
    `<filter id="${id}glow" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="7"/></filter>` +
    `<clipPath id="${id}clip"><rect x="0" y="0" width="${W}" height="${H}" rx="26"/></clipPath></defs>`;
  const gc = tier.rainbow ? ['#ff6b6b', '#ffd93d', '#6bffb8', '#d96bff', '#6bb8ff', '#ffd93d'] : Array(6).fill(tier.light);
  const gems =
    gem(12, 12, 9, gc[0], tier.dark) + gem(W - 12, 12, 9, gc[1], tier.dark) +
    gem(12, H - 12, 9, gc[2], tier.dark) + gem(W - 12, H - 12, 9, gc[3], tier.dark) +
    gem(W / 2, 6, 5, gc[4], tier.dark) + gem(W / 2, H - 6, 5, gc[5], tier.dark);
  // Nửa bậc + (ĐỒNG II, cấp 5): thêm 1 vạch sáng mảnh bên trong + 4 ngọc nhỏ hai bên ngọc giữa cạnh trên/dưới (cách ±100px để không bị đỉnh che) (không lấn quá 22px vào trong).
  let plus = '';
  if (tier.step === 1 && tier.name === 'ĐỒNG' && !tier.star) {
    const sg = (cx, cy) => `<path d="M${cx} ${cy - 5} L${cx + 3.8} ${cy} L${cx} ${cy + 5} L${cx - 3.8} ${cy} Z" fill="${tier.accent || tier.light}" stroke="${tier.dark}" stroke-width="0.8"/>`;
    plus =
      `<rect x="17" y="17" width="${W - 34}" height="${H - 34}" rx="12.5" fill="none" stroke="${tier.light}" stroke-opacity="0.5" stroke-width="0.8"/>` +
      [W / 2 - 100, W / 2 + 100].map((x) => sg(x, 6) + sg(x, H - 6)).join('');
  }
  // 5D (cấp 40+, tên KIM CƯƠNG; cấp 45 thừa hưởng): mỗi góc 1 ngọc thoi nhỏ NHÔ RA ngoài thẻ (tâm -3,-3, r 5 → ra ngoài 8px), lớp viền thứ TƯ mảnh (inset 25) + 2 quầng sáng ngoài mép thẻ (x=-1.5 / -4)
  if (tier.name === 'KIM CƯƠNG') {
    const acc = tier.accent || tier.light;
    plus +=
      `<rect x="25" y="25" width="${W - 50}" height="${H - 50}" rx="6" fill="none" stroke="${tier.light}" stroke-opacity="0.55" stroke-width="0.8"/>` +
      `<rect x="-1.5" y="-1.5" width="${W + 3}" height="${H + 3}" rx="27" fill="none" stroke="url(#${id}outer)" stroke-opacity="0.5" stroke-width="1.6"/>` +
      `<rect x="-4" y="-4" width="${W + 8}" height="${H + 8}" rx="29" fill="none" stroke="${tier.main}" stroke-opacity="0.22" stroke-width="5"/>` +
      gem(-3, -3, 5, acc, tier.dark) + gem(W + 3, -3, 5, acc, tier.dark) + gem(-3, H + 3, 5, acc, tier.dark) + gem(W + 3, H + 3, 5, acc, tier.dark);
  }
  // 5D (cấp 50+, tên HUYỀN THOẠI): lớp viền thứ TƯ cầu vồng (inset 25) + 2 quầng cầu vồng ngoài mép thẻ (x=-1.5 / -4) + 4 ngọc thoi cầu vồng lớn hơn NHÔ RA ngoài thẻ 10px ở 4 góc (tâm -4,-4, r 6)
  if (tier.name === 'HUYỀN THOẠI') {
    plus +=
      `<rect x="25" y="25" width="${W - 50}" height="${H - 50}" rx="6" fill="none" stroke="url(#${id}outer)" stroke-opacity="0.8" stroke-width="0.9"/>` +
      `<rect x="-1.5" y="-1.5" width="${W + 3}" height="${H + 3}" rx="27" fill="none" stroke="url(#${id}outer)" stroke-opacity="0.6" stroke-width="1.8"/>` +
      `<rect x="-4" y="-4" width="${W + 8}" height="${H + 8}" rx="29" fill="none" stroke="url(#${id}outer)" stroke-opacity="0.22" stroke-width="5"/>` +
      gem(-4, -4, 6, gc[0], tier.dark) + gem(W + 4, -4, 6, gc[1], tier.dark) + gem(-4, H + 4, 6, gc[2], tier.dark) + gem(W + 4, H + 4, 6, gc[3], tier.dark);
  }
  // HUYỀN THOẠI ★1+ (cấp 55+, tier.star >= 1): 4 sao 4 cánh nhỏ ở 4 góc trên viền chính, cách mép góc 52px (x=52 / W-52, y=4 / H-4, cánh 9 → ≤ 13px vào trong; không đè ngọc góc (12,12) r9 và ngọc giữa cạnh); quầng mờ + sao màu nhấn viền tối + lõi trắng = 3 phần tử/góc (+12); cộng dồn cho mọi bậc sao tới ★10; bậc ≤ 50 y nguyên
  if (tier.star >= 1) {
    const sa = tier.star >= 5 ? '#fff3c4' : (tier.accent || tier.light); // ★5+ (cấp 75+, mốc nửa chặng): sao góc đổi sang trắng-vàng
    const st4 = (x, y, r) => `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`;
    const star = `<circle cx="52" cy="4" r="10" fill="${sa}" fill-opacity="0.3"/><path d="${st4(52, 4, 9)}" fill="${sa}" stroke="${tier.dark}" stroke-width="0.9" stroke-linejoin="round"/><circle cx="52" cy="4" r="2" fill="#ffffff"/>`;
    plus += `<g>${star}</g><g transform="translate(${W} 0) scale(-1 1)">${star}</g><g transform="translate(0 ${H}) scale(1 -1)">${star}</g><g transform="translate(${W} ${H}) scale(-1 -1)">${star}</g>`;
  }
  // HUYỀN THOẠI ★5+ (cấp 75+, mốc nửa chặng, tier.star >= 5): vạch kép sáng trắng-vàng bên trong: 2 nét mảnh ở inset 11.8 (nét 1, mờ 0.75, bo 17) và 17.4 (nét 0.9, mờ 0.5, bo 12.5), nằm giữa các viền sẵn có (≤ 18.3px vào trong) = +2 phần tử; cộng dồn cho các bậc sao sau
  if (tier.star >= 5) {
    plus += `<rect x="11.8" y="11.8" width="${W - 23.6}" height="${H - 23.6}" rx="17" fill="none" stroke="#fff3c4" stroke-opacity="0.75" stroke-width="1"/>` +
      `<rect x="17.4" y="17.4" width="${W - 34.8}" height="${H - 34.8}" rx="12.5" fill="none" stroke="#fff3c4" stroke-opacity="0.5" stroke-width="0.9"/>`;
  }
  // HUYỀN THOẠI ★9+ (cấp 95+, tier.star >= 9): ngọc lớn ở 4 góc: nâng cấp ngọc góc (12,12) sẵn có — quầng mờ trắng-vàng r=10 + vòng vàng nhạt r=9.8 + vẽ lại ngọc thoi r=9 màu hồng #ff9ecb (màu nhấn ★9 gần trắng nên nhìn như chấm trơn) = +4 phần tử/góc; mép trong ≤ 22.3px; không đè ngọc giữa cạnh (W/2) và sao ★1 (x=52)
  if (tier.star >= 9) {
    const big = `<circle cx="12" cy="12" r="10" fill="#fff3c4" fill-opacity="0.3"/><circle cx="12" cy="12" r="9.8" fill="none" stroke="#ffe9a6" stroke-width="1"/>${gem(12, 12, 9, '#ff9ecb', tier.dark)}`;
    plus += `<g>${big}</g><g transform="translate(${W} 0) scale(-1 1)">${big}</g><g transform="translate(0 ${H}) scale(1 -1)">${big}</g><g transform="translate(${W} ${H}) scale(-1 -1)">${big}</g>`;
  }
  // TỐI THƯỢNG (cấp 100, tier.max): hào quang trắng-vàng bao khung, nằm NGOÀI mép thẻ trong vùng đệm viền (không lấn nội dung): 3 nét chồng quanh hình chữ nhật bo x=-2.5 (rộng 14/7/2.2, mờ 0.12/0.28/0.9; ra ngoài tối đa 9.5px) = +3 phần tử; kèm đủ các lớp ★1–★9 phía trên
  if (tier.max) {
    const hr = `x="-2.5" y="-2.5" width="${W + 5}" height="${H + 5}" rx="26.5" fill="none"`;
    plus += `<rect ${hr} stroke="#fff3c4" stroke-opacity="0.12" stroke-width="14"/><rect ${hr} stroke="#ffe9a6" stroke-opacity="0.28" stroke-width="7"/><rect ${hr} stroke="#fffbe8" stroke-opacity="0.9" stroke-width="2.2"/>`;
  }
  return (
    defs +
    `<g clip-path="url(#${id}clip)"><rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="23" fill="none" stroke="${tier.main}" stroke-opacity="0.7" stroke-width="12" filter="url(#${id}glow)"/></g>` +
    `<rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="23" fill="none" stroke="url(#${id}outer)" stroke-width="8"/>` +
    `<rect x="9.5" y="9.5" width="${W - 19}" height="${H - 19}" rx="19" fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="1"/>` +
    `<rect x="14" y="14" width="${W - 28}" height="${H - 28}" rx="15" fill="none" stroke="url(#${id}outer)" stroke-opacity="0.75" stroke-width="${tier.double ? 2.5 : 1.5}"/>` +
    (tier.double ? `<rect x="20" y="20" width="${W - 40}" height="${H - 40}" rx="10" fill="none" stroke="url(#${id}outer)" stroke-opacity="0.4" stroke-width="1"/>` : '') +
    gems +
    plus
  );
}

module.exports = { frameBorder, gem };
