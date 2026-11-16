// ===== hoso/frame/shop_cl_toanghe/avatar.js — KHUNG AVATAR (tự dựng trong motif.js: vành mận tím + rồng sư tử cuộn quanh vành, khói hương) =====
const { helpers } = require('../../bonusKit');
const { TIERS } = require('./colors');
const { avatarFrame } = require('./motif');
module.exports = { avatarFrame: (_tier, R = 70) => avatarFrame(TIERS[0], R, helpers) };
