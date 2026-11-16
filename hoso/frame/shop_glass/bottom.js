// ===== hoso/frame/shop_glass/bottom.js — CẠNH DƯỚI (nâng cấp): viên kính giữa + 2 viên nang bên + thoi nhỏ ở đầu mút + vệt phản chiếu =====
// Hình học: gốc giữa mép dưới; y ∈ [-3, 11]; nửa rộng ≤ 70 (đối xứng x=0, hệ thống phóng ×1.5); opacity 0.15–0.85.
const T = require('./colors').TIERS[0];
const P = 'shop_glass-bottom-';
function decorBottom(_tier, _W, _H) {
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.55"/><stop offset="1" stop-color="${T.accent}" stop-opacity="0.18"/></linearGradient><linearGradient id="${P}l" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0.6"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient></defs>`;
  const body = `<rect x="-30" y="-3" width="60" height="14" rx="7" fill="url(#${P}g)" stroke="#FFFFFF" stroke-opacity="0.7" stroke-width="1"/><rect x="-26" y="-0.6" width="52" height="9.2" rx="4.6" fill="none" stroke="${T.dark}" stroke-opacity="0.3" stroke-width="0.6"/>`;
  const gloss = `<path d="M-22 0.4H-4" stroke="#FFFFFF" stroke-opacity="0.85" stroke-width="1.2" stroke-linecap="round"/><path d="M0 0.4H4" stroke="#FFFFFF" stroke-opacity="0.55" stroke-width="1.2" stroke-linecap="round"/><path d="M8 8.6L14 0.4" stroke="#FFFFFF" stroke-opacity="0.5" stroke-width="1.6" stroke-linecap="round"/>`;
  const pill = (x, w, h, o) => `<rect x="${x}" y="${Number((4 - h / 2).toFixed(2))}" width="${w}" height="${h}" rx="${Number((h / 2).toFixed(2))}" fill="url(#${P}g)" fill-opacity="${o}" stroke="#FFFFFF" stroke-opacity="0.6" stroke-width="0.8"/>`;
  const rh = (cx, hw, hh, o) => `<path d="M${cx} ${Number((4 - hh).toFixed(2))}L${Number((cx + hw).toFixed(2))} 4L${cx} ${Number((4 + hh).toFixed(2))}L${Number((cx - hw).toFixed(2))} 4Z" fill="url(#${P}g)" fill-opacity="${o}" stroke="#FFFFFF" stroke-opacity="0.7" stroke-width="0.8" stroke-linejoin="round"/>`;
  let sides = '';
  [-1, 1].forEach((s) => {
    const px = s > 0 ? 36 : -36 - 18;
    const px2 = s > 0 ? 58 : -58 - 7;
    sides += pill(px, 18, 8, 0.85) + pill(px2, 7, 5, 0.6);
    sides += `<path d="M${s * 39} 2.2H${s * 49}" stroke="#FFFFFF" stroke-opacity="0.8" stroke-width="0.9" stroke-linecap="round"/>`;
    sides += rh(s * 67, 3, 3.6, 0.7) + `<circle cx="${s * 32.5}" cy="4" r="1" fill="${T.accent}" fill-opacity="0.8"/>`;
  });
  const reflect = `<rect x="-62" y="10.2" width="124" height="0.8" fill="url(#${P}l)"/>`;
  return defs + reflect + sides + body + gloss;
}
module.exports = { decorBottom };
