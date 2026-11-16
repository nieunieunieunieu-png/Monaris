// ===== hoso/frame/shop_cl_nhaitri/border.js — VIỀN & GÓC =====
const { getBuilt } = require('../../bonusKit');
const { TIERS } = require('./colors');
const built = getBuilt('shop_cl_nhaitri', TIERS[0], require('./motif'));
module.exports = { frameBorder: built.frameBorder };
