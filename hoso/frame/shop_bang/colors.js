// ===== hoso/frame/shop_bang/colors.js — bảng màu CỐ ĐỊNH (1 bậc) =====
const TIERS = [{ min: 0, name: 'U SƯƠNG', main: '#00B4D8', light: '#E0F7FA', dark: '#0B5F86', accent: '#FFFFFF', double: true, frost: '#7FD8EE' }];
// Màu nhấn 4 ô thông tin của thẻ /hoso (Thí Kiếm · Bang Chiến · Hoạt động · Thành tựu) cho hợp tông khung này. Thiếu -> card.js giữ màu ô cũ.
const PANEL_TINT = { rank: '#cfe9f5', bc: '#00b4d8', act: '#7fe0d0', ach: '#9ab8ff' };

module.exports = { TIERS, PANEL_TINT };
