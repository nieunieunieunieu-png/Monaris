// ===== hoso/frame/cd_lienhoa/lotus.js — đoá sen kiểu tranh (cánh nhọn có gân, viền sáng): cánh sau cao → cánh bên nằm ngang → cánh giữa phía trước =====
// lotus(tier,{id,len}) -> mảnh SVG, gốc (0,0) = chân hoa, mọc LÊN (y âm), đối xứng x=0; nửa rộng ≈ 0.95*len, cao ≈ 0.9*len. Bậc i chỉ THÊM cánh/lớp/hạt so với bậc i−1.
// pet(cx,cy,deg,len,wid) -> path 1 cánh nhọn toạ độ tuyệt đối (deg xoay theo chiều kim đồng hồ từ hướng lên) — avatar.js dùng vẽ búp sen.
const f = (n) => Number(n.toFixed(2));
const FILL = { back: '#F07C9A', mid: '#F4929F', low: '#F7A9BC', front: '#FFC9D8' };
const LINE = '#FFF1F5', VEIN = '#D9526F';
// thứ tự vẽ sau → trước; span = nửa góc xoè, len = dài so với `len`, w = trọng số chia số cánh
const LAYER = { back: { span: 36, len: 0.92, w: 1 }, mid: { span: 58, len: 0.84, w: 1.2 }, low: { span: 70, len: 0.9, w: 1.3 }, front: { span: 13, len: 0.86, w: 0.8 } };
const ORDER = { 1: ['low'], 2: ['mid', 'low'], 3: ['back', 'mid', 'low'], 4: ['back', 'mid', 'low', 'front'] };

function layerCounts(total, layers) {
  const names = ORDER[layers] || ORDER[1];
  const sum = names.reduce((a, n) => a + LAYER[n].w, 0);
  const out = names.map((n) => Math.max(2, Math.round((total * LAYER[n].w) / sum)));
  out[out.length - 1] += total - out.reduce((a, b) => a + b, 0);
  return out;
}

const rot = (cx, cy, d, x, y) => { const r = (d * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r); return [cx + x * c - y * s, cy + x * s + y * c]; };
const pt = (cx, cy, d, x, y) => rot(cx, cy, d, x, y).map(f).join(' ');
function pet(cx, cy, d, L, w) {
  return `M${pt(cx, cy, d, 0, 0)}C${pt(cx, cy, d, -w, -0.3 * L)} ${pt(cx, cy, d, -0.6 * w, -0.8 * L)} ${pt(cx, cy, d, 0, -L)}C${pt(cx, cy, d, 0.6 * w, -0.8 * L)} ${pt(cx, cy, d, w, -0.3 * L)} ${pt(cx, cy, d, 0, 0)}Z`;
}
function vein(cx, cy, d, L, w) {
  return `M${pt(cx, cy, d, 0, -0.1 * L)}L${pt(cx, cy, d, 0, -0.8 * L)}M${pt(cx, cy, d, -0.05 * w, -0.1 * L)}Q${pt(cx, cy, d, -0.65 * w, -0.4 * L)} ${pt(cx, cy, d, -0.45 * w, -0.72 * L)}M${pt(cx, cy, d, 0.05 * w, -0.1 * L)}Q${pt(cx, cy, d, 0.65 * w, -0.4 * L)} ${pt(cx, cy, d, 0.45 * w, -0.72 * L)}`;
}

function pod(tier, len) {      // đài sen + hạt, đặt giữa cánh trước
  if (!tier.seeds) return '';
  const r = len * (tier.bigPod ? 0.17 : 0.14), ry = r * 0.55, cy = -len * 0.5;
  let s = `<ellipse cx="0" cy="${f(cy)}" rx="${f(r)}" ry="${f(ry)}" fill="${tier.main}" stroke="${tier.dark}" stroke-width="0.6"/>`;
  const n = tier.seeds, center = n % 2 === 1 && n >= 7 ? 1 : 0, m = n - center, inner = m <= 7 ? m : Math.ceil(m * 0.4), outer = m - inner;
  const pts = center ? [[0, 0]] : [];
  const ring = (cnt, rr, off) => { for (let k = 0; k < cnt; k += 1) { const a = off + (k * 2 * Math.PI) / cnt; pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); } };
  ring(inner, inner === m ? 0.6 : 0.38, -Math.PI / 2);
  ring(outer, 0.78, -Math.PI / 2 + Math.PI / Math.max(1, outer));
  for (const [px, py] of pts) s += `<circle cx="${f(px * r * 0.82)}" cy="${f(cy + py * ry * 0.82)}" r="${f(Math.max(0.6, r * 0.11))}" fill="${tier.dark}"/>`;
  return s;
}

function lotus(tier, { id = 'lotus', len = 18, pod: withPod = true } = {}) {
  let s = '';
  if (tier.glow) s += `<defs><radialGradient id="${id}-gl" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.85"/><stop offset="0.5" stop-color="${tier.light}" stop-opacity="0.45"/><stop offset="1" stop-color="${tier.main}" stop-opacity="0"/></radialGradient></defs><ellipse cx="0" cy="${f(-len * 0.55)}" rx="${f(len * 1.15)}" ry="${f(len * 0.75)}" fill="url(#${id}-gl)"/>`;
  const names = ORDER[tier.layers] || ORDER[1];
  const counts = layerCounts(tier.petals, tier.layers);
  names.forEach((nm, l) => {
    const { span, len: lr } = LAYER[nm], c = counts[l], ln = len * lr, w = ln * 0.27;
    let veins = '';
    for (let k = 0; k < c; k += 1) {
      const deg = c === 1 ? 0 : -span + (2 * span * k) / (c - 1);
      s += `<path d="${pet(0, 0, deg, ln, w)}" fill="${FILL[nm]}" stroke="${LINE}" stroke-width="${f(len * 0.012)}" stroke-linejoin="round"/>`;
      veins += vein(0, 0, deg, ln, w);
    }
    s += `<path d="${veins}" fill="none" stroke="${VEIN}" stroke-opacity="0.55" stroke-width="${f(len * 0.008)}" stroke-linecap="round"/>`;
  });
  return withPod ? s + pod(tier, len) : s;
}

module.exports = { lotus, layerCounts, pet };
