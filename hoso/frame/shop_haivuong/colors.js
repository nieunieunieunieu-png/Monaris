// ===== hoso/frame/shop_haivuong/colors.js — bảng màu CỐ ĐỊNH (1 bậc) =====
const TIERS = [{ min: 0, name: 'HẢI VƯƠNG', main: '#0077B6', light: '#90E0EF', dark: '#023E7D', accent: '#D4AF37', double: true, gold: '#D4AF37', goldLight: '#F3D977', goldDark: '#8F6B12', pearl: '#FFF5E6', foam: '#E8FAFF', coral: '#FF6B6B', coralDark: '#B83A4B' }];
// Màu nhấn 4 ô thông tin của thẻ /hoso (Thí Kiếm · Bang Chiến · Hoạt động · Thành tựu) cho hợp tông khung này. Thiếu -> card.js giữ màu ô cũ.
const PANEL_TINT = { rank: '#d4af37', bc: '#3fa7d6', act: '#3fc9b0', ach: '#ff7f6b' };

module.exports = { TIERS, PANEL_TINT };
