// ===== hoso/frame/shop_cl_bean/bottom.js — CHÂN THẺ =====
const { getBuilt } = require('../../bonusKit');
const { TIERS } = require('./colors');
const built = getBuilt('shop_cl_bean', TIERS[0], require('./motif'));
module.exports = { decorBottom: built.decorBottom };
