// ===== hoso/frame/shop_cl_phuhi/side.js — CẠNH BÊN =====
const { getBuilt } = require('../../bonusKit');
const { TIERS } = require('./colors');
const built = getBuilt('shop_cl_phuhi', TIERS[0], require('./motif'));
module.exports = { sideUnit: built.sideUnit };
