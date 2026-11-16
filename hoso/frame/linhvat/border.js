// hoso/frame/linhvat/border.js — VIỀN khung + góc + ngọc phong cách Linh vật (bo tròn, viền chấm tròn, góc là bàn chân)
// Hệ toạ độ thẻ (0..W, 0..H). Viền chính 0..8px, viền phụ 8..22px; không vẽ gì ở 28px giữa cạnh trên (chỗ của đỉnh).
// File tự chứa (id tiền tố lvborder-), không require file khác.
// Chữ ký: frameBorder(tier, W, H) -> chuỗi SVG; gem(cx, cy, r, color) -> chuỗi SVG.

const P = 'lvborder';
const RAINBOW = ['#ff6b6b', '#ffd93d', '#6bffb8', '#6bb8ff', '#d96bff'];
const ORDER = ['ĐỒNG', 'BẠC', 'VÀNG', 'BẠCH KIM', 'KIM CƯƠNG', 'HUYỀN THOẠI'];
const stops = (cols) => cols.map((c, i) => `<stop offset="${(i / (cols.length - 1)).toFixed(3)}" stop-color="${c}"/>`).join('');

// Ngọc tròn bóng: viên tròn + đốm sáng trắng góc trên-trái
function gem(cx, cy, r, color) {
  return (
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="#15172a" stroke-width="1.2"/>` +
    `<circle cx="${(cx - r * 0.32).toFixed(2)}" cy="${(cy - r * 0.34).toFixed(2)}" r="${(r * 0.32).toFixed(2)}" fill="#ffffff" fill-opacity="0.9"/>`
  );
}

// Bàn chân nhỏ: đệm to + 3 ngón, tâm (0,0), rộng ~12px
const paw = (fill, dark) =>
  `<ellipse cx="0" cy="2.5" rx="4.6" ry="3.8" fill="${fill}" stroke="${dark}" stroke-width="1"/>` +
  [[-5, -3.5], [0, -6], [5, -3.5]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="${fill}" stroke="${dark}" stroke-width="1"/>`).join('');

// 1 góc trên-trái trong ô 44x44 (3 góc còn lại lật lại): nẹp cong tròn + bàn chân; từ BẠCH KIM thêm đuôi cuộn và tim nhỏ
function cornerTL(tier, idx) {
  const acc = tier.accent || tier.light;
  const st = (col, w) => `fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  let s =
    `<path d="M6 40 V22 Q6 6 22 6 H40" ${st(`url(#${P}-outer)`, 3)}/>` +
    `<path d="M11 30 V23 Q11 11 23 11 H30" ${st(tier.light, 1.5)}/>` +
    `<g transform="translate(19 19) rotate(-45)">${paw(`url(#${P}-fillg)`, tier.dark)}</g>`;
  if (idx >= 3) {
    s +=
      `<path d="M30 6 C34 2 40 3 40 8 C40 12 35 12 35 9" ${st(tier.main, 1.5)}/>` +
      `<path d="M6 30 C2 34 3 40 8 40 C12 40 12 35 9 35" ${st(tier.main, 1.5)}/>` +
      `<path d="M30 17 C27 14 27 11 29.5 11 C30.5 11 31 12 31 12 C31 12 31.5 11 32.5 11 C35 11 35 14 32 17 Z" fill="${acc}" stroke="${tier.dark}" stroke-width="1" stroke-linejoin="round"/>`;
  }
  return s;
}

function frameBorder(tier, W, H) {
  const idx = Math.max(0, ORDER.indexOf(tier.name));
  const rb = Boolean(tier.rainbow);
  const defs =
    `<defs>` +
    `<linearGradient id="${P}-outer" x1="0" y1="0" x2="1" y2="1">${rb ? stops(RAINBOW) : stops([tier.light, tier.main, tier.dark, tier.main, tier.light])}</linearGradient>` +
    `<linearGradient id="${P}-fillg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tier.light}"/><stop offset="0.55" stop-color="${tier.main}"/><stop offset="1" stop-color="${tier.dark}"/></linearGradient>` +
    `<filter id="${P}-glow" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="7"/></filter>` +
    `<clipPath id="${P}-clip"><rect x="0" y="0" width="${W}" height="${H}" rx="23"/></clipPath>` +
    `</defs>`;
  const stroke = `url(#${P}-outer)`;

  // (a) quầng sáng, (b) viền chính 8, (c) vạch sáng mảnh
  let s =
    defs +
    `<g clip-path="url(#${P}-clip)"><rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="23" fill="none" stroke="${tier.main}" stroke-opacity="0.7" stroke-width="12" filter="url(#${P}-glow)"/></g>` +
    `<rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="23" fill="none" stroke="${stroke}" stroke-width="8"/>` +
    `<rect x="9.5" y="9.5" width="${W - 19}" height="${H - 19}" rx="18.5" fill="none" stroke="#ffffff" stroke-opacity="0.25" stroke-width="1"/>`;

  // (d) viền phụ bo tròn: dải chấm tròn như hạt đậu (double: dày hơn); (e) viền thứ ba liền, chỉ khi double
  s += `<rect x="14" y="14" width="${W - 28}" height="${H - 28}" rx="15" fill="none" stroke="${stroke}" stroke-opacity="0.8" stroke-width="${tier.double ? 3 : 2.2}" stroke-linecap="round" stroke-dasharray="0.1 ${tier.double ? 7 : 8}"/>`;
  if (tier.double) s += `<rect x="20" y="20" width="${W - 40}" height="${H - 40}" rx="10" fill="none" stroke="${stroke}" stroke-opacity="0.4" stroke-width="1"/>`;

  // Góc: vẽ 1 góc rồi lật cho 4 góc
  const c = cornerTL(tier, idx);
  s +=
    `<g>${c}</g>` +
    `<g transform="translate(${W} 0) scale(-1 1)">${c}</g>` +
    `<g transform="translate(0 ${H}) scale(1 -1)">${c}</g>` +
    `<g transform="translate(${W} ${H}) scale(-1 -1)">${c}</g>`;

  // Ngọc tròn bóng: dọc cạnh trên (tránh 28px giữa của đỉnh) và cạnh dưới
  const gc = rb ? RAINBOW : Array(5).fill(tier.accent || tier.light);
  [70, 118].forEach((d, i) => {
    s += gem(W / 2 - d, 4, 3.6, gc[i]) + gem(W / 2 + d, 4, 3.6, gc[(i + 2) % 5]);
    s += gem(W / 2 - d, H - 4, 3.6, gc[(i + 1) % 5]) + gem(W / 2 + d, H - 4, 3.6, gc[(i + 3) % 5]);
  });
  // 5D (cấp 40+, tên KIM CƯƠNG; cấp 45 thừa hưởng): lớp viền thứ TƯ liền mảnh (inset 23, rx 4) + quầng ngoài mép (rect x=-2.5, nét 5 mờ 0.25) + 4 nẹp góc NHÔ RA ngoài thẻ nhỏ hơn bản HUYỀN THOẠI (ngoặc cong M-6 22 V4 Q-6 -6 4 -6 H22, nét 2.2 + lõi trắng 0.7) ; chỉ vẽ thêm, không đổi gì khác
  if (tier.name === 'KIM CƯƠNG') {
    const kb = `<path d="M-6 22 V4 Q-6 -6 4 -6 H22" fill="none" stroke="url(#${P}-outer)" stroke-width="2.2" stroke-linecap="round"/><path d="M-6 22 V4 Q-6 -6 4 -6 H22" fill="none" stroke="#ffffff" stroke-opacity="0.65" stroke-width="0.7" stroke-linecap="round"/>`;
    s += `<rect x="23" y="23" width="${W - 46}" height="${H - 46}" rx="4" fill="none" stroke="${tier.light}" stroke-opacity="0.5" stroke-width="0.8"/><rect x="-2.5" y="-2.5" width="${W + 5}" height="${H + 5}" rx="26" fill="none" stroke="${tier.main}" stroke-opacity="0.25" stroke-width="5"/>` +
      `<g>${kb}</g><g transform="translate(${W} 0) scale(-1 1)">${kb}</g><g transform="translate(0 ${H}) scale(1 -1)">${kb}</g><g transform="translate(${W} ${H}) scale(-1 -1)">${kb}</g>`;
  }
  // 5D (cấp 50+, tên HUYỀN THOẠI): (1) lớp viền thứ TƯ liền mảnh (inset 23, rx 4, nét 0.8 sáng) ; (2) quầng cầu vồng ngoài mép (rect x=-3, rộng 6, mờ 0.3); (3) 4 nẹp góc NHÔ RA ngoài thẻ: ngoặc cong M-9 26 V4 Q-9 -9 4 -9 H26 (nét 2.6 cầu vồng + lõi trắng 0.8) + 2 hạt sáng đầu nẹp = +4 phần tử/góc; bậc ≤ 45 y nguyên
  if (idx >= 5) {
    const brk = `<path d="M-9 26 V4 Q-9 -9 4 -9 H26" fill="none" stroke="url(#${P}-outer)" stroke-width="2.6" stroke-linecap="round"/><path d="M-9 26 V4 Q-9 -9 4 -9 H26" fill="none" stroke="#ffffff" stroke-opacity="0.7" stroke-width="0.8" stroke-linecap="round"/><path d="M-9 26 h0.01 M26 -9 h0.01" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round"/>`;
    s += `<rect x="23" y="23" width="${W - 46}" height="${H - 46}" rx="4" fill="none" stroke="${tier.light}" stroke-opacity="0.55" stroke-width="0.8"/><rect x="-3" y="-3" width="${W + 6}" height="${H + 6}" rx="26" fill="none" stroke="${stroke}" stroke-opacity="0.3" stroke-width="6"/>` +
      `<g>${brk}</g><g transform="translate(${W} 0) scale(-1 1)">${brk}</g><g transform="translate(0 ${H}) scale(1 -1)">${brk}</g><g transform="translate(${W} ${H}) scale(-1 -1)">${brk}</g>`;
  }
  // HUYỀN THOẠI ★1+ (cấp 55+, tier.star >= 1): 4 sao 4 cánh nhỏ ở 4 góc, đặt trên viền chính cách mép góc 52px, cánh 9 (x=52 / W-52, y=4 / H-4; ≤ 10px vào trong, không đè nẹp góc 44x44 và ngọc ở W/2±70); quầng mờ + sao màu nhấn viền tối + lõi trắng = 3 phần tử/góc (+12); cộng dồn cho mọi bậc sao tới ★10
  if (tier.star >= 1) {
    const sa = tier.accent || tier.light;
    const st4 = (x, y, r) => `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`;
    const star = `<circle cx="52" cy="4" r="10" fill="${sa}" fill-opacity="0.3"/><path d="${st4(52, 4, 9)}" fill="${sa}" stroke="${tier.dark}" stroke-width="0.9" stroke-linejoin="round"/><circle cx="52" cy="4" r="2" fill="#ffffff"/>`;
    s += `<g>${star}</g><g transform="translate(${W} 0) scale(-1 1)">${star}</g><g transform="translate(0 ${H}) scale(1 -1)">${star}</g><g transform="translate(${W} ${H}) scale(-1 -1)">${star}</g>`;
  }
  // HUYỀN THOẠI ★5+ (cấp 75+, mốc nửa chặng, tier.star >= 5): vạch kép sáng trắng-vàng bên trong: 2 nét mảnh ở inset 11.8 (nét 1, mờ 0.75) và 17.4 (nét 0.9, mờ 0.5), bo góc theo rx = 27 - inset (cùng họ các viền cũ), nằm giữa vạch trắng 9.5 / dải chấm 14 / viền 20, ≤ 18px vào trong = +2 phần tử, ≈+0.3KB; cộng dồn cho các bậc sau
  if (tier.star >= 5) {
    s += `<rect x="11.8" y="11.8" width="${W - 23.6}" height="${H - 23.6}" rx="15.2" fill="none" stroke="#fff3c4" stroke-opacity="0.75" stroke-width="1"/><rect x="17.4" y="17.4" width="${W - 34.8}" height="${H - 34.8}" rx="9.6" fill="none" stroke="#fff3c4" stroke-opacity="0.5" stroke-width="0.9"/>`;
  }
  // HUYỀN THOẠI ★9+ (cấp 95+, tier.star >= 9): ngọc lớn ở 4 góc: ngọc r=6.5 tại (15.5, 15.5) (mép trong ≤ 22px: 15.5+6.5=22), quầng mờ r=9.5 + vòng vàng nhạt r=7.8 + ngọc (gem(): tròn bóng + đốm sáng) = +4 phần tử/góc, ≈+0.9KB tổng; màu ngọc = hồng #ff9ecb (màu nhấn ★9 gần trắng nên nhìn như chấm trơn); không đè nẹp góc (nẹp ở 6..40, ngọc nằm giữa cong nẹp) và ngọc cạnh trên ở W/2±70
  if (tier.star >= 9) {
    const big = `<circle cx="15.5" cy="15.5" r="9.5" fill="#fff3c4" fill-opacity="0.3"/><circle cx="15.5" cy="15.5" r="7.8" fill="none" stroke="#ffe9a6" stroke-width="1.2"/>${gem(15.5, 15.5, 6.5, "#ff9ecb")}`;
    s += `<g>${big}</g><g transform="translate(${W} 0) scale(-1 1)">${big}</g><g transform="translate(0 ${H}) scale(1 -1)">${big}</g><g transform="translate(${W} ${H}) scale(-1 -1)">${big}</g>`;
  }
  // TỐI THƯỢNG (cấp 100, tier.max): hào quang trắng-vàng bao khung, nằm NGOÀI mép thẻ trong vùng đệm viền (không lấn nội dung): 3 nét chồng quanh hình chữ nhật bo x=-2.5 (rộng 14/7/2.2, mờ 0.12/0.28/0.9; ra ngoài tối đa 9px), cầu vồng ở nét lõi mảnh nhất → +3 phần tử, ≈+0.5KB; kèm đủ các lớp ★1–★9 phía trên
  if (tier.max) {
    const hr = `x="-2.5" y="-2.5" width="${W + 5}" height="${H + 5}" rx="26" fill="none"`;
    s += `<rect ${hr} stroke="#fff3c4" stroke-opacity="0.12" stroke-width="14"/><rect ${hr} stroke="#ffe9a6" stroke-opacity="0.28" stroke-width="7"/><rect ${hr} stroke="#fffbe8" stroke-opacity="0.9" stroke-width="2.2"/>`;
  }
  return s;
}

module.exports = { frameBorder, gem };
