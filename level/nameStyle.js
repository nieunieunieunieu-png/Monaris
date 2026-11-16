// ===== level/nameStyle.js — kiểu chữ gradient đậm cho Nickname / Ingame / Danh Hiệu (dùng chung thẻ /hoso và /level) =====
// Người dùng chọn 1 bộ màu trong /profile (nút 🎨 Màu chữ): chọn mẫu có sẵn hoặc tự nhập 2-3 mã màu #RRGGBB.
// Lưu ở tab "Hồ Sơ Cá Nhân" cột G dạng chuỗi "#ff6b6b,#ffd93d,#6bb8ff". Trống = mặc định theo bậc cấp (sáng -> chính).
// Chỉ trả về chuỗi SVG / màu, không gọi mạng. librsvg không có dominant-baseline nên mọi chữ canh bằng y (baseline) tính tay.

const GRADIENT_MAX_COLORS = 3;
const HEX_RE = /^#[0-9a-f]{6}$/i;

// Mẫu có sẵn (value dùng làm key trong dropdown). Tối đa 24 mẫu vì dropdown Discord giới hạn 25 lựa chọn (còn 1 chỗ cho "Theo bậc cấp").
const GRADIENT_PRESETS = [
  { key: 'hoanghon', label: 'Hoàng hôn', colors: ['#ff9a5a', '#ff5e7e', '#c04bff'] },
  { key: 'daiduong', label: 'Đại dương', colors: ['#6bf0ff', '#3b8cff', '#6a5cff'] },
  { key: 'rungxanh', label: 'Rừng xanh', colors: ['#d4ff7a', '#5fe08a', '#17a589'] },
  { key: 'hoakim', label: 'Vàng kim', colors: ['#fff3b0', '#ffd23f', '#ff9f1c'] },
  { key: 'anhdao', label: 'Anh đào', colors: ['#ffd1e8', '#ff8ac2', '#ff4f9a'] },
  { key: 'tiamau', label: 'Tím mộng', colors: ['#e9c6ff', '#b57bff', '#6f4bff'] },
  { key: 'hoaviem', label: 'Hoả diệm', colors: ['#fff176', '#ff9100', '#ff3d00'] },
  { key: 'bangtuyet', label: 'Băng tuyết', colors: ['#ffffff', '#bfe9ff', '#7fc8ff'] },
  { key: 'bacha', label: 'Bạc hà', colors: ['#c9ffe9', '#6bffc8', '#3fc9ff'] },
  { key: 'kimloai', label: 'Kim loại', colors: ['#ffffff', '#c0c8d4', '#8a93a3'] },
  { key: 'cauvong', label: 'Cầu vồng', colors: ['#ff6b6b', '#ffd93d', '#6bffb8', '#6bb8ff', '#d96bff'] },
  { key: 'huyetnguyet', label: 'Huyết nguyệt', colors: ['#ff9a9a', '#ff3b5c', '#9b0d3a'] },
];
const PRESET_BY_KEY = new Map(GRADIENT_PRESETS.map((p) => [p.key, p]));

function normHex(c) {
  let s = String(c || '').trim().toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(s)) s = `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
  else if (/^[0-9a-f]{6}$/.test(s)) s = `#${s}`;
  else if (/^[0-9a-f]{3}$/.test(s)) s = `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`;
  return HEX_RE.test(s) ? s : null;
}

// Nhập tay: "#ff6b6b #6bb8ff" / "ff6b6b, 6bb8ff, ffd93d" -> ['#ff6b6b', ...] (2..3 màu) hoặc { error }.
function parseColorInput(raw) {
  const parts = String(raw || '')
    .split(/[\s,;]+/)
    .filter(Boolean);
  if (parts.length < 2) return { error: 'Cần nhập ít nhất 2 mã màu (ví dụ: #ff6b6b #6bb8ff).' };
  if (parts.length > GRADIENT_MAX_COLORS) return { error: `Tối đa ${GRADIENT_MAX_COLORS} mã màu.` };
  const colors = [];
  for (const p of parts) {
    const hex = normHex(p);
    if (!hex) return { error: `"${p}" không phải mã màu hợp lệ (dạng #RRGGBB, ví dụ #ff6b6b).` };
    colors.push(hex);
  }
  return { colors };
}

// Chuỗi lưu Sheet <-> mảng màu. Đọc lỗi/hỏng -> null (dùng mặc định theo bậc).
function serializeColors(colors) {
  return Array.isArray(colors) && colors.length ? colors.join(',') : '';
}
function deserializeColors(str) {
  const parts = String(str || '')
    .split(',')
    .map(normHex)
    .filter(Boolean);
  return parts.length >= 2 ? parts.slice(0, 5) : null;
}

function presetColors(key) {
  const p = PRESET_BY_KEY.get(key);
  return p ? p.colors.slice() : null;
}

// Màu mặc định theo bậc: sáng -> chính (bậc cầu vồng dùng 5 màu cầu vồng). Dùng khi người dùng chưa chọn.
function defaultColors(tier) {
  if (tier && tier.rainbow) return ['#ff6b6b', '#ffd93d', '#6bffb8', '#6bb8ff', '#d96bff'];
  return [tier.light, tier.main];
}

// Màu chữ nhạt nhất / chính của bộ màu (dùng cho viền ngoài hoặc điểm nhấn nếu cần).
function accentOf(colors) {
  return colors[Math.floor(colors.length / 2)] || colors[0];
}

function stops(colors) {
  const last = Math.max(1, colors.length - 1);
  return colors.map((c, i) => `<stop offset="${(i / last).toFixed(3)}" stop-color="${c}"/>`).join('');
}

// <defs>: 1 gradient NGANG theo bbox từng chữ (mỗi dòng chữ ăn trọn dải màu dù ngắn hay dài).
function nameGradientDefs(id, colors) {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">${stops(colors)}</linearGradient>`;
}

const escXml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));

// Chữ gradient ĐẬM: fill + stroke cùng gradient (stroke mảnh làm nét dày hơn kể cả khi font chỉ có bản Regular) + bóng đổ mờ để dễ đọc trên ảnh bìa.
// opts: { x, y, size, gradId, text, weight (độ dày stroke, mặc định 0.9), anchor }
function gradientText({ x, y, size, gradId, text, weight = 0.9, anchor, font }) {
  const common = `font-family="${font}" font-size="${size}" font-weight="bold"${anchor ? ` text-anchor="${anchor}"` : ''}`;
  const body = escXml(text);
  return (
    `<text x="${x + 1.5}" y="${y + 2}" ${common} fill="#000000" fill-opacity="0.45" stroke="#000000" stroke-opacity="0.45" stroke-width="${weight}" stroke-linejoin="round">${body}</text>` +
    `<text x="${x}" y="${y}" ${common} fill="url(#${gradId})" stroke="url(#${gradId})" stroke-width="${weight}" stroke-linejoin="round">${body}</text>`
  );
}

module.exports = {
  GRADIENT_PRESETS,
  GRADIENT_MAX_COLORS,
  parseColorInput,
  serializeColors,
  deserializeColors,
  presetColors,
  defaultColors,
  accentOf,
  nameGradientDefs,
  gradientText,
};
