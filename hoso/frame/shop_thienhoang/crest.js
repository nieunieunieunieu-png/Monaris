// ===== hoso/frame/shop_thienhoang/crest.js — ĐỈNH THẺ (x −80..80, y 0..36, chân chạm y=36) =====
const { getBuilt } = require('../../bonusKit');
const { TIERS } = require('./colors');
const built = getBuilt('shop_thienhoang', TIERS[0], require('./motif'));
module.exports = { crestTop: built.crestTop };
