// ===== hoso/frame/shop_cl_xivan/crest.js — ĐỈNH THẺ =====
const { getBuilt } = require('../../bonusKit');
const { TIERS } = require('./colors');
const built = getBuilt('shop_cl_xivan', TIERS[0], require('./motif'));
module.exports = { crestTop: built.crestTop };
