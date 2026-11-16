// ===== hoso/frame/shop_thienhoang/accents.js — ĐIỂM NHẤN GÓC (ô 28×28 nhô ra ngoài, lật 4 góc bằng <use>) =====
const { getBuilt } = require('../../bonusKit');
const { TIERS } = require('./colors');
const built = getBuilt('shop_thienhoang', TIERS[0], require('./motif'));
module.exports = { accent: built.accent };
