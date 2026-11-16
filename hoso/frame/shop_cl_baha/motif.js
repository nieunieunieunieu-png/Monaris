// ===== hoso/frame/shop_cl_baha/motif.js — Bá Hạ Huyền Quy: đầu rồng thân quy, mai khắc bát quái, vác bia đá, sóng nước =====
// Task 5-A: avatar + accent + emblem/emblemGhost (đầu rồng độc lập, tâm (0,0), bán kính ≈ 20, hướng LÊN = hướng mọc sừng).
// Task 5-B + 5-C (đã làm): corner / edge / side / bottom / crest.
// Hình học (giữ hợp đồng): avatar mọi nét r ≤ 84, điểm nhấn lấn vào trong r ≥ 64; accent trong ô 28×28 nhô ra ngoài (lên-trái).
const kit = require('../../dragonKit');

const n = kit.n;
const sc = (T, w = 0.6) => `stroke="${T.dark}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

// gradient/hình mẫu dùng chung (id theo tiền tố P của phần gọi): b/v/o của dragonKit + e (mắt) + m (khoang miệng) + h (sừng) + t (mai/đá) + w (nước)
// + hình mẫu `<P>wv` (ngọn sóng cuộn, cao 7) và `<P>hx` (mai lục giác, bán kính 1, đỉnh nhọn hướng LÊN)
const defs = (T, P) => kit.dragonDefs(T, P).replace('</defs>', ''
  + `<radialGradient id="${P}e" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#F6FFE6"/><stop offset="0.42" stop-color="${T.jade}"/><stop offset="1" stop-color="${T.shell}"/></radialGradient>`
  + `<linearGradient id="${P}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.void}"/><stop offset="1" stop-color="${T.mouth}"/></linearGradient>`
  + `<linearGradient id="${P}h" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${T.dark}"/><stop offset="0.5" stop-color="#7FA58A"/><stop offset="1" stop-color="#E6DDB2"/></linearGradient>`
  + `<linearGradient id="${P}t" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.45" stop-color="${T.stone}"/><stop offset="1" stop-color="${T.shell}"/></linearGradient>`
  + `<linearGradient id="${P}w" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${T.shell}"/><stop offset="0.5" stop-color="${T.main}"/><stop offset="1" stop-color="${T.water}"/></linearGradient>`
  + `<g id="${P}wv"><path d="M-4 0C-4 -3.5 -1.8 -6.2 1.6 -6.8C4.4 -7.2 6 -5.4 5.6 -3.4C5.2 -4.6 3.8 -5 2.8 -4.4C1.4 -3.6 1.6 -1.6 4 0Z" fill="url(#${P}w)" stroke="${T.dark}" stroke-width="0.45" stroke-linejoin="round"/><path d="M-2.6 -1.4C-2.2 -3.6 -0.8 -5 1.2 -5.6" fill="none" stroke="#fff" stroke-opacity="0.8" stroke-width="0.45" stroke-linecap="round"/></g>`
  + `<g id="${P}hx"><path d="M0 -1L0.87 -0.5L0.87 0.5L0 1L-0.87 0.5L-0.87 -0.5Z" fill="url(#${P}t)" stroke="${T.dark}" stroke-width="0.16" stroke-linejoin="round"/><path d="M0 -0.55L0.48 -0.28L0.48 0.28L0 0.55L-0.48 0.28L-0.48 -0.28Z" fill="none" stroke="${T.light}" stroke-opacity="0.65" stroke-width="0.07"/></g>`
  + '</defs>');

// ngọn sóng: gốc (x,y), hướng a (độ, 0 = lên), cao ≈ 7·s; flip = -1 để lật gương
const wave = (P, x, y, a, s, flip = 1) => `<use href="#${P}wv" transform="translate(${n(x)} ${n(y)}) rotate(${n(a)}) scale(${n(s * flip)} ${n(s)})"/>`;
// mai lục giác: tâm (x,y), xoay a, bán kính r
const hex = (P, x, y, a, r) => `<use href="#${P}hx" transform="translate(${n(x)} ${n(y)}) rotate(${n(a)}) scale(${n(r)})"/>`;

// ---- đầu rồng thân quy: sọ rộng bè, đỉnh phẳng, mày thấp điềm tĩnh, sừng ngắn bẹt, mõm bè có răng cùn, râu tua ngắn, bờm sóng nước,
// ---- vòng mai lục giác sau cằm + 3 mai đội đầu + ấn bát quái giữa trán; y: mai đầu -17 … cổ mai +24 ----
const SKULL = 'M0 -12.4C4 -12.8 9 -12 13 -9.4L17.4 -4.6C19 -1.6 19 2 17.6 5.2L15.4 9.6C14.2 12.4 13.6 15.6 12 18.2C10 20.6 6 21.6 0 21.6C-6 21.6 -10 20.6 -12 18.2C-13.6 15.6 -14.2 12.4 -15.4 9.6L-17.6 5.2C-19 2 -19 -1.6 -17.4 -4.6L-13 -9.4C-9 -12 -4 -12.8 0 -12.4Z';
const HORN_R = 'M8 -10.8C11 -17 17 -22 26 -23C24.4 -19.6 22.6 -17 20 -14.8C17.6 -12.6 14 -10.6 11 -8.6Z';

// nửa PHẢI (x ≥ 0) của phần phụ — không có nét viền chạm trục x=0 để ghép gương không lộ đường nối
const headHalf = (T, P, h, lite) => {
  const { polar } = h;
  const o = sc(T, 0.6);
  // bờm sóng nước toả sau đầu (lite: chỉ 2 ngọn)
  let mane = '';
  const manes = lite ? [[84, 0.8], [116, 0.7]] : [[56, 0.85], [84, 1.0], [112, 0.95], [138, 0.8]];
  manes.forEach(([a, s]) => { const [x, y] = polar(19, a); mane += wave(P, x, y, a, s); });
  const horn = `<path d="${HORN_R}" fill="url(#${P}h)" ${o}/>`
    + `<path d="M12.4 -11.4L14.6 -14.2M15.6 -13.2L17.4 -16M18.6 -15.4L20 -18" stroke="${T.dark}" stroke-opacity="0.55" stroke-width="0.5" fill="none" stroke-linecap="round"/>`
    + `<path d="M10.6 -12C13.6 -16.6 18.6 -20 24 -21.4" stroke="#fff" stroke-opacity="0.75" stroke-width="0.6" fill="none" stroke-linecap="round"/>`;
  // mai đội đầu (nửa phải) + vòng mai sau cằm
  const shellTop = hex(P, 5.8, -14.2, 14, 2.6) + hex(P, 10.6, -12.4, 28, 2);
  const collar = lite ? '' : hex(P, 9.6, 21, 0, 3.8) + hex(P, 16.6, 17, -18, 3.2);
  // râu tua ngắn từ khoé miệng, kết ngọc vàng (lite: bỏ)
  const whisk = lite ? '' : kit.whisker(T, [[14, 9], [22, 9.6], [27, 14], [26, 22]], 1.2, { r: 1.6, fill: T.accent })
    + kit.whisker(T, [[12.4, 13], [18, 14.4], [21, 19], [19.6, 25]], 0.9, { r: 1.2, fill: T.ruby });
  // sau khi vẽ sọ: lớp trên mặt (cắt theo sọ)
  const face = `<path d="M0 3C3.4 2.6 7 4 8.8 7L10 13L0 13.2Z" fill="${T.light}" fill-opacity="0.22"/>`
    + `<path d="M2.6 7.6C3.8 6.4 6.2 6.6 6.8 8.2C5.8 9.4 3.6 9.4 2.6 7.6Z" fill="${T.void}" fill-opacity="0.9"/>`
    + `<path d="M2.4 -9.2C6.4 -9.8 11 -8.6 14 -6M3 -6.6C6 -7 9 -6.4 11 -5" stroke="${T.dark}" stroke-opacity="0.5" stroke-width="0.55" fill="none" stroke-linecap="round"/>`
    + `<path d="M1 -10.8C6 -11.2 12 -9.6 15.4 -7" stroke="${T.light}" stroke-opacity="0.9" stroke-width="0.75" fill="none" stroke-linecap="round"/>`
    + `<path d="M15 -1.4C16.6 -3 18.4 -3 19.2 -1.6M13.6 2.6C15.2 1.2 17 1.4 17.8 2.8M16 6.2C17.4 5 19 5.4 19.6 6.8" stroke="${T.dark}" stroke-opacity="0.5" stroke-width="0.5" fill="none" stroke-linecap="round"/>`
    + `<circle cx="14" cy="8.6" r="0.55" fill="${T.accent}" fill-opacity="0.85"/><circle cx="17.2" cy="4.4" r="0.5" fill="${T.accent}" fill-opacity="0.8"/><circle cx="12.4" cy="-6.4" r="0.45" fill="${T.accent}" fill-opacity="0.8"/>`;
  const brow = `<path d="M2.8 -3.8C7 -8 13 -8.6 18.4 -5.6L17.4 -3C13 -5.8 8 -5.2 4 -1.8Z" fill="${T.dark}" stroke="${T.dark}" stroke-width="0.4" stroke-linejoin="round"/><path d="M4 -4.6C8 -7.4 13 -7.4 17 -5.2" stroke="${T.light}" stroke-opacity="0.7" stroke-width="0.5" fill="none"/>`;
  // mắt lục điềm tĩnh, xếch: mí trên nặng, đồng tử dọc, chấm sáng
  const eye = `<circle cx="10.2" cy="-1.2" r="4.8" fill="url(#${P}o)"/>`
    + `<path d="M4.6 0.4C7 -3.2 12.8 -4.2 16.4 -2.2C13.6 1 8 1.8 4.6 0.4Z" fill="url(#${P}e)" stroke="${T.dark}" stroke-width="0.55" stroke-linejoin="round"/>`
    + `<ellipse cx="10.6" cy="-1.2" rx="0.7" ry="1.6" transform="rotate(-18 10.6 -1.2)" fill="#06201C"/><circle cx="9" cy="-2.2" r="0.65" fill="#fff"/>`
    + `<path d="M4.2 0C7 -3.8 13.8 -4.6 17 -2.4" fill="none" stroke="${T.dark}" stroke-width="1" stroke-linecap="round"/>`;
  const teeth = `<path d="M3.6 14.2L4.4 18L6.8 14.6Z" fill="#FFFBEA" stroke="${T.dark}" stroke-width="0.35" stroke-linejoin="round"/><path d="M8 13.6L9.4 17L10.8 13.2Z" fill="#FFFBEA" stroke="${T.dark}" stroke-width="0.35" stroke-linejoin="round"/>`;
  return { back: `${mane}${whisk}${shellTop}${collar}${horn}`, front: `${face}${brow}${eye}${teeth}` };
};

// ấn bát quái giữa trán: bát giác + 3 vạch (☰ ở trên, ☷ vạch đứt ở dưới)
const bagua = (T) => `<path d="M-1.9 -4.6L1.9 -4.6L4.4 -2.1L4.4 1.5L1.9 4L-1.9 4L-4.4 1.5L-4.4 -2.1Z" transform="translate(0 -4.4)" fill="${T.void}" stroke="${T.accent}" stroke-width="0.6" stroke-linejoin="round"/>`
  + `<path d="M-2.4 -7.2H2.4M-2.4 -4.4H-0.5M0.5 -4.4H2.4M-2.4 -1.6H2.4" stroke="${T.accent}" stroke-width="0.7" stroke-linecap="round"/>`;

const head = (T, P, h, lite = false) => {
  const { back, front } = headHalf(T, P, h, lite);
  const o = sc(T, 0.6);
  const hexTop = hex(P, 0, -16, 0, 3);
  const hexChin = lite ? '' : hex(P, 0, 24.2, 0, 3.8);
  const skull = `<path d="${SKULL}" fill="url(#${P}b)" ${o}/>`;
  // khoang miệng rộng (mõm bè) → hàm dưới
  const mouth = `<path d="M-11.6 13C-7.6 14.6 -3.4 15 0 15C3.4 15 7.6 14.6 11.6 13C10.2 17.2 5.4 19.2 0 19.2C-5.4 19.2 -10.2 17.2 -11.6 13Z" fill="url(#${P}m)"/>`
    + `<path d="M-12.4 14C-9.4 18.8 -4.8 21.2 0 21.4C4.8 21.2 9.4 18.8 12.4 14C9.4 17.4 4.8 19.2 0 19.2C-4.8 19.2 -9.4 17.4 -12.4 14Z" fill="url(#${P}b)"/>`
    + `<path d="M-11.6 13C-7.6 14.6 -3.4 15 0 15C3.4 15 7.6 14.6 11.6 13" stroke="${T.dark}" stroke-width="0.8" fill="none" stroke-linecap="round"/>`;
  return `<defs><clipPath id="${P}c"><path d="${SKULL}"/></clipPath><g id="${P}hb">${back}</g><g id="${P}hf"><g clip-path="url(#${P}c)">${front}</g></g></defs>`
    + `<use href="#${P}hb"/><use href="#${P}hb" transform="scale(-1 1)"/>${hexTop}${hexChin}${skull}${mouth}<use href="#${P}hf"/><use href="#${P}hf" transform="scale(-1 1)"/>${bagua(T)}`;
};

// emblem: đầu rồng độc lập, tâm (0,0), bán kính ≈ 20 — dùng cho avatar + Cửu Long Chí Tôn
const emblem = (T, P, h) => defs(T, P) + head(T, P, h);
// emblemGhost: cùng hình dạng, bóng mờ nét đứt (rồng chưa sở hữu) + chấm ngọc mờ
const emblemGhost = (T, P, h) => {
  const hornL = 'M-8 -10.8C-11 -17 -17 -22 -26 -23C-24.4 -19.6 -22.6 -17 -20 -14.8C-17.6 -12.6 -14 -10.6 -11 -8.6Z';
  const crown = 'M0 -18.6L2.9 -16.9L2.9 -13.5L0 -11.8L-2.9 -13.5L-2.9 -16.9Z';
  return kit.ghost(`${SKULL}${HORN_R}${hornL}${crown}`, 0.3) + kit.ghostDot(0, -4.4, T.accent);
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

const HEAD_A = 45; // đầu nhô ở góc trên-phải, mặt hướng ra (rùa-rồng ngẩng nhìn xa)
const TAIL_A = 18; // đuôi ngắn kết sóng nước, sát đầu
const STELE_A = 225; // bia đá vác ở góc dưới-trái

// KHUNG AVATAR (tự dựng, không qua bonusKit.build để vành là ngọc lục bảo tối — rùa-rồng mới nổi). Vẽ cho R=70 rồi scale(R/70).
// Mọi nét r ∈ [64, 84]. Mai/sóng là <use> của 1 hình mẫu để gọn dung lượng.
const avatarFrame = (T, R = 70, h) => {
  const { polar, dot, star4, gem, pearl } = h;
  const P = 'shop_cl_baha-avatar-';
  const k = Number((R / 70).toFixed(4));
  const RB = 73.6; // bán kính đường tâm thân
  const A0 = HEAD_A + 6;
  const A1 = TAIL_A + 360;
  const prof = (t) => 3 + 8.6 * Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, t))), 0.55);
  const tOf = (a) => (a - A0) / (A1 - A0);
  const ctrl = arcCtrl(RB, A0, A1);
  const extra = `<radialGradient id="${P}r" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="82"><stop offset="0.82" stop-color="${T.shell}"/><stop offset="0.89" stop-color="${T.main}"/><stop offset="0.95" stop-color="${T.jade}"/><stop offset="0.98" stop-color="${T.light}"/></radialGradient>`
    + `<radialGradient id="${P}q" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="80"><stop offset="0.86" stop-color="#0E3A35"/><stop offset="0.92" stop-color="${T.void}"/><stop offset="0.97" stop-color="#0E3A35"/></radialGradient>`
    + `<path id="${P}s" d="M-1.5 0.7Q0 -1.5 1.5 0.7" fill="none" stroke="${T.dark}" stroke-opacity="0.8" stroke-width="0.6" stroke-linecap="round"/>`;
  // vành ngọc lục bảo tối + 2 viền sáng (vàng cổ trong, ngọc ngoài)
  const ring = `<path fill-rule="evenodd" fill="url(#${P}q)" d="M-77.6 0A77.6 77.6 0 1 0 77.6 0A77.6 77.6 0 1 0 -77.6 0ZM-70 0A70 70 0 1 0 70 0A70 70 0 1 0 -70 0Z"/>`
    + `<circle r="70.4" fill="none" stroke="${T.accent}" stroke-opacity="0.65" stroke-width="0.8"/><circle r="77.2" fill="none" stroke="${T.main}" stroke-opacity="0.9" stroke-width="0.9"/><circle r="78.5" fill="none" stroke="${T.light}" stroke-opacity="0.5" stroke-width="0.5"/>`;
  // sóng nước cuộn quanh mép trong (mỗi 15°, chừa chỗ đầu)
  let waves = '';
  for (let a = 0; a < 360; a += 15) {
    if (Math.abs(a - HEAD_A) < 16) continue;
    const [x, y] = polar(67.4, a);
    waves += wave(P, x, y, a + 180, 0.68, a % 30 ? -1 : 1);
  }
  // thân rùa-rồng: gradient hướng tâm + vệt sáng sống lưng
  const body = `<path d="${kit.taperPath(ctrl, 0, 0, 8, prof)}" fill="url(#${P}r)" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/>`
    + `<path d="${kit.spine(arcCtrl(RB + 2, A0 + 8, A1 - 30))}" fill="none" stroke="${T.light}" stroke-opacity="0.65" stroke-width="0.6" stroke-linecap="round"/>`;
  // mai lục giác dọc thân (to ở giữa, nhỏ dần về cổ/đuôi) + vảy cổ
  let shell = '';
  let scl = '';
  for (let a = A0 + 4; a < A1 - 6; a += 8.4) {
    const t = tOf(a);
    const w = prof(t) / 2;
    if (t > 0.1 && t < 0.93) shell += hex(P, ...polar(RB, a), a, w * 0.9);
    else scl += `<use href="#${P}s" transform="translate(${polar(RB, a).join(' ')}) rotate(${n(a + 90)}) scale(${n(0.6 + w * 0.2)})"/>`;
  }
  // bia đá vác trên lưng (góc dưới-trái): bia vòm, 3 vạch vàng + ấn bát quái, đế là 2 mai
  const [sx, sy] = polar(RB, STELE_A);
  const stele = `<g transform="translate(${sx} ${sy}) rotate(${STELE_A})">`
    + `<path d="M-4.6 7.4L-4.6 -3.4Q-4.6 -8 0 -8Q4.6 -8 4.6 -3.4L4.6 7.4Z" fill="url(#${P}t)" stroke="${T.dark}" stroke-width="0.7" stroke-linejoin="round"/>`
    + `<path d="M-3.4 6.4L-3.4 -3.2Q-3.4 -6.8 0 -6.8" fill="none" stroke="#fff" stroke-opacity="0.65" stroke-width="0.5" stroke-linecap="round"/>`
    + `<circle cx="0" cy="-3.6" r="1.7" fill="${T.void}" stroke="${T.accent}" stroke-width="0.5"/><path d="M-1 -3.6H1" stroke="${T.accent}" stroke-width="0.5"/>`
    + `<path d="M-2.6 0.4H2.6M-2.6 2.6H2.6M-2.6 4.8H0.4" stroke="${T.accent}" stroke-width="0.6" stroke-linecap="round"/>`
    + `</g>`;
  // hai vuốt bám vành cạnh đầu, mũi vuốt hướng vào tâm
  const claws = [HEAD_A - 18, HEAD_A + 34].map((a) => { const [x, y] = polar(75.8, a); return kit.claw(T, P, x, y, a + 180, 0.7); }).join('');
  // đuôi ngắn hoá sóng nước cuộn: 3 ngọn sóng + hạt vàng
  const [tx, ty] = polar(RB, TAIL_A);
  const tail = wave(P, tx, ty, TAIL_A + 70, 1.05) + wave(P, ...polar(RB + 1, TAIL_A + 9), TAIL_A + 96, 0.8, -1) + wave(P, ...polar(RB - 3, TAIL_A + 17), TAIL_A + 110, 0.6) + dot(...polar(RB + 4, TAIL_A + 24), 1.1, T.accent);
  // đinh ngọc + ngọc trai quanh vành ngoài (chừa chỗ đầu)
  let studs = '';
  for (let a = 15; a < 360; a += 30) {
    if (Math.abs(a - HEAD_A) < 28) continue;
    const [x, y] = polar(79.4, a);
    studs += (a - 15) % 60 === 0 ? gem(x, y, 3.1, T.ruby, T, a) : pearl(x, y, 1.6, T);
  }
  let drops = '';
  [[44, 81.2], [100, 81], [160, 80.6], [196, 81.2], [262, 80.8], [330, 81]].forEach(([a, r], i) => { const [x, y] = polar(r, a); drops += i % 2 ? star4(x, y, 1.6, T.water, 0.95) : dot(x, y, 0.9, T.water, 0.95); });
  // đầu Bá Hạ (bản gọn) + quầng ngọc; hướng LÊN của đầu = hướng ra ngoài vành
  const [hx, hy] = polar(73.4, HEAD_A);
  const headG = `<g transform="translate(${hx} ${hy}) rotate(${HEAD_A})"><circle r="12.5" fill="url(#${P}o)"/><g transform="scale(0.45)">${head(T, P, h, true)}</g></g>`;
  return `${defs(T, P).replace('</defs>', `${extra}</defs>`)}<g transform="scale(${k})">${ring}${waves}${body}${scl}${shell}${stele}${claws}${tail}${studs}${drops}${headG}</g>`;
};

// điểm nhấn góc (28×28 nhô ra ngoài, lên-trái): bia đá vòm đứng trên mai rùa + 2 ngọn sóng + ngọc vàng
const accent = (T, P, h) => {
  const { gem, star4, dot } = h;
  const shellD = 'M-25 0C-24 -9 -4 -9 -2 0Z';
  const mound = `<path d="${shellD}" fill="url(#${P}w)" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/>`
    + `<path d="M-19 -1.8L-17 -5.4L-13 -5.4L-11 -1.8M-12 -1.8L-10 -5.6L-6 -5.4L-4.6 -1.8" fill="none" stroke="${T.light}" stroke-opacity="0.7" stroke-width="0.6" stroke-linejoin="round"/>`;
  const stele = `<g transform="rotate(-8 -13 -10)">`
    + `<path d="M-18 -5L-18 -17Q-18 -23 -13 -23Q-8 -23 -8 -17L-8 -5Z" fill="url(#${P}t)" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/>`
    + `<path d="M-16.6 -6.4L-16.6 -17Q-16.6 -21.4 -13 -21.6" fill="none" stroke="#fff" stroke-opacity="0.65" stroke-width="0.6" stroke-linecap="round"/>`
    + `<circle cx="-13" cy="-17.2" r="2.4" fill="${T.void}" stroke="${T.accent}" stroke-width="0.6"/><path d="M-14.4 -17.2H-11.6M-14 -18.2H-12M-14 -16.2H-12" stroke="${T.accent}" stroke-width="0.45" stroke-linecap="round"/>`
    + `<path d="M-16 -12.4H-10M-16 -10.2H-10M-16 -8H-12.4" stroke="${T.accent}" stroke-width="0.7" stroke-linecap="round"/></g>`;
  const waves = wave(P, -3, -3, 24, 1.25) + wave(P, -22, -2, -30, 1, -1);
  return `${defs(T, P)}${mound}${stele}${waves}${gem(-4, -9, 3.2, T.ruby, T)}${star4(-24, -22, 2.2, T.water, 0.95)}${star4(-4, -24, 1.8, T.accent, 0.95)}${dot(-26, -12, 1, T.water)}`;
};

// ================= Task 5-B: corner / edge / side / bottom =================
// Id gradient/hình mẫu (`<P>b/v/o/e/m/h/t/w/wv/hx`) do defs(T,P) tạo; corner mang defs (khai trong <defs> của border), edge/side/bottom dùng lại cùng tiền tố hoặc tự mang defs.

// 1 chi trước (mái chèo rùa) nằm dọc cạnh trên (từ góc chạy theo +x): thân thon lát mai nhỏ + 3 móng cùn quắp ở đầu mút
const flipper = (T, P) => {
  const body = `<path d="M9 2.6C20 1.6 31 2.6 39.6 5L39.6 9.8C31 11.2 20 11.6 9 11Z" fill="url(#${P}b)" ${sc(T, 0.7)}/>`;
  const plates = hex(P, 16, 6.9, 0, 3.4) + hex(P, 23.4, 6.9, 0, 3.1) + hex(P, 30.4, 7, 0, 2.7);
  const shine = `<path d="M10 4C21 3 31 3.6 38.6 5.6" fill="none" stroke="${T.light}" stroke-opacity="0.8" stroke-width="0.6"/>`;
  return `${body}${plates}${shine}${kit.claw(T, P, 40.2, 7.4, 90, 0.9)}`;
};

// góc 44×44 (gốc ở đỉnh góc, trải sang +x +y): hai chi quắp hai cạnh (chi thứ hai lật gương qua đường chéo) + cụm mai lục giác ôm ngọc vàng + sóng cuộn vào trong
const corner = (T, P, h) => {
  const { gem, star4, dot } = h;
  const arms = `<g transform="scale(0.93 1)">${flipper(T, P)}</g><g transform="matrix(0 0.93 1 0 0 0)">${flipper(T, P)}</g>`;
  const cluster = hex(P, 8, 8, 0, 9) + hex(P, 19.4, 14.6, 0, 4.6) + hex(P, 14.6, 20, 0, 4.2);
  // bonusKit đã dùng id `<P>e` cho nhóm cạnh trong border → đổi tên gradient mắt (không dùng ở góc) để không trùng id
  const dfs = defs(T, P).replace(`id="${P}e"`, `id="${P}ey"`);
  return `${dfs}${arms}<circle cx="8" cy="8" r="10" fill="url(#${P}o)"/>${cluster}${wave(P, 25, 26, 135, 1.1)}${wave(P, 17, 31, 160, 0.8, -1)}${gem(8, 8, 4.4, T.ruby, T)}${star4(33, 33, 2, T.water, 0.9)}${dot(30, 20, 0.9, T.accent, 0.9)}${dot(20, 30, 0.9, T.accent, 0.9)}`;
};

// đơn vị cạnh 44 (tâm x=0, chạy dọc cạnh trên, +y = vào trong, ≤ 22px): 1 mai lục giác treo (đỉnh hướng xuống) ôm hạt vàng + ngọn sóng nhỏ ở mối nối bên phải
const edge = (T, P, h) => `${hex(P, 0, 11.2, 180, 9.4)}${h.dot(0, 11.2, 1.5, T.accent, 0.95)}<circle cx="0" cy="11.2" r="3.2" fill="none" stroke="${T.accent}" stroke-opacity="0.7" stroke-width="0.5"/>${wave(P, 22, 8, 0, 0.9)}`;

// cạnh bên (cao 100, ±15 quanh x=0, nối khớp y=0/100): 3 mai lục giác dọc xương sống (giữa ôm ngọc) + 2 ngọn sóng (ra ngoài / vào trong)
const side = (T, P, h) => {
  const { gem, star4, dot } = h;
  const plates = hex(P, 0, 15, 0, 10.5) + hex(P, 0, 50, 0, 11.5) + hex(P, 0, 85, 0, 10.5);
  const waves = wave(P, 0, 32, -90, 1.2) + wave(P, 0, 68, 90, 1.2, -1);
  return `${defs(T, P)}${waves}${plates}<circle cx="0" cy="50" r="9" fill="url(#${P}o)"/>${gem(0, 50, 4.4, T.ruby, T)}${star4(-10, 32, 1.6, T.water, 0.9)}${star4(10, 68, 1.6, T.water, 0.9)}${dot(-4, 3, 0.8, T.accent, 0.9)}${dot(4, 97, 0.8, T.accent, 0.9)}`;
};

// chân thẻ (gốc giữa mép dưới, cục bộ y ∈ [-4,12], nửa rộng ≤ 70, đối xứng): dải nước uốn hai bên cuộn sóng + mai nhỏ + đuôi rùa nhọn ở mút, mai ôm ngọc vàng chính giữa
const bottom = (T, P, h) => {
  const { gem, star4, dot } = h;
  const half = () => {
    const base = 'M9 6.4C22 8.4 34 4.6 46 7.2C54 8.8 60 6.6 66 2.6';
    return `<path d="${base}" fill="none" stroke="${T.dark}" stroke-width="5.2" stroke-linecap="round" opacity="0.75"/><path d="${base}" fill="none" stroke="${T.main}" stroke-width="3.6" stroke-linecap="round"/><path d="${base}" fill="none" stroke="${T.light}" stroke-opacity="0.75" stroke-width="0.7" stroke-linecap="round" transform="translate(0 -1)"/>`
      + `${wave(P, 22, 5, 0, 0.95)}${wave(P, 38, 5.6, 0, 0.82)}${wave(P, 53, 6.6, 0, 0.7)}${hex(P, 14, 8.6, 0, 3)}${hex(P, 30, 7.4, 0, 2.6)}`
      + `<path d="M64 4.2C67 3 69 3.6 70 5.4C67.6 5 66 5.6 64.6 7Z" fill="url(#${P}b)" stroke="${T.dark}" stroke-width="0.5" stroke-linejoin="round"/>${star4(45, -1.6, 1.4, T.water, 0.95)}${dot(60, 10, 0.8, T.accent, 0.9)}`;
  };
  const centre = `<circle cx="0" cy="4" r="9" fill="url(#${P}o)"/>${hex(P, 0, 4.4, 0, 7.6)}${gem(0, 4.6, 3.4, T.ruby, T)}`;
  return `${defs(T, P)}${half()}<g transform="scale(-1 1)">${half()}</g>${centre}`;
};

// ================= Task 5-C: crest =================
// Đỉnh thẻ (x −80..80, chân y=36): Bá Hạ vác bia — mai rùa lát lục giác làm bệ, bia đá vòm khắc bát quái dựng sau đầu, đầu lớn ngẩng nhìn thẳng, hai chi bám mép mai, sóng nước cuộn hai bên.
const crest = (T, P, h) => {
  const { gem, star4, dot } = h;
  const sym = (f) => `${f}<g transform="scale(-1 1)">${f}</g>`;
  const fanHalf = wave(P, 62, 20, 66, 1.7) + wave(P, 50, 10, 46, 1.8) + wave(P, 37, 3, 26, 1.6);
  const fan = `<circle cx="0" cy="-6" r="44" fill="url(#${P}o)"/>${sym(fanHalf)}`;
  let carve = '';
  for (let r = 0; r < 3; r += 1) for (let c = 0; c < 3; c += 1) carve += `M${n(-6.4 + c * 5)} ${n(-12 + r * 5.2)}h3`;
  const stele = `<path d="M-12.4 20L-12.4 -26Q-12.4 -39.6 0 -39.6Q12.4 -39.6 12.4 -26L12.4 20Z" fill="url(#${P}t)" ${sc(T, 0.9)}/>`
    + `<path d="M-9.8 20L-9.8 -25.6Q-9.8 -37 0 -37Q9.8 -37 9.8 -25.6L9.8 20" fill="none" stroke="${T.accent}" stroke-opacity="0.9" stroke-width="0.8"/>`
    + `<path d="M-10.8 18L-10.8 -25.6Q-10.8 -38 -1 -38.2" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="0.7" stroke-linecap="round"/>`
    + `<path d="${carve}" fill="none" stroke="${T.accent}" stroke-width="0.9" stroke-linecap="round"/>`
    + `<path d="M-2.8 -29.6L2.8 -29.6L5.6 -26.8L5.6 -22.2L2.8 -19.4L-2.8 -19.4L-5.6 -22.2L-5.6 -26.8Z" transform="translate(0 -3)" fill="${T.void}" stroke="${T.accent}" stroke-width="0.7" stroke-linejoin="round"/><path d="M-3 -28.6H3M-3 -25.4H-0.6M0.6 -25.4H3M-3 -22.2H3" stroke="${T.accent}" stroke-width="0.7" stroke-linecap="round"/>`;
  const dome = 'M-54 36C-52 14 -28 5 0 5C28 5 52 14 54 36Z';
  let plates = '';
  for (let r = 0; r < 4; r += 1) {
    const y = 10 + r * 11.4;
    const off = r % 2 ? 6.58 : 0;
    for (let c = -5; c <= 5; c += 1) plates += hex(P, c * 13.16 + off, y, 0, 7.6);
  }
  const shell = `<defs><clipPath id="${P}d"><path d="${dome}"/></clipPath></defs><path d="${dome}" fill="${T.shell}" ${sc(T, 1)}/><g clip-path="url(#${P}d)">${plates}</g><path d="M-52 33C-48 16 -26 7 0 7C26 7 48 16 52 33" fill="none" stroke="${T.light}" stroke-opacity="0.7" stroke-width="0.9" transform="translate(0 -0.4)"/>`;
  const band = `<path d="M-80 25C-70 33 -40 34.6 0 34.6C40 34.6 70 33 80 25L80 28.6C70 37 40 36.4 0 36.4C-40 36.4 -70 37 -80 28.6Z" fill="url(#${P}w)" ${sc(T, 0.8)}/>`
    + sym(`${wave(P, 69, 27, 66, 1.2)}${wave(P, 60, 31, 40, 0.95)}`);
  const limbs = sym(kit.limb(T, P, [40, 31], [56, 25], 6, 7));
  const headG = `<g transform="translate(0 6) scale(1.02)">${head(T, P, h)}</g>`;
  return `${defs(T, P)}${fan}${stele}${shell}${band}${limbs}${headG}${gem(0, 33, 3.4, T.ruby, T)}${star4(0, -42.6, 2.2, T.accent, 0.95)}${star4(-70, 6, 1.8, T.water, 0.95)}${star4(70, 6, 1.8, T.water, 0.95)}${dot(-52, 0, 1, T.accent)}${dot(52, 0, 1, T.accent)}`;
};

module.exports = { avatarFrame, accent, crest, corner, edge, side, bottom, emblem, emblemGhost, head, wave, hex, defs, arcCtrl };
