// ===== hoso/frame/shop_thanlong/index.js — gom export (BỘ THƯỞNG: mở khi mua đủ 3 bộ Long Vân + Lôi Điện + Rừng Thiêng, xem shop/catalog.js) =====
const load = (f) => { try { return require(f); } catch (e) { if (e.code === 'MODULE_NOT_FOUND') return {}; throw e; } };
module.exports = { id: 'shop_thanlong', name: 'Cửu Thiên Thần Long', rarity: 'mythic', bonus: true, ...load('./colors'), ...load('./avatar'), ...load('./accents'), ...load('./crest'), ...load('./border'), ...load('./side'), ...load('./bottom') };
