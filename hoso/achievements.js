// ===== hoso/achievements.js — THÀNH TỰU trên /hoso: tính bậc đạt được cho từng mục từ số hoạt động tích luỹ =====
// Bảng mốc ở config/level.js (LEVEL_ACHIEVEMENTS). Tên + màu bậc lấy từ level/theme.js (TIERS[0..4]: Đồng, Bạc, Vàng, Bạch Kim, Kim Cương).
// Không cần cột Sheet mới: chỉ dựa trên `counts` của getLevelSnapshot (voice tính bằng phút).
const { LEVEL_ACHIEVEMENTS } = require('../config');
const { ACHIEVEMENT_TIERS: TIERS } = require('../level/theme'); // 6 bậc thành tựu (tách khỏi 11 bậc khung)
const { fmtVan } = require('./format');
const { findAchievement } = require('./manualAchievements');

// Số mốc -> chữ hiển thị (voice: phút -> giờ; chuỗi: ngày).
function formatTarget(ach, n) {
  if (ach.unit === 'minutes') return `${fmtVan(Math.round((n / 60) * 10) / 10)} giờ`;
  if (ach.unit === 'days') return `${fmtVan(n)} ngày`;
  if (ach.suffix) return `${fmtVan(n)} ${ach.suffix}`;
  return fmtVan(n);
}

// stats = getLevelSnapshot(): { counts: { chat, chat_thao_luan, anh, voice, ... }, bestStreak } hoặc null. Trả [{ key, label, tier, tierName, nextText }]:
// tier = -1 nếu chưa đạt mốc đầu; nextText = mốc kế (chữ) hoặc '' khi đã đạt mốc cuối.
function computeAchievements(stats) {
  if (!stats || !stats.counts) return null;
  const counts = stats.counts;
  return LEVEL_ACHIEVEMENTS.map((ach) => {
    const value = ach.from ? Number(stats[ach.from]) || 0 : ach.sources.reduce((sum, k) => sum + (Number(counts[k]) || 0), 0);
    let tier = -1;
    for (let i = 0; i < ach.tiers.length; i += 1) if (value >= ach.tiers[i]) tier = i;
    const next = tier + 1 < ach.tiers.length ? ach.tiers[tier + 1] : null;
    return {
      key: ach.key,
      label: ach.label,
      tier,
      tierName: tier >= 0 ? TIERS[Math.min(tier, TIERS.length - 1)].name : '',
      nextText: next === null ? '' : formatTarget(ach, next),
    };
  });
}

// Hiện bảng thành tựu "có sẵn" (tự tính mốc) trên /hoso hay không. Mặc định ẨN (thẻ gọn hơn -> Discord hiện ảnh to hơn).
// Bật lại: đặt biến môi trường HOSO_SHOW_ACHIEVEMENTS=true. Thành tựu TỰ CHỌN (manual, xem hoso/manualAchievements.js)
// KHÔNG bị cờ này ảnh hưởng — luôn hiện nếu người đó có, vì chính họ đã chủ động đeo thì nên hiện.
// Logic tính thành tựu (computeAchievements, LEVEL_ACHIEVEMENTS) vẫn giữ nguyên để bật lại bất cứ lúc nào.
const SHOW_ACHIEVEMENTS = String(process.env.HOSO_SHOW_ACHIEVEMENTS || '').trim().toLowerCase() === 'true';

// Gộp thành tựu "có sẵn" (computeAchievements, chỉ khi SHOW_ACHIEVEMENTS) + "đặt tay" (manualList, luôn gộp nếu có) thành
// 1 danh sách chung cho card.js/index.js vẽ. manualList = kết quả getManualAchievements(discordId) (hoso/manualAchievements.js):
// [{ tenThanhTuu, ghiChu }]. Mục tự chọn: { key, label (tên kiếm hiệp), manual: true, note (ghi chú nếu có, không thì câu đùa của thành tựu) } — không có tier/tierName (luôn hiện như đã đạt).
// Trả null nếu không có mục nào (ẩn hẳn panel THÀNH TỰU).
// customList = kết quả getCustomAchievements(discordId) (hoso/customAchievement.js): [{ tenThanhTuu, ghiChu, custom: true }]
// (tối đa 1 phần tử). Chỉ 1 trong 2 loại (manual / custom) được hiện — custom ưu tiên, xem "QUY TẮC DANH HIỆU" ở dưới. Mục độc quyền: { key, label (tên gõ tự do), manual: true, custom: true, note } — luôn gộp nếu có,
// hiện cạnh thành tựu tự chọn, nhãn "Độc quyền" (card.js tự vẽ theo cờ custom).
function buildAchievementItems(stats, manualList, customList) {
  const builtin = SHOW_ACHIEVEMENTS && stats && stats.counts ? computeAchievements(stats) || [] : [];
  const manual = (manualList || []).map((m, idx) => {
    const ach = findAchievement(m.tenThanhTuu); // dòng cũ lưu tên gốc ("Voice") vẫn ra đúng tên kiếm hiệp
    return {
      key: `manual_${idx}`,
      label: ach ? ach.label : m.tenThanhTuu,
      manual: true,
      note: m.ghiChu || (ach ? ach.quip || '' : ''),
    };
  });
  const custom = (customList || []).map((m, idx) => ({
    key: `custom_${idx}`,
    label: m.tenThanhTuu,
    manual: true,
    custom: true,
    note: m.ghiChu || '',
  }));
  // QUY TẮC DANH HIỆU: thành tựu riêng (/themthanhtuu) cùng "ô" với thành tựu mặc định tự chọn -> danh hiệu chỉ dùng ĐÚNG 1 cái.
  // Có thành tựu riêng thì nó thắng (thành tựu mặc định vẫn nằm nguyên trong Sheet, gỡ riêng đi là hiện lại); không thì lấy 1 cái tự chọn.
  const titleItems = custom.length ? custom.slice(0, 1) : manual.slice(0, 1);
  const items = [...builtin, ...titleItems];
  return items.length ? items : null;
}

module.exports = { computeAchievements, buildAchievementItems, SHOW_ACHIEVEMENTS };
