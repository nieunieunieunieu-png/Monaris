// ===== hoso/frame/shop_thanlong/border.js — VIỀN & GÓC (nẹp đôi inset ≤ 22, đơn vị <use> mỗi 44px, góc 44×44, chừa giữa cạnh trên) =====
const { getBuilt } = require('../../bonusKit');
const { TIERS } = require('./colors');
const built = getBuilt('shop_thanlong', TIERS[0], require('./motif'));
module.exports = { frameBorder: built.frameBorder };
