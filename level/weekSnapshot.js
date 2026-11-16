// ===== level/weekSnapshot.js — mốc đầu tuần + bảng xếp hạng TUẦN VỪA KẾT THÚC (cho role Top tuần) =====
// Đầu mỗi tuần (00:00 Thứ Hai giờ VN) bot chụp tổng EXP của mọi người vào tab "Mốc Tuần" (googleSheets/levelWeekSheet.js).
// EXP tuần vừa rồi = chênh lệch 2 ảnh chụp liên tiếp (bền qua restart, không phụ thuộc cột "EXP Tuần" vốn bị reset khi ai đó hoạt động).
const { LEVEL_ENABLED } = require('../config');
const sheet = require('../googleSheets/levelWeekSheet');
const { weekKey } = require('./week');

let deps = null; // { getMembers: () => Map, flush: (opts) => Promise, isLoaded: () => boolean }
let snapshotKey = '';
let busy = false;
let rankCache = { key: '', ids: null };

function prevWeekKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d - 7)).toISOString().slice(0, 10);
}

function liveRows() {
  const out = [];
  for (const m of deps.getMembers().values()) out.push({ id: m.id, name: m.name || '', exp: Number(m.exp) || 0 });
  return out;
}

async function tick() {
  if (!LEVEL_ENABLED || !deps || !deps.isLoaded() || busy) return;
  const cur = weekKey();
  if (snapshotKey === cur) return; // tránh đọc Sheet mỗi phút
  busy = true;
  try {
    const snaps = await sheet.readSnapshots();
    if (!snaps[cur]) {
      await deps.flush({ force: true });
      const rows = liveRows();
      await sheet.appendSnapshot(cur, rows);
      console.log(`[level] Đã chụp mốc tuần ${cur} (${rows.length} người).`);
    }
    snapshotKey = cur;
  } catch (error) {
    console.error('[level] Lỗi chụp mốc tuần (sẽ thử lại):', error.message);
  } finally {
    busy = false;
  }
}

// Mảng Discord ID xếp theo EXP tuần vừa kết thúc giảm dần (tối đa 40; [] nếu chưa có mốc tuần trước, VD mới deploy);
// null = chưa chụp xong mốc tuần này / đọc Sheet lỗi (bên gọi giữ nguyên hiện trạng).
async function lastWeekRanking() {
  try {
    const cur = weekKey();
    if (rankCache.key === cur) return rankCache.ids;
    if (!LEVEL_ENABLED || !deps || snapshotKey !== cur) return null;
    const snaps = await sheet.readSnapshots();
    const prev = prevWeekKey(cur);
    let ids = [];
    if (snaps[prev] && snaps[cur]) {
      ids = [...snaps[cur].members.entries()]
        .map(([id, v]) => ({ id, d: v.exp - (snaps[prev].members.get(id) ? snaps[prev].members.get(id).exp : 0) }))
        .filter((r) => r.d > 0)
        .sort((a, b) => b.d - a.d)
        .slice(0, 40)
        .map((r) => r.id);
    }
    rankCache = { key: cur, ids };
    return ids;
  } catch (error) {
    console.error('[level] Không tính được bảng xếp hạng tuần trước (sẽ thử lại):', error.message);
    return null;
  }
}

module.exports = {
  init(d) {
    deps = d;
  },
  tick,
  lastWeekRanking,
  prevWeekKey,
};
