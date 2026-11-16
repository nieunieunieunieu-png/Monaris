// ===== hoso/frame/shop_cl_phuhi/avatar.js — KHUNG AVATAR (tự dựng trong motif.js: vành mực + rồng thuỷ mặc cuộn quanh, cúi đọc cuộn sách) =====
const { helpers } = require('../../bonusKit');
const { TIERS } = require('./colors');
const { avatarFrame } = require('./motif');
module.exports = { avatarFrame: (_tier, R = 70) => avatarFrame(TIERS[0], R, helpers) };
