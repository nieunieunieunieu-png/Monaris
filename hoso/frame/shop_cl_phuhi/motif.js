// ===== hoso/frame/shop_cl_phuhi/motif.js — Phụ Hí Thư Long: rồng văn chương cúi đọc, thân quấn cuộn sách, râu như nét bút lông, mực loang =====
// Đầu rồng (emblem/emblemGhost): độc lập, tâm (0,0), hướng LÊN = hướng mọc sừng, bán kính ≈ 20 (bờm/râu bằng nét cọ tới ≈ ±37).
// Hình học: avatar mọi nét r ≤ 84; accent trong ô 28×28 nhô ra ngoài (lên-trái); crest x −80..80, chân y=36; bottom y ∈ [-4,12], nửa rộng ≤ 70.
const kit = require('../../dragonKit');

const n = kit.n;
const sc = (T, w = 0.6) => `stroke="${T.dark}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

// gradient dùng chung (id theo tiền tố P): b/v/o (dragonKit) + y (tròng mắt) + h (sừng) + p (giấy) + r (dải cọ) + w (cán bút) + i (giọt mực)
const defs = (T, P) => kit.dragonDefs(T, P).replace('</defs>', ''
  + `<radialGradient id="${P}y" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.4" stop-color="${T.ember}"/><stop offset="1" stop-color="${T.main}"/></radialGradient>`
  + `<linearGradient id="${P}h" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${T.dark}"/><stop offset="0.55" stop-color="${T.main}"/><stop offset="1" stop-color="${T.light}"/></linearGradient>`
  + `<linearGradient id="${P}p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#DDD2A8"/><stop offset="1" stop-color="#A99B72"/></linearGradient>`
  + `<linearGradient id="${P}r" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${T.dark}"/><stop offset="0.55" stop-color="${T.main}"/><stop offset="1" stop-color="${T.light}"/></linearGradient>`
  + `<linearGradient id="${P}w" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${T.woodLight}"/><stop offset="0.5" stop-color="${T.wood}"/><stop offset="1" stop-color="#3E2512"/></linearGradient>`
  + `<radialGradient id="${P}i" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stop-color="#4C74C4"/><stop offset="1" stop-color="${T.void}"/></radialGradient>`
  + '</defs>');

// giọt mực (đầu nhọn hướng LÊN khi a=0), viền sáng để tách nền tối
const inkDrop = (T, P, x, y, s = 1, a = 0) => `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(a)}) scale(${n(s)})"><path d="M0 -4.2C1.6 -2 2.9 -0.4 2.9 1.2A2.9 2.9 0 0 1 -2.9 1.2C-2.9 -0.4 -1.6 -2 0 -4.2Z" fill="url(#${P}i)" stroke="${T.light}" stroke-opacity="0.85" stroke-width="0.5"/><circle cx="-0.9" cy="0.4" r="0.7" fill="#fff" fill-opacity="0.85"/></g>`;
// con dấu đỏ nhỏ
const seal = (T, x, y, s = 1, a = 0) => `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(a)}) scale(${n(s)})"><rect x="-3" y="-3" width="6" height="6" rx="0.8" fill="${T.ruby}" stroke="${T.dark}" stroke-width="0.5"/><path d="M-1.7 -1.5H1.7M0 -1.5V1.9M-1.7 1.3H1.7" stroke="#FFE3DE" stroke-opacity="0.9" stroke-width="0.6" fill="none" stroke-linecap="round"/></g>`;
// dải nét cọ thon dần (viền tối + gradient xanh + vệt sáng)
const rib = (T, P, ctrl, w0, w1, per = 10) => `<path d="${kit.taperPath(ctrl, w0, w1, per)}" fill="url(#${P}r)" stroke="${T.dark}" stroke-width="0.5" stroke-linejoin="round"/><path d="${kit.spine(ctrl)}" fill="none" stroke="#fff" stroke-opacity="0.5" stroke-width="0.45" stroke-linecap="round"/>`;

// ---- đầu rồng: mặt thon dài, mắt xanh lim dim nhìn xuống, sừng mảnh vuốt ngược, bờm = dải nét cọ, râu dài kết giọt mực; y: sừng −25 … cằm +21 ----
// mode: 0 = đầy đủ · 1 = gọn (đầu nhỏ trên avatar) · 2 = đỉnh thẻ (bỏ bờm vì đã có dải cọ sau lưng)
const SKULL = 'M0 -13.2C4 -13.6 8.4 -12.4 11 -9L14.6 -3.4C15.6 0 14.4 3.6 12.4 6.8L10.6 12.4C9.8 15.8 7.6 18.6 4.6 20C3 20.6 1.6 20.8 0 20.8C-1.6 20.8 -3 20.6 -4.6 20C-7.6 18.6 -9.8 15.8 -10.6 12.4L-12.4 6.8C-14.4 3.6 -15.6 0 -14.6 -3.4L-11 -9C-8.4 -12.4 -4 -13.6 0 -13.2Z';
const HORN_R = 'M5.2 -10.6C6.2 -16.6 10.4 -22 17.8 -25.4C15.6 -21 14.6 -16.6 12.8 -9.8Z';
const HORN2_R = 'M10.8 -13.6C13.4 -15.6 16.6 -15.8 19.6 -14.4C17 -13.8 15.2 -12.6 13.8 -10.8Z';

const headHalf = (T, P, mode) => {
  const o = sc(T, 0.6);
  let mane = '';
  if (mode === 0) {
    mane = rib(T, P, [[12, -6], [19, -14], [26, -19], [34, -19.5]], 4.4, 0.4) + rib(T, P, [[13.4, -1], [22, -3], [29, -8], [37, -5.4]], 3.8, 0.4) + rib(T, P, [[12.8, 4], [21, 5.6], [28, 2], [35.5, 6.4]], 3.2, 0.4)
      + inkDrop(T, P, 35.6, -19.6, 0.42, 90) + inkDrop(T, P, 38.4, -5.2, 0.42, 100) + inkDrop(T, P, 37, 6.6, 0.4, 110);
  }
  const whisk = mode !== 0 ? '' : kit.whisker(T, [[9.4, 11.2], [18, 12.4], [25.4, 9.6], [29.6, 15.4]], 1.3) + inkDrop(T, P, 29.8, 17.2, 0.5, 170)
    + kit.whisker(T, [[9, 13.4], [16, 18.6], [24, 20], [26.4, 27.4]], 1.1) + inkDrop(T, P, 26.4, 29, 0.46, 180);
  const horn = `<path d="${HORN_R}" fill="url(#${P}h)" ${o}/>`
    + `<path d="M8.2 -13.2L12 -14.4M9.6 -16.6L13.4 -17.6M11.6 -19.8L15 -20.6" stroke="${T.dark}" stroke-opacity="0.6" stroke-width="0.5" fill="none" stroke-linecap="round"/>`
    + `<path d="M7.2 -11C8.2 -16 11.6 -20.6 16.6 -23.8" stroke="#fff" stroke-opacity="0.85" stroke-width="0.6" fill="none" stroke-linecap="round"/>`
    + `<path d="${HORN2_R}" fill="url(#${P}h)" ${sc(T, 0.5)}/>`;
  const face = `<path d="M0 -12.6C2 -12.4 3.6 -8 3.8 -2L3.4 10L0 12Z" fill="${T.light}" fill-opacity="0.22"/>`;
  let sca = '';
  for (let r = 0; r < 5; r += 1) for (let c = 0; c < 4; c += 1) {
    const x = 2.4 + c * 3.8 + (r % 2 ? 1.9 : 0); const y = -9.4 + r * 4.6;
    if (r === 2 || (r === 1 && c > 1)) continue; // chừa chỗ mắt
    sca += `M${n(x - 1.4)} ${n(y)}Q${n(x)} ${n(y + 2.2)} ${n(x + 1.4)} ${n(y)}`;
  }
  const scales = `<path d="${sca}" fill="none" stroke="${T.dark}" stroke-opacity="0.5" stroke-width="0.45" stroke-linecap="round"/>`;
  const brow = `<path d="M2.2 -3.6C5.4 -6.6 11 -6.8 14.6 -4L13.8 -2.6C10.6 -4.4 6 -4.4 2.6 -2.2Z" fill="${T.dark}" stroke="${T.dark}" stroke-width="0.4" stroke-linejoin="round"/><path d="M3.2 -3.6C6.2 -6 10.6 -6.2 13.6 -4.2" stroke="${T.light}" stroke-opacity="0.7" stroke-width="0.45" fill="none"/>`;
  const eye = `<circle cx="8.2" cy="-0.6" r="4.4" fill="url(#${P}o)"/><path d="M2.8 -0.4C5 -3.4 10.6 -3.8 13.2 -1.4C10.8 1.6 5.6 1.8 2.8 -0.4Z" fill="url(#${P}y)" stroke="${T.dark}" stroke-width="0.5" stroke-linejoin="round"/><ellipse cx="8.4" cy="0.2" rx="0.75" ry="1.5" fill="#06123A"/><circle cx="7" cy="-0.9" r="0.6" fill="#fff"/><path d="M2.4 -0.9C5 -4.6 10.8 -4.8 13.6 -1.9C10.4 -2.7 6 -2.5 2.4 -0.9Z" fill="${T.dark}" stroke="${T.dark}" stroke-width="0.3" stroke-linejoin="round"/>`;
  const nose = `<path d="M2.4 14.4C3.6 13.4 5.2 13.8 5.6 15.2C4.2 15.8 3 15.6 2.4 14.4Z" fill="${T.void}" fill-opacity="0.9"/><path d="M6 6.6C7 8.6 7.4 10.6 7.2 12.4" stroke="${T.dark}" stroke-opacity="0.45" stroke-width="0.45" fill="none" stroke-linecap="round"/>`;
  const fang = `<path d="M5.2 17.6L6 20.8L7.4 17.8Z" fill="#FFFDF0" stroke="${T.dark}" stroke-width="0.35" stroke-linejoin="round"/>`;
  return { back: `${mane}${whisk}${horn}`, front: `${face}${scales}${brow}${eye}${nose}${fang}` };
};

const head = (T, P, h, mode = 0) => {
  const { gem } = h;
  const { back, front } = headHalf(T, P, mode);
  const o = sc(T, 0.6);
  const skull = `<path d="${SKULL}" fill="url(#${P}b)" ${o}/>`;
  const mouth = `<path d="M-8.4 16.6C-5 18.4 -2 18.8 0 18.8C2 18.8 5 18.4 8.4 16.6" stroke="${T.dark}" stroke-width="0.7" fill="none" stroke-linecap="round"/>`;
  // chỏm lông bút trên trán + ấn đỏ giữa trán + râu cằm
  const tuft = rib(T, P, [[0, -12], [-1.8, -16], [-1.2, -20.4], [-0.2, -23.6]], 3.6, 0.4, 8) + rib(T, P, [[1.4, -12], [3, -15.4], [3.6, -19], [4.6, -21.4]], 2.4, 0.3, 8) + rib(T, P, [[-1.4, -12], [-4.2, -15], [-5.8, -18.4], [-7.8, -20.2]], 2.4, 0.3, 8);
  const beard = mode === 1 ? '' : kit.whisker(T, [[0, 20.2], [-1.6, 23.2], [1.6, 25.4], [0, 28.4]], 1.0) + inkDrop(T, P, 0, 30, 0.42, 180);
  return `<defs><clipPath id="${P}hc"><path d="${SKULL}"/></clipPath><g id="${P}hb">${back}</g><g id="${P}hf"><g clip-path="url(#${P}hc)">${front}</g></g></defs>`
    + `<use href="#${P}hb"/><use href="#${P}hb" transform="scale(-1 1)"/>${beard}${skull}<use href="#${P}hf"/><use href="#${P}hf" transform="scale(-1 1)"/>${mouth}${tuft}${gem(0, -7.4, 2.6, T.ruby, T)}`;
};

const emblem = (T, P, h) => defs(T, P) + head(T, P, h, 0);
const emblemGhost = (T, P, h) => {
  const hornL = 'M-5.2 -10.6C-6.2 -16.6 -10.4 -22 -17.8 -25.4C-15.6 -21 -14.6 -16.6 -12.8 -9.8Z';
  const tuft = 'M-2 -12C-3 -17 -1.4 -21 0 -24C1.4 -21 3 -17 2 -12Z';
  return kit.ghost(`${SKULL}${HORN_R}${hornL}${tuft}`, 0.3) + kit.ghostDot(0, -1, T.main);
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
    const t0 = a0 + d * i; const t1 = t0 + d;
    const p0 = polar(r, t0); const p1 = polar(r, t1);
    pts.push([p0[0] + k * r * Math.cos(rad(t0)), p0[1] + k * r * Math.sin(rad(t0))]);
    pts.push([p1[0] - k * r * Math.cos(rad(t1)), p1[1] - k * r * Math.sin(rad(t1))]);
    pts.push(p1);
  }
  return pts;
};

const HEAD_A = 330; // đầu ở trên-trái, cúi nhìn vào cuộn sách
const TAIL_A = 266; // đuôi chui dưới cuộn sách
const SCROLL = [274, 318]; // cuộn sách nằm giữa đuôi và đầu

// KHUNG AVATAR (tự dựng): vành mực + thân rồng thuỷ mặc cuộn cả vành, cuộn sách mở nằm giữa đuôi và đầu. Vẽ cho R=70 rồi scale(R/70). Mọi nét r ∈ [64, 84].
const avatarFrame = (T, R = 70, h) => {
  const { polar, dot, star4, gem, pearl } = h;
  const P = 'shop_cl_phuhi-avatar-';
  const k = Number((R / 70).toFixed(4));
  const RB = 73.6;
  const A0 = HEAD_A + 4; const A1 = TAIL_A + 360;
  const prof = (t) => 1.4 + 6 * Math.pow(1 - t, 0.85) + 1.2 * Math.exp(-Math.pow((t - 0.08) / 0.06, 2));
  const tOf = (a) => (a - A0) / (A1 - A0);
  const ctrl = arcCtrl(RB, A0, A1);
  const extra = `<radialGradient id="${P}a" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="82"><stop offset="0.84" stop-color="${T.dark}"/><stop offset="0.9" stop-color="${T.main}"/><stop offset="0.95" stop-color="${T.ember}"/><stop offset="0.98" stop-color="${T.light}"/></radialGradient>`
    + `<radialGradient id="${P}q" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="80"><stop offset="0.86" stop-color="${T.mouth}"/><stop offset="0.92" stop-color="${T.void}"/><stop offset="0.97" stop-color="${T.mouth}"/></radialGradient>`
    + `<path id="${P}s" d="M-1.4 0.6Q0 -1.4 1.4 0.6" fill="none" stroke="${T.dark}" stroke-opacity="0.8" stroke-width="0.55" stroke-linecap="round"/>`
    + `<path id="${P}n" d="M-2 0C-1.8 -3.4 -0.6 -6.2 1.2 -8C0.8 -5.2 2.2 -2.6 2 0Z" fill="url(#${P}r)" stroke="${T.dark}" stroke-width="0.4" stroke-linejoin="round"/>`;
  const ring = `<path fill-rule="evenodd" fill="url(#${P}q)" d="M-77.6 0A77.6 77.6 0 1 0 77.6 0A77.6 77.6 0 1 0 -77.6 0ZM-70 0A70 70 0 1 0 70 0A70 70 0 1 0 -70 0Z"/>`
    + `<circle r="70.4" fill="none" stroke="${T.accent}" stroke-opacity="0.6" stroke-width="0.8"/><circle r="77.2" fill="none" stroke="${T.main}" stroke-opacity="0.9" stroke-width="0.9"/><circle r="78.5" fill="none" stroke="${T.light}" stroke-opacity="0.5" stroke-width="0.5"/>`;
  // sóng mực mờ mép trong (mỗi 12°)
  let ripples = '';
  for (let a = 0; a < 360; a += 12) { if (a > 266 && a < 336) continue; const [x, y] = polar(67.4, a); ripples += `<path transform="translate(${x} ${y}) rotate(${a + 180})" d="M-2.6 0Q0 -2.8 2.6 0" fill="none" stroke="${T.ember}" stroke-opacity="0.55" stroke-width="0.6" stroke-linecap="round"/>`; }
  let scl = '';
  for (let a = A0 + 6; a < A1 - 8; a += 18) {
    const w = prof(tOf(a));
    const [x, y] = polar(RB + (Math.round((a - A0) / 18) % 2 ? 1 : -1) * w * 0.2, a);
    scl += `<use href="#${P}s" transform="translate(${x} ${y}) rotate(${n(a + 90)}) scale(${n(0.6 + w * 0.2)})"/>`;
  }
  let fins = '';
  for (let a = A0 + 4; a < A1 - 16; a += 22) {
    const t = tOf(a);
    const [x, y] = polar(RB + prof(t) * 0.3, a);
    fins += `<use href="#${P}n" transform="translate(${x} ${y}) rotate(${n(a + 10)}) scale(${n(0.55 + 0.35 * (1 - t))})"/>`;
  }
  const body = `<path d="${kit.taperPath(ctrl, 0, 0, 8, prof)}" fill="url(#${P}a)" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/>`
    + `<path d="${kit.spine(arcCtrl(RB + 1.4, A0 + 6, A1 - 40))}" fill="none" stroke="${T.light}" stroke-opacity="0.7" stroke-width="0.6" stroke-linecap="round"/>${scl}`;
  // cuộn sách mở: tờ giấy cong + 2 đầu cuộn tròn + 3 dòng chữ mực (nét đứt) + ấn đỏ
  const [s0, s1] = SCROLL;
  const roll = (a) => { const [x, y] = polar(RB, a); return `<circle cx="${x}" cy="${y}" r="5.2" fill="url(#${P}p)" stroke="${T.dark}" stroke-width="0.6"/><circle cx="${x}" cy="${y}" r="3.3" fill="none" stroke="${T.dark}" stroke-opacity="0.6" stroke-width="0.5"/><circle cx="${x}" cy="${y}" r="1.4" fill="none" stroke="${T.dark}" stroke-opacity="0.7" stroke-width="0.5"/>`; };
  let txt = '';
  [-2, 0, 2].forEach((d) => { txt += `<path d="${kit.spine(arcCtrl(RB + d, s0 + 7, s1 - 7))}" fill="none" stroke="${T.void}" stroke-opacity="0.65" stroke-width="0.7" stroke-dasharray="2.2 1.1 1.2 1.1"/>`; });
  const sheet = `<path d="${kit.taperPath(arcCtrl(RB, s0, s1), 9, 9, 8)}" fill="url(#${P}p)" stroke="${T.dark}" stroke-width="0.6" stroke-linejoin="round"/>`;
  const [sx, sy] = polar(RB - 0.4, s1 - 12);
  const scroll = `${sheet}${txt}${roll(s0)}${roll(s1)}${seal(T, sx, sy, 0.8, s1 - 12)}`;
  const claws = [HEAD_A + 20, HEAD_A + 36].map((a) => { const [x, y] = polar(75.6, a); return kit.claw(T, P, x, y, a + 180, 0.66); }).join('');
  // đuôi: nét cọ phẩy + 3 giọt mực rơi ở mút đuôi (bên ngoài cuộn sách)
  const [tx, ty] = polar(RB, TAIL_A - 4);
  const tail = inkDrop(T, P, tx, ty, 0.62, TAIL_A - 4 - 78) + inkDrop(T, P, ...polar(RB - 3, TAIL_A - 14), 0.46, TAIL_A - 14 - 70) + inkDrop(T, P, ...polar(RB + 4, TAIL_A - 22), 0.38, TAIL_A - 22 - 60);
  let studs = '';
  for (let a = 15; a < 360; a += 30) {
    if (a > 280 && a < 360) continue;
    const [x, y] = polar(79.4, a);
    studs += (a - 15) % 60 === 0 ? gem(x, y, 3.1, T.ruby, T, a) : pearl(x, y, 1.6, T);
  }
  let sparks = '';
  [[40, 80.8], [100, 81], [160, 80.6], [220, 81], [250, 80.8], [352, 81.2]].forEach(([a, r], i) => { const [x, y] = polar(r, a); sparks += i % 2 ? star4(x, y, 1.6, T.accent, 0.95) : dot(x, y, 0.9, T.ember, 0.95); });
  const [hx, hy] = polar(72.2, HEAD_A);
  const headG = `<g transform="translate(${hx} ${hy}) rotate(${HEAD_A})"><circle r="11" fill="url(#${P}o)"/><g transform="scale(0.43)">${head(T, P, h, 1)}</g></g>`;
  return `${defs(T, P).replace('</defs>', `${extra}</defs>`)}<g transform="scale(${k})">${ring}${ripples}${fins}${body}${scroll}${tail}${studs}${sparks}${headG}</g>`;
};

// ---- bút lông nằm dọc trục +x từ gốc (0,0): cán tre, đai bạc, đầu lông mực; dài ≈ 36 ----
const brush = (T, P, len = 1) => `<g transform="scale(${len} 1)"><path d="M0 -1.5H22L22.6 0L22 1.5H0Z" fill="url(#${P}w)" stroke="${T.dark}" stroke-width="0.5" stroke-linejoin="round"/>`
  + `<path d="M0 -1.4Q-1.4 0 0 1.4" fill="${T.wood}" stroke="${T.dark}" stroke-width="0.4"/>`
  + `<rect x="22" y="-1.9" width="4" height="3.8" rx="0.8" fill="${T.light}" stroke="${T.dark}" stroke-width="0.5"/><path d="M23.4 -1.9V1.9" stroke="${T.main}" stroke-width="0.5"/>`
  + `<path d="M26 -1.8C29 -2.4 33 -1.4 37 0C33 1.4 29 2.4 26 1.8Z" fill="url(#${P}i)" stroke="${T.light}" stroke-opacity="0.8" stroke-width="0.5" stroke-linejoin="round"/><path d="M27 -1C30 -1.4 33 -0.8 35.6 -0.1" stroke="#fff" stroke-opacity="0.6" stroke-width="0.45" fill="none"/></g>`;

// điểm nhấn góc (28×28 nhô ra ngoài, lên-trái): bút lông chéo + nét cọ phẩy + ấn đỏ + giọt mực
const accent = (T, P, h) => {
  const { star4, dot } = h;
  const sw = [[2, 3], [-8, 4], [-18, -2], [-24, -9]];
  const swoosh = `<path d="${kit.taperPath(sw, 5, 0.6, 12)}" fill="url(#${P}r)" stroke="${T.dark}" stroke-width="0.5" stroke-linejoin="round"/><path d="${kit.spine(sw)}" fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="0.5" stroke-linecap="round"/>`;
  return `${defs(T, P)}${swoosh}<g transform="translate(-2 -3) rotate(-125) scale(0.72)">${brush(T, P)}</g>${seal(T, -22.5, -4.2, 0.9, -8)}${inkDrop(T, P, -25.4, -15.6, 0.6, -20)}${inkDrop(T, P, -12.8, -25.2, 0.5, 20)}${star4(-5, -24, 2, T.accent, 0.95)}${dot(-24, -23, 0.9, T.ember, 0.95)}`;
};

// ================= corner / edge / side / bottom =================
// góc 44×44 (gốc ở đỉnh góc, trải sang +x +y): cuộn sách cuốn góc + 2 dải giấy chạy dọc cạnh + vuốt rồng quắp cuộn
const strip = (T, P) => `<path d="M16 3.4H42V10.4H16Z" fill="url(#${P}p)" stroke="${T.dark}" stroke-width="0.6" stroke-linejoin="round"/><path d="M20 5.6H38M20 8.2H33" stroke="${T.void}" stroke-opacity="0.6" stroke-width="0.7" stroke-dasharray="2.4 1.2" stroke-linecap="round" fill="none"/><path d="M42 3.4Q44 6.9 42 10.4" fill="none" stroke="${T.dark}" stroke-width="0.6"/>`;
const corner = (T, P, h) => {
  const { star4, dot } = h;
  const dfs = defs(T, P).replace(`id="${P}e"`, `id="${P}ey"`);
  const arm = kit.taperPath([[38, 38], [32, 33], [24, 25], [18.4, 18.4]], 9, 6, 8);
  const rollG = `<circle cx="11" cy="11" r="10.6" fill="url(#${P}o)"/><circle cx="11" cy="11" r="8.6" fill="url(#${P}p)" stroke="${T.dark}" stroke-width="0.7"/><circle cx="11" cy="11" r="6" fill="none" stroke="${T.dark}" stroke-opacity="0.6" stroke-width="0.6"/><circle cx="11" cy="11" r="3.4" fill="none" stroke="${T.dark}" stroke-opacity="0.7" stroke-width="0.6"/><circle cx="11" cy="11" r="1.2" fill="${T.dark}" fill-opacity="0.7"/>`;
  return `${dfs}${strip(T, P)}<g transform="matrix(0 1 1 0 0 0)">${strip(T, P)}</g>${rollG}`
    + `<path d="${arm}" fill="url(#${P}b)" stroke="${T.dark}" stroke-width="0.7" stroke-linejoin="round"/><path d="M36 36L22 22" stroke="${T.light}" stroke-opacity="0.7" stroke-width="0.6" fill="none"/><path d="M33 31.4Q35 33 33.2 35M28 26.4Q30 28 28.2 30M23 21.4Q25 23 23.2 25" fill="none" stroke="${T.dark}" stroke-opacity="0.55" stroke-width="0.5"/>`
    + `${kit.claw(T, P, 19.4, 19.4, -45, 1.25)}${seal(T, 30.6, 6.9, 0.7, 4)}${inkDrop(T, P, 41, 20, 0.55, 0)}${inkDrop(T, P, 20, 41, 0.55, 0)}${star4(34, 24, 1.8, T.accent, 0.9)}${dot(24, 34, 0.8, T.ember, 0.9)}`;
};

// đơn vị cạnh 44 (tâm x=0, chạy dọc cạnh trên, +y = vào trong, ≤ 22px): thẻ trúc giản 3 thanh buộc dây + nét mực + giọt mực ở mối nối
const edge = (T, P, h) => {
  let slats = '';
  [-11.4, -3.8, 3.8].forEach((x, i) => {
    const x1 = n(x + 7.6); const xm = n(x + 3.8); const xa = n(x + 2.6); const xb = n(x + 5); const xc = n(x + 3.6);
    slats += `<path d="M${x} 7.4H${x1}V20.4Q${xm} 22 ${x} 20.4Z" fill="url(#${P}p)" stroke="${T.dark}" stroke-width="0.6" stroke-linejoin="round"/><path d="M${xm} 10.2C${xa} 12.6 ${xb} 14.4 ${xc} 17.6" stroke="${T.void}" stroke-opacity="0.7" stroke-width="0.9" fill="none" stroke-linecap="round"/>`;
    if (i === 1) slats += `<path d="M${n(x + 1)} 12.2L${n(x + 6.6)} 12.6" stroke="${T.void}" stroke-opacity="0.45" stroke-width="0.6"/>`;
  });
  return `${slats}<path d="M-12 10H12M-12 18H12" stroke="${T.ruby}" stroke-width="1.2" stroke-linecap="round" fill="none"/><path d="M-12 8.8H12" stroke="${T.light}" stroke-opacity="0.5" stroke-width="0.4"/>${inkDrop(T, P, 22, 9.6, 0.5, 0)}`;
};

// cạnh bên (cao 100, ±15 quanh x=0, nối khớp y=0/100): 6 mảnh vảy dọc xương sống + chỏm lông bút hai bên + ấn đỏ giữa + giọt mực
const side = (T, P, h) => {
  const { star4 } = h;
  let plates = '';
  [8, 22, 36, 64, 78, 92].forEach((y) => {
    plates += `<path d="M0 ${y - 7}L5.8 ${y}L0 ${y + 7}L-5.8 ${y}Z" fill="url(#${P}b)" ${sc(T, 0.6)}/><path d="M0 ${n(y - 4.6)}L3.4 ${y}L0 ${n(y + 4.6)}L-3.4 ${y}Z" fill="none" stroke="${T.light}" stroke-opacity="0.6" stroke-width="0.5"/>`;
  });
  const tufts = (y, d) => rib(T, P, [[d * 4, y], [d * 8, y - 4], [d * 11, y - 8], [d * 14, y - 9]], 3, 0.4, 8);
  let bristles = '';
  [-1, 1].forEach((d) => { bristles += tufts(44, d) + tufts(56, d); });
  return `${defs(T, P)}${plates}${bristles}<circle cx="0" cy="50" r="8" fill="url(#${P}o)"/>${seal(T, 0, 50, 1, 45)}${star4(-11, 50, 1.6, T.accent, 0.9)}${star4(11, 50, 1.6, T.accent, 0.9)}${inkDrop(T, P, 8.4, 28, 0.5, 180)}${inkDrop(T, P, -8.4, 72, 0.5, 180)}`;
};

// chân thẻ (gốc giữa mép dưới, cục bộ y ∈ [-4,12], nửa rộng ≤ 70, đối xứng): cuộn sách mở nằm ngang + dòng chữ mực + ấn đỏ giữa + giọt mực hai bên
const bottom = (T, P, h) => {
  const { star4, pearl } = h;
  const sheet = 'M-60 1.2C-40 -1 -20 1 0 1C20 1 40 -1 60 1.2L60 8.4C40 10.6 20 8.6 0 8.6C-20 8.6 -40 10.6 -60 8.4Z';
  const rolls = [-61, 61].map((x) => `<ellipse cx="${x}" cy="4.8" rx="5" ry="7.4" fill="url(#${P}p)" stroke="${T.dark}" stroke-width="0.7"/><ellipse cx="${x}" cy="4.8" rx="3" ry="4.8" fill="none" stroke="${T.dark}" stroke-opacity="0.6" stroke-width="0.5"/><ellipse cx="${x}" cy="4.8" rx="1.2" ry="2" fill="none" stroke="${T.dark}" stroke-opacity="0.7" stroke-width="0.5"/>`).join('');
  const lines = [3.2, 5.2, 7].map((y) => `<path d="M-52 ${y}H-12M12 ${y}H52" stroke="${T.void}" stroke-opacity="0.6" stroke-width="0.8" stroke-dasharray="3 1.4 1.6 1.4" fill="none"/>`).join('');
  return `${defs(T, P)}<path d="${sheet}" fill="url(#${P}p)" stroke="${T.dark}" stroke-width="0.7" stroke-linejoin="round"/>${lines}${rolls}`
    + `<circle cx="0" cy="4.8" r="8" fill="url(#${P}o)"/>${seal(T, 0, 4.8, 1.3, 0)}${pearl(-9.4, 4.8, 1.3, T)}${pearl(9.4, 4.8, 1.3, T)}${inkDrop(T, P, -66, -1.6, 0.4, 0)}${inkDrop(T, P, 66, -1.6, 0.4, 0)}${star4(-33, -1.6, 1.3, T.accent, 0.9)}${star4(33, -1.6, 1.3, T.accent, 0.9)}`;
};

// ================= crest =================
// Đỉnh thẻ (x −80..80, chân y=36): Phụ Hí cúi đầu trên cuộn sách mở — dải nét cọ khổng lồ toả sau lưng, thân + 2 vuốt trước bám mép cuộn, bút lông nằm bên trái, mực loang bên phải.
const crest = (T, P, h) => {
  const { star4, dot } = h;
  const sym = (f) => `${f}<g transform="scale(-1 1)">${f}</g>`;
  const ribbons = sym(rib(T, P, [[-6, 12], [-34, 6], [-46, -18], [-70, -14]], 12, 0.8, 14) + rib(T, P, [[-8, 18], [-36, 20], [-56, 6], [-75, 12]], 10, 0.8, 14) + rib(T, P, [[-6, 4], [-22, -10], [-30, -32], [-54, -32]], 10, 0.8, 14)
    + inkDrop(T, P, -71.2, -13.4, 0.6, -85) + inkDrop(T, P, -75.6, 12.6, 0.55, -90) + inkDrop(T, P, -55.4, -32.4, 0.55, -75));
  const sheet = 'M-60 21C-40 18 -20 21 0 21C20 21 40 18 60 21L60 33.6C40 36 20 34.6 0 35.2C-20 34.6 -40 36 -60 33.6Z';
  const rolls = [-61, 61].map((x) => `<ellipse cx="${x}" cy="27.6" rx="5.4" ry="8.6" fill="url(#${P}p)" stroke="${T.dark}" stroke-width="0.8"/><ellipse cx="${x}" cy="27.6" rx="3.2" ry="5.6" fill="none" stroke="${T.dark}" stroke-opacity="0.6" stroke-width="0.6"/><ellipse cx="${x}" cy="27.6" rx="1.3" ry="2.6" fill="none" stroke="${T.dark}" stroke-opacity="0.7" stroke-width="0.6"/>`).join('');
  const lines = [25.4, 28.6, 31.8].map((y) => `<path d="M-52 ${y}H-26M26 ${y}H52" stroke="${T.void}" stroke-opacity="0.6" stroke-width="0.9" stroke-dasharray="3 1.4 1.6 1.4" fill="none"/>`).join('');
  const scrollG = `<path d="${sheet}" fill="url(#${P}p)" stroke="${T.dark}" stroke-width="0.9" stroke-linejoin="round"/>${lines}${rolls}${seal(T, -42, 29.4, 1, -6)}${seal(T, 44, 28.6, 0.85, 8)}`;
  const body = `<path d="M-22 31C-24 17 -19 6 -11 1L11 1C19 6 24 17 22 31Z" fill="url(#${P}b)" ${sc(T, 0.8)}/>`;
  let scales = '';
  for (let r = 0; r < 3; r += 1) for (let c = -2; c <= 2; c += 1) { const x = c * 8 + (r % 2 ? 4 : 0); if (Math.abs(x) < 20) scales += `M${n(x - 3.4)} ${12 + r * 6}Q${x} ${16 + r * 6} ${n(x + 3.4)} ${12 + r * 6}`; }
  const detail = `<path d="${scales}" fill="none" stroke="${T.dark}" stroke-opacity="0.55" stroke-width="0.7"/><path d="M-13 6C-17 14 -17 22 -16 28" fill="none" stroke="${T.light}" stroke-opacity="0.7" stroke-width="0.8"/>`;
  const claws = sym(kit.claw(T, P, -15, 25, 180, 0.85));
  const pen = `<g transform="translate(-63 20.6) rotate(-9)">${brush(T, P)}</g>`;
  const splash = `<path d="M46 22C44 17 48 12 53 13C54 9 60 8 62 12C67 12 69 18 65 21C67 24 62 26 59 24C56 27 50 26 49 23C47 24 46 23 46 22Z" fill="url(#${P}i)" stroke="${T.light}" stroke-opacity="0.85" stroke-width="0.6"/><path d="M50 15C52 13.6 55 13.4 57 14.4" stroke="#fff" stroke-opacity="0.5" stroke-width="0.6" fill="none" stroke-linecap="round"/>${inkDrop(T, P, 69, 6, 0.55, 0)}${inkDrop(T, P, 42, 8, 0.45, 0)}${dot(72, 14, 1.1, T.main, 0.9)}${dot(40, 15, 0.8, T.ember, 0.9)}`;
  return `${defs(T, P)}<circle cx="0" cy="-6" r="40" fill="url(#${P}o)"/>${ribbons}<g transform="translate(0 35) scale(0.8 0.7) translate(0 -35)">${scrollG}</g>${body}${detail}<g transform="translate(-52 22) scale(0.85) translate(63 -20.6)">${pen}</g>${splash}${claws}<g transform="translate(0 -5) scale(1.22)">${head(T, P, h, 2)}</g>${star4(-30, -24, 1.8, T.accent, 0.95)}${star4(30, -24, 1.8, T.accent, 0.95)}${star4(0, -38, 1.6, T.accent, 0.9)}`;
};

module.exports = { avatarFrame, accent, crest, corner, edge, side, bottom, emblem, emblemGhost, head, defs, arcCtrl };
