// ===== hoso/frame/shop_thienhoang/side.js — CẠNH BÊN (1 đơn vị cao 100, x ±15, trục x=0 liền mạch) =====
const { getBuilt } = require('../../bonusKit');
const { TIERS } = require('./colors');
const built = getBuilt('shop_thienhoang', TIERS[0], require('./motif'));
module.exports = { sideUnit: built.sideUnit };
