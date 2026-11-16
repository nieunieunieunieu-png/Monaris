// ===== hoso/frame/shop_cuulong/plate.js — BẢNG TÊN + TRANG TRÍ ĐẦU THẺ Chí Tôn (CLCT-5, docs 5.3 mốc 9/9) =====
// namePlate(tier, x, y, w, ctx): dải vàng kim dưới tên (baseline tên = y; dải ở y+16) + sao cạnh dòng "HỒ SƠ THÀNH VIÊN". 9 hạt dọc dải = 9 rồng (sáng màu nguyên tố khi đã có).
//   n=9: thêm 2 rồng chầu hai đầu dải (đúng emblem Bồ Lao trái · Thao Thiết phải, trong đĩa vàng) + ngọc châu thay sao.
// headTrim(tier, W, headH, bar, ctx): ornament đường chia bìa|thân + hai đầu thanh EXP. ctx.maxed (đã tối đa cấp): thanh EXP đổi sang DẢI MÀU các rồng đã có (đủ 9 = 9 nguyên tố).
//   n=9: đầu thanh EXP ngậm rồng (đĩa rồng nhỏ) + châu giữa đường chia. Thiếu/hỏng ctx -> bản nền (n=0) vẫn hợp lệ.
// Tiền tố id: namePlate `clplN-`, headTrim `clplH-` (không trùng avatar clav-, crest clcr-, border clbd-, panel clpn<key>-). Không vẽ chữ (tên/EXP do card.js vẽ).
const { ctxOf, dragonDisc, goldGrad, round2, n2 } = require('./shared');
const { TIERS } = require('./colors');

const cache = new Map();
const memo = (k, fn) => { let v = cache.get(k); if (v === undefined) { v = round2(fn()); if (cache.size > 300) cache.clear(); cache.set(k, v); } return v; };
const dm = (cx, cy, r, fill, stroke, sw = 1) => `<path d="M${n2(cx)} ${n2(cy - r)}L${n2(cx + r)} ${n2(cy)}L${n2(cx)} ${n2(cy + r)}L${n2(cx - r)} ${n2(cy)}Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
const bead = (T, P, cx, cy, d, own, r = 3.6) => (own
  ? `<circle cx="${n2(cx)}" cy="${n2(cy)}" r="${r + 1.6}" fill="${d.main}" fill-opacity="0.3"/><circle cx="${n2(cx)}" cy="${n2(cy)}" r="${r}" fill="${d.main}" stroke="${d.light}" stroke-width="0.7"/><circle cx="${n2(cx - 1)}" cy="${n2(cy - 1.1)}" r="1" fill="#ffffff" fill-opacity="0.9"/>`
  : `<circle cx="${n2(cx)}" cy="${n2(cy)}" r="${r}" fill="${T.void}" stroke="${T.gold3}" stroke-opacity="0.45" stroke-width="0.9"/><circle cx="${n2(cx)}" cy="${n2(cy)}" r="1.3" fill="${d.main}" fill-opacity="0.4"/>`);

function namePlate(_tier, x, y, w, rawCtx) {
  const c = ctxOf(rawCtx); const T = TIERS[0]; const D = T.dragons;
  return memo(`N|${Math.round(x)}|${Math.round(y)}|${Math.round(w)}|${c.mask | 0}`, () => {
    const P = 'clplN-'; const by = y + 16;
    const full = c.n >= 9; const pad = full ? 22 : 10; // chừa chỗ rồng chầu ở 2 đầu
    const x0 = x + pad; const x1 = x + w - pad; const len = Math.max(60, x1 - x0);
    let s = `<defs>${goldGrad(`${P}g`, T, 1, 0)}<linearGradient id="${P}l" gradientUnits="userSpaceOnUse" x1="${n2(x0)}" y1="0" x2="${n2(x1)}" y2="0"><stop offset="0" stop-color="${T.gold3}" stop-opacity="0.2"/><stop offset="0.12" stop-color="${T.light}"/><stop offset="0.5" stop-color="${T.main}"/><stop offset="0.88" stop-color="${T.gold2}"/><stop offset="1" stop-color="${T.gold2}" stop-opacity="0.2"/></linearGradient></defs>`;
    // dải chính (thon hai đầu) + sợi mảnh trên/dưới
    s += `<path d="M${n2(x0)} ${by}L${n2(x0 + 14)} ${by - 3}H${n2(x1 - 14)}L${n2(x1)} ${by}L${n2(x1 - 14)} ${by + 3}H${n2(x0 + 14)}Z" fill="url(#${P}l)" stroke="${T.dark}" stroke-width="0.7" stroke-linejoin="round"/>`;
    s += `<rect x="${n2(x0 + 30)}" y="${by + 5}" width="${n2(len - 60)}" height="1" fill="url(#${P}l)" fill-opacity="0.65"/>`;
    s += `<rect x="${n2(x0 + 30)}" y="${by - 6}" width="${n2(len - 60)}" height="1" fill="url(#${P}l)" fill-opacity="0.65"/>`;
    s += `<path d="M${n2(x0 + 16)} ${by - 1}H${n2(x1 - 16)}" stroke="#ffffff" stroke-opacity="0.45" stroke-width="0.8"/>`;
    // 9 hạt = 9 rồng, đều dọc dải
    for (let i = 0; i < 9; i += 1) s += bead(T, P, x0 + 24 + ((len - 48) * i) / 8, by, D[i], c.owned.has(D[i].id), 3.4);
    // đầu dải: thoi vàng (n<9) hoặc rồng chầu (n=9)
    if (full) {
      s += dragonDisc(T, P, 0, c, x - 6, by, -90, 10, 8) + dragonDisc(T, P, 7, c, x + w - 12, by, 90, 10, 8);
    } else {
      s += dm(x0 - 2, by, 7, `url(#${P}g)`, T.dark, 1.2) + dm(x0 - 2, by, 2.6, '#ffffff', 'none', 0).replace('fill="#ffffff"', 'fill="#ffffff" fill-opacity="0.8"');
      s += dm(x1 + 2, by, 5, `url(#${P}g)`, T.dark, 1.1);
    }
    // sao 4 cánh (n<9) / ngọc châu (n=9) cạnh dòng "HỒ SƠ THÀNH VIÊN" (baseline chữ y-54, bên trái x)
    const ix = x - 18; const iy = y - 60; const r = full ? 11 : 9;
    if (full) {
      s += `<circle cx="${n2(ix)}" cy="${n2(iy)}" r="14" fill="${T.gold3}" fill-opacity="0.28"/>`;
      for (let i = 0; i < 8; i += 1) { const a = (i * Math.PI) / 4; const l = i % 2 ? 14 : 18; s += `<path d="M${n2(ix + Math.cos(a) * 9)} ${n2(iy + Math.sin(a) * 9)}L${n2(ix + Math.cos(a) * l)} ${n2(iy + Math.sin(a) * l)}" stroke="${T.light}" stroke-opacity="0.9" stroke-width="1.3" stroke-linecap="round"/>`; }
      s += `<circle cx="${n2(ix)}" cy="${n2(iy)}" r="8" fill="${T.void}" stroke="url(#${P}g)" stroke-width="1.8"/><circle cx="${n2(ix)}" cy="${n2(iy)}" r="5.6" fill="${T.main}"/><circle cx="${n2(ix - 1.8)}" cy="${n2(iy - 2)}" r="1.8" fill="#ffffff" fill-opacity="0.9"/>`;
    } else {
      s += `<path d="M${ix} ${iy - r}Q${ix} ${iy} ${ix + r} ${iy}Q${ix} ${iy} ${ix} ${iy + r}Q${ix} ${iy} ${ix - r} ${iy}Q${ix} ${iy} ${ix} ${iy - r}Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="1.2" stroke-linejoin="round"/>`;
    }
    return s;
  });
}

function headTrim(_tier, W, headH, bar, rawCtx) {
  const c = ctxOf(rawCtx); const T = TIERS[0]; const D = T.dragons;
  const ownedD = D.filter((d) => c.owned.has(d.id));
  const maxed = Boolean(c.maxed);
  const bk = bar ? `${Math.round(bar.x)}|${Math.round(bar.y)}|${Math.round(bar.w)}|${Math.round(bar.h)}` : '-';
  return memo(`H|${Math.round(W)}|${Math.round(headH)}|${bk}|${c.mask | 0}|${maxed ? 1 : 0}`, () => {
    const P = 'clplH-'; const full = c.n >= 9; const cx = W / 2;
    let s = `<defs>${goldGrad(`${P}g`, T)}`;
    if (bar && maxed && ownedD.length) {
      const seq = ownedD.length === 1 ? [ownedD[0], ownedD[0]] : ownedD;
      s += `<linearGradient id="${P}x" gradientUnits="userSpaceOnUse" x1="${n2(bar.x)}" y1="0" x2="${n2(bar.x + bar.w)}" y2="0">${seq.map((d, i) => `<stop offset="${n2(i / (seq.length - 1))}" stop-color="${d.main}"/>`).join('')}</linearGradient>`;
    }
    s += '</defs>';
    // đường chia: thoi vàng lớn giữa + thoi nhỏ dần + vạch sáng; n≥3 thêm cánh vảy, n=9 châu
    s += dm(cx, headH, 10, `url(#${P}g)`, T.dark, 1.4) + dm(cx, headH, 4.2, '#ffffff', 'none', 0).replace('fill="#ffffff"', 'fill="#ffffff" fill-opacity="0.85"');
    for (const sg of [-1, 1]) {
      s += dm(cx + sg * 34, headH, 5.5, `url(#${P}g)`, T.dark, 1.2) + dm(cx + sg * 58, headH, 3.4, T.main, T.dark, 1.1);
      s += `<rect x="${n2(sg > 0 ? cx + 66 : cx - 126)}" y="${headH - 1}" width="60" height="2" rx="1" fill="${T.light}" fill-opacity="0.75"/>`;
      if (c.n >= 3) s += `<path d="M${n2(cx + sg * 70)} ${headH - 5}Q${n2(cx + sg * 90)} ${headH - 12} ${n2(cx + sg * 112)} ${headH - 4}M${n2(cx + sg * 70)} ${headH + 5}Q${n2(cx + sg * 90)} ${headH + 12} ${n2(cx + sg * 112)} ${headH + 4}" fill="none" stroke="${T.gold3}" stroke-opacity="0.8" stroke-width="1.2"/>`;
      if (c.n >= 6) s += dm(cx + sg * 122, headH, 3, T.gold3, T.dark, 0.8);
    }
    if (full) {
      s += `<circle cx="${n2(cx)}" cy="${headH}" r="17" fill="${T.gold3}" fill-opacity="0.25"/>`;
      for (let i = 0; i < 9; i += 1) { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 9; s += `<circle cx="${n2(cx + Math.cos(a) * 14)}" cy="${n2(headH + Math.sin(a) * 14)}" r="2.2" fill="${D[i].main}" stroke="${D[i].light}" stroke-width="0.5"/>`; }
      s += `<circle cx="${n2(cx)}" cy="${headH}" r="8.5" fill="${T.void}" stroke="url(#${P}g)" stroke-width="2"/><circle cx="${n2(cx)}" cy="${headH}" r="6" fill="${T.main}"/><circle cx="${n2(cx - 2)}" cy="${n2(headH - 2.2)}" r="2" fill="#ffffff" fill-opacity="0.9"/>`;
    }
    // thanh EXP
    if (bar) {
      const my = bar.y + bar.h / 2;
      if (maxed && ownedD.length) {
        s += `<rect x="${n2(bar.x + 2)}" y="${n2(bar.y + 2)}" width="${n2(bar.w - 4)}" height="${n2(bar.h - 4)}" rx="${n2((bar.h - 4) / 2)}" fill="url(#${P}x)"/>`;
        s += `<rect x="${n2(bar.x + 8)}" y="${n2(bar.y + 3.4)}" width="${n2(bar.w - 16)}" height="2.4" rx="1.2" fill="#ffffff" fill-opacity="0.4"/>`;
      }
      for (const t of [0.25, 0.5, 0.75]) s += `<rect x="${n2(bar.x + 2 + (bar.w - 4) * t - 0.75)}" y="${n2(bar.y + 3)}" width="1.5" height="${n2(bar.h - 6)}" fill="#ffffff" fill-opacity="${maxed ? 0.35 : 0.28}"/>`;
      if (full) {
        s += dragonDisc(T, P, 3, c, bar.x - 6, my, -90, 12, 9) + dragonDisc(T, P, 2, c, bar.x + bar.w + 6, my, 90, 12, 9);
      } else {
        s += dm(bar.x - 2, my, 8.5, `url(#${P}g)`, T.dark, 1.3) + dm(bar.x + bar.w + 2, my, 8.5, `url(#${P}g)`, T.dark, 1.3);
        s += dm(bar.x - 2, my, 3.2, '#ffffff', 'none', 0).replace('fill="#ffffff"', 'fill="#ffffff" fill-opacity="0.8"') + dm(bar.x + bar.w + 2, my, 3.2, '#ffffff', 'none', 0).replace('fill="#ffffff"', 'fill="#ffffff" fill-opacity="0.8"');
      }
    }
    return s;
  });
}

module.exports = { namePlate, headTrim };
