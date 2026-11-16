// ===== hoso/frame/levelRules.js — luật khung theo CẤP: khoá phong cách + tự chọn phong cách theo thang cấp =====
// Cấu hình ở config/profile.js (PROFILE_FRAME_UNLOCK, PROFILE_FRAME_AUTO). File này chỉ có hàm thuần, không ghi gì, không ném lỗi.
// level = null/undefined nghĩa là "chưa biết cấp" (dữ liệu level chưa nạp xong): không khoá gì, tự động thì về mặc định.
const { FRAME_UNLOCK_LEVELS, FRAME_AUTO_LADDER } = require('../../config/profile');
const { DEFAULT_ID, hasPart, getStyle } = require('./registry');
const { DISCORD_GUILD_ID } = require('../../config/core');
const { SHOP_ENABLED } = require('../../config/shop');
const ownership = require('../../shop/ownership');

const AUTO_ID = 'tudong'; // giá trị đặc biệt trong lựa chọn: "Tự động theo cấp"
const lv = (x) => Math.max(0, Math.floor(Number(x) || 0));

const autoEnabled = () => FRAME_AUTO_LADDER.length > 0;

// Cấp tối thiểu để dùng phong cách này (0 = luôn mở; khung mặc định không bao giờ bị khoá).
// Khung "shop_*" (bán bằng điểm, xem shop/index.js): KHÔNG khoá theo cấp mà khoá theo SỞ HỮU (shopLocked bên dưới).
// Khi cửa hàng TẮT (SHOP_ENABLED=false) thì quay về cách cũ: khoá cứng ở cấp 9999 để không ai dùng miễn phí.
// Admin vẫn có thể mở 1 id theo cấp bằng PROFILE_FRAME_UNLOCK (vd shop_bang=5) — khai báo kiểu này thay luôn việc kiểm tra sở hữu cho id đó.
const SHOP_FRAME_DEFAULT_LOCK_LEVEL = 9999;
const isCdFrame = (id) => String(id || '').startsWith('cd_'); // khung Cửa hàng Công Đức (congDuc/catalog.js): cũng khoá theo SỞ HỮU
const isShopFrame = (id) => String(id || '').startsWith('shop_') || isCdFrame(id);
const hasUnlockOverride = (id) => Object.prototype.hasOwnProperty.call(FRAME_UNLOCK_LEVELS, id);
const unlockLevel = (id) => {
  if (id === DEFAULT_ID) return 0;
  if (hasUnlockOverride(id)) return lv(FRAME_UNLOCK_LEVELS[id]);
  return isShopFrame(id) && !SHOP_ENABLED ? SHOP_FRAME_DEFAULT_LOCK_LEVEL : 0;
};
// Khung shop chưa sở hữu -> khoá. userId rỗng hoặc dữ liệu sở hữu CHƯA nạp xong (has() = null) -> không khoá (như booster: không tước khung oan lúc bot vừa khởi động).
const shopLocked = (id, userId) => {
  if (!SHOP_ENABLED || !isShopFrame(id) || hasUnlockOverride(id) || !userId) return false;
  return ownership.has(userId, id) === false;
};
// Khung dành riêng cho người boost server: style có `boosterOnly: true` (xem hoso/frame/booster/index.js).
const isBoosterOnly = (id) => Boolean(getStyle(id) && getStyle(id).boosterOnly);
// true = đang boost · false = không boost · null = chưa biết (không có trong cache) -> không khoá, để khỏi tước khung của người chưa nạp cache.
// Chỉ đọc guild.members.cache (người vừa bấm lệnh/nút luôn có trong cache nhờ interaction), KHÔNG gọi fetch.
function boosterState(userId) {
  try {
    if (!userId) return null;
    const guild = require('../../client').guilds.cache.get(DISCORD_GUILD_ID);
    const m = guild && guild.members.cache.get(String(userId));
    return m ? Boolean(m.premiumSinceTimestamp) : null;
  } catch (_) {
    return null;
  }
}
const boosterLocked = (id, userId) => isBoosterOnly(id) && boosterState(userId) === false;
// userId (tuỳ chọn): có truyền thì khung booster bị khoá với người không boost.
const isLocked = (id, level, userId) => (level !== null && level !== undefined && unlockLevel(id) > lv(level)) || boosterLocked(id, userId) || shopLocked(id, userId);

// Phong cách mà thang tự động chọn cho `part` ở cấp `level`: bậc cao nhất đã đạt, có đủ thành phần và chưa bị khoá; không có -> mặc định.
function autoStyleFor(part, level) {
  if (!autoEnabled()) return DEFAULT_ID;
  const L = lv(level);
  const reached = FRAME_AUTO_LADDER.filter((s) => s.min <= L).reverse();
  for (const s of reached) {
    if (s.id === DEFAULT_ID) return DEFAULT_ID;
    if (hasPart(s.id, part) && !isLocked(s.id, level)) return s.id;
  }
  return DEFAULT_ID;
}

module.exports = { AUTO_ID, autoEnabled, unlockLevel, isLocked, isShopFrame, isCdFrame, shopLocked, isBoosterOnly, boosterLocked, autoStyleFor, ladder: () => FRAME_AUTO_LADDER.map((s) => ({ ...s })) };
