// ===== hoso/frame/shop_cl_tunguu/motif.js — Tù Ngưu Cầm Âm: rồng nhạc đầu trâu, sừng cong, mắt mơ màng, râu như dải lụa, thân quấn dây đàn tỳ bà =====
// Task 2-A: avatar + accent + emblem/emblemGhost (đầu rồng độc lập, tâm (0,0), bán kính ≈ 20, hướng LÊN = hướng mọc sừng/túm tóc).
// Task 2-B (đã làm): corner / edge / side / bottom. Task 2-C sẽ thêm crest vào CHÍNH file này (dùng lại `head`, `defs`).
const kit = require('../../dragonKit');

const n = kit.n;
const sc = (T, w = 0.6) => `stroke="${T.dark}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

// gradient: b/v/o của dragonKit + e (mắt tím) + m (khoang miệng) + h (sừng) + r (dải lụa/dây)
const defs = (T, P) => kit.dragonDefs(T, P).replace('</defs>', ''
  + `<radialGradient id="${P}e" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.35" stop-color="${T.light}"/><stop offset="1" stop-color="${T.main}"/></radialGradient>`
  + `<linearGradient id="${P}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.void}"/><stop offset="1" stop-color="${T.mouth}"/></linearGradient>`
  + `<linearGradient id="${P}h" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${T.dark}"/><stop offset="0.5" stop-color="${T.horn}"/><stop offset="1" stop-color="${T.light}"/></linearGradient>`
  + '</defs>');

// ---- đầu rồng (vẽ lại 2026-11-04): mặt DÀI như rồng — sọ thon, mõm dài hẹp, mũi sống rõ, mày chau, mắt xếch hổ phách; sừng lyre cong vút 2 nhánh (vẫn là "ngưu"),
// vây má lá, râu lụa kết hạt vàng. Không còn mắt tròn to + mũi bẹt giống heo. y: túm tóc -19 … cằm +20.8 (khung giữ như cũ để emblem/crest/ghost không phải dời) ----
const SKULL = 'M0 -12.6C5 -12.8 10.4 -10 12.8 -5C14.6 -1 14.2 3.6 12 7C10.6 9.6 9.6 12.6 8.4 16C7.6 18.6 4.4 20.8 0 20.8C-4.4 20.8 -7.6 18.6 -8.4 16C-9.6 12.6 -10.6 9.6 -12 7C-14.2 3.6 -14.6 -1 -12.8 -5C-10.4 -10 -5 -12.8 0 -12.6Z';
const HORN_R = 'M7 -9.4C10.4 -12.6 16.6 -12.2 19.4 -17.4C20.6 -19.8 20.4 -22.6 19 -25C23.6 -22.6 25 -17.6 22.4 -12.6C19.6 -7.4 13.4 -4.8 10.2 -4.4Z';
const TINE_R = 'M16.4 -14.6C19.6 -15.4 22.8 -14.4 25.4 -12C22.6 -11.6 19.4 -11.4 17 -12.4Z';
const FIN_R = 'M12.4 1C17 -1.4 22.4 -0.4 25.2 3.6C21.4 3.6 18.4 5.6 16.6 8.4C15.6 6 14 4 12 3.2ZM11.6 6.6C15.6 6 19.6 7.6 21.6 11C18.4 10.6 15.8 11.4 13.8 13Z';
const mirrorD = (d) => { let i = 0; return d.replace(/-?\d+(?:\.\d+)?/g, (m) => ((i++ % 2 === 0) ? String(-Number(m)) : m)); };
const headHalf = (T, P) => {
  const o = sc(T, 0.6);
  const horn = `<path d="${HORN_R}" fill="url(#${P}h)" ${o}/><path d="${TINE_R}" fill="url(#${P}h)" ${sc(T, 0.5)}/><path d="M11.4 -7.6C15.6 -8.6 19.6 -11.6 21.2 -16.4M12.6 -6.2C16.6 -7 20.8 -10 22.6 -14.4" fill="none" stroke="${T.dark}" stroke-opacity="0.5" stroke-width="0.5"/><path d="M8.6 -10.4C13 -12.4 17 -13.4 19.6 -19.4" fill="none" stroke="#fff" stroke-opacity="0.8" stroke-width="0.6" stroke-linecap="round"/>`;
  const ear = `<path d="${FIN_R}" fill="url(#${P}b)" ${o}/><path d="M14 2.4C17.6 1.2 21 1.8 23.2 3.6M13.4 8.4C16 8 18.6 8.8 20 10.2" fill="none" stroke="${T.light}" stroke-opacity="0.8" stroke-width="0.5"/>`;
  // râu lụa: 2 dải mềm uốn S từ khoé mõm, đầu kết hạt vàng
  const silk = kit.whisker(T, [[7.4, 13.6], [15, 17], [19.4, 24], [26.4, 27.4]], 1.2, { r: 1.6, fill: T.accent })
    + kit.whisker(T, [[10.4, 9.4], [19.6, 10.4], [26.4, 15], [32.6, 13.6]], 1, { r: 1.4, fill: T.accent });
  const face = `<path d="M0 -0.8C3.6 -0.6 6.6 1.4 7.8 5L8.4 10L0 10.6Z" fill="${T.light}" fill-opacity="0.16"/>`
    + `<path d="M3.2 -9.4C6.6 -9.8 9.6 -8.4 11.6 -5.8M1.8 -6.6C4.6 -7 6.8 -6 8.2 -4.4" stroke="${T.dark}" stroke-opacity="0.5" stroke-width="0.55" fill="none" stroke-linecap="round"/>`
    + `<path d="M0.8 -11.8C5.6 -12 10.4 -9.8 12.6 -6.2" stroke="${T.light}" stroke-opacity="0.9" stroke-width="0.75" fill="none" stroke-linecap="round"/>`;
  // mõm dài hẹp sáng màu, lỗ mũi nhỏ xếch, khoé miệng có nanh
  const muzzle = `<path d="M0 6C3 6 5.4 8 5.8 11.4C5.6 15.6 3.8 19.6 0 19.8Z" fill="${T.light}" fill-opacity="0.3"/><path d="M2.2 2.4C3.2 6 3.8 10 3.6 14.4M5.6 9.6C6.2 12.6 5.6 16 4.4 18.2" fill="none" stroke="${T.dark}" stroke-opacity="0.5" stroke-width="0.55" stroke-linecap="round"/><ellipse cx="2.2" cy="17" rx="0.9" ry="0.6" transform="rotate(35 2.2 17)" fill="${T.void}" fill-opacity="0.9"/><path d="M0 19C2.2 19.2 4.2 18.4 5.6 16.8" fill="none" stroke="${T.dark}" stroke-opacity="0.65" stroke-width="0.55" stroke-linecap="round"/><path d="M5.2 17.4L6 20.2L7 16.8Z" fill="#fff" ${sc(T, 0.3)}/>`;
  // mắt xếch hình hạnh nhân, mày chau dày (nét dữ, không tròn to "dễ thương")
  const eye = `<path d="M2.2 -0.4C4 -4.6 9.8 -5.2 12.6 -2C9.8 0.8 5 1.6 2.2 -0.4Z" fill="url(#${P}e)" stroke="${T.dark}" stroke-width="0.55" stroke-linejoin="round"/>`
    + `<ellipse cx="8" cy="-2.2" rx="1.2" ry="2" fill="#1A0630"/><circle cx="7.2" cy="-3" r="0.55" fill="#fff"/>`
    + `<path d="M1.6 -0.8C4.2 -5.8 10.4 -6.2 13.2 -2.2C10.6 -3.8 5.6 -4 1.6 -0.8Z" fill="${T.dark}" fill-opacity="0.9"/>`
    + `<path d="M1.4 -5.2C4.8 -9 10.6 -8.8 13.4 -5" stroke="${T.dark}" stroke-width="1.3" stroke-linecap="round" fill="none"/>`;
  return { back: `${silk}${horn}${ear}`, front: `${face}${muzzle}${eye}` };
};

const head = (T, P, h) => {
  const { back, front } = headHalf(T, P);
  const o = sc(T, 0.6);
  const skull = `<path d="${SKULL}" fill="url(#${P}b)" ${o}/>`;
  const tuft = `<path d="M-1.6 -11.6C-3.6 -16 -0.6 -19.6 2.6 -18.4C1 -16.8 1.2 -14.6 2.6 -12.2Z" fill="${T.light}" ${sc(T, 0.5)}/><path d="M-0.4 -12.6C-1.2 -15 -0.2 -17 1 -17.4" fill="none" stroke="#fff" stroke-opacity="0.8" stroke-width="0.5"/>`;
  const gem = h.star4(0, -7.6, 2.4, T.accent, 1);
  return `<defs><clipPath id="${P}c"><path d="${SKULL}"/></clipPath><g id="${P}hb">${back}</g><g id="${P}hf"><g clip-path="url(#${P}c)">${front}</g></g></defs>`
    + `<use href="#${P}hb"/><use href="#${P}hb" transform="scale(-1 1)"/>${skull}<use href="#${P}hf"/><use href="#${P}hf" transform="scale(-1 1)"/>${tuft}${gem}`;
};

const emblem = (T, P, h) => defs(T, P) + head(T, P, h);
const emblemGhost = (T, P) => kit.ghost(`${SKULL}${HORN_R}${mirrorD(HORN_R)}`, 0.3) + kit.ghostDot(0, -1, T.accent);

// ---- vòng thân dựng từ cung tròn (Bézier bậc 3) ----
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

const HEAD_A = 315;
const TAIL_A = 290;

// KHUNG AVATAR: vành tím than + 4 dây đàn vàng quanh vành + thân rồng cuộn cả vành, đầu nghiêng ở 315°, đuôi hoá dải lụa. Mọi nét r ≤ 84.
const avatarFrame = (T, R = 70, h) => {
  const { polar, dot, star4, gem, pearl } = h;
  const P = 'shop_cl_tunguu-avatar-';
  const k = Number((R / 70).toFixed(4));
  const RB = 73.6;
  const A0 = HEAD_A + 4;
  const A1 = TAIL_A + 360;
  const prof = (t) => 1.4 + 5.6 * Math.pow(1 - t, 0.85) + 1.4 * Math.exp(-Math.pow((t - 0.08) / 0.06, 2));
  const tOf = (a) => (a - A0) / (A1 - A0);
  const ctrl = arcCtrl(RB, A0, A1);
  const extra = `<radialGradient id="${P}r" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="82"><stop offset="0.84" stop-color="${T.dark}"/><stop offset="0.9" stop-color="${T.horn}"/><stop offset="0.95" stop-color="${T.main}"/><stop offset="0.99" stop-color="${T.light}"/></radialGradient>`
    + `<radialGradient id="${P}q" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="80"><stop offset="0.86" stop-color="#2A0A4A"/><stop offset="0.92" stop-color="#14052B"/><stop offset="0.97" stop-color="#2A0A4A"/></radialGradient>`
    + `<path id="${P}s" d="M-1.5 0.7Q0 -1.5 1.5 0.7" fill="none" stroke="${T.dark}" stroke-opacity="0.8" stroke-width="0.6" stroke-linecap="round"/>`;
  const ring = `<path fill-rule="evenodd" fill="url(#${P}q)" d="M-77.6 0A77.6 77.6 0 1 0 77.6 0A77.6 77.6 0 1 0 -77.6 0ZM-70 0A70 70 0 1 0 70 0A70 70 0 1 0 -70 0Z"/>`
    + `<circle r="70.4" fill="none" stroke="${T.accent}" stroke-opacity="0.6" stroke-width="0.8"/><circle r="77.2" fill="none" stroke="${T.main}" stroke-opacity="0.9" stroke-width="0.9"/><circle r="78.5" fill="none" stroke="${T.light}" stroke-opacity="0.5" stroke-width="0.5"/>`;
  // 4 dây đàn vàng mảnh (đồng tâm) quanh vành
  let strings = '';
  [71.8, 73.4, 75, 76.4].forEach((r, i) => { strings += `<circle r="${r}" fill="none" stroke="${T.accent}" stroke-opacity="${n(0.85 - i * 0.12)}" stroke-width="${n(0.5 + i * 0.1)}"/>`; });
  let scl = '';
  for (let a = A0 + 6; a < A1 - 8; a += 20) {
    const w = prof(tOf(a));
    const [x, y] = polar(RB + (Math.round((a - A0) / 20) % 2 ? 1 : -1) * w * 0.2, a);
    scl += `<use href="#${P}s" transform="translate(${x} ${y}) rotate(${n(a + 90)}) scale(${n(0.6 + w * 0.2)})"/>`;
  }
  const body = `<path d="${kit.taperPath(ctrl, 0, 0, 8, prof)}" fill="url(#${P}r)" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/>`
    + `<path d="${kit.spine(arcCtrl(RB + 1.4, A0 + 6, A1 - 40))}" fill="none" stroke="${T.light}" stroke-opacity="0.7" stroke-width="0.6" stroke-linecap="round"/>${scl}`;
  const claws = [HEAD_A - 22, HEAD_A + 30].map((a) => { const [x, y] = polar(75.6, a); return kit.claw(T, P, x, y, a + 180, 0.6); }).join('');
  // đuôi hoá 2 dải lụa bay dọc vành (đầu kết hạt vàng)
  const ribbon = (r0, a0, dr, da) => kit.whisker(T, [polar(r0, a0), polar(r0 + dr * 0.3, a0 - da * 0.35), polar(r0 + dr * 0.8, a0 - da * 0.7), polar(r0 + dr, a0 - da)], 1.6, { r: 1.5, fill: T.accent });
  const tail = ribbon(RB, TAIL_A, 7, 30) + ribbon(RB, TAIL_A, 2.8, 44);
  let studs = '';
  for (let a = 15; a < 360; a += 30) {
    if (a > 280 && a < 360) continue;
    const [x, y] = polar(79.4, a);
    studs += (a - 15) % 60 === 0 ? gem(x, y, 3.1, T.ruby, T, a) : pearl(x, y, 1.6, T);
  }
  let notes = '';
  [[40, 80.6], [100, 81], [160, 80.6], [220, 81], [262, 80.8], [352, 81.2]].forEach(([a, r], i) => { const [x, y] = polar(r, a); notes += i % 2 ? star4(x, y, 1.6, T.accent, 0.95) : dot(x, y, 0.9, T.ember, 0.95); });
  const [hx, hy] = polar(73.4, HEAD_A);
  const headG = `<g transform="translate(${hx} ${hy}) rotate(${HEAD_A + 10})"><circle r="13" fill="url(#${P}o)"/><g transform="scale(0.4)">${head(T, P, h)}</g></g>`;
  return `${defs(T, P).replace('</defs>', `${extra}</defs>`)}<g transform="scale(${k})">${ring}${strings}${body}${claws}${tail}${studs}${notes}${headG}</g>`;
};

// điểm nhấn góc (28×28 nhô ra ngoài, lên-trái): dải lụa cuộn + nốt nhạc + ngọc tím
const accent = (T, P, h) => {
  const { gem, star4, dot } = h;
  const silk = kit.whisker(T, [[-3, -3], [-12, -2], [-17, -9], [-24, -7]], 1.8, { r: 1.7, fill: T.accent })
    + kit.whisker(T, [[-3, -3], [-2, -12], [-8, -17], [-6, -25]], 1.5, { r: 1.5, fill: T.accent });
  const note = `<g transform="translate(-14 -17)"><ellipse cx="0" cy="3" rx="2.4" ry="1.7" transform="rotate(-22 0 3)" fill="${T.accent}" stroke="${T.dark}" stroke-width="0.5"/><path d="M2 2.4L2 -6.4C4 -5.6 5 -4 4.6 -2.4" fill="none" stroke="${T.accent}" stroke-width="0.9" stroke-linecap="round"/></g>`;
  return `${defs(T, P)}${silk}${note}${gem(-3, -3, 3.4, T.ruby, T)}${star4(-24, -15, 1.8, T.accent, 0.95)}${dot(-23, -2, 1, T.ember)}`;
};

// ================= Task 2-B: corner / edge / side / bottom =================
// Chủ đề: dây đàn tỳ bà vàng + dải lụa tím + nốt nhạc + chốt đàn. Corner mang defs (gradient mắt `<P>e` đổi tên `<P>ey` vì bonusKit dùng `<P>e` cho nhóm cạnh).
const note = (T, x, y, s = 1) => `<g transform="translate(${n(x)} ${n(y)}) scale(${s})"><ellipse cx="0" cy="2.6" rx="2.2" ry="1.6" transform="rotate(-22 0 2.6)" fill="${T.accent}" stroke="${T.dark}" stroke-width="0.5"/><path d="M1.9 2.2L1.9 -5.6C3.8 -4.8 4.6 -3.4 4.2 -1.8" fill="none" stroke="${T.accent}" stroke-width="0.9" stroke-linecap="round"/></g>`;

const corner = (T, P, h) => {
  const { gem, star4, dot } = h;
  const dfs = defs(T, P).replace(`id="${P}e"`, `id="${P}ey"`);
  const arm = kit.whisker(T, [[7, 6.4], [16, 2.6], [27, 9.4], [39, 5.4]], 2.2, { r: 1.7, fill: T.accent })
    + kit.whisker(T, [[7, 7.4], [15, 13.6], [24, 14], [29, 21]], 1.3, { r: 1.3, fill: T.light });
  const arms = `${arm}<g transform="matrix(0 1 1 0 0 0)">${arm}</g>`;
  return `${dfs}${arms}<circle cx="8" cy="8" r="8.5" fill="url(#${P}o)"/>${gem(8, 8, 5, T.ruby, T)}${note(T, 23, 22, 0.9)}${star4(33, 29, 1.7, T.accent, 0.9)}${star4(29, 33, 1.4, T.accent, 0.8)}${dot(18, 30, 0.9, T.ember, 0.9)}${dot(30, 18, 0.9, T.ember, 0.9)}`;
};

// đơn vị cạnh 44: vòng dây đàn vàng võng giữa hai chốt (±22, dùng chung với đơn vị kế) + hạt sao ở giữa
const edge = (T, P, h) => `<path d="M-22 8.6Q0 22 22 8.6" fill="none" stroke="${T.dark}" stroke-width="2.2" stroke-opacity="0.45"/><path d="M-22 8.6Q0 22 22 8.6" fill="none" stroke="${T.accent}" stroke-width="1.1"/><path d="M-22 8.6Q0 16.6 22 8.6" fill="none" stroke="${T.light}" stroke-opacity="0.85" stroke-width="0.7"/>`
  + `${h.pearl(22, 8.6, 1.9, T)}${h.star4(0, 15.4, 1.9, T.light, 0.95)}${h.dot(0, 19, 1, T.ruby, 0.95)}`;

// cạnh bên (cao 100, ±15, nối khớp y=0/100): dải lụa uốn S + chốt đàn so le + sao + ngọc giữa
const side = (T, P, h) => {
  const { gem, star4, dot } = h;
  const silk = kit.whisker(T, [[0, 5], [9, 15], [-9, 33], [0, 44]], 1.6, { r: 1.4, fill: T.accent })
    + kit.whisker(T, [[0, 56], [-9, 67], [9, 85], [0, 95]], 1.6, { r: 1.4, fill: T.accent });
  let pegs = '';
  [[22, 1], [78, -1]].forEach(([y, d]) => { pegs += `<path d="M0 ${y}L${11 * d} ${y}" stroke="${T.dark}" stroke-width="2.6" stroke-linecap="round"/><path d="M0 ${y}L${11 * d} ${y}" stroke="${T.accent}" stroke-width="1.2" stroke-linecap="round"/><ellipse cx="${12 * d}" cy="${y}" rx="2.4" ry="3.4" fill="${T.wood}" stroke="${T.dark}" stroke-width="0.6"/><ellipse cx="${11.6 * d}" cy="${y - 1}" rx="0.8" ry="1.4" fill="#fff" fill-opacity="0.6"/>`; });
  return `${defs(T, P)}${silk}${pegs}<circle cx="0" cy="50" r="9" fill="url(#${P}o)"/>${gem(0, 50, 4.2, T.ruby, T)}${star4(-9, 50, 1.8, T.accent, 0.9)}${star4(9, 50, 1.8, T.accent, 0.9)}${dot(6, 4, 0.8, T.ember, 0.9)}${dot(-6, 96, 0.8, T.ember, 0.9)}`;
};

// chân thẻ (y ∈ [-4,12], nửa rộng ≤ 70, đối xứng): cần đàn tỳ bà 2 bên (vạch phím + 3 dây vàng + đầu cần cuộn) + dải lụa rủ + nốt nhạc + ngọc giữa
const bottom = (T, P, h) => {
  const { gem, star4, pearl } = h;
  const half = () => {
    let frets = '';
    for (let i = 0; i < 6; i += 1) { const x = 14 + i * 8.6; frets += `M${n(x)} ${n(3 + i * 0.03)}L${n(x)} ${n(8.8 - i * 0.2)}`; }
    return `<path d="M7 2.4L63 4.2L63 8.4L7 10Z" fill="${T.wood}" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/><path d="${frets}" stroke="${T.light}" stroke-opacity="0.6" stroke-width="0.5"/>`
      + `<path d="M7 4.6L63 5.6M7 6.2L63 6.6M7 7.8L63 7.6" stroke="${T.accent}" stroke-width="0.55"/><path d="M7 2.8L63 4.5" stroke="${T.light}" stroke-opacity="0.7" stroke-width="0.5"/>`
      + `<path d="M63 4.6C67 3.4 69 6 67 8.2C65.6 9.4 64 8.4 63.4 7.6" fill="url(#${P}h)" stroke="${T.dark}" stroke-width="0.7" stroke-linejoin="round"/>${pearl(66.2, 6.2, 1.1, T)}`
      + kit.whisker(T, [[16, 9.4], [24, 10.6], [34, 10.4], [42, 9.2]], 1, { r: 1.1, fill: T.accent })
      + note(T, 28, 0.8, 0.7) + star4(48, 0.4, 1.5, T.accent, 0.95);
  };
  return `${defs(T, P)}${half()}<g transform="scale(-1 1)">${half()}</g><circle cx="0" cy="5.4" r="7" fill="url(#${P}o)"/>${gem(0, 6, 4, T.ruby, T)}${star4(0, -1.8, 1.8, T.accent, 0.95)}`;
};

// ================= Task 2-C: crest =================
// Đỉnh thẻ (x −80..80, chân y=36): Tù Ngưu nằm trên cần đàn tỳ bà — thanh gỗ có phím + 3 dây vàng làm bệ, thân + 2 vuốt trước bám cần,
// đầu trâu lớn nhìn thẳng, quạt dải lụa kết hạt vàng toả sau lưng như dây đàn bung, nốt nhạc bay, 2 chốt đàn cuộn hai đầu.
const crest = (T, P, h) => {
  const { gem, star4, dot, pearl } = h;
  const sym = (f) => `${f}<g transform="scale(-1 1)">${f}</g>`;
  const rib = (pts, w) => kit.whisker(T, pts, w, { r: 1.8, fill: T.accent });
  const aura = `<circle cx="0" cy="-4" r="40" fill="url(#${P}o)"/>`;
  const fan = sym(rib([[-10, 12], [-30, 2], [-48, -2], [-66, -14]], 2.4) + rib([[-12, 17], [-38, 14], [-58, 8], [-76, 0]], 2)
    + rib([[-8, 8], [-22, -12], [-36, -24], [-52, -30]], 2) + rib([[-4, 5], [-8, -18], [-18, -30], [-26, -40]], 1.6));
  const notes = `${note(T, -62, -24, 1)}${note(T, 62, -24, 1)}${note(T, -40, -36, 0.8)}${note(T, 40, -36, 0.8)}${star4(-72, -8, 1.8, T.accent, 0.95)}${star4(72, -8, 1.8, T.accent, 0.95)}${star4(0, -40, 2, T.accent, 0.9)}${dot(-50, 4, 1, T.ember, 0.9)}${dot(50, 4, 1, T.ember, 0.9)}`;
  const body = `<path d="M-24 30C-26 16 -20 6 -12 2L12 2C20 6 26 16 24 30Z" fill="url(#${P}b)" ${sc(T, 0.8)}/>`;
  let scales = '';
  for (let r = 0; r < 3; r += 1) for (let c = -2; c <= 2; c += 1) { const x = c * 8 + (r % 2 ? 4 : 0); if (Math.abs(x) < 22) scales += `M${n(x - 3.4)} ${12 + r * 6}Q${n(x)} ${16 + r * 6} ${n(x + 3.4)} ${12 + r * 6}`; }
  const detail = `<path d="${scales}" fill="none" stroke="${T.dark}" stroke-opacity="0.55" stroke-width="0.7"/><path d="M-14 6C-18 14 -18 22 -17 28" fill="none" stroke="${T.light}" stroke-opacity="0.7" stroke-width="0.8"/>`;
  // cần đàn: thanh gỗ cong nhẹ, phím dọc, 3 dây vàng, chốt cuộn hai đầu
  const neck = `<path d="M-72 27C-54 30.4 -28 32.4 0 32.4C28 32.4 54 30.4 72 27L72 33.6C54 37 28 36.6 0 36.6C-28 36.6 -54 37 -72 33.6Z" fill="${T.wood}" ${sc(T, 0.9)}/>`;
  let frets = '';
  for (let i = -6; i <= 6; i += 1) { if (Math.abs(i) < 3) continue; const x = i * 11.4; const y0 = 29.2 + (1 - Math.min(1, Math.abs(x) / 72)) * 3.2; frets += `M${n(x)} ${n(y0)}L${n(x)} ${n(y0 + 5.6)}`; }
  const strings = [29.6, 31.6, 33.6].map((y, i) => `<path d="M-72 ${n(y - 0.6 + i * 0.2)}C-54 ${n(y + 1.6)} -28 ${n(y + 2.4)} 0 ${n(y + 2.4)}C28 ${n(y + 2.4)} 54 ${n(y + 1.6)} 72 ${n(y - 0.6 + i * 0.2)}" fill="none" stroke="${T.accent}" stroke-width="0.75" stroke-opacity="0.95"/>`).join('');
  const bar = `${neck}<path d="${frets}" stroke="${T.light}" stroke-opacity="0.85" stroke-width="0.8" stroke-linecap="round"/>${strings}<path d="M-70 27.8C-52 31 -28 33 0 33C28 33 52 31 70 27.8" fill="none" stroke="${T.light}" stroke-opacity="0.45" stroke-width="0.6"/>`;
  const peg = sym(`<path d="M-72 28.4C-80 27.4 -80.6 18.6 -75 17.4C-71 16.8 -69.4 21.6 -73 22.6" fill="none" stroke="${T.dark}" stroke-width="3.4" stroke-linecap="round"/><path d="M-72 28.4C-80 27.4 -80.6 18.6 -75 17.4C-71 16.8 -69.4 21.6 -73 22.6" fill="none" stroke="${T.accent}" stroke-width="1.8" stroke-linecap="round"/>${pearl(-74.6, 20, 1.5, T)}`);
  const claws = sym(`<g transform="translate(-17 23.4) rotate(180) scale(1)"><ellipse cx="0" cy="1.2" rx="4.6" ry="2.6" fill="url(#${P}b)" ${sc(T, 0.5)}/><path d="M-2.4 0Q-4 -4 -3 -8M0 0Q0 -4.4 0 -8.6M2.4 0Q4 -4 3 -8" fill="none" stroke="${T.light}" stroke-width="1.6" stroke-linecap="round"/></g>`);
  const headG = `<g transform="translate(0 -3) scale(1.2)">${head(T, P, h)}</g>`;
  return `${defs(T, P)}${aura}${fan}${notes}${body}${detail}<g transform="translate(0 -0.9)">${bar}${peg}</g>${claws}${headG}${gem(0, 32.2, 2.8, T.ruby, T)}`;
};

module.exports = { crest, avatarFrame, accent, corner, edge, side, bottom, emblem, emblemGhost, head, defs, arcCtrl };
