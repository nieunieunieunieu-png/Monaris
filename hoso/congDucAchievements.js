// ===== hoso/congDucAchievements.js — thành tựu Công Đức (tính bậc từ hồ sơ Công Đức; hàm thuần, không ghi gì) =====
// Mốc ở config/congDuc.js (CONG_DUC_ACHIEVEMENTS); tên + màu bậc lấy từ level/theme.js (ACHIEVEMENT_TIERS) như thành tựu Level. hoso/achievements.js gộp vào danh sách (chỉ khi HOSO_SHOW_ACHIEVEMENTS).
const { CONG_DUC_ACHIEVEMENTS } = require('../config/congDuc');
const { ACHIEVEMENT_TIERS: TIERS } = require('../level/theme');
const { fmtVan } = require('./format');

function formatTarget(ach, n) {
  if (ach.unit === 'days') return `${fmtVan(n)} ngày`;
  if (ach.suffix) return `${fmtVan(n)} ${ach.suffix}`;
  return fmtVan(n);
}

// cd = { total, bestStreak } (hoso/data.js loadCongDuc) hoặc null. Trả [{ key, label, tier (-1 = chưa đạt), tierName, nextText }].
function computeCongDucAchievements(cd) {
  if (!cd) return [];
  return CONG_DUC_ACHIEVEMENTS.map((ach) => {
    const value = Number(cd[ach.from]) || 0;
    let tier = -1;
    for (let i = 0; i < ach.tiers.length; i += 1) if (value >= ach.tiers[i]) tier = i;
    const next = tier + 1 < ach.tiers.length ? ach.tiers[tier + 1] : null;
    return { key: ach.key, label: ach.label, tier, tierName: tier >= 0 ? TIERS[Math.min(tier, TIERS.length - 1)].name : '', nextText: next === null ? '' : formatTarget(ach, next) };
  });
}
module.exports = { computeCongDucAchievements };
