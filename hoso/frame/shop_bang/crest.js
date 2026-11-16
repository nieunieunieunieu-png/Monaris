// ===== hoso/frame/shop_bang/crest.js — ĐỈNH THẺ: vuốt rồng băng ôm tinh thể tuyết 6 cánh =====
// Hình học: gốc giữa cạnh trên; x ∈ [-72, 72], y ∈ [2, 36]; chân đỉnh chạm y=36; đối xứng quanh x=0.
const T = require('./colors').TIERS[0];
const P = 'shop_bang-crest-';
const n = (v) => Number(v.toFixed(2));
function crestTop(_tier, W, H) {
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.5" stop-color="${T.main}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient><radialGradient id="${P}r" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${T.accent}" stop-opacity="0.8"/><stop offset="1" stop-color="${T.main}" stop-opacity="0"/></radialGradient></defs>`;
  const cx = 0, cy = 17, r = 14;
  // tuyết 6 cánh: thân + nhánh chữ V
  let arms = '', tips = '';
  for (let i = 0; i < 6; i++) {
    const t = (Math.PI / 3) * i - Math.PI / 2, c = Math.cos(t), s = Math.sin(t);
    const bx = cx + c * r * 0.62, by = cy + s * r * 0.62;
    arms += `M${cx} ${cy}L${n(cx + c * r)} ${n(cy + s * r)}`;
    for (const sg of [-1, 1]) {
      const a = t + sg * 0.75;
      arms += `M${n(bx)} ${n(by)}L${n(bx + Math.cos(a) * 5)} ${n(by + Math.sin(a) * 5)}`;
    }
    tips += `${i ? 'L' : 'M'}${n(cx + c * 6)} ${n(cy + s * 6)}`;
  }
  const flake = `<circle cx="${cx}" cy="${cy}" r="19" fill="url(#${P}r)"/><path d="${arms}" fill="none" stroke="${T.accent}" stroke-width="2.2" stroke-linecap="round"/><path d="${arms}" fill="none" stroke="${T.main}" stroke-width="0.8" stroke-linecap="round"/><path d="${tips}Z" fill="${T.light}" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/><circle cx="${cx}" cy="${cy}" r="2" fill="${T.accent}"/>`;
  // vuốt rồng (nửa trái) ôm lấy tinh thể; nửa phải lật gương
  const claw = `<path d="M-72 36C-70 25-57 22-45 26C-35 29-27 24-21 14L-17 6L-16 16C-18 28-30 37-44 35C-54 34-60 35-62 36Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="1" stroke-linejoin="round"/><path d="M-62 30L-56 33M-50 27L-45 31M-36 26L-31 29" stroke="${T.accent}" stroke-opacity="0.85" stroke-width="0.9" stroke-linecap="round"/><path d="M-46 25L-43 17L-40 26Z M-34 27L-30 20L-27 25Z" fill="${T.light}" stroke="${T.dark}" stroke-width="0.7" stroke-linejoin="round"/>`;
  const base = `<path d="M-30 36L-22 31H22L30 36Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.9" stroke-linejoin="round"/>`;
  return defs + `<g>${claw}</g><g transform="scale(-1 1)">${claw}</g>` + base + flake;
}
module.exports = { crestTop };
