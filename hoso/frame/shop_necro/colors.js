// ===== hoso/frame/shop_necro/colors.js — bảng màu CỐ ĐỊNH (1 bậc) =====
const TIERS = [{ min: 0, name: 'TỬ THẦN', main: '#54D6BB', light: '#B8F5E8', dark: '#102A43', accent: '#8CF0DC', double: true, bone: '#CBD5E1', boneDark: '#8A94A6', flame: '#3DDC97', flameDark: '#0B7A5A' }];
// Màu nhấn 4 ô thông tin của thẻ /hoso (Thí Kiếm · Bang Chiến · Hoạt động · Thành tựu) cho hợp tông khung này. Thiếu -> card.js giữ màu ô cũ.
const PANEL_TINT = { rank: '#cbd5e1', bc: '#54a8d6', act: '#3ddc97', ach: '#b48cf0' };

module.exports = { TIERS, PANEL_TINT };
