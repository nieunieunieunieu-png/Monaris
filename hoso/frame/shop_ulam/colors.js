// ===== hoso/frame/shop_ulam/colors.js — bảng màu CỐ ĐỊNH (1 bậc) =====
const TIERS = [{ min: 0, name: 'U LÂM', main: '#52B788', light: '#D8F3DC', dark: '#2D6A4F', accent: '#E9F5A1', double: true, wood: '#B79455', woodDark: '#7A5C2E', firefly: '#E9F5A1', bloom: '#FFF1F5', bloomEdge: '#F4A6C0', core: '#FFD166' }];
// Màu nhấn 4 ô thông tin của thẻ /hoso (Thí Kiếm · Bang Chiến · Hoạt động · Thành tựu) cho hợp tông khung này. Thiếu -> card.js giữ màu ô cũ.
const PANEL_TINT = { rank: '#ffd166', bc: '#6dbfd0', act: '#52b788', ach: '#f4a6c0' };

module.exports = { TIERS, PANEL_TINT };
