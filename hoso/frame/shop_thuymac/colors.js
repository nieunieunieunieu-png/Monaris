// ===== hoso/frame/shop_thuymac/colors.js — bảng màu CỐ ĐỊNH (1 bậc) =====
const TIERS = [{ min: 0, name: 'THỦY MẶC', main: '#BDBDB0', light: '#F5F5DC', dark: '#1A1A1A', accent: '#C0392B', double: false, ink: '#1A1A1A', wash: '#6B6B63' }];
// Màu nhấn 4 ô thông tin của thẻ /hoso (Thí Kiếm · Bang Chiến · Hoạt động · Thành tựu) cho hợp tông khung này. Thiếu -> card.js giữ màu ô cũ.
const PANEL_TINT = { rank: '#d4b36a', bc: '#8a9a9a', act: '#8aa88a', ach: '#c0392b' };

module.exports = { TIERS, PANEL_TINT };
