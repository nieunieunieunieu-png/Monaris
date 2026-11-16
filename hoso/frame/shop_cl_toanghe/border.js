// ===== hoso/frame/shop_cl_toanghe/border.js — VIỀN & GÓC =====
const { getBuilt } = require('../../bonusKit');
const { TIERS } = require('./colors');
const built = getBuilt('shop_cl_toanghe', TIERS[0], require('./motif'));
module.exports = { frameBorder: built.frameBorder };
