// ===== hoso/frame/shop_cuulong/motif.js — CỬU LONG CHÍ TÔN: avatar + accent (CLCT-1) =====
// avatarFrame(T, R, ctx): vành vàng kim đôi, 9 vị trí rồng cách đều 40° (k=1 ở đỉnh, theo chiều kim đồng hồ). Rồng đã sở hữu = đúng `emblem`
// của bộ đó (đầu hướng ra ngoài, màu nguyên tố) + đoạn thân nối sang vị trí kế; chưa có = đúng `emblemGhost` + chấm nguyên tố mờ.
// Vẽ ở R=70 rồi scale(R/70). Mọi nét nằm trong r ≤ 84. ctx thiếu/hỏng -> bản nền 0/9.
const kit = require('../../dragonKit');
const bonus = require('../../bonusKit');
const { TIERS } = require('./colors');

const n2 = kit.n;
const rad = (d) => (d * Math.PI) / 180;
const pol = (r, deg) => [r * Math.cos(rad(deg)), r * Math.sin(rad(deg))];
const arc = (r, a0, a1) => { const [x0, y0] = pol(r, a0); const [x1, y1] = pol(r, a1); return `M${n2(x0)} ${n2(y0)}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${n2(x1)} ${n2(y1)}`; };
const round2 = (s) => s.replace(/-?\d+\.\d{3,}/g, (m) => String(Number(Number(m).toFixed(2))));

// Tải lười motif/màu của từng bộ rồng; thiếu/hỏng -> null (vị trí đó chỉ hiện chấm nguyên tố mờ).
const cache = {};
function dragonMod(i) {
  if (cache[i] !== undefined) return cache[i];
  try {
    const id = kit.CL_IDS[i];
    const m = require(`../${id}/motif`);
    const T = require(`../${id}/colors`).TIERS[0];
    cache[i] = typeof m.emblem === 'function' && typeof m.emblemGhost === 'function' ? { m, T } : null;
  } catch (e) { cache[i] = null; }
  return cache[i];
}
// [cy, nửa cao] đo raster từ emblem từng bộ: để căn tâm hình học vào tâm vị trí và chọn tỉ lệ sao cho nét ≤ 7.6 mỗi phía theo bán kính.
const EMB = [[-6.7, 13.3], [1, 21.5], [-0.7, 24.1], [-1, 22], [2.5, 26], [-0.3, 23.5], [3.1, 28.9], [-1.1, 23.9], [-2.5, 29.5]];
const SLOT_R = 76.8;
const slotAngle = (k) => -90 + 40 * k; // k = 0..8
const ctxOf = (ctx) => {
  try { if (ctx && ctx.owned && typeof ctx.owned.has === 'function') return ctx; } catch (e) { /* bỏ qua */ }
  return { owned: new Set(), n: 0, mask: 0, maxed: false, full: false };
};

function avatarFrame(T, R = 70, rawCtx) {
  const c = ctxOf(rawCtx);
  const P = 'clav-';
  const D = T.dragons;
  const n = Number.isFinite(c.n) ? c.n : 0;
  let s = '<defs>'
    + `<linearGradient id="${P}rg" gradientUnits="userSpaceOnUse" x1="-84" y1="-84" x2="84" y2="84"><stop offset="0" stop-color="${T.light}"/><stop offset="0.3" stop-color="${T.main}"/><stop offset="0.55" stop-color="${T.dark}"/><stop offset="0.78" stop-color="${T.main}"/><stop offset="1" stop-color="${T.light}"/></linearGradient>`
    + `<radialGradient id="${P}pg"><stop offset="0" stop-color="#fff" stop-opacity="0.95"/><stop offset="0.5" stop-color="${T.gold3}"/><stop offset="1" stop-color="${T.gold2}"/></radialGradient>`;
  D.forEach((d, i) => { s += `<radialGradient id="${P}w${i}"><stop offset="0" stop-color="${d.main}" stop-opacity="0.55"/><stop offset="0.6" stop-color="${d.main}" stop-opacity="0.18"/><stop offset="1" stop-color="${d.main}" stop-opacity="0"/></radialGradient>`; });
  s += '</defs>';

  // --- nền vành: bệ tối + 2 viền vàng + gờ trong (luôn có, kể cả 0/9) ---
  s += `<circle r="77" fill="none" stroke="${T.plate}" stroke-width="14.4" stroke-opacity="0.92"/>`;
  s += `<circle r="82.8" fill="none" stroke="url(#${P}rg)" stroke-width="2.4"/><circle r="84" fill="none" stroke="${T.dark}" stroke-width="0.6" stroke-opacity="0.9"/>`;
  s += `<circle r="70.9" fill="none" stroke="url(#${P}rg)" stroke-width="2"/><circle r="69.9" fill="none" stroke="${T.dark}" stroke-width="0.6"/>`;
  s += `<circle r="77" fill="none" stroke="${T.light}" stroke-opacity="0.35" stroke-width="0.5" stroke-dasharray="1.2 2.4"/>`;
  // n ≥ 3: hàng vảy vàng mịn dọc vành
  if (n >= 3) s += `<circle r="80.2" fill="none" stroke="${T.gold3}" stroke-opacity="0.55" stroke-width="1.4" stroke-dasharray="2.2 1.2"/>`;
  // n ≥ 6: vòng nguyên tố quanh avatar (9 cung, màu rồng đã có; chưa có = vàng)
  if (n >= 6) D.forEach((d, i) => { const a = slotAngle(i); s += `<path d="${arc(70.4, a - 18, a + 18)}" fill="none" stroke="${c.owned.has(d.id) ? d.main : T.gold2}" stroke-width="1.5" stroke-linecap="round"/>`; });
  // đinh ngọc trai vàng giữa các vị trí rồng
  for (let k = 0; k < 9; k++) { const [x, y] = pol(77, slotAngle(k) + 20); s += `<circle cx="${n2(x)}" cy="${n2(y)}" r="2.3" fill="url(#${P}pg)" stroke="${T.dark}" stroke-width="0.5"/>`; }

  // --- 9 vị trí rồng ---
  for (let k = 0; k < 9; k++) {
    const d = D[k];
    const own = c.owned.has(d.id);
    const a = slotAngle(k);
    const [x, y] = pol(SLOT_R, a);
    if (own) {
      // đoạn thân nối sang vị trí kế (3 lớp: viền tối, thân nguyên tố, vệt sáng có vảy)
      s += `<path d="${arc(SLOT_R, a + 11, a + 29)}" fill="none" stroke="${d.dark}" stroke-width="4" stroke-linecap="round"/>`
        + `<path d="${arc(SLOT_R, a + 11, a + 29)}" fill="none" stroke="${d.main}" stroke-width="2.6" stroke-linecap="round"/>`
        + `<path d="${arc(SLOT_R - 0.6, a + 12, a + 28)}" fill="none" stroke="${d.light}" stroke-width="0.8" stroke-dasharray="1.1 1.2" stroke-opacity="0.9"/>`;
    }
    // đĩa nền + quầng
    s += `<circle cx="${n2(x)}" cy="${n2(y)}" r="7.2" fill="url(#${P}w${k})" fill-opacity="${own ? 1 : 0}"/>`
      + `<circle cx="${n2(x)}" cy="${n2(y)}" r="6.9" fill="${T.void}" stroke="${own ? d.light : T.gold2}" stroke-opacity="${own ? 0.95 : 0.4}" stroke-width="${own ? 1 : 0.7}"/>`;
    const mod = dragonMod(k);
    const [cy, hh] = EMB[k];
    const sc = Math.min(0.3, 6.4 / hh);
    const xf = `translate(${n2(x)} ${n2(y)}) rotate(${n2(a + 90)}) scale(${n2(sc)}) translate(0 ${n2(-cy)})`;
    if (mod) {
      s += `<g transform="${xf}">${own ? mod.m.emblem(mod.T, `${P}e${k}-`, bonus.helpers) : mod.m.emblemGhost(mod.T, `${P}g${k}-`, bonus.helpers)}</g>`;
    }
    if (!own) s += kit.ghostDot(x, y, d.main).replace('fill-opacity="0.3"', 'fill-opacity="0.45"');
  }

  // n = 9: thức tỉnh hoàn toàn — viền ngoài 9 cung nguyên tố + 4 tia sáng chéo
  if (n >= 9) {
    D.forEach((d, i) => { const a = slotAngle(i); s += `<path d="${arc(82.8, a - 20, a + 20)}" fill="none" stroke="${d.light}" stroke-width="1" stroke-opacity="0.85" stroke-linecap="round"/>`; });
    [45, 135, 225, 315].forEach((a) => { const [x, y] = pol(77, a); s += `<path d="M${n2(x)} ${n2(y - 4.5)}L${n2(x + 1.1)} ${n2(y - 1.1)}L${n2(x + 4.5)} ${n2(y)}L${n2(x + 1.1)} ${n2(y + 1.1)}L${n2(x)} ${n2(y + 4.5)}L${n2(x - 1.1)} ${n2(y + 1.1)}L${n2(x - 4.5)} ${n2(y)}L${n2(x - 1.1)} ${n2(y - 1.1)}Z" fill="#fff" fill-opacity="0.9"/>`; });
  }
  const k = R / 70;
  return round2(Math.abs(k - 1) < 1e-6 ? s : `<g transform="scale(${n2(k)})">${s}</g>`);
}

// Điểm nhấn 4 góc (28×28, gốc ở đỉnh góc thẻ, nhô ra ngoài về phía âm): ô thoi vàng + 2 tia vàng dọc 2 cạnh + ngọc nguyên tố.
// Mỗi góc gắn 1 rồng (TL Bồ Lao · TR Tù Ngưu · BL Bá Hạ · BR Bệ Ngạn, docs 9A.4): có rồng -> ngọc sáng màu nguyên tố, chưa có -> ngọc xám mờ.
const CORNER_DRAGON = [0, 1, 4, 5];
function accent(T, W, H, rawCtx) {
  const c = ctxOf(rawCtx);
  const P = 'clac-';
  const base = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.5" stop-color="${T.main}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient><g id="${P}c">`
    + `<path d="M-4 -4L-26 -2.2L-22 -4L-26 -5.8Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.5" stroke-linejoin="round"/>`
    + `<path d="M-4 -4L-2.2 -26L-4 -22L-5.8 -26Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.5" stroke-linejoin="round"/>`
    + `<path d="M-9 -2L2 -2L2 -9L-2 -13L-13 -13L-13 -2" fill="none"/>`
    + `<path d="M-9.5 -9.5L-4 -15L1.5 -9.5L-4 -4Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.7" stroke-linejoin="round"/>`
    + `<path d="M-4 -14L-2 -9.5L-4 -5.2L-6 -9.5Z" fill="${T.light}" fill-opacity="0.45"/>`
    + `<circle cx="-18" cy="-3.2" r="1.1" fill="${T.gold3}"/><circle cx="-3.2" cy="-18" r="1.1" fill="${T.gold3}"/><circle cx="-23.5" cy="-3.2" r="0.8" fill="${T.gold3}"/><circle cx="-3.2" cy="-23.5" r="0.8" fill="${T.gold3}"/>`
    + '</g></defs>';
  const gem = (i, x, y, sx, sy) => {
    const d = T.dragons[CORNER_DRAGON[i]];
    const own = c.owned.has(d.id);
    return `<g transform="translate(${x} ${y}) scale(${sx} ${sy})"><use href="#${P}c"/>`
      + (own ? `<circle cx="-4" cy="-9.5" r="5" fill="${d.main}" fill-opacity="0.35"/><circle cx="-4" cy="-9.5" r="2.4" fill="${d.main}" stroke="${d.light}" stroke-width="0.6"/><circle cx="-4.8" cy="-10.4" r="0.8" fill="#fff"/>`
        : `<circle cx="-4" cy="-9.5" r="2.8" fill="${T.void}" fill-opacity="0.7" stroke="${d.main}" stroke-opacity="1" stroke-width="0.9" stroke-dasharray="1.3 0.9"/><circle cx="-4" cy="-9.5" r="0.9" fill="${d.main}" fill-opacity="0.8"/>`)
      + '</g>';
  };
  return round2(base + gem(0, 0, 0, 1, 1) + gem(1, W, 0, -1, 1) + gem(2, 0, H, 1, -1) + gem(3, W, H, -1, -1));
}

module.exports = { avatarFrame, accent, SLOT_R, slotAngle, EMB };
