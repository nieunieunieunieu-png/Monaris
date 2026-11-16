// ===== hoso/frame/shop_cyber/index.js — gom export (phần nào chưa có thì bỏ qua) =====
const load = (f) => { try { return require(f); } catch (e) { if (e.code === 'MODULE_NOT_FOUND') return {}; throw e; } };
module.exports = { id: 'shop_cyber', name: 'Cyber Neon Pulse', rarity: 'epic', ...load('./colors'), ...load('./avatar'), ...load('./accents'), ...load('./crest'), ...load('./border'), ...load('./side'), ...load('./bottom') };
