// ===== hoso/frame/shop_void/colors.js — bảng màu CỐ ĐỊNH (1 bậc) =====
const TIERS = [{ min: 0, name: 'VOID', main: '#7209B7', light: '#C084FC', dark: '#3A0CA3', accent: '#4CC9F0', double: true, deep: '#12002B', cyan: '#4CC9F0', star: '#F3E8FF' }];
// Màu nhấn 4 ô thông tin của thẻ /hoso (Thí Kiếm · Bang Chiến · Hoạt động · Thành tựu) cho hợp tông khung này. Thiếu -> card.js giữ màu ô cũ.
const PANEL_TINT = { rank: '#f3e8ff', bc: '#4cc9f0', act: '#5fe0c0', ach: '#c084fc' };

module.exports = { TIERS, PANEL_TINT };
