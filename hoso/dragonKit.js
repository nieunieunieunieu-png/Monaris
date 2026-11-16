// ===== hoso/dragonKit.js — thư viện vẽ RỒNG dùng chung cho 9 bộ shop_cl_* + shop_cuulong (task L0) =====
// Nằm ở hoso/ (KHÔNG trong hoso/frame/) nên registry.js không quét nhầm. Mọi hàm trả MẢNH SVG tĩnh (không <svg>/<style>/<text>/animation),
// số ≤ 2 chữ số thập phân, id do bên gọi cấp qua tiền tố P (duy nhất toàn dự án). Màu lấy từ T = { main, light, dark, accent, ... }.
// Tái dùng helper cơ bản của bonusKit (petal, gem, dot, polar, mirror, star4...) để "ngôn ngữ vẽ" thống nhất.
const bonus = require('./bonusKit');

const n = (v) => Number(Number(v).toFixed(2));
const base = bonus.helpers || {};
const { petal, gem, dot, polar, mirror, star4, pearl, radial } = base;

// ---- hình học đường cong ----
// Mảng điểm điều khiển Bézier bậc 3 nối tiếp: [[x0,y0],[c1x,c1y],[c2x,c2y],[x1,y1],[c..],[c..],[x2,y2],...] (3k+1 điểm)
const cubic = (p0, p1, p2, p3, t) => {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
};
// Lấy mẫu chuỗi Bézier thành `per` điểm mỗi đoạn; trả [{x,y,nx,ny,t}] với (nx,ny) là pháp tuyến đơn vị, t ∈ [0,1] dọc chiều dài.
function sample(ctrl, per = 14) {
  const segs = (ctrl.length - 1) / 3;
  const pts = [];
  for (let s = 0; s < segs; s += 1) {
    for (let i = 0; i < per; i += 1) {
      if (s > 0 && i === 0) continue;
      const t = i / (per - 1);
      const [x, y] = cubic(ctrl[3 * s], ctrl[3 * s + 1], ctrl[3 * s + 2], ctrl[3 * s + 3], t);
      pts.push({ x, y });
    }
  }
  for (let i = 0; i < pts.length; i += 1) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    const l = Math.hypot(dx, dy) || 1;
    dx /= l; dy /= l;
    pts[i].nx = -dy; pts[i].ny = dx; pts[i].t = i / (pts.length - 1);
  }
  return pts;
}
// Đa giác "thon dần": bề rộng nội suy w0 → w1 (có thể truyền hàm profile(t) để phình ở giữa). Trả chuỗi path `d`.
function taperPath(ctrl, w0, w1, per = 14, profile) {
  const pts = sample(ctrl, per);
  const w = (t) => (profile ? profile(t) : w0 + (w1 - w0) * t) / 2;
  const L = pts.map((p) => `${n(p.x + p.nx * w(p.t))} ${n(p.y + p.ny * w(p.t))}`);
  const R = pts.map((p) => `${n(p.x - p.nx * w(p.t))} ${n(p.y - p.ny * w(p.t))}`).reverse();
  return `M${L.join('L')}L${R.join('L')}Z`;
}
// Đường tâm (polyline mượt dạng path) của chuỗi Bézier — dùng cho vệt sáng sống lưng / râu.
const spine = (ctrl) => {
  let d = `M${n(ctrl[0][0])} ${n(ctrl[0][1])}`;
  for (let i = 1; i < ctrl.length; i += 3) d += `C${n(ctrl[i][0])} ${n(ctrl[i][1])} ${n(ctrl[i + 1][0])} ${n(ctrl[i + 1][1])} ${n(ctrl[i + 2][0])} ${n(ctrl[i + 2][1])}`;
  return d;
};

// ---- defs gradient chuẩn của 1 con rồng (id theo P): body (3 tông), belly, glow ----
const dragonDefs = (T, P) => `<defs>`
  + `<linearGradient id="${P}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.45" stop-color="${T.main}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient>`
  + `<linearGradient id="${P}v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.light}" stop-opacity="0.95"/><stop offset="1" stop-color="${T.accent}" stop-opacity="0.85"/></linearGradient>`
  + `<radialGradient id="${P}o" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${T.accent}" stop-opacity="0.5"/><stop offset="0.6" stop-color="${T.main}" stop-opacity="0.16"/><stop offset="1" stop-color="${T.main}" stop-opacity="0"/></radialGradient>`
  + `</defs>`;
// Hào quang: vòng radialGradient mờ phía sau rồng.
const aura = (P, cx, cy, r) => `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="url(#${P}o)"/>`;

// ---- thân rồng: viền tối + thân gradient + bụng sáng + vảy xếp lớp + vệt sáng sống lưng ----
// opts: { w0, w1, profile, per, scaleEvery (mỗi k mẫu 1 hàng vảy), scaleSize }
function body(T, P, ctrl, opts = {}) {
  const { w0 = 14, w1 = 2, profile, per = 14, scaleEvery = 2, scaleSize = 1 } = opts;
  const d = taperPath(ctrl, w0, w1, per, profile);
  const pts = sample(ctrl, per);
  const wAt = (t) => (profile ? profile(t) : w0 + (w1 - w0) * t) / 2;
  let sc = '';
  for (let i = 1; i < pts.length - 1; i += scaleEvery) {
    const p = pts[i];
    const w = wAt(p.t);
    if (w < 1.4) continue;
    const s = Math.max(0.7, w * 0.45) * scaleSize;
    // một vảy hình vỏ sò hướng theo pháp tuyến: 3 vảy ngang thân, so le
    for (let k = -1; k <= 1; k += 1) {
      const off = k * w * 0.55 + ((i / scaleEvery) % 2 ? w * 0.27 : 0);
      if (Math.abs(off) > w * 0.8) continue;
      const x = p.x + p.nx * off;
      const y = p.y + p.ny * off;
      const ang = (Math.atan2(p.ny, p.nx) * 180) / Math.PI + 90;
      sc += `<path transform="translate(${n(x)} ${n(y)}) rotate(${n(ang)})" d="M${n(-s)} 0Q0 ${n(s * 1.5)} ${n(s)} 0" fill="none" stroke="${T.dark}" stroke-opacity="0.55" stroke-width="0.5" stroke-linecap="round"/>`;
    }
  }
  const belly = taperPath(ctrl, w0 * 0.34, w1 * 0.34, per, profile ? (t) => profile(t) * 0.34 : undefined);
  const hi = spine(ctrl);
  return `<path d="${d}" fill="url(#${P}b)" stroke="${T.dark}" stroke-width="0.9" stroke-linejoin="round"/>`
    + `<path d="${belly}" fill="url(#${P}v)" fill-opacity="0.55" transform="translate(0 0.6)"/>`
    + sc
    + `<path d="${hi}" fill="none" stroke="${T.light}" stroke-opacity="0.8" stroke-width="0.7" stroke-linecap="round" transform="translate(0 -0.8)"/>`;
}

// ---- chi tiết đầu ----
// Sừng cong thon: gốc (x,y), hướng a (độ, 0 = lên), dài len, rộng gốc w, cong curl (+/-).
const horn = (T, P, x, y, a, len, w, curl = 0.3) => {
  const c = len * curl;
  return `<path transform="translate(${n(x)} ${n(y)}) rotate(${n(a)})" d="M${n(-w / 2)} 0C${n(-w / 2 + c)} ${n(-len * 0.4)} ${n(c * 1.4)} ${n(-len * 0.8)} ${n(c * 2)} ${n(-len)}C${n(w / 2 + c * 0.8)} ${n(-len * 0.7)} ${n(w / 2)} ${n(-len * 0.3)} ${n(w / 2)} 0Z" fill="url(#${P}b)" stroke="${T.dark}" stroke-width="0.7" stroke-linejoin="round"/>`
    + `<path transform="translate(${n(x)} ${n(y)}) rotate(${n(a)})" d="M${n(-w / 4)} ${n(-len * 0.1)}C${n(c * 0.7)} ${n(-len * 0.4)} ${n(c * 1.2)} ${n(-len * 0.7)} ${n(c * 1.8)} ${n(-len * 0.93)}" fill="none" stroke="#fff" stroke-opacity="0.75" stroke-width="0.6" stroke-linecap="round"/>`;
};
// Râu: sợi cong thon dần (viền tối + lõi + vệt sáng) kết ngọc cuối râu nếu có `bead`.
const whisker = (T, ctrl, w = 1.4, bead) => {
  const d = spine(ctrl);
  const e = ctrl[ctrl.length - 1];
  return `<path d="${d}" fill="none" stroke="${T.dark}" stroke-width="${n(w + 1.2)}" stroke-linecap="round"/>`
    + `<path d="${d}" fill="none" stroke="${T.main}" stroke-width="${w}" stroke-linecap="round"/>`
    + `<path d="${d}" fill="none" stroke="${T.light}" stroke-opacity="0.8" stroke-width="${n(w * 0.3)}" stroke-linecap="round"/>`
    + (bead ? `<circle cx="${n(e[0])}" cy="${n(e[1])}" r="${n(bead.r || 1.8)}" fill="${bead.fill || T.accent}" stroke="${T.dark}" stroke-width="0.5"/><circle cx="${n(e[0] - 0.5)}" cy="${n(e[1] - 0.5)}" r="${n((bead.r || 1.8) * 0.3)}" fill="#fff"/>` : '');
};
// Mắt có hồn: quầng + tròng gradient + đồng tử dọc + chấm sáng trắng. s = bán kính tròng.
const eye = (T, P, x, y, s = 3.4, iris = T.accent, tilt = -20) => `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(tilt)})">`
  + `<circle r="${n(s * 1.5)}" fill="url(#${P}o)"/>`
  + `<path d="M${n(-s * 1.3)} ${n(s * 0.35)}C${n(-s * 0.6)} ${n(-s)} ${n(s * 0.9)} ${n(-s * 1.1)} ${n(s * 1.4)} ${n(-s * 0.2)}C${n(s * 0.6)} ${n(s * 0.9)} ${n(-s * 0.6)} ${n(s * 1.1)} ${n(-s * 1.3)} ${n(s * 0.35)}Z" fill="${iris}" stroke="${T.dark}" stroke-width="0.6" stroke-linejoin="round"/>`
  + `<ellipse cx="${n(s * 0.1)}" cy="0" rx="${n(s * 0.22)}" ry="${n(s * 0.7)}" fill="#1a0a00"/><circle cx="${n(-s * 0.35)}" cy="${n(-s * 0.3)}" r="${n(s * 0.22)}" fill="#fff"/></g>`;
// Vuốt 3 móng quắp: gốc (x,y), hướng a, kích thước s.
const claw = (T, P, x, y, a = 0, s = 1) => {
  let t = '';
  [-1, 0, 1].forEach((k) => { t += `<path d="M${n(k * 2.4)} 0Q${n(k * 5 + 2)} ${n(-4)} ${n(k * 4.4 + 4)} ${n(-8)}Q${n(k * 2.6 + 1.2)} ${n(-4.4)} ${n(k * 0.6 + 0.4)} 0Z" fill="#FFFBEA" stroke="${T.dark}" stroke-width="0.5" stroke-linejoin="round"/>`; });
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(a)}) scale(${n(s)})"><ellipse cx="0" cy="1.2" rx="4.6" ry="2.6" fill="url(#${P}b)" stroke="${T.dark}" stroke-width="0.6"/>${t}</g>`;
};
// Hạt châu rồng ngậm: quầng + hạt gradient + điểm sáng.
const orb = (P, T, x, y, r, col) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r * 2)}" fill="url(#${P}o)"/><circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${col || T.accent}" stroke="${T.dark}" stroke-width="0.6"/><circle cx="${n(x - r * 0.35)}" cy="${n(y - r * 0.35)}" r="${n(r * 0.32)}" fill="#fff" fill-opacity="0.9"/>`;
// Lặp vảy/hạt theo cung: fn(x, y, θ, i) — bọc `radial` của bonusKit.
const ring = (count, r, fn, start = 0) => radial(count, r, fn, start);

// ---- bóng rồng (rồng chưa sở hữu): từ MỘT chuỗi path, đổi sang xám tối, nét đứt mảnh, opacity ≤ 0.3 ----
const ghost = (pathD, opacity = 0.28) => `<g opacity="${opacity}"><path d="${pathD}" fill="#8A8F9C" stroke="#C7CBD6" stroke-width="0.8" stroke-dasharray="2 1.6" stroke-linejoin="round"/></g>`;
// Chấm nguyên tố mờ kèm bóng rồng.
const ghostDot = (x, y, col) => `<circle cx="${n(x)}" cy="${n(y)}" r="2" fill="${col}" fill-opacity="0.3"/>`;


// Vây/gai lưng: dọc 1 phía của chuỗi Bézier (side = +1/-1 theo pháp tuyến), mỗi `every` mẫu 1 gai, to ở đầu nhỏ dần về đuôi.
function dorsal(T, ctrl, { every = 3, side = 1, size = 9, per = 22, fill, from = 0.08, to = 0.95 } = {}) {
  const pts = sample(ctrl, per);
  let out = '';
  for (let i = 0; i < pts.length; i += every) {
    const p = pts[i];
    if (p.t < from || p.t > to) continue;
    const ang = (Math.atan2(p.ny * side, p.nx * side) * 180) / Math.PI + 90;
    const len = size * (1.1 - p.t * 0.6);
    out += petal(p.x, p.y, ang + side * 10, len, len * 0.32, fill || T.accent, T);
  }
  return out;
}
// Chi (tay/chân): đoạn thon từ (x0,y0) tới (x1,y1) cong theo `bend`, kết vuốt 3 móng ở đầu mút. Gắn VÀO thân (x0,y0 nằm trên thân).
function limb(T, P, [x0, y0], [x1, y1], bend = 14, w = 9) {
  const mx = (x0 + x1) / 2; const my = (y0 + y1) / 2;
  const dx = x1 - x0; const dy = y1 - y0; const l = Math.hypot(dx, dy) || 1;
  const c = [[x0, y0], [mx - (dy / l) * bend, my + (dx / l) * bend], [mx + (dx / l) * 2, my + (dy / l) * 2], [x1, y1]];
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  return `<path d="${taperPath(c, w, w * 0.45, 10)}" fill="url(#${P}b)" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/>` + claw(T, P, x1, y1, ang + 180, 1.6);
}
// ---- ngữ cảnh thức tỉnh (hợp đồng 5.7) ----
// ids: 9 id shop_cl_* theo thứ tự bit. owned: mảng/Set id. Trả { owned:Set, n, mask, maxed, full } — hỏng/thiếu => n=0.
const CL_IDS = ['shop_cl_bolao', 'shop_cl_tunguu', 'shop_cl_nhaitri', 'shop_cl_xivan', 'shop_cl_baha', 'shop_cl_bean', 'shop_cl_phuhi', 'shop_cl_thaotiet', 'shop_cl_toanghe'];
function makeCtx(owned, maxed = false) {
  try {
    const set = new Set([...(owned || [])].filter((id) => CL_IDS.includes(id)));
    let mask = 0;
    CL_IDS.forEach((id, i) => { if (set.has(id)) mask |= 1 << i; });
    return { owned: set, n: set.size, mask, maxed: !!maxed, full: set.size === 9 };
  } catch (e) {
    return { owned: new Set(), n: 0, mask: 0, maxed: false, full: false };
  }
}
// Mốc lề theo n (docs 9A.6).
const marginTier = (nn) => (nn >= 9 ? 3 : nn >= 6 ? 2 : nn >= 3 ? 1 : 0);

module.exports = {
  n, sample, taperPath, dorsal, limb, spine, dragonDefs, aura, body, horn, whisker, eye, claw, orb, ring, ghost, ghostDot,
  petal, gem, dot, polar, mirror, star4, pearl, CL_IDS, makeCtx, marginTier,
};
