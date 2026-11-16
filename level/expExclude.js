// ===== level/expExclude.js — EXP "thưởng ngoài hoạt động" (đốt hương của congDuc/) bị LOẠI khỏi bảng/báo cáo THÁNG =====
// Mốc tháng (level/monthly.js) chụp EXP tổng rồi lấy chênh lệch; EXP hương cộng vào EXP tổng (grantBonusExp) nên nếu không loại thì lọt vào Top tháng + role Top tháng + /baocaothang.
// Cách làm: congDuc/ đăng ký 1 nhà cung cấp "tổng EXP hương đã nhận của người này"; monthly.js chụp (EXP tổng − EXP hương) nên chênh lệch giữa 2 mốc không còn chứa EXP hương.
// File nhẹ, KHÔNG require discord/sheet. Không đăng ký nhà cung cấp (Công Đức tắt) = không đổi gì.
let provider = null; // { get: (userId) => số EXP hương đã nhận, isReady: () => boolean }

function setProvider(p) { provider = p || null; }
// Chưa sẵn sàng thì monthly.js hoãn chụp mốc (tránh chụp thiếu lúc vừa khởi động); quá 10 phút vẫn chưa sẵn sàng thì thôi chờ để không kẹt báo cáo tháng.
const isReady = () => !provider || Boolean(provider.isReady()) || process.uptime() > 600;
function excludedOf(userId) {
  try { return provider ? Math.max(0, Number(provider.get(String(userId))) || 0) : 0; } catch { return 0; }
}
const adjust = (exp, userId) => Math.round(Math.max(0, (Number(exp) || 0) - excludedOf(userId)) * 100) / 100;

module.exports = { setProvider, isReady, excludedOf, adjust };
