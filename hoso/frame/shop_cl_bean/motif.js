// ===== hoso/frame/shop_cl_bean/motif.js — Bệ Ngạn Pháp Hổ: rồng đầu hổ uy nghiêm, sọc vằn, cán cân + ấn tín + dây leo =====
// Bộ 6 (A+B+C). emblem/emblemGhost = đầu rồng độc lập, tâm (0,0), hướng LÊN = hướng mọc sừng, bán kính ≈ 21.
// Id gradient/hình mẫu (tiền tố P của phần gọi): b/v/o (dragonKit) + e mắt + m miệng + h sừng + mt kim loại + st đá + lg lá + lf lá(hình mẫu) + w vằn(hình mẫu) + cp clip + hb/hf nửa đầu.
// Lưu ý bonusKit dùng id `g`, `e`, `k`, `c` ở border/crest/side/bottom/accent → corner đổi `e` thành `ey`; không dùng `g`/`k`/`c` ở đây.
const kit = require('../../dragonKit');

const n = kit.n;
const sc = (T, w = 0.6) => `stroke="${T.dark}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

const defs = (T, P) => kit.dragonDefs(T, P).replace('</defs>', ''
  + `<radialGradient id="${P}e" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.4" stop-color="${T.accent}"/><stop offset="1" stop-color="${T.ruby}"/></radialGradient>`
  + `<linearGradient id="${P}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.void}"/><stop offset="1" stop-color="${T.mouth}"/></linearGradient>`
  + `<linearGradient id="${P}h" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${T.goldD}"/><stop offset="0.5" stop-color="${T.gold}"/><stop offset="1" stop-color="${T.cream}"/></linearGradient>`
  + `<linearGradient id="${P}mt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.goldL}"/><stop offset="0.45" stop-color="${T.gold}"/><stop offset="1" stop-color="${T.goldD}"/></linearGradient>`
  + `<linearGradient id="${P}st" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.main}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient>`
  + `<linearGradient id="${P}lg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${T.dark}"/><stop offset="0.5" stop-color="${T.main}"/><stop offset="1" stop-color="${T.light}"/></linearGradient>`
  + `<g id="${P}lf"><path d="M0 0C-3.2 -2.6 -3.4 -8 0 -12C3.4 -8 3.2 -2.6 0 0Z" fill="url(#${P}lg)" stroke="${T.dark}" stroke-width="0.45" stroke-linejoin="round"/><path d="M0 -1.2L0 -10.4" fill="none" stroke="${T.light}" stroke-opacity="0.8" stroke-width="0.4" stroke-linecap="round"/></g>`
  + `<path id="${P}w" d="M-1.7 0C-1.3 -3.4 -0.7 -6.6 0 -10C0.7 -6.6 1.3 -3.4 1.7 0Z" fill="${T.stripe}" fill-opacity="0.88"/>`
  + '</defs>');

// lá (hình mẫu dài 12, rộng ±3.2): gốc (x,y), hướng a (độ, 0 = lên), dài len, nửa rộng w
const leaf = (P, x, y, a, len, w, flip = 1) => `<use href="#${P}lf" transform="translate(${n(x)} ${n(y)}) rotate(${n(a)}) scale(${n((w / 3.2) * flip)} ${n(len / 12)})"/>`;
// vằn hổ (hình mẫu dài 10, đáy rộng 3.4): gốc (x,y), hướng a, dài len, rộng w (×)
const stripe = (P, x, y, a, len, w = 1) => `<use href="#${P}w" transform="translate(${n(x)} ${n(y)}) rotate(${n(a)}) scale(${n(w)} ${n(len / 10)})"/>`;

// đường kín đối xứng: nửa PHẢI từ (x0,y0) trên trục xuống trục dưới theo các đoạn Bézier [c1x,c1y,c2x,c2y,ex,ey]; nửa trái lấy gương
const symPath = (x0, y0, segs) => {
  let d = `M${x0} ${y0}`;
  segs.forEach((s) => { d += `C${s.join(' ')}`; });
  const pts = [[x0, y0], ...segs.map((s) => [s[4], s[5]])];
  for (let i = segs.length - 1; i >= 0; i -= 1) { const s = segs[i]; d += `C${-s[2]} ${s[3]} ${-s[0]} ${s[1]} ${-pts[i][0]} ${pts[i][1]}`; }
  return `${d}Z`;
};

// ---- đầu rồng hổ: sọ vuông bạnh, tai tròn, sừng nhánh ngắn, sọc 王 trên trán, vằn má, râu cứng; y: sừng -23 … cằm +21 ----
const SKULL = symPath(0, -12.4, [[5.5, -12.8, 11, -12, 15, -9], [19, -6.4, 21, -2, 21.2, 3.6], [21.4, 8.4, 20.6, 12.4, 19.8, 15], [19.2, 18, 17, 19.8, 13.6, 20.2], [9.6, 20.7, 4.8, 20.9, 0, 20.9]]);
const HORN_R = 'M3.6 -11.8C3.2 -16.6 5.2 -20.4 8.8 -23.4C9 -19.8 9.8 -16.2 10 -11.6Z';
const TINE_R = 'M7.6 -17.6C9.8 -18.4 11.8 -17.6 13.2 -15.6C11.4 -15.8 9.6 -15.4 8.2 -14.4Z';
const EAR_R = 'M10 -10C9.4 -15.2 13.2 -19 17.8 -17.8C20.8 -17 21.8 -12.8 20.6 -9C18.6 -6.8 14 -6.8 10 -10Z';
const EAR_IN = 'M12.6 -10C12.4 -13.6 15 -15.8 17.6 -15.2C19.2 -14.6 19.6 -12.4 19 -10C17.4 -8.8 14.4 -8.6 12.6 -10Z';

const tuft = (T, P, x, y, a, len, w) => `<path transform="translate(${n(x)} ${n(y)}) rotate(${n(a)})" d="M0 0C${n(-w)} ${n(-len * 0.3)} ${n(-w * 0.55)} ${n(-len * 0.75)} 0 ${n(-len)}C${n(w * 0.5)} ${n(-len * 0.7)} ${n(w)} ${n(-len * 0.3)} 0 0Z" fill="url(#${P}b)" ${sc(T, 0.5)}/>`;
const bar = (x, y, hw) => `M${n(-hw)} ${y}C${n(-hw / 2)} ${n(y - 1.1)} ${n(hw / 2)} ${n(y - 1.1)} ${n(hw)} ${y}C${n(hw / 2)} ${n(y + 1.1)} ${n(-hw / 2)} ${n(y + 1.1)} ${n(-hw)} ${y}Z`;

// nửa PHẢI (x ≥ 0): back = sau sọ; front = trên mặt (cắt theo sọ). lite = đầu nhỏ trên avatar.
const headHalf = (T, P, h, lite) => {
  const o = sc(T, 0.6);
  let fur = '';
  (lite ? [[18.8, -1, 66, 10, 3.6], [20.4, 5, 88, 12, 4.2]] : [[18.8, -1, 66, 10, 3.6], [20.4, 5, 88, 12, 4.2], [19.6, 11, 112, 11, 4], [16.6, 16.2, 136, 9.4, 3.4]]).forEach(([x, y, a, len, w]) => { fur += tuft(T, P, x, y, a, len, w); });
  const whisk = lite ? '' : kit.whisker(T, [[16.6, 11.4], [21, 10], [25.6, 9], [30, 8]], 0.9, { r: 1.1, fill: T.accent })
    + kit.whisker(T, [[17, 13.6], [22, 13], [26.4, 13.4], [30.4, 13.4]], 0.9)
    + kit.whisker(T, [[16.2, 15.6], [20.6, 16.6], [24.4, 18.2], [28, 19.6]], 0.9);
  const ear = `<path d="${EAR_R}" fill="url(#${P}b)" ${o}/><path d="${EAR_IN}" fill="${T.mouth}" fill-opacity="0.85"/><path d="M13.4 -10.4C13.6 -12.8 15.4 -14.2 17.2 -13.8" fill="none" stroke="${T.cream}" stroke-opacity="0.8" stroke-width="0.6" stroke-linecap="round"/>`;
  const horn = `<path d="${HORN_R}" fill="url(#${P}h)" ${o}/><path d="${TINE_R}" fill="url(#${P}h)" ${o}/><path d="M4.8 -12.6C4.8 -16 6.2 -19 8.2 -21.4" fill="none" stroke="#fff" stroke-opacity="0.8" stroke-width="0.55" stroke-linecap="round"/><path d="M4.4 -14.4L7.2 -14.8M5 -17L7.8 -17.2" stroke="${T.goldD}" stroke-opacity="0.7" stroke-width="0.5" fill="none" stroke-linecap="round"/>`;
  const cheek = `<path d="M20.8 2.4C17.4 2.2 14 3.4 11.8 5.4C15 5.2 18 5.6 20.8 6.4Z M20.4 8.8C17.2 8.6 14.4 9.6 12.4 11.4C15.2 11.2 17.8 11.6 20 12.4Z M18.6 14.4C16 14.2 13.8 15 12.2 16.4C14.2 16.4 16.2 16.8 17.6 17.6Z" fill="${T.stripe}" fill-opacity="0.88"/>`;
  const muzzle = `<path d="M0 1C3.4 0.6 7 2.6 8 6.6C8.6 10.4 6.6 13.4 3.4 14.6C2 15.2 0.8 15.2 0 15.2Z" fill="${T.light}" fill-opacity="0.4"/>`;
  const brow = `<path d="M2 -6.6L17.6 -10.6L20.4 -5L12.6 -3.2L4.2 -1.6Z" fill="${T.stripe}" stroke="${T.stripe}" stroke-width="0.4" stroke-linejoin="round"/><path d="M3.6 -5.8L15.6 -9" stroke="${T.light}" stroke-opacity="0.5" stroke-width="0.5" fill="none"/>`;
  const eye = `<circle cx="9.8" cy="-0.6" r="4.6" fill="url(#${P}o)"/><path d="M4.8 -0.2C6.6 -3.4 12.6 -4 15.2 -1.6C12.8 1.4 7.4 1.8 4.8 -0.2Z" fill="url(#${P}e)" stroke="${T.stripe}" stroke-width="0.6" stroke-linejoin="round"/><ellipse cx="10" cy="-1.5" rx="0.8" ry="2" transform="rotate(-20 10 -1.5)" fill="#1A0A00"/><circle cx="8.6" cy="-2.4" r="0.7" fill="#fff"/><path d="M6 1.6C5.6 4.6 6.4 6.6 7.8 8" stroke="${T.stripe}" stroke-opacity="0.8" stroke-width="0.6" fill="none" stroke-linecap="round"/>`;
  const detail = lite ? '' : `<path d="M12 -8C14 -8.4 16 -7.6 17 -6.2M10.6 -10.6C12.4 -11 14.2 -10.4 15.4 -9.4" stroke="${T.light}" stroke-opacity="0.65" stroke-width="0.55" fill="none" stroke-linecap="round"/><circle cx="6.2" cy="12.8" r="0.45" fill="${T.stripe}"/><circle cx="7.8" cy="11.6" r="0.45" fill="${T.stripe}"/><circle cx="7.6" cy="13.8" r="0.45" fill="${T.stripe}"/>`;
  const mouth = `<path d="M0 11.4C1 13.2 4.4 14 7.6 12.4" fill="none" stroke="${T.stripe}" stroke-width="0.8" stroke-linecap="round"/><path d="M3.4 12.6L4.6 18L5.9 12.8Z" fill="${T.cream}" stroke="${T.stripe}" stroke-width="0.4" stroke-linejoin="round"/>`;
  return { back: `${fur}${whisk}${ear}${horn}`, front: `${muzzle}${cheek}${brow}${eye}${detail}${mouth}` };
};

const head = (T, P, h, lite = false) => {
  const { back, front } = headHalf(T, P, h, lite);
  const skull = `<path d="${SKULL}" fill="url(#${P}b)" ${sc(T, 0.7)}/>`;
  const centre = `<path d="${bar(0, -10.2, 3.4)}${bar(0, -7.4, 4.8)}${bar(0, -4.6, 3.4)}M0 -11.4C1 -8.8 1 -5 0 -2.4C-1 -5 -1 -8.8 0 -11.4Z" fill="${T.stripe}" fill-opacity="0.92"/>`
    + `<path d="M-3.2 5C-1.6 4.4 1.6 4.4 3.2 5C2.8 7 1.4 8.4 0 9C-1.4 8.4 -2.8 7 -3.2 5Z" fill="${T.tongue}" stroke="${T.stripe}" stroke-width="0.5" stroke-linejoin="round"/><path d="M-1.4 5.4C-0.4 5 0.4 5 1.4 5.4" stroke="#fff" stroke-opacity="0.7" stroke-width="0.45" fill="none" stroke-linecap="round"/><path d="M0 9V11.4" stroke="${T.stripe}" stroke-width="0.7"/>`;
  return `<defs><clipPath id="${P}cp"><path d="${SKULL}"/></clipPath><g id="${P}hb">${back}</g><g id="${P}hf"><g clip-path="url(#${P}cp)">${front}</g></g></defs>`
    + `<use href="#${P}hb"/><use href="#${P}hb" transform="scale(-1 1)"/>${skull}<use href="#${P}hf"/><use href="#${P}hf" transform="scale(-1 1)"/>${centre}`;
};

const emblem = (T, P, h) => defs(T, P) + head(T, P, h);
const emblemGhost = (T, P, h) => {
  const right = `${SKULL}${HORN_R}${EAR_R}`;
  return kit.ghost(right, 0.3) + `<g transform="scale(-1 1)">${kit.ghost(`${HORN_R}${EAR_R}`, 0.3)}</g>` + kit.ghostDot(0, -2, T.accent);
};

// ---- vòng thân dựng từ cung tròn ----
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

const HEAD_A = 45; // đầu ở góc trên-phải, nhìn vào ảnh
const TAIL_A = 14; // đuôi kết sát đầu, xoè 3 lá

// KHUNG AVATAR (tự dựng): vành xanh rêu + rồng hổ vằn cuộn cả vành + dây leo mép trong. Vẽ cho R=70 rồi scale(R/70). Mọi nét r ∈ [64, 84].
const avatarFrame = (T, R = 70, h) => {
  const { polar, star4, gem, pearl, dot } = h;
  const P = 'shop_cl_bean-avatar-';
  const k = Number((R / 70).toFixed(4));
  const RB = 73.6;
  const A0 = HEAD_A + 4;
  const A1 = TAIL_A + 360;
  const prof = (t) => 1.4 + 6 * Math.pow(1 - t, 0.85) + 1.4 * Math.exp(-Math.pow((t - 0.08) / 0.06, 2));
  const tOf = (a) => (a - A0) / (A1 - A0);
  const ctrl = arcCtrl(RB, A0, A1);
  const extra = `<radialGradient id="${P}r" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="82"><stop offset="0.84" stop-color="${T.dark}"/><stop offset="0.9" stop-color="${T.main}"/><stop offset="0.95" stop-color="#A9D67A"/><stop offset="0.98" stop-color="${T.light}"/></radialGradient>`
    + `<radialGradient id="${P}q" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="80"><stop offset="0.86" stop-color="#2D4A1E"/><stop offset="0.92" stop-color="#0E1A09"/><stop offset="0.97" stop-color="#2D4A1E"/></radialGradient>`;
  const ring = `<path fill-rule="evenodd" fill="url(#${P}q)" d="M-77.6 0A77.6 77.6 0 1 0 77.6 0A77.6 77.6 0 1 0 -77.6 0ZM-70 0A70 70 0 1 0 70 0A70 70 0 1 0 -70 0Z"/>`
    + `<circle r="70.4" fill="none" stroke="${T.accent}" stroke-opacity="0.65" stroke-width="0.8"/><circle r="77.2" fill="none" stroke="${T.main}" stroke-opacity="0.9" stroke-width="0.9"/><circle r="78.5" fill="none" stroke="${T.light}" stroke-opacity="0.5" stroke-width="0.5"/>`;
  // dây leo mép trong
  let vd = '';
  for (let a = 66; a <= 388; a += 3) { const [x, y] = polar(67.4 + 1.1 * Math.sin(a * 0.1), a); vd += `${a === 66 ? 'M' : 'L'}${x} ${y}`; }
  let vine = `<path d="${vd}" fill="none" stroke="${T.dark}" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"/><path d="${vd}" fill="none" stroke="${T.main}" stroke-width="1" stroke-linejoin="round" stroke-linecap="round"/>`;
  let idx = 0;
  for (let a = 72; a < 384; a += 17) { idx += 1; const [x, y] = polar(67.4, a); vine += leaf(P, x, y, a + 180 + (idx % 2 ? 26 : -26), 5.6, 1.7); }
  // thân: vằn hổ + vảy
  let marks = '';
  let i = 0;
  for (let a = A0 + 10; a < A1 - 22; a += 11) {
    const w = prof(tOf(a));
    if (w < 2.6) continue;
    i += 1;
    const out = i % 2 === 0;
    const [x, y] = polar(out ? RB + w * 0.5 : RB - w * 0.5, a);
    marks += stripe(P, x, y, a + (out ? 180 : 0), w * (out ? 1.25 : 0.8), Math.max(0.55, w * 0.14));
  }
  const body = `<path d="${kit.taperPath(ctrl, 0, 0, 8, prof)}" fill="url(#${P}r)" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/>`
    + `${marks}<path d="${kit.spine(arcCtrl(RB + 1.4, A0 + 6, A1 - 40))}" fill="none" stroke="${T.light}" stroke-opacity="0.7" stroke-width="0.6" stroke-linecap="round"/>`;
  const claws = [HEAD_A - 22, HEAD_A + 30].map((a) => { const [x, y] = polar(75.6, a); return kit.claw(T, P, x, y, a + 180, 0.7); }).join('');
  const [tx, ty] = polar(RB, TAIL_A);
  const tail = leaf(P, tx, ty, TAIL_A + 84, 15, 3.8) + leaf(P, tx, ty, TAIL_A + 56, 10.5, 3) + leaf(P, tx, ty, TAIL_A + 110, 9.5, 2.8);
  let studs = '';
  for (let a = 15; a < 360; a += 30) {
    if (a > 0 && a < 90) continue;
    const [x, y] = polar(79.4, a);
    studs += (a - 15) % 60 === 0 ? gem(x, y, 3.1, T.ruby, T, a) : pearl(x, y, 1.6, T);
  }
  let embers = '';
  [[110, 80.6], [160, 81], [215, 80.6], [262, 81], [310, 80.8], [352, 81.2]].forEach(([a, r], j) => { const [x, y] = polar(r, a); embers += j % 2 ? star4(x, y, 1.6, T.accent, 0.95) : dot(x, y, 0.9, T.ember, 0.95); });
  const [hx, hy] = polar(73.5, HEAD_A);
  const headG = `<g transform="translate(${hx} ${hy}) rotate(${HEAD_A})"><circle r="13" fill="url(#${P}o)"/><g transform="scale(0.45)">${head(T, P, h, true)}</g></g>`;
  return `${defs(T, P).replace('</defs>', `${extra}</defs>`)}<g transform="scale(${k})">${ring}${vine}${body}${claws}${tail}${studs}${embers}${headG}</g>`;
};

// điểm nhấn góc (28×28 nhô ra ngoài, lên-trái): dây leo cuộn + 3 lá + ngọc hổ phách
const accent = (T, P, h) => {
  const { gem, star4, dot } = h;
  const v = 'M1 1C-5 -1 -10 -5 -12 -11C-13.6 -16 -10 -20 -6 -19.4';
  const vine = `<path d="${v}" fill="none" stroke="${T.dark}" stroke-width="3.6" stroke-linecap="round"/><path d="${v}" fill="none" stroke="${T.main}" stroke-width="2.2" stroke-linecap="round"/><path d="${v}" fill="none" stroke="${T.light}" stroke-opacity="0.7" stroke-width="0.6" stroke-linecap="round" transform="translate(0 -0.5)"/>`;
  const leaves = leaf(P, -3, -3, -70, 17, 4.8) + leaf(P, -9, -9, -22, 14, 4.2) + leaf(P, -12, -14, -48, 11, 3.4) + stripe(P, -4, -3, -70, 8, 0.8);
  return `${defs(T, P)}${vine}${leaves}<circle cx="-3" cy="-3" r="7" fill="url(#${P}o)"/>${gem(-3, -3, 3.4, T.ruby, T)}${star4(-24, -4, 2.2, T.accent, 0.95)}${star4(-5, -25, 2, T.accent, 0.95)}${dot(-25, -14, 1, T.ember)}${dot(-15, -25, 1, T.ember)}`;
};

// ================= corner / edge / side / bottom =================
// 1 ngón vuốt hổ nằm dọc cạnh trên: ngón dày có vằn + móng ngà quắp xuống
const finger = (T, P) => {
  const body = `<path d="M9 2.4C20 1.4 32 2.2 41.4 4.6L41.4 10C32 11.6 20 12 9 11.2Z" fill="url(#${P}b)" ${sc(T, 0.7)}/>`;
  let st = '';
  [15, 22, 29, 36].forEach((x, i) => { st += `M${x - 1.5} 2.8L${x + 0.4} ${i % 2 ? 8 : 9.4}L${x + 1.8} 3Z`; });
  const lines = `<path d="${st}" fill="${T.stripe}" fill-opacity="0.88"/><path d="M10 4C22 3 32 3.6 40 5.4" fill="none" stroke="${T.light}" stroke-opacity="0.8" stroke-width="0.6"/>`;
  const talon = `<path d="M39.6 4.8C45.8 5.4 48 10.6 45 17.6C44.4 13.4 42.4 11 39.8 10Z" fill="${T.cream}" ${sc(T, 0.6)}/><path d="M41.2 6.2C44.4 7.4 45.2 10.8 44.4 13.6" fill="none" stroke="#fff" stroke-opacity="0.75" stroke-width="0.6"/>`;
  const talon2 = `<path d="M30 9.6C34.6 10.8 35.8 14.8 33.8 19.8C33.8 16.6 31.8 14.6 29.6 13.8Z" fill="${T.cream}" ${sc(T, 0.5)}/>`;
  return `${body}${lines}${talon2}${talon}`;
};

const corner = (T, P, h) => {
  const { gem, star4, dot } = h;
  const arms = `<g transform="scale(0.93 1)">${finger(T, P)}</g><g transform="matrix(0 0.93 1 0 0 0)">${finger(T, P)}</g>`;
  const leaves = leaf(P, 8, 8, 135, 21, 5.6) + leaf(P, 8, 8, 108, 14, 4) + leaf(P, 8, 8, 162, 14, 4);
  const dfs = defs(T, P).replace(`id="${P}e"`, `id="${P}ey"`);
  return `${dfs}${arms}<circle cx="8" cy="8" r="9" fill="url(#${P}o)"/>${leaves}${gem(8, 8, 5, T.ruby, T)}${star4(25, 25, 2, T.accent, 0.9)}${dot(30, 15, 0.9, T.ember, 0.9)}${dot(15, 30, 0.9, T.ember, 0.9)}`;
};

// đơn vị cạnh 44 (tâm x=0, +y = vào trong, ≤ 22): ấn tín vàng treo dưới nẹp + 2 lá + lá nhỏ ở mối nối bên phải
const edge = (T, P, h) => {
  const seal = `<path d="M0 7V11" stroke="${T.goldD}" stroke-width="1.1"/><path d="M-5.6 11H5.6V20.6H-5.6Z" fill="url(#${P}mt)" ${sc(T, 0.7)}/><path d="M-3.6 13H3.6V18.6H-3.6Z" fill="${T.void}" stroke="${T.goldL}" stroke-opacity="0.8" stroke-width="0.4"/>`
    + `<path d="M-2 14.4H2M-1.6 15.8H1.6M-2 17.2H2M0 14V17.6" stroke="${T.gold}" stroke-width="0.55" fill="none" stroke-linecap="round"/>`;
  return `${leaf(P, -6, 9, -125, 9.5, 2.8)}${leaf(P, 6, 9, 125, 9.5, 2.8)}${seal}${leaf(P, 22, 6, 150, 8, 2.4)}${h.dot(22, 6, 1, T.accent, 0.95)}`;
};

// cạnh bên (cao 100, ±15, nối khớp y=0/100): 4 mảnh vảy lục giác có vằn dọc xương sống + lá ra ngoài/vào trong + ngọc hổ phách giữa
const side = (T, P, h) => {
  const { gem, star4, dot } = h;
  let plates = '';
  [13, 37, 63, 87].forEach((y) => {
    plates += `<path d="M0 ${y - 10}L6.8 ${y - 5}L6.8 ${y + 5}L0 ${y + 10}L-6.8 ${y + 5}L-6.8 ${y - 5}Z" fill="url(#${P}b)" ${sc(T, 0.7)}/>`
      + `<path d="M-6.8 ${y - 3.4}L-1.8 ${y - 1.8}L-6.8 ${y - 0.4}ZM6.8 ${y + 1.6}L1.8 ${y + 3.2}L6.8 ${y + 4.6}Z" fill="${T.stripe}" fill-opacity="0.88"/>`
      + `<path d="M0 ${y - 10}L6.8 ${y - 5}L0 ${y - 3}Z" fill="#fff" fill-opacity="0.2"/><path d="M0 ${y - 6.6}L3.4 ${y - 3.6}" stroke="${T.light}" stroke-opacity="0.7" stroke-width="0.5" fill="none"/>`;
  });
  const leaves = leaf(P, 0, 25, -90, 13, 3.6) + leaf(P, 0, 75, 90, 13, 3.6) + leaf(P, 0, 25, 90, 7, 2.6) + leaf(P, 0, 75, -90, 7, 2.6);
  return `${defs(T, P)}${plates}${leaves}<circle cx="0" cy="50" r="9" fill="url(#${P}o)"/>${gem(0, 50, 4.2, T.ruby, T)}${star4(-9, 50, 1.8, T.accent, 0.9)}${star4(9, 50, 1.8, T.accent, 0.9)}${dot(-5, 3, 0.8, T.ember, 0.9)}${dot(5, 97, 0.8, T.ember, 0.9)}`;
};

// chân thẻ (y ∈ [-4,12], nửa rộng ≤ 70, đối xứng): cán cân vàng + 2 đĩa treo + lá dọc đòn + ngọc hổ phách giữa
const bottom = (T, P, h) => {
  const { gem, star4, dot } = h;
  const beam = 'M5 3.4C20 1.6 40 1.4 56 1.6';
  const half = `<path d="${beam}" fill="none" stroke="${T.dark}" stroke-width="4.6" stroke-linecap="round" opacity="0.65"/><path d="${beam}" fill="none" stroke="${T.gold}" stroke-width="3.2" stroke-linecap="round"/><path d="${beam}" fill="none" stroke="${T.goldL}" stroke-opacity="0.85" stroke-width="0.7" stroke-linecap="round" transform="translate(0 -0.9)"/>`
    + `<circle cx="56" cy="1.6" r="2.2" fill="url(#${P}mt)" stroke="${T.dark}" stroke-width="0.5"/>`
    + `<path d="M56 3.4L49.2 7.2M56 3.4L62.8 7.2" fill="none" stroke="${T.goldD}" stroke-width="0.7"/>`
    + `<path d="M48.4 7.2C49.4 10.8 52.4 11.5 56 11.5C59.6 11.5 62.6 10.8 63.6 7.2Z" fill="url(#${P}mt)" ${sc(T, 0.6)}/>${gem(56, 6.4, 2.3, T.ruby, T)}`
    + `${leaf(P, 18, 3.4, 168, 6.5, 1.9)}${leaf(P, 30, 2.6, 172, 6.5, 1.9)}${leaf(P, 42, 2.4, 168, 6, 1.8)}${dot(24, 0.6, 0.7, T.ember, 0.9)}${star4(36, -2, 1.3, T.accent, 0.95)}`;
  const centre = `${leaf(P, 0, 5.4, -58, 8, 2.4)}${leaf(P, 0, 5.4, 58, 8, 2.4)}<circle cx="0" cy="5.4" r="7" fill="url(#${P}o)"/>${gem(0, 5.6, 3.9, T.ruby, T)}`;
  return `${defs(T, P)}${half}<g transform="scale(-1 1)">${half}</g>${centre}`;
};

// ================= crest =================
// Đỉnh thẻ (x −80..80, chân y=36): Bệ Ngạn ngồi trên bệ đá, ấn tín vàng trước ngực, cán cân công lý sau lưng, quạt lá phía sau.
const crest = (T, P, h) => {
  const { gem, star4, dot } = h;
  const sym = (f) => `${f}<g transform="scale(-1 1)">${f}</g>`;
  let fan = `<circle cx="0" cy="-6" r="42" fill="url(#${P}o)"/>`;
  [[-78, 52], [-60, 54], [-40, 52], [40, 52], [60, 54], [78, 52]].forEach(([a, L]) => { fan += leaf(P, 0, 16, a, L, 9.4); });
  // cán cân sau lưng
  const bm = 'M-72 1.6C-40 -0.2 40 -0.2 72 1.6';
  const beam = `<path d="${bm}" fill="none" stroke="${T.dark}" stroke-width="6.4" stroke-linecap="round" opacity="0.7"/><path d="${bm}" fill="none" stroke="${T.gold}" stroke-width="4.4" stroke-linecap="round"/><path d="${bm}" fill="none" stroke="${T.goldL}" stroke-opacity="0.85" stroke-width="0.9" stroke-linecap="round" transform="translate(0 -1.1)"/>`;
  const end = sym(`<circle cx="72" cy="1.6" r="3.2" fill="url(#${P}mt)" stroke="${T.dark}" stroke-width="0.6"/><circle cx="71" cy="0.6" r="0.9" fill="#fff" fill-opacity="0.85"/>${leaf(P, 72, 0, 20, 12, 3.4)}${leaf(P, 72, 0, 50, 8.5, 2.6)}`
    + `<path d="M68 2.4L59.6 17M68 2.4L76.6 17" fill="none" stroke="${T.goldD}" stroke-width="0.8"/><path d="M58.8 17C60.4 24 64 26 68 26C72 26 75.6 24 77.2 17Z" fill="url(#${P}mt)" ${sc(T, 0.7)}/><path d="M60.4 18.4C62 22 65 23.6 68 23.8" fill="none" stroke="${T.goldL}" stroke-opacity="0.8" stroke-width="0.6"/>${gem(68, 15.2, 2.8, T.ruby, T)}`);
  // thân + vai có vằn
  const body = `<path d="M-24 30C-26 16 -20 6 -12 2L12 2C20 6 26 16 24 30Z" fill="url(#${P}b)" ${sc(T, 0.8)}/>`;
  let marks = '';
  [[-24, 14, 80], [-25, 21, 82], [-24, 27, 84]].forEach(([x, y, a]) => { marks += stripe(P, x, y, a, 11, 0.9) + stripe(P, -x, y, -a, 11, 0.9); });
  const detail = `${marks}<path d="M-14 6C-18 14 -18 22 -17 28" fill="none" stroke="${T.light}" stroke-opacity="0.7" stroke-width="0.8"/>`;
  // bệ đá + hoa văn dây leo
  const ped = `<path d="M-80 35.5C-80 31 -74 28 -66 27L66 27C74 28 80 31 80 35.5Z" fill="url(#${P}st)" ${sc(T, 0.9)}/><path d="M-76 29.6C-70 28 -60 27.6 -50 27.6" fill="none" stroke="${T.light}" stroke-opacity="0.7" stroke-width="0.8"/>`
    + sym(`<path d="M-72 33C-64 30.6 -58 35.4 -50 33C-42 30.6 -36 35.4 -28 33" fill="none" stroke="${T.light}" stroke-opacity="0.65" stroke-width="0.9" stroke-linecap="round"/>${leaf(P, -58, 33, -30, 5, 1.6)}${leaf(P, -36, 32.6, 30, 5, 1.6)}`);
  // ấn tín vàng trước ngực (núm + thân ấn), 2 vuốt trước hai bên
  const seal = `<path d="M-8 35.5V27.4H8V35.5Z" fill="url(#${P}mt)" ${sc(T, 0.8)}/><path d="M-3.4 27.4C-3.4 23.4 3.4 23.4 3.4 27.4Z" fill="url(#${P}mt)" ${sc(T, 0.7)}/><path d="M-5.4 29.6H5.4V34.4H-5.4Z" fill="${T.void}" stroke="${T.goldL}" stroke-opacity="0.8" stroke-width="0.4"/><path d="M-3 30.8H3M-2.4 32H2.4M-3 33.2H3M0 30.6V33.6" stroke="${T.gold}" stroke-width="0.6" fill="none" stroke-linecap="round"/>`;
  const claws = sym(`<g transform="translate(-17 25.4) rotate(180) scale(1.1)"><ellipse cx="0" cy="1.2" rx="4.6" ry="2.6" fill="url(#${P}b)" ${sc(T, 0.5)}/><path d="M-2.4 0Q-4 -4 -3 -8M0 0Q0 -4.4 0 -8.6M2.4 0Q4 -4 3 -8" fill="none" stroke="${T.cream}" stroke-width="1.6" stroke-linecap="round"/></g>`);
  const headG = `<g transform="translate(0 -3) scale(1.2)">${head(T, P, h)}</g>`;
  return `${defs(T, P)}${fan}${beam}${end}${body}${detail}${ped}${claws}${seal}${headG}${star4(-76, -8, 1.8, T.accent, 0.9)}${star4(76, -8, 1.8, T.accent, 0.9)}${dot(-44, -26, 1, T.ember)}${dot(44, -26, 1, T.ember)}`;
};

module.exports = { avatarFrame, accent, crest, corner, edge, side, bottom, emblem, emblemGhost, head, leaf, stripe, defs, arcCtrl };
