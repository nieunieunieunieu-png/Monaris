// ===== hoso/frame/shop_thanlong/accents.js — ĐIỂM NHẤN 4 GÓC =====
const { getBuilt } = require('../../bonusKit');
const { TIERS } = require('./colors');
const built = getBuilt('shop_thanlong', TIERS[0], require('./motif'));
module.exports = { accent: built.accent };
