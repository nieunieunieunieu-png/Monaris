// ===== hoso/frame/shop_cuulong/panel.js — VIỀN 6 Ô CHỈ SỐ Chí Tôn (CLCT-4, docs 5.4 + 9A.5) =====
// panelFrame(key, x, y, w, h, opts, ctx) -> chuỗi SVG (toạ độ tuyệt đối của thẻ, gốc ô = (x,y)). KHÔNG vẽ nền đặc (card.js vẽ nền để ảnh nền hồ sơ lộ ra);
// tiêu đề / đường kẻ / số liệu do card.js vẽ phía TRÊN. Rồng/vảy chỉ ở viền ngoài 0..12px, 4 góc (≤ 26px) và dải mờ (≤ 0.12) sau chữ.
// n<3: viền vàng đơn + 4 ngọc góc (ngọc nguyên tố của 2 rồng gắn với ô; mờ nếu chưa có). n≥3: viền rồng (hàng vảy + góc vuốt + đĩa rồng đã sở hữu ở góc trên).
// Rồng chưa có ở ô (n≥3) -> chỉ làn khói mờ (opacity ≤ 0.12), KHÔNG vẽ ghost đầy đủ. Gắn rồng–ô (9A.5): tt=1+2 · rank=3+4 · bc=5+6 · act=7+9 · tk=8 (góc trên-phải) · ach=Cửu Long Châu (ngọc).
// Tiền tố id `clpn<key>-` (mỗi ô một tiền tố -> 6 ô trên cùng thẻ không trùng id, cũng không trùng avatar/crest/border/plate).
const { ctxOf, dragonDisc, goldGrad, round2, n2 } = require('./shared');
const { TIERS } = require('./colors');

// chỉ số rồng (0-based theo CL_IDS) -> góc ô. tl = góc trên-trái, tr = góc trên-phải.
const ASSIGN = {
  tt: { tl: 0, tr: 1 },
  rank: { tl: 2, tr: 3 },
  bc: { tl: 4, tr: 5 },
  act: { tl: 6, tr: 8 },
  tk: { tr: 7 },
  ach: {},
};
const KEYS = Object.keys(ASSIGN);

const cache = new Map();
const CACHE_MAX = 400;

function build(key, x, y, w, h, opts, c) {
  const T = TIERS[0];
  const D = T.dragons;
  const P = `clpn${key}-`;
  const hero = Boolean(opts.hero);
  const hasBg = Boolean(opts.hasBg);
  const as = ASSIGN[key] || {};
  const dragonMode = c.n >= 3;
  const mix = c.n >= 6;
  const L = 4; // lề trong của nẹp (nẹp vẽ ở inset 2)

  // ---- defs ----
  let defs = `<defs>${goldGrad(`${P}g`, T)}`;
  // dải nguyên tố chạy ngang cho vạch trong (n≥6): màu rồng đã có (lần lượt), chưa có = vàng
  const owned = D.filter((d) => c.owned.has(d.id));
  if (mix && owned.length) {
    const seq = owned.length === 1 ? [owned[0], owned[0]] : owned;
    defs += `<linearGradient id="${P}el" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${w}" y2="0">${seq.map((d, i) => `<stop offset="${n2(i / (seq.length - 1))}" stop-color="${d.main}"/>`).join('')}</linearGradient>`;
  }
  defs += `<linearGradient id="${P}wash" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.main}" stop-opacity="0.12"/><stop offset="1" stop-color="${T.main}" stop-opacity="0"/></linearGradient>`;
  defs += `<radialGradient id="${P}pr" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#ffffff"/><stop offset="0.35" stop-color="${T.light}"/><stop offset="1" stop-color="${T.gold2}"/></radialGradient>`;
  // vảy cạnh 18px (nhìn từ trên xuống), gốc ở đường nẹp, hướng vào trong +y
  defs += `<g id="${P}s"><path d="M-8 0Q0 11 8 0Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.5"/><path d="M-4.5 0Q0 5.5 4.5 0" fill="none" stroke="${T.light}" stroke-opacity="0.7" stroke-width="0.6"/></g>`;
  // góc vuốt 26×26 (góc trái-trên; các góc khác lật bằng transform)
  defs += `<g id="${P}k"><path d="M1 1H23L19 5H5V19L1 23Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.7" stroke-linejoin="round"/>`
    + `<path d="M5.5 5.5H17L14.5 8H8V14.5L5.5 17Z" fill="${T.void}" fill-opacity="0.55" stroke="${T.gold3}" stroke-width="0.5"/>`
    + `<path d="M23 1L27 2.5L23 5Z M1 23L2.5 27L5 23Z" fill="${T.gold3}" stroke="${T.dark}" stroke-width="0.4"/></g>`;
  defs += '</defs>';

  let s = '';
  const W = w; const H = h;

  // ---- dải mờ sau tiêu đề (chỉ khi KHÔNG có ảnh nền hồ sơ) ----
  if (!hasBg) s += `<rect x="6" y="6" width="${W - 12}" height="40" rx="10" fill="url(#${P}wash)"/>`;

  // ---- quầng ngoài (n=9 / hero) ----
  if (c.n >= 9 || hero) s += `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="15" fill="none" stroke="${T.gold3}" stroke-opacity="${hero ? 0.28 : 0.2}" stroke-width="${hero ? 7 : 5}"/>`;

  // ---- nẹp vàng 2 lớp ----
  const sw = hero ? 5.2 : 4;
  s += `<rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="14" fill="none" stroke="${T.dark}" stroke-width="${sw + 2}"/>`;
  s += `<rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="14" fill="none" stroke="url(#${P}g)" stroke-width="${sw}"/>`;
  s += `<rect x="0.8" y="0.8" width="${W - 1.6}" height="${H - 1.6}" rx="15.2" fill="none" stroke="${T.light}" stroke-opacity="0.75" stroke-width="0.8"/>`;
  // vạch trong
  const inner = L + (hero ? 6 : 4);
  s += `<rect x="${inner}" y="${inner}" width="${W - inner * 2}" height="${H - inner * 2}" rx="${hero ? 9 : 10}" fill="none" stroke="${mix && owned.length ? `url(#${P}el)` : T.gold3}" stroke-opacity="${mix && owned.length ? 0.9 : dragonMode ? 0.65 : 0.45}" stroke-width="${mix && owned.length ? 1.8 : 1.1}"${dragonMode ? '' : ' stroke-dasharray="6 5"'}/>`;
  if (hero) s += `<rect x="${inner + 5}" y="${inner + 5}" width="${W - (inner + 5) * 2}" height="${H - (inner + 5) * 2}" rx="6" fill="none" stroke="${T.light}" stroke-opacity="0.35" stroke-width="0.8"/>`;

  // ---- hàng vảy dọc 4 cạnh (n≥3), chừa 2 góc ----
  if (dragonMode) {
    const run = (len, fn) => { const span = len - 2 * 52; if (span < 20) return; const cnt = Math.max(1, Math.floor(span / 20)); const off = 52 + (span - (cnt - 1) * 20) / 2; for (let i = 0; i < cnt; i += 1) fn(n2(off + i * 20)); };
    run(W, (px) => { s += `<use href="#${P}s" transform="translate(${px} 4.5)"/>`; });
    run(W, (px) => { s += `<use href="#${P}s" transform="translate(${px} ${n2(H - 4.5)}) rotate(180)"/>`; });
    run(H, (py) => { s += `<use href="#${P}s" transform="translate(4.5 ${py}) rotate(-90)"/>`; });
    run(H, (py) => { s += `<use href="#${P}s" transform="translate(${n2(W - 4.5)} ${py}) rotate(90)"/>`; });
  }

  // ---- 4 góc vuốt ----
  s += `<use href="#${P}k"/>`;
  s += `<use href="#${P}k" transform="translate(${W} 0) scale(-1 1)"/>`;
  s += `<use href="#${P}k" transform="translate(0 ${H}) scale(1 -1)"/>`;
  s += `<use href="#${P}k" transform="translate(${W} ${H}) scale(-1 -1)"/>`;

  // ---- đinh giữa cạnh trên/dưới ----
  const stud = (cx, cy) => `<circle cx="${n2(cx)}" cy="${n2(cy)}" r="3" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.6"/><circle cx="${n2(cx - 0.8)}" cy="${n2(cy - 0.8)}" r="0.9" fill="#ffffff" fill-opacity="0.9"/>`;
  s += stud(W / 2, 2) + stud(W / 2, H - 2);
  if (dragonMode || c.n >= 1) { s += stud(2, H / 2) + stud(W - 2, H / 2); }

  // ---- góc trên: rồng của ô (hoặc ngọc) ----
  const CR = 16; const CX = 10;
  const corner = (side, kidx) => {
    const cx = side === 'tl' ? CX : W - CX;
    const sgn = side === 'tl' ? 1 : -1;
    if (kidx === undefined) return ''; // không có rồng gắn (vd tk góc trái): chỉ vuốt vàng
    const d = D[kidx];
    const own = c.owned.has(d.id);
    if (dragonMode) {
      if (own) { const disc = dragonDisc(T, P, kidx, c, cx, CX, side === 'tl' ? -32 : 32, CR, 11);
      // chỉ Bồ Lao (râu/bờm rộng ±44) cần cắt cho khỏi tràn đĩa; clipPath đắt nên các rồng khác bỏ qua (giảm thời gian render)
      return kidx === 0 ? `<clipPath id="${P}c${side}"><circle cx="${n2(cx)}" cy="${CX}" r="${CR + 3.5}"/></clipPath><g clip-path="url(#${P}c${side})">${disc}</g>` : disc; }
      
      // chưa có: làn khói mờ (≤ 0.12) cuộn từ góc + đĩa tối rỗng viền vàng mờ
      let t = `<circle cx="${n2(cx)}" cy="${CX}" r="${CR - 1}" fill="${T.void}" fill-opacity="0.3" stroke="${T.gold3}" stroke-opacity="0.28" stroke-width="1"/>`;
      t += `<path d="M${n2(cx)} ${CX + 10}C${n2(cx + sgn * 6)} ${CX + 24} ${n2(cx + sgn * 22)} ${CX + 20} ${n2(cx + sgn * 26)} ${CX + 34}C${n2(cx + sgn * 30)} ${CX + 46} ${n2(cx + sgn * 12)} ${CX + 48} ${n2(cx + sgn * 14)} ${CX + 38}" fill="none" stroke="${d.main}" stroke-opacity="0.12" stroke-width="3" stroke-linecap="round"/>`;
      t += `<path d="M${n2(cx + sgn * 10)} ${CX + 4}C${n2(cx + sgn * 26)} ${CX + 2} ${n2(cx + sgn * 36)} ${CX + 12} ${n2(cx + sgn * 48)} ${CX + 8}" fill="none" stroke="${d.main}" stroke-opacity="0.1" stroke-width="2.4" stroke-linecap="round"/>`;
      t += `<circle cx="${n2(cx)}" cy="${CX}" r="2.2" fill="${d.main}" fill-opacity="0.3"/>`;
      return t;
    }
    // n<3: ngọc nguyên tố (sáng khi có, xám nét đứt khi chưa)
    const gx = cx; const gy = CX;
    let t = `<circle cx="${n2(gx)}" cy="${gy}" r="9" fill="${T.void}" stroke="url(#${P}g)" stroke-width="2"/>`;
    if (own) t += `<circle cx="${n2(gx)}" cy="${gy}" r="11.5" fill="${d.main}" fill-opacity="0.25"/><circle cx="${n2(gx)}" cy="${gy}" r="6" fill="${d.main}" stroke="${d.light}" stroke-width="0.8"/><circle cx="${n2(gx - 1.8)}" cy="${n2(gy - 2)}" r="1.5" fill="#ffffff" fill-opacity="0.9"/>`;
    else t += `<circle cx="${n2(gx)}" cy="${gy}" r="5.5" fill="${d.main}" fill-opacity="0.12" stroke="${d.main}" stroke-opacity="0.9" stroke-width="1.3" stroke-dasharray="2 1.6"/><circle cx="${n2(gx)}" cy="${gy}" r="1.8" fill="${d.main}" fill-opacity="0.55"/>`;
    return t;
  };
  s += corner('tl', as.tl);
  if (key === 'ach') {
    // Cửu Long Châu ở góc trên-phải: 9 chấm nguyên tố sáng theo rồng đã có; n=9 thêm tia sao
    const px = W - CX; const py = CX;
    s += `<circle cx="${n2(px)}" cy="${py}" r="${c.full ? 17 : 14}" fill="${T.gold3}" fill-opacity="${c.full ? 0.3 : 0.18}"/>`;
    if (c.full) for (let i = 0; i < 8; i += 1) { const a = (i * Math.PI) / 4; s += `<path d="M${n2(px + Math.cos(a) * 12)} ${n2(py + Math.sin(a) * 12)}L${n2(px + Math.cos(a) * (i % 2 ? 19 : 23))} ${n2(py + Math.sin(a) * (i % 2 ? 19 : 23))}" stroke="${T.light}" stroke-opacity="0.9" stroke-width="1.4" stroke-linecap="round"/>`; }
    s += `<circle cx="${n2(px)}" cy="${py}" r="11" fill="${T.void}" stroke="url(#${P}g)" stroke-width="2"/><circle cx="${n2(px)}" cy="${py}" r="8.2" fill="url(#${P}pr)" fill-opacity="${c.n ? 0.95 : 0.5}"/>`;
    for (let i = 0; i < 9; i += 1) { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 9; const d = D[i]; const on = c.owned.has(d.id); s += `<circle cx="${n2(px + Math.cos(a) * 5.4)}" cy="${n2(py + Math.sin(a) * 5.4)}" r="${on ? 1.5 : 1}" fill="${on ? d.main : T.dark}" fill-opacity="${on ? 1 : 0.5}" stroke="${on ? d.light : 'none'}" stroke-width="0.3"/>`; }
    s += `<circle cx="${n2(px - 3)}" cy="${n2(py - 3.4)}" r="1.6" fill="#ffffff" fill-opacity="0.85"/>`;
  } else s += corner('tr', as.tr);

  // ---- n=9: sao 4 cánh ở 2 góc dưới ----
  if (c.full) {
    const star = (cx, cy) => `<path d="M${cx} ${cy - 7}L${cx + 1.6} ${cy - 1.6}L${cx + 7} ${cy}L${cx + 1.6} ${cy + 1.6}L${cx} ${cy + 7}L${cx - 1.6} ${cy + 1.6}L${cx - 7} ${cy}L${cx - 1.6} ${cy - 1.6}Z" fill="${T.light}" fill-opacity="0.9"/>`;
    s += star(n2(12), n2(H - 12)) + star(n2(W - 12), n2(H - 12));
  }
  return `<g>${defs}${s}</g>`;
}

function panelFrame(key, x, y, w, h, opts, rawCtx) {
  const o = opts || {};
  if (!KEYS.includes(key) || !(w > 60) || !(h > 60)) return null; // ô lạ/quá nhỏ -> card.js dùng viền cũ
  const c = ctxOf(rawCtx);
  const ck = `${key}|${Math.round(w)}|${Math.round(h)}|${o.hero ? 1 : 0}|${o.hasBg ? 1 : 0}|${c.mask | 0}|${c.n}`;
  let inner = cache.get(ck);
  if (inner === undefined) {
    inner = round2(build(key, 0, 0, Math.round(w), Math.round(h), o, c));
    if (cache.size >= CACHE_MAX) cache.clear();
    cache.set(ck, inner);
  }
  return `<g transform="translate(${n2(x)} ${n2(y)})">${inner}</g>`;
}

module.exports = { panelFrame, PANEL_ASSIGN: ASSIGN };
