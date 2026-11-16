// ===== hoso/frame/shop_thanlong/crest.js — ĐỈNH THẺ =====
const { getBuilt } = require('../../bonusKit');
const { TIERS } = require('./colors');
const built = getBuilt('shop_thanlong', TIERS[0], require('./motif'));
module.exports = { crestTop: built.crestTop };
