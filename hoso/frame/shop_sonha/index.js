// ===== hoso/frame/shop_sonha/index.js — gom export (BỘ THƯỞNG: mở khi mua đủ 3 bộ cùng chủ đề, xem shop/catalog.js) =====
const load = (f) => { try { return require(f); } catch (e) { if (e.code === 'MODULE_NOT_FOUND') return {}; throw e; } };
module.exports = { id: 'shop_sonha', name: 'Sơn Hà Họa Quyển', rarity: 'mythic', bonus: true, ...load('./colors'), ...load('./avatar'), ...load('./accents'), ...load('./crest'), ...load('./border'), ...load('./side'), ...load('./bottom') };
