// ===== hoso/frame/shop_sonha/bottom.js — CẠNH DƯỚI (y ∈ [-4, 12], nửa rộng ≤ 70, đối xứng quanh x=0) =====
const { getBuilt } = require('../../bonusKit');
const { TIERS } = require('./colors');
const built = getBuilt('shop_sonha', TIERS[0], require('./motif'));
module.exports = { decorBottom: built.decorBottom };
