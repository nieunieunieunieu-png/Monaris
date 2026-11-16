// ===== hoso/frame/shop_cuulong/colors.js — CỬU LONG CHÍ TÔN: vàng kim hoàng gia + bảng màu 9 nguyên tố (docs mục 4, 5, 9A.6) =====
// Bậc cố định (1 bậc). `dragons[i]` = màu rồng i (i theo thứ tự bit/mục 4); id khớp hoso/dragonKit.CL_IDS.
const TIERS = [{
  min: 0, name: 'CỬU LONG CHÍ TÔN', main: '#F2B705', light: '#FFF1B0', dark: '#6B4300', accent: '#FFD84A', double: true,
  gold2: '#C98A00', gold3: '#FFE27A', void: '#1E1200', plate: '#2A1A04',
  dragons: [
    { id: 'shop_cl_bolao', name: 'Bồ Lao', main: '#E8A317', light: '#FFF1B8', dark: '#5A3200', accent: '#FF6B35' },
    { id: 'shop_cl_tunguu', name: 'Tù Ngưu', main: '#C77DFF', light: '#F0DBFF', dark: '#3C096C', accent: '#FFD166' },
    { id: 'shop_cl_nhaitri', name: 'Nhai Tí', main: '#C9CCD6', light: '#FFFFFF', dark: '#2B2D42', accent: '#E63946' },
    { id: 'shop_cl_xivan', name: 'Xi Vẫn', main: '#FF4D00', light: '#FFD38A', dark: '#7A1500', accent: '#FFE600' },
    { id: 'shop_cl_baha', name: 'Bá Hạ', main: '#2A9D8F', light: '#B8F2E6', dark: '#14403B', accent: '#E9C46A' },
    { id: 'shop_cl_bean', name: 'Bệ Ngạn', main: '#6A994E', light: '#D8F3B5', dark: '#25401A', accent: '#FFB703' },
    { id: 'shop_cl_phuhi', name: 'Phụ Hí', main: '#3A86FF', light: '#CFE3FF', dark: '#0B2A66', accent: '#F5F5DC' },
    { id: 'shop_cl_thaotiet', name: 'Thao Thiết', main: '#5E2BFF', light: '#D6C8FF', dark: '#12003D', accent: '#00F5D4' },
    { id: 'shop_cl_toanghe', name: 'Toan Nghê', main: '#F4A6C0', light: '#FFE9F1', dark: '#7A2E4D', accent: '#FFD166' },
  ],
}];
// Màu nhấn 4 ô thông tin thẻ /hoso (khung Chí Tôn thay hẳn viền ô ở CLCT-4; đây là màu dự phòng khi chưa có panel.js).
const PANEL_TINT = { rank: '#ffd24a', bc: '#ffb81f', act: '#ffe27a', ach: '#ffc83d' };

// NÂNG CẤP NÉT VẼ: đỉnh phóng ≈1.3× (rồng cao ~100px thay vì ~75px trong ảnh thẻ) + lề trên tăng theo; rồng đã sở hữu có bộ lọc tạo khối (shared.RELIEF).
// Lề thẻ theo mốc thức tỉnh (docs 9A.6): 0–2 / 3–5 / 6–8 / 9 rồng. ctx thiếu/hỏng -> mốc 0.
// CLCT-7: nâng TOP_M (0–2: 132→144, 3–5: 148→152, 9: 184→200) và BOT_M (0–2: 44→56, 3–5: 52→56) sau khi đo raster 29 tổ hợp —
// tia sao n=9 cao tới y=-64 (cũ giới hạn -60 → bị cắt), quầng rồng hàng sau tới y=-48, đĩa Thao Thiết chân thẻ tới y=+30.8 (×BOTTOM_SCALE).
const MARGINS = [
  { TOP_M: 190, BOT_M: 60, LEFT_M: 56, RIGHT_M: 56, CREST_SCALE: 2.2, BOTTOM_SCALE: 1.5 },
  { TOP_M: 202, BOT_M: 60, LEFT_M: 64, RIGHT_M: 64, CREST_SCALE: 2.35, BOTTOM_SCALE: 1.5 },
  { TOP_M: 220, BOT_M: 64, LEFT_M: 72, RIGHT_M: 72, CREST_SCALE: 2.5, BOTTOM_SCALE: 1.6 },
  { TOP_M: 262, BOT_M: 76, LEFT_M: 84, RIGHT_M: 84, CREST_SCALE: 2.6, BOTTOM_SCALE: 1.7 },
];
function frameMargins(ctx) {
  const n = ctx && Number.isInteger(ctx.n) ? ctx.n : 0;
  return { ...MARGINS[n >= 9 ? 3 : n >= 6 ? 2 : n >= 3 ? 1 : 0] };
}
// CLCT-6: tên ánh kim khi thức tỉnh hoàn toàn (9/9) và người dùng chưa tự chọn màu chữ: dải vàng sáng–vàng đậm–vàng sáng (5 điểm dừng tạo vệt phản chiếu kim loại).
const GOLD_NAME = ['#fff8d6', '#ffd84a', '#c98a00', '#ffe27a', '#fff1b0'];
const nameColors = (_tier, ctx) => (ctx && ctx.n >= 9 ? GOLD_NAME.slice() : null);
const fx = { grain: 0.55, glow: 0.22, sheen: 0.22 }; // hậu kỳ khung (hoso/frameFx.js)
module.exports = { TIERS, PANEL_TINT, frameMargins, nameColors, fx };
