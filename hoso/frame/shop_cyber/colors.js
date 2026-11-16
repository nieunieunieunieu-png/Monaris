// ===== hoso/frame/shop_cyber/colors.js — bảng màu CỐ ĐỊNH (1 bậc) =====
const TIERS = [{ min: 0, name: 'CYBER', main: '#00F5FF', light: '#B8FDFF', dark: '#0A4A57', accent: '#FF007F', double: true, pink: '#FF007F', bg: '#06161C', steel: '#2B3A44' }];
// Màu nhấn 4 ô thông tin của thẻ /hoso (Thí Kiếm · Bang Chiến · Hoạt động · Thành tựu) cho hợp tông khung này. Thiếu -> card.js giữ màu ô cũ.
const PANEL_TINT = { rank: '#ffd23f', bc: '#00f5ff', act: '#3dffa0', ach: '#ff3da0' };

module.exports = { TIERS, PANEL_TINT };
