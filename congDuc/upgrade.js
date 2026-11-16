// ===== congDuc/upgrade.js — Dâng Lòng Thành nâng 3 thứ: Pháp Khung (khung thẻ), Pháp Diện (viền avatar), Danh Hiệu (1–10 theo bậc Phật pháp) =====
// Thay cho Cảnh Giới tự lên theo tổng Công Đức: giờ phải DÂNG Điểm Lòng Thành để nâng, mỗi thứ nâng RIÊNG, mỗi lần +1 bậc (bậc 1 -> 10).
// Giá mỗi lần nâng: config/congDuc.js -> CONG_DUC_UPGRADE_COSTS (phần tử 0 = giá nâng lên bậc 2).
// KHÔNG thêm cột Sheet: bậc hiện tại suy ra từ chính sổ chi "Lịch Sử Lòng Thành" (ghi chú `up|<loại>|<bậc đạt được>`), dùng chung sổ + số đã chi với congDuc/shop.js
// nên Điểm Lòng Thành (tổng Công Đức − đã chi) tự trừ đúng. Ghi sổ xong mới tính là đã nâng -> lỗi ghi sổ thì CHƯA trừ gì; bấm đúp bị khoá theo userId.
const cfg = require('../config/congDuc');
const core = require('./core');
const shop = require('./shop');

const sheet = () => require('../googleSheets/congDucSheet');

const KINDS = {
  khung: { key: 'khung', label: 'Pháp Khung', icon: '🪷', desc: 'khung thẻ hồ sơ Công Đức' },
  avatar: { key: 'avatar', label: 'Pháp Diện', icon: '🌸', desc: 'viền avatar' },
  danhhieu: { key: 'danhhieu', label: 'Danh Hiệu', icon: '📿', desc: 'danh hiệu theo bậc Phật pháp' },
};
const KIND_KEYS = Object.keys(KINDS);
// Danh hiệu bậc 1..10 (tên theo bậc tu tập Phật giáo).
const TITLES = ['Phàm Phu', 'Cư Sĩ', 'Sa Di', 'Tỳ Kheo', 'Tu Đà Hoàn', 'Tư Đà Hàm', 'A Na Hàm', 'A La Hán', 'Bồ Tát', 'Phật'];
const MAX_TIER = cfg.CONG_DUC_UPGRADE_MAX_TIER;

const fmt = (n) => Number(n || 0).toLocaleString('vi-VN');
const isKind = (kind) => Object.prototype.hasOwnProperty.call(KINDS, kind);
const noteOf = (kind, tier) => `up|${kind}|${tier}`;
const titleOf = (tier) => TITLES[tier - 1] || `Bậc ${tier}`;
// Giá để nâng LÊN bậc `tier` (2..MAX_TIER); null nếu không hợp lệ.
const costToReach = (tier) => (tier >= 2 && tier <= MAX_TIER ? cfg.CONG_DUC_UPGRADE_COSTS[tier - 2] : null);

// Bậc hiện tại (1..MAX_TIER) = bậc cao nhất đã có trong sổ chi; chưa nâng lần nào = 1. Đọc RAM, đồng bộ.
function tierOf(userId, kind) {
  if (!isKind(kind)) return 1;
  const id = String(userId);
  for (let t = MAX_TIER; t >= 2; t -= 1) if (shop._notes.has(`${id}|${noteOf(kind, t)}`)) return t;
  return 1;
}

// { kind, label, icon, desc, tier, max, title, next: { tier, cost, title } | null }
function info(userId, kind) {
  const meta = KINDS[kind];
  const tier = tierOf(userId, kind);
  const next = tier < MAX_TIER ? { tier: tier + 1, cost: costToReach(tier + 1), title: titleOf(tier + 1) } : null;
  return { ...meta, kind, tier, max: MAX_TIER, title: titleOf(tier), next };
}

const balanceOf = (userId) => core.sincerityOf(core.getRecord(userId, '', { create: false }));

// Dữ liệu cho màn "Dâng Lòng Thành" (đồng bộ): số dư + 3 mục.
function overview(userId) {
  return { ready: shop.isReady(), balance: balanceOf(userId), items: KIND_KEYS.map((k) => info(userId, k)) };
}

// Dâng Lòng Thành nâng 1 bậc. Trả { ok:true, kind, label, from, to, title, cost, left } hoặc { ok:false, msg }.
async function upgrade(userId, name, kind, { now = Date.now() } = {}) {
  userId = String(userId);
  if (!isKind(kind)) return { ok: false, msg: '❌ Mục nâng cấp không hợp lệ.' };
  if (!shop.isReady()) return { ok: false, msg: '⏳ Sổ Lòng Thành đang nạp, thí chủ thử lại sau ít phút.' };
  const meta = KINDS[kind];
  const res = await core.withUserLock(userId, async () => {
    const from = tierOf(userId, kind);
    if (from >= MAX_TIER) return { ok: false, msg: `🙏 **${meta.label}** của thí chủ đã đạt bậc tối cao (${MAX_TIER}/${MAX_TIER}).` };
    const to = from + 1;
    const cost = costToReach(to);
    const have = balanceOf(userId);
    if (have < cost) return { ok: false, msg: `❌ Chưa đủ Lòng Thành để nâng **${meta.label}** lên bậc ${to}: cần **${fmt(cost)}**, thí chủ có **${fmt(have)}**. Chưa trừ gì cả.` };
    const note = noteOf(kind, to);
    try {
      await sheet().appendLedgerRow({ day: core.vnDay(now), userId, name, item: `Dâng lòng thành nâng ${meta.label}: bậc ${from} → ${to}`, cost, note });
    } catch (error) {
      console.error('[công đức] Lỗi ghi sổ nâng cấp (chưa trừ):', error && error.message ? error.message : error);
      return { ok: false, msg: '❌ Có lỗi khi ghi sổ — chưa trừ gì cả, thí chủ thử lại sau nhé.' };
    }
    // Đã ghi sổ -> cập nhật RAM ngay (đồng bộ, không thể lỗi giữa chừng): trừ Lòng Thành + đánh dấu bậc mới.
    shop._spent.set(userId, (shop._spent.get(userId) || 0) + cost);
    shop._notes.add(`${userId}|${note}`);
    try { require('../activityLog').logActivity(`🪷 [công đức] <@${userId}> dâng ${fmt(cost)} Lòng Thành nâng ${meta.label}: bậc ${from} → ${to}`); } catch { /* bỏ qua */ }
    return { ok: true, kind, label: meta.label, from, to, title: titleOf(to), cost, left: balanceOf(userId) };
  });
  if (res && res.busy) return { ok: false, msg: '⏳ Đang xử lý lần bấm trước, thí chủ chờ một chút.' };
  return res;
}

module.exports = { KINDS, KIND_KEYS, TITLES, MAX_TIER, noteOf, titleOf, costToReach, tierOf, info, overview, upgrade };
