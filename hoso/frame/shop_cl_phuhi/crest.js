// ===== hoso/frame/shop_cl_phuhi/crest.js — ĐỈNH THẺ =====
const { getBuilt } = require('../../bonusKit');
const { TIERS } = require('./colors');
const built = getBuilt('shop_cl_phuhi', TIERS[0], require('./motif'));
module.exports = { crestTop: built.crestTop };
