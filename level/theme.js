// ===== level/theme.js — giao diện thẻ theo cấp (khung/bậc) + màu huy hiệu hệ phái =====
// Dùng chung cho level/card.js (thẻ /level) và hoso/card.js (thẻ /hoso). Chỉ trả về màu/chuỗi, không vẽ gì.

// Bậc theo cấp (21 mức, đổi mỗi 5 cấp: 11 bậc tới cấp 50 + 10 bậc sao 55–100): cấp càng cao khung càng sáng, từ cấp 30 có thêm viền trong, cấp 50 viền màu cầu vồng.
// Hợp đồng (docs/KHUNG_LEVEL_PROMPT.md 4.2): { i, min, name, step, label, main, light, dark, accent?, double, rainbow? }
//   name  = tên bậc CHÍNH (giữ nguyên cho nửa bậc để các phần khung đọc IDX[tier.name] vẫn chạy);
//   step  = 0 bậc chính | 1 "nửa bậc +"; label = tên hiển thị ('ĐỒNG I', 'ĐỒNG II', ..., 'HUYỀN THOẠI');
//   nửa bậc: main/light/dark = trộn 50% giữa bậc chính của nó và bậc chính kế tiếp, accent = main sáng hơn ~10%.
const MAIN_TIERS = [
  { min: 0, name: 'ĐỒNG', main: '#cd7f32', light: '#f0b27a', dark: '#7a4a1a', double: false },
  { min: 10, name: 'BẠC', main: '#c0c8d4', light: '#f2f5f9', dark: '#7d8794', double: false },
  { min: 20, name: 'VÀNG', main: '#f5c542', light: '#fff0a8', dark: '#a8791a', double: false },
  { min: 30, name: 'BẠCH KIM', main: '#5fe0cf', light: '#c9fff6', dark: '#1f8f84', double: true },
  { min: 40, name: 'KIM CƯƠNG', main: '#66b3ff', light: '#d6ecff', dark: '#2a5fb0', double: true },
  { min: 50, name: 'HUYỀN THOẠI', main: '#ff7ad9', light: '#ffe0f6', dark: '#8a3ad6', double: true, rainbow: true },
];

// Trộn 2 màu #RRGGBB (t = 0 -> a, 1 -> b).
function mixHex(a, b, t) {
  const ch = (h, i) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  return `#${[0, 1, 2].map((i) => Math.round(ch(a, i) * (1 - t) + ch(b, i) * t).toString(16).padStart(2, '0')).join('')}`;
}

const TIERS = [];
MAIN_TIERS.forEach((t, k) => {
  const next = MAIN_TIERS[k + 1];
  TIERS.push({ ...t, i: TIERS.length, step: 0, label: next ? `${t.name} I` : t.name });
  if (next) {
    TIERS.push({
      i: TIERS.length,
      min: t.min + 5,
      name: t.name,
      step: 1,
      label: `${t.name} II`,
      main: mixHex(t.main, next.main, 0.5),
      light: mixHex(t.light, next.light, 0.5),
      dark: mixHex(t.dark, next.dark, 0.5),
      accent: mixHex(mixHex(t.main, next.main, 0.5), '#ffffff', 0.1),
      double: t.double,
      rainbow: false,
    });
  }
});

// Bậc sao 55–100 (K-7): nối đuôi chỉ số 11..20, KHÔNG đổi chỉ số 0..10. name giữ 'HUYỀN THOẠI' (IDX[tier.name] của các phần khung vẫn chạy), star = 1..10.
// main ngả vàng kem 5%/sao, accent ngả trắng 6%/sao, light/dark giữ của HUYỀN THOẠI; cấp 100 = 'TỐI THƯỢNG' (max: true). label: 'HUYỀN THOẠI ★1'…'★9'.
const HT = MAIN_TIERS[MAIN_TIERS.length - 1];
for (let n = 1; n <= 10; n += 1) {
  TIERS.push({
    i: TIERS.length,
    min: 50 + 5 * n,
    name: HT.name,
    step: 1,
    star: n,
    ...(n === 10 ? { max: true } : {}),
    label: n === 10 ? 'TỐI THƯỢNG' : `${HT.name} ★${n}`,
    main: mixHex(HT.main, '#ffe9a6', 0.05 * n),
    light: HT.light,
    dark: HT.dark,
    accent: mixHex(HT.accent || HT.main, '#ffffff', 0.06 * n),
    double: true,
    rainbow: true,
  });
}

// Màu/tên 6 bậc của THÀNH TỰU (Đồng → Huyền Thoại, chỉ số 0..5 theo mốc thành tựu) — TÁCH khỏi TIERS (11 bậc khung) để thành tựu không đổi màu khi thêm nửa bậc.
const ACHIEVEMENT_TIERS = MAIN_TIERS.map((t) => ({ name: t.name, main: t.main, light: t.light, dark: t.dark }));

function tierForLevel(level) {
  const lv = Math.max(0, Number(level) || 0);
  let tier = TIERS[0];
  for (const t of TIERS) if (lv >= t.min) tier = t;
  return tier;
}

// Màu huy hiệu hệ phái: LẤY ĐÚNG bảng màu của web Monaris Admin (rank.js / check-gear.js / highlight.js -> CLASS_COLORS), cũng chính là
// bảng ở thiKiem/format.js. Hệ phái chưa có trong bảng thì sinh màu dự phòng giống hệt web (băm tên -> hue, HSL 70%/55%).
const CLASS_COLORS = {
  'Tố Vấn': '#FF99CC',
  'Thiết Y': '#FF9900',
  'Huyết Hà': '#AA0000',
  'Cửu Linh': '#CC66FF',
  'Thần Tương': '#3366FF',
  'Long Ngâm': '#00CC99',
  'Toái Mộng': '#66CCFF',
};

// hsl -> #RRGGBB (librsvg bản cũ không chắc đọc được hsl()).
function hsl(h, sat, lig) {
  const s = sat / 100;
  const l = lig / 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  return `#${[f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

function hashStringToHue(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return hash % 360;
}

function getClassColor(className) {
  const name = String(className || '').trim();
  return CLASS_COLORS[name] || hsl(hashStringToHue(name), 70, 55);
}

// Chữ trắng hay đen trên nền màu hệ phái (cùng công thức độ sáng WCAG như web).
function readableTextColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const lum = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return lum > 0.45 ? '#1A1023' : '#FFFFFF';
}

// Huy hiệu: nền = màu hệ phái của web, chữ tự chọn trắng/đen cho dễ đọc.
function classBadgeColors(className) {
  const color = getClassColor(className);
  return { fill: color, stroke: '#ffffff', text: readableTextColor(color) };
}

module.exports = { TIERS, ACHIEVEMENT_TIERS, CLASS_COLORS, tierForLevel, getClassColor, classBadgeColors };
