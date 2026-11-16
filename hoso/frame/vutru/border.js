// hoso/frame/vutru/border.js — VIỀN khung + góc + ngọc phong cách Vũ trụ (viền mảnh như quỹ đạo, sao bốn cánh ở góc, ngọc là hành tinh nhỏ)
// Hệ toạ độ thẻ (0..W, 0..H). Viền chính 0..8px, viền phụ 8..22px; không vẽ gì ở 28px giữa cạnh trên (chỗ của đỉnh).
// File tự chứa (gradient/clipPath id riêng tiền tố vtborder-), không require file khác.
// Chữ ký: frameBorder(tier, W, H) -> chuỗi SVG; gem(cx, cy, r, color) -> chuỗi SVG.

const P = 'vtborder';
const RAINBOW = ['#ff6b6b', '#ffd93d', '#6bffb8', '#6bb8ff', '#d96bff'];
const ORDER = ['ĐỒNG', 'BẠC', 'VÀNG', 'BẠCH KIM', 'KIM CƯƠNG', 'HUYỀN THOẠI'];
const f = (n) => Number(n.toFixed(2));
const stops = (cols) => cols.map((c, i) => `<stop offset="${(i / (cols.length - 1)).toFixed(3)}" stop-color="${c}"/>`).join('');

// Sao bốn cánh tâm (cx,cy), bán kính r
const star4 = (cx, cy, r, attrs) => {
  const k = r * 0.28;
  const pts = [[0, -r], [k, -k], [r, 0], [k, k], [0, r], [-k, k], [-r, 0], [-k, -k]]
    .map(([x, y]) => `${f(cx + x)} ${f(cy + y)}`);
  return `<path d="M${pts.join(' L')} Z" ${attrs}/>`;
};

// Ngọc hình hành tinh nhỏ có vành đai nghiêng (nửa sau vành, hành tinh, nửa trước vành)
function gem(cx, cy, r, color) {
  const rx = f(r * 1.8);
  const ry = f(r * 0.5);
  const ring = 'fill="none" stroke="#ffffff" stroke-opacity="0.85" stroke-width="1"';
  return (
    `<g transform="rotate(-20 ${cx} ${cy})">` +
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${ring}/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="#15172a" stroke-width="1.2"/>` +
    `<path d="M${f(cx - r * 1.8)} ${cy} A${rx} ${ry} 0 0 0 ${f(cx + r * 1.8)} ${cy}" ${ring}/>` +
    `</g>`
  );
}

// 1 góc trên-trái trong ô 44x44 (3 góc còn lại lật lại): hai cung quỹ đạo ôm góc + sao bốn cánh.
// Từ BẠCH KIM thêm hai sao nhỏ, chuỗi đốm sáng và vệt sao băng ngắn
function cornerTL(tier, idx) {
  const acc = tier.accent || tier.light;
  const st = (col, w) => `fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  const starAttr = `fill="url(#${P}-fillg)" stroke="${tier.dark}" stroke-width="1.2" stroke-linejoin="round"`;
  const accAttr = `fill="${acc}" stroke="${tier.dark}" stroke-width="1" stroke-linejoin="round"`;
  let s =
    `<path d="M5 37 Q5 5 37 5" ${st(`url(#${P}-outer)`, 2.4)}/>` +
    `<path d="M11 31 Q11 11 31 11" ${st(tier.light, 1.2)}/>` +
    star4(17, 17, 9, starAttr) +
    `<circle cx="17" cy="17" r="1.8" fill="#ffffff"/>`;
  if (idx >= 3) {
    s +=
      star4(34, 15, 3.4, accAttr) +
      star4(15, 34, 3.4, accAttr) +
      `<circle cx="41" cy="9" r="1.2" fill="${tier.light}"/><circle cx="9" cy="41" r="1.2" fill="${tier.light}"/>` +
      `<path d="M40 22 L31 27 M22 40 L27 31" ${st(tier.main, 1.4)}/>`;
  }
  // HUYỀN THOẠI ★9+ (cấp 95+): NÂNG CẤP ngôi sao góc (17,17) thành tân tinh: quầng trắng-vàng r=11 + lõi ngọc r=5 (viền vàng) + chữ thập tia sáng dài 12 + điểm sáng = +4 phần tử/góc (mép trong ≤ 29 → trong ô góc 44×44); vẽ SAU sao cũ; cộng dồn
  if (tier.star >= 9) {
    s += `<circle cx="17" cy="17" r="11" fill="#fff3c4" fill-opacity="0.22"/>` +
      `<path d="M17 4.5 V29.5 M4.5 17 H29.5" fill="none" stroke="#fffbe8" stroke-width="0.9" stroke-linecap="round" stroke-opacity="0.9"/>` +
      `<circle cx="17" cy="17" r="5" fill="url(#${P}-fillg)" stroke="#fff3c4" stroke-width="1.2"/>` +
      `<circle cx="15.6" cy="15.6" r="1.5" fill="#ffffff"/>`;
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

  // (a) quầng sáng, (b) viền chính 8, (c) vạch sáng mảnh + hàng đốm sao chạy dọc viền chính
  let s =
    defs +
    `<g clip-path="url(#${P}-clip)"><rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="23" fill="none" stroke="${tier.main}" stroke-opacity="0.6" stroke-width="12" filter="url(#${P}-glow)"/></g>` +
    `<rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="23" fill="none" stroke="${stroke}" stroke-width="8"/>` +
    `<rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="23" fill="none" stroke="${tier.light}" stroke-opacity="0.85" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="0.1 15"/>` +
    `<rect x="9.5" y="9.5" width="${W - 19}" height="${H - 19}" rx="18.5" fill="none" stroke="#ffffff" stroke-opacity="0.2" stroke-width="1"/>`;

  // (d) viền phụ như một quỹ đạo: mảnh, liền, bo tròn lớn
  s += `<rect x="14" y="14" width="${W - 28}" height="${H - 28}" rx="12" fill="none" stroke="${stroke}" stroke-opacity="0.75" stroke-width="${tier.double ? 2.5 : 1.5}"/>`;
  // (e) viền thứ ba chỉ khi double: hàng chấm sao nhỏ
  if (tier.double) {
    s += `<rect x="20" y="20" width="${W - 40}" height="${H - 40}" rx="8" fill="none" stroke="${stroke}" stroke-opacity="0.55" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="0.1 7"/>`;
  }

  // HUYỀN THOẠI ★5+ (cấp 75+): vạch KÉP quỹ đạo sáng trắng-vàng bên trong viền (inset 21.5 và 23, nét 0.9/0.7, mờ 0.9/0.65; vẽ TRƯỚC góc để sao góc đè lên) = +2 phần tử; cộng dồn tới ★10
  if (tier.star >= 5) {
    s += `<rect x="21.5" y="21.5" width="${W - 43}" height="${H - 43}" rx="7.2" fill="none" stroke="#fff3c4" stroke-opacity="0.9" stroke-width="0.9"/>` +
      `<rect x="23" y="23" width="${W - 46}" height="${H - 46}" rx="6.4" fill="none" stroke="#fffbe8" stroke-opacity="0.65" stroke-width="0.7"/>`;
  }

  // Góc: vẽ 1 góc rồi lật cho 4 góc
  const c = cornerTL(tier, idx);
  s +=
    `<g>${c}</g>` +
    `<g transform="translate(${W} 0) scale(-1 1)">${c}</g>` +
    `<g transform="translate(0 ${H}) scale(1 -1)">${c}</g>` +
    `<g transform="translate(${W} ${H}) scale(-1 -1)">${c}</g>`;

  // Ngọc hành tinh: dọc cạnh trên (tránh 28px giữa của đỉnh) và cạnh dưới
  const warm = tier.accent || tier.light;
  const gc = rb ? RAINBOW : [warm, tier.light, warm, tier.light, warm];
  [72, 120].forEach((d, i) => {
    s += gem(W / 2 - d, 4, 3.4, gc[i]) + gem(W / 2 + d, 4, 3.4, gc[(i + 2) % 5]);
    s += gem(W / 2 - d, H - 4, 3.4, gc[(i + 1) % 5]) + gem(W / 2 + d, H - 4, 3.4, gc[(i + 3) % 5]);
  });
  // BẠCH KIM II (cấp 35, nửa bậc +): vạch tinh vân mảnh inset 17.5 + 4 sao nhỏ ở x=W/2±96 trên/dưới (≤ 21px vào trong, né 28px giữa của đỉnh) + 4 đốm (+9 phần tử)
  if (tier.step === 1 && tier.name === 'BẠCH KIM' && !tier.star) {
    const acc2 = tier.accent || tier.light;
    const sAttr = `fill="${acc2}" stroke="${tier.dark}" stroke-width="0.9" stroke-linejoin="round"`;
    s += `<rect x="17.5" y="17.5" width="${W - 35}" height="${H - 35}" rx="10" fill="none" stroke="${tier.light}" stroke-opacity="0.32" stroke-width="0.9" stroke-linecap="round" stroke-dasharray="9 4 1.5 4"/>`;
    for (const sx of [W / 2 - 96, W / 2 + 96]) {
      s += star4(sx, 17, 4.4, sAttr) + star4(sx, H - 17, 4.4, sAttr);
      s += `<circle cx="${f(sx + (sx < W / 2 ? -10 : 10))}" cy="17" r="1.1" fill="${tier.light}"/><circle cx="${f(sx + (sx < W / 2 ? -10 : 10))}" cy="${H - 17}" r="1.1" fill="${tier.light}"/>`;
    }
  }
  // 5D (cấp 40+, tên KIM CƯƠNG; cấp 45 thừa hưởng): lớp viền thứ TƯ mảnh (inset 24) + 2 quầng ngoài mép thẻ (x=-1.5 / -4) + 4 sao 4 cánh NHÔ RA ngoài góc thẻ (tâm -3,-3, r 7 → ra 10px)
  if (tier.name === 'KIM CƯƠNG') {
    const kAttr = `fill="${warm}" stroke="${tier.dark}" stroke-width="0.9" stroke-linejoin="round"`;
    s += `<rect x="24" y="24" width="${W - 48}" height="${H - 48}" rx="6" fill="none" stroke="${tier.light}" stroke-opacity="0.55" stroke-width="0.8"/>` +
      `<rect x="-1.5" y="-1.5" width="${W + 3}" height="${H + 3}" rx="25" fill="none" stroke="${stroke}" stroke-opacity="0.5" stroke-width="1.6"/>` +
      `<rect x="-4" y="-4" width="${W + 8}" height="${H + 8}" rx="27" fill="none" stroke="${tier.main}" stroke-opacity="0.22" stroke-width="5"/>` +
      star4(-3, -3, 7, kAttr) + star4(W + 3, -3, 7, kAttr) + star4(-3, H + 3, 7, kAttr) + star4(W + 3, H + 3, 7, kAttr);
  }
  // 5D (cấp 50+, tên HUYỀN THOẠI; mọi bậc sao 55–100 thừa hưởng): lớp viền thứ TƯ cầu vồng (inset 24) + 2 quầng cầu vồng ngoài mép thẻ (x=-1.5 / -4) + 4 sao 4 cánh trắng-vàng lớn NHÔ RA ngoài góc thẻ (tâm -3,-3, r 9 → ra 12px)
  if (tier.name === 'HUYỀN THOẠI') {
    const hAttr = `fill="#ffffff" stroke="${tier.dark}" stroke-width="1" stroke-linejoin="round"`;
    s += `<rect x="24" y="24" width="${W - 48}" height="${H - 48}" rx="6" fill="none" stroke="${stroke}" stroke-opacity="0.7" stroke-width="1"/>` +
      `<rect x="-1.5" y="-1.5" width="${W + 3}" height="${H + 3}" rx="25" fill="none" stroke="${stroke}" stroke-opacity="0.7" stroke-width="1.8"/>` +
      `<rect x="-4" y="-4" width="${W + 8}" height="${H + 8}" rx="27" fill="none" stroke="${stroke}" stroke-opacity="0.25" stroke-width="5.5"/>` +
      star4(-3, -3, 9, hAttr) + star4(W + 3, -3, 9, hAttr) + star4(-3, H + 3, 9, hAttr) + star4(W + 3, H + 3, 9, hAttr);
  }
  // HUYỀN THOẠI ★1+ (cấp 55+): 4 sao 4 cánh nhỏ trên viền ở x=64 / W-64, y=17 / H-17 (r 4.6, ≤ 22px vào trong; x=64 né ô góc 44px và sao ★ BẠCH KIM II ở W/2±96) + quầng mờ + lõi trắng = 3 phần tử/sao (+12); từ ★5 (cấp 75+) sao đổi sang trắng-vàng; vẽ SAU cùng; cộng dồn tới ★10
  if (tier.star >= 1) {
    const sacc = tier.star >= 5 ? '#fff3c4' : warm;
    for (const [x, y] of [[64, 17], [W - 64, 17], [64, H - 17], [W - 64, H - 17]]) {
      s += `<circle cx="${x}" cy="${y}" r="6.6" fill="${sacc}" fill-opacity="0.28"/>` + star4(x, y, 4.8, `fill="${sacc}" stroke="${tier.dark}" stroke-width="0.9" stroke-linejoin="round"`) + `<circle cx="${x}" cy="${y}" r="1.4" fill="#ffffff"/>`;
    }
  }
  // TỐI THƯỢNG (cấp 100, tier.max): hào quang trắng-vàng bao khung, nằm NGOÀI mép thẻ trong vùng đệm viền: 3 nét chồng quanh hình chữ nhật bo x=-2.5 (rộng 14/7/2.2, mờ 0.12/0.28/0.9; ra ngoài tối đa 9.5px) = +3 phần tử; kèm đủ các lớp ★1–★9
  if (tier.max) {
    const hr = `x="-2.5" y="-2.5" width="${W + 5}" height="${H + 5}" rx="26.5" fill="none"`;
    s += `<rect ${hr} stroke="#fff3c4" stroke-opacity="0.12" stroke-width="14"/><rect ${hr} stroke="#ffe9a6" stroke-opacity="0.28" stroke-width="7"/><rect ${hr} stroke="#fffbe8" stroke-opacity="0.9" stroke-width="2.2"/>`;
  }
  return s;
}

module.exports = { frameBorder, gem };
