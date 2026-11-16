// ===== hoso/frame/shop_cl_xivan/motif.js — Xi Vẫn Hoả Diệm: rồng ngồi nóc điện trấn hoả, đầu cúi nhìn xuống, đuôi vẫy thành ngọn lửa =====
// Task 4-A: avatar + accent + emblem/emblemGhost (đầu rồng độc lập, tâm (0,0), bán kính ≈ 20, hướng LÊN = hướng mọc sừng).
// Task 4-B + 4-C (đã làm): corner / edge / side / bottom / crest.
// Hình học (giữ hợp đồng): avatar mọi nét r ≤ 84, điểm nhấn lấn vào trong r ≥ 64; accent trong ô 28×28 nhô ra ngoài (lên-trái).
const kit = require('../../dragonKit');

const n = kit.n;
const sc = (T, w = 0.6) => `stroke="${T.dark}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

// gradient dùng chung (id theo tiền tố P của phần gọi): b/v/o của dragonKit + f (lửa) + e (mắt) + m (khoang miệng) + h (sừng) + t (ngói)
const defs = (T, P) => kit.dragonDefs(T, P).replace('</defs>', ''
  + `<linearGradient id="${P}f" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${T.dark}"/><stop offset="0.35" stop-color="${T.main}"/><stop offset="0.75" stop-color="${T.ember}"/><stop offset="1" stop-color="${T.accent}"/></linearGradient>`
  + `<radialGradient id="${P}e" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.4" stop-color="${T.accent}"/><stop offset="1" stop-color="${T.main}"/></radialGradient>`
  + `<linearGradient id="${P}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.void}"/><stop offset="1" stop-color="${T.mouth}"/></linearGradient>`
  + `<linearGradient id="${P}h" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${T.dark}"/><stop offset="0.55" stop-color="#C2410C"/><stop offset="1" stop-color="${T.light}"/></linearGradient>`
  + `<linearGradient id="${P}t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.ember}"/><stop offset="1" stop-color="${T.tile}"/></linearGradient>`
  + `<g id="${P}fl">${flameLayers(T, P)}</g>`
  + '</defs>');

// ngọn lửa cong 3 lớp (ngoài cam-vàng, giữa vàng, lõi trắng ấm). Hình mẫu dài 10, rộng 3 nằm trong defs (id `<P>fl`); mỗi ngọn là 1 <use>.
const flameD = (L, W) => `M0 0C${n(-W)} ${n(-L * 0.22)} ${n(-W * 0.95)} ${n(-L * 0.55)} ${n(-W * 0.2)} ${n(-L * 0.74)}C${n(-W * 0.05)} ${n(-L * 0.84)} ${n(-W * 0.4)} ${n(-L * 0.93)} ${n(W * 0.35)} ${n(-L)}C${n(W * 0.55)} ${n(-L * 0.72)} ${n(W * 1.1)} ${n(-L * 0.4)} 0 0Z`;
function flameLayers(T, P) {
  return `<path d="${flameD(10, 3)}" fill="url(#${P}f)" stroke="${T.dark}" stroke-width="0.4" stroke-linejoin="round"/>`
    + `<path d="${flameD(7.2, 1.74)}" fill="${T.accent}" fill-opacity="0.92"/>`
    + `<path d="${flameD(4.2, 0.9)}" fill="#FFF6C9"/>`;
}
// gốc (x,y), hướng a (độ, 0 = lên, chiều kim đồng hồ), dài len, rộng w; flip = -1 để lật gương
const flame = (T, P, x, y, a, len, w, flip = 1) => `<use href="#${P}fl" transform="translate(${n(x)} ${n(y)}) rotate(${n(a)}) scale(${n((w / 3) * flip)} ${n(len / 10)})"/>`;

// ---- đầu rồng: sọ vuông bạnh, mày nặng cúi xuống, sừng ngắn thô, bờm + vây má bằng lửa; y: sừng -21 … cằm +20 ----
// lite = true (đầu nhỏ trên avatar): bỏ bờm/râu/vây má để gọn dung lượng.
const SKULL = 'M0 -12.6C4 -13.4 9 -12.6 12.6 -9.4L16.8 -3.6C18.8 0.2 19.2 4.4 18 8.6L15.8 13.4C13.4 17 9.4 19.2 5 20.2C3.4 20.5 1.6 20.5 0 20.5C-1.6 20.5 -3.4 20.5 -5 20.2C-9.4 19.2 -13.4 17 -15.8 13.4L-18 8.6C-19.2 4.4 -18.8 0.2 -16.8 -3.6L-12.6 -9.4C-9 -12.6 -4 -13.4 0 -12.6Z';
const HORN_R = 'M6.2 -9.4C6.4 -15.2 10.4 -19.8 17.2 -21.6C15.6 -17.8 15.2 -14.6 14.2 -9.6Z';

// nửa PHẢI (x ≥ 0) của phần phụ: bờm, sừng, vây, mày, mắt, răng… (không có nét viền chạm trục x=0 để ghép gương không lộ đường nối)
const headHalf = (T, P, h, lite) => {
  const { polar } = h;
  const o = sc(T, 0.6);
  let mane = '';
  const manes = lite ? [[56, 10, 3], [98, 8.4, 2.6]] : [[34, 14, 3.6], [58, 16, 4], [84, 15, 3.8], [108, 13, 3.4], [132, 10, 2.8]];
  manes.forEach(([a, len, w]) => { const [x, y] = polar(10.5, a); mane += flame(T, P, x, y, a, len, w); });
  const horn = `<path d="${HORN_R}" fill="url(#${P}h)" ${o}/>`
    + `<path d="M8.4 -12.6L12.4 -13.4M9.2 -15.6L13.6 -16.2M10.8 -18.4L14.6 -18.6" stroke="${T.dark}" stroke-opacity="0.6" stroke-width="0.55" fill="none" stroke-linecap="round"/>`
    + `<path d="M7.6 -10.6C8.6 -15.2 11.8 -18.4 16.2 -20.2" stroke="${T.light}" stroke-opacity="0.9" stroke-width="0.6" fill="none" stroke-linecap="round"/>`
    + `<path d="M14.4 -8.6C16.6 -11.6 19.4 -12.8 22.4 -12.6C21.2 -10.4 20.6 -8.6 20.4 -6.4Z" fill="url(#${P}h)" ${o}/>`;
  const fin = lite ? '' : flame(T, P, 17.6, -1.2, 96, 11, 3.2) + flame(T, P, 17.4, 4.6, 118, 8, 2.6);
  const whisk = lite ? '' : kit.whisker(T, [[16.4, 9], [22, 10.2], [24, 14.6], [28, 13.8]], 1.1, { r: 1.5, fill: T.accent });
  const jaw = `<path d="M16.2 8.4L22.6 11.4L17 13.4Z" fill="url(#${P}h)" ${o}/><path d="M14.6 13.2L19.4 17.4L13 16.6Z" fill="url(#${P}h)" ${o}/>`;
  const crownFin = `<path d="M2.6 -11.8C4.4 -15.6 7.6 -17.4 10.8 -17.2C9 -15 8.4 -13.2 8.2 -11.4Z" fill="url(#${P}f)" ${o}/>`;
  // sau khi vẽ sọ: lớp trên mặt
  const face = `<path d="M0 -0.4C2.6 -0.2 5.2 1.4 6.2 4.4L7 10L0 10.2Z" fill="${T.light}" fill-opacity="0.26"/>`
    + `<path d="M2.4 8.8C3.2 7.2 5.8 7 6.8 8.4C5.8 9.6 3.6 9.8 2.4 8.8Z" fill="${T.void}" fill-opacity="0.9"/>`
    + `<path d="M1.6 4.2C3.2 2.8 5.6 3.2 6.6 5M0.8 1.2L3.2 2.4M3.4 -1L5.4 0.4" stroke="${T.light}" stroke-opacity="0.7" stroke-width="0.55" fill="none" stroke-linecap="round"/>`
    + `<path d="M3.2 -10.4C6 -10.8 8.4 -9.8 9.6 -8M1.4 -7.6C4 -7.8 6 -7 7 -5.4" stroke="${T.dark}" stroke-opacity="0.55" stroke-width="0.55" fill="none" stroke-linecap="round"/>`
    + `<path d="M0.6 -11.2C5.2 -11.6 10 -9.6 13 -6.4" stroke="${T.light}" stroke-opacity="0.9" stroke-width="0.75" fill="none" stroke-linecap="round"/>`
    + `<path d="M16 0.4C17.2 -1.4 18.2 -1.2 18 0.6M14.6 4.4C15.8 2.8 16.8 3.2 16.6 5" stroke="${T.dark}" stroke-opacity="0.5" stroke-width="0.5" fill="none"/>`;
  const brow = `<path d="M2 -4L15.6 -10.2L18 -6.4L11.4 -4.2L4.2 -0.8Z" fill="${T.dark}" stroke="${T.dark}" stroke-width="0.4" stroke-linejoin="round"/><path d="M3.4 -4L14.6 -9.2" stroke="${T.light}" stroke-opacity="0.65" stroke-width="0.5"/>`;
  const eye = `<circle cx="9.6" cy="-1.6" r="4.6" fill="url(#${P}o)"/><path d="M4.4 -1.2C6.4 -4.6 12.2 -5 15 -2.8C12.4 0.8 6.8 1.4 4.4 -1.2Z" fill="url(#${P}e)" stroke="${T.dark}" stroke-width="0.55" stroke-linejoin="round"/><ellipse cx="9.8" cy="-1.9" rx="0.8" ry="2" transform="rotate(-22 9.8 -1.9)" fill="#1A0600"/><circle cx="8.3" cy="-2.9" r="0.7" fill="#fff"/>`;
  const teeth = `<path d="M3.6 12.3L5 16.2L6.4 12.5ZM8.6 12L9.8 15L11.4 11.6Z" fill="#FFFBEA" stroke="${T.dark}" stroke-width="0.35" stroke-linejoin="round"/><path d="M5.2 17.4L6.4 14.6L7.8 17Z" fill="#FFFBEA" stroke="${T.dark}" stroke-width="0.35" stroke-linejoin="round"/>`;
  return { back: `${mane}${whisk}${fin}${horn}${crownFin}${jaw}`, front: `${face}${brow}${eye}${teeth}` };
};

const head = (T, P, h, lite = false) => {
  const { back, front } = headHalf(T, P, h, lite);
  const o = sc(T, 0.6);
  const crown = flame(T, P, 0, -11.6, 0, 11, 2.8) + flame(T, P, 0, -2.4, 0, 5.4, 1.6);
  // sọ liền một khối (không đường nối giữa) → khoang miệng → hàm dưới
  const skull = `<path d="${SKULL}" fill="url(#${P}b)" ${o}/>`;
  const mouth = `<path d="M-15 10.6C-10.6 12 -5 12.4 0 12.4C5 12.4 10.6 12 15 10.6C13.4 14.4 7.6 16.8 0 16.8C-7.6 16.8 -13.4 14.4 -15 10.6Z" fill="url(#${P}m)"/>`
    + `<path d="M-15.6 11.6C-12 16.4 -6 19.6 0 19.8C6 19.6 12 16.4 15.6 11.6C12 15 6 16.8 0 16.8C-6 16.8 -12 15 -15.6 11.6Z" fill="url(#${P}b)"/>`
    + `<path d="M-15 10.6C-10.6 12 -5 12.4 0 12.4C5 12.4 10.6 12 15 10.6" stroke="${T.dark}" stroke-width="0.8" fill="none" stroke-linecap="round"/>`;
  // nửa phải dựng 1 lần trong defs, nửa trái là <use> lật gương
  return `<defs><clipPath id="${P}c"><path d="${SKULL}"/></clipPath><g id="${P}hb">${back}</g><g id="${P}hf"><g clip-path="url(#${P}c)">${front}</g></g></defs>`
    + `<use href="#${P}hb"/><use href="#${P}hb" transform="scale(-1 1)"/>${skull}${mouth}<use href="#${P}hf"/><use href="#${P}hf" transform="scale(-1 1)"/>${crown}`;
};

// emblem: đầu rồng độc lập, tâm (0,0), bán kính ≈ 20 — dùng cho avatar + Cửu Long Chí Tôn
const emblem = (T, P, h) => defs(T, P) + head(T, P, h);
// emblemGhost: cùng hình dạng, bóng mờ nét đứt (rồng chưa sở hữu) + chấm lửa mờ
const emblemGhost = (T, P, h) => {
  const hornL = 'M-6.2 -9.4C-6.4 -15.2 -10.4 -19.8 -17.2 -21.6C-15.6 -17.8 -15.2 -14.6 -14.2 -9.6Z';
  const crown = 'M-2.6 -11.8C-3 -16 -1.2 -19 0 -22.4C1.2 -19 3 -16 2.6 -11.8Z';
  return kit.ghost(`${SKULL}${HORN_R}${hornL}${crown}`, 0.3) + kit.ghostDot(0, -1, T.accent);
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

const HEAD_A = 315; // đầu ngồi ở góc trên-trái, mặt hướng vào ảnh (nhìn xuống như trấn nóc điện)
const TAIL_A = 290; // đuôi kết sát đầu, hoá thành ngọn lửa

// KHUNG AVATAR (tự dựng, không qua bonusKit.build để vành là than đen — rồng lửa mới nổi). Vẽ cho R=70 rồi scale(R/70).
// Mọi nét r ∈ [64, 84]. Vảy/vây/ngói là <use> của 1 hình mẫu để gọn dung lượng.
const avatarFrame = (T, R = 70, h) => {
  const { polar, dot, star4, gem, pearl } = h;
  const P = 'shop_cl_xivan-avatar-';
  const k = Number((R / 70).toFixed(4));
  const RB = 73.6; // bán kính đường tâm thân rồng
  const A0 = HEAD_A + 4;
  const A1 = TAIL_A + 360;
  const prof = (t) => 1.4 + 6 * Math.pow(1 - t, 0.85) + 1.4 * Math.exp(-Math.pow((t - 0.08) / 0.06, 2));
  const tOf = (a) => (a - A0) / (A1 - A0);
  const ctrl = arcCtrl(RB, A0, A1);
  const extra = `<radialGradient id="${P}r" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="82"><stop offset="0.84" stop-color="${T.dark}"/><stop offset="0.9" stop-color="${T.main}"/><stop offset="0.95" stop-color="${T.ember}"/><stop offset="0.98" stop-color="${T.light}"/></radialGradient>`
    + `<radialGradient id="${P}q" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="80"><stop offset="0.86" stop-color="#4A1204"/><stop offset="0.92" stop-color="#1E0600"/><stop offset="0.97" stop-color="#4A1204"/></radialGradient>`
    + `<path id="${P}s" d="M-1.5 0.7Q0 -1.5 1.5 0.7" fill="none" stroke="${T.dark}" stroke-opacity="0.8" stroke-width="0.6" stroke-linecap="round"/>`
    + `<path id="${P}n" d="M-2.2 0C-2 -3 -0.6 -5 1 -6.6C0.8 -4.2 2 -2.4 2.2 0Z" fill="url(#${P}f)" stroke="${T.dark}" stroke-width="0.4" stroke-linejoin="round"/>`
    + `<path id="${P}k" d="M-3.4 0.2Q0 -5.4 3.4 0.2Z" fill="url(#${P}t)" fill-opacity="0.9" stroke="${T.dark}" stroke-width="0.5" stroke-linejoin="round"/>`;
  // vành than đen + 2 viền sáng
  const ring = `<path fill-rule="evenodd" fill="url(#${P}q)" d="M-77.6 0A77.6 77.6 0 1 0 77.6 0A77.6 77.6 0 1 0 -77.6 0ZM-70 0A70 70 0 1 0 70 0A70 70 0 1 0 -70 0Z"/>`
    + `<circle r="70.4" fill="none" stroke="${T.accent}" stroke-opacity="0.6" stroke-width="0.8"/><circle r="77.2" fill="none" stroke="${T.main}" stroke-opacity="0.9" stroke-width="0.9"/><circle r="78.5" fill="none" stroke="${T.light}" stroke-opacity="0.5" stroke-width="0.5"/>`;
  // ngói âm dương quanh mép trong (mỗi 15°)
  let tiles = '';
  for (let a = 0; a < 360; a += 15) { const [x, y] = polar(67.6, a); tiles += `<use href="#${P}k" transform="translate(${x} ${y}) rotate(${a + 180})"/>`; }
  // thân rồng: gradient hướng tâm (trong tối → ngoài sáng) + vệt sáng sống lưng + vảy
  let scl = '';
  for (let a = A0 + 6; a < A1 - 8; a += 20) {
    const w = prof(tOf(a));
    const [x, y] = polar(RB + (Math.round((a - A0) / 20) % 2 ? 1 : -1) * w * 0.2, a);
    scl += `<use href="#${P}s" transform="translate(${x} ${y}) rotate(${n(a + 90)}) scale(${n(0.6 + w * 0.2)})"/>`;
  }
  let fins = '';
  for (let a = A0 + 4; a < A1 - 16; a += 24) {
    const t = tOf(a);
    const [x, y] = polar(RB + prof(t) * 0.3, a);
    fins += `<use href="#${P}n" transform="translate(${x} ${y}) rotate(${n(a + 12)}) scale(${n(0.7 + 0.5 * (1 - t))})"/>`;
  }
  const body = `<path d="${kit.taperPath(ctrl, 0, 0, 8, prof)}" fill="url(#${P}r)" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/>`
    + `<path d="${kit.spine(arcCtrl(RB + 1.4, A0 + 6, A1 - 40))}" fill="none" stroke="${T.light}" stroke-opacity="0.7" stroke-width="0.6" stroke-linecap="round"/>${scl}`;
  // hai vuốt bám vành cạnh đầu, mũi vuốt hướng vào tâm
  const claws = [HEAD_A - 22, HEAD_A + 30].map((a) => { const [x, y] = polar(75.6, a); return kit.claw(T, P, x, y, a + 180, 0.7); }).join('');
  // đuôi vẫy thành ngọn lửa: 3 ngọn xoè ở mút đuôi
  const [tx, ty] = polar(RB, TAIL_A);
  const tail = flame(T, P, tx, ty, TAIL_A + 86, 17, 4.4) + flame(T, P, tx, ty, TAIL_A + 56, 11.5, 3.4) + flame(T, P, tx, ty, TAIL_A + 114, 10, 3);
  // đinh ngọc lửa + ngọc trai quanh vành ngoài (chừa chỗ đầu + đuôi)
  let studs = '';
  for (let a = 15; a < 360; a += 30) {
    if (a > 280 && a < 360) continue;
    const [x, y] = polar(79.4, a);
    studs += (a - 15) % 60 === 0 ? gem(x, y, 3.1, T.ruby, T, a) : pearl(x, y, 1.6, T);
  }
  let embers = '';
  [[40, 80.6], [100, 81], [160, 80.6], [220, 81], [262, 80.8], [352, 81.2]].forEach(([a, r], i) => { const [x, y] = polar(r, a); embers += i % 2 ? star4(x, y, 1.6, T.accent, 0.95) : dot(x, y, 0.9, T.ember, 0.95); });
  // đầu Xi Vẫn (bản gọn) + quầng lửa; hướng LÊN của đầu = hướng ra ngoài vành
  const [hx, hy] = polar(73.5, HEAD_A);
  const headG = `<g transform="translate(${hx} ${hy}) rotate(${HEAD_A})"><circle r="13" fill="url(#${P}o)"/><g transform="scale(0.45)">${head(T, P, h, true)}</g></g>`;
  return `${defs(T, P).replace('</defs>', `${extra}</defs>`)}<g transform="scale(${k})">${ring}${tiles}${fins}${body}${claws}${tail}${studs}${embers}${headG}</g>`;
};

// điểm nhấn góc (28×28 nhô ra ngoài, lên-trái): đuôi mái cong vút + 3 ngọn lửa + tàn lửa
const accent = (T, P, h) => {
  const { gem, star4, dot } = h;
  const eave = 'M2 2C-6 0 -13 -2 -17 -9C-20 -14 -17 -20 -12 -20C-15 -16 -13 -13 -9 -13';
  const roof = `<path d="${eave}" fill="none" stroke="${T.dark}" stroke-width="4.6" stroke-linecap="round" opacity="0.6"/><path d="${eave}" fill="none" stroke="url(#${P}t)" stroke-width="3.2" stroke-linecap="round"/><path d="${eave}" fill="none" stroke="${T.light}" stroke-opacity="0.7" stroke-width="0.6" stroke-linecap="round" transform="translate(0 -0.6)"/>`
    + `<path d="M-2 -1.6L-6.2 -2.4M-7.4 -4.6L-11 -6M-11.2 -8.6L-14.2 -10.6" stroke="${T.dark}" stroke-opacity="0.65" stroke-width="0.6" fill="none"/>`;
  const fires = flame(T, P, -4, -4, -50, 25, 6.2) + flame(T, P, -4, -4, -16, 18, 4.6) + flame(T, P, -4, -4, -84, 16, 4.2);
  return `${defs(T, P)}${roof}${fires}${gem(-3, -3, 3.4, T.ruby, T)}${star4(-23, -3, 2.2, T.accent, 0.95)}${star4(-6, -24, 2, T.accent, 0.95)}${dot(-25, -13, 1, T.ember)}${dot(-14, -25, 1, T.ember)}`;
};

// ================= Task 4-B: corner / edge / side / bottom =================
// Id gradient/lửa (`<P>b/v/o/f/e/m/h/t/fl`) do defs(T,P) tạo; corner mang defs (khai trong <defs> của border), edge/side/bottom dùng lại cùng tiền tố hoặc tự mang defs.

// 1 ngón vuốt nằm dọc cạnh trên (từ góc chạy theo +x): thân thon có vảy + vuốt móc cong xuống (+y)
const finger = (T, P) => {
  const body = `<path d="M9 2.8C20 1.8 32 2.8 41.4 5.2L41.4 9.4C32 10.8 20 11.4 9 10.8Z" fill="url(#${P}b)" ${sc(T, 0.7)}/>`;
  let scales = '';
  for (let i = 0; i < 5; i += 1) { const x = 14 + i * 5.6; scales += `M${n(x)} 3.6Q${n(x + 2.8)} 6.8 ${n(x)} 10`; }
  const lines = `<path d="${scales}" fill="none" stroke="${T.dark}" stroke-opacity="0.55" stroke-width="0.6"/><path d="M10 4.4C22 3.4 32 4 40 5.8" fill="none" stroke="${T.light}" stroke-opacity="0.8" stroke-width="0.6"/>`;
  const talon = `<path d="M39.6 4.8C45.6 5.4 47.6 10.4 45 17C44.6 13 42.4 10.8 39.8 10Z" fill="${T.light}" ${sc(T, 0.6)}/><path d="M41.2 6.2C44.2 7.4 45 10.6 44.4 13" fill="none" stroke="#fff" stroke-opacity="0.75" stroke-width="0.6"/>`;
  const talon2 = `<path d="M29.6 9.6C34.4 10.8 35.6 14.6 33.6 19.6C33.6 16.4 31.6 14.4 29.4 13.6Z" fill="${T.light}" ${sc(T, 0.5)}/>`;
  return `${body}${lines}${talon2}${talon}`;
};

// góc 44×44 (gốc ở đỉnh góc, trải sang +x +y): hai ngón vuốt quắp hai cạnh (ngón thứ hai lật gương qua đường chéo) + ngọc hoả + lửa chiếu vào trong
const corner = (T, P, h) => {
  const { gem, star4, dot } = h;
  const arms = `<g transform="scale(0.93 1)">${finger(T, P)}</g><g transform="matrix(0 0.93 1 0 0 0)">${finger(T, P)}</g>`;
  const fires = flame(T, P, 8, 8, 135, 22, 6.4) + flame(T, P, 8, 8, 108, 15, 4.2) + flame(T, P, 8, 8, 162, 15, 4.2);
  // bonusKit đã dùng id `<P>e` cho nhóm cạnh trong border → đổi tên gradient mắt (không dùng ở góc) để không trùng id
  const dfs = defs(T, P).replace(`id="${P}e"`, `id="${P}ey"`);
  return `${dfs}${arms}<circle cx="8" cy="8" r="9" fill="url(#${P}o)"/>${fires}${gem(8, 8, 5, T.ruby, T)}${star4(24, 24, 2, T.accent, 0.9)}${dot(30, 15, 0.9, T.ember, 0.9)}${dot(15, 30, 0.9, T.ember, 0.9)}`;
};

// đơn vị cạnh 44 (tâm x=0, chạy dọc cạnh trên, +y = vào trong, ≤ 22px): 1 viên ngói âm dương + ngọn lửa nhỏ ở mối nối bên phải
const edge = (T, P, h) => {
  const tile = 'M-17 8.6C-17 17 -9 21.6 0 21.6C9 21.6 17 17 17 8.6Z';
  const arcs = 'M-11 9.6C-11 14.6 -6 18 0 18.4M11 9.6C11 14.6 6 18 0 18.4M0 9.6V18';
  return `<path d="${tile}" fill="url(#${P}t)" ${sc(T, 0.7)}/><path d="${arcs}" fill="none" stroke="${T.dark}" stroke-opacity="0.55" stroke-width="0.6"/>`
    + `<path d="M-14 10.4C-14 14 -11 16.6 -7.6 18" fill="none" stroke="${T.light}" stroke-opacity="0.75" stroke-width="0.7"/>`
    + `${flame(T, P, 22, 8, 0, 9, 3.4)}${h.dot(0, 13.6, 1, T.accent, 0.9)}`;
};

// cạnh bên (cao 100, ±15 quanh x=0, nối khớp y=0/100): 4 mảnh vảy thoi dọc xương sống + 2 ngọn lửa (ra ngoài / vào trong) + ngọc hoả giữa
const side = (T, P, h) => {
  const { gem, star4, dot } = h;
  let plates = '';
  [13, 37, 63, 87].forEach((y) => {
    plates += `<path d="M0 ${y - 10}L7.6 ${y}L0 ${y + 10}L-7.6 ${y}Z" fill="url(#${P}b)" ${sc(T, 0.7)}/><path d="M0 ${y - 7}L4.6 ${y}L0 ${y + 7}L-4.6 ${y}Z" fill="none" stroke="${T.light}" stroke-opacity="0.6" stroke-width="0.6"/><path d="M0 ${y - 10}L7.6 ${y}L0 ${y}Z" fill="#fff" fill-opacity="0.2"/>`;
  });
  const fires = flame(T, P, 0, 25, -90, 14, 7) + flame(T, P, 0, 75, 90, 14, 7) + flame(T, P, 0, 25, 90, 8, 4) + flame(T, P, 0, 75, -90, 8, 4);
  return `${defs(T, P)}${plates}${fires}<circle cx="0" cy="50" r="9" fill="url(#${P}o)"/>${gem(0, 50, 4.2, T.ruby, T)}${star4(-9, 50, 1.8, T.accent, 0.9)}${star4(9, 50, 1.8, T.accent, 0.9)}${dot(-5, 3, 0.8, T.ember, 0.9)}${dot(5, 97, 0.8, T.ember, 0.9)}`;
};

// chân thẻ (gốc giữa mép dưới, cục bộ y ∈ [-4,12], nửa rộng ≤ 70, đối xứng): mái ngói cong vút hai bên + ngói treo + lửa ở đầu mái + ngọc hoả chính giữa
const bottom = (T, P, h) => {
  const { gem, star4, dot } = h;
  const eave = 'M6 5.6C22 6.6 38 9 52 6.4C58 5 62 3 65.2 0.6';
  const half = () => {
    let drops = '';
    for (let i = 0; i < 5; i += 1) { const x = 12 + i * 8.4; const y = 7.4 + (x > 40 ? -(x - 40) * 0.2 : 0); drops += `M${n(x)} ${n(y)}Q${n(x + 3.2)} ${n(y + 5)} ${n(x + 6.4)} ${n(y)}`; }
    return `<path d="${eave}" fill="none" stroke="${T.dark}" stroke-width="5.4" stroke-linecap="round" opacity="0.6"/><path d="${eave}" fill="none" stroke="url(#${P}t)" stroke-width="3.8" stroke-linecap="round"/><path d="${eave}" fill="none" stroke="${T.light}" stroke-opacity="0.75" stroke-width="0.7" stroke-linecap="round" transform="translate(0 -1)"/>`
      + `<path d="${drops}" fill="none" stroke="${T.ember}" stroke-opacity="0.9" stroke-width="1.1" stroke-linecap="round"/>`
      + `${flame(T, P, 60.4, 2.6, 14, 6.6, 3.2)}${flame(T, P, 53, 4.6, -4, 7, 2.8)}${flame(T, P, 22, 5, 0, 5, 2.2)}${star4(38, 1.2, 1.5, T.accent, 0.95)}${dot(46, 11, 0.8, T.ember, 0.9)}`;
  };
  const centre = flame(T, P, 0, 5.4, 0, 9, 5) + flame(T, P, -3.4, 5.6, -30, 7, 3.2) + flame(T, P, 3.4, 5.6, 30, 7, 3.2) + `<circle cx="0" cy="5.4" r="7" fill="url(#${P}o)"/>` + gem(0, 6.2, 3.8, T.ruby, T);
  return `${defs(T, P)}${half()}<g transform="scale(-1 1)">${half()}</g>${centre}`;
};

// ================= Task 4-C: crest =================
// Đỉnh thẻ (x −80..80, chân y=36): Xi Vẫn ngồi trấn nóc điện — mái ngói cong vút làm bệ, thân + 2 vuốt trước bám sống mái, đầu lớn nhìn xuống, vây lửa xoè sau lưng, đuôi hoá lửa hai bên.
const crest = (T, P, h) => {
  const { gem, star4, dot } = h;
  const sym = (f) => `${f}<g transform="scale(-1 1)">${f}</g>`;
  // quầng + quạt lửa sau lưng
  let fan = `<circle cx="0" cy="-4" r="40" fill="url(#${P}o)"/>`;
  [[-72, 36], [-52, 46], [-32, 52], [32, 52], [52, 46], [72, 36]].forEach(([a, L]) => { fan += flame(T, P, 0, 14, a, L, 10); });
  fan += flame(T, P, 0, 14, 0, 54, 12);
  // đuôi hoá lửa hai bên mái
  // đuôi (vẽ lại 2026-11-04): thân đuôi thon uốn chữ S rồi cuộn móc lên, có vảy + gai lửa dọc sống, chóp đuôi bốc lửa (trước đây là một nét thẳng)
  const tc = [[-20, 26], [-34, 12], [-48, 23], [-58, 16], [-70, 9], [-77, -3], [-66, -7]];
  const tailBody = `<path d="${kit.taperPath(tc, 9, 2.2, 12)}" fill="url(#${P}t)" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/><path d="${kit.spine(tc)}" fill="none" stroke="${T.light}" stroke-opacity="0.65" stroke-width="0.8" stroke-linecap="round" transform="translate(0 -1.4)"/>`;
  let tailScales = '';
  kit.sample(tc, 10).filter((_, i) => i % 3 === 1 && i < 17).forEach((q) => { tailScales += `M${n(q.x - q.nx * 2.4)} ${n(q.y - q.ny * 2.4)}Q${n(q.x + q.ny * 1.6)} ${n(q.y - q.nx * 1.6)} ${n(q.x + q.nx * 2.4)} ${n(q.y + q.ny * 2.4)}`; });
  const tailSide = `${tailBody}<path d="${tailScales}" fill="none" stroke="${T.dark}" stroke-opacity="0.55" stroke-width="0.6" stroke-linecap="round"/>${flame(T, P, -40, 15, -8, 11, 4)}${flame(T, P, -54, 19, -4, 9, 3.4)}${flame(T, P, -66, -7, 62, 17, 6)}${flame(T, P, -66, -7, 20, 10, 4)}${star4(-72, -12, 1.9, T.accent, 0.95)}${dot(-60, 4, 1, T.ember)}`;
  // thân + vai
  const body = `<path d="M-24 30C-26 16 -20 6 -12 2L12 2C20 6 26 16 24 30Z" fill="url(#${P}b)" ${sc(T, 0.8)}/>`;
  let scales = '';
  for (let r = 0; r < 3; r += 1) for (let c = -2; c <= 2; c += 1) { const x = c * 8 + (r % 2 ? 4 : 0); if (Math.abs(x) < 22) scales += `M${x - 3.4} ${12 + r * 6}Q${x} ${16 + r * 6} ${x + 3.4} ${12 + r * 6}`; }
  const detail = `<path d="${scales}" fill="none" stroke="${T.dark}" stroke-opacity="0.55" stroke-width="0.7"/><path d="M-14 6C-18 14 -18 22 -17 28" fill="none" stroke="${T.light}" stroke-opacity="0.7" stroke-width="0.8"/>`;
  // mái ngói làm bệ (chân chạm y=36)
  const ridge = 'M-80 20C-70 30 -40 32 0 32C40 32 70 30 80 20';
  let tiles = '';
  for (let i = -7; i <= 7; i += 1) { const x = i * 10; const y = 33 + Math.min(0, (Math.abs(x) - 50) * 0.1); tiles += `M${x - 4.4} ${y}Q${x} ${y + 5} ${x + 4.4} ${y}`; }
  const roof = `<path d="M-80 18C-70 30 -40 32 0 32C40 32 70 30 80 18L80 24C70 35 40 36 0 36C-40 36 -70 35 -80 24Z" fill="url(#${P}t)" ${sc(T, 0.9)}/><path d="${ridge}" fill="none" stroke="${T.light}" stroke-opacity="0.8" stroke-width="1" transform="translate(0 -0.4)"/><path d="${tiles}" fill="none" stroke="${T.dark}" stroke-opacity="0.6" stroke-width="0.7"/>`
    + `<path d="M-79 18C-80.6 12 -77.4 8.4 -72 8.4C-75 11 -74 14 -70 16" fill="none" stroke="${T.ember}" stroke-width="2.2" stroke-linecap="round"/><path d="M79 18C80.6 12 77.4 8.4 72 8.4C75 11 74 14 70 16" fill="none" stroke="${T.ember}" stroke-width="2.2" stroke-linecap="round"/>`;
  // 2 vuốt trước bám sống mái (hướng xuống)
  const claws = sym(`<g transform="translate(-17 26) rotate(180) scale(1.1)"><ellipse cx="0" cy="1.2" rx="4.6" ry="2.6" fill="url(#${P}b)" ${sc(T, 0.5)}/><path d="M-2.4 0Q-4 -4 -3 -8M0 0Q0 -4.4 0 -8.6M2.4 0Q4 -4 3 -8" fill="none" stroke="${T.light}" stroke-width="1.6" stroke-linecap="round"/></g>`);
  const headG = `<g transform="translate(0 -3) scale(1.2)">${head(T, P, h)}</g>`;
  return `${defs(T, P)}${fan}${tailSide.replace(/^/, '')}<g transform="scale(-1 1)">${tailSide}</g>${body}${detail}${roof}${claws}${headG}${gem(0, 31, 3.6, T.ruby, T)}${star4(-74, 0, 1.8, T.accent, 0.9)}${star4(74, 0, 1.8, T.accent, 0.9)}`;
};

module.exports = { avatarFrame, accent, crest, corner, edge, side, bottom, emblem, emblemGhost, head, flame, defs, arcCtrl };
