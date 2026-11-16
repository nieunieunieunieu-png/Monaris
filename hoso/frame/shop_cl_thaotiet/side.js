// ===== hoso/frame/shop_cl_thaotiet/side.js — CẠNH BÊN =====
const { getBuilt } = require('../../bonusKit');
const { TIERS } = require('./colors');
const built = getBuilt('shop_cl_thaotiet', TIERS[0], require('./motif'));
module.exports = { sideUnit: built.sideUnit };
