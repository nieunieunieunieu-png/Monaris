// ===== hoso/frame/shop_cl_nhaitri/motif.js — Nhai Tí Chiến Long: rồng chiến đầu sói/báo, giáp thép, sừng kiếm, mắt đỏ máu =====
// Task 3-A: avatar + accent + emblem/emblemGhost (đầu rồng độc lập, tâm (0,0), bán kính ≈ 20, hướng LÊN = hướng mọc sừng kiếm).
// Task 3-B + 3-C (đã làm): corner / edge / side / bottom / crest.
// Hình học (giữ hợp đồng): avatar mọi nét r ≤ 84, điểm nhấn lấn vào trong r ≥ 64; accent trong ô 28×28 nhô ra ngoài (lên-trái).
const kit = require('../../dragonKit');

const n = kit.n;
const sc = (T, w = 0.6) => `stroke="${T.dark}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

// gradient dùng chung (id theo tiền tố P): b/v/o của dragonKit + h (lưỡi kiếm) + p (tấm giáp) + e (mắt) + m (khoang miệng)
const defs = (T, P) => kit.dragonDefs(T, P).replace('</defs>', ''
  + `<linearGradient id="${P}h" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${T.dark}"/><stop offset="0.5" stop-color="${T.steel}"/><stop offset="1" stop-color="${T.light}"/></linearGradient>`
  + `<linearGradient id="${P}p" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.5" stop-color="${T.main}"/><stop offset="1" stop-color="${T.steel}"/></linearGradient>`
  + `<radialGradient id="${P}e" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.3" stop-color="#FF5A66"/><stop offset="1" stop-color="#8E0F1C"/></radialGradient>`
  + `<linearGradient id="${P}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.void}"/><stop offset="1" stop-color="${T.mouth}"/></linearGradient>`
  + '</defs>');

// ---- đầu rồng: sọ góc cạnh như mũ giáp, mõm sói thon, sừng kiếm, mắt nheo đỏ máu; y: kiếm giữa -24 … cằm +22 ----
const HALF = [[0, -13.5], [7, -13], [13, -9.5], [17.5, -4], [20, 2], [18.4, 6.6], [14.4, 10.8], [10.4, 16.8], [5, 20.6], [0, 21.6]];
const SKULL = (() => {
  const R = HALF.map(([x, y]) => `${x} ${y}`);
  const L = HALF.slice(1, -1).reverse().map(([x, y]) => `${-x} ${y}`);
  return `M${R.join('L')}L${L.join('L')}Z`;
})();
const HORN_R = 'M5.2 -11.8L16.5 -23L12.6 -9.2Z';
const HORN_L = 'M-5.2 -11.8L-16.5 -23L-12.6 -9.2Z';
const CROWN = 'M-1.9 -12.6L0 -24.4L1.9 -12.6Z';

// nửa PHẢI (x ≥ 0) phần sau + phần trên mặt (không nét viền chạm trục x=0)
const headHalf = (T, P, lite) => {
  const o = sc(T, 0.6);
  const blade = (d) => `<path d="${d}" fill="url(#${P}h)" ${o}/>`;
  const horn = blade(HORN_R)
    + `<path d="M8 -12.4L14.6 -20.6" stroke="${T.light}" stroke-opacity="0.9" stroke-width="0.55" fill="none" stroke-linecap="round"/>`
    + (lite ? '' : blade('M13.6 -9L24 -15.6L18.4 -3.4Z') + '<path d="M16.6 -8.6L21.8 -13.4" stroke="#fff" stroke-opacity="0.85" stroke-width="0.5" fill="none" stroke-linecap="round"/>');
  const tufts = lite ? '' : blade('M18.6 1.4L27.4 -1L19.6 6.6Z') + blade('M17.4 6.4L26.8 7.6L16.2 11.4Z') + blade('M14.4 10.6L22 15L11.8 14.6Z');
  const front = `<path d="M2.6 0.6L16.8 -5.8L19.2 -1.6L12.2 -0.6L4.6 3.6Z" fill="${T.dark}" stroke="${T.dark}" stroke-width="0.4" stroke-linejoin="round"/><path d="M3.8 0.4L16 -5" stroke="${T.light}" stroke-opacity="0.7" stroke-width="0.5"/>`
    + `<circle cx="10.6" cy="1.4" r="4.8" fill="url(#${P}o)"/><path d="M4.2 2.6C6.8 -0.8 12.6 -2.2 17 -1.4C14.2 3.2 8.2 4.8 4.2 2.6Z" fill="url(#${P}e)" stroke="${T.dark}" stroke-width="0.55" stroke-linejoin="round"/>`
    + `<ellipse cx="10.4" cy="1.2" rx="0.7" ry="2.2" transform="rotate(-20 10.4 1.2)" fill="#1a0004"/><circle cx="8.2" cy="0.4" r="0.55" fill="#fff"/>`
    + `<path d="M9.2 5.4L8.2 9.6M12.6 4.6L11.8 8.8" stroke="${T.ruby}" stroke-width="0.9" fill="none" stroke-linecap="round"/>`
    + `<path d="M0 4.6C3.2 4.4 6 6 7 9.6L5.4 13L0 13.4Z" fill="${T.light}" fill-opacity="0.28"/>`
    + `<path d="M11.4 -9L15.4 -5.6M14 -11.4L17.6 -8.2M17.6 -1.8L19.4 4M13.4 8.4L17 7.6" stroke="${T.dark}" stroke-opacity="0.6" stroke-width="0.55" fill="none" stroke-linecap="round"/>`
    + `<path d="M0.6 -12.8C5.4 -12.8 10.4 -10.6 13.2 -7" stroke="${T.light}" stroke-opacity="0.9" stroke-width="0.7" fill="none" stroke-linecap="round"/>`;
  return { back: `${tufts}${horn}`, front };
};

const head = (T, P, h, lite = false) => {
  const { back, front } = headHalf(T, P, lite);
  const o = sc(T, 0.6);
  const skull = `<path d="${SKULL}" fill="url(#${P}b)" ${o}/>`;
  // tấm giáp trán chữ V + ruby, mõm: mũi, khoang miệng, nanh, tấm cằm
  const plate = `<path d="M0 -12.8L8.6 -10.4L7.4 -4.2L0 -1.6L-7.4 -4.2L-8.6 -10.4Z" fill="url(#${P}p)" ${o}/><path d="M0 -12.2V-2.4M-6 -9L-5 -5.2M6 -9L5 -5.2" stroke="${T.dark}" stroke-opacity="0.55" stroke-width="0.5" fill="none" stroke-linecap="round"/>${h.gem(0, -7.4, 2.2, T.ruby, T)}`;
  const nose = `<path d="M-3 8.2Q0 7 3 8.2L0 11.4Z" fill="${T.void}" stroke="${T.dark}" stroke-width="0.3"/>`;
  const mouth = `<path d="M-9.6 12.4C-5 13.6 5 13.6 9.6 12.4C8 16.2 4 18.6 0 18.6C-4 18.6 -8 16.2 -9.6 12.4Z" fill="url(#${P}m)"/>`
    + `<path d="M-5.4 12.8L-3.9 18L-2.4 13.1ZM2.4 13.1L3.9 18L5.4 12.8ZM-9 12.3L-7.8 15.6L-6.4 12.6ZM6.4 12.6L7.8 15.6L9 12.3Z" fill="#FFFBEA" stroke="${T.dark}" stroke-width="0.35" stroke-linejoin="round"/>`
    + `<path d="M-2.2 18.6L-1.4 15.8L-0.6 18.7ZM0.6 18.7L1.4 15.8L2.2 18.6Z" fill="#FFFBEA" stroke="${T.dark}" stroke-width="0.3" stroke-linejoin="round"/>`
    + `<path d="M-9.6 12.4C-5 13.6 5 13.6 9.6 12.4" stroke="${T.dark}" stroke-width="0.7" fill="none" stroke-linecap="round"/>`
    + `<path d="M-8 18.2C-4 21.4 4 21.4 8 18.2L5 22.4L0 23.2L-5 22.4Z" fill="url(#${P}p)" ${o}/><path d="M0 19.6V22.8" stroke="${T.dark}" stroke-opacity="0.5" stroke-width="0.5"/>`;
  const crown = `<path d="${CROWN}" fill="url(#${P}h)" ${o}/><path d="M0 -13.6V-22.6" stroke="#fff" stroke-opacity="0.85" stroke-width="0.5" stroke-linecap="round"/>`;
  return `<defs><clipPath id="${P}c"><path d="${SKULL}"/></clipPath><g id="${P}hb">${back}</g><g id="${P}hf"><g clip-path="url(#${P}c)">${front}</g></g></defs>`
    + `<use href="#${P}hb"/><use href="#${P}hb" transform="scale(-1 1)"/>${skull}<use href="#${P}hf"/><use href="#${P}hf" transform="scale(-1 1)"/>${plate}${nose}${mouth}${crown}`;
};

// emblem: đầu rồng độc lập, tâm (0,0), bán kính ≈ 20 — dùng cho avatar + Cửu Long Chí Tôn
const emblem = (T, P, h) => defs(T, P) + head(T, P, h);
// emblemGhost: cùng hình dạng, bóng mờ nét đứt (rồng chưa sở hữu) + chấm đỏ mờ
const emblemGhost = (T, P, h) => kit.ghost(`${SKULL}${HORN_R}${HORN_L}${CROWN}`, 0.3) + kit.ghostDot(0, 0, T.accent);

// ---- vòng thân dựng từ cung tròn: chuỗi Bézier bậc 3 (3k+1 điểm) bám vành bán kính r, từ góc a0 → a1 (độ, chiều kim đồng hồ) ----
const arcCtrl = (r, a0, a1, step = 40) => {
  const { polar } = kit;
  const segs = Math.max(1, Math.ceil(Math.abs(a1 - a0) / step));
  const d = (a1 - a0) / segs;
  const rad = (a) => (a * Math.PI) / 180;
  const k = (4 / 3) * Math.tan(rad(d) / 4);
  const pts = [polar(r, a0)];
  for (let i = 0; i < segs; i += 1) {
    const t0 = a0 + d * i;
    const t1 = t0 + d;
    const p0 = polar(r, t0);
    const p1 = polar(r, t1);
    pts.push([p0[0] + k * r * Math.cos(rad(t0)), p0[1] + k * r * Math.sin(rad(t0))]);
    pts.push([p1[0] - k * r * Math.cos(rad(t1)), p1[1] - k * r * Math.sin(rad(t1))]);
    pts.push(p1);
  }
  return pts;
};

const HEAD_A = 315; // đầu ngồi ở góc trên-trái, sừng kiếm hướng ra ngoài vành
const TAIL_A = 290; // đuôi kết sát đầu, hoá lưỡi kiếm

// KHUNG AVATAR (tự dựng). Vẽ cho R=70 rồi scale(R/70). Mọi nét r ∈ [64, 84]. Giáp/vây kiếm là <use> của 1 hình mẫu.
const avatarFrame = (T, R = 70, h) => {
  const { polar, dot, star4, gem, pearl } = h;
  const P = 'shop_cl_nhaitri-avatar-';
  const k = Number((R / 70).toFixed(4));
  const RB = 73.6;
  const A0 = HEAD_A + 4;
  const A1 = TAIL_A + 360;
  const prof = (t) => 2.2 + 7.6 * Math.pow(1 - t, 0.85) + 1.6 * Math.exp(-Math.pow((t - 0.08) / 0.06, 2));
  const tOf = (a) => (a - A0) / (A1 - A0);
  const ctrl = arcCtrl(RB, A0, A1);
  const extra = `<radialGradient id="${P}r" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="82"><stop offset="0.84" stop-color="${T.dark}"/><stop offset="0.9" stop-color="${T.steel}"/><stop offset="0.95" stop-color="${T.main}"/><stop offset="0.98" stop-color="${T.light}"/></radialGradient>`
    + `<radialGradient id="${P}q" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="80"><stop offset="0.86" stop-color="#2A2C40"/><stop offset="0.92" stop-color="${T.void}"/><stop offset="0.97" stop-color="#2A2C40"/></radialGradient>`
    + `<path id="${P}s" d="M0 -3.4V3.4" stroke="${T.dark}" stroke-opacity="0.85" stroke-width="0.7" stroke-linecap="round"/>`
    + `<path id="${P}n" d="M-2.2 0L0.4 -8L2.4 0Z" fill="url(#${P}h)" stroke="${T.dark}" stroke-width="0.45" stroke-linejoin="round"/>`
    + `<path id="${P}k" d="M-3.2 0.2L0 -4.6L3.2 0.2Z" fill="${T.steel}" fill-opacity="0.9" stroke="${T.dark}" stroke-width="0.5" stroke-linejoin="round"/>`;
  const ring = `<path fill-rule="evenodd" fill="url(#${P}q)" d="M-77.6 0A77.6 77.6 0 1 0 77.6 0A77.6 77.6 0 1 0 -77.6 0ZM-70 0A70 70 0 1 0 70 0A70 70 0 1 0 -70 0Z"/>`
    + `<circle r="70.4" fill="none" stroke="${T.accent}" stroke-opacity="0.7" stroke-width="0.8"/><circle r="77.2" fill="none" stroke="${T.main}" stroke-opacity="0.9" stroke-width="0.9"/><circle r="78.5" fill="none" stroke="${T.light}" stroke-opacity="0.55" stroke-width="0.5"/>`;
  // gai thép nhọn quanh mép trong (mỗi 15°)
  let spikes = '';
  for (let a = 0; a < 360; a += 15) { const [x, y] = polar(67.6, a); spikes += `<use href="#${P}k" transform="translate(${x} ${y}) rotate(${a + 180})"/>`; }
  // thân: gradient hướng tâm (trong tối → ngoài sáng) + vệt sáng sống lưng + khe giáp ngang thân
  let seams = '';
  for (let a = A0 + 8; a < A1 - 10; a += 11) {
    const w = prof(tOf(a));
    if (w < 2.2) continue;
    const [x, y] = polar(RB, a);
    seams += `<use href="#${P}s" transform="translate(${x} ${y}) rotate(${n(a)}) scale(${n(0.55 + w * 0.17)})"/>`;
  }
  let fins = '';
  for (let a = A0 + 4; a < A1 - 20; a += 24) {
    const t = tOf(a);
    const [x, y] = polar(RB + prof(t) * 0.1, a);
    fins += `<use href="#${P}n" transform="translate(${x} ${y}) rotate(${n(a + 14)}) scale(${n(0.6 + 0.4 * (1 - t))})"/>`;
  }
  const body = `<path d="${kit.taperPath(ctrl, 0, 0, 8, prof)}" fill="url(#${P}r)" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/>`
    + `<path d="${kit.spine(arcCtrl(RB + 1.4, A0 + 6, A1 - 40))}" fill="none" stroke="${T.light}" stroke-opacity="0.8" stroke-width="0.6" stroke-linecap="round"/>${seams}`;
  const claws = [HEAD_A - 22, HEAD_A + 30].map((a) => { const [x, y] = polar(75.6, a); return kit.claw(T, P, x, y, a + 180, 0.7); }).join('');
  // đuôi hoá lưỡi kiếm: lưỡi thon chạy tiếp theo tiếp tuyến, rãnh máu đỏ giữa lưỡi
  const [tx, ty] = polar(RB, TAIL_A);
  const tail = `<g transform="translate(${tx} ${ty}) rotate(${TAIL_A + 90})"><path d="M-3.8 0L-2.2 -9L0 -16L2.2 -9L3.8 0Z" fill="url(#${P}h)" stroke="${T.dark}" stroke-width="0.6" stroke-linejoin="round"/><path d="M0 -1.4V-13.4" stroke="${T.accent}" stroke-width="0.8" stroke-linecap="round"/><path d="M-1.4 -2L-0.8 -9.6" stroke="#fff" stroke-opacity="0.85" stroke-width="0.4" fill="none"/></g>`;
  let studs = '';
  for (let a = 15; a < 360; a += 30) {
    if (a > 280 && a < 360) continue;
    const [x, y] = polar(79.4, a);
    studs += (a - 15) % 60 === 0 ? gem(x, y, 3.1, T.ruby, T, a) : pearl(x, y, 1.6, T);
  }
  let marks = '';
  [[40, 80.6], [100, 81], [160, 80.6], [220, 81], [262, 80.8], [352, 81.2]].forEach(([a, r], i) => { const [x, y] = polar(r, a); marks += i % 2 ? star4(x, y, 1.6, T.light, 0.95) : dot(x, y, 0.9, T.ember, 0.95); });
  const [hx, hy] = polar(71.7, HEAD_A);
  const headG = `<g transform="translate(${hx} ${hy}) rotate(${HEAD_A})"><circle r="15" fill="url(#${P}o)"/><g transform="scale(0.5)">${head(T, P, h, true)}</g></g>`;
  return `${defs(T, P).replace('</defs>', `${extra}</defs>`)}<g transform="scale(${k})">${ring}${spikes}${fins}${body}${claws}${tail}${studs}${marks}${headG}</g>`;
};

// điểm nhấn góc (28×28 nhô ra ngoài, lên-trái): 2 thanh kiếm bắt chéo + ruby + giọt máu
const sword = (T, P, x0, y0, x1, y1) => {
  const L = Math.hypot(x1 - x0, y1 - y0);
  const a = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI + 90; // local -y = hướng từ chuôi tới mũi
  return `<g transform="translate(${n(x0)} ${n(y0)}) rotate(${n(a)})"><path d="M-1.9 -7L-1.9 ${n(-L + 3)}L0 ${n(-L)}L1.9 ${n(-L + 3)}L1.9 -7Z" fill="url(#${P}h)" ${sc(T, 0.5)}/><path d="M0 -8V${n(-L + 4)}" stroke="${T.accent}" stroke-width="0.7" stroke-linecap="round"/><path d="M-0.9 -8L-0.9 ${n(-L + 5)}" stroke="#fff" stroke-opacity="0.8" stroke-width="0.35"/>`
    + `<path d="M-5 -6.4L5 -6.4L4.2 -4.6L-4.2 -4.6Z" fill="url(#${P}p)" ${sc(T, 0.5)}/><rect x="-1.1" y="-4.6" width="2.2" height="4.4" fill="${T.dark}"/><circle cy="0.6" r="1.7" fill="${T.ruby}" stroke="${T.dark}" stroke-width="0.4"/></g>`;
};
const accent = (T, P, h) => {
  const { gem, star4, dot } = h;
  return `${defs(T, P)}${sword(T, P, 1.8, 1.8, -24, -24)}${sword(T, P, 1.8, -24, -24, 1.8)}${gem(-10.5, -10.5, 3.2, T.ruby, T)}${star4(-24, -4, 1.8, T.light, 0.95)}${star4(-5, -25, 1.7, T.light, 0.95)}${dot(-20, -22, 1, T.accent)}${dot(-24, -14, 0.9, T.accent)}`;
};

// ================= Task 3-B: corner / edge / side / bottom =================
// Id gradient (`<P>b/v/o/h/p/e/m`) do defs(T,P) tạo; corner mang defs (khai trong <defs> của border; gradient mắt `e` đổi thành `ey` vì bonusKit dùng `<P>e`,`<P>k`,`<P>g` cho nhóm cạnh/góc/viền).

// 1 lưỡi kiếm ngắn nằm dọc cạnh trên (từ góc chạy theo +x): thân thép thon, rãnh máu đỏ, mũi nhọn, móc chắn kiếm cong xuống (+y)
const finger = (T, P) => {
  const o = sc(T, 0.6);
  return `<path d="M9 3L36 4.4L45 7.4L36 9.6L9 10.6Z" fill="url(#${P}h)" ${o}/>`
    + `<path d="M11 6.8L38 7" stroke="${T.accent}" stroke-width="0.9" stroke-linecap="round"/><path d="M12 4.8L36 5.6" stroke="#fff" stroke-opacity="0.8" stroke-width="0.5" stroke-linecap="round"/>`
    + `<path d="M24 9.8C27 11 28.6 14.4 27.4 18.6C26.2 15.6 24.6 13.6 22.4 12.6Z" fill="url(#${P}p)" ${sc(T, 0.5)}/>`
    + `<path d="M34.6 9.4L36.4 14L38.4 9.2Z" fill="${T.accent}" ${sc(T, 0.4)}/>`;
};

// góc 44×44 (gốc ở đỉnh góc, trải sang +x +y): giáp tam giác thép + 2 lưỡi kiếm dọc hai cạnh (lưỡi thứ hai lật gương qua đường chéo) + ruby + giọt máu
const corner = (T, P, h) => {
  const { gem, star4, dot } = h;
  const arms = `<g transform="scale(0.93 1)">${finger(T, P)}</g><g transform="matrix(0 0.93 1 0 0 0)">${finger(T, P)}</g>`;
  const plate = `<path d="M0 0H19L13.4 6L6 13.4L0 19Z" fill="url(#${P}p)" ${sc(T, 0.7)}/><path d="M3 3H13M3 3V13M6 6L10 10" stroke="${T.dark}" stroke-opacity="0.55" stroke-width="0.6" fill="none" stroke-linecap="round"/>`;
  const dfs = defs(T, P).replace(`id="${P}e"`, `id="${P}ey"`);
  return `${dfs}${arms}${plate}<circle cx="8" cy="8" r="8.4" fill="url(#${P}o)"/>${gem(8, 8, 4.6, T.ruby, T)}${star4(25, 25, 2, T.light, 0.9)}${dot(32, 17, 0.9, T.accent, 0.95)}${dot(17, 32, 0.9, T.accent, 0.95)}`;
};

// đơn vị cạnh 44 (tâm x=0, chạy dọc cạnh trên, +y = vào trong, ≤ 22px): tấm giáp chữ V + ruby nhỏ + gai kiếm nhô ra ngoài ở mối nối bên phải
const edge = (T, P, h) => `<path d="M-17 7.6L0 21.6L17 7.6L10.4 7.6L0 15.4L-10.4 7.6Z" fill="url(#${P}p)" ${sc(T, 0.7)}/>`
  + `<path d="M-13 8.4L0 18.4L13 8.4" fill="none" stroke="${T.light}" stroke-opacity="0.75" stroke-width="0.6"/>`
  + `<path d="M0 8.4V14M-5 9.6V12.4M5 9.6V12.4" stroke="${T.dark}" stroke-opacity="0.55" stroke-width="0.6" stroke-linecap="round"/>`
  + `${h.spike(22, 9, 0, 8.6, 2.6, `url(#${P}h)`, T)}${h.dot(0, 11.6, 1.1, T.ruby, 0.95)}`;

// cạnh bên (cao 100, ±15 quanh x=0, nối khớp y=0/100): 4 mảnh giáp thoi dọc xương sống + 2 lưỡi gai (ra ngoài / vào trong) + ruby giữa
const side = (T, P, h) => {
  const { gem, star4, dot, spike } = h;
  let plates = '';
  [13, 37, 63, 87].forEach((y) => {
    plates += `<path d="M0 ${y - 10}L7.6 ${y}L0 ${y + 10}L-7.6 ${y}Z" fill="url(#${P}p)" ${sc(T, 0.7)}/><path d="M0 ${y - 7}L4.6 ${y}L0 ${y + 7}L-4.6 ${y}Z" fill="none" stroke="${T.dark}" stroke-opacity="0.5" stroke-width="0.6"/><path d="M0 ${y - 10}L7.6 ${y}L0 ${y}Z" fill="#fff" fill-opacity="0.25"/>`;
  });
  const blades = spike(0, 25, -90, 14, 3.4, `url(#${P}h)`, T) + spike(0, 75, 90, 14, 3.4, `url(#${P}h)`, T) + spike(0, 25, 90, 8, 2.2, `url(#${P}h)`, T) + spike(0, 75, -90, 8, 2.2, `url(#${P}h)`, T);
  return `${defs(T, P)}${plates}${blades}<circle cx="0" cy="50" r="9" fill="url(#${P}o)"/>${gem(0, 50, 4.2, T.ruby, T)}${star4(-9, 50, 1.8, T.light, 0.9)}${star4(9, 50, 1.8, T.light, 0.9)}${dot(-5, 3, 0.8, T.accent, 0.9)}${dot(5, 97, 0.8, T.accent, 0.9)}`;
};

// chân thẻ (gốc giữa mép dưới, cục bộ y ∈ [-4,12], nửa rộng ≤ 70, đối xứng): hai lưỡi kiếm ngang toả ra hai bên + gai giáp + khiên ruby giữa
const bottom = (T, P, h) => {
  const { gem, star4, dot, spike } = h;
  const half = () => `<path d="M8 4.4L58 3.2L69 5.8L58 8.2L8 8.6Z" fill="url(#${P}h)" ${sc(T, 0.7)}/>`
    + `<path d="M10 6.2L60 5.8" stroke="${T.accent}" stroke-width="1" stroke-linecap="round"/><path d="M10 4.6L56 4.2" stroke="#fff" stroke-opacity="0.8" stroke-width="0.5" stroke-linecap="round"/>`
    + `<path d="M30 8.4C32 10.4 32.4 12 31.6 12C30 11.2 28.4 10 27.6 8.4Z" fill="url(#${P}p)" ${sc(T, 0.4)}/>`
    + `${spike(24, 3.4, 0, 7, 2.2, `url(#${P}p)`, T)}${spike(40, 3.2, 0, 6, 2, `url(#${P}p)`, T)}${spike(54, 3.2, 0, 5.4, 1.8, `url(#${P}p)`, T)}${dot(46, 11, 0.8, T.accent, 0.9)}${star4(62, 0.4, 1.4, T.light, 0.95)}`;
  const centre = `<path d="M-10 1L10 1L8 9L0 12L-8 9Z" fill="url(#${P}p)" ${sc(T, 0.7)}/><path d="M0 1.4V11" stroke="${T.dark}" stroke-opacity="0.5" stroke-width="0.5"/><circle cx="0" cy="5" r="7" fill="url(#${P}o)"/>${gem(0, 5.2, 3.8, T.ruby, T)}`;
  return `${defs(T, P)}${half()}<g transform="scale(-1 1)">${half()}</g>${centre}`;
};

// ================= Task 3-C: crest =================
// Đỉnh thẻ (x −80..80, chân y=36): Nhai Tí ngự trên bệ giáp thép — quạt kiếm toả sau đầu, 2 lưỡi kiếm dài hai bên bệ, vuốt bám mép bệ, đầu gầm lớn nhìn thẳng.
const crest = (T, P, h) => {
  const { gem, star4, dot, mirror } = h;
  const sym = (f) => `${f}${mirror(f)}`;
  const o = sc(T, 0.8);
  // hình mẫu 1 thanh kiếm dài 50 (gốc (0,0), mũi hướng LÊN), dùng lại bằng <use>
  const sword = `<g id="${P}sw"><path d="M-3.4 0L-2 -40L0 -50L2 -40L3.4 0Z" fill="url(#${P}h)" ${sc(T, 0.7)}/><path d="M0 -3V-44" stroke="${T.accent}" stroke-width="0.9" stroke-linecap="round"/><path d="M-1.2 -6L-0.8 -40" stroke="#fff" stroke-opacity="0.8" stroke-width="0.5" fill="none"/></g>`;
  const useSw = (a, L) => `<use href="#${P}sw" transform="translate(0 26) rotate(${a}) scale(${n(L / 50 * 0.9)} ${n(L / 50)})"/>`;
  const fan = `<circle cx="0" cy="-4" r="40" fill="url(#${P}o)"/>` + sym(useSw(68, 56) + useSw(46, 62) + useSw(22, 66));
  // 2 lưỡi kiếm dài nằm hai bên bệ, mũi hất lên
  const wing = `<path d="M24 31C46 30 64 24 77 7C72 23 54 33 27 36Z" fill="url(#${P}h)" ${sc(T, 0.8)}/><path d="M30 31.6C48 30 62 24.6 73 12" stroke="${T.accent}" stroke-width="0.9" fill="none" stroke-linecap="round"/><path d="M34 29.6C50 28 62 23 71 12.4" stroke="#fff" stroke-opacity="0.8" stroke-width="0.5" fill="none"/>`;
  // bệ giáp: tấm thép rộng, mép dưới chạm y≈36, có khe tấm + đinh tán
  const base = `<path d="M-64 21L-44 24.4L44 24.4L64 21L58 31.4L34 35.6L-34 35.6L-58 31.4Z" fill="url(#${P}p)" ${o}/>`
    + `<path d="M-52 27L-30 29.6M52 27L30 29.6M-14 25V35M14 25V35" stroke="${T.dark}" stroke-opacity="0.55" stroke-width="0.7" fill="none" stroke-linecap="round"/><path d="M-60 21.8L-44 25M60 21.8L44 25" stroke="${T.light}" stroke-opacity="0.85" stroke-width="0.7" fill="none"/>`
    + `${dot(-50, 28.6, 1.1, T.dark, 0.7)}${dot(50, 28.6, 1.1, T.dark, 0.7)}${dot(-24, 31, 1, T.dark, 0.7)}${dot(24, 31, 1, T.dark, 0.7)}`
    + `<path d="M-9 24.4L0 35.6L9 24.4Z" fill="${T.dark}" fill-opacity="0.5"/>${gem(0, 30, 3.8, T.ruby, T)}`;
  // cổ giáp + 2 vuốt bám mép bệ
  const collar = `<path d="M-15 14L15 14L19 25L-19 25Z" fill="url(#${P}p)" ${sc(T, 0.7)}/><path d="M-9 15L-11.4 24M0 15V24M9 15L11.4 24" stroke="${T.dark}" stroke-opacity="0.5" stroke-width="0.6" fill="none"/>`;
  const claws = sym(kit.claw(T, P, -26, 26, 180, 1.05));
  const headG = `<g transform="translate(0 -5) scale(1.08)">${head(T, P, h)}</g>`;
  const sparks = sym(star4(-76, 8, 1.8, T.light, 0.9) + dot(-72, 0, 1, T.accent) + dot(-60, -14, 1, T.ember));
  const gd = `<defs>${sword}</defs>`;
  const out = defs(T, P) + gd + fan + sym(wing) + base + collar + claws + headG + sparks;
  return out.replace(/-?\d+\.\d{3,}/g, (m) => String(Number(Number(m).toFixed(2))));
};

module.exports = { avatarFrame, accent, emblem, emblemGhost, head, defs, arcCtrl, corner, edge, side, bottom, crest };
