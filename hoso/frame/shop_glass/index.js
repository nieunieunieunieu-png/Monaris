// ===== hoso/frame/shop_glass/index.js — gom export (phần nào chưa có thì bỏ qua) =====
const load = (f) => { try { return require(f); } catch (e) { if (e.code === 'MODULE_NOT_FOUND') return {}; throw e; } };
module.exports = { id: 'shop_glass', name: 'Minimal Glassmorphism', rarity: 'common', ...load('./colors'), ...load('./avatar'), ...load('./accents'), ...load('./crest'), ...load('./border'), ...load('./side'), ...load('./bottom') };
