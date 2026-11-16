// ===== hoso/frame/shop_cucquang/avatar.js — KHUNG AVATAR (vành đôi + 12 đinh ngọc + hoạ tiết riêng, mọi nét r ≤ 84) =====
const { getBuilt } = require('../../bonusKit');
const { TIERS } = require('./colors');
const built = getBuilt('shop_cucquang', TIERS[0], require('./motif'));
module.exports = { avatarFrame: built.avatarFrame };
