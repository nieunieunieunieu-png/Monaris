// ===== congDuc/catalog.js — danh mục Cửa hàng Công Đức (dữ liệu thuần, không ghi gì) =====
// Bán BỘ KHUNG theo đúng mô hình shop/catalog.js nhưng trả bằng Điểm Lòng Thành. Id bắt đầu `cd_` (thư mục hoso/frame/<id>/ như các khung khác).
// Danh mục RỖNG được: cửa hàng hiện "Sắp mở bán". Khi có bộ khung Phật pháp mới (làm riêng theo docs/KHUNG_SHOP_PROMPT.md): tạo hoso/frame/cd_xxx/ rồi thêm id vào CD_ITEM_IDS.
// Tên + độ hiếm lấy từ index.js của bộ khung. Giá = giá shop Level theo độ hiếm × CONG_DUC_SHOP_PRICE_MULT (mặc định 60); ghi đè từng bộ bằng ENV CONG_DUC_SHOP_PRICES=id=giá,…
const cfg = require('../config/congDuc');
const { PRICE_BY_RARITY } = require('../config/shop');

const CD_ITEM_IDS = [];

let styleLookup = (id) => { try { return require('../hoso/frame/registry').getStyle(id); } catch { return null; } };
function setStyleLookup(fn) { styleLookup = fn; } // chỉ dùng cho test

const isCdId = (id) => /^cd_[a-z0-9_]{1,60}$/.test(String(id || ''));

function priceOf(id, rarity) {
  if (Object.prototype.hasOwnProperty.call(cfg.CONG_DUC_SHOP_PRICE_OVERRIDE, id)) return cfg.CONG_DUC_SHOP_PRICE_OVERRIDE[id];
  const base = PRICE_BY_RARITY[rarity];
  return Number.isFinite(base) ? Math.round(base * cfg.CONG_DUC_SHOP_PRICE_MULT) : null;
}

// { id, name, rarity, price (null = không bán), available (bộ khung có thật trong bot) } hoặc null nếu id không nằm trong danh mục.
function getItem(id) {
  if (!CD_ITEM_IDS.includes(id)) return null;
  const s = styleLookup(id);
  const rarity = (s && s.rarity) || 'common';
  return { id, name: (s && s.name) || id, rarity, price: priceOf(id, rarity), available: Boolean(s) };
}
const listItems = () => CD_ITEM_IDS.map(getItem).filter(Boolean);

module.exports = { CD_ITEM_IDS, isCdId, getItem, listItems, priceOf, setStyleLookup };
