// ===== hoso/frame/shop_cuulong/index.js — gom export CỬU LONG CHÍ TÔN (bộ tối thượng, bán 9999 điểm; thức tỉnh theo số rồng sở hữu) =====
// Mới có: colors (+PANEL_TINT, frameMargins), avatar, accents. crest/border/side/bottom/panel/plate thêm ở CLCT-2…5 (thiếu thì dùng khung mặc định).
const load = (f) => { try { return require(f); } catch (e) { if (e.code === 'MODULE_NOT_FOUND' && String(e.message).includes(f.replace('./', ''))) return {}; throw e; } };
module.exports = {
  id: 'shop_cuulong', sideClip: true, name: 'Cửu Long Chí Tôn', rarity: 'divine',
  ...load('./colors'), ...load('./avatar'), ...load('./accents'), ...load('./crest'), ...load('./border'), ...load('./side'), ...load('./bottom'), ...load('./panel'), ...load('./plate'),
};
