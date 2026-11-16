// ===== hoso/frame/shop_mech/index.js — gom export (phần nào chưa có thì bỏ qua) =====
const load = (f) => { try { return require(f); } catch (e) { if (e.code === 'MODULE_NOT_FOUND') return {}; throw e; } };
module.exports = { id: 'shop_mech', name: 'Mech Titan Armor', rarity: 'rare', ...load('./colors'), ...load('./avatar'), ...load('./accents'), ...load('./crest'), ...load('./border'), ...load('./side'), ...load('./bottom') };
