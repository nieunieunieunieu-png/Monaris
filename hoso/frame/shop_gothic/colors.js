// ===== hoso/frame/shop_gothic/colors.js — bảng màu CỐ ĐỊNH (1 bậc) =====
const TIERS = [{ min: 0, name: 'ÁC MA', main: '#8C1C34', light: '#E6E6FA', dark: '#2A060C', accent: '#C1121F', double: true, blood: '#C1121F', bloodDark: '#6B0F14', wing: '#1A0309', thorn: '#FF4D8D', rose: '#B5179E' }];
// Màu nhấn 4 ô thông tin của thẻ /hoso (Thí Kiếm · Bang Chiến · Hoạt động · Thành tựu) cho hợp tông khung này. Thiếu -> card.js giữ màu ô cũ.
const PANEL_TINT = { rank: '#d7b36a', bc: '#8b6fb8', act: '#4f9a7a', ach: '#c1121f' };

module.exports = { TIERS, PANEL_TINT };
