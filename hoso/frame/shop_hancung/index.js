// ===== hoso/frame/shop_hancung/index.js — gom export (phần nào chưa có thì bỏ qua) =====
const load = (f) => { try { return require(f); } catch (e) { if (e.code === 'MODULE_NOT_FOUND') return {}; throw e; } };
module.exports = { id: 'shop_hancung', name: 'Monaris Hán Cung', rarity: 'legendary', ...load('./colors'), ...load('./avatar'), ...load('./accents'), ...load('./crest'), ...load('./border'), ...load('./side'), ...load('./bottom') };
