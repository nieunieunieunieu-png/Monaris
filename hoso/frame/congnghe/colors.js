// hoso/frame/congnghe/colors.js — bảng màu 21 bậc (6 chính + 5 nửa bậc + + 10 bậc sao 55–100) phong cách Công nghệ hiện đại (neon trên xám lạnh)
// Có thêm cột accent (màu nhấn cho ngọc/đèn LED). File tự chứa, không require gì.
const BASE_TIERS = [
  { min: 0,  name: 'ĐỒNG',        main: '#8a9bb3', light: '#c4cfdf', dark: '#4e5b70', accent: '#ffb454', double: false }, // xám thép
  { min: 10, name: 'BẠC',         main: '#b4c3d9', light: '#eef3fa', dark: '#6a7b93', accent: '#4de3ff', double: false }, // bạc lạnh
  { min: 20, name: 'VÀNG',        main: '#39ff88', light: '#a8ffcc', dark: '#13a14f', accent: '#ff4fd8', double: false }, // lục neon
  { min: 30, name: 'BẠCH KIM',    main: '#22e5ff', light: '#9bf3ff', dark: '#0e8fa8', accent: '#ffe14d', double: true },  // cyan
  { min: 40, name: 'KIM CƯƠNG',   main: '#6d94ff', light: '#b4c8ff', dark: '#2a4fc2', accent: '#39ff88', double: true },  // xanh điện
  { min: 50, name: 'HUYỀN THOẠI', main: '#ff59e6', light: '#ffb8f5', dark: '#a8209a', accent: '#6bffb8', double: true, rainbow: true }, // magenta ánh cầu vồng
];

// 11 bậc (đổi mỗi 5 cấp): xen giữa 6 bậc chính là 5 "nửa bậc +" (step 1, tên bậc chính giữ nguyên để IDX[tier.name] của các phần khung vẫn chạy).
// Nửa bậc: main/light/dark = trộn 50% giữa bậc chính của nó và bậc chính kế tiếp; accent sáng hơn ~10%; label = 'ĐỒNG I' / 'ĐỒNG II' / ... / 'HUYỀN THOẠI'.
function mixHex(a, b, t) {
  const ch = (h, i) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  return `#${[0, 1, 2].map((i) => Math.round(ch(a, i) * (1 - t) + ch(b, i) * t).toString(16).padStart(2, '0')).join('')}`;
}
const TIERS = [];
BASE_TIERS.forEach((t, k) => {
  const next = BASE_TIERS[k + 1];
  TIERS.push({ ...t, i: TIERS.length, step: 0, label: next ? `${t.name} I` : t.name });
  if (next) {
    const main = mixHex(t.main, next.main, 0.5);
    TIERS.push({
      i: TIERS.length,
      min: t.min + 5,
      name: t.name,
      step: 1,
      label: `${t.name} II`,
      main,
      light: mixHex(t.light, next.light, 0.5),
      dark: mixHex(t.dark, next.dark, 0.5),
      accent: mixHex(t.accent || main, '#ffffff', 0.1),
      double: t.double,
      rainbow: false,
    });
  }
});

// Bậc sao 55–100 (K-7): nối đuôi chỉ số 11..20, KHÔNG đổi chỉ số 0..10. name giữ 'HUYỀN THOẠI' (IDX[tier.name] của các phần khung vẫn chạy), star = 1..10.
// main ngả vàng kem 5%/sao, accent ngả trắng 6%/sao, light/dark giữ của HUYỀN THOẠI; cấp 100 = 'TỐI THƯỢNG' (max: true). label: 'HUYỀN THOẠI ★1'…'★9'.
const HT = BASE_TIERS[BASE_TIERS.length - 1];
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

// Màu nhấn 4 ô thông tin của thẻ /hoso (Thí Kiếm · Bang Chiến · Hoạt động · Thành tựu) cho hợp tông khung này. Thiếu -> card.js giữ màu ô cũ.
const PANEL_TINT = { rank: '#ffb454', bc: '#22b8d9', act: '#5fd68a', ach: '#f06bd0' };

module.exports = { TIERS, PANEL_TINT };
