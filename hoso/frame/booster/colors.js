// ===== hoso/frame/booster/colors.js — bảng màu CỐ ĐỊNH (1 bậc): hồng boost → tím tinh thể =====
const TIERS = [{ min: 0, name: 'NITRO BOOST', main: '#F47FFF', light: '#FFD3FF', dark: '#5B1E9A', accent: '#7B5CFF', double: true, ice: '#7CE8FF', violet: '#9B5CFF' }];
// Màu nhấn 4 ô thông tin của thẻ /hoso (Thí Kiếm · Bang Chiến · Hoạt động · Thành tựu) cho hợp tông khung này. Thiếu -> card.js giữ màu ô cũ.
const PANEL_TINT = { rank: '#f9a8ff', bc: '#a78bfa', act: '#7ce8ff', ach: '#ff8fd8' };

module.exports = { TIERS, PANEL_TINT };
