// ===== hoso/frame/tutien/colors.js — màu 21 bậc (6 chính + 5 nửa bậc + + 10 bậc sao 55–100) phong cách TU TIÊN =====
// Xanh đồng -> bạc ngọc -> vàng ngọc -> lục bích -> lam thiên -> tím hồng cầu vồng. accent = màu nhấn cho ngọc/điểm sáng.
const BASE_TIERS = [
  { min: 0, name: 'ĐỒNG', main: '#6fa88f', light: '#b8dfcc', dark: '#3a6a57', accent: '#f2d58a', double: false },
  { min: 10, name: 'BẠC', main: '#c4d4d8', light: '#eef6f7', dark: '#7c9094', accent: '#7fe0c8', double: false },
  { min: 20, name: 'VÀNG', main: '#e8cf7a', light: '#fff3c2', dark: '#9c7f2a', accent: '#6fe3b5', double: false },
  { min: 30, name: 'BẠCH KIM', main: '#3fd6a0', light: '#c2f6e2', dark: '#1a8a68', accent: '#fff0a8', double: true },
  { min: 40, name: 'KIM CƯƠNG', main: '#5aa9ff', light: '#d0e6ff', dark: '#2858b8', accent: '#ffe49a', double: true },
  { min: 50, name: 'HUYỀN THOẠI', main: '#c77dff', light: '#f1dbff', dark: '#7a35c9', accent: '#ffe08a', double: true, rainbow: true },
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
const PANEL_TINT = { rank: '#e0c56e', bc: '#6fb8d6', act: '#5fcfa0', ach: '#e3a46a' };

module.exports = { TIERS, PANEL_TINT };
