// ===== hoso/frame/shop_cl_xivan/accents.js — ĐIỂM NHẤN 4 GÓC =====
const { getBuilt } = require('../../bonusKit');
const { TIERS } = require('./colors');
const built = getBuilt('shop_cl_xivan', TIERS[0], require('./motif'));
module.exports = { accent: built.accent };
