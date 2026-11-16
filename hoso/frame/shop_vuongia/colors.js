// ===== hoso/frame/shop_vuongia/colors.js — bảng màu CỐ ĐỊNH (1 bậc) =====
const TIERS = [{ min: 0, name: 'HOÀNG KIM', main: '#FFD700', light: '#FFF3B0', dark: '#7A5C00', accent: '#E0115F', double: true, silver: '#C0C0C0', velvet: '#1A1A1A', ruby: '#E0115F', rubyDark: '#7A0A30' }];
// Màu nhấn 4 ô thông tin của thẻ /hoso (Thí Kiếm · Bang Chiến · Hoạt động · Thành tựu) cho hợp tông khung này. Thiếu -> card.js giữ màu ô cũ.
const PANEL_TINT = { rank: '#ffd700', bc: '#9fb4c8', act: '#8fbf8f', ach: '#e0115f' };

const fx = { grain: 0.45, glow: 0.18, sheen: 0.18 }; // hậu kỳ khung (hoso/frameFx.js)
module.exports = { TIERS, PANEL_TINT, fx };
