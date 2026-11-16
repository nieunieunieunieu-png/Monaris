// ===== hoso/frame/shop_cl_thaotiet/motif.js — Thao Thiết Thôn Thiên: rồng tham ăn, miệng khổng lồ nuốt trăng khuyết, nanh dài, sừng xoắn, ngọc tinh tú =====
// Task 8-A: avatar + accent + emblem/emblemGhost (đầu rồng độc lập, tâm (0,0), bán kính ≈ 20, hướng LÊN = hướng mọc sừng).
// Task 8-B + 8-C: corner / edge / side / bottom / crest (cuối file). Id trăng `<P>mn` (KHÔNG dùng `<P>g/e/k` vì bonusKit chiếm).
// Hình học (giữ hợp đồng): avatar mọi nét r ≤ 84, điểm nhấn lấn vào trong r ≥ 64; accent trong ô 28×28 nhô ra ngoài (lên-trái).
const kit = require('../../dragonKit');

const n = kit.n;
const sc = (T, w = 0.6) => `stroke="${T.dark}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

// gradient dùng chung (id theo tiền tố P của phần gọi): b/v/o của dragonKit + f (dải tinh vân) + e (tròng mắt) + m (khoang miệng) + h (sừng) + g (trăng) + w (hình mẫu dải sao)
const defs = (T, P) => kit.dragonDefs(T, P).replace('</defs>', ''
  + `<linearGradient id="${P}f" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${T.dark}"/><stop offset="0.4" stop-color="${T.main}"/><stop offset="0.8" stop-color="${T.nebula}"/><stop offset="1" stop-color="${T.accent}"/></linearGradient>`
  + `<radialGradient id="${P}e" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#F4EEFF"/><stop offset="0.45" stop-color="${T.nebula}"/><stop offset="1" stop-color="${T.main}"/></radialGradient>`
  + `<linearGradient id="${P}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.void}"/><stop offset="0.7" stop-color="${T.mouth}"/><stop offset="1" stop-color="${T.tongue}"/></linearGradient>`
  + `<linearGradient id="${P}h" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${T.dark}"/><stop offset="0.5" stop-color="${T.main}"/><stop offset="1" stop-color="${T.horn}"/></linearGradient>`
  + `<linearGradient id="${P}mn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.6" stop-color="${T.moon}"/><stop offset="1" stop-color="${T.accent}"/></linearGradient>`
  + `<g id="${P}w">${wispShape(T, P)}</g>`
  + '</defs>');

// dải sao (tinh vân) cong thon: hình mẫu dài 10, rộng 3, cong chữ S nhẹ; mỗi dải là 1 <use>
const wispD = (L, W) => `M0 0C${n(-W)} ${n(-L * 0.2)} ${n(-W * 0.9)} ${n(-L * 0.5)} ${n(-W * 0.1)} ${n(-L * 0.74)}C${n(W * 0.3)} ${n(-L * 0.86)} ${n(W * 0.1)} ${n(-L * 0.95)} ${n(W * 0.6)} ${n(-L)}C${n(W * 0.7)} ${n(-L * 0.7)} ${n(W * 1.1)} ${n(-L * 0.38)} 0 0Z`;
function wispShape(T, P) {
  return `<path d="${wispD(10, 3)}" fill="url(#${P}f)" stroke="${T.dark}" stroke-width="0.4" stroke-linejoin="round"/>`
    + `<path d="${wispD(7, 1.6)}" fill="${T.light}" fill-opacity="0.5"/>`;
}
// gốc (x,y), hướng a (độ, 0 = lên, chiều kim đồng hồ), dài len, rộng w; flip = -1 lật gương
const wisp = (T, P, x, y, a, len, w, flip = 1) => `<use href="#${P}w" transform="translate(${n(x)} ${n(y)}) rotate(${n(a)}) scale(${n((w / 3) * flip)} ${n(len / 10)})"/>`;

// ---- đầu rồng: sọ rộng, trán có ngọc, mắt tím đồng tử ngôi sao, MIỆNG KHỔNG LỒ há nuốt trăng, 2 hàng nanh, sừng xoắn lớn; y: sừng -25 … cằm +22 ----
// lite = true (đầu nhỏ trên avatar): bỏ bờm sao/râu để gọn dung lượng.
const SKULL = 'M0 -12.4C5 -12.8 11 -11.6 15 -7.6L19 -1.6C20.6 1.4 20.4 4.8 18.8 7.4L14.4 9.6C9.4 8.4 4.6 7.8 0 7.8C-4.6 7.8 -9.4 8.4 -14.4 9.6L-18.8 7.4C-20.4 4.8 -20.6 1.4 -19 -1.6L-15 -7.6C-11 -11.6 -5 -12.8 0 -12.4Z';
const HORN_R = 'M5.4 -10.6C5.6 -16.4 9.6 -21 16.4 -23.6C22 -25.6 26.6 -24.4 28.2 -21.6C24.6 -22.2 21.6 -20.4 19.6 -17.4C17.6 -14.4 16.6 -11.8 14.8 -9.4Z';
const HORN_R2 = 'M14.8 -8.6C17.8 -11.6 22 -12.4 25.4 -10.4C22.8 -9.4 21.2 -8 20.6 -5.6Z';
const MOUTH = 'M-16.4 8.8C-10 7.4 -4.8 7.2 0 7.2C4.8 7.2 10 7.4 16.4 8.8C15.8 14.4 8.8 18.8 0 18.8C-8.8 18.8 -15.8 14.4 -16.4 8.8Z';
const JAW = 'M-18.6 8.4C-17.4 16.4 -10.2 22.2 0 22.4C10.2 22.2 17.4 16.4 18.6 8.4C15.2 13.8 8.2 17.6 0 17.6C-8.2 17.6 -15.2 13.8 -18.6 8.4Z';
// trăng khuyết (mở sang phải) cao 2s quanh gốc, đỉnh/đáy tại x=1
const moonD = (s) => `M${n(s * 0.17)} ${-s}A${s} ${s} 0 0 0 ${n(s * 0.17)} ${s}A${n(s * 1.43)} ${n(s * 1.43)} 0 0 1 ${n(s * 0.17)} ${-s}Z`;

// nửa PHẢI (x ≥ 0) của phần phụ — nửa trái là <use> lật gương (không nét viền chạm trục x=0 để ghép không lộ đường nối)
const headHalf = (T, P, h, lite) => {
  const { polar, star4 } = h;
  const o = sc(T, 0.6);
  // bờm tinh vân: dải sao toả sau sọ, đầu mút kết sao
  let mane = '';
  const manes = lite ? [[58, 11, 3.2], [98, 9, 2.8]] : [[26, 12, 3.4], [50, 15, 4], [76, 16, 4.2], [102, 14, 3.8], [128, 11, 3.2]];
  manes.forEach(([a, len, w], i) => {
    const x0 = 19 * Math.sin((a * Math.PI) / 180); const y0 = 3 - 13 * Math.cos((a * Math.PI) / 180);
    mane += wisp(T, P, x0, y0, a, len, w);
    if (!lite && i % 2 === 0) { const tip = polar(len + 1.5, a); mane += star4(x0 + tip[0], y0 + tip[1], 1.7, T.accent, 0.95); }
  });
  const horn = `<path d="${HORN_R}" fill="url(#${P}h)" ${o}/>`
    + `<path d="M8 -12.4C11 -13.6 13.4 -12.6 14.4 -10.4M8.8 -15.8C12.4 -17.2 16 -16 17.4 -13.2M11.6 -19.2C15.4 -20.6 19.2 -19.6 20.8 -16.8M15.6 -22C18.6 -22.6 21.6 -21.8 23.2 -19.8" stroke="${T.dark}" stroke-opacity="0.6" stroke-width="0.6" fill="none" stroke-linecap="round"/>`
    + `<path d="M7.4 -11.2C8.6 -16.2 12 -19.8 17.6 -22.4C21.8 -23.8 25 -23.6 26.6 -22.4" stroke="${T.light}" stroke-opacity="0.9" stroke-width="0.6" fill="none" stroke-linecap="round"/>`
    + `<path d="${HORN_R2}" fill="url(#${P}h)" ${o}/>`;
  const fin = lite ? '' : wisp(T, P, 18.4, 0.4, 96, 11, 3.2) + wisp(T, P, 17.8, 6, 118, 8, 2.6);
  const whisk = lite ? '' : kit.whisker(T, [[16.8, 12], [22.4, 13.6], [25.6, 18.4], [29.4, 17.6]], 1.1, { r: 1.5, fill: T.accent });
  // gai gò má (nhô ra khỏi sọ)
  const cheek = `<path d="M17.6 1.6L23.8 4.8L18.6 7.4Z" fill="url(#${P}h)" ${o}/>`;
  // ===== lớp mặt (cắt theo sọ) =====
  const face = `<path d="M0 -4C2.4 -2.6 3.6 0.4 3.2 4.8L0 6Z" fill="${T.light}" fill-opacity="0.24"/>`
    + `<ellipse cx="3.6" cy="5" rx="1.1" ry="0.7" fill="${T.void}" fill-opacity="0.9" transform="rotate(-24 3.6 5)"/>`
    + `<path d="M11 3.4C13 2.4 15 2.6 16.4 3.8M9 6.2C11.4 5.4 13.6 5.6 15.2 6.8" stroke="${T.dark}" stroke-opacity="0.55" stroke-width="0.55" fill="none" stroke-linecap="round"/>`
    + `<path d="M3.4 -10.6C6.2 -11 8.6 -9.8 9.8 -8M1.6 -7.8C4 -8 6.2 -7.2 7.2 -5.6" stroke="${T.dark}" stroke-opacity="0.55" stroke-width="0.55" fill="none" stroke-linecap="round"/>`
    + `<path d="M0.8 -11.4C5.4 -11.8 10.4 -9.6 13.4 -6.4" stroke="${T.light}" stroke-opacity="0.9" stroke-width="0.75" fill="none" stroke-linecap="round"/>`;
  const brow = `<path d="M2.2 -6.6L16.4 -11.4L18.4 -7.2L11.8 -5.6L4.6 -3.8Z" fill="${T.dark}" stroke="${T.dark}" stroke-width="0.4" stroke-linejoin="round"/><path d="M3.6 -6.4L15.4 -10.4" stroke="${T.light}" stroke-opacity="0.65" stroke-width="0.5"/>`;
  const eye = `<circle cx="10.2" cy="-2.6" r="5" fill="url(#${P}o)"/><path d="M4.6 -2.2C6.6 -6 12.8 -6.4 15.8 -3.4C13 0.6 7 1 4.6 -2.2Z" fill="url(#${P}e)" stroke="${T.dark}" stroke-width="0.55" stroke-linejoin="round"/>`
    + `${star4(10.3, -2.8, 2.5, T.accent, 1)}<circle cx="10.3" cy="-2.8" r="0.55" fill="#fff"/><circle cx="7.4" cy="-4.2" r="0.6" fill="#fff"/>`;
  // nanh trên: 1 nanh lớn + 1 nanh phụ + răng nhỏ
  const upFang = `<path d="M8 8.2L12 8.7L10.1 17.4Z" fill="#F7F3FF" stroke="${T.dark}" stroke-width="0.45" stroke-linejoin="round"/><path d="M9.6 9.4L10.4 15" stroke="${T.light}" stroke-width="0.5" stroke-linecap="round" fill="none"/>`
    + `<path d="M13.6 8.9L16.2 9.1L15 12.8Z" fill="#F7F3FF" stroke="${T.dark}" stroke-width="0.4" stroke-linejoin="round"/>`
    + `<path d="M3.2 7.8L6 7.9L4.7 11.8Z" fill="#F7F3FF" stroke="${T.dark}" stroke-width="0.4" stroke-linejoin="round"/>`;
  // nanh dưới (mọc ngược lên từ cằm, xen kẽ nanh trên)
  const lowFang = `<path d="M5 17.6L8.2 17.4L6.2 11.4Z" fill="#F7F3FF" stroke="${T.dark}" stroke-width="0.45" stroke-linejoin="round"/>`
    + `<path d="M12.8 15.8L15.4 14.2L14.6 11.4Z" fill="#F7F3FF" stroke="${T.dark}" stroke-width="0.4" stroke-linejoin="round"/>`;
  return { back: `${mane}${whisk}${fin}${horn}${cheek}`, front: `${face}${brow}${eye}`, upFang, lowFang };
};

const head = (T, P, h, lite = false) => {
  const { star4, gem } = h;
  const { back, front, upFang, lowFang } = headHalf(T, P, h, lite);
  const o = sc(T, 0.6);
  const skull = `<path d="${SKULL}" fill="url(#${P}b)" ${o}/>`;
  // miệng há khổng lồ: khoang tối + hào quang trăng + trăng khuyết đang bị nuốt + sao li ti
  const mouth = `<path d="${MOUTH}" fill="url(#${P}m)"/>`
    + `<circle cx="0" cy="13" r="8" fill="url(#${P}o)"/>`
    + `<path transform="translate(0.4 13)" d="${moonD(4.4)}" fill="url(#${P}mn)" stroke="${T.dark}" stroke-width="0.35" stroke-linejoin="round"/>`
    + `${star4(-9.6, 12.4, 1.2, T.accent, 0.95)}${star4(9, 14.6, 0.9, '#fff', 0.9)}`
    + `<path d="M-16.4 8.8C-10 7.4 -4.8 7.2 0 7.2C4.8 7.2 10 7.4 16.4 8.8" stroke="${T.dark}" stroke-width="0.8" fill="none" stroke-linecap="round"/>`;
  const jaw = `<path d="${JAW}" fill="url(#${P}b)" ${o}/><path d="M-12 16C-8 19.4 -4 20.6 0 20.7" stroke="${T.light}" stroke-opacity="0.6" stroke-width="0.6" fill="none" stroke-linecap="round"/>`
    + `<path d="M-6 21C-2 21.6 2 21.6 6 21" stroke="${T.dark}" stroke-opacity="0.5" stroke-width="0.5" fill="none"/>`;
  // ngọc trán: ngôi sao 4 cánh ngọc xanh + hào quang
  const jewel = `<circle cx="0" cy="-6.2" r="5.2" fill="url(#${P}o)"/>${gem(0, -6.2, 2.9, T.accent, T)}`;
  return `<defs><clipPath id="${P}c"><path d="${SKULL}"/></clipPath><g id="${P}hb">${back}</g><g id="${P}hf"><g clip-path="url(#${P}c)">${front}</g></g><g id="${P}uf">${upFang}</g><g id="${P}lf">${lowFang}</g></defs>`
    + `<use href="#${P}hb"/><use href="#${P}hb" transform="scale(-1 1)"/>${skull}${mouth}${jaw}`
    + `<use href="#${P}lf"/><use href="#${P}lf" transform="scale(-1 1)"/><use href="#${P}uf"/><use href="#${P}uf" transform="scale(-1 1)"/>`
    + `<use href="#${P}hf"/><use href="#${P}hf" transform="scale(-1 1)"/>${jewel}`;
};

// emblem: đầu rồng độc lập, tâm (0,0), bán kính ≈ 20 — dùng cho avatar + Cửu Long Chí Tôn
const emblem = (T, P, h) => defs(T, P) + head(T, P, h);
// emblemGhost: cùng hình dạng, bóng mờ nét đứt (rồng chưa sở hữu) + chấm ngọc mờ
const emblemGhost = (T, P, h) => {
  const hornL = 'M-5.4 -10.6C-5.6 -16.4 -9.6 -21 -16.4 -23.6C-22 -25.6 -26.6 -24.4 -28.2 -21.6C-24.6 -22.2 -21.6 -20.4 -19.6 -17.4C-17.6 -14.4 -16.6 -11.8 -14.8 -9.4Z';
  return kit.ghost(`${SKULL}${HORN_R}${hornL}${JAW}`, 0.3) + kit.ghostDot(0, 0, T.accent);
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

const HEAD_A = 45; // đầu ở góc trên-phải, nghiêng về phía trăng
const TAIL_A = 338; // đuôi kết thành vệt sao, chừa khoảng cho trăng khuyết trước miệng
const MOON_A = 8;

// KHUNG AVATAR (tự dựng, không qua bonusKit.build để vành là hư không tím đen — rồng + trăng mới nổi). Vẽ cho R=70 rồi scale(R/70).
// Mọi nét r ∈ [64, 84]. Vảy/vây là <use> của 1 hình mẫu để gọn dung lượng.
const avatarFrame = (T, R = 70, h) => {
  const { polar, dot, star4, gem, pearl } = h;
  const P = 'shop_cl_thaotiet-avatar-';
  const k = Number((R / 70).toFixed(4));
  const RB = 73.6; // bán kính đường tâm thân rồng
  const A0 = HEAD_A + 5;
  const A1 = TAIL_A + 360;
  // thân to bụng ở giữa (tham ăn), thon dần về đuôi
  const prof = (t) => 1.4 + 7.6 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.12 + t * 0.88)), 0.8) * (1 - 0.35 * t) + 1.2 * Math.exp(-Math.pow((t - 0.05) / 0.05, 2));
  const tOf = (a) => (a - A0) / (A1 - A0);
  const ctrl = arcCtrl(RB, A0, A1);
  const extra = `<radialGradient id="${P}r" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="82"><stop offset="0.84" stop-color="${T.dark}"/><stop offset="0.9" stop-color="${T.main}"/><stop offset="0.95" stop-color="${T.nebula}"/><stop offset="0.98" stop-color="${T.light}"/></radialGradient>`
    + `<radialGradient id="${P}q" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="80"><stop offset="0.86" stop-color="#1B0A55"/><stop offset="0.92" stop-color="${T.void}"/><stop offset="0.97" stop-color="#1B0A55"/></radialGradient>`
    + `<path id="${P}s" d="M-1.5 0.7Q0 -1.5 1.5 0.7" fill="none" stroke="${T.dark}" stroke-opacity="0.8" stroke-width="0.6" stroke-linecap="round"/>`;
  // vành hư không + 2 viền sáng
  const ring = `<path fill-rule="evenodd" fill="url(#${P}q)" d="M-77.6 0A77.6 77.6 0 1 0 77.6 0A77.6 77.6 0 1 0 -77.6 0ZM-70 0A70 70 0 1 0 70 0A70 70 0 1 0 -70 0Z"/>`
    + `<circle r="70.4" fill="none" stroke="${T.accent}" stroke-opacity="0.55" stroke-width="0.8"/><circle r="77.2" fill="none" stroke="${T.main}" stroke-opacity="0.9" stroke-width="0.9"/><circle r="78.5" fill="none" stroke="${T.light}" stroke-opacity="0.5" stroke-width="0.5"/>`;
  // bụi sao li ti trên nền hư không (cố định theo công thức, không ngẫu nhiên)
  let dust = '';
  for (let i = 0; i < 46; i += 1) {
    const a = (i * 47.3) % 360;
    const r = 71 + ((i * 7) % 5) * 1.2;
    const [x, y] = polar(r, a);
    dust += i % 7 === 0 ? star4(x, y, 1.1, T.accent, 0.85) : dot(x, y, 0.32 + (i % 3) * 0.12, '#fff', 0.7);
  }
  // vảy + vây tinh vân dọc lưng + ngọc bụng
  let scl = ''; let fins = ''; let belly = '';
  for (let a = A0 + 8; a < A1 - 10; a += 18) {
    const w = prof(tOf(a));
    const [x, y] = polar(RB + (Math.round((a - A0) / 18) % 2 ? 1 : -1) * w * 0.2, a);
    scl += `<use href="#${P}s" transform="translate(${x} ${y}) rotate(${n(a + 90)}) scale(${n(0.6 + w * 0.2)})"/>`;
  }
  for (let a = A0 + 5; a < A1 - 18; a += 22) {
    const t = tOf(a);
    const [x, y] = polar(RB + prof(t) * 0.42, a);
    fins += wisp(T, P, x, y, a + 12, 4.5 + 3 * (1 - t), 1.8 + 1.2 * (1 - t));
  }
  for (let a = A0 + 26; a < A1 - 60; a += 36) {
    const t = tOf(a);
    const [x, y] = polar(RB - prof(t) * 0.18, a);
    belly += gem(x, y, 1.9 + 1.1 * Math.sin(Math.PI * t), T.accent, T, a);
  }
  const body = `<path d="${kit.taperPath(ctrl, 0, 0, 8, prof)}" fill="url(#${P}r)" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/>`
    + `<path d="${kit.spine(arcCtrl(RB + 1.6, A0 + 8, A1 - 40))}" fill="none" stroke="${T.light}" stroke-opacity="0.7" stroke-width="0.6" stroke-linecap="round"/>${scl}${belly}`;
  // hai vuốt bám vành cạnh đầu, mũi vuốt hướng vào tâm
  const claws = [HEAD_A - 19, HEAD_A + 32].map((a) => { const [x, y] = polar(75.6, a); return kit.claw(T, P, x, y, a + 180, 0.7); }).join('');
  // đuôi hoá vệt sao: 3 dải sao + sao 4 cánh ở mút
  const [tx, ty] = polar(RB, TAIL_A);
  const tail = wisp(T, P, tx, ty, TAIL_A + 88, 13, 3.4) + wisp(T, P, tx, ty, TAIL_A + 62, 9, 2.6) + wisp(T, P, tx, ty, TAIL_A + 114, 8, 2.4)
    + (() => { const [sx, sy] = polar(RB + 1, TAIL_A + 14); return star4(sx, sy, 2.4, T.accent, 0.95); })();
  // trăng khuyết trước miệng rồng (mở về phía đầu) + hào quang
  const [mx, my] = polar(RB, MOON_A);
  const moon = `<g transform="translate(${mx} ${my}) rotate(${MOON_A})"><circle r="11" fill="url(#${P}o)"/><path transform="translate(1 0)" d="${moonD(6.2)}" fill="url(#${P}mn)" stroke="${T.dark}" stroke-width="0.5" stroke-linejoin="round"/></g>`
    + `${star4(...polar(79.6, MOON_A + 9), 1.8, '#fff', 0.95)}${star4(...polar(68.4, MOON_A - 6), 1.4, T.accent, 0.9)}`;
  // đinh ngọc xanh + ngọc trai quanh vành ngoài (chừa chỗ đầu + đuôi + trăng)
  let studs = '';
  for (let a = 15; a < 360; a += 30) {
    if (a > 330 || a < 70) continue;
    const [x, y] = polar(79.4, a);
    studs += (a - 15) % 60 === 0 ? gem(x, y, 3.1, T.accent, T, a) : pearl(x, y, 1.6, T);
  }
  // đầu Thao Thiết (bản gọn) nghiêng về phía trăng + quầng; hướng LÊN của đầu = hướng ra ngoài vành
  const [hx, hy] = polar(72.6, HEAD_A);
  const headG = `<g transform="translate(${hx} ${hy}) rotate(${HEAD_A - 14})"><circle r="14" fill="url(#${P}o)"/><g transform="scale(0.4)">${head(T, P, h, true)}</g></g>`;
  return `${defs(T, P).replace('</defs>', `${extra}</defs>`)}<g transform="scale(${k})">${ring}${dust}${fins}${body}${claws}${tail}${moon}${studs}${headG}</g>`;
};

// điểm nhấn góc (28×28 nhô ra ngoài, lên-trái): trăng khuyết + dải sao tinh vân + ngọc xanh
const accent = (T, P, h) => {
  const { gem, star4, dot } = h;
  const moonG = `<g transform="translate(-15 -14) rotate(-38)"><circle r="12" fill="url(#${P}o)"/><path d="${moonD(8)}" fill="url(#${P}mn)" stroke="${T.dark}" stroke-width="0.6" stroke-linejoin="round"/></g>`;
  const wisps = wisp(T, P, -3, -3, -62, 22, 5.4) + wisp(T, P, -3, -3, -28, 15, 4) + wisp(T, P, -3, -3, -96, 14, 3.6);
  return `${defs(T, P)}${wisps}${moonG}${gem(-3, -3, 3.4, T.accent, T)}${star4(-24, -4, 2.2, T.accent, 0.95)}${star4(-5, -25, 2, '#fff', 0.95)}${dot(-26, -15, 0.9, T.light)}${dot(-13, -26, 0.9, T.light)}`;
};



// ================= Task 8-B: corner / edge / side / bottom =================
// 1 chiếc nanh dài nằm dọc cạnh trên (từ góc chạy +x), cong xuống ở mũi; có vằn xoắn + vệt sáng
const tusk = (T, P) => `<path d="M7 2.4C18 1.6 31 3.2 43 9.8C31 7.6 19 9 7 10.8Z" fill="url(#${P}h)" ${sc(T, 0.7)}/>`
  + `<path d="M13 3.2L11.6 10M19 3L17.8 9.4M25 3.8L24 8.8M31 5L30.2 8.4" stroke="${T.dark}" stroke-opacity="0.55" stroke-width="0.6" fill="none" stroke-linecap="round"/>`
  + `<path d="M9 4C20 3.2 31 4.4 40.6 8.8" stroke="#fff" stroke-opacity="0.8" stroke-width="0.6" fill="none" stroke-linecap="round"/>`;
const corner = (T, P, h) => {
  const { gem, star4, dot } = h;
  const arms = `<g transform="scale(0.93 1)">${tusk(T, P)}</g><g transform="matrix(0 0.93 1 0 0 0)">${tusk(T, P)}</g>`;
  const wisps = wisp(T, P, 8, 8, 135, 20, 6) + wisp(T, P, 8, 8, 108, 13, 3.8) + wisp(T, P, 8, 8, 162, 13, 3.8);
  const dfs = defs(T, P).replace(`id="${P}e"`, `id="${P}ey"`);
  return `${dfs}${arms}<circle cx="8" cy="8" r="9" fill="url(#${P}o)"/>${wisps}${gem(8, 8, 5, T.accent, T)}${star4(25, 25, 2, T.accent, 0.9)}${dot(31, 15, 0.9, T.light, 0.9)}${dot(15, 31, 0.9, T.light, 0.9)}`;
};
// đơn vị cạnh 44 (tâm x=0, +y vào trong, ≤ 22px): trăng khuyết ngửa (đáy nôi) + sao + dải sao nhỏ ở mối nối
const edge = (T, P, h) => `<g transform="translate(0 12) rotate(-90)"><path d="${moonD(8.6)}" fill="url(#${P}mn)" ${sc(T, 0.6)}/></g>`
  + `<path d="M-9 13.4C-6 16.4 6 16.4 9 13.4" stroke="${T.light}" stroke-opacity="0.45" stroke-width="0.6" fill="none" stroke-linecap="round"/>`
  + `${h.star4(0, 6.4, 1.8, T.accent, 0.95)}${wisp(T, P, 22, 7, 0, 8, 2.6)}${h.dot(-12, 6, 0.8, '#fff', 0.85)}`;
// cạnh bên (cao 100, ±15 quanh x=0, nối khớp y=0/100): 4 mảnh vảy thoi + dải sao ra ngoài/vào trong + ngọc xanh giữa
const side = (T, P, h) => {
  const { gem, star4, dot } = h;
  let plates = '';
  [13, 37, 63, 87].forEach((y) => {
    plates += `<path d="M0 ${y - 10}L7.6 ${y}L0 ${y + 10}L-7.6 ${y}Z" fill="url(#${P}b)" ${sc(T, 0.7)}/><path d="M0 ${y - 7}L4.6 ${y}L0 ${y + 7}L-4.6 ${y}Z" fill="none" stroke="${T.light}" stroke-opacity="0.6" stroke-width="0.6"/><path d="M0 ${y - 10}L7.6 ${y}L0 ${y}Z" fill="#fff" fill-opacity="0.2"/>`;
  });
  const wisps = wisp(T, P, 0, 25, -90, 14, 6.6) + wisp(T, P, 0, 75, 90, 14, 6.6) + wisp(T, P, 0, 25, 90, 8, 3.6) + wisp(T, P, 0, 75, -90, 8, 3.6);
  return `${defs(T, P)}${plates}${wisps}<circle cx="0" cy="50" r="9" fill="url(#${P}o)"/>${gem(0, 50, 4.2, T.accent, T)}${star4(-9, 50, 1.8, T.accent, 0.9)}${star4(9, 50, 1.8, '#fff', 0.9)}${dot(-5, 3, 0.8, T.light, 0.9)}${dot(5, 97, 0.8, T.light, 0.9)}`;
};
// chân thẻ (y ∈ [-4,12], nửa rộng ≤ 70, đối xứng): 2 chiếc nanh dài cong hất lên + nanh nhỏ treo + trăng khuyết nôi ngọc ở giữa
const bottom = (T, P, h) => {
  const { gem, star4, dot } = h;
  const half = () => {
    const ctrl = [[8, 6.6], [26, 10], [50, 8.6], [67, -0.6]];
    let drops = '';
    for (let i = 0; i < 4; i += 1) { const x = 16 + i * 10; const y = 7.6 - (x > 38 ? (x - 38) * 0.2 : 0); drops += `<path d="M${n(x)} ${n(y)}L${n(x + 3)} ${n(y)}L${n(x + 1.5)} ${n(y + 3.8)}Z" fill="#F7F3FF" stroke="${T.dark}" stroke-width="0.35" stroke-linejoin="round"/>`; }
    return `<path d="${kit.taperPath(ctrl, 6.4, 0.5, 12)}" fill="url(#${P}h)" ${sc(T, 0.7)}/><path d="${kit.spine(ctrl)}" fill="none" stroke="#fff" stroke-opacity="0.7" stroke-width="0.6" stroke-linecap="round" transform="translate(0 -1.2)"/>${drops}`
      + `${wisp(T, P, 62, 3, 28, 6, 3)}${star4(36, 0.6, 1.5, T.accent, 0.95)}${dot(50, 12, 0.8, T.light, 0.9)}`;
  };
  const centre = `<circle cx="0" cy="4.5" r="7" fill="url(#${P}o)"/><g transform="translate(0 4) rotate(-90)"><path d="${moonD(8.4)}" fill="url(#${P}mn)" ${sc(T, 0.6)}/></g>${gem(0, 5, 3.2, T.accent, T)}${star4(-12, 4, 1.4, '#fff', 0.9)}${star4(12, 4, 1.4, '#fff', 0.9)}`;
  return `${defs(T, P)}${half()}<g transform="scale(-1 1)">${half()}</g>${centre}`;
};

// ================= Task 8-C: crest =================
// Đỉnh thẻ (x −80..80, chân y=36): đầu Thao Thiết lớn miệng há nuốt trăng, hào quang pháp trận, quạt dải sao, 2 trăng khuyết chầu hai bên, bệ mây tinh tú.
const crest = (T, P, h) => {
  const { gem, star4, dot } = h;
  const sym = (f) => `${f}<g transform="scale(-1 1)">${f}</g>`;
  // hào quang + vòng pháp trận mảnh
  let fan = `<circle cx="0" cy="-6" r="40" fill="url(#${P}o)"/><circle cx="0" cy="-2" r="35" fill="none" stroke="${T.accent}" stroke-opacity="0.45" stroke-width="0.7" stroke-dasharray="2.4 2"/><circle cx="0" cy="-2" r="30" fill="none" stroke="${T.light}" stroke-opacity="0.35" stroke-width="0.5"/>`;
  [[-74, 34], [-54, 44], [-34, 50], [34, 50], [54, 44], [74, 34]].forEach(([a, L]) => { fan += wisp(T, P, 0, 14, a, L, 9); });
  fan += wisp(T, P, 0, 14, 0, 52, 11);
  // 2 trăng khuyết chầu hai bên (mở về phía đầu)
  const moons = sym(`<g transform="translate(-63 -6)"><circle r="12" fill="url(#${P}o)"/><path d="${moonD(10)}" transform="scale(-1 1)" fill="url(#${P}mn)" ${sc(T, 0.7)}/></g>${star4(-72, -22, 2, T.accent, 0.95)}${star4(-52, -26, 1.5, '#fff', 0.95)}${dot(-76, -8, 0.9, T.light)}`);
  // thân + vai
  const body = `<path d="M-26 32C-28 18 -22 8 -12 4L12 4C22 8 28 18 26 32Z" fill="url(#${P}b)" ${sc(T, 0.8)}/>`;
  let scales = '';
  for (let r = 0; r < 3; r += 1) for (let c = -2; c <= 2; c += 1) { const x = c * 8 + (r % 2 ? 4 : 0); if (Math.abs(x) < 22) scales += `M${x - 3.4} ${14 + r * 6}Q${x} ${18 + r * 6} ${x + 3.4} ${14 + r * 6}`; }
  const detail = `<path d="${scales}" fill="none" stroke="${T.dark}" stroke-opacity="0.55" stroke-width="0.7"/><path d="M-16 8C-20 16 -20 24 -19 30" fill="none" stroke="${T.light}" stroke-opacity="0.7" stroke-width="0.8"/>`;
  // bệ mây tinh tú (chân chạm y=36) + sao
  const base = `<path d="M-80 20C-66 30 -36 33 0 33C36 33 66 30 80 20L80 25C66 34 36 35.6 0 35.6C-36 35.6 -66 34 -80 25Z" fill="url(#${P}h)" ${sc(T, 0.9)}/><path d="M-79 21C-66 30 -36 33 0 33C36 33 66 30 79 21" fill="none" stroke="${T.light}" stroke-opacity="0.8" stroke-width="0.9" transform="translate(0 -0.5)"/>`
    + `${star4(-52, 31, 1.6, T.accent, 0.95)}${star4(52, 31, 1.6, T.accent, 0.95)}${star4(-26, 33.6, 1.2, '#fff', 0.9)}${star4(26, 33.6, 1.2, '#fff', 0.9)}${dot(-38, 33, 0.8, T.light)}${dot(38, 33, 0.8, T.light)}`
    + `<path d="M-79 21C-81 14 -77 9 -71 9C-74 12 -73 15 -69 17" fill="none" stroke="${T.nebula}" stroke-width="2.2" stroke-linecap="round"/><path d="M79 21C81 14 77 9 71 9C74 12 73 15 69 17" fill="none" stroke="${T.nebula}" stroke-width="2.2" stroke-linecap="round"/>`;
  // 2 vuốt trước bám bệ
  const claws = sym(`<g transform="translate(-19 26) rotate(180) scale(1)"><ellipse cx="0" cy="1.2" rx="4.6" ry="2.6" fill="url(#${P}b)" ${sc(T, 0.5)}/><path d="M-2.4 0Q-4 -4 -3 -8M0 0Q0 -4.4 0 -8.6M2.4 0Q4 -4 3 -8" fill="none" stroke="#F7F3FF" stroke-width="1.6" stroke-linecap="round"/></g>`);
  const headG = `<g transform="translate(0 -4) scale(1.32)">${head(T, P, h)}</g>`;
  return `${defs(T, P)}${fan}${moons}${body}${detail}${base}${claws}${headG}${gem(0, 31, 3.2, T.accent, T)}`;
};

module.exports = { avatarFrame, accent, crest, corner, edge, side, bottom, emblem, emblemGhost, head, defs, wisp, arcCtrl };
