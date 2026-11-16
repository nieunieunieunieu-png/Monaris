// ===== congDuc/month.js — Top tháng Công Đức (tab "Mốc Công Đức Tháng", khoá tháng month_key) =====
// Tháng theo lịch giờ VN (ngày 1 00:00). Logic chung ở congDuc/period.js. Là tháng ĐANG chạy; không có role/báo cáo riêng.
const cfg = require('../config/congDuc');
const { createPeriod } = require('./period');

function monthKey(now = Date.now()) {
  const d = new Date(now + 7 * 60 * 60 * 1000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
const p = createPeriod({ label: 'tháng', keyFn: monthKey, tab: cfg.CONG_DUC_MONTH_SHEET_NAME, cfgKey: 'month_key', field: 'monthCd' });
module.exports = { start: p.start, tick: p.tick, monthKey, topMonth: p.top, gainOf: p.gainOf, rollover: p.rollover, isReady: p.isReady, _resetForTest: p._resetForTest };
