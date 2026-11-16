// ===== hoso/frame/shop_cl_xivan/avatar.js — KHUNG AVATAR (tự dựng trong motif.js: vành than đen + rồng lửa cuộn) =====
const { helpers } = require('../../bonusKit');
const { TIERS } = require('./colors');
const { avatarFrame } = require('./motif');
module.exports = { avatarFrame: (_tier, R = 70) => avatarFrame(TIERS[0], R, helpers) };
