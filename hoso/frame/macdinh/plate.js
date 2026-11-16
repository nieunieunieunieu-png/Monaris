// ===== hoso/frame/macdinh/plate.js — BẢNG TÊN: dải hoa văn dưới tên + biểu tượng cạnh dòng "HỒ SƠ THÀNH VIÊN" =====
// Tự chứa, không require file khác. Chữ ký namePlate(tier, x, y, w) -> chuỗi SVG (id gradient tiền tố 'macdinh-plate-').
// x = lề trái chữ tên, y = baseline dòng tên, w = bề rộng dải. Cố định (không đo độ dài tên) nên tên dài/ngắn đều không lệch.
// Cũng là bảng tên DÙNG CHUNG cho mọi khung chưa có plate.js riêng: chỉ dùng tier.light/main/dark/rainbow nên tô theo màu bậc của khung đang chọn.

const RB = ['#ff6b6b', '#ffd93d', '#6bffb8', '#6bb8ff', '#d96bff'];
const stops = (cols, fade) => cols.map((c, i) => `<stop offset="${(i / Math.max(1, cols.length - 1)).toFixed(3)}" stop-color="${c}"${fade && i === cols.length - 1 ? ' stop-opacity="0.15"' : ''}/>`).join('');
const diamond = (cx, cy, r, fill, stroke) => `<path d="M${cx} ${cy - r} L${cx + r} ${cy} L${cx} ${cy + r} L${cx - r} ${cy} Z" fill="${fill}" stroke="${stroke}" stroke-width="1.4"/>`;

function namePlate(tier, x, y, w) {
  const by = y + 16; // dải nằm giữa dòng tên và dòng Danh Hiệu / Ingame
  const cols = tier.rainbow ? RB : [tier.main, tier.light, tier.main, tier.light, tier.main];
  const hi = tier.rainbow ? '#ffd93d' : tier.light;
  const defs = `<defs><linearGradient id="macdinh-plate-line" gradientUnits="userSpaceOnUse" x1="${x}" y1="0" x2="${x + w}" y2="0">${stops(cols, true)}</linearGradient></defs>`;
  // Dải chính + sợi mảnh phía dưới (bậc có double thì thêm sợi thứ hai phía trên)
  const line =
    `<rect x="${x + 16}" y="${by - 2}" width="${w - 16}" height="4" rx="2" fill="url(#macdinh-plate-line)"/>` +
    `<rect x="${x + 40}" y="${by + 4}" width="${w - 120}" height="1" fill="url(#macdinh-plate-line)" fill-opacity="0.6"/>` +
    (tier.double ? `<rect x="${x + 40}" y="${by - 5}" width="${w - 120}" height="1" fill="url(#macdinh-plate-line)" fill-opacity="0.6"/>` : '');
  // Đầu trái: thoi lớn + 2 hạt nhỏ nối ra; đầu phải: thoi nhỏ mờ dần
  const left = diamond(x + 6, by, 7, tier.main, tier.dark) + diamond(x + 6, by, 3, '#ffffff', 'none').replace('stroke-width="1.4"', 'stroke-width="0"').replace('fill="#ffffff"', 'fill="#ffffff" fill-opacity="0.8"') + `<circle cx="${x + 22}" cy="${by}" r="2" fill="${hi}"/>`;
  const right = diamond(x + w - 4, by, 4, tier.main, tier.dark);
  // Giữa dải: ngọc nhỏ ở 1/3 chiều dài
  const mid = diamond(x + w * 0.33, by, 4.5, hi, tier.dark);
  // Biểu tượng nhỏ cạnh dòng "HỒ SƠ THÀNH VIÊN" (baseline chữ ở y-54): sao 4 cánh
  const ix = x - 18;
  const iy = y - 60;
  const r = 9;
  const icon = `<path d="M${ix} ${iy - r} Q${ix} ${iy} ${ix + r} ${iy} Q${ix} ${iy} ${ix} ${iy + r} Q${ix} ${iy} ${ix - r} ${iy} Q${ix} ${iy} ${ix} ${iy - r} Z" fill="${hi}" stroke="${tier.dark}" stroke-width="1.2" stroke-linejoin="round"/>`;
  return `${defs}${line}${left}${mid}${right}${icon}`;
}


// headTrim(tier, W, headH, bar): bar = { x, y, w, h } viền ngoài thanh EXP (null nếu chưa có cấp). Chỉ vẽ phần trang trí, thanh EXP do card.js vẽ.
function headTrim(tier, W, headH, bar) {
  const hi = tier.rainbow ? '#ffd93d' : tier.light;
  const dm = (cx, cy, r, f) => `<path d="M${cx} ${cy - r} L${cx + r} ${cy} L${cx} ${cy + r} L${cx - r} ${cy} Z" fill="${f}" stroke="${tier.dark}" stroke-width="1.4"/>`;
  const cx = W / 2;
  // Đường chia: thoi lớn ở giữa, hai bên 2 thoi nhỏ dần + vạch ngắn sáng
  let out = dm(cx, headH, 9, hi) + `<path d="M${cx} ${headH - 4} L${cx + 4} ${headH} L${cx} ${headH + 4} L${cx - 4} ${headH} Z" fill="#ffffff" fill-opacity="0.8"/>`;
  for (const sgn of [-1, 1]) {
    out += dm(cx + sgn * 34, headH, 5, tier.main) + dm(cx + sgn * 58, headH, 3, tier.main);
    out += `<rect x="${sgn > 0 ? cx + 66 : cx - 96}" y="${headH - 1}" width="30" height="2" rx="1" fill="${hi}" fill-opacity="0.7"/>`;
  }
  // Thanh EXP: thoi ở hai đầu đè lên mép bo + 3 vạch mốc 25/50/75%
  if (bar) {
    const my = bar.y + bar.h / 2;
    out += dm(bar.x - 2, my, 8, tier.main) + dm(bar.x + bar.w + 2, my, 8, tier.main);
    out += `<path d="M${bar.x - 2} ${my - 3.5} l3.5 3.5 l-3.5 3.5 l-3.5 -3.5 Z M${bar.x + bar.w + 2} ${my - 3.5} l3.5 3.5 l-3.5 3.5 l-3.5 -3.5 Z" fill="#ffffff" fill-opacity="0.8"/>`;
    for (const t of [0.25, 0.5, 0.75]) out += `<rect x="${bar.x + 2 + (bar.w - 4) * t - 0.75}" y="${bar.y + 3}" width="1.5" height="${bar.h - 6}" fill="#ffffff" fill-opacity="0.28"/>`;
  }
  return out;
}

module.exports = { namePlate, headTrim };
