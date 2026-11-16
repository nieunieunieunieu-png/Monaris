// ===== hoso/frame/shop_thanlong/side.js — CẠNH BÊN (đơn vị 100px) =====
const { getBuilt } = require('../../bonusKit');
const { TIERS } = require('./colors');
const built = getBuilt('shop_thanlong', TIERS[0], require('./motif'));
module.exports = { sideUnit: built.sideUnit };
