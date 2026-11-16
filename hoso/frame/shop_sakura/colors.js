// ===== hoso/frame/shop_sakura/colors.js — bảng màu CỐ ĐỊNH (1 bậc) =====
const TIERS = [{ min: 0, name: 'SAKURA', main: '#FFB7B2', light: '#FFFFFF', dark: '#D9777F', accent: '#FFDAC1', double: true, torii: '#E2474B', wood: '#8C5A5E' }];
// Màu nhấn 4 ô thông tin của thẻ /hoso (Thí Kiếm · Bang Chiến · Hoạt động · Thành tựu) cho hợp tông khung này. Thiếu -> card.js giữ màu ô cũ.
const PANEL_TINT = { rank: '#ffd9a0', bc: '#b6a9f0', act: '#a8e0c4', ach: '#ff9aa8' };

module.exports = { TIERS, PANEL_TINT };
