// ===== hoso/frame/shop_cuulong/crest.js — ĐỈNH THẺ Chí Tôn (CLCT-3, phần C1) =====
// C1+C2: Cửu Long Châu (tâm (0,−22) r=14) + hào quang đổi theo mốc + bệ hoa sen vàng + HÀNG TRƯỚC 5 rồng (docs 9A.2):
//   F1 (−62,12) Bồ Lao · F2 (−33,16) Nhai Tí · F3 (0,16) Thao Thiết · F4 (33,16) Xi Vẫn · F5 (62,12) Tù Ngưu.
// Có rồng = ĐÚNG `emblem` của bộ đó + quầng nguyên tố; chưa có = `emblemGhost` + chấm nguyên tố mờ. C2: HÀNG SAU 4 rồng B1 (−52,−10) Bá Hạ · B2 (−27,−32) Phụ Hí · B3 (27,−32) Bệ Ngạn · B4 (52,−10) Toan Nghê (vẽ TRƯỚC hàng trước = nằm sau) + pháp trận (n≥6 vòng sao 9 cánh quanh châu; n=9 thêm vòng 9 cung nguyên tố + 9 ngọc).
// Hệ toạ độ: gốc giữa cạnh trên thẻ, x −80..80, chân y=36, thân nhô lên (y âm). Tiền tố id `clcr-`.
const kit = require('../../dragonKit');
const bonus = require('../../bonusKit');
const { dragonMod, ctxOf, goldGrad, round2, n2, RELIEF, reliefAttr } = require('./shared');
const { EMB } = require('./motif');
const { TIERS, frameMargins } = require('./colors');

// [chỉ số rồng 0..8, x, y, tỉ lệ tối đa] — tỉ lệ thật = min(max, 20/nửa cao) để đầu cao ≈ 40px.
const FRONT = [[0, -62, 12, 0.8], [2, -33, 16, 0.78], [7, 0, 16, 0.85], [3, 33, 16, 0.85], [1, 62, 12, 0.9]];
const BACK = [[4, -52, -10, 0.6], [6, -27, -32, 0.6], [5, 27, -32, 0.6], [8, 52, -10, 0.6]];
const PEARL = { x: 0, y: -22, r: 14 };
// n=9 (xếp lại): hai hàng dàn rộng hơn, chừa trống quanh châu. Thao Thiết (hàng trước, giữa) thu nhỏ để không che chân châu. Thứ tự rồng vẫn như 9A.2.
const FRONT9 = [[0, -78, 12, 0.8], [2, -39, 16, 0.78], [7, 0, 16, 0.62], [3, 39, 16, 0.85], [1, 78, 12, 0.9]];
const BACK9 = [[4, -76, -8, 0.64], [6, -46, -17, 0.64], [5, 46, -17, 0.64], [8, 76, -8, 0.64]];

function drawDragon(c, P, D, k, x, y, smax, back, bh) {
  const d = D[k];
  const isOwn = c.owned.has(d.id);
  const mod = dragonMod(k);
  const [cy, hh] = EMB[k];
  const sc = Math.min(smax, (bh || (back ? 13 : 20)) / hh);
  let o = `<circle cx="${x}" cy="${y}" r="${isOwn ? (back ? 16 : 24) : (back ? 12 : 18)}" fill="${d.main}" fill-opacity="${isOwn ? 0.26 : 0.06}"/>`;
  if (mod) o += `<g transform="translate(${x} ${y}) scale(${n2(sc)}) translate(0 ${n2(-cy)})">${isOwn ? mod.m.emblem(mod.T, `${P}e${k}-`, bonus.helpers) : mod.m.emblemGhost(mod.T, `${P}h${k}-`, bonus.helpers)}</g>`;
  if (!isOwn) o += kit.ghostDot(x, y, d.main).replace('fill-opacity="0.3"', 'fill-opacity="0.45"');
  return o;
}

// CLCT-7: hào quang là elip — rx như cũ, ry vừa đủ để mép trên tắt hẳn (alpha 0) ngay trước mép ảnh theo lề hiện hành (frameMargins), khỏi bị cắt thẳng.
function haloRy(n, c) {
  const M = frameMargins(c);
  const topLimit = 36 - (M.TOP_M + 8) / M.CREST_SCALE; // y cục bộ của mép ảnh
  const rx = n >= 9 ? 74 : n >= 6 ? 64 : 56;
  return Math.round(Math.max(30, Math.min(rx, PEARL.y + 8 - topLimit - 1)) * 100) / 100;
}

function crestTop(tier, W, H, rawCtx) {
  const T = TIERS[0];
  const c = ctxOf(rawCtx);
  const P = 'clcr-';
  const D = T.dragons;
  const own = D.filter((d) => c.owned.has(d.id));
  const n = c.n;
  const nine = n >= 9;
  // màu hào quang: 0 rồng = vàng; có rồng = vàng ở lõi, ngả sang màu các rồng đã có (tối đa 3 màu đại diện) ở rìa
  const rim = own.length ? [own[0], own[Math.floor((own.length - 1) / 2)], own[own.length - 1]].map((d) => d.main) : [T.gold2, T.gold2, T.gold2];
  let s = `<defs>${RELIEF}${goldGrad(`${P}g`, T, 0, 1)}`
    + `<radialGradient id="${P}h"><stop offset="0" stop-color="${T.gold3}" stop-opacity="${nine ? 0.55 : 0.7}"/><stop offset="0.45" stop-color="${T.main}" stop-opacity="${nine ? 0.2 : 0.32}"/><stop offset="0.75" stop-color="${rim[1]}" stop-opacity="${own.length ? 0.2 : 0.08}"/><stop offset="1" stop-color="${rim[2]}" stop-opacity="0"/></radialGradient>`
    + `<radialGradient id="${P}p" cx="0.38" cy="0.34" r="0.75"><stop offset="0" stop-color="#fff"/><stop offset="0.3" stop-color="${T.gold3}"/><stop offset="0.7" stop-color="${T.main}"/><stop offset="1" stop-color="${T.dark}"/></radialGradient>`
    + `<linearGradient id="${P}f" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${T.gold2}" stop-opacity="0.9"/><stop offset="1" stop-color="${T.gold3}" stop-opacity="0.15"/></linearGradient>`
    + `<g id="${P}t"><path d="M0 0Q-9 -20 0 -50Q9 -20 0 0Z" fill="url(#${P}f)" stroke="${T.gold3}" stroke-opacity="0.6" stroke-width="0.6"/><path d="M0 -4Q-2.6 -22 0 -42" fill="none" stroke="${T.light}" stroke-opacity="0.5" stroke-width="0.6"/></g></defs>`;

  // 1) hào quang lớn sau lưng
  s += `<ellipse cx="${PEARL.x}" cy="${PEARL.y + 8}" rx="${n >= 9 ? 74 : n >= 6 ? 64 : 56}" ry="${haloRy(n, c)}" fill="url(#${P}h)"/>`;
  // 2) quạt cánh sen vàng (9 cánh, toả từ (0,22)); n≥6 thêm lớp cánh thứ 2 nhỏ hơn
  for (let i = 0; i < 9; i++) { const a = -72 + i * 18; s += `<use href="#${P}t" transform="translate(0 22) rotate(${a}) scale(${n2(0.62 + 0.38 * Math.cos((a * Math.PI) / 180))})" opacity="${i === 4 ? 0.9 : 0.75}"/>`; }
  if (n >= 6) for (let i = 0; i < 8; i++) { const a = -63 + i * 18; s += `<use href="#${P}t" transform="translate(0 22) rotate(${a}) scale(0.5)" opacity="0.55"/>`; }
  // 2b) pháp trận (n≥6): vòng sao 9 cánh quanh châu; n=9: thêm vòng 9 cung nguyên tố + 9 ngọc
  if (n >= 6) {
    const cx = PEARL.x; const cy0 = PEARL.y;
    const star = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => { const a = -Math.PI / 2 + ((i * 4) % 9) * (2 * Math.PI / 9); return `${n2(cx + Math.cos(a) * 25)} ${n2(cy0 + Math.sin(a) * 25)}`; });
    s += `<circle cx="${cx}" cy="${cy0}" r="25" fill="none" stroke="${T.gold3}" stroke-opacity="0.55" stroke-width="0.8" stroke-dasharray="2 1.6"/>`
      + `<path d="M${star.join('L')}Z" fill="${T.gold3}" fill-opacity="0.07" stroke="${T.gold3}" stroke-opacity="0.6" stroke-width="0.7" stroke-linejoin="round"/>`;
  }
  if (n >= 9) {
    D.forEach((d, i) => {
      const a0 = -Math.PI / 2 + (i * 2 * Math.PI) / 9 - 0.3; const a1 = a0 + 0.6; const R = 34;
      s += `<path d="M${n2(PEARL.x + Math.cos(a0) * R)} ${n2(PEARL.y + Math.sin(a0) * R)}A${R} ${R} 0 0 1 ${n2(PEARL.x + Math.cos(a1) * R)} ${n2(PEARL.y + Math.sin(a1) * R)}" fill="none" stroke="${d.main}" stroke-width="2" stroke-linecap="round" stroke-opacity="0.95"/>`
        + `<circle cx="${n2(PEARL.x + Math.cos(a0 + 0.3) * 36.5)}" cy="${n2(PEARL.y + Math.sin(a0 + 0.3) * 36.5)}" r="1.5" fill="${d.light}"/>`;
    });
  }
  // 2c) HÀNG SAU 4 rồng (nằm sau hàng trước)
  (nine ? BACK9 : BACK).forEach(([k, x, y, smax]) => { s += drawDragon(c, P, D, k, x, y, smax, true, nine ? 15 : 0); });
  // 3) bệ vàng: dải cong dưới chân (y 22..36), có gờ sáng + đinh
  s += `<path d="M-80 36Q-78 26 -62 24Q-40 29 -20 27Q0 31 20 27Q40 29 62 24Q78 26 80 36Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.9" stroke-linejoin="round"/>`
    + `<path d="M-74 30Q-40 33 0 33Q40 33 74 30" fill="none" stroke="${T.light}" stroke-opacity="0.75" stroke-width="0.8"/>`;
  for (const x of [-62, -33, 0, 33, 62]) s += `<circle cx="${x}" cy="29" r="2.2" fill="${T.gold3}" stroke="${T.dark}" stroke-width="0.5"/>`;

  // 4) hàng trước 5 rồng
  (nine ? FRONT9 : FRONT).forEach(([k, x, y, smax]) => { s += drawDragon(c, P, D, k, x, y, smax, false); });

  // 5) Cửu Long Châu: quầng, vòng vàng 12 khía, hạt châu, điểm sáng; n=9 thêm 8 tia + vòng sáng ngoài
  const { x, y, r } = PEARL;
  if (n >= 9) {
    for (let i = 0; i < 8; i++) { const a = (i * 45 * Math.PI) / 180; const long = i % 2 === 0 ? 30 : 22; s += `<path d="M${n2(x + Math.cos(a) * (r + 2))} ${n2(y + Math.sin(a) * (r + 2))}L${n2(x + Math.cos(a + 0.09) * (r + 6))} ${n2(y + Math.sin(a + 0.09) * (r + 6))}L${n2(x + Math.cos(a) * (r + long))} ${n2(y + Math.sin(a) * (r + long))}L${n2(x + Math.cos(a - 0.09) * (r + 6))} ${n2(y + Math.sin(a - 0.09) * (r + 6))}Z" fill="${T.light}" fill-opacity="0.6"/>`; }
    s += `<circle cx="${x}" cy="${y}" r="${r + 5}" fill="none" stroke="${T.light}" stroke-opacity="0.45" stroke-width="0.9"/>`;
  }
  s += `<circle cx="${x}" cy="${y}" r="${r + 6}" fill="${T.gold3}" fill-opacity="${nine ? 0.3 : 0.28}"/>`;
  s += `<circle cx="${x}" cy="${y}" r="${r + 1.6}" fill="${T.void}" stroke="url(#${P}g)" stroke-width="2.6"/>`;
  s += `<circle cx="${x}" cy="${y}" r="${r + 1.6}" fill="none" stroke="${T.dark}" stroke-width="0.6" stroke-dasharray="1.2 2.2" transform="rotate(8 ${x} ${y})"/>`;
  s += `<circle cx="${x}" cy="${y}" r="${r - 2}" fill="url(#${P}p)" stroke="${T.dark}" stroke-width="0.6"/>`;
  // 9 chấm nguyên tố trong lòng châu (sáng khi rồng đã có)
  D.forEach((d, i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 9; const isOwn = c.owned.has(d.id); s += `<circle cx="${n2(x + Math.cos(a) * (r - 5.2))}" cy="${n2(y + Math.sin(a) * (r - 5.2))}" r="${isOwn ? 1.5 : 1}" fill="${isOwn ? d.light : T.dark}" fill-opacity="${isOwn ? 1 : 0.55}"/>`; });
  s += `<ellipse cx="${x - 4.2}" cy="${y - 5}" rx="3.8" ry="2.4" fill="#fff" fill-opacity="0.85" transform="rotate(-30 ${x - 4.2} ${y - 5})"/>`;
  return round2(s);
}
module.exports = { crestTop };
