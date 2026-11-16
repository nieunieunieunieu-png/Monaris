// hoso/frame/linhvat/colors.js — bảng màu 21 bậc (6 chính + 5 nửa bậc + + 10 bậc sao 55–100) phong cách Linh vật (màu kẹo pastel ấm, tươi vui)
// Có thêm cột accent (màu nhấn cho má hồng/ngọc/điểm sáng). File tự chứa, không require gì.
const BASE_TIERS = [
  { min: 0,  name: 'ĐỒNG',        main: '#e08a4f', light: '#ffc9a0', dark: '#8f4a1f', accent: '#7be0c3', double: false }, // cam đất
  { min: 10, name: 'BẠC',         main: '#d8cfbd', light: '#fffaf0', dark: '#8a806d', accent: '#ff8fb1', double: false }, // kem bạc
  { min: 20, name: 'VÀNG',        main: '#ffc94a', light: '#ffe9a6', dark: '#b07a10', accent: '#ff7f9f', double: false }, // vàng mật
  { min: 30, name: 'BẠCH KIM',    main: '#6fe3c1', light: '#c4fbe9', dark: '#1f9a7c', accent: '#ffb3c6', double: true },  // xanh bạc hà
  { min: 40, name: 'KIM CƯƠNG',   main: '#6cc0ff', light: '#c3e5ff', dark: '#2a7bc4', accent: '#ffd36b', double: true },  // xanh trời
  { min: 50, name: 'HUYỀN THOẠI', main: '#ff7fd9', light: '#ffd2f3', dark: '#a14cc7', accent: '#ffe36b', double: true, rainbow: true }, // hồng tím cầu vồng
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
const PANEL_TINT = { rank: '#ffc94a', bc: '#7cc6f0', act: '#7be0b0', ach: '#ff9fb0' };

module.exports = { TIERS, PANEL_TINT };
