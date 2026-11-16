// ===== hoso/frame/shop_arcade/colors.js — bảng màu CỐ ĐỊNH (1 bậc) =====
const TIERS = [{ min: 0, name: 'ARCADE', main: '#FF007F', light: '#FF7AC0', dark: '#7A0040', accent: '#FFBE0B', double: true, blue: '#3A86EF', bg: '#1A0A2E' }];
// Màu nhấn 4 ô thông tin của thẻ /hoso (Thí Kiếm · Bang Chiến · Hoạt động · Thành tựu) cho hợp tông khung này. Thiếu -> card.js giữ màu ô cũ.
const PANEL_TINT = { rank: '#ffbe0b', bc: '#3a86ef', act: '#2ee6a6', ach: '#ff007f' };

module.exports = { TIERS, PANEL_TINT };
