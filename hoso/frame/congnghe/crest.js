// hoso/frame/congnghe/crest.js — ĐỈNH hồ sơ phong cách Công nghệ hiện đại (6 bậc, cùng bố cục: thân giữa + mạch hai bên + chân đế)
// Hệ toạ độ: gốc ở giữa cạnh trên, x -80..80, y 0..36 (chân y=36 chạm khung). File tự chứa, không require file khác.
// Chữ ký: crestTop(tier, W, H) -> chuỗi SVG (W, H không dùng, giữ cho đồng bộ chữ ký các file).

const f = (n) => Number(n.toFixed(2));
const mirror = (half) => `<g>${half}</g><g transform="scale(-1 1)">${half}</g>`;
const P = 'cncrest'; // tiền tố id riêng của file này

// Hình chữ nhật cắt vát góc 45 độ (nét thẳng kiểu mạch in)
const ch = (x, y, w, h, c) =>
  `M${x + c} ${y} H${x + w - c} L${x + w} ${y + c} V${y + h - c} L${x + w - c} ${y + h} H${x + c} L${x} ${y + h - c} V${y + c} Z`;
// Lục giác đều (đỉnh nhọn lên trên), tâm (cx,cy), bán kính r
const hex = (cx, cy, r) => {
  const pts = [0, 1, 2, 3, 4, 5].map((i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return `${f(cx + r * Math.cos(a))} ${f(cy + r * Math.sin(a))}`;
  });
  return `M${pts.join(' L')} Z`;
};

const ORDER = ['ĐỒNG', 'BẠC', 'VÀNG', 'BẠCH KIM', 'KIM CƯƠNG', 'HUYỀN THOẠI'];
const FOOT_W = [52, 56, 60, 66, 72, 78]; // chân đế dài dần theo bậc

// Vương miện chip mini (★6+, TỐI THƯỢNG phóng k): neo đáy (0,10.5); thân khuyết 3 răng vuông + vạch đế + 3 LED ở răng
function crown(k) {
  return `<g transform="translate(0 10.5) scale(${k}) translate(0 -10.5)"><path d="M-8 10.5 V4.2 H-5 V7.4 H-1.6 V2.6 H1.6 V7.4 H5 V4.2 H8 V10.5 Z" fill="#fff3c4" stroke="#15172a" stroke-width="0.8" stroke-linejoin="miter"/>` +
    `<path d="M-8 8.6 H8" fill="none" stroke="#b8923a" stroke-width="0.8"/>` +
    `<path d="M-6.5 3.2h0.01M0 1.7h0.01M6.5 3.2h0.01" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/></g>`;
}

function build(tier, idx) {
  const dark = tier.dark;
  const rb = Boolean(tier.rainbow);
  const acc = tier.star >= 5 ? '#fff3c4' : (tier.accent || '#ffffff'); // ★5+ (cấp 75+): LED nhấn đổi sang trắng-vàng
  const gFill = rb ? `url(#${P}-rb)` : `url(#${P}-g)`;
  const fill = `fill="${gFill}" stroke="${dark}" stroke-width="1.4" stroke-linejoin="round"`;
  const line = `fill="none" stroke="${rb ? `url(#${P}-rb)` : tier.light}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
  const thin = `fill="none" stroke="${dark}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"`;
  const led = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${acc}" stroke="${dark}" stroke-width="1"/>`;

  // Chân đế liền khối (đầm lên viền khung), mỗi bậc dài hơn
  const fw = FOOT_W[idx];
  const foot = `<path d="M0 30 H${fw - 4} L${fw} 36 H0 Z" ${fill}/>`;
  let body = '';

  if (idx === 0) {
    // ĐỒNG — Chip + đường mạch
    body =
      mirror(foot + `<path d="M14 20 H32 L42 29" ${line}/>` + led(42, 29, 2.2) + `<path d="M14 26 H26" ${thin}/>`) +
      `<path d="${ch(-14, 10, 28, 26, 4)}" ${fill}/>` +
      `<path d="${ch(-7, 17, 14, 12, 2)}" ${thin}/>` +
      `<path d="M-9 10 V5 M-3 10 V5 M3 10 V5 M9 10 V5" ${line}/>` +
      `<circle cx="-10" cy="14.5" r="1.4" fill="${dark}"/>` +
      led(0, 23, 2.2);
  } else if (idx === 1) {
    // BẠC — Radar ăng-ten: đế, cột, chảo radar, sóng quét hai bên
    body =
      mirror(
        foot +
          `<path d="M14 24 H30 L40 30" ${line}/>` + led(40, 30, 2.2) +
          `<path d="M26 8 Q34 17 26 26" ${line} stroke-opacity="0.85"/>` +
          `<path d="M32 3 Q45 17 32 31" ${line} stroke-opacity="0.55"/>`
      ) +
      `<path d="${ch(-13, 25, 26, 11, 3)}" ${fill}/>` +
      `<path d="M0 25 V14" ${line}/>` +
      `<path d="M-19 8 C-12 24 12 24 19 8 C11 13 -11 13 -19 8 Z" ${fill}/>` +
      `<path d="M0 17 V4" ${thin}/>` +
      led(0, 3.5, 2.5);
  } else if (idx === 2) {
    // VÀNG — Đầu robot/drone: đầu cắt vát, kính ngắm, ăng-ten, hai cánh quạt drone
    body =
      mirror(
        foot +
          `<path d="${ch(15, 15, 6, 13, 1.5)}" ${fill}/>` +
          `<path d="M21 21 H40" ${line}/>` +
          `<ellipse cx="47" cy="17" rx="13" ry="2.8" ${fill}/>` +
          `<path d="M47 20 V30" ${thin}/>` + led(47, 20, 1.8)
      ) +
      `<path d="M-6 31 H6 V36 H-6 Z" ${fill}/>` +
      `<path d="${ch(-15, 10, 30, 22, 5)}" ${fill}/>` +
      `<path d="${ch(-10, 16, 20, 7, 2)}" fill="${dark}"/>` +
      led(-5, 19.5, 1.9) + led(5, 19.5, 1.9) +
      `<path d="M-6 28 H6 M-6 30.5 H6" ${thin}/>` +
      `<path d="M0 10 V3" ${line}/>` + led(0, 2.6, 2.2);
  } else if (idx === 3) {
    // BẠCH KIM — Lõi AI: lục giác phát sáng, mạch toả hai bên, chip nhỏ ở cuối mạch
    body =
      mirror(
        foot +
          `<path d="M13 18 H30 L38 10 H56" ${line}/>` + led(56, 10, 2.3) +
          `<path d="M13 24 H46" ${line}/>` +
          `<path d="${ch(46, 19, 14, 10, 2)}" ${fill}/>` + `<path d="M50 24 H56" ${thin}/>` +
          `<path d="M13 30 H24 L30 36" ${thin}/>`
      ) +
      `<path d="${hex(0, 21, 17)}" fill="none" stroke="${acc}" stroke-opacity="0.35" stroke-width="5" stroke-linejoin="round"/>` +
      `<path d="M0 6 L13 13.5 V28.5 L0 36 L-13 28.5 V13.5 Z" ${fill}/>` +
      `<path d="M0 12 L8 16.5 V25.5 L0 30 L-8 25.5 V16.5 Z" ${thin}/>` +
      `<circle cx="0" cy="21" r="6.5" fill="${acc}" fill-opacity="0.35"/>` +
      `<circle cx="0" cy="21" r="3.6" fill="#ffffff" stroke="${dark}" stroke-width="1"/>`;
  } else if (idx === 4) {
    // KIM CƯƠNG — Hologram + khiên năng lượng: bệ chiếu, chùm sáng, tinh thể nổi, khiên lưới lục giác
    body =
      mirror(
        foot +
          `<path d="M44 34 C44 16 28 6 0 3" ${line}/>` +
          `<path d="M37 34 C37 19 25 11 0 8" ${thin} stroke-dasharray="3 3"/>` +
          `<path d="${hex(31, 20, 5)} ${hex(37, 28, 4)} ${hex(22, 26, 4)}" fill="none" stroke="${tier.light}" stroke-width="1.2" stroke-linejoin="round"/>` +
          led(44, 34, 2.4) +
          `<path d="M50 33 H66 L72 36" ${line} stroke-opacity="0.7"/>`
      ) +
      `<path d="M-6 30 L-21 9 H21 L6 30 Z" fill="url(#${P}-g)" fill-opacity="0.4" stroke="${tier.light}" stroke-width="1.2"/>` +
      `<path d="M0 11 L6.5 19.5 L0 28 L-6.5 19.5 Z" ${fill}/>` +
      `<path d="${ch(-13, 30, 26, 6, 2)}" ${fill}/>` +
      led(0, 19.5, 1.8);
    // 5D (cấp 40+, tên KIM CƯƠNG; cấp 45 thừa hưởng): mỗi bên 1 vây hologram nghiêng trên chân đế (x 62..77, y 13..29) + 2 LED, và mũi tinh thể nhọn nhô trên đỉnh khiên (y 1..9) → hình dáng đỉnh đổi rõ ở thumb (+8 phần tử, y ≥ 1)
    body += mirror(
      `<path d="M62 29 L69 13 L77 13 L72 29 Z" fill="url(#${P}-g)" fill-opacity="0.55" stroke="${tier.light}" stroke-width="1.2" stroke-linejoin="round"/>` +
      `<path d="M67 27 L71.5 16" ${thin} stroke-opacity="0.8"/>` +
      led(69.5, 12.4, 1.8) + led(66, 29.6, 1.5)
    );
    body += `<path d="M-5 9.5 L0 1 L5 9.5 Z" fill="url(#${P}-g)" stroke="${tier.light}" stroke-width="1.1" stroke-linejoin="round"/>` +
      `<path d="M0 3.6 V8.4" stroke="#ffffff" stroke-opacity="0.85" stroke-width="0.9" stroke-linecap="round"/>` + led(0, 12.4, 1.5);
    // KIM CƯƠNG II (cấp 45, nửa bậc +): Hologram + khiên y hệt + mỗi bên 1 ô dữ liệu (x 50..66, y 9..19) kèm vạch dữ liệu + mạch neon phụ chạy xuống + LED cuối mạch (+8 phần tử, y ≥ 9, chân vẫn y=36)
    if (tier.step === 1 && !tier.star) {
      body += mirror(
        `<path d="${ch(50, 9, 16, 10, 2)}" ${fill}/>` +
        `<path d="M53 12.5 H62 M53 15.5 H58.5" ${thin}/>` +
        `<path d="M58 19 V26 H70" fill="none" stroke="${acc}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>` +
        led(70, 26, 1.9)
      );
    }
  } else {
    // HUYỀN THOẠI — Lõi lượng tử: hạt nhân cầu vồng, 3 vòng quỹ đạo, electron
    const cy = 20;
    const orb = (a) => `<ellipse transform="translate(0 ${cy}) rotate(${a})" rx="54" ry="8" ${line}/>`;
    const el = (a, t) => {
      const x = 54 * Math.cos(t), y = 8 * Math.sin(t), r = (a * Math.PI) / 180;
      return led(f(x * Math.cos(r) - y * Math.sin(r)), f(cy + x * Math.sin(r) + y * Math.cos(r)), 2.6);
    };
    // HUYỀN THOẠI ★4+ (cấp 70+): quạt radar quét sau lõi (cung 120° từ -150° tới -30°, bán kính 40, tâm (0,20): 1 quạt cầu vồng mờ + 1 path 5 tia quét + 3 cung đứt = +3 phần tử); ★9+ (cấp 95+): hào quang hologram tròn (vầng trắng-vàng r=31 radialGradient + lục giác đứt r=29 = +2 phần tử); vẽ DƯỚI mọi thứ khác; cắt bởi clip y ≥ 0
    let pre = '';
    if (tier.star >= 9) pre += `<circle cx="0" cy="${cy}" r="31" fill="url(#${P}-halo9)"/><path d="${hex(0, cy, 29)}" fill="none" stroke="#fff3c4" stroke-opacity="0.6" stroke-width="0.8" stroke-dasharray="2 2.6"/>`;
    if (tier.star >= 4) {
      const at = (r, deg) => `${f(r * Math.cos((deg * Math.PI) / 180))} ${f(cy + r * Math.sin((deg * Math.PI) / 180))}`;
      let rays = '', arcs = '';
      for (const d of [-150, -120, -90, -60, -30]) rays += `M${at(9, d)} L${at(40, d)} `;
      for (const r of [16, 26, 36]) arcs += `M${at(r, -150)} A${r} ${r} 0 0 1 ${at(r, -30)} `;
      pre += `<path d="M0 ${cy} L${at(40, -150)} A40 40 0 0 1 ${at(40, -30)} Z" fill="url(#${P}-rb)" fill-opacity="0.2"/><path d="${rays}" fill="none" stroke="#ffffff" stroke-opacity="0.55" stroke-width="0.8" stroke-linecap="round"/><path d="${arcs}" fill="none" stroke="${tier.light}" stroke-opacity="0.7" stroke-width="0.9" stroke-dasharray="2.4 2.4"/>`;
    }
    body =
      `<g clip-path="url(#${P}-clip)">` +
      pre +
      mirror(foot + `<path d="M64 33 H74" ${thin}/>`) +
      orb(-18) + orb(18) + orb(0) +
      el(-18, 0.6) + el(18, 2.5) + el(0, 4.9) + el(18, 5.4) +
      // 5D (cấp 50+, tên HUYỀN THOẠI; bậc sao 55–100 thừa hưởng): cung cầu vồng hologram vắt sau lõi (đỉnh y=6): quầng rộng mờ + nét lõi
      `<path d="M-68 34 Q0 -22 68 34" fill="none" stroke="url(#${P}-rb)" stroke-width="7" stroke-opacity="0.3"/>` +
      `<path d="M-68 34 Q0 -22 68 34" fill="none" stroke="url(#${P}-rb)" stroke-width="2.4" stroke-linecap="round"/>` +
      `<circle cx="0" cy="${cy}" r="9.5" fill="${dark}" fill-opacity="0.55" stroke="${tier.light}" stroke-width="1.2"/>` +
      `<path d="${hex(0, cy, 7)}" ${fill}/>` +
      `<circle cx="0" cy="${cy}" r="2.8" fill="#ffffff"/>` +
      // 5D: mỗi bên 1 vây hologram cầu vồng nghiêng trên chân đế (x 62..77, y 13..29) + 2 LED + 1 tinh thể phụ (x 6..13, y 6..16); vương miện: tinh thể giữa nhô trên lõi (y 1..10.5) + LED
      mirror(
        `<path d="M62 29 L69 13 L77 13 L72 29 Z" fill="url(#${P}-rb)" fill-opacity="0.6" stroke="${tier.light}" stroke-width="1.2" stroke-linejoin="round"/>` +
        `<path d="M67 27 L71.5 16" ${thin} stroke-opacity="0.8"/>` +
        led(69.5, 12.4, 1.8) + led(66, 29.6, 1.5) +
        `<path d="M6.5 14 L10 6 L13.5 16 Z" fill="url(#${P}-g)" stroke="${tier.light}" stroke-width="1" stroke-linejoin="round"/>`
      ) +
      `<path d="M-5.5 10.5 L0 1 L5.5 10.5 Z" fill="url(#${P}-rb)" stroke="${tier.light}" stroke-width="1.1" stroke-linejoin="round"/>` +
      `<path d="M0 3.6 V8.6" stroke="#ffffff" stroke-opacity="0.85" stroke-width="0.9" stroke-linecap="round"/>` +
      // HUYỀN THOẠI ★2+ (cấp 60+): mỗi bên 1 chip nhỏ vát (tâm (±30,4), 7×7, y 0.5..7.5) có 3 chân + LED, nằm trên cung cầu vồng = 3 phần tử/bên; cộng dồn
      (tier.star >= 2 ? mirror(`<path d="${ch(26.5, 0.8, 7, 7, 1.6)}" ${fill}/><path d="M28.5 7.8 V10 M30 7.8 V10 M31.5 7.8 V10" fill="none" stroke="${tier.light}" stroke-width="0.9" stroke-linecap="round"/>` + led(30, 4.3, 1.1)) : '') +
      // HUYỀN THOẠI ★6+ (cấp 80+): vương miện chip 3 răng đội trên tinh thể giữa (đáy y=10.5, đỉnh y≈2; x ±8) = +3 phần tử; cộng dồn
      (tier.star >= 6 ? crown(1) : '') +
      // TỐI THƯỢNG (cấp 100, tier.max): vương miện phóng 1.15× + đèn đỏ ở giữa vành + 2 nút lục giác vàng lớn ở (±46,25) (r 6.5: viền sáng + lõi + LED = 3 phần tử/bên, nằm trong quỹ đạo, trên chân đế) = +10 phần tử; vẽ SAU mọi lớp ★1–★9
      (tier.max ? crown(1.15) + `<circle cx="0" cy="8.2" r="1.6" fill="#ff4d6d" stroke="${dark}" stroke-width="0.6"/>` + mirror(`<path d="${hex(46, 25, 6.5)}" fill="#fff3c4" stroke="${dark}" stroke-width="1" stroke-linejoin="miter"/><path d="${hex(46, 25, 3.6)}" fill="${dark}" fill-opacity="0.7" stroke="#b8923a" stroke-width="0.8" stroke-linejoin="miter"/><circle cx="46" cy="25" r="1.3" fill="#ffffff"/>`) : '') +
      `</g>`;
  }
  return body;
}

function crestTop(tier /*, W, H */) {
  const idx = ORDER.indexOf(tier.name);
  if (idx < 0) return '';
  const defs =
    `<defs>` +
    `<linearGradient id="${P}-g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="36"><stop offset="0" stop-color="${tier.light}"/><stop offset="0.55" stop-color="${tier.main}"/><stop offset="1" stop-color="${tier.dark}"/></linearGradient>` +
    `<linearGradient id="${P}-rb" gradientUnits="userSpaceOnUse" x1="-80" y1="0" x2="80" y2="0"><stop offset="0" stop-color="#ff6b6b"/><stop offset="0.25" stop-color="#ffd93d"/><stop offset="0.5" stop-color="#6bffb8"/><stop offset="0.75" stop-color="#6bb8ff"/><stop offset="1" stop-color="#d96bff"/></linearGradient>` +
    (tier.star >= 9 ? `<radialGradient id="${P}-halo9" cx="0.5" cy="0.5" r="0.5"><stop offset="0.35" stop-color="#fff3c4" stop-opacity="0.4"/><stop offset="1" stop-color="#fff3c4" stop-opacity="0"/></radialGradient>` : '') +
    `<clipPath id="${P}-clip"><rect x="-80" y="0" width="160" height="36"/></clipPath>` +
    `</defs>`;
  return defs + build(tier, idx);
}

module.exports = { crestTop };
