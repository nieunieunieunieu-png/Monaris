// ===== hoso/frame/cd_lienhoa/index.js — gom export khung "Liên Hoa Cảnh Giới" (10 bậc theo cảnh giới Công Đức; tự đổi bậc, không bán/không chọn tay) =====
const load = (f) => { try { return require(f); } catch (e) { if (e.code === 'MODULE_NOT_FOUND') return {}; throw e; } };
module.exports = { id: 'cd_lienhoa', name: 'Liên Hoa Cảnh Giới', rarity: 'mythic', auto: true, ...load('./colors'), ...load('./avatar'), ...load('./accents'), ...load('./crest'), ...load('./border'), ...load('./side'), ...load('./bottom') };
