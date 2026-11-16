// ===== hoso/frame/shop_cl_nhaitri/avatar.js — KHUNG AVATAR (tự dựng trong motif.js: vành than + rồng giáp thép cuộn, đuôi hoá lưỡi kiếm) =====
const { helpers } = require('../../bonusKit');
const { TIERS } = require('./colors');
const { avatarFrame } = require('./motif');
module.exports = { avatarFrame: (_tier, R = 70) => avatarFrame(TIERS[0], R, helpers) };
