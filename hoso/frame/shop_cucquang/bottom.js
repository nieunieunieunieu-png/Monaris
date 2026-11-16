// ===== hoso/frame/shop_cucquang/bottom.js — CẠNH DƯỚI (y ∈ [-4, 12], nửa rộng ≤ 70, đối xứng quanh x=0) =====
const { getBuilt } = require('../../bonusKit');
const { TIERS } = require('./colors');
const built = getBuilt('shop_cucquang', TIERS[0], require('./motif'));
module.exports = { decorBottom: built.decorBottom };
