// ===== hoso/frame/shop_mech/colors.js — bảng màu CỐ ĐỊNH (1 bậc) =====
const TIERS = [{ min: 0, name: 'TITAN', main: '#6C7293', light: '#C9CCE0', dark: '#22223B', accent: '#F4A261', double: true, warn: '#E63946', yellow: '#FFD60A', plate: '#9AA0BC' }];
// Màu nhấn 4 ô thông tin của thẻ /hoso (Thí Kiếm · Bang Chiến · Hoạt động · Thành tựu) cho hợp tông khung này. Thiếu -> card.js giữ màu ô cũ.
const PANEL_TINT = { rank: '#ffd60a', bc: '#6c8fd0', act: '#5ec28a', ach: '#f4a261' };

module.exports = { TIERS, PANEL_TINT };
