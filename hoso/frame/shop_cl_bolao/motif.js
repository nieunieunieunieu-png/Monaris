// ===== hoso/frame/shop_cl_bolao/motif.js — Bồ Lao Hống Thiên: rồng gầm, mắt lửa, sóng âm toả hai bên =====
// Hình học (giữ hợp đồng): avatar mọi nét r ≤ 84; crest x ∈ [-80,80], y ≥ 0, chân chạm y=36; bottom y ∈ [-4,12], nửa rộng ≤ 70; edge ≤ 22px vào trong.
// Xuất thêm emblem / emblemGhost (đầu rồng độc lập, tâm (0,0), bán kính ≈ 20) cho Cửu Long Chí Tôn dùng lại ĐÚNG hình này.
const sc = (T, w = 0.7) => `stroke="${T.dark}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

// gradient dùng chung của đầu rồng (id theo tiền tố P của phần gọi)
const defs = (T, P) => `<defs>`
  + `<linearGradient id="${P}d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE6A0"/><stop offset="0.45" stop-color="${T.main}"/><stop offset="1" stop-color="#9A5A00"/></linearGradient>`
  + `<linearGradient id="${P}h" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${T.dark}"/><stop offset="0.5" stop-color="#C98A12"/><stop offset="1" stop-color="${T.light}"/></linearGradient>`
  + `<linearGradient id="${P}f" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${T.main}"/><stop offset="1" stop-color="${T.accent}"/></linearGradient>`
  + `<linearGradient id="${P}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A0505"/><stop offset="1" stop-color="${T.mouth}"/></linearGradient>`
  + `<radialGradient id="${P}a" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${T.accent}" stop-opacity="0.55"/><stop offset="0.6" stop-color="${T.ember}" stop-opacity="0.18"/><stop offset="1" stop-color="${T.accent}" stop-opacity="0"/></radialGradient>`
  + `<radialGradient id="${P}e" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.35" stop-color="#FFE14D"/><stop offset="1" stop-color="${T.ruby}"/></radialGradient>`
  + `</defs>`;

// ---- nửa PHẢI của đầu rồng (x ≥ 0), gốc đầu ở (0,0..36); chân hàm dưới chạm y=36 ----
const headHalf = (T, P, h) => {
  const { petal, polar, dot } = h;
  const o = sc(T, 0.7);
  // bờm lửa sau đầu: 6 cánh xoè theo cung quanh (0,22)
  let mane = '';
  [[28, 15, 3.2], [48, 18, 3.6], [68, 20, 3.8], [88, 21, 3.4], [108, 17, 3], [128, 12, 2.4]].forEach(([a, len, w], i) => {
    const [x, y] = polar(15, a);
    mane += petal(x, y + 22, a, len, w, i % 2 ? T.accent : `url(#${P}f)`, T);
  });
  // sừng chính + nhánh
  const horn = `<path d="M8.5 12.5C8.5 6 15.5 1.6 30 0.2C23.5 3.2 20 7 16.5 13.5Z" fill="url(#${P}h)" ${o}/>`
    + `<path d="M19.5 6.2C23 6.2 26.5 8 29 11.5C25 9.8 22 10 19 11Z" fill="url(#${P}h)" ${o}/>`
    + `<path d="M12 9.6L14.4 11.4M15.4 7.4L17.6 9.4M19 4.9L21 7" stroke="${T.dark}" stroke-width="0.6" fill="none" stroke-linecap="round"/>`
    + `<path d="M10.5 11.2C13 6.4 19 3.4 26 1.8" stroke="${T.light}" stroke-opacity="0.85" stroke-width="0.7" fill="none" stroke-linecap="round"/>`;
  // vây má: xoè ngang, gân vây
  const fin = `<path d="M20.5 16.5C28 11.5 37 11 47 14C42 16 40 18.5 39.5 21.5C35 19.2 30.5 19.6 26.5 23C24.5 21 22.5 19.5 20.5 19Z" fill="url(#${P}f)" ${o}/>`
    + `<path d="M23 17.8C30 14.6 37 13.8 44 14.8M25.5 20.6C31 17.8 36.5 17.4 40.5 18.6" stroke="${T.dark}" stroke-opacity="0.55" stroke-width="0.6" fill="none"/>`;
  // râu: 2 sợi thon dần, ngọc cuối râu
  const wh = (d, w) => `<path d="${d}" fill="none" stroke="${T.dark}" stroke-width="${w + 1.4}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${T.main}" stroke-width="${w}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${T.light}" stroke-opacity="0.8" stroke-width="${w * 0.3}" stroke-linecap="round"/>`;
  const whisk = wh('M14 25C24 22 30 15 41 15.5C52 16 56 24 66 21C71 19.5 73 15 72 10.5', 1.5) + wh('M10 27.5C20 31.5 31 30 42 33C50 35 58 33.5 66 30', 0.95)
    + `<circle cx="72" cy="9.6" r="2" fill="${T.ruby}" stroke="${T.dark}" stroke-width="0.5"/><circle cx="71.4" cy="9" r="0.65" fill="#fff"/><circle cx="66.4" cy="29.6" r="1.4" fill="${T.ruby}" stroke="${T.dark}" stroke-width="0.4"/>`;
  // đầu (nửa phải) + sống mũi + vảy trán
  const skull = `<path d="M0 5.4C4 4.8 9.5 6.5 13.5 9.6C18 13.2 21.6 17.2 22 21.6C22.2 25.4 19.8 27.6 16 28C12 28.4 8 27.2 5 26.2C3.5 25.7 1.6 25.7 0 25.8Z" fill="url(#${P}d)" ${o}/>`
    + `<path d="M0 17C3 17 6.2 18.6 6.8 21.5C7.1 24.2 4.2 26.2 0 26.2Z" fill="${T.light}" fill-opacity="0.38" ${sc(T, 0.5)}/>`
    + `<ellipse cx="3.3" cy="22.3" rx="1.3" ry="0.85" transform="rotate(-20 3.3 22.3)" fill="${T.void}"/>`
    + `<path d="M3 8.6C6 8.2 8 9.4 9 11.4M5 11.6C7.4 11.4 9.2 12.6 10 14.4M2.6 11.8C4.6 12 5.8 13 6.4 14.6" stroke="${T.dark}" stroke-opacity="0.5" stroke-width="0.55" fill="none" stroke-linecap="round"/>`
    + `<path d="M0.6 6.6C5 6.4 10 8.5 13.6 12" stroke="${T.light}" stroke-opacity="0.9" stroke-width="0.8" fill="none" stroke-linecap="round"/>`;
  // mày dữ + mắt lửa
  const brow = `<path d="M2.6 15.8L15.6 8.4L19 11.8L12.4 14L4.6 17.8Z" fill="${T.dark}" stroke="${T.dark}" stroke-width="0.4" stroke-linejoin="round"/><path d="M3.8 15.6L15 9.3" stroke="${T.light}" stroke-opacity="0.7" stroke-width="0.5"/>`;
  const eye = `<circle cx="10.2" cy="17.6" r="4.6" fill="url(#${P}a)"/><path d="M5 19.6C6.6 15.6 12.4 14.6 16 16.2C13.2 20.6 8.2 21.8 5 19.6Z" fill="url(#${P}e)" stroke="${T.dark}" stroke-width="0.6" stroke-linejoin="round"/><ellipse cx="10.6" cy="17.9" rx="0.9" ry="2.2" transform="rotate(-24 10.6 17.9)" fill="${T.void}"/><circle cx="8.9" cy="16.9" r="0.75" fill="#fff"/>`;
  // miệng há gầm: khoang đỏ, nanh trên/dưới, hàm dưới chạm y=36
  const mouth = `<path d="M0 26C5 26.2 11 26.8 16.5 27C13.6 31.8 8 34 0 34Z" fill="url(#${P}m)"/>`
    + `<path d="M16.2 27C13.4 31.8 8 34 0 34V36.2C9 36.2 16.5 33 21 27.6Z" fill="url(#${P}d)" ${o}/>`
    + `<path d="M4.6 26.2L6.2 31.6L7.9 26.4ZM10.6 26.7L12.1 30.4L13.7 27ZM15.2 27.1L16 29.4L17.2 27.2Z" fill="#FFFBEA" stroke="${T.dark}" stroke-width="0.35" stroke-linejoin="round"/>`
    + `<path d="M5.4 33.4L6.7 29.6L8.2 32.8ZM10.6 31.6L11.8 28.8L13 31Z" fill="#FFFBEA" stroke="${T.dark}" stroke-width="0.35" stroke-linejoin="round"/>`
    + `<path d="M0 26.2C5.2 26.4 11.2 27 16.6 27.2" stroke="${T.dark}" stroke-width="0.8" fill="none" stroke-linecap="round"/>`;
  // râu cằm ngắn + đốm vảy má
  const cheek = `<path d="M18 22.2C19.6 20.4 20.6 21.4 20.4 23.2M15.2 19.4C16.6 17.8 17.8 18.6 17.6 20.4" stroke="${T.dark}" stroke-opacity="0.55" stroke-width="0.5" fill="none"/>`
    + dot(19.2, 25.6, 0.7, T.light);
  const spine = petal(1.6, 6, -8, 6.6, 1.9, T.accent, T) + petal(5.4, 7.2, 22, 6, 1.7, T.accent, T);
  const spikes = petal(21.2, 19.5, 100, 7.4, 1.7, T.main, T) + petal(20.6, 24.2, 128, 6.2, 1.5, T.main, T) + petal(15.6, 9.8, 52, 5.8, 1.3, T.light, T) + petal(19.6, 14.2, 76, 5.2, 1.2, T.light, T);
  return `${mane}${whisk}${fin}${horn}${spine}${skull}${spikes}${cheek}${mouth}${brow}${eye}`;
};

// toàn bộ đầu rồng (hai nửa lật gương + chi tiết giữa). asUse=true: nửa phải vào <defs> 1 lần, 2 nửa là <use> (giảm dung lượng; chỉ crest dùng, hình y hệt)
const head = (T, P, h, asUse) => {
  const { mirror, gem } = h;
  const half = headHalf(T, P, h);
  const tongue = `<path d="M-3.8 33.6C-2.4 30 2.4 30 3.8 33.6C2.2 35 -2.2 35 -3.8 33.6Z" fill="${T.tongue}" stroke="${T.dark}" stroke-width="0.4"/><path d="M0 30.8V34" stroke="${T.mouth}" stroke-width="0.4"/>`;
  const halves = asUse ? `<defs><g id="${P}hh">${half}</g></defs><use href="#${P}hh"/><use href="#${P}hh" transform="scale(-1 1)"/>` : `${half}${mirror(half)}`;
  return `${halves}${tongue}${gem(0, 11.2, 3, T.ruby, T)}`;
};

// sóng âm: cung đồng tâm toả hai bên đầu (tâm (0,20))
const waves = (T, P, h) => {
  const { polar } = h;
  let out = '';
  [[50, 1.7, 0.95], [58, 1.4, 0.75], [66, 1.1, 0.55], [74, 0.8, 0.35]].forEach(([r, w, op]) => {
    const pt = (a) => { const [x, y] = polar(r, a); return `${x} ${y + 20}`; };
    out += `<path d="M${pt(75)}A${r} ${r} 0 0 1 ${pt(105)}" fill="none" stroke="${T.ember}" stroke-opacity="${op}" stroke-width="${w}" stroke-linecap="round"/>`;
    out += `<path d="M${pt(-75)}A${r} ${r} 0 0 0 ${pt(-105)}" fill="none" stroke="${T.ember}" stroke-opacity="${op}" stroke-width="${w}" stroke-linecap="round"/>`;
  });
  return out;
};

// ================= Task 1-C: crest =================
// Đỉnh thẻ (x −80..80, chân y=36): Bồ Lao ngự trên đại hồng chung (chuông đồng) — đầu gầm nhìn thẳng, 2 vuốt trước bám vai chuông,
// thân cuộn hai bên hoá đuôi sấm, sóng âm vòng cung toả từ miệng, tia sét sau lưng. Dùng lại ĐÚNG `head` của emblem.
const boltShape = (T) => `<path d="M3 -14L-5 -1.5L-0.8 -1.5L-3.5 13L6.5 -4L1.6 -4L5.5 -14Z" fill="#FFE14D" stroke="${T.accent}" stroke-width="0.7" stroke-linejoin="round"/><path d="M2.4 -11.5L-2.6 -2M-0.6 3L-1.6 8" stroke="#fff" stroke-opacity="0.85" stroke-width="0.6" fill="none" stroke-linecap="round"/>`;
const bolt = (P, x, y, s, a = 0) => `<use href="#${P}l" transform="translate(${x} ${y}) rotate(${a}) scale(${s})"/>`;

// nửa PHẢI thân cuộn ra khỏi chân chuông, hoá đuôi sấm (xuất 1 lần trong defs, lật gương cho nửa trái)
const tailR = (T, P, kit, petal, o) => {
  const ctrl = [[24, 30], [38, 34], [54, 28], [70, 24]];
  return kit.body(T, P, ctrl, { profile: (t) => 8 * Math.pow(1 - t, 0.9) + 1.4, per: 14, scaleEvery: 2, scaleSize: 0.9 })
    + kit.dorsal(T, ctrl, { every: 3, side: -1, size: 5.5, per: 14 })
    + petal(70, 24, 50, 9, 2.2, T.accent, T) + petal(70, 24, 84, 8, 2, `url(#${P}f)`, T) + petal(70, 24, 20, 7, 1.8, T.main, T)
    + `<circle cx="68" cy="25" r="2.2" fill="url(#${P}e)" stroke="${T.dark}" stroke-width="0.5"/>`;
};

const crest = (T, P, h) => {
  const kit = require('../../dragonKit');
  const { star4, dot, mirror, petal } = h;
  const sym = (f) => `${f}${mirror(f)}`;
  const o = sc(T, 0.8);
  const bellD = 'M-12 8C-12 5 12 5 12 8C14 18 24 28 31 32.6L31 34.8L-31 34.8L-31 32.6C-24 28 -14 18 -12 8Z';
  const gd = `<defs><linearGradient id="${P}z" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE6A0"/><stop offset="0.4" stop-color="${T.main}"/><stop offset="1" stop-color="#7A4A00"/></linearGradient>`
    + `<linearGradient id="${P}y" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.38"/><stop offset="0.35" stop-color="#fff" stop-opacity="0.22"/><stop offset="0.6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.4"/></linearGradient>`
    + `<g id="${P}l">${boltShape(T)}</g><g id="${P}t">${tailR(T, P, kit, petal, o)}</g></defs>`;
  // quầng + tia sét sau lưng
  const aura = `<ellipse cx="0" cy="2" rx="72" ry="36" fill="url(#${P}a)"/><circle cx="0" cy="-6" r="40" fill="url(#${P}o)"/>`;
  const bolts = sym(bolt(P, -63, -21, 1.05, 16) + bolt(P, -50, -33, 0.7, 28));
  // sóng âm vòng cung toả từ miệng (tâm (0,-10))
  let waves = '';
  [[54, 1.7, 0.95], [61, 1.4, 0.72], [68, 1.1, 0.5]].forEach(([r, w, op]) => {
    const pt = (a) => { const [x, y] = h.polar(r, a); return `${x} ${y - 10}`; };
    waves += `<path d="M${pt(66)}A${r} ${r} 0 0 1 ${pt(100)}" fill="none" stroke="${T.ember}" stroke-opacity="${op}" stroke-width="${w}" stroke-linecap="round"/>`;
  });
  waves = sym(waves);
  // đại hồng chung: thân loe, gờ miệng, 2 đai, sườn dọc, núm sét
  const bell = `<path d="${bellD}" fill="url(#${P}z)" ${o}/><path d="${bellD}" fill="url(#${P}y)"/>`
    + `<path d="M-32.5 32.6Q0 30.4 32.5 32.6L33 35.4Q0 33.2 -33 35.4Z" fill="${T.light}" ${sc(T, 0.7)}/>`
    + `<path d="M-14.4 17Q0 20 14.4 17M-21 25Q0 28.4 21 25" fill="none" stroke="${T.dark}" stroke-width="1.1"/><path d="M-14.4 16Q0 19 14.4 16M-21 24Q0 27.4 21 24" fill="none" stroke="${T.light}" stroke-opacity="0.8" stroke-width="0.6"/>`
    + `<path d="M-6 9L-9 32M6 9L9 32M0 10V33" fill="none" stroke="${T.dark}" stroke-opacity="0.4" stroke-width="0.6"/>`
    + bolt(P, 0, 27, 0.46);
  // vai + 2 vuốt trước bám sườn chuông
  const arm = (ctrl) => kit.body(T, P, ctrl, { profile: (t) => 7 - 3 * t, per: 8, scaleEvery: 3, scaleSize: 0.8 });
  const claws = sym(arm([[30, 4], [30, 10], [27, 15], [23, 19]]) + kit.claw(T, P, 22, 20, 158, 1.05));
  const headG = `<g transform="translate(0 -25)">${head(T, P, h, true)}</g>`;
  const sparks = sym(star4(-76, 0, 1.8, T.light, 0.9) + dot(-72, -26, 1, T.ember) + dot(-38, -37, 1.1, T.light, 0.9));
  const out = defs(T, P) + kit.dragonDefs(T, P) + gd + aura + bolts + waves + `<use href="#${P}t"/><use href="#${P}t" transform="scale(-1 1)"/>` + bell + claws + headG + sparks;
  return out.replace(/-?\d+\.\d{3,}/g, (m) => String(Number(Number(m).toFixed(2))));
};

// emblem: đầu rồng độc lập thu nhỏ, tâm (0,0), bán kính ≈ 20 — dùng cho avatar + Cửu Long Chí Tôn
const emblem = (T, P, h) => defs(T, P) + `<g transform="translate(0 -17) scale(0.6)">${head(T, P, h)}</g>`;
// emblemGhost: cùng hình dạng (sọ + sừng + vây má + hàm), bóng mờ nét đứt (rồng chưa sở hữu) + chấm nguyên tố mờ
const GHOST_HALF = 'M0 5.4C4 4.8 9.5 6.5 13.5 9.6C18 13.2 21.6 17.2 22 21.6C22.2 25.4 19.8 27.6 16 28L21 27.6C16.5 33 9 36.2 0 36.2';
const GHOST_HORN = 'M8.5 12.5C8.5 6 15.5 1.6 30 0.2C23.5 3.2 20 7 16.5 13.5Z';
const GHOST_FIN = 'M20.5 16.5C28 11.5 37 11 47 14C42 16 40 18.5 39.5 21.5C35 19.2 30.5 19.6 26.5 23Z';
const emblemGhost = (T, P, h) => {
  const half = `${GHOST_HALF}${GHOST_HORN}${GHOST_FIN}`;
  const L = `<g transform="scale(-1 1)"><path d="${half}" fill="none"/></g>`;
  return `<g transform="translate(0 -17) scale(0.6)" opacity="0.3"><g fill="#8A8F9C" stroke="#C7CBD6" stroke-width="0.8" stroke-dasharray="2 1.6" stroke-linejoin="round"><path d="${GHOST_HALF}Z"/><path d="${GHOST_HORN}"/><path d="${GHOST_FIN}"/><g transform="scale(-1 1)"><path d="${GHOST_HALF}Z"/><path d="${GHOST_HORN}"/><path d="${GHOST_FIN}"/></g></g><circle cx="0" cy="20" r="3.4" fill="${T.accent}" fill-opacity="0.9"/></g>`;
};

// thân rồng gồm nhiều đoạn nhỏ, rộng dần → thon dần (không cần fill đa giác)
const bodyArc = (T, P, h, r, a0, a1, w0, w1, steps) => {
  const { polar, spike } = h;
  let under = '';
  let fill = '';
  let hi = '';
  let scales = '';
  let dorsal = '';
  for (let i = 0; i < steps; i += 1) {
    const t0 = i / steps;
    const t1 = (i + 1) / steps;
    const [x0, y0] = polar(r, a0 + (a1 - a0) * t0);
    const [x1, y1] = polar(r, a0 + (a1 - a0) * t1);
    const w = w0 + (w1 - w0) * ((t0 + t1) / 2);
    const seg = `M${x0} ${y0}A${r} ${r} 0 0 1 ${x1} ${y1}`;
    under += `<path d="${seg}" fill="none" stroke="${T.dark}" stroke-width="${(w + 1.6).toFixed(2)}" stroke-linecap="round"/>`;
    fill += `<path d="${seg}" fill="none" stroke="${i % 2 ? '#E8590C' : '#C2410C'}" stroke-width="${w.toFixed(2)}" stroke-linecap="round"/>`;
    hi += `<path d="${seg}" fill="none" stroke="#FFD27A" stroke-opacity="0.8" stroke-width="${(w * 0.26).toFixed(2)}" stroke-linecap="round" transform="translate(0 0)"/>`;
    const [sx, sy] = polar(r + w * 0.15, a0 + (a1 - a0) * t1);
    scales += `<circle cx="${sx}" cy="${sy}" r="${(w * 0.22).toFixed(2)}" fill="${T.dark}" fill-opacity="0.5"/>`;
    if (i % 2 === 0 && w > 1.6) { const [dx, dy] = polar(r + w * 0.5, a0 + (a1 - a0) * t0); dorsal += spike(dx, dy, a0 + (a1 - a0) * t0, 2.2 + w * 0.45, 0.9 + w * 0.12, T.accent, T, 0.4); }
  }
  return `${under}${fill}${hi}${scales}${dorsal}`;
};

const avatar = (T, P, h) => {
  const { radial, polar, dot, petal } = h;
  // thân rồng ôm vành: đầu ở đỉnh (0°), thân bò theo chiều kim đồng hồ, đuôi kết lại sát đầu
  const body = bodyArc(T, P, h, 74.4, 16, 340, 5.4, 1.1, 54);
  // đuôi: ngọn lửa nhỏ ở cuối thân
  const [tx, ty] = polar(74.4, 342);
  const tail = petal(tx, ty, 342 - 82, 7, 2, T.accent, T) + petal(tx, ty, 342 - 100, 5, 1.5, T.ember, T);
  // 2 vuốt bám vành
  const claw = (a) => { const [x, y] = polar(76, a); return petal(x, y, a + 70, 6, 1.5, '#FFFBEA', T) + petal(x, y, a + 100, 5, 1.3, '#FFFBEA', T) + petal(x, y, a + 40, 5, 1.3, '#FFFBEA', T); };
  const ring2 = `<circle r="68.4" fill="none" stroke="${T.accent}" stroke-opacity="0.65" stroke-width="1.1"/>` + radial(24, 66.4, (x, y) => dot(x, y, 0.9, T.ember, 0.9), 0);
  // sóng âm gợn bên trong vành
  let rip = '';
  for (let a = 0; a < 360; a += 20) { const [x1, y1] = polar(65.6, a - 6); const [cx, cy] = polar(63.2, a); const [x2, y2] = polar(65.6, a + 6); rip += `M${x1} ${y1}Q${cx} ${cy} ${x2} ${y2}`; }
  const ripple = `<path d="${rip}" fill="none" stroke="${T.ember}" stroke-opacity="0.6" stroke-width="0.9" stroke-linecap="round"/>`;
  // đầu rồng gầm ở đỉnh vành (r ≤ 84): chân hàm chạm y=-66, sừng tới -83.9
  const crown = `<g transform="translate(0 -65.2) scale(0.42)"><g transform="translate(0 -36)">${head(T, P, h)}</g></g>`;
  return `${defs(T, P)}${ripple}${ring2}${body}${tail}${claw(112)}${claw(236)}${crown}`;
};

// ================= Task 1-B: border / side / bottom (vẽ lại) =================
// góc 44×44 (gốc ở đỉnh góc, trải sang +x +y): bàn vuốt rồng gầm quắp góc, 3 móng ngà, ngọc lửa mu bàn, sóng âm toả vào trong, vây lửa ra ngoài
const corner = (T, P, h) => {
  const { gem, petal, star4, dot } = h;
  const dfs = defs(T, P).replace(`id="${P}e"`, `id="${P}ey"`);
  const talon = (d) => `<path d="${d}" fill="#FFFBEA" stroke="${T.dark}" stroke-width="0.6" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${T.main}" stroke-opacity="0.35" stroke-width="0.4" transform="translate(0.4 0.4)"/>`;
  const palm = `<path d="M2 2H21C26 6 27 14 22.5 20C17 25 8 26 2 22Z" fill="url(#${P}d)" stroke="${T.dark}" stroke-width="0.9" stroke-linejoin="round"/>`
    + `<path d="M5 3.6C9 6 11 10 10.4 14.6M11 3.2C15 6 16.6 11 15.4 17M17 3C20.6 6 22 10.4 21 14.6" stroke="${T.dark}" stroke-opacity="0.5" stroke-width="0.6" fill="none"/>`
    + `<path d="M3.6 3.6H19" stroke="${T.light}" stroke-opacity="0.85" stroke-width="0.8" stroke-linecap="round"/>`
    + `<path d="M3 20.4C8 23 15 22.6 20 18.6" stroke="${T.dark}" stroke-opacity="0.55" stroke-width="0.8" fill="none" stroke-linecap="round"/>`;
  const talons = talon('M22.6 5C29 4.6 36 8 42 16.6C35.6 13.4 30 12.8 25 13.6Z') + talon('M21.4 18.6C27 21.4 31 27.4 32.4 37C28 32.4 24 29.6 18.4 27.4Z') + talon('M9 22C9.6 28 12.6 34 18.6 40.4C13.6 37.6 9.4 34 5.6 29Z');
  const wave = (r, op, w) => `<path d="M${r} 38A${r} ${r} 0 0 1 38 ${r}" fill="none" stroke="${T.ember}" stroke-opacity="${op}" stroke-width="${w}" stroke-linecap="round"/>`;
  return `${dfs}<circle cx="9" cy="9" r="12" fill="url(#${P}a)"/>${wave(26, 0.9, 1.1)}${wave(32, 0.6, 0.9)}${wave(38, 0.35, 0.8)}${petal(3, 3, -45, 9, 2.6, T.accent, T)}${petal(3, 3, -20, 6, 1.8, T.ember, T)}${petal(3, 3, -70, 6, 1.8, T.ember, T)}${palm}${talons}${gem(11.5, 11, 5.4, T.ruby, T)}${star4(38, 38, 2.2, T.light, 0.9)}${dot(37, 4, 1.1, T.ember)}${dot(4, 37, 1.1, T.ember)}`;
};

// cạnh 44 (tâm x=0, +y vào trong ≤ 22): 1 vảy nhọn vàng treo dưới nẹp, gờ sáng, vạch sóng âm, vây lửa nhỏ ở mối nối + chấm lửa
const edge = (T, P, h) => {
  const { petal, dot } = h;
  const sc2 = 'M-20 8.4C-19 14.6 -9 18 0 21.6C9 18 19 14.6 20 8.4Z';
  return `<path d="${sc2}" fill="url(#${P}d)" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/>`
    + `<path d="M-14 9.6C-12 13.6 -6 16 0 18.2C6 16 12 13.6 14 9.6" fill="none" stroke="${T.dark}" stroke-opacity="0.5" stroke-width="0.6"/>`
    + `<path d="M-6.4 11.6Q0 17.4 6.4 11.6M-3 11.6Q0 14.4 3 11.6" fill="none" stroke="${T.ember}" stroke-opacity="0.95" stroke-width="0.9" stroke-linecap="round"/>`
    + `<path d="M-18 9.4C-14 14 -8 16.4 -3 18" fill="none" stroke="${T.light}" stroke-opacity="0.85" stroke-width="0.8" stroke-linecap="round"/>`
    + `<path d="M0 9.6V15.4" stroke="${T.dark}" stroke-opacity="0.5" stroke-width="0.6"/>`
    + `${petal(22, 8.2, 180, 8.4, 2.2, T.accent, T)}${petal(22, 8.2, 156, 5, 1.4, T.ember, T)}${dot(0, 12.6, 1.1, T.ruby)}${dot(0, 20.2, 0.8, T.light, 0.95)}`;
};

// cạnh bên (cao 100, ±15 quanh x=0, nối y=0/100): 4 đốt sống lưng vàng + vây lửa so le + tia sấm + ngọc lửa giữa với sóng âm
const side = (T, P, h) => {
  const { gem, petal, dot, star4 } = h;
  let vert = '';
  [13, 37, 63, 87].forEach((y) => {
    vert += `<path d="M0 ${y - 10}C5.4 ${y - 7} 8 ${y - 3} 8 ${y}C8 ${y + 3} 5.4 ${y + 7} 0 ${y + 10}C-5.4 ${y + 7} -8 ${y + 3} -8 ${y}C-8 ${y - 3} -5.4 ${y - 7} 0 ${y - 10}Z" fill="url(#${P}d)" stroke="${T.dark}" stroke-width="0.7" stroke-linejoin="round"/>`
      + `<path d="M0 ${y - 7}L4.4 ${y}L0 ${y + 7}L-4.4 ${y}Z" fill="none" stroke="${T.dark}" stroke-opacity="0.55" stroke-width="0.6"/><path d="M-5.6 ${y - 3}C-4 ${y - 6.4} -1.6 ${y - 8} 1 ${y - 8.4}" fill="none" stroke="${T.light}" stroke-opacity="0.9" stroke-width="0.7" stroke-linecap="round"/>${dot(0, y, 1, T.ember, 0.95)}`;
  });
  const bolt = (y, s) => `<path transform="translate(${s * 9} ${y}) scale(${s} 1)" d="M0 -6L-3.6 0L-0.8 0L-2.6 6L3 -1L0.4 -1Z" fill="${T.accent}" stroke="${T.dark}" stroke-width="0.4" stroke-linejoin="round"/>`;
  const fins = petal(7, 25, 80, 8.4, 2.6, `url(#${P}f)`, T) + petal(-7, 75, -80, 8.4, 2.6, `url(#${P}f)`, T) + petal(-7, 25, -70, 5, 1.6, T.accent, T) + petal(7, 75, 70, 5, 1.6, T.accent, T);
  const arc = (r, op) => `<path d="M${+(r * 0.55).toFixed(2)} 40Q${r} 50 ${+(r * 0.55).toFixed(2)} 60M${-(+(r * 0.55).toFixed(2))} 40Q${-r} 50 ${-(+(r * 0.55).toFixed(2))} 60" fill="none" stroke="${T.ember}" stroke-opacity="${op}" stroke-width="1" stroke-linecap="round"/>`;
  return `${defs(T, P).replace(`id="${P}e"`, `id="${P}ey"`)}<path d="M0 0V100" stroke="${T.dark}" stroke-opacity="0.8" stroke-width="2.6"/>${vert}${fins}${bolt(25, -1)}${bolt(75, 1)}<circle cx="0" cy="50" r="10" fill="url(#${P}a)"/>${arc(11, 0.95)}${arc(14.6, 0.6)}${gem(0, 50, 5.6, T.ruby, T)}${star4(0, 3, 1.4, T.light, 0.9)}${star4(0, 97, 1.4, T.light, 0.9)}`;
};

// chân thẻ (y ∈ [-4,12], nửa rộng ≤ 70, đối xứng): hai đuôi rồng cuộn ra hai bên (vây lưng + vảy), mút đuôi hoá lửa, sóng âm toả quanh ngọc lửa giữa
const bottom = (T, P, h) => {
  const { gem, petal, mirror, dot, star4 } = h;
  const tail = 'M4 6C-8 11.4 -22 1.6 -36 5.4C-48 8.6 -56 3.4 -66 7';
  const half = `<path d="${tail}" fill="none" stroke="${T.dark}" stroke-width="7" stroke-linecap="round"/><path d="${tail}" fill="none" stroke="#9A5A00" stroke-width="5.4" stroke-linecap="round"/><path d="${tail}" fill="none" stroke="${T.main}" stroke-width="3.6" stroke-linecap="round"/><path d="${tail}" fill="none" stroke="${T.light}" stroke-opacity="0.85" stroke-width="0.9" stroke-linecap="round" transform="translate(0 -1.2)"/>`
    + `<path d="${tail}" fill="none" stroke="${T.dark}" stroke-opacity="0.6" stroke-width="3.6" stroke-dasharray="0.8 4.2"/>`
    + petal(-14, 3.8, -12, 7, 2.2, T.accent, T) + petal(-27, 2.8, -6, 7.4, 2.3, T.accent, T) + petal(-41, 3.6, 4, 7, 2.2, T.accent, T) + petal(-54, 4.8, 10, 6, 1.8, T.accent, T)
    + petal(-66.4, 7, -84, 8.4, 2.6, T.accent, T) + petal(-66.4, 7, -110, 6, 1.8, T.ember, T) + dot(-20, 9.4, 1, T.ember) + dot(-46, 10.6, 1, T.ember) + star4(-34, 10.6, 1.6, T.light, 0.9);
  const waves = [[10, 0.95, 1.1], [15, 0.6, 0.9], [20, 0.35, 0.8]].map(([r, op, w]) => `<path d="M${-r * 0.9} ${6 - r * 0.45}A${r} ${r} 0 0 1 ${r * 0.9} ${6 - r * 0.45}" fill="none" stroke="${T.ember}" stroke-opacity="${op}" stroke-width="${w}" stroke-linecap="round"/>`).join('');
  return `${defs(T, P).replace(`id="${P}e"`, `id="${P}ey"`)}<ellipse cx="0" cy="5" rx="16" ry="6" fill="url(#${P}a)"/>${half}${mirror(half)}${waves}${gem(0, 6, 6.6, T.ruby, T)}`;
};

// ---- vòng thân dựng từ cung tròn: chuỗi Bézier bậc 3 bám vành bán kính r, từ góc a0 → a1 (độ, chiều kim đồng hồ) ----
const arcCtrl = (r, a0, a1, step = 40) => {
  const kit = require('../../dragonKit');
  const rad = (a) => (a * Math.PI) / 180;
  const segs = Math.max(1, Math.ceil(Math.abs(a1 - a0) / step));
  const dd = (a1 - a0) / segs;
  const k = (4 / 3) * Math.tan(rad(dd) / 4);
  const pts = [kit.polar(r, a0)];
  for (let i = 0; i < segs; i += 1) {
    const t0 = a0 + dd * i; const t1 = t0 + dd;
    const p0 = kit.polar(r, t0); const p1 = kit.polar(r, t1);
    pts.push([p0[0] + k * r * Math.cos(rad(t0)), p0[1] + k * r * Math.sin(rad(t0))]);
    pts.push([p1[0] - k * r * Math.cos(rad(t1)), p1[1] - k * r * Math.sin(rad(t1))]);
    pts.push(p1);
  }
  return pts;
};

// KHUNG AVATAR (tự dựng, không qua bonusKit.build để vành là đồng sẫm — rồng vàng mới nổi). Vẽ cho R=70 rồi scale(R/70). Mọi nét r ∈ [64, 84].
// Đầu gầm ở đỉnh (0°, thẳng đứng, chân hàm r=66, sừng r=84); thân bò theo chiều kim đồng hồ ôm cả vành, đuôi kết sát đầu hoá 3 vòng sóng âm.
const avatarFrame = (T, R = 70, h) => {
  const kit = require('../../dragonKit');
  const { polar, dot, star4, gem, pearl, petal } = h;
  const nn = kit.n;
  const P = 'shop_cl_bolao-avatar-';
  const k = Number((R / 70).toFixed(4));
  const RB = 73.6;
  const A0 = 24;
  const A1 = 336;
  const prof = (t) => 1.5 + 6.2 * Math.pow(1 - t, 0.8) + 1.2 * Math.exp(-Math.pow((t - 0.06) / 0.05, 2));
  const tOf = (a) => (a - A0) / (A1 - A0);
  const ctrl = arcCtrl(RB, A0, A1);
  const extra = `<radialGradient id="${P}r" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="82"><stop offset="0.84" stop-color="${T.dark}"/><stop offset="0.9" stop-color="#C98A12"/><stop offset="0.95" stop-color="${T.main}"/><stop offset="0.98" stop-color="${T.light}"/></radialGradient>`
    + `<radialGradient id="${P}q" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="80"><stop offset="0.86" stop-color="#3A1A04"/><stop offset="0.92" stop-color="${T.void}"/><stop offset="0.97" stop-color="#3A1A04"/></radialGradient>`
    + `<path id="${P}s" d="M-1.5 0.7Q0 -1.5 1.5 0.7" fill="none" stroke="${T.dark}" stroke-opacity="0.8" stroke-width="0.6" stroke-linecap="round"/>`
    + `<path id="${P}n" d="M-2.2 0C-2 -3 -0.6 -5 1 -6.6C0.8 -4.2 2 -2.4 2.2 0Z" fill="url(#${P}f)" stroke="${T.dark}" stroke-width="0.4" stroke-linejoin="round"/>`;
  const ring = `<path fill-rule="evenodd" fill="url(#${P}q)" d="M-77.6 0A77.6 77.6 0 1 0 77.6 0A77.6 77.6 0 1 0 -77.6 0ZM-70 0A70 70 0 1 0 70 0A70 70 0 1 0 -70 0Z"/>`
    + `<circle r="70.4" fill="none" stroke="${T.ember}" stroke-opacity="0.6" stroke-width="0.8"/><circle r="77.2" fill="none" stroke="${T.main}" stroke-opacity="0.9" stroke-width="0.9"/><circle r="78.5" fill="none" stroke="${T.light}" stroke-opacity="0.5" stroke-width="0.5"/>`;
  // sóng âm gợn ở mép trong vành (cung ngắn mỗi 20°, chừa chỗ đầu)
  let rip = '';
  for (let a = 40; a <= 320; a += 20) { const [x1, y1] = polar(66.4, a - 6); const [cx, cy] = polar(64.6, a); const [x2, y2] = polar(66.4, a + 6); rip += `M${x1} ${y1}Q${cx} ${cy} ${x2} ${y2}`; }
  const ripple = `<path d="${rip}" fill="none" stroke="${T.ember}" stroke-opacity="0.65" stroke-width="0.9" stroke-linecap="round"/>`;
  let scl = '';
  for (let a = A0 + 6; a < A1 - 8; a += 20) {
    const w = prof(tOf(a));
    const [x, y] = polar(RB + (Math.round((a - A0) / 20) % 2 ? 1 : -1) * w * 0.2, a);
    scl += `<use href="#${P}s" transform="translate(${x} ${y}) rotate(${nn(a + 90)}) scale(${nn(0.6 + w * 0.2)})"/>`;
  }
  let fins = '';
  for (let a = A0 + 4; a < A1 - 16; a += 24) {
    const t = tOf(a);
    const [x, y] = polar(RB + prof(t) * 0.3, a);
    fins += `<use href="#${P}n" transform="translate(${x} ${y}) rotate(${nn(a + 12)}) scale(${nn(0.7 + 0.5 * (1 - t))})"/>`;
  }
  const body = `<path d="${kit.taperPath(ctrl, 0, 0, 8, prof)}" fill="url(#${P}r)" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/>`
    + `<path d="${kit.spine(arcCtrl(RB + 1.4, A0 + 6, A1 - 40))}" fill="none" stroke="${T.light}" stroke-opacity="0.7" stroke-width="0.6" stroke-linecap="round"/>${scl}`;
  // 2 vuốt bám vành hai bên đầu, mũi vuốt hướng vào tâm
  const claws = [-26, 26].map((a) => { const [x, y] = polar(75.6, a); return kit.claw(T, P, x, y, a + 180, 0.7); }).join('');
  // đuôi: 3 vòng sóng âm toả ra từ mút đuôi + 2 ngọn lửa nhỏ
  const [tx, ty] = polar(RB, A1);
  let tail = petal(tx, ty, A1 + 86, 12, 3.4, T.accent, T) + petal(tx, ty, A1 + 112, 8, 2.4, T.ember, T);
  [[3.6, 0.9, 1.3], [6.4, 0.65, 1.0], [9.2, 0.4, 0.8]].forEach(([rr, op, w]) => {
    const [cx, cy] = polar(RB + 1, A1 + 6);
    tail += `<path d="M${nn(cx + rr * Math.cos(((A1 + 20) * Math.PI) / 180))} ${nn(cy + rr * Math.sin(((A1 + 20) * Math.PI) / 180))}A${rr} ${rr} 0 0 1 ${nn(cx + rr * Math.cos(((A1 + 160) * Math.PI) / 180))} ${nn(cy + rr * Math.sin(((A1 + 160) * Math.PI) / 180))}" fill="none" stroke="${T.ember}" stroke-opacity="${op}" stroke-width="${w}" stroke-linecap="round"/>`;
  });
  // đinh ngọc lửa + ngọc trai quanh vành ngoài (chừa chỗ đầu: |a| < 30°)
  let studs = '';
  for (let a = 45; a < 330; a += 30) { const [x, y] = polar(79.4, a); studs += (a - 45) % 60 === 0 ? gem(x, y, 3.1, T.ruby, T, a) : pearl(x, y, 1.6, T); }
  let embers = '';
  [[100, 80.8], [160, 80.6], [200, 81], [260, 80.8], [300, 81]].forEach(([a, r], i) => { const [x, y] = polar(r, a); embers += i % 2 ? star4(x, y, 1.6, T.accent, 0.95) : dot(x, y, 0.9, T.ember, 0.95); });
  // đầu gầm ở đỉnh: head vẽ trong hệ (0..36), tâm x=0, chân hàm y=36; scale 0.5 → sừng r=84, chân hàm r=66
  const headG = `<g transform="translate(0 -65.2) scale(0.42)"><g transform="translate(0 -36)"><ellipse cx="0" cy="20" rx="34" ry="22" fill="url(#${P}a)"/>${head(T, P, h)}</g></g>`;
  const out = `${defs(T, P).replace('</defs>', `${extra}</defs>`)}<g transform="scale(${k})">${ring}${ripple}${fins}${body}${claws}${tail}${studs}${embers}${headG}</g>`;
  return out.replace(/\d+\.\d{3,}/g, (m) => String(nn(m)));
};

// điểm nhấn góc (nhô ra ngoài, lên-trái): sừng cong + 3 vòng sóng âm + ngọn sấm + ngọc lửa
const accent = (T, P, h) => {
  const { gem, petal, star4, dot } = h;
  const horn = 'M2 2C-6 0 -13 -2 -17 -9C-20 -14 -17 -20 -12 -20C-15 -16 -13 -13 -9 -13';
  const hornSvg = `<path d="${horn}" fill="none" stroke="${T.dark}" stroke-width="4.8" stroke-linecap="round" opacity="0.6"/><path d="${horn}" fill="none" stroke="url(#${P}h)" stroke-width="3.3" stroke-linecap="round"/><path d="${horn}" fill="none" stroke="${T.light}" stroke-opacity="0.75" stroke-width="0.6" stroke-linecap="round" transform="translate(0 -0.6)"/>`
    + `<path d="M-2 -1.6L-6.2 -2.4M-7.4 -4.6L-11 -6M-11.2 -8.6L-14.2 -10.6" stroke="${T.dark}" stroke-opacity="0.65" stroke-width="0.6" fill="none"/>`;
  const waves = [[13, 0.95], [18, 0.6], [23, 0.35]].map(([r, op]) => `<path d="M-3 ${-3 - r}A${r} ${r} 0 0 0 ${-3 - r} -3" fill="none" stroke="${T.ember}" stroke-opacity="${op}" stroke-width="1.1" stroke-linecap="round"/>`).join('');
  const bolt = `<path d="M-2 -6L-6.4 -11.6L-4 -11.8L-8.6 -19.2L-1.6 -12.8L-3.8 -12.6Z" fill="${T.accent}" stroke="${T.dark}" stroke-width="0.4" stroke-linejoin="round"/>`;
  return `${defs(T, P)}${waves}${hornSvg}${petal(-4, -4, -50, 22, 5, `url(#${P}f)`, T)}${petal(-4, -4, -16, 15, 4, T.accent, T)}${bolt}${gem(-3, -3, 3.4, T.ruby, T)}${star4(-24, -4, 2.2, T.light, 0.95)}${dot(-24, -14, 1, T.ember)}`;
};
module.exports = { avatarFrame, avatar, crest, corner, edge, side, bottom, accent, emblem, emblemGhost, head, defs, arcCtrl };
