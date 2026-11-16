// hoso/frame/vutru/crest.js — ĐỈNH hồ sơ phong cách Vũ trụ (6 bậc, cùng bố cục: vật thể giữa + sao hai bên + chân đế)
// Hệ toạ độ: gốc ở giữa cạnh trên, x -80..80, y 0..36 (chân y=36 chạm khung). File tự chứa, không require file khác.
// Chữ ký: crestTop(tier, W, H) -> chuỗi SVG (W, H không dùng, giữ cho đồng bộ chữ ký các file).
// Bậc: Trăng lưỡi liềm · Hành tinh vành đai · Sao chổi · Tàu vũ trụ + quỹ đạo · Thiên hà xoắn ốc · Hố đen + đĩa bồi tụ.

const f = (n) => Number(n.toFixed(2));
const mirror = (half) => `<g>${half}</g><g transform="scale(-1 1)">${half}</g>`;
const P = 'vtcrest'; // tiền tố id riêng của file này

// Sao bốn cánh tâm (cx,cy), bán kính r
const star4 = (cx, cy, r, attrs) => {
  const k = r * 0.28;
  const pts = [[0, -r], [k, -k], [r, 0], [k, k], [0, r], [-k, k], [-r, 0], [-k, -k]]
    .map(([x, y]) => `${f(cx + x)} ${f(cy + y)}`);
  return `<path d="M${pts.join(' L')} Z" ${attrs}/>`;
};

const ORDER = ['ĐỒNG', 'BẠC', 'VÀNG', 'BẠCH KIM', 'KIM CƯƠNG', 'HUYỀN THOẠI'];
const FOOT_W = [52, 56, 60, 66, 72, 78]; // chân đế dài dần theo bậc

// Một đoạn cánh tay xoắn ốc của thiên hà (đĩa nghiêng: kéo giãn theo x); t0..t1 trong 0..1, tổng 0.8 vòng
function spiralArm(offset, t0 = 0, t1 = 1) {
  const pts = [];
  for (let i = 0; i <= 20; i++) {
    const t = t0 + ((t1 - t0) * i) / 20;
    const ang = offset + t * Math.PI * 1.6;
    const r = 3.5 + t * 13.5;
    pts.push(`${f(r * 2.2 * Math.cos(ang))} ${f(19 + r * 0.95 * Math.sin(ang))}`);
  }
  return `M${pts.join(' L')}`;
}

// Vương miện mini 3 mũi (★6+, TỐI THƯỢNG phóng to k): neo đáy (0,10), đỉnh giữa y≈3; đế + thân + 3 ngọc trắng ở mũi
function crown(k) {
  const a = `translate(0 10) scale(${k}) translate(0 -10)`;
  return `<g transform="${a}"><path d="M-8 10 L-8.4 4.6 L-4.2 7.4 L0 2.6 L4.2 7.4 L8.4 4.6 L8 10 Z" fill="#fff3c4" stroke="#15172a" stroke-width="0.8" stroke-linejoin="round"/>` +
    `<path d="M-8 8.4 H8" fill="none" stroke="#c9a24b" stroke-width="0.8"/>` +
    `<circle cx="-8.4" cy="4.4" r="1.1" fill="#ffffff"/><circle cx="0" cy="2.4" r="1.3" fill="#ffffff"/><circle cx="8.4" cy="4.4" r="1.1" fill="#ffffff"/></g>`;
}

function build(tier, idx) {
  const dark = tier.dark;
  const rb = Boolean(tier.rainbow) || idx === 5;
  const acc = tier.accent || '#ffffff';
  const gFill = rb ? `url(#${P}-rb)` : `url(#${P}-g)`;
  const fill = `fill="${gFill}" stroke="${dark}" stroke-width="1.4" stroke-linejoin="round"`;
  const line = `fill="none" stroke="${rb ? `url(#${P}-rb)` : tier.light}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
  const lineW = (w) => line.replace('stroke-width="2"', `stroke-width="${w}"`); // nét dày tuỳ chỉnh, không trùng thuộc tính
  const thin = `fill="none" stroke="${dark}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"`;
  const sparkle = `fill="${acc}" stroke="${dark}" stroke-width="1" stroke-linejoin="round"`;
  const dot = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${acc}" stroke="${dark}" stroke-width="1"/>`;

  // Chân đế liền khối (đầm lên viền khung), mỗi bậc dài hơn
  const fw = FOOT_W[idx];
  const foot = `<path d="M0 30 H${fw - 4} L${fw} 36 H0 Z" ${fill}/>`;
  let body = '';

  if (idx === 0) {
    // ĐỒNG — Trăng lưỡi liềm + sao
    body =
      mirror(foot + star4(26, 16, 5, sparkle) + dot(36, 25, 1.6) + `<path d="M14 30 Q24 24 34 30" ${thin}/>`) +
      `<path d="M4 8.69 A12 12 0 1 0 4 31.31 A13 13 0 0 1 4 8.69 Z" ${fill}/>` +
      star4(6.5, 20, 3.6, sparkle);
  } else if (idx === 1) {
    // BẠC — Hành tinh có vành đai (vành nghiêng, nửa trước đè lên hành tinh)
    body =
      mirror(foot + star4(34, 13, 4, sparkle) + dot(42, 26, 1.6) + `<path d="M26 31 H36" ${thin}/>`) +
      `<g transform="rotate(-16 0 20)">` +
      `<ellipse cx="0" cy="20" rx="21" ry="5.5" ${line}/>` +
      `<circle cx="0" cy="20" r="9" ${fill}/>` +
      `<path d="M-8 17.5 Q0 21 8 17.5" ${thin}/>` +
      `<path d="M-21 20 A21 5.5 0 0 0 21 20" ${line}/>` +
      `</g>`;
  } else if (idx === 2) {
    // VÀNG — Sao chổi: đầu tròn, hai đuôi xoè ra hai bên
    body =
      mirror(
        foot +
          `<path d="M5 14 Q24 10 46 31 Q22 22 4 21 Z" ${fill}/>` +
          `<path d="M3 10 Q22 3 40 13" ${line}/>` +
          `<path d="M7 19 Q30 22 56 33" ${thin}/>` +
          star4(60, 12, 4, sparkle)
      ) +
      `<circle cx="0" cy="14" r="7" ${fill}/>` +
      `<circle cx="-2.2" cy="11.8" r="2" fill="#ffffff" fill-opacity="0.85"/>`;
  } else if (idx === 3) {
    // BẠCH KIM — Tàu vũ trụ + quỹ đạo có vệ tinh
    body =
      mirror(
        foot +
          `<path d="M6 21 L14 31 L5.5 28.5 Z" ${fill}/>` +
          star4(52, 11, 4, sparkle) + dot(60, 27, 1.6)
      ) +
      `<path d="M0 3 C7 10 8 20 6 28 H-6 C-8 20 -7 10 0 3 Z" ${fill}/>` +
      `<path d="M-4 28 H4 L5 32 H-5 Z" ${fill}/>` +
      `<circle cx="0" cy="15" r="3.2" fill="${acc}" stroke="${dark}" stroke-width="1.2"/>` +
      `<g transform="rotate(-10 0 22)">` +
      `<ellipse cx="0" cy="22" rx="36" ry="7" ${line} stroke-opacity="0.75"/>` +
      `<circle cx="29.7" cy="26" r="2.4" fill="${acc}" stroke="${dark}" stroke-width="1"/>` +
      `</g>`;
    // BẠCH KIM II (cấp 35, nửa bậc +): Tàu vũ trụ y hệt + 3 sao 4 cánh mỗi bên quanh tàu (lớn/nhỏ + đốm) + 1 quỹ đạo phụ cắt chéo (+8 phần tử, y ≥ 1.6, chân vẫn y=36)
    if (tier.step === 1 && !tier.star) {
      body +=
        `<ellipse cx="0" cy="20" rx="25" ry="4.6" transform="rotate(12 0 20)" fill="none" stroke="${tier.light}" stroke-width="1.2" stroke-opacity="0.55" stroke-dasharray="2.4 2.6" stroke-linecap="round"/>` +
        mirror(star4(19, 9, 4.4, sparkle) + star4(30, 4.5, 2.6, sparkle) + dot(26, 14.5, 1.2));
    }
  } else if (idx === 4) {
    // KIM CƯƠNG — Thiên hà xoắn ốc: đĩa nghiêng, 2 cánh tay 1.5 vòng, lõi sáng
    body =
      `<g clip-path="url(#${P}-clip)">` +
      mirror(foot + star4(56, 9, 3.6, sparkle) + dot(64, 27, 1.5)) +
      `<ellipse cx="0" cy="19" rx="40" ry="16" fill="${dark}" fill-opacity="0.3" stroke="${dark}" stroke-width="1.2"/>` +
      `<path d="${spiralArm(0, 0, 0.55)}" ${lineW(3.6)}/>` + `<path d="${spiralArm(0, 0.5, 1)}" ${lineW(2)}/>` +
      `<path d="${spiralArm(Math.PI, 0, 0.55)}" ${lineW(3.6)}/>` + `<path d="${spiralArm(Math.PI, 0.5, 1)}" ${lineW(2)}/>` +
      `<circle cx="0" cy="19" r="7" fill="${tier.light}" fill-opacity="0.55"/>` +
      `<circle cx="0" cy="19" r="4" ${fill}/>` +
      // 5D (cấp 40+, tên KIM CƯƠNG; cấp 45 thừa hưởng): quỹ đạo ngoài thiên hà (ellipse rx 52 ry 17: quầng mờ + vòng đứt mảnh; y 2..36) + mỗi bên 1 sao chổi (đầu x 70, y 10; đuôi cong tới x 56, y 24) + 1 sao 4 cánh lớn nhô trên lõi (y 1.5..10.5). Mọi điểm y ≥ 1, |x| ≤ 74, chân vẫn y=36.
      `<ellipse cx="0" cy="19" rx="52" ry="17" fill="none" stroke="${acc}" stroke-opacity="0.2" stroke-width="5"/>` +
      `<ellipse cx="0" cy="19" rx="52" ry="17" fill="none" stroke="${tier.light}" stroke-opacity="0.75" stroke-width="1.1" stroke-dasharray="4 3"/>` +
      mirror(
        `<path d="M70 10 C66 15 62 20 56 24" fill="none" stroke="${dark}" stroke-width="3.6" stroke-linecap="round"/>` +
          `<path d="M70 10 C66 15 62 20 56 24" fill="none" stroke="${acc}" stroke-width="1.8" stroke-linecap="round" stroke-opacity="0.9"/>` +
          dot(70, 10, 2.6)
      ) +
      star4(0, 6, 4.5, sparkle) +
      `</g>`;
  } else {
    // HUYỀN THOẠI — Hố đen + đĩa bồi tụ cầu vồng (nửa trước đĩa đè lên hố đen) + vòng sáng uốn cong phía trên
    const disc = `fill="none" stroke="url(#${P}-rb)" stroke-width="5"`;
    // HUYỀN THOẠI ★4+ (cấp 70+): 9 tia sáng toả sau hố đen (tâm (0,18), từ -170° tới -10° mỗi 20°, tia dài 34..46 xen kẽ, kim thoi mảnh; 1 path nền cầu vồng mờ + 1 path vạch lõi trắng = +2 phần tử); cắt bởi clip y ≥ 0; vẽ DƯỚI mọi thứ khác
    let pre = '';
    if (tier.star >= 9) {
      // ★9+ (cấp 95+): hào quang tròn sau hố đen — vầng trắng-vàng tâm (0,18) r=31 mờ dần (radialGradient) + vòng đứt r=29 = +2 phần tử (+1 radialGradient trong defs); cộng dồn
      pre += `<circle cx="0" cy="18" r="31" fill="url(#${P}-halo9)"/><circle cx="0" cy="18" r="28.5" fill="none" stroke="#fff3c4" stroke-opacity="0.55" stroke-width="0.8" stroke-dasharray="1.6 3"/>`;
    }
    if (tier.star >= 4) {
      let rp = '', rl = '';
      for (let k = 0; k < 9; k += 1) {
        const a = ((-170 + 20 * k) * Math.PI) / 180, L = k % 2 === 0 ? 46 : 36, w = 0.085;
        const px = (r, da) => `${f(r * Math.cos(a + da))} ${f(18 + r * 0.8 * Math.sin(a + da))}`;
        rp += `M${px(10, 0)} L${px(L * 0.45, -w)} L${px(L, 0)} L${px(L * 0.45, w)} Z`;
        rl += `M${px(12, 0)} L${px(L * 0.9, 0)}`;
      }
      pre += `<path d="${rp}" fill="url(#${P}-rb)" fill-opacity="0.38"/><path d="${rl}" fill="none" stroke="#ffffff" stroke-opacity="0.7" stroke-width="0.7" stroke-linecap="round"/>`;
    }
    body =
      `<g clip-path="url(#${P}-clip)">` +
      pre +
      mirror(foot + star4(56, 9, 4, sparkle) + star4(67, 24, 3, sparkle) + dot(49, 28, 1.5) + `<path d="M40 31 H70" ${thin}/>`) +
      `<ellipse cx="0" cy="18" rx="38" ry="8.5" ${disc}/>` +
      `<ellipse cx="0" cy="18" rx="30" ry="6" fill="none" stroke="${tier.light}" stroke-width="1.2" stroke-opacity="0.8"/>` +
      `<circle cx="0" cy="18" r="9" fill="#0b0c18" stroke="url(#${P}-rb)" stroke-width="1.8"/>` +
      `<path d="M-38 18 A38 8.5 0 0 0 38 18" ${disc}/>` +
      `<circle cx="0" cy="18" r="2" fill="#ffffff" fill-opacity="0.9"/>` +
      // 5D (cấp 50+, tên HUYỀN THOẠI; mọi bậc sao 55–100 thừa hưởng): quỹ đạo cầu vồng ngoài (ellipse rx 56 ry 16.5: quầng mờ + vòng đứt) + vòng sáng uốn cong phía trên hố đen (lensing, đỉnh y≈4) + tia phun (jet) trắng trên đỉnh (y 1.2..9) + mỗi bên 1 sao chổi cầu vồng (đầu x 73 y 6, đuôi cong tới x 63 y 13). Mọi điểm y ≥ 1, |x| ≤ 77, chân vẫn y=36.
      `<ellipse cx="0" cy="18" rx="56" ry="16.5" fill="none" stroke="url(#${P}-rb)" stroke-opacity="0.2" stroke-width="5"/>` +
      `<ellipse cx="0" cy="18" rx="56" ry="16.5" fill="none" stroke="url(#${P}-rb)" stroke-opacity="0.85" stroke-width="1.1" stroke-dasharray="4 3"/>` +
      `<path d="M-26 11 Q0 -1 26 11" fill="none" stroke="#ffffff" stroke-opacity="0.85" stroke-width="1.3" stroke-linecap="round"/>` +
      `<path d="M-26 11 Q0 -1 26 11" fill="none" stroke="url(#${P}-rb)" stroke-opacity="0.45" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="M-2.3 9 L0 1.2 L2.3 9 Z" fill="#ffffff" fill-opacity="0.9" stroke="${dark}" stroke-width="0.6" stroke-linejoin="round"/>` +
      mirror(
        `<path d="M73 6 C70 9 66 11 63 13" fill="none" stroke="${dark}" stroke-width="3.6" stroke-linecap="round"/>` +
          `<path d="M73 6 C70 9 66 11 63 13" fill="none" stroke="url(#${P}-rb)" stroke-width="1.9" stroke-linecap="round"/>` +
          dot(73, 6, 2.6)
      ) +
      // HUYỀN THOẠI ★2+ (cấp 60+): mỗi bên 1 hành tinh nhỏ có vành đai ngồi trên quỹ đạo cầu vồng (tâm (±47, 9.1), r=3.2 + vành nghiêng + điểm sáng = 3 phần tử/bên); cộng dồn
      (tier.star >= 2 ? mirror(`<ellipse cx="47" cy="9.1" rx="6.4" ry="1.7" transform="rotate(-24 47 9.1)" fill="none" stroke="${tier.light}" stroke-width="1" stroke-opacity="0.9"/><circle cx="47" cy="9.1" r="3.2" fill="url(#${P}-g)" stroke="${dark}" stroke-width="1"/><circle cx="46" cy="8.1" r="0.9" fill="#ffffff" fill-opacity="0.9"/>`) : '') +
      // HUYỀN THOẠI ★6+ (cấp 80+): vương miện mini 3 mũi đội trên hố đen (đáy y=10, đỉnh y=3; x ±8; viền tối + 3 ngọc trắng ở mũi; đè gốc tia phun) = +4 phần tử; cộng dồn
      (tier.star >= 6 ? crown(1) : '') +
      // TỐI THƯỢNG (cấp 100, tier.max): vương miện phóng 1.15× (neo (0,10)) + ngọc đỏ giữa vành + 2 sao lớn 4 cánh trắng-vàng ở (±46, 25) (r 6; ngoài đĩa bồi tụ rx 38, dưới quỹ đạo) = +5 phần tử; vẽ SAU mọi lớp ★1–★9
      (tier.max ? crown(1.15) + `<circle cx="0" cy="8.4" r="1.7" fill="#ff4d6d" stroke="${dark}" stroke-width="0.6"/>` + mirror(star4(46, 25, 6, `fill="#fff3c4" stroke="${dark}" stroke-width="0.9" stroke-linejoin="round"`)) : '') +
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
