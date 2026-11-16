// ===== hoso/frame/shop_glass/colors.js — bảng màu CỐ ĐỊNH (1 bậc) =====
const TIERS = [{ min: 0, name: 'KÍNH MỜ', main: '#FFFFFF', light: '#FFFFFF', dark: '#8A94A6', accent: '#BFD7FF', double: false, frost: '#E6F0FF' }];
// Màu nhấn 4 ô thông tin của thẻ /hoso (Thí Kiếm · Bang Chiến · Hoạt động · Thành tựu) cho hợp tông khung này. Thiếu -> card.js giữ màu ô cũ.
const PANEL_TINT = { rank: '#f3e3b5', bc: '#bfd7ff', act: '#c4f0d8', ach: '#f0cde0' };

const fx = { glow: 0.16, sheen: 0.28 }; // kính: không vân kim loại (hoso/frameFx.js)
module.exports = { TIERS, PANEL_TINT, fx };
