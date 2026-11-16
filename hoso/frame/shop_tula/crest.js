// ===== hoso/frame/shop_tula/crest.js — ĐỈNH THẺ (x −80..80, y 0..36, chân chạm y=36) =====
const { getBuilt } = require('../../bonusKit');
const { TIERS } = require('./colors');
const built = getBuilt('shop_tula', TIERS[0], require('./motif'));
module.exports = { crestTop: built.crestTop };
