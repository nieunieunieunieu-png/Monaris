// ===== hoso/frame/shop_thanlong/bottom.js — CHÂN THẺ =====
const { getBuilt } = require('../../bonusKit');
const { TIERS } = require('./colors');
const built = getBuilt('shop_thanlong', TIERS[0], require('./motif'));
module.exports = { decorBottom: built.decorBottom };
