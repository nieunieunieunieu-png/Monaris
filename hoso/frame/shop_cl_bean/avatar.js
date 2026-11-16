// ===== hoso/frame/shop_cl_bean/avatar.js — KHUNG AVATAR (tự dựng trong motif.js: vành xanh rêu + rồng hổ vằn cuộn vành + dây leo) =====
const { helpers } = require('../../bonusKit');
const { TIERS } = require('./colors');
const { avatarFrame } = require('./motif');
module.exports = { avatarFrame: (_tier, R = 70) => avatarFrame(TIERS[0], R, helpers) };
