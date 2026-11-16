// ===== hoso/frame/shop_cl_xivan/side.js — CẠNH BÊN =====
const { getBuilt } = require('../../bonusKit');
const { TIERS } = require('./colors');
const built = getBuilt('shop_cl_xivan', TIERS[0], require('./motif'));
module.exports = { sideUnit: built.sideUnit };
