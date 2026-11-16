// ===== hoso/frame/shop_cl_thaotiet/avatar.js — KHUNG AVATAR (tự dựng trong motif.js: vành hư không + rồng nuốt trăng cuộn vành) =====
const { helpers } = require('../../bonusKit');
const { TIERS } = require('./colors');
const { avatarFrame } = require('./motif');
module.exports = { avatarFrame: (_tier, R = 70) => avatarFrame(TIERS[0], R, helpers) };
