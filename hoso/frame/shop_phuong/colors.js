// ===== hoso/frame/shop_phuong/colors.js — bảng màu CỐ ĐỊNH (1 bậc) =====
const TIERS = [{ min: 0, name: 'HỎA PHƯỢNG', main: '#FF4500', light: '#FFE680', dark: '#800000', accent: '#FFD700', double: true, ember: '#FF7A1A' }];
// Màu nhấn 4 ô thông tin của thẻ /hoso (Thí Kiếm · Bang Chiến · Hoạt động · Thành tựu) cho hợp tông khung này. Thiếu -> card.js giữ màu ô cũ.
const PANEL_TINT = { rank: '#ffd700', bc: '#ff8c42', act: '#f2c14e', ach: '#ff4500' };

module.exports = { TIERS, PANEL_TINT };
