// ===== hoso/frame/shop_hancung/colors.js — bảng màu CỐ ĐỊNH (1 bậc) =====
const TIERS = [{ min: 0, name: 'HÁN CUNG', main: '#D4AF37', light: '#FFF8DC', dark: '#8B0000', accent: '#2FBF9A', double: true, jade: '#2FBF9A', jadeDark: '#14705A', silk: '#C1121F' }];
// Màu nhấn 4 ô thông tin của thẻ /hoso (Thí Kiếm · Bang Chiến · Hoạt động · Thành tựu) cho hợp tông khung này. Thiếu -> card.js giữ màu ô cũ.
const PANEL_TINT = { rank: '#d4af37', bc: '#3a8fa8', act: '#2fbf9a', ach: '#c1472f' };

module.exports = { TIERS, PANEL_TINT };
