// ===== hoso/frame/shop_cuulong/avatar.js — KHUNG AVATAR (vành vàng kim + 9 vị trí rồng thức tỉnh theo ctx; tự dựng trong motif.js) =====
const { TIERS } = require('./colors');
const { avatarFrame } = require('./motif');
// Bộ nhớ đệm theo mask 9-bit + R (docs 5.5): tối đa 512 tổ hợp × vài R.
const memo = new Map();
module.exports = {
  avatarFrame: (_tier, R = 70, ctx) => {
    const mask = ctx && Number.isInteger(ctx.mask) ? ctx.mask : 0;
    const key = `${mask}|${R}`;
    if (!memo.has(key)) {
      if (memo.size > 1500) memo.clear();
      memo.set(key, avatarFrame(TIERS[0], R, ctx));
    }
    return memo.get(key);
  },
};
