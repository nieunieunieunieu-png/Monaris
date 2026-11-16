// hoso/frame/linhvat/crest.js — ĐỈNH hồ sơ phong cách Linh vật (chibi dễ thương, giữ đúng 6 con):
// Thần Quy · Bạch Hổ · Phượng Hoàng · Cửu Vĩ Hồ · Rồng · Long Phụng
// Hệ toạ độ: gốc giữa cạnh trên, x -80..80, y 0..36 (chân y=36 chạm khung). File tự chứa, không require file khác.
// Chữ ký: crestTop(tier, W, H) -> chuỗi SVG (W, H không dùng).

const f = (n) => Number(n.toFixed(2));
const mirror = (half) => `<g>${half}</g><g transform="scale(-1 1)">${half}</g>`;
const P = 'lvcrest';
const ORDER = ['ĐỒNG', 'BẠC', 'VÀNG', 'BẠCH KIM', 'KIM CƯƠNG', 'HUYỀN THOẠI'];
const FOOT_W = [38, 44, 50, 56, 62, 72];

// Chiếc lá/lông/đuôi: gốc (0,0) chỉ sang phải, dài len, rộng wid; xoay ang độ quanh (px,py)
function leaf(px, py, ang, len, wid, style) {
  const d = `M0 0 C${f(len * 0.25)} ${f(-wid)} ${f(len * 0.75)} ${f(-wid * 0.9)} ${len} 0 C${f(len * 0.75)} ${f(wid * 0.9)} ${f(len * 0.25)} ${f(wid)} 0 0 Z`;
  return `<path transform="translate(${px} ${py}) rotate(${ang})" d="${d}" ${style}/>`;
}

function build(tier, idx) {
  const dark = tier.dark;
  const rb = Boolean(tier.rainbow);
  const acc = tier.accent || '#ffffff';
  const fill = `fill="${rb ? `url(#${P}-rb)` : `url(#${P}-g)`}" stroke="${dark}" stroke-width="1.4" stroke-linejoin="round"`;
  const lite = `fill="${tier.light}" stroke="${dark}" stroke-width="1.2" stroke-linejoin="round"`;
  const thin = `fill="none" stroke="${dark}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"`;
  const line = `fill="none" stroke="${rb ? `url(#${P}-rb)` : tier.light}" stroke-width="2" stroke-linecap="round"`;
  // Mắt to long lanh: tròng trắng + con ngươi + đốm sáng
  const eye = (x, y, r) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff" stroke="${dark}" stroke-width="1"/>` +
    `<circle cx="${f(x + r * 0.15)}" cy="${f(y + r * 0.1)}" r="${f(r * 0.6)}" fill="${dark}"/>` +
    `<circle cx="${f(x + r * 0.35)}" cy="${f(y - r * 0.25)}" r="${f(r * 0.25)}" fill="#ffffff"/>`;
  const blush = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="3.2" ry="2" fill="${acc}" fill-opacity="0.6"/>`;

  // Chân đế tròn mềm liền khối
  const fw = FOOT_W[idx];
  const foot = `<rect x="${-fw}" y="31" width="${fw * 2}" height="5" rx="2.5" ${fill}/>`;

  // Đầu rồng chibi dùng chung cho Rồng và Long Phụng
  const rongHead = () =>
    mirror(
      `<path d="M5 12 C6 7 9 4 12 2 C12 6 11 9 10 13 Z" ${fill}/>` +
        `<path d="M12 18 L21 14 L19 21 L22 25 L13 25 Z" ${fill}/>` +
        `<path d="M20 27 C28 22 36 28 44 23" ${line}/>`
    ) +
    `<circle cx="0" cy="23" r="13" ${fill}/>` +
    `<ellipse cx="0" cy="29.5" rx="7" ry="5" ${lite} fill-opacity="0.85"/>` +
    mirror(eye(7, 21, 3.8) + blush(11.5, 27.5) + `<circle cx="2.6" cy="29.6" r="1" fill="${dark}"/>`) +
    `<path d="M-2 11 L0 6 L2 11 Z" ${fill}/>` +
    `<path d="M-2.6 32.4 Q0 34.2 2.6 32.4" ${thin}/>` +
    `<circle cx="0" cy="13.5" r="2.8" fill="${acc}" stroke="${dark}" stroke-width="1"/>`;

  if (idx === 0) {
    // Thần Quy: mai tròn có hoa văn, đầu nghiêng ngó, chồi non trên mai
    return (
      foot +
      `<path d="M-6 33 L-5 36 M-15 33 L-14 36" ${thin}/>` +
      `<ellipse cx="-11" cy="33.5" rx="6" ry="3.4" ${fill}/><ellipse cx="9" cy="33.5" rx="6" ry="3.4" ${fill}/>` +
      `<path d="M-20 31 L-27 33 L-20 34 Z" ${fill}/>` +
      `<path d="M-20 33 C-20 13 -9 8 2 8 C13 8 22 14 22 33 Z" ${fill}/>` +
      `<path d="M-6 33 V24 L0 19 L6 24 V33 M0 19 V11 M-6 24 L-14 21 M6 24 L14 21" ${thin}/>` +
      `<path d="M2 8 C-1 3 3 0 6 3 C9 0 12 4 2 8 Z" fill="${acc}" stroke="${dark}" stroke-width="1"/>` +
      `<circle cx="27" cy="26" r="9" ${fill}/>` +
      eye(30, 24, 3) + blush(33, 29.5) + `<path d="M27.5 30.5 Q30 32.5 33 30.5" ${thin}/>`
    );
  }
  if (idx === 1) {
    // Bạch Hổ: mặt hổ tròn, tai tròn, chữ Vương trên trán, má hồng
    return (
      foot +
      mirror(
        `<path d="M10 12 L16 3 C21 4 23 10 21 17 Z" ${fill}/><path d="M14.5 11 L16.5 7 L18.5 12 Z" fill="${dark}" fill-opacity="0.55"/>`
      ) +
      `<ellipse cx="0" cy="22" rx="21" ry="14" ${fill}/>` +
      mirror(
        `<path d="M20 24 L25 27 L19 28.5 Z" ${fill}/>` +
          `<path d="M19 19 L14 20.5 M19.5 24 L14.5 24.5" ${thin}/>` +
          eye(8, 22, 4) + blush(14, 28) +
          `<path d="M20 30 L26 29 M19 32 L25 33" ${thin}/>`
      ) +
      `<path d="M-4 9 V14 M0 8 V15 M4 9 V14 M-4 11.5 H4" ${thin}/>` +
      `<path d="M-2.6 26 H2.6 L0 29 Z" fill="${dark}"/>` +
      `<path d="M0 29 V30.5 M-4 31 Q0 34 4 31" ${thin}/>`
    );
  }
  if (idx === 2) {
    // Phượng Hoàng: chim tròn xoe, hai cánh giương, mào lông ba chiếc, mỏ nhỏ
    return (
      foot +
      mirror([-72, -48, -24].map((a, i) => leaf(9, 27, a, 28 + (i === 1 ? 4 : 0), 5, fill)).join('')) +
      [-90, -68, -112].map((a) => leaf(0, 12, a, 9, 2.8, fill)).join('') +
      `<circle cx="0" cy="24" r="12" ${fill}/>` +
      `<ellipse cx="0" cy="29" rx="7" ry="5" ${lite} fill-opacity="0.7"/>` +
      mirror(eye(5, 22, 3) + blush(8.5, 27)) +
      `<path d="M-2.6 25 H2.6 L0 29.5 Z" fill="${acc}" stroke="${dark}" stroke-width="1" stroke-linejoin="round"/>`
    );
  }
  if (idx === 3) {
    // Cửu Vĩ Hồ: chín đuôi xoè sau đầu cáo, đầu tròn cười tít mắt, chiếc đuôi có chóp sáng
    const tailSpec = [[-80, 30], [-58, 34], [-36, 38], [-14, 40]];
    const tail = (a, len, px) => {
      const r = (a * Math.PI) / 180, ex = px + len * 0.68 * Math.cos(r), ey = 32 + len * 0.68 * Math.sin(r);
      return leaf(px, 32, a, len, 6.5, fill) + leaf(f(ex), f(ey), a, f(len * 0.32), 4.2, lite);
    };
    const tailHalf = tailSpec.map(([a, l]) => tail(a, l, 8)).join('');
    return (
      foot +
      mirror(tailHalf) + tail(-90, 31, 0) +
      `<path d="M-18 20 L-14 6 L-6 13 H6 L14 6 L18 20 C18 30 8 35 0 35 C-8 35 -18 30 -18 20 Z" ${fill}/>` +
      mirror(
        `<path d="M10 14 L13 9 L15.5 17 Z" fill="${dark}" fill-opacity="0.55"/>` +
          `<path d="M5 22.5 Q8 18 11 22.5" fill="none" stroke="${dark}" stroke-width="1.8" stroke-linecap="round"/>` +
          blush(13, 27.5) + `<path d="M16.5 26 L21 25" ${thin}/>`
      ) +
      `<circle cx="0" cy="27" r="1.8" fill="${dark}"/>` +
      `<path d="M-3 29.4 Q-1.5 31.4 0 29.4 Q1.5 31.4 3 29.4" ${thin}/>` +
      `<path d="M0 10 L2.5 13 L0 16 L-2.5 13 Z" fill="${acc}" stroke="${dark}" stroke-width="1"/>`
    );
  }
  if (idx === 4) {
    // Rồng: rồng con đầu tròn, hai sừng ngắn, râu cong và hai đám mây nhỏ
    return (
      foot +
      mirror(`<circle cx="34" cy="33" r="4" ${lite}/><circle cx="41" cy="34" r="3" ${lite}/>`) +
      rongHead()
    );
  }
  // Long Phụng: đầu rồng con ở giữa, hai cánh phượng xoè (màu cầu vồng)
  const wingSpec = [[-25, 49], [-11, 52], [2, 50], [16, 46]];
  return (
    `<g clip-path="url(#${P}-clip)">` +
    foot +
    mirror(wingSpec.map(([a, l]) => leaf(14, 26, a, l, 5.6, fill)).join('')) +
    rongHead() +
    `</g>`
  );
}

function crestTop(tier /*, W, H */) {
  const idx = ORDER.indexOf(tier.name);
  if (idx < 0) return '';
  const defs =
    `<defs>` +
    `<linearGradient id="${P}-g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="36"><stop offset="0" stop-color="${tier.light}"/><stop offset="0.55" stop-color="${tier.main}"/><stop offset="1" stop-color="${tier.dark}"/></linearGradient>` +
    `<linearGradient id="${P}-rb" gradientUnits="userSpaceOnUse" x1="-80" y1="0" x2="80" y2="0"><stop offset="0" stop-color="#ff6b6b"/><stop offset="0.25" stop-color="#ffd93d"/><stop offset="0.5" stop-color="#6bffb8"/><stop offset="0.75" stop-color="#6bb8ff"/><stop offset="1" stop-color="#d96bff"/></linearGradient>` +
    `<clipPath id="${P}-clip"><rect x="-80" y="0" width="160" height="36"/></clipPath>` +
    `</defs>`;
  // HUYỀN THOẠI ★2+ (cấp 60+, tier.star >= 2): 2 sao 4 cánh nhỏ hai bên linh vật, ngoài đầu cánh (x=±71, y=9, cánh 6 → y ≥ 3, |x| ≤ 77): quầng mờ + sao màu nhấn viền tối + lõi trắng = 3 phần tử/bên (+6), ≈+0.7KB; cộng dồn cho các bậc sao sau
  let extra = '';
  if (tier.star >= 2) {
    const sa = tier.accent || '#ffffff';
    const sx = 71, sy = 9, r = 6;
    const half = `<circle cx="${sx}" cy="${sy}" r="8.5" fill="${sa}" fill-opacity="0.28"/><path d="M${sx} ${sy - r} Q${sx} ${sy} ${sx + r} ${sy} Q${sx} ${sy} ${sx} ${sy + r} Q${sx} ${sy} ${sx - r} ${sy} Q${sx} ${sy} ${sx} ${sy - r} Z" fill="${sa}" stroke="${tier.dark}" stroke-width="0.9" stroke-linejoin="round"/><circle cx="${sx}" cy="${sy}" r="1.6" fill="#ffffff"/>`;
    extra = mirror(half);
  }
  // HUYỀN THOẠI ★4+ (cấp 70+, tier.star >= 4): tia sáng toả SAU LƯNG linh vật: 9 tia mảnh từ (0,32) góc -168°…-12° (cách 19.5°), dài tới 70 nhưng cắt để đầu tia ở y ≥ 4.5 → chỉ phần ló ra khỏi linh vật/cánh nhìn thấy; vẽ TRƯỚC thân (nằm dưới), clip theo khung đỉnh (x ±80, y 0..36) nên không điểm nào y < 0; màu nhấn mờ + cầu vồng ở lõi = +2 phần tử (2 path gộp tia), ≈+0.8KB; cộng dồn cho các bậc sau
  let back = '';
  if (tier.star >= 4) {
    let d = '';
    for (let k = 0; k < 9; k++) {
      const a = ((-168 + k * 19.5) * Math.PI) / 180;
      const len = Math.min(70, 27.5 / Math.max(0.2, -Math.sin(a))); // đầu tia luôn ở y ≥ 4.5 (không bị cắt phẳng ở y=0)
      d += `M${f(14 * Math.cos(a))} ${f(32 + 14 * Math.sin(a))} L${f(len * Math.cos(a))} ${f(32 + len * Math.sin(a))} `;
    }
    back = `<g clip-path="url(#${P}-clip)"><path d="${d}" fill="none" stroke="${tier.accent || '#ffffff'}" stroke-opacity="0.28" stroke-width="5" stroke-linecap="round"/><path d="${d}" fill="none" stroke="url(#${P}-rb)" stroke-opacity="0.9" stroke-width="1.8" stroke-linecap="round"/></g>`;
  }
  // HUYỀN THOẠI ★6+ (cấp 80+, tier.star >= 6): vương miện mini 3 mũi (vàng nhạt #ffe9a6) đội trên đầu linh vật, đặt SAU cùng (đè lên sừng/mào/tai ở giữa đầu); neo (x, y đáy) theo từng con vì đầu mỗi con một chỗ: đáy rộng 15, cao 8 (đỉnh y ≥ 1.5 → không điểm nào y < 0), viền tối + 3 ngọc nhỏ ở đầu mũi + vệt sáng = 6 phần tử, ≈+0.7KB; cộng dồn cho các bậc sau
  let crown = '';
  if (tier.star >= 6) {
    const [cx, cy] = [[27, 17.5], [0, 8.5], [0, 12.5], [0, 13.5], [0, 10.5], [0, 10.5]][idx];
    const hw = 7.5, h = 8;
    const d = `M${f(cx - hw)} ${cy} L${f(cx - hw - 1)} ${f(cy - h * 0.7)} L${f(cx - hw * 0.5)} ${f(cy - h * 0.35)} L${cx} ${f(cy - h)} L${f(cx + hw * 0.5)} ${f(cy - h * 0.35)} L${f(cx + hw + 1)} ${f(cy - h * 0.7)} L${f(cx + hw)} ${cy} Z`;
    crown = `<path d="${d}" fill="#ffe9a6" stroke="${tier.dark}" stroke-width="1.1" stroke-linejoin="round"/>` +
      `<path d="M${f(cx - hw + 1.5)} ${f(cy - 1.8)} H${f(cx + hw - 1.5)}" stroke="${tier.dark}" stroke-opacity="0.45" stroke-width="1" stroke-linecap="round"/>` +
      [[cx - hw - 1, cy - h * 0.7, '#ff8fb3'], [cx, cy - h, '#6bb8ff'], [cx + hw + 1, cy - h * 0.7, '#ff8fb3']].map(([gx, gy, gc]) => `<circle cx="${f(gx)}" cy="${f(gy)}" r="1.5" fill="${gc}" stroke="${tier.dark}" stroke-width="0.6"/>`).join('') +
      `<path d="M${f(cx - 3.5)} ${f(cy - 4.2)} L${f(cx - 1.5)} ${f(cy - 6.4)}" stroke="#ffffff" stroke-width="1" stroke-linecap="round"/>`;
  }
  // HUYỀN THOẠI ★9+ (cấp 95+, tier.star >= 9): hào quang tròn sau đầu linh vật: tâm theo từng con (Quy x=27,y=26; còn lại x=0,y 22..24), r=17 (đỉnh y ≥ 5; Quy r=13) = 3 phần tử (đĩa mờ trắng-vàng + vòng cầu vồng mảnh + vòng vàng ngoài), ≈+0.5KB; vẽ TRƯỚC thân (dưới linh vật), cộng dồn cho bậc 100
  let halo = '';
  if (tier.star >= 9) {
    const [hx, hy, hr] = [[27, 26, 13], [0, 22, 17], [0, 24, 17], [0, 25, 17], [0, 23, 17], [0, 23, 17]][idx];
    halo = `<g clip-path="url(#${P}-clip)"><circle cx="${hx}" cy="${hy}" r="${hr}" fill="#fff3c4" fill-opacity="0.3"/><circle cx="${hx}" cy="${hy}" r="${hr}" fill="none" stroke="url(#${P}-rb)" stroke-width="2.2"/><circle cx="${hx}" cy="${hy}" r="${hr + 3}" fill="none" stroke="#ffe9a6" stroke-opacity="0.6" stroke-width="1"/></g>`;
  }
  // TỐI THƯỢNG (cấp 100, tier.max): vương miện ★6 phóng 1.3× quanh đáy (đỉnh vẫn y ≥ 0: tính theo neo, cao 8×1.3=10.4 ≤ neo y) + ngọc đỏ lớn giữa vành + 2 SAO LỚN 4 cánh trắng-vàng hai bên (x=±50, y=11, cánh 10 → y ≥ 1, |x| ≤ 60) có quầng mờ + lõi trắng = +1 g + 1 ngọc + 6 phần tử, ≈+0.9KB
  let top = '';
  if (tier.max) {
    const [cx, cy] = [[27, 17.5], [0, 8.5], [0, 12.5], [0, 13.5], [0, 10.5], [0, 10.5]][idx];
    const k = Math.min(1.3, (cy - 0.8) / 8); // không để đỉnh vương miện chui y < 0 (Hổ cy=8.5 → k≈0.96)
    top = `<g transform="translate(${cx} ${cy}) scale(${f(k)}) translate(${-cx} ${-cy})">${crown}<circle cx="${cx}" cy="${f(cy - 3.6)}" r="1.7" fill="#ff4d6d" stroke="${tier.dark}" stroke-width="0.6"/></g>`;
    const st = `<circle cx="50" cy="11" r="12" fill="#fff3c4" fill-opacity="0.3"/><path d="M50 1 Q50 11 60 11 Q50 11 50 21 Q50 11 40 11 Q50 11 50 1 Z" fill="#fff3c4" stroke="${tier.dark}" stroke-width="1" stroke-linejoin="round"/><circle cx="50" cy="11" r="2.2" fill="#ffffff"/>`;
    top += mirror(st);
    crown = '';
  }
  // 5D (cấp 50+, tên HUYỀN THOẠI): cung cầu vồng rộng vắt ngang sau linh vật: Q từ (-64,33) tới (64,33) điều khiển y=-22 → đỉnh cung y=5.5 (≥ 0), nét lõi 2.2 cầu vồng + quầng rộng 7 mờ 0.2 + 2 hạt sáng ở chân cung = +4 phần tử, ≈+0.5KB; vẽ trước thân; bậc ≤ 45 y nguyên
  let arc = '';
  if (tier.name === 'HUYỀN THOẠI') {
    arc = `<g clip-path="url(#${P}-clip)"><path d="M-64 33 Q0 -22 64 33" fill="none" stroke="#fff3c4" stroke-opacity="0.2" stroke-width="7" stroke-linecap="round"/><path d="M-64 33 Q0 -22 64 33" fill="none" stroke="url(#${P}-rb)" stroke-width="2.2" stroke-linecap="round"/><circle cx="-64" cy="33" r="2.4" fill="#ffffff"/><circle cx="64" cy="33" r="2.4" fill="#ffffff"/></g>`;
  }
  // 5D (cấp 40+, tên KIM CƯƠNG; cấp 45 thừa hưởng): long quang sau đầu rồng (vầng tròn tâm (0,19) r=21: quầng mờ + vòng đứt mảnh, y 0..40 cắt bởi clip) + mỗi bên 1 viên LONG CHÂU (tâm x=±60, y=14, r=4.6: quầng + ngọc radial + chấm phản chiếu) với 2 tia nhỏ chéo (y ≥ 5) ; mọi điểm y ≥ 1, |x| ≤ 66, chân y=36; ≈ +11 phần tử
  let kcBack = '', kcFront = '';
  if (tier.name === 'KIM CƯƠNG') {
    const ka = tier.accent || '#ffffff';
    kcBack = `<g clip-path="url(#${P}-clip)"><circle cx="0" cy="19" r="21" fill="none" stroke="${ka}" stroke-opacity="0.18" stroke-width="6"/><circle cx="0" cy="19" r="21" fill="none" stroke="${tier.light}" stroke-opacity="0.8" stroke-width="1" stroke-dasharray="3 3"/></g>`;
    const pearl = `<circle cx="60" cy="14" r="8" fill="${ka}" fill-opacity="0.22"/><path d="M60 5 L61 11 M69 14 L63.5 14.6" stroke="${ka}" stroke-width="1.2" stroke-linecap="round" stroke-opacity="0.9"/><circle cx="60" cy="14" r="4.6" fill="url(#${P}-pearl)" stroke="${tier.dark}" stroke-width="1"/><circle cx="58.4" cy="12.4" r="1.3" fill="#ffffff" fill-opacity="0.9"/>`;
    kcFront = `<defs><radialGradient id="${P}-pearl" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="${ka}"/><stop offset="1" stop-color="${tier.main}"/></radialGradient></defs>` + mirror(pearl);
  }
  return defs + back + arc + kcBack + halo + build(tier, idx) + kcFront + extra + crown + top;
}

module.exports = { crestTop };
