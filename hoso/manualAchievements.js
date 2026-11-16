// ===== hoso/manualAchievements.js — Thành Tựu TỰ CHỌN: mỗi người tự đeo 1 thành tựu (nút 🏅 Thành tựu trong /profile) =====
// Không còn lệnh admin gắn tay: người dùng tự chọn trong hộp thoại của /profile (level/profile.js gọi setSelfAchievement).
// Tên thành tựu chọn từ danh sách có sẵn (LEVEL_ACHIEVEMENTS, config/level.js — tên kiếm hiệp), không gõ tay tự do. Mỗi người
// chỉ đeo ĐÚNG 1 thành tựu tại 1 thời điểm (chọn cái mới sẽ tự thay cái cũ). Dữ liệu lưu ở googleSheets/manualAchievementSheet.js
// (tab "Thành Tựu Đặt Tay", cùng spreadsheet với "Hồ Sơ Cá Nhân"), cache trong RAM để /hoso không phải đọc Sheet mỗi lần.
// Module này KHÔNG require level/profile (profile.js require ngược lại module này) để tránh vòng phụ thuộc.
const { LEVEL_ACHIEVEMENTS } = require('../config');
const { getCustomAchievements } = require('./customAchievement'); // chỉ để biết người đó có thành tựu riêng không (không vòng phụ thuộc)
const {
  ensureManualAchievementSheetExists,
  getAllManualAchievements,
  appendManualAchievement,
  removeManualAchievementByName,
} = require('../googleSheets/manualAchievementSheet');

// Cache RAM: discordId -> { tenThanhTuu, ghiChu } (mỗi người tối đa 1, chỉ giữ dòng "Còn"). Nạp lại lúc khởi động
// (startManualAchievements) và tự cập nhật ngay sau mỗi lần chọn/gỡ thành công — không cần đọc lại Sheet mỗi lần /hoso.
let cache = new Map();
let loaded = false;

function rebuildCacheFromRows(rows) {
  const next = new Map();
  for (const row of rows) {
    if (row.trangThai !== 'Còn') continue;
    // Phòng khi Sheet lỡ có nhiều hơn 1 dòng "Còn" cho cùng 1 người (sửa tay) — lấy dòng GẦN NHẤT (ghi sau cùng).
    next.set(row.discordId, { tenThanhTuu: row.tenThanhTuu, ghiChu: row.ghiChu });
  }
  cache = next;
  loaded = true;
}

// Gọi 1 lần lúc khởi động (index.js, giai đoạn ngầm): đảm bảo tab Sheet tồn tại + nạp cache.
async function startManualAchievements() {
  await ensureManualAchievementSheetExists();
  const rows = await getAllManualAchievements();
  rebuildCacheFromRows(rows);
}

// Tìm thành tựu trong danh sách theo key / tên kiếm hiệp / tên gốc (không phân biệt hoa-thường) — để dòng Sheet cũ
// (lưu tên gốc như "Voice") vẫn nhận ra và hiện bằng tên kiếm hiệp mới. Không thấy -> null.
function findAchievement(name) {
  const want = String(name || '').trim().toLowerCase();
  if (!want) return null;
  return (
    LEVEL_ACHIEVEMENTS.find((a) => [a.key, a.label, a.plain].some((x) => String(x || '').trim().toLowerCase() === want)) || null
  );
}

// Danh sách cho dropdown của hộp thoại: [{ key, label, quip }]. Discord cho tối đa 25 lựa chọn/dropdown (kể cả "Không đeo").
function listAchievementChoices() {
  return LEVEL_ACHIEVEMENTS.slice(0, 24).map((a) => ({ key: a.key, label: a.label, quip: a.quip || '' }));
}

// Dùng cho hoso/achievements.js -> buildAchievementItems() (nhận mảng để gộp chung với thành tựu "có sẵn").
// Trả [] nếu chưa nạp xong hoặc người đó chưa chọn gì, [{ tenThanhTuu, ghiChu }] (tối đa 1 phần tử) nếu có.
function getManualAchievements(discordId) {
  if (!loaded) return [];
  const one = cache.get(String(discordId));
  return one ? [one] : [];
}

// Thành tựu đang đeo của 1 người: { key, label, quip } hoặc null (dùng cho dòng trạng thái ở /profile + đánh dấu mặc định trong dropdown).
function getSelectedAchievement(discordId) {
  const one = getManualAchievements(discordId)[0];
  if (!one) return null;
  const ach = findAchievement(one.tenThanhTuu);
  return ach ? { key: ach.key, label: ach.label, quip: ach.quip || '' } : { key: '', label: one.tenThanhTuu, quip: one.ghiChu || '' };
}

// Danh hiệu ĐANG HIỂN THỊ trên thẻ: { label, custom, note } hoặc null. Thành tựu riêng (/themthanhtuu) thắng thành tựu tự chọn —
// khớp đúng quy tắc 1 danh hiệu của hoso/achievements.js -> buildAchievementItems.
function getDisplayedTitle(discordId) {
  const custom = getCustomAchievements(discordId)[0];
  if (custom) return { label: custom.tenThanhTuu, custom: true, note: custom.ghiChu || '' };
  const sel = getSelectedAchievement(discordId);
  return sel ? { label: sel.label, custom: false, note: sel.quip || '' } : null;
}

// Dòng cảnh báo khi người có thành tựu riêng chọn/gỡ thành tựu tự chọn: lựa chọn vẫn được lưu nhưng CHƯA hiện (danh hiệu đang là thành tựu riêng).
function customOverrideNote(discordId) {
  const custom = getCustomAchievements(discordId)[0];
  return custom ? `\n⚠️ Bạn đang có thành tựu riêng **${custom.tenThanhTuu}** nên danh hiệu trên thẻ vẫn là thành tựu riêng (chỉ hiện 1 thành tựu). Thành tựu vừa chọn sẽ hiện khi thành tựu riêng được gỡ.` : '';
}

// Người dùng tự đeo (key) hoặc gỡ (key rỗng/null) thành tựu của CHÍNH MÌNH. Trả { message } hoặc { error }; lỗi ghi Sheet thì ném ra (chỗ gọi bắt).
async function setSelfAchievement(userId, key) {
  const id = String(userId);
  if (!loaded) return { error: '⏳ Dữ liệu thành tựu đang được nạp, thử lại sau ít phút.' };
  const current = cache.get(id);

  if (!key) {
    if (!current) return { message: 'ℹ️ Bạn chưa đeo thành tựu nào để gỡ.' };
    const shown = (findAchievement(current.tenThanhTuu) || {}).label || current.tenThanhTuu;
    await removeManualAchievementByName(id, current.tenThanhTuu);
    cache.delete(id);
    return { message: `🗑️ Đã gỡ thành tựu **${shown}**` };
  }

  const ach = LEVEL_ACHIEVEMENTS.find((a) => a.key === key);
  if (!ach) return { error: '❌ Thành tựu này không có trong danh sách.' };
  const currentAch = current ? findAchievement(current.tenThanhTuu) : null;
  if (currentAch && currentAch.key === ach.key) return { message: `ℹ️ Bạn đang đeo **${ach.label}** rồi.` };

  // Mỗi người chỉ 1 thành tựu: có cái cũ thì gỡ trước (ghi lại lịch sử) rồi mới đeo cái mới.
  if (current) await removeManualAchievementByName(id, current.tenThanhTuu);
  await appendManualAchievement({ discordId: id, tenThanhTuu: ach.label, ghiChu: '', nguoiGan: id, createdAt: new Date() });
  cache.set(id, { tenThanhTuu: ach.label, ghiChu: '' });
  return { message: `✅ Đã đeo thành tựu **${ach.label}**${ach.quip ? ` — _${ach.quip}_` : ''}${customOverrideNote(id)}` };
}

module.exports = { startManualAchievements, getManualAchievements, getSelectedAchievement, getDisplayedTitle, findAchievement, listAchievementChoices, setSelfAchievement };
