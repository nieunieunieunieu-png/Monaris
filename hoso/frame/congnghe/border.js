// hoso/frame/congnghe/border.js — VIỀN khung + góc + ngọc phong cách Công nghệ hiện đại
// Hệ toạ độ thẻ (0..W, 0..H). Viền chính 0..8px, viền phụ 8..22px; không vẽ gì ở 28px giữa cạnh trên (chỗ của đỉnh).
// File tự chứa (gradient/clipPath id riêng tiền tố cnborder-), không require file khác.
// Chữ ký: frameBorder(tier, W, H) -> chuỗi SVG; gem(cx, cy, r, color) -> chuỗi SVG.

const P = 'cnborder';
const RAINBOW = ['#ff6b6b', '#ffd93d', '#6bffb8', '#6bb8ff', '#d96bff'];
const ORDER = ['ĐỒNG', 'BẠC', 'VÀNG', 'BẠCH KIM', 'KIM CƯƠNG', 'HUYỀN THOẠI'];
const stops = (cols) => cols.map((c, i) => `<stop offset="${(i / (cols.length - 1)).toFixed(3)}" stop-color="${c}"/>`).join('');

// Ngọc kiểu đèn LED: hình bát giác cắt vát + lõi sáng
function gem(cx, cy, r, color) {
  const c = r * 0.42;
  const d = `M${cx - r + c} ${cy - r} H${cx + r - c} L${cx + r} ${cy - r + c} V${cy + r - c} L${cx + r - c} ${cy + r} H${cx - r + c} L${cx - r} ${cy + r - c} V${cy - r + c} Z`;
  return `<path d="${d}" fill="${color}" stroke="#15172a" stroke-width="1.2"/><circle cx="${cx}" cy="${cy}" r="${(r * 0.3).toFixed(2)}" fill="#ffffff"/>`;
}

// Khung cắt vát 45 độ (viền phụ): inset i, vát c
const chamfer = (i, c, W, H) =>
  `M${i + c} ${i} H${W - i - c} L${W - i} ${i + c} V${H - i - c} L${W - i - c} ${H - i} H${i + c} L${i} ${H - i - c} V${i + c} Z`;

// 1 góc trên-trái trong ô 44x44 (3 góc còn lại lật lại): nẹp mạch, đầu mạch, đèn LED. Từ BẠCH KIM thêm nhánh mạch + chip nhỏ
function cornerTL(tier, idx) {
  const acc = tier.accent || tier.light;
  const st = (col, w) => `fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  let s =
    `<path d="M6 40 V17 L17 6 H40" ${st(`url(#${P}-outer)`, 3)}/>` +
    `<path d="M11 30 V20 L20 11 H30" ${st(tier.light, 1.5)}/>` +
    gem(17, 17, 4.2, acc);
  if (idx >= 3) {
    s +=
      `<path d="M23 6 V1 M6 23 H1" ${st(tier.main, 1.5)}/>` +
      `<path d="M40 6 L43 9 V14 H38 M6 40 L9 43 H14 V38" ${st(tier.light, 1.5)}/>` +
      `<path d="M28 15 h8 v8 h-8 z" fill="url(#${P}-fillg)" stroke="${tier.dark}" stroke-width="1" stroke-linejoin="round"/>`;
  }
  // 5D (cấp 40+, tên KIM CƯƠNG; cấp 45 thừa hưởng): nẹp góc ngoặc vuông vát NHÔ RA ngoài thẻ 9px (3 nét: tối + sáng + lõi trắng) + LED ở đỉnh nẹp (+4 phần tử/góc)
  if (tier.name === 'KIM CƯƠNG') {
    s += `<path d="M-5 32 V-1 L-1 -5 H32" ${st(tier.dark, 5)} stroke-opacity="0.8"/>` +
      `<path d="M-5 32 V-1 L-1 -5 H32" ${st(`url(#${P}-outer)`, 3)}/>` +
      `<path d="M-5 24 V-1 L-1 -5 H24" ${st('#ffffff', 0.9)} stroke-opacity="0.75"/>` +
      `<circle cx="-3" cy="-3" r="2.6" fill="${acc}" stroke="${tier.dark}" stroke-width="0.9"/>`;
  }
  // 5D (cấp 50+, tên HUYỀN THOẠI): nẹp góc ngoặc vuông vát, cầu vồng, NHÔ RA ngoài thẻ 9px (nét tối + cầu vồng + lõi trắng) + LED ở đỉnh nẹp (+4 phần tử/góc)
  if (tier.name === 'HUYỀN THOẠI') {
    s += `<path d="M-5 32 V-1 L-1 -5 H32" ${st(tier.dark, 5)} stroke-opacity="0.8"/>` +
      `<path d="M-5 32 V-1 L-1 -5 H32" ${st(`url(#${P}-outer)`, 3)}/>` +
      `<path d="M-5 24 V-1 L-1 -5 H24" ${st('#ffffff', 0.9)} stroke-opacity="0.8"/>` +
      `<circle cx="-3" cy="-3" r="2.8" fill="#ffffff" stroke="${tier.dark}" stroke-width="0.9"/>`;
  }
  // KIM CƯƠNG II (cấp 45, nửa bậc +): 2 LED (1 nét, đầu tròn) ở đầu 2 chân mạch của góc → +4 phần tử sau khi lật 4 góc
  if (tier.step === 1 && tier.name === 'KIM CƯƠNG' && !tier.star) s += `<path d="M23 1 h0.01 M1 23 h0.01" stroke="${acc}" stroke-width="3.4" stroke-linecap="round"/>`;
  // HUYỀN THOẠI ★9+ (cấp 95+): NÂNG CẤP LED góc (17,17) thành ngọc lớn r=7 trắng-vàng (quầng r=11 + ngọc bát giác vát + lõi + vạch chữ thập mảnh = +4 phần tử/góc; mép trong ≤ 28 → trong ô góc 44×44); vẽ SAU LED cũ; cộng dồn
  if (tier.star >= 9) {
    s += `<circle cx="17" cy="17" r="11" fill="#fff3c4" fill-opacity="0.22"/>` + gem(17, 17, 7, '#fff3c4') +
      `<path d="M17 6 V28 M6 17 H28" fill="none" stroke="#fffbe8" stroke-width="0.7" stroke-opacity="0.8"/>`;
  }
  return s;
}

function frameBorder(tier, W, H) {
  const idx = Math.max(0, ORDER.indexOf(tier.name));
  const rb = Boolean(tier.rainbow);
  const outerStops = rb ? stops(RAINBOW) : stops([tier.light, tier.main, tier.dark, tier.main, tier.light]);
  const defs =
    `<defs>` +
    `<linearGradient id="${P}-outer" x1="0" y1="0" x2="1" y2="1">${outerStops}</linearGradient>` +
    `<linearGradient id="${P}-fillg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tier.light}"/><stop offset="0.55" stop-color="${tier.main}"/><stop offset="1" stop-color="${tier.dark}"/></linearGradient>` +
    `<filter id="${P}-glow" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="7"/></filter>` +
    `<clipPath id="${P}-clip"><rect x="0" y="0" width="${W}" height="${H}" rx="23"/></clipPath>` +
    `</defs>`;
  const stroke = `url(#${P}-outer)`;

  // (a) quầng sáng, (b) viền chính 8, (c) vạch sáng mảnh + xung dữ liệu chạy dọc viền
  let s =
    defs +
    `<g clip-path="url(#${P}-clip)"><rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="23" fill="none" stroke="${tier.main}" stroke-opacity="0.7" stroke-width="12" filter="url(#${P}-glow)"/></g>` +
    `<rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="23" fill="none" stroke="${stroke}" stroke-width="8"/>` +
    `<rect x="9.5" y="9.5" width="${W - 19}" height="${H - 19}" rx="18.5" fill="none" stroke="#ffffff" stroke-opacity="0.2" stroke-width="1"/>` +
    `<rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="23" fill="none" stroke="${tier.dark}" stroke-opacity="0.55" stroke-width="2" stroke-dasharray="2 12"/>`;

  // (d) viền phụ cắt vát 45 độ, đứt quãng như dữ liệu chạy (liền hẳn ở bậc BẠCH KIM trở lên mỗi đoạn dài hơn)
  s += `<path d="${chamfer(14, 12, W, H)}" fill="none" stroke="${stroke}" stroke-opacity="0.75" stroke-width="${tier.double ? 2.5 : 1.5}" stroke-dasharray="${tier.double ? '46 6 8 6' : '30 6 6 6'}" stroke-linejoin="miter"/>`;
  // (e) viền thứ ba chỉ khi double
  if (tier.double) s += `<path d="${chamfer(20, 8, W, H)}" fill="none" stroke="${stroke}" stroke-opacity="0.4" stroke-width="1" stroke-linejoin="miter"/>`;

  // HUYỀN THOẠI ★5+ (cấp 75+): vạch KÉP sáng trắng-vàng bên trong viền (chamfer inset 21.6 vát 7 và inset 25.2 vát 4.5; nét 0.8/0.6; vẽ TRƯỚC góc) = +2 phần tử; cộng dồn tới ★10
  if (tier.star >= 5) {
    s += `<path d="${chamfer(21.6, 7, W, H)}" fill="none" stroke="#fff3c4" stroke-opacity="0.9" stroke-width="0.8" stroke-linejoin="miter"/>` +
      `<path d="${chamfer(25.2, 4.5, W, H)}" fill="none" stroke="#fffbe8" stroke-opacity="0.65" stroke-width="0.6" stroke-linejoin="miter"/>`;
  }

  // Góc: vẽ 1 góc rồi lật cho 4 góc
  const c = cornerTL(tier, idx);
  s +=
    `<g>${c}</g>` +
    `<g transform="translate(${W} 0) scale(-1 1)">${c}</g>` +
    `<g transform="translate(0 ${H}) scale(1 -1)">${c}</g>` +
    `<g transform="translate(${W} ${H}) scale(-1 -1)">${c}</g>`;

  // Ngọc LED: dọc cạnh trên (tránh 28px giữa của đỉnh) và cạnh dưới
  const gc = rb ? RAINBOW : Array(5).fill(tier.accent || tier.light);
  const dx = [72, 120];
  dx.forEach((d, i) => {
    s += gem(W / 2 - d, 4, 3.4, gc[i]) + gem(W / 2 + d, 4, 3.4, gc[(i + 2) % 5]);
    s += gem(W / 2 - d, H - 4, 3.4, gc[(i + 1) % 5]) + gem(W / 2 + d, H - 4, 3.4, gc[(i + 3) % 5]);
  });
  // KIM CƯƠNG II: mạch neon phụ inset 17.5 (nét đứt dài-ngắn) + 4 ô dữ liệu nhỏ ở x=W/2±96 trên/dưới (y 14..20, né 28px giữa của đỉnh) (+5 phần tử; cùng 4 LED góc = +9)
  if (tier.step === 1 && tier.name === 'KIM CƯƠNG' && !tier.star) {
    const acc2 = tier.accent || tier.light;
    s += `<path d="${chamfer(17.5, 10, W, H)}" fill="none" stroke="${acc2}" stroke-opacity="0.4" stroke-width="0.9" stroke-dasharray="14 4 2 4" stroke-linejoin="miter"/>`;
    for (const sx of [W / 2 - 96, W / 2 + 96]) {
      s += `<rect x="${sx - 8}" y="14" width="16" height="6" rx="1" fill="${tier.dark}" fill-opacity="0.85" stroke="${acc2}" stroke-width="1"/>`;
      s += `<rect x="${sx - 8}" y="${H - 20}" width="16" height="6" rx="1" fill="${tier.dark}" fill-opacity="0.85" stroke="${acc2}" stroke-width="1"/>`;
    }
  }
  // 5D (cấp 40+): lớp viền thứ TƯ liền (inset 23, vát 6, nét 0.8) + quầng sáng ngoài mép thẻ (2 nét x=-1.5 / -4, mờ 0.4 / 0.14) → viền dày 4 lớp
  if (tier.name === 'KIM CƯƠNG') {
    const ac = tier.light;
    s += `<path d="${chamfer(23, 6, W, H)}" fill="none" stroke="${tier.light}" stroke-opacity="0.7" stroke-width="0.8" stroke-linejoin="miter"/>`;
    s += `<rect x="-1.5" y="-1.5" width="${W + 3}" height="${H + 3}" rx="25" fill="none" stroke="${ac}" stroke-opacity="0.5" stroke-width="1.6"/>`;
    s += `<rect x="-4" y="-4" width="${W + 8}" height="${H + 8}" rx="27" fill="none" stroke="${tier.main}" stroke-opacity="0.22" stroke-width="5"/>`;
  }
  // 5D (cấp 50+, tên HUYỀN THOẠI): lớp viền thứ TƯ cầu vồng (inset 23, vát 6, nét 0.9) + 2 quầng ngoài mép thẻ (x=-1.5 / -4, cầu vồng mờ) → viền dày 4 lớp rực
  if (tier.name === 'HUYỀN THOẠI') {
    s += `<path d="${chamfer(23, 6, W, H)}" fill="none" stroke="${stroke}" stroke-opacity="0.8" stroke-width="0.9" stroke-linejoin="miter"/>`;
    s += `<rect x="-1.5" y="-1.5" width="${W + 3}" height="${H + 3}" rx="25" fill="none" stroke="${stroke}" stroke-opacity="0.55" stroke-width="1.6"/>`;
    s += `<rect x="-4" y="-4" width="${W + 8}" height="${H + 8}" rx="27" fill="none" stroke="${stroke}" stroke-opacity="0.2" stroke-width="5"/>`;
  }
  // HUYỀN THOẠI ★1+ (cấp 55+): 4 đèn LED bát giác ở x=64 / W-64, y=17 / H-17 (r 3.8, ≤ 21px vào trong; x=64 né ô góc 44px và ô dữ liệu KIM CƯƠNG II) + quầng mờ = 3 phần tử/đèn (+12); từ ★5 (cấp 75+) đèn đổi sang trắng-vàng; vẽ SAU cùng; cộng dồn tới ★10
  if (tier.star >= 1) {
    const sacc = tier.star >= 5 ? '#fff3c4' : (tier.accent || tier.light);
    for (const [x, y] of [[64, 17], [W - 64, 17], [64, H - 17], [W - 64, H - 17]]) s += `<circle cx="${x}" cy="${y}" r="7" fill="${sacc}" fill-opacity="0.28"/>` + gem(x, y, 3.8, sacc);
  }
  // TỐI THƯỢNG (cấp 100, tier.max): hào quang trắng-vàng bao khung, NGOÀI mép thẻ trong vùng đệm viền: 3 nét chồng quanh hình chữ nhật bo x=-2.5 (rộng 14/7/2.2, mờ 0.12/0.28/0.9; ra ngoài tối đa 9.5px) = +3 phần tử; kèm đủ các lớp ★1–★9
  if (tier.max) {
    const hr = `x="-2.5" y="-2.5" width="${W + 5}" height="${H + 5}" rx="26.5" fill="none"`;
    s += `<rect ${hr} stroke="#fff3c4" stroke-opacity="0.12" stroke-width="14"/><rect ${hr} stroke="#ffe9a6" stroke-opacity="0.28" stroke-width="7"/><rect ${hr} stroke="#fffbe8" stroke-opacity="0.9" stroke-width="2.2"/>`;
  }
  return s;
}

module.exports = { frameBorder, gem };
