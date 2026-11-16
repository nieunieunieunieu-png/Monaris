// ===== hoso/frame/shop_cl_toanghe/crest.js — ĐỈNH THẺ =====
const { getBuilt } = require('../../bonusKit');
const { TIERS } = require('./colors');
const built = getBuilt('shop_cl_toanghe', TIERS[0], require('./motif'));
module.exports = { crestTop: built.crestTop };
