// ===== hoso/frame/tutien/plate.js — BẢNG TÊN tu tiên: dải linh khí + mây cuộn (hai đầu) + hoa sen nhỏ cạnh dòng tiêu đề =====
// Tự chứa, không require file khác. Chữ ký namePlate(tier, x, y, w) -> chuỗi SVG (id gradient tiền tố 'tutien-plate-'). tier.accent = màu ngọc/điểm sáng.

const RB = ['#ff6b6b', '#ffd93d', '#6bffb8', '#6bb8ff', '#d96bff'];
const stops = (cols, fade) => cols.map((c, i) => `<stop offset="${(i / Math.max(1, cols.length - 1)).toFixed(3)}" stop-color="${c}"${fade && i === cols.length - 1 ? ' stop-opacity="0.15"' : ''}/>`).join('');

function namePlate(tier, x, y, w) {
  const by = y + 16;
  const acc = tier.accent || tier.light;
  const cols = tier.rainbow ? RB : [tier.main, tier.light, tier.main, tier.light, tier.main];
  const defs = `<defs><linearGradient id="tutien-plate-line" gradientUnits="userSpaceOnUse" x1="${x}" y1="0" x2="${x + w}" y2="0">${stops(cols, true)}</linearGradient></defs>`;
  // Mây cuộn: 3 vòng tròn xếp bậc + nét xoáy; đầu phải thu nhỏ
  const cloud = (cx, s, op) =>
    `<g fill="${tier.main}" fill-opacity="${op}" stroke="${tier.dark}" stroke-width="1.2">` +
    `<circle cx="${cx}" cy="${by + 1 * s}" r="${5 * s}"/><circle cx="${cx + 7 * s}" cy="${by - 3 * s}" r="${6 * s}"/><circle cx="${cx + 15 * s}" cy="${by + 1 * s}" r="${5 * s}"/></g>` +
    `<path d="M${cx + 5 * s} ${by - 3 * s} a${2.4 * s} ${2.4 * s} 0 1 1 ${3 * s} ${2 * s}" fill="none" stroke="${tier.light}" stroke-width="1.2" stroke-linecap="round"/>`;
  const line =
    `<rect x="${x + 28}" y="${by - 2}" width="${w - 56}" height="4" rx="2" fill="url(#tutien-plate-line)"/>` +
    `<rect x="${x + 56}" y="${by + 4}" width="${w - 150}" height="1" fill="url(#tutien-plate-line)" fill-opacity="0.55"/>`;
  // Giữa dải: viên ngọc (linh châu) có quầng
  const px = x + w * 0.4;
  const pearl = `<circle cx="${px}" cy="${by}" r="6.5" fill="${acc}" fill-opacity="0.25"/><circle cx="${px}" cy="${by}" r="3.8" fill="${acc}" stroke="${tier.dark}" stroke-width="1"/><circle cx="${px - 1.2}" cy="${by - 1.2}" r="1.2" fill="#ffffff" fill-opacity="0.85"/>`;
  // Biểu tượng cạnh dòng "HỒ SƠ THÀNH VIÊN": hoa sen 3 cánh
  const ix = x - 18;
  const iy = y - 56;
  const petal = (dx, rot) => `<path d="M0 0 C-5 -5 -4 -11 0 -15 C4 -11 5 -5 0 0 Z" transform="translate(${ix + dx} ${iy}) rotate(${rot})" fill="${rot === 0 ? tier.light : tier.main}" stroke="${tier.dark}" stroke-width="1" stroke-linejoin="round"/>`;
  const lotus = petal(0, -48) + petal(0, 48) + petal(0, 0) + `<path d="M${ix - 8} ${iy + 3} Q${ix} ${iy + 7} ${ix + 8} ${iy + 3}" fill="none" stroke="${acc}" stroke-width="1.6" stroke-linecap="round"/>`;
  return `${defs}${line}${cloud(x - 2, 1, 0.9)}${cloud(x + w - 30, 0.8, 0.5)}${pearl}${lotus}`;
}


// headTrim(tier, W, headH, bar): bar = { x, y, w, h } viền ngoài thanh EXP (null nếu chưa có cấp). Đường chia: linh châu + mây cuộn hai bên; thanh EXP: linh châu hai đầu.
function headTrim(tier, W, headH, bar) {
  const acc = tier.accent || tier.light;
  const pearl = (cx, cy, r) =>
    `<circle cx="${cx}" cy="${cy}" r="${r * 1.7}" fill="${acc}" fill-opacity="0.22"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${acc}" stroke="${tier.dark}" stroke-width="1.3"/>` +
    `<circle cx="${cx - r * 0.3}" cy="${cy - r * 0.3}" r="${r * 0.3}" fill="#ffffff" fill-opacity="0.85"/>`;
  const cloud = (ox, sgn, s) =>
    `<g transform="translate(${ox} ${headH}) scale(${sgn * s} ${s})" fill="${tier.main}" fill-opacity="0.9" stroke="${tier.dark}" stroke-width="1.2">` +
    `<circle cx="0" cy="1" r="5"/><circle cx="8" cy="-3" r="6"/><circle cx="16" cy="1" r="5"/></g>`;
  const cx = W / 2;
  let out = cloud(cx + 18, 1, 1) + cloud(cx - 18, -1, 1) + cloud(cx + 58, 1, 0.75) + cloud(cx - 58, -1, 0.75) + pearl(cx, headH, 7);
  if (bar) {
    const my = bar.y + bar.h / 2;
    out += pearl(bar.x - 2, my, 6.5) + pearl(bar.x + bar.w + 2, my, 6.5);
    for (const t of [0.25, 0.5, 0.75]) out += `<circle cx="${bar.x + 2 + (bar.w - 4) * t}" cy="${my}" r="1.8" fill="#ffffff" fill-opacity="0.35"/>`;
  }
  return out;
}

module.exports = { namePlate, headTrim };
