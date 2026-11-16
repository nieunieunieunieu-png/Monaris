// ===== hoso/frame/shop_glass/crest.js — ĐỈNH THẺ (nâng cấp): cụm thoi kính 5 tầng + viên nang đế + thoi nổi + vệt phản quang =====
// Hình học: gốc giữa cạnh trên; x ∈ [-74,74], y ∈ [2,36]; đỉnh thoi giữa chạm y=36 (viên nang đế y 29..36); hệ thống phóng ×2; opacity 0.15–1.
const T = require('./colors').TIERS[0];
const P = 'shop_glass-crest-';
const n = (v) => Number(v.toFixed(2));
function crestTop(_tier, _W, _H) {
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.6"/><stop offset="0.55" stop-color="${T.frost}" stop-opacity="0.2"/><stop offset="1" stop-color="${T.accent}" stop-opacity="0.4"/></linearGradient><radialGradient id="${P}h" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.35"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient></defs>`;
  const rh = (cx, cy, hw, hh, o, sw = 1) => `<path d="M${cx} ${n(cy - hh)}L${n(cx + hw)} ${cy}L${cx} ${n(cy + hh)}L${n(cx - hw)} ${cy}Z" fill="url(#${P}g)" fill-opacity="${o}" stroke="#FFFFFF" stroke-opacity="0.7" stroke-width="${sw}" stroke-linejoin="round"/>`;
  const halo = `<ellipse cx="0" cy="20" rx="40" ry="18" fill="url(#${P}h)"/>`;
  const capsule = `<rect x="-26" y="29" width="52" height="7" rx="3.5" fill="url(#${P}g)" fill-opacity="0.9" stroke="#FFFFFF" stroke-opacity="0.65" stroke-width="0.9"/><path d="M-20 31H-4" stroke="#FFFFFF" stroke-opacity="0.8" stroke-width="1" stroke-linecap="round"/>`;
  const wings = [-1, 1].map((s) => rh(s * 33, 23, 9.5, 11, 0.85) + rh(s * 50, 28, 6, 6.5, 0.65) + rh(s * 64, 31, 3.6, 4, 0.5, 0.8) + rh(s * 21, 7, 3.2, 3.6, 0.7, 0.8)).join('');
  const line = `<path d="M-72 35.5H-28M28 35.5H72" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="1" stroke-linecap="round"/><path d="M-72 33.5H-56M56 33.5H72" stroke="${T.accent}" stroke-opacity="0.45" stroke-width="0.8" stroke-linecap="round"/>`;
  const main = rh(0, 19, 16, 17, 1, 1.1);
  const facets = `<path d="M0 2V36M-16 19H16" stroke="#FFFFFF" stroke-opacity="0.28" stroke-width="0.6"/><path d="M0 8L8 19L0 30L-8 19Z" fill="none" stroke="${T.dark}" stroke-opacity="0.4" stroke-width="0.7" stroke-linejoin="round"/><path d="M0 13L3.5 19L0 25L-3.5 19Z" fill="#FFFFFF" fill-opacity="0.35"/>`;
  const gloss = `<path d="M-10 14L-1 4.6" stroke="#FFFFFF" stroke-opacity="0.9" stroke-width="1.7" stroke-linecap="round"/><path d="M-5 20L2 12" stroke="#FFFFFF" stroke-opacity="0.5" stroke-width="1" stroke-linecap="round"/><circle cx="9" cy="25" r="1.2" fill="#FFFFFF" fill-opacity="0.85"/><circle cx="-2" cy="2.6" r="1" fill="#FFFFFF" fill-opacity="0.8"/>`;
  return defs + halo + line + capsule + wings + main + facets + gloss;
}
module.exports = { crestTop };
