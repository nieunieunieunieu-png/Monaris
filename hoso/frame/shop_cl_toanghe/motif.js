// ===== hoso/frame/shop_cl_toanghe/motif.js — Toan Nghê Hương Vân: rồng đầu sư tử ngồi nghiêm, bờm khói cuộn, râu thành làn hương, hạt châu =====
// Task 9-A: avatar + accent + emblem/emblemGhost (đầu rồng độc lập, tâm (0,0), bán kính ≈ 20, hướng LÊN = hướng mọc sừng/bờm).
// Task 9-B + 9-C (đã làm): corner / edge / side / bottom / crest.
// Hình học (giữ hợp đồng): avatar mọi nét r ≤ 84, điểm nhấn lấn vào trong r ≥ 64; accent trong ô 28×28 nhô ra ngoài (lên-trái).
const kit = require('../../dragonKit');

const n = kit.n;
const sc = (T, w = 0.6) => `stroke="${T.dark}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

// ---- bờm khói: 1 túm cuộn (cao 10, rộng ≈ 6) nằm trong defs, mỗi túm là 1 <use>; `mt` = lớp ngoài (tối → kem), `mu` = lớp trong (sáng) ----
const TUFT = 'M-2.6 0C-3.6 -3.4 -2.8 -6.6 -0.6 -8.8C0.8 -10.2 3.2 -10 3.6 -8.2C3.9 -6.8 2.8 -5.8 1.8 -6.2C2.2 -7.2 1.4 -8 0.4 -7.6C-0.8 -7 -0.8 -4.8 0.6 -3.2C1.6 -2 2.6 -1 2.6 0Z';
const tuftShape = (T, P, id, grad) => `<g id="${P}${id}"><path d="${TUFT}" fill="url(#${P}${grad})" stroke="${T.dark}" stroke-width="0.45" stroke-linejoin="round"/><path d="M-1.7 -1.6C-2.1 -4 -1.5 -6.2 -0.2 -7.8" fill="none" stroke="#fff" stroke-opacity="0.7" stroke-width="0.5" stroke-linecap="round"/></g>`;
// gốc (x,y), hướng a (độ, 0 = lên, chiều kim đồng hồ), dài len, rộng w; flip = -1 để lật gương
const tuft = (P, id, x, y, a, len, w, flip = 1) => `<use href="#${P}${id}" transform="translate(${n(x)} ${n(y)}) rotate(${n(a)}) scale(${n((w / 5) * flip)} ${n(len / 10)})"/>`;

// đám mây nhỏ (ngọc như ý): 3 vòng tròn gộp bóng, base phẳng ở y>0, "lên" = y âm. Viền ngoài vẽ trước, ruột sáng vẽ sau → chỉ còn viền hợp.
const cloudShape = (T, P) => {
  const cs = '<circle cx="-2.7" cy="0.7" r="1.7"/><circle cx="2.7" cy="0.7" r="1.7"/><circle cx="0" cy="-0.5" r="2.3"/>';
  return `<g id="${P}cl"><g fill="${T.dark}" stroke="${T.dark}" stroke-width="1">${cs}</g><g fill="url(#${P}ct)">${cs}</g><path d="M-1.6 -1.9C-0.8 -2.8 0.4 -2.8 1 -2.2" fill="none" stroke="#fff" stroke-opacity="0.85" stroke-width="0.4" stroke-linecap="round"/></g>`;
};

// gradient dùng chung (id theo tiền tố P của phần gọi): b/v/o của dragonKit + mg/mi (bờm) + ct (mây) + e (mắt) + h (sừng) + nz (mũi) + cloud `cl` + túm `mt`/`mu`
const defs = (T, P) => kit.dragonDefs(T, P).replace('</defs>', ''
  + `<linearGradient id="${P}mg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${T.dark}"/><stop offset="0.45" stop-color="${T.main}"/><stop offset="1" stop-color="${T.light}"/></linearGradient>`
  + `<linearGradient id="${P}mi" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${T.main}"/><stop offset="0.6" stop-color="${T.light}"/><stop offset="1" stop-color="#FFFFFF"/></linearGradient>`
  + `<linearGradient id="${P}ct" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.55" stop-color="${T.light}"/><stop offset="1" stop-color="${T.main}"/></linearGradient>`
  + `<radialGradient id="${P}e" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.35" stop-color="${T.accent}"/><stop offset="1" stop-color="${T.ruby}"/></radialGradient>`
  + `<linearGradient id="${P}h" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${T.dark}"/><stop offset="0.5" stop-color="${T.horn}"/><stop offset="1" stop-color="#FFFFFF"/></linearGradient>`
  + `<linearGradient id="${P}nz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.ruby}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient>`
  + tuftShape(T, P, 'mt', 'mg') + tuftShape(T, P, 'mu', 'mi') + cloudShape(T, P)
  + '</defs>');
// đám mây tại (x,y), xoay a, tỉ lệ s
const cloud = (P, x, y, a = 0, s = 1) => `<use href="#${P}cl" transform="translate(${n(x)} ${n(y)}) rotate(${n(a)}) scale(${n(s)})"/>`;

// ---- đầu rồng sư tử: mặt rộng, mày lông nặng, mũi bè, má phính; bờm khói 2 lớp + sừng ngà ngắn + tai tròn + râu làn hương. y: bờm -24 … cằm +21 ----
const SKULL = 'M0 -12.2C5.4 -12.8 11 -11.4 14.6 -7.6L19 -1.8C21 1.6 20.8 6 18.6 10L15.2 15C12 18.6 7.4 20.6 3.6 21.1C2.4 21.3 1.2 21.3 0 21.3C-1.2 21.3 -2.4 21.3 -3.6 21.1C-7.4 20.6 -12 18.6 -15.2 15L-18.6 10C-20.8 6 -21 1.6 -19 -1.8L-14.6 -7.6C-11 -11.4 -5.4 -12.8 0 -12.2Z';
const HORN_R = 'M5.2 -11.4C5.4 -16.6 9.2 -20.6 15.2 -22.4C13.8 -19 13.6 -15.8 12.6 -11.6Z';

// nửa PHẢI (x ≥ 0) của phần phụ: bờm, tai, sừng, râu, mắt, mày… (không nét viền chạm trục x=0 để ghép gương không lộ đường nối)
const headHalf = (T, P, h, lite) => {
  const { polar } = h;
  const o = sc(T, 0.6);
  let mane = '';
  const outer = lite ? [[34, 9.5, 4.4], [64, 10.5, 4.8], [96, 10.5, 4.8], [128, 9, 4.4]] : [[16, 19, 5.2], [38, 21, 5.6], [60, 22, 5.8], [82, 21.5, 5.8], [104, 20, 5.6], [126, 18, 5.2], [148, 15, 4.8]];
  const inner = lite ? [[50, 8.5, 4], [80, 8.5, 4], [112, 8, 3.8]] : [[27, 15, 4.8], [49, 16, 5], [71, 16.5, 5], [93, 16, 5], [115, 14.5, 4.8], [137, 12.5, 4.4]];
  outer.forEach(([a, len, w]) => { const [x, y] = polar(14.6, a); mane += tuft(P, 'mt', x, y, a, len, w); });
  inner.forEach(([a, len, w]) => { const [x, y] = polar(14, a); mane += tuft(P, 'mu', x, y, a, len, w); });
  const ear = true ? '' : `<path d="M12.6 -9.8C13.6 -14.6 18.6 -16.4 21.6 -13C23.4 -10.6 22 -6.6 18.8 -4.8Z" fill="url(#${P}b)" ${o}/><path d="M15 -9.6C16 -12.2 19 -13 20.4 -11C21.2 -9.4 20 -7.4 18.2 -6.8Z" fill="${T.ruby}" fill-opacity="0.75"/>`;
  const horn = `<path d="${HORN_R}" fill="url(#${P}h)" ${o}/>`
    + `<path d="M7 -12.6L10.4 -13.4M8 -15.6L11.6 -16.2M9.6 -18.4L12.8 -18.8" stroke="${T.dark}" stroke-opacity="0.55" stroke-width="0.5" fill="none" stroke-linecap="round"/>`
    + `<path d="M6.8 -11.8C7.6 -16 10.6 -19 14.4 -20.8" stroke="#fff" stroke-opacity="0.9" stroke-width="0.6" fill="none" stroke-linecap="round"/>`;
  // râu làn hương: 2 sợi cong thon kết hạt, cuộn đuôi như khói
  const whisk = lite ? '' : kit.whisker(T, [[16.4, 10.6], [22.4, 12.6], [26, 6.6], [30.6, 9.6]], 1.1, { r: 1.5, fill: T.accent })
    + kit.whisker(T, [[16.6, 13.8], [22, 17], [27.4, 13.6], [31.2, 18.6]], 0.9, { r: 1.2, fill: T.light });
  // phần trên mặt (kẹp trong sọ)
  const face = `<path d="M0 -3C3 -2.4 5.2 0.6 6 5L6.6 9.6L0 10.4Z" fill="${T.light}" fill-opacity="0.3"/>`
    + `<ellipse cx="6.9" cy="11.8" rx="6.6" ry="5.4" fill="${T.light}" fill-opacity="0.92" stroke="${T.dark}" stroke-opacity="0.6" stroke-width="0.5"/>`
    + `<path d="M4.4 11.2h0.1M7.2 10.2h0.1M9 12.2h0.1M6 13.4h0.1" stroke="${T.dark}" stroke-opacity="0.55" stroke-width="0.9" stroke-linecap="round"/>`
    + `<path d="M15.8 0.2C17.4 -1.6 18.8 -1.2 18.4 0.8M14.4 4.6C16 3 17.2 3.6 16.6 5.4M16.6 7.6C17.8 6.4 19 7 18.4 8.4" stroke="${T.dark}" stroke-opacity="0.5" stroke-width="0.55" fill="none" stroke-linecap="round"/>`
    + `<path d="M3.4 -10C6.4 -10.6 9.6 -9.4 11.6 -7M2 -6.6C4.8 -7 7.4 -6 9 -4.2" stroke="${T.dark}" stroke-opacity="0.45" stroke-width="0.55" fill="none" stroke-linecap="round"/>`;
  const brow = `<path d="M1.6 -3.6L17.6 -10.4" stroke="${T.dark}" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M2.6 -4.2L16.8 -10" stroke="${T.light}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
  const eye = `<circle cx="9.6" cy="-1.2" r="4.8" fill="url(#${P}o)"/><path d="M3.8 1.4C6 -1.8 11.8 -4.2 16 -4C13.6 0.6 7.4 3 3.8 1.4Z" fill="url(#${P}e)" stroke="${T.dark}" stroke-width="0.55" stroke-linejoin="round"/>`
    + `<ellipse cx="9.8" cy="-1.2" rx="0.8" ry="2.1" transform="rotate(-28 9.8 -1.2)" fill="#2A0A18"/><circle cx="8.3" cy="-2.5" r="0.75" fill="#fff"/><path d="M3.6 1C6 -2.4 11.8 -4.6 16.2 -4.2" stroke="${T.dark}" stroke-width="0.9" fill="none" stroke-linecap="round"/>`;
  const fang = `<path d="M4.6 15.2L5.6 18.6L7 15.4Z" fill="#FFFBEA" stroke="${T.dark}" stroke-width="0.4" stroke-linejoin="round"/>`;
  return { back: `${mane}${ear}${whisk}${horn}`, front: `${face}${brow}${eye}${fang}` };
};

const head = (T, P, h, lite = false) => {
  const { back, front } = headHalf(T, P, h, lite);
  const o = sc(T, 0.6);
  // lớp giữa (không lật): túm bờm đỉnh đầu + chòm râu cằm
  const crownBack = tuft(P, 'mt', 0, -10.4, 0, lite ? 12 : 14.6, 5.2) + tuft(P, 'mu', 0, -10.8, 0, lite ? 8 : 10, 4.2) + tuft(P, 'mu', 0, 18.4, 180, lite ? 6.6 : 8.6, 4);
  const skull = `<path d="${SKULL}" fill="url(#${P}b)" ${o}/>`;
  // mũi bè + rãnh môi + ấn vàng như ý giữa trán (không lật)
  const nose = `<path d="M-4.9 6.4C-2.8 5.2 2.8 5.2 4.9 6.4C4.7 9.2 2.2 11 0 11.4C-2.2 11 -4.7 9.2 -4.9 6.4Z" fill="url(#${P}nz)" stroke="${T.dark}" stroke-width="0.6" stroke-linejoin="round"/><path d="M-2.6 6.8C-1 6.2 1 6.2 2.6 6.8" stroke="#fff" stroke-opacity="0.75" stroke-width="0.6" fill="none" stroke-linecap="round"/>`
    + `<path d="M0 11.4V14M0 14C-2.8 16 -6.4 15.8 -8.6 13.4M0 14C2.8 16 6.4 15.8 8.6 13.4" stroke="${T.dark}" stroke-width="0.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  const mark = `<path d="M0 -9.8L2.3 -6.6L0 -3.4L-2.3 -6.6Z" fill="${T.accent}" stroke="${T.dark}" stroke-width="0.5" stroke-linejoin="round"/><path d="M2.6 -6.6C4.2 -6.6 5.4 -7.8 4.8 -9C4.2 -9.9 2.8 -9.4 3 -8.4M-2.6 -6.6C-4.2 -6.6 -5.4 -7.8 -4.8 -9C-4.2 -9.9 -2.8 -9.4 -3 -8.4" stroke="${T.accent}" stroke-width="0.8" fill="none" stroke-linecap="round"/><path d="M0 -9L1 -7.2" stroke="#fff" stroke-opacity="0.85" stroke-width="0.5" stroke-linecap="round"/>`;
  // nửa phải dựng 1 lần trong defs, nửa trái là <use> lật gương
  return `<defs><clipPath id="${P}c"><path d="${SKULL}"/></clipPath><g id="${P}hb">${back}</g><g id="${P}hf"><g clip-path="url(#${P}c)">${front}</g></g></defs>`
    + `<use href="#${P}hb"/><use href="#${P}hb" transform="scale(-1 1)"/>${crownBack}${skull}<use href="#${P}hf"/><use href="#${P}hf" transform="scale(-1 1)"/>${nose}${mark}`;
};

// emblem: đầu rồng độc lập, tâm (0,0), bán kính ≈ 20 — dùng cho avatar + Cửu Long Chí Tôn
const emblem = (T, P, h) => defs(T, P) + head(T, P, h);
// emblemGhost: cùng hình dạng (bờm khói lượn sóng + sừng + sọ), bóng mờ nét đứt (rồng chưa sở hữu) + chấm hồng mờ
const emblemGhost = (T, P, h) => {
  const { polar } = h;
  const hornL = 'M-5.2 -11.4C-5.4 -16.6 -9.2 -20.6 -15.2 -22.4C-13.8 -19 -13.6 -15.8 -12.6 -11.6Z';
  const N = 14;
  const step = 360 / N;
  let mane = `M${polar(22, 0).join(' ')}`;
  for (let i = 0; i < N; i += 1) {
    const c = polar(36, (i + 0.5) * step);
    const e = polar(22, (i + 1) * step);
    mane += `Q${c.join(' ')} ${e.join(' ')}`;
  }
  mane += 'Z';
  const faceLine = `<path d="${SKULL}" fill="none" stroke="#C7CBD6" stroke-width="0.7" stroke-dasharray="2 1.6" stroke-linejoin="round" opacity="0.3"/>`;
  return kit.ghost(`${mane}${HORN_R}${hornL}`, 0.3) + faceLine + kit.ghostDot(0, -1, T.main);
};

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

const HEAD_A = 315; // dựng cho đầu ở góc trên-trái rồi lật gương cả khung → đầu thực tế ở 45° (trên-phải)
const TAIL_A = 290; // đuôi kết sát đầu, hoá làn hương cuộn

// KHUNG AVATAR (tự dựng, không qua bonusKit.build để vành là mận tím sẫm — rồng hồng-kem mới nổi). Vẽ cho R=70 rồi scale(R/70).
// Mọi nét r ∈ [64, 84]. Vảy/mây là <use> của 1 hình mẫu để gọn dung lượng.
const avatarFrame = (T, R = 70, h) => {
  const { polar, dot, star4, gem, pearl } = h;
  const P = 'shop_cl_toanghe-avatar-';
  const k = Number((R / 70).toFixed(4));
  const RB = 73.6; // bán kính đường tâm thân rồng
  const A0 = HEAD_A + 4;
  const A1 = TAIL_A + 360;
  const prof = (t) => 1.4 + 6 * Math.pow(1 - t, 0.85) + 1.4 * Math.exp(-Math.pow((t - 0.08) / 0.06, 2));
  const tOf = (a) => (a - A0) / (A1 - A0);
  const ctrl = arcCtrl(RB, A0, A1);
  const extra = `<radialGradient id="${P}r" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="82"><stop offset="0.84" stop-color="${T.dark}"/><stop offset="0.9" stop-color="${T.main}"/><stop offset="0.95" stop-color="${T.light}"/><stop offset="0.98" stop-color="#FFFFFF"/></radialGradient>`
    + `<radialGradient id="${P}q" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="80"><stop offset="0.86" stop-color="#52183A"/><stop offset="0.92" stop-color="${T.void}"/><stop offset="0.97" stop-color="#52183A"/></radialGradient>`
    + `<path id="${P}s" d="M-1.5 0.7Q0 -1.5 1.5 0.7" fill="none" stroke="${T.dark}" stroke-opacity="0.8" stroke-width="0.6" stroke-linecap="round"/>`;
  // vành mận tím + 2 viền sáng
  const ring = `<path fill-rule="evenodd" fill="url(#${P}q)" d="M-77.6 0A77.6 77.6 0 1 0 77.6 0A77.6 77.6 0 1 0 -77.6 0ZM-70 0A70 70 0 1 0 70 0A70 70 0 1 0 -70 0Z"/>`
    + `<circle r="70.4" fill="none" stroke="${T.light}" stroke-opacity="0.65" stroke-width="0.8"/><circle r="77.2" fill="none" stroke="${T.main}" stroke-opacity="0.9" stroke-width="0.9"/><circle r="78.5" fill="none" stroke="${T.smoke}" stroke-opacity="0.55" stroke-width="0.5"/>`;
  // mây như ý quanh mép trong (mỗi 15°), đáy mây áp vành, đỉnh mây hướng vào ảnh
  let clouds = '';
  for (let a = 0; a < 360; a += 15) { const [x, y] = polar(67.4, a); clouds += cloud(P, x, y, a + 180, 0.95); }
  // thân rồng: gradient hướng tâm (trong tối → ngoài sáng) + vệt sáng sống lưng + vảy
  let scl = '';
  for (let a = A0 + 6; a < A1 - 8; a += 20) {
    const w = prof(tOf(a));
    const [x, y] = polar(RB + (Math.round((a - A0) / 20) % 2 ? 1 : -1) * w * 0.2, a);
    scl += `<use href="#${P}s" transform="translate(${x} ${y}) rotate(${n(a + 90)}) scale(${n(0.6 + w * 0.2)})"/>`;
  }
  // vây lưng = mây nhỏ nối đuôi nhau dọc sống lưng, to ở cổ nhỏ dần về đuôi
  let fins = '';
  for (let a = A0 + 8; a < A1 - 20; a += 26) {
    const t = tOf(a);
    const [x, y] = polar(RB + prof(t) * 0.55, a);
    fins += cloud(P, x, y, a, 0.5 + 0.55 * (1 - t));
  }
  const body = `<path d="${kit.taperPath(ctrl, 0, 0, 8, prof)}" fill="url(#${P}r)" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/>`
    + `<path d="${kit.spine(arcCtrl(RB + 1.4, A0 + 6, A1 - 40))}" fill="none" stroke="#fff" stroke-opacity="0.75" stroke-width="0.6" stroke-linecap="round"/>${scl}`;
  // hai vuốt bám vành cạnh đầu, mũi vuốt hướng vào tâm
  const claws = [HEAD_A - 22, HEAD_A + 30].map((a) => { const [x, y] = polar(75.6, a); return kit.claw(T, P, x, y, a + 180, 0.7); }).join('');
  // đuôi hoá làn hương: 3 sợi khói cuộn ở mút đuôi (toạ độ cục bộ: +x = chiều kim đồng hồ dọc vành, −y = ra ngoài), kết mây + hạt
  const [tx, ty] = polar(RB, TAIL_A);
  const wisps = kit.whisker(T, [[0, 0], [5, 2], [11, -1], [15, -5.5]], 1.5, { r: 1.7, fill: T.accent })
    + kit.whisker(T, [[0, 0], [4, -4.5], [10, -6.4], [14, -2.6]], 1.2, { r: 1.4, fill: T.light })
    + kit.whisker(T, [[0, 0], [-2, -5.6], [1, -9.6], [6, -9.2]], 1.1, { r: 1.2, fill: T.ember });
  const tail = `<g transform="translate(${tx} ${ty}) rotate(${TAIL_A})">${wisps}${cloud(P, 8.6, -1.6, 0, 0.9)}</g>`;
  // đinh ngọc hồng + ngọc trai quanh vành ngoài (chừa chỗ đầu + đuôi)
  let studs = '';
  for (let a = 15; a < 360; a += 30) {
    if (a > 280 && a < 360) continue;
    const [x, y] = polar(79.4, a);
    studs += (a - 15) % 60 === 0 ? gem(x, y, 3.1, T.ruby, T, a) : pearl(x, y, 1.6, T);
  }
  let sparks = '';
  [[40, 80.6], [100, 80.4], [160, 80.6], [220, 80.4], [262, 80.8], [352, 80.4]].forEach(([a, r], i) => { const [x, y] = polar(r, a); sparks += i % 2 ? star4(x, y, 1.6, T.accent, 0.95) : dot(x, y, 0.9, T.smoke, 0.95); });
  // đầu Toan Nghê (bản gọn) + quầng hồng; hướng LÊN của đầu = hướng ra ngoài vành
  const [hx, hy] = polar(73.4, HEAD_A);
  const headG = `<g transform="translate(${hx} ${hy}) rotate(${HEAD_A})"><circle r="13" fill="url(#${P}o)"/><g transform="scale(0.46)">${head(T, P, h, true)}</g></g>`;
  return `${defs(T, P).replace('</defs>', `${extra}</defs>`)}<g transform="scale(${k})"><g transform="scale(-1 1)">${ring}${clouds}${fins}${body}${claws}${tail}${studs}${sparks}${headG}</g></g>`;
};

// điểm nhấn góc (28×28 nhô ra ngoài, lên-trái): làn hương cuộn + 2 đám mây như ý + hạt châu vàng + tàn sao
const accent = (T, P, h) => {
  const { star4, dot } = h;
  const smoke = kit.whisker(T, [[-2, -2], [-11, -2], [-8, -13], [-17, -14]], 2.2, { r: 2.2, fill: T.accent })
    + kit.whisker(T, [[-2, -2], [-4, -11], [-14, -9], [-14, -19]], 1.6, { r: 1.5, fill: T.light });
  return `${defs(T, P)}${smoke}${cloud(P, -6.4, -5.6, -35, 1.5)}${cloud(P, -20.6, -22.4, -50, 1.1)}${kit.orb(P, T, -3.4, -3.4, 2.6, T.ruby)}${star4(-24, -5, 2, T.accent, 0.95)}${star4(-6, -25, 1.8, T.accent, 0.95)}${dot(-25, -14, 0.9, T.smoke)}${dot(-13, -26, 0.9, T.smoke)}`;
};

// ================= Task 9-B: corner / edge / side / bottom =================
// Id gradient/mây (`<P>b/v/o/mg/mi/ct/e/h/nz/cl/mt/mu`) do defs(T,P) tạo; corner mang defs (khai trong <defs> của border), edge dùng lại cùng tiền tố, side/bottom tự mang defs.

// 1 ngón vuốt có lông nằm dọc cạnh trên (từ góc chạy theo +x): thân hồng thon, túm lông khói ở mép dưới, móng ngà quắp xuống (+y)
const finger = (T, P) => {
  const body = `<path d="M9 2.8C20 1.8 32 2.8 41.4 5.2L41.4 9.4C32 10.8 20 11.4 9 10.8Z" fill="url(#${P}b)" ${sc(T, 0.7)}/>`;
  let fur = '';
  [15, 21, 27, 33].forEach((x, i) => { fur += tuft(P, 'mu', x, 10.2, 180 + (i % 2 ? -8 : 8), 6.4, 3.6); });
  const lines = `<path d="M10 4.4C22 3.4 32 4 40 5.8" fill="none" stroke="#fff" stroke-opacity="0.8" stroke-width="0.6"/>`;
  const talon = (x, y, s) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 0C6 0.6 8 5.6 5.4 12.2C5 8.2 2.8 6 0.2 5.2Z" fill="url(#${P}h)" ${sc(T, 0.6)}/>`;
  return `${fur}${body}${lines}${talon(30, 9.4, 0.75)}${talon(38.8, 4.8, 1)}`;
};

// góc 44×44 (gốc ở đỉnh góc, trải sang +x +y): hai ngón vuốt sư tử quắp hai cạnh (ngón thứ hai lật gương qua đường chéo) + mây như ý + ngọc hồng + làn hương chiếu vào trong
const corner = (T, P, h) => {
  const { gem, star4, dot } = h;
  const arms = `<g transform="scale(0.93 1)">${finger(T, P)}</g><g transform="matrix(0 0.93 1 0 0 0)">${finger(T, P)}</g>`;
  const smoke = kit.whisker(T, [[9, 9], [16, 14], [20, 22], [27, 26]], 1.3, { r: 1.5, fill: T.accent })
    + kit.whisker(T, [[9, 9], [14, 18], [22, 18], [24, 26]], 1, { r: 1.2, fill: T.light });
  // bonusKit đã dùng id `<P>e` cho nhóm cạnh trong border → đổi tên gradient mắt (không dùng ở góc) để không trùng id
  const dfs = defs(T, P).replace(`id="${P}e"`, `id="${P}ey"`);
  return `${dfs}${arms}${smoke}<circle cx="8" cy="8" r="9" fill="url(#${P}o)"/>${cloud(P, 9.6, 4.4, -45, 1.7)}${gem(8, 8, 4.6, T.ruby, T)}${star4(31, 31, 2, T.accent, 0.9)}${dot(34, 20, 0.9, T.smoke, 0.9)}${dot(20, 34, 0.9, T.smoke, 0.9)}`;
};

// đơn vị cạnh 44 (tâm x=0, chạy dọc cạnh trên, +y = vào trong, ≤ 22px): 1 đám mây như ý treo dưới nẹp + 2 mây nhỏ + làn hương nhỏ ở mối nối bên phải
const edge = (T, P, h) => {
  const smoke = kit.whisker(T, [[22, 6], [25, 12], [20, 16], [22, 21]], 0.9, { r: 1.1, fill: T.accent });
  return `${cloud(P, 0, 10.4, 180, 2.5)}${cloud(P, -12.4, 7.4, 180, 1.2)}${cloud(P, 12.4, 7.4, 180, 1.2)}${smoke}${h.dot(0, 15.4, 1, T.accent, 0.95)}`;
};

// cạnh bên (cao 100, ±15 quanh x=0, nối khớp y=0/100): làn khói S chạy dọc + 4 mây dọc sống + 2 mây lớn ra/vào + ngọc hồng giữa
const side = (T, P, h) => {
  const { gem, star4, dot } = h;
  const strand = kit.whisker(T, [[0, 0], [9, 16], [-9, 34], [0, 50], [9, 66], [-9, 84], [0, 100]], 1.9);
  let puffs = '';
  [13, 37, 63, 87].forEach((y) => { puffs += cloud(P, 0, y, 90, 1.5); });
  const big = cloud(P, 3, 25, 90, 2.1) + cloud(P, -3, 75, -90, 2.1);
  return `${defs(T, P)}${strand}${puffs}${big}<circle cx="0" cy="50" r="9" fill="url(#${P}o)"/>${gem(0, 50, 4.2, T.ruby, T)}${star4(-10, 50, 1.8, T.accent, 0.9)}${star4(10, 50, 1.8, T.accent, 0.9)}${dot(-5, 3, 0.8, T.smoke, 0.9)}${dot(5, 97, 0.8, T.smoke, 0.9)}`;
};

// chân thẻ (gốc giữa mép dưới, cục bộ y ∈ [-4,12], nửa rộng ≤ 70, đối xứng): hai làn hương cuộn ra hai bên kết hạt + chuỗi mây + túm bờm ở đầu + ngọc hồng chính giữa
const bottom = (T, P, h) => {
  const { gem, star4, dot } = h;
  const half = () => kit.whisker(T, [[8, 5.6], [22, 10.6], [34, -1.4], [48, 4.8]], 2, null)
    + kit.whisker(T, [[48, 4.8], [56, 8.4], [62, 4], [66, 7]], 1.4, { r: 1.7, fill: T.accent })
    + cloud(P, 24, 6, 0, 1.5) + cloud(P, 41, 4.4, 0, 1.2)
    + tuft(P, 'mu', 58, 6, 90, 9, 4) + star4(52, -2, 1.7, T.accent, 0.95) + dot(30, -1.4, 0.9, T.smoke, 0.95);
  const mid = `<circle cx="0" cy="3" r="13" fill="url(#${P}o)"/>${cloud(P, 0, 7.4, 0, 3.4)}${gem(0, 2, 4.8, T.ruby, T)}${star4(-9, 1, 1.6, T.accent, 0.9)}${star4(9, 1, 1.6, T.accent, 0.9)}`;
  return `${defs(T, P)}${half()}<g transform="scale(-1 1)">${half()}</g>${mid}`;
};

// ================= Task 9-C: crest =================
// Đỉnh thẻ (x −80..80, chân y=36, thân nhô lên y<0, quầng KHÔNG vượt y=36): lư hương vàng làm bệ, Toan Nghê ngồi trên lư — thân + 2 vuốt trước bám miệng lư,
// đầu to (dùng lại `head`, scale 1.15), quạt 4 làn hương mỗi bên cuộn lên/ra kết mây + hạt, đuôi cuộn bên phải, hạt châu trước lư.
const crest = (T, P, h) => {
  const { gem, star4, dot } = h;
  const gold = `<linearGradient id="${P}cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE9A8"/><stop offset="0.45" stop-color="#E0A82E"/><stop offset="1" stop-color="#6E4210"/></linearGradient>`;
  const aura = `<circle cx="0" cy="-4" r="40" fill="url(#${P}o)"/>`;
  // quạt làn hương (nửa phải, nửa trái lật gương)
  const smokeHalf = () => kit.whisker(T, [[14, 20], [34, 12], [42, -6], [60, -12]], 2.2, { r: 2, fill: T.accent })
    + kit.whisker(T, [[12, 22], [32, 24], [54, 14], [70, 18]], 1.8, { r: 1.8, fill: T.light })
    + kit.whisker(T, [[10, 14], [20, -6], [38, -26], [56, -28]], 2, { r: 1.8, fill: T.accent })
    + kit.whisker(T, [[8, 8], [10, -14], [24, -34], [38, -40]], 1.8, { r: 1.6, fill: T.light })
    + cloud(P, 60, -9, -20, 2) + cloud(P, 72, 21, 10, 1.7) + cloud(P, 55, -26, -30, 1.8) + cloud(P, 40, -37, -20, 1.5)
    + star4(66, -24, 2, T.accent, 0.95) + dot(48, 4, 1, T.smoke, 0.95);
  const smoke = `${smokeHalf()}<g transform="scale(-1 1)">${smokeHalf()}</g>`;
  // đuôi cuộn bên phải sau lư
  const tailC = [[24, 16], [40, 20], [44, 4], [34, 0]];
  const tail = `<path d="${kit.taperPath(tailC, 9, 2, 10)}" fill="url(#${P}b)" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/>${tuft(P, 'mu', 33, 0.4, -100, 9, 4.2)}`;
  // thân ngồi
  const bodyShape = 'M-23 2C-31 12 -30 26 -17 30L17 30C30 26 31 12 23 2C14 -4 -14 -4 -23 2Z';
  let sc2 = '';
  for (let r = 0; r < 4; r += 1) for (let c = -3; c <= 3; c += 1) { const x = c * 6.4 + (r % 2 ? 3.2 : 0); const y = 6 + r * 5.6; if (Math.abs(x) < 25 - r * 1.5) sc2 += `<use href="#${P}s" transform="translate(${n(x)} ${n(y)}) scale(1.6)"/>`; }
  const body = `<path id="${P}s" d="M-1.5 0.7Q0 -1.5 1.5 0.7" fill="none" stroke="${T.dark}" stroke-opacity="0.6" stroke-width="0.5" stroke-linecap="round" style="display:none"/>`.replace(' style="display:none"', '');
  const bodyG = `<defs>${body}</defs><path d="${bodyShape}" fill="url(#${P}b)" stroke="${T.dark}" stroke-width="0.9" stroke-linejoin="round"/>${sc2}<path d="M-16 6C-8 3 8 3 16 6" fill="none" stroke="#fff" stroke-opacity="0.7" stroke-width="0.7" stroke-linecap="round"/>`;
  // lư hương vàng: thân bát + miệng + 2 quai + hoa văn mây + chân
  const censer = `<path d="M-30 26C-30 33 -18 36 0 36C18 36 30 33 30 26Z" fill="url(#${P}cg)" stroke="${T.dark}" stroke-width="0.9" stroke-linejoin="round"/>`
    + `<path d="M-36 22.6C-36 24.8 -22 26.6 0 26.6C22 26.6 36 24.8 36 22.6C36 20.6 22 19.4 0 19.4C-22 19.4 -36 20.6 -36 22.6Z" fill="url(#${P}cg)" stroke="${T.dark}" stroke-width="0.9"/>`
    + `<path d="M-30 22.8C-20 24.4 20 24.4 30 22.8" fill="none" stroke="#fff" stroke-opacity="0.8" stroke-width="0.7" stroke-linecap="round"/>`
    + `<path d="M-37 21C-44 20 -45 28 -38 30M37 21C44 20 45 28 38 30" fill="none" stroke="${T.dark}" stroke-width="3.2" stroke-linecap="round"/><path d="M-37 21C-44 20 -45 28 -38 30M37 21C44 20 45 28 38 30" fill="none" stroke="${T.accent}" stroke-width="1.8" stroke-linecap="round"/>`
    + cloud(P, -18, 31, 0, 1.2).replace('url(#', 'url(#') + cloud(P, 18, 31, 0, 1.2) + cloud(P, 0, 33, 0, 1.4);
  // 2 vuốt trước bám miệng lư
  const limbs = kit.limb(T, P, [-12, 12], [-15, 21], 5, 9) + kit.limb(T, P, [12, 12], [15, 21], -5, 9);
  const headG = `<g transform="translate(0 -9) scale(1.15)">${head(T, P, h)}</g>`;
  const pearl = kit.orb(P, T, 0, 26, 3.6, T.light);
  return `${defs(T, P).replace('</defs>', `${gold}</defs>`)}${aura}${smoke}${tail}${bodyG}${limbs}${censer}${headG}${pearl}${gem(0, 30, 2.4, T.ruby, T)}${star4(-44, 14, 1.8, T.accent, 0.95)}`;
};

module.exports = {
  avatarFrame, accent, emblem, emblemGhost, head, defs, arcCtrl, cloud, tuft, corner, edge, side, bottom, crest,
};
