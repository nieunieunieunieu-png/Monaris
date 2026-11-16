// ===== hoso/frame/shop_luongtu/border.js — VIỀN & GÓC (nẹp đôi inset ≤ 22, đơn vị <use> mỗi 44px, góc 44×44, chừa giữa cạnh trên) =====
const { getBuilt } = require('../../bonusKit');
const { TIERS } = require('./colors');
const built = getBuilt('shop_luongtu', TIERS[0], require('./motif'));
module.exports = { frameBorder: built.frameBorder };
