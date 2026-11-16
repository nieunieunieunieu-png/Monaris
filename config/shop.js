// ===== config/shop.js — Cửa hàng khung hồ sơ /hoso (mua bằng ĐIỂM EVENT) =====
// Điểm = cột "Điểm còn lại" của tab "Điểm Hoạt Động" (spreadsheet Level); mỗi lần mua bot ghi 1 dòng vào tab "Lịch Sử Dùng Điểm" (trừ điểm, KHÔNG trừ EXP/Cấp).
// Khung đã sở hữu lưu ở tab "Shop Khung" (bot tự tạo). Bảng giá gốc theo độ hiếm; sửa giá từng bộ bằng ENV hoặc sửa PRICE_BY_RARITY bên dưới.
//   SHOP_ENABLED=false        : tắt cửa hàng (khung shop_* quay về khoá cứng như trước)
//   SHOP_BUNDLE_REQUIRED=3    : số bộ phải sở hữu TRONG CÙNG 1 chủ đề để mở bộ thưởng của chủ đề đó
//   SHOP_PRICES=shop_bang=800,shop_glass=300 : ghi đè giá từng bộ (điểm)
//   SHOP_SHEET_NAME=Shop Khung : tên tab lưu khung đã sở hữu
const SHOP_ENABLED = !/^(0|false|off|no)$/i.test(String(process.env.SHOP_ENABLED || 'true').trim());
const SHOP_SHEET_NAME = process.env.SHOP_SHEET_NAME || 'Shop Khung';
const SHOP_BUNDLE_REQUIRED = Math.max(1, Math.floor(Number(process.env.SHOP_BUNDLE_REQUIRED)) || 3);

// Giá gốc theo độ hiếm (điểm). Bộ thưởng (rarity 'mythic') KHÔNG bán, chỉ mở khi đủ SHOP_BUNDLE_REQUIRED bộ cùng chủ đề.
const PRICE_BY_RARITY = { common: 500, rare: 900, epic: 1500, legendary: 2500 };

// Giá RIÊNG của chủ đề Cửu Long Quy Nhất (hàng cao cấp, docs/KHUNG_CUULONG_PROMPT.md mục 4–5): KHÔNG đổi PRICE_BY_RARITY chung nên 19 bộ cũ giữ nguyên giá.
// Chí Tôn 9,999 + 9 bộ rồng 61,995 = 71,994. ENV SHOP_PRICES vẫn ghi đè được từng id.
const CUULONG_IDS = ['shop_cl_bolao', 'shop_cl_tunguu', 'shop_cl_nhaitri', 'shop_cl_xivan', 'shop_cl_baha', 'shop_cl_bean', 'shop_cl_phuhi', 'shop_cl_thaotiet', 'shop_cl_toanghe'];
const CUULONG_SOLD_ID = 'shop_cuulong';
// Kênh đăng thông báo khi có người thức tỉnh 9/9 (có Chí Tôn + đủ 9 rồng). Trống = không đăng. Số thứ tự "Chí Tôn thứ N của bang" ghi ở tab Shop Khung bằng dòng đánh dấu Khung ID = CUULONG_RANK_MARK (Giá = N).
const CUULONG_ANNOUNCE_CHANNEL_ID = String(process.env.CUULONG_ANNOUNCE_CHANNEL_ID || '').trim();
const CUULONG_RANK_MARK = 'cuulong_9of9';
const PRICE_OVERRIDE = {
  shop_cl_bolao: 6666, shop_cl_tunguu: 6666, shop_cl_nhaitri: 9999, shop_cl_xivan: 9999, shop_cl_baha: 6666,
  shop_cl_bean: 4500, shop_cl_phuhi: 4500, shop_cl_thaotiet: 9999, shop_cl_toanghe: 3000, shop_cuulong: 9999,
};
for (const piece of String(process.env.SHOP_PRICES || '').split(',')) {
  const [id, v] = piece.split('=').map((x) => (x || '').trim());
  const n = Number(v);
  if (id && Number.isFinite(n) && n >= 0) PRICE_OVERRIDE[id] = Math.round(n);
}

// 6 CHỦ ĐỀ có bộ thưởng + chủ đề Cửu Long (xem dưới): mua đủ SHOP_BUNDLE_REQUIRED bộ trong 1 chủ đề -> mở `bonus` (bộ thưởng, đẹp hơn bộ thường). 19 bộ bán = 3+3+3+3+4+3.
const SHOP_GROUPS = [
  { key: 'hoanggia', emoji: '👑', name: 'Hoàng Gia Kim Loan', members: ['shop_hancung', 'shop_vuongia', 'shop_phuong'], bonus: 'shop_thienhoang' },
  { key: 'thihoa', emoji: '🏞️', name: 'Thi Họa Giang Sơn', members: ['shop_thuymac', 'shop_sakura', 'shop_ulam'], bonus: 'shop_sonha' },
  { key: 'bangbien', emoji: '❄️', name: 'Băng Hải Thanh Quang', members: ['shop_bang', 'shop_haivuong', 'shop_glass'], bonus: 'shop_cucquang' },
  { key: 'hacam', emoji: '🩸', name: 'Hắc Ám Ma Giới', members: ['shop_huyetnguyet', 'shop_gothic', 'shop_necro'], bonus: 'shop_tula' },
  { key: 'khoahuyen', emoji: '🚀', name: 'Khoa Huyễn Tương Lai', members: ['shop_cyber', 'shop_mech', 'shop_void', 'shop_arcade'], bonus: 'shop_luongtu' },
  { key: 'longlinh', emoji: '🐉', name: 'Long Lôi Linh Mộc', members: ['shop_longvan', 'shop_loidien', 'shop_rungthieng'], bonus: 'shop_thanlong' },
  // Chủ đề thứ 7: KHÔNG có bộ thưởng tự mở (bonus: null). Thay vào đó `sold` = bộ tối thượng Cửu Long Chí Tôn BÁN 9999 điểm, mua thẳng không cần có rồng nào;
  // mỗi bộ rồng sở hữu sẽ "thức tỉnh" 1 con trên khung Chí Tôn (hoso/frame/shop_cuulong). `members` = 9 bộ rồng bán lẻ.
  { key: 'cuulong', emoji: '🐲', name: 'Cửu Long Quy Nhất', members: CUULONG_IDS, bonus: null, sold: CUULONG_SOLD_ID },
];

module.exports = { SHOP_ENABLED, SHOP_SHEET_NAME, SHOP_BUNDLE_REQUIRED, PRICE_BY_RARITY, PRICE_OVERRIDE, SHOP_GROUPS, CUULONG_IDS, CUULONG_SOLD_ID, CUULONG_ANNOUNCE_CHANNEL_ID, CUULONG_RANK_MARK };
