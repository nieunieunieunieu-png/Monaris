// ===== congDuc/week.js — Top tuần Công Đức (tab "Mốc Công Đức Tuần", khoá tuần week_key) =====
// Tuần chạy Thứ Hai 00:00 → Chủ Nhật (giờ VN). Logic chung ở congDuc/period.js.
const cfg = require('../config/congDuc');
const { createPeriod } = require('./period');

// Ngày Thứ Hai (YYYY-MM-DD, giờ VN) của tuần chứa `now`.
function weekKey(now = Date.now()) {
  const d = new Date(now + 7 * 60 * 60 * 1000);
  const dow = (d.getUTCDay() + 6) % 7; // Thứ Hai = 0
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dow)).toISOString().slice(0, 10);
}
const p = createPeriod({ label: 'tuần', keyFn: weekKey, tab: cfg.CONG_DUC_WEEK_SHEET_NAME, cfgKey: 'week_key', field: 'weekCd' });
module.exports = { start: p.start, tick: p.tick, weekKey, topWeek: p.top, gainOf: p.gainOf, rollover: p.rollover, isReady: p.isReady, _resetForTest: p._resetForTest };
