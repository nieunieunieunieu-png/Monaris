// ===== hoso/frame/shop_cuulong/accents.js — ĐIỂM NHẤN 4 GÓC (ngọc nguyên tố sáng/mờ theo ctx) =====
const { TIERS } = require('./colors');
const { accent } = require('./motif');
module.exports = { accent: (_tier, W, H, ctx) => accent(TIERS[0], W, H, ctx) };
