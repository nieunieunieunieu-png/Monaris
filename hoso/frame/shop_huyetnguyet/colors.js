// ===== hoso/frame/shop_huyetnguyet/colors.js — bảng màu CỐ ĐỊNH (1 bậc) =====
const TIERS = [{ min: 0, name: 'HUYẾT NGUYỆT', main: '#FF1E27', light: '#FF7A80', dark: '#2B0000', accent: '#FF8C42', double: true, black: '#121212', blood: '#8E0A12', ember: '#FF8C42', iron: '#4A4F5A', ironLight: '#9AA0AC', bone: '#D8CFC0' }];
// Màu nhấn 4 ô thông tin của thẻ /hoso (Thí Kiếm · Bang Chiến · Hoạt động · Thành tựu) cho hợp tông khung này. Thiếu -> card.js giữ màu ô cũ.
const PANEL_TINT = { rank: '#ff8c42', bc: '#9aa0ac', act: '#7f9a7a', ach: '#ff1e27' };

module.exports = { TIERS, PANEL_TINT };
