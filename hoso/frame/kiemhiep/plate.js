// ===== hoso/frame/kiemhiep/plate.js — BẢNG TÊN kiếm hiệp: dải mực + đồng tiền (đầu trái) + mũi kiếm (đầu phải) + kiếm nhỏ cạnh dòng tiêu đề =====
// Tự chứa, không require file khác. Chữ ký namePlate(tier, x, y, w) -> chuỗi SVG (id gradient tiền tố 'kiemhiep-plate-'). tier.accent = đỏ son / vàng nhấn.

const RB = ['#ff6b6b', '#ffd93d', '#6bffb8', '#6bb8ff', '#d96bff'];
const stops = (cols, fade) => cols.map((c, i) => `<stop offset="${(i / Math.max(1, cols.length - 1)).toFixed(3)}" stop-color="${c}"${fade && i === cols.length - 1 ? ' stop-opacity="0.15"' : ''}/>`).join('');

function namePlate(tier, x, y, w) {
  const by = y + 16;
  const acc = tier.accent || tier.light;
  const cols = tier.rainbow ? RB : [tier.main, tier.light, tier.main, tier.light, tier.main];
  const defs = `<defs><linearGradient id="kiemhiep-plate-line" gradientUnits="userSpaceOnUse" x1="${x}" y1="0" x2="${x + w}" y2="0">${stops(cols, true)}</linearGradient></defs>`;
  // Đầu trái: đồng tiền (vòng tròn + lỗ vuông) buộc dải lụa nhỏ màu nhấn
  const coin =
    `<circle cx="${x + 8}" cy="${by}" r="8" fill="${tier.main}" stroke="${tier.dark}" stroke-width="1.5"/>` +
    `<rect x="${x + 4.5}" y="${by - 3.5}" width="7" height="7" fill="#15172a" stroke="${tier.dark}" stroke-width="1"/>` +
    `<path d="M${x + 16} ${by} h10" stroke="${acc}" stroke-width="2.2" stroke-linecap="round"/>`;
  const line =
    `<rect x="${x + 26}" y="${by - 2}" width="${w - 52}" height="4" rx="2" fill="url(#kiemhiep-plate-line)"/>` +
    `<rect x="${x + 50}" y="${by + 4}" width="${w - 150}" height="1" fill="url(#kiemhiep-plate-line)" fill-opacity="0.55"/>`;
  // Giữa dải: hạt thoi màu nhấn; đầu phải: mũi kiếm thon (tam giác dài) mờ dần
  const mid = `<path d="M${x + w * 0.4} ${by - 5} l5 5 l-5 5 l-5 -5 Z" fill="${acc}" stroke="${tier.dark}" stroke-width="1.2"/>`;
  const tip = `<path d="M${x + w - 26} ${by - 4} L${x + w} ${by} L${x + w - 26} ${by + 4} Z" fill="${tier.light}" fill-opacity="0.75" stroke="${tier.dark}" stroke-width="1"/>`;
  // Biểu tượng cạnh dòng "HỒ SƠ THÀNH VIÊN": thanh kiếm đứng nhỏ (lưỡi + chắn tay + chuôi)
  const ix = x - 18;
  const iy = y - 60;
  const sword =
    `<path d="M${ix} ${iy - 12} L${ix + 3} ${iy + 3} L${ix - 3} ${iy + 3} Z" fill="${tier.light}" stroke="${tier.dark}" stroke-width="1" stroke-linejoin="round"/>` +
    `<rect x="${ix - 7}" y="${iy + 3}" width="14" height="3" rx="1.5" fill="${acc}" stroke="${tier.dark}" stroke-width="0.8"/>` +
    `<rect x="${ix - 1.6}" y="${iy + 6}" width="3.2" height="7" rx="1" fill="${tier.main}" stroke="${tier.dark}" stroke-width="0.8"/>`;
  return `${defs}${line}${coin}${mid}${tip}${sword}`;
}


// headTrim(tier, W, headH, bar): bar = { x, y, w, h } viền ngoài thanh EXP (null nếu chưa có cấp). Đường chia: đồng tiền + hai thanh kiếm nằm ngang; thanh EXP: đồng tiền nhỏ hai đầu.
function headTrim(tier, W, headH, bar) {
  const acc = tier.accent || tier.light;
  const coin = (cx, cy, r) =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${tier.main}" stroke="${tier.dark}" stroke-width="1.5"/>` +
    `<rect x="${cx - r * 0.42}" y="${cy - r * 0.42}" width="${r * 0.84}" height="${r * 0.84}" fill="#15172a" stroke="${tier.dark}" stroke-width="0.9"/>`;
  const cx = W / 2;
  let out = '';
  for (const sgn of [-1, 1]) {
    // lưỡi kiếm thon hướng ra ngoài + chắn tay màu nhấn sát đồng tiền
    out += `<path d="M${cx + sgn * 16} ${headH - 4} L${cx + sgn * 96} ${headH} L${cx + sgn * 16} ${headH + 4} Z" fill="${tier.light}" fill-opacity="0.85" stroke="${tier.dark}" stroke-width="1" stroke-linejoin="round"/>`;
    out += `<rect x="${cx + sgn * 24 - 2}" y="${headH - 7}" width="4" height="14" rx="2" fill="${acc}" stroke="${tier.dark}" stroke-width="0.8"/>`;
  }
  out += coin(cx, headH, 10);
  if (bar) {
    const my = bar.y + bar.h / 2;
    out += coin(bar.x - 2, my, 9) + coin(bar.x + bar.w + 2, my, 9);
    for (const t of [0.25, 0.5, 0.75]) out += `<path d="M${bar.x + 2 + (bar.w - 4) * t} ${bar.y + 3} l2.5 ${bar.h / 2 - 3} l-2.5 ${bar.h / 2 - 3} l-2.5 -${bar.h / 2 - 3} Z" fill="${acc}" fill-opacity="0.55"/>`;
  }
  return out;
}

module.exports = { namePlate, headTrim };
