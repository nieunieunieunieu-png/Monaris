// ===== hoso/frame/shop_cl_toanghe/index.js — gom export (bộ rồng bán lẻ, chủ đề Cửu Long Quy Nhất) =====
const load = (f) => { try { return require(f); } catch (e) { if (e.code === 'MODULE_NOT_FOUND') return {}; throw e; } };
// Crest rồng cao ~82 đơn vị (y −46..+36) nên cần lề trên lớn hơn mặc định 76: TOP_M + 8 − (36+46)·2 ≥ 0 → 160 (đỉnh crest không bị cắt). Lề khác giữ mặc định.
const frameMargins = () => ({ TOP_M: 160, BOT_M: 34, LEFT_M: 40, RIGHT_M: 40 });
module.exports = { id: 'shop_cl_toanghe', name: 'Toan Nghê Hương Vân', rarity: 'common', frameMargins, ...load('./colors'), ...load('./avatar'), ...load('./accents'), ...load('./crest'), ...load('./border'), ...load('./side'), ...load('./bottom') };
