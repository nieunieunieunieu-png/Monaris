// ===== shop/catalog.js — danh mục cửa hàng: 19 bộ bán + 6 bộ thưởng + chủ đề Cửu Long (9 bộ rồng + Chí Tôn bán 9999), giá, chủ đề (dữ liệu thuần, không ghi gì) =====
// Tên + độ hiếm lấy từ index.js của từng bộ khung (hoso/frame/<id>/index.js) nên đổi tên ở đó là cửa hàng tự theo.
const { PRICE_BY_RARITY, PRICE_OVERRIDE, SHOP_GROUPS, SHOP_BUNDLE_REQUIRED } = require('../config/shop');
const { getStyle } = require('../hoso/frame/registry');

const RARITY_LABEL = { common: 'Thường', rare: 'Hiếm', epic: 'Sử thi', legendary: 'Huyền thoại', mythic: 'Thần thoại (thưởng)', divine: 'CHÍ TÔN' };
const RARITY_ICON = { common: '⚪', rare: '🔵', epic: '🟣', legendary: '🟡', mythic: '🔴', divine: '🐲' };

const groupOfMember = new Map();
const groupOfBonus = new Map();
const groupOfSold = new Map(); // bộ tối thượng BÁN (Chí Tôn) -> chủ đề; khác bộ thưởng: mua được, không cần đủ bộ
for (const g of SHOP_GROUPS) {
  g.members.forEach((id) => groupOfMember.set(id, g));
  if (g.bonus) groupOfBonus.set(g.bonus, g);
  if (g.sold) groupOfSold.set(g.sold, g);
}

const isBonusId = (id) => groupOfBonus.has(id);
const isSoldId = (id) => groupOfSold.has(id);
const isShopId = (id) => groupOfMember.has(id) || groupOfBonus.has(id) || groupOfSold.has(id);
// Chủ đề không có bộ thưởng tự mở (Cửu Long): chỉ có bộ bán `sold`.
const hasBonus = (group) => Boolean(group && group.bonus);

// { id, name, rarity, price, bonus, sold, group } — price = null với bộ thưởng (không bán). `sold: true` = bộ tối thượng bán thẳng (Chí Tôn).
function getItem(id) {
  if (!isShopId(id)) return null;
  const s = getStyle(id);
  const bonus = isBonusId(id);
  const sold = isSoldId(id);
  const rarity = (s && s.rarity) || (bonus ? 'mythic' : sold ? 'divine' : 'common');
  const price = bonus ? null : Object.prototype.hasOwnProperty.call(PRICE_OVERRIDE, id) ? PRICE_OVERRIDE[id] : PRICE_BY_RARITY[rarity] ?? 0;
  const group = bonus ? groupOfBonus.get(id) : sold ? groupOfSold.get(id) : groupOfMember.get(id);
  return { id, name: (s && s.name) || id, rarity, price, bonus, sold, group, available: Boolean(s) };
}

// Mục "đỉnh" của 1 chủ đề: bộ thưởng (chủ đề cũ) hoặc bộ Chí Tôn bán (Cửu Long).
const topItemOf = (group) => getItem(group.bonus || group.sold);

// Mọi mục theo thứ tự chủ đề: các bộ bán rồi tới bộ thưởng / Chí Tôn.
function listItems() {
  const out = [];
  for (const g of SHOP_GROUPS) {
    for (const id of g.members) out.push(getItem(id));
    out.push(topItemOf(g));
  }
  return out;
}

// Tổng tiền (dùng cho bảng giá).
//  - Chủ đề thường: cheapest = rẻ nhất SHOP_BUNDLE_REQUIRED bộ để mở thưởng; không thì mua đủ cả chủ đề.
//  - Cửu Long: cheapest = chỉ mua Chí Tôn (bản nền 0/9); không thì mua Chí Tôn + cả 9 rồng (đủ 9/9).
function bundleCost(group, cheapest = true) {
  if (!hasBonus(group)) {
    const top = group.sold ? getItem(group.sold).price : 0;
    if (cheapest) return top;
    return top + group.members.reduce((a, id) => a + getItem(id).price, 0);
  }
  const prices = group.members.map((id) => getItem(id).price).sort((a, b) => a - b);
  return (cheapest ? prices.slice(0, SHOP_BUNDLE_REQUIRED) : prices).reduce((a, b) => a + b, 0);
}

module.exports = { RARITY_LABEL, RARITY_ICON, SHOP_GROUPS, SHOP_BUNDLE_REQUIRED, isBonusId, isSoldId, isShopId, hasBonus, topItemOf, getItem, listItems, bundleCost };
