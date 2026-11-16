// ===== congDuc/period.js — Top theo KỲ (tuần/tháng) bằng mốc đầu kỳ, học theo level/weekSnapshot.js =====
// Mốc = Tổng Công Đức của từng người lúc bắt đầu kỳ, lưu ở 1 tab (A Discord ID | B Mốc); khoá kỳ hiện tại lưu ở tab cấu hình (cfgKey).
// Công Đức của kỳ = Tổng hiện tại − mốc. Bot tắt qua ranh giới kỳ thì mốc chốt ở lần khởi động đầu tiên của kỳ mới (kỳ đó đếm từ lúc ấy).
const core = require('./core');
const sheet = () => require('../googleSheets/congDucSheet');

// opts: { label, keyFn: (now) => khoá kỳ, tab: tên tab mốc, cfgKey: khoá trong tab cấu hình, field: tên trường trong bảng top (weekCd/monthCd) }
function createPeriod({ label, keyFn, tab, cfgKey, field }) {
  let base = new Map(); // userId -> Tổng Công Đức đầu kỳ
  let key = '';
  let ready = false;
  let needSave = false;
  let busy = false;
  let timer = null;

  const gainOf = (rec) => (rec ? Math.max(0, rec.total - (base.get(rec.userId) || 0)) : 0);
  function top(limit = 10) {
    if (!ready) return [];
    return core.allRecords().map((r) => ({ userId: r.userId, name: r.name, total: r.total, [field]: gainOf(r) })).filter((r) => r[field] > 0).sort((a, b) => b[field] - a[field]).slice(0, limit);
  }

  async function persist() {
    await sheet().savePeriod(tab, base); // ghi tab trước, khoá kỳ sau: khoá chỉ đổi khi tab đã đủ
    await sheet().setConfig(cfgKey, key);
    needSave = false;
  }
  async function rollover(now = Date.now()) {
    const snap = new Map();
    for (const r of core.allRecords()) if (r.total > 0) snap.set(r.userId, r.total);
    base = snap; key = keyFn(now); ready = true;
    try { await persist(); } catch (error) {
      needSave = true;
      console.error(`[công đức] Chưa ghi được mốc ${label} (vẫn dùng RAM, sẽ thử lại):`, error && error.message ? error.message : error);
    }
  }
  async function init(now = Date.now()) {
    const c = await sheet().loadConfig();
    if (c[cfgKey] === keyFn(now)) { base = await sheet().loadPeriod(tab); key = c[cfgKey]; ready = true; return; }
    await rollover(now);
  }
  async function tick(now = Date.now()) {
    if (busy || !core.isLoaded()) return;
    busy = true;
    try {
      if (!ready) await init(now);
      else if (keyFn(now) !== key) await rollover(now);
      else if (needSave) await persist();
    } catch (error) {
      console.error(`[công đức] Lỗi mốc ${label}:`, error && error.message ? error.message : error);
    } finally { busy = false; }
  }
  async function start() {
    await tick();
    if (timer) return;
    timer = setInterval(() => { tick().catch(() => {}); }, 60_000);
    if (timer.unref) timer.unref();
  }
  const _resetForTest = () => { base = new Map(); key = ''; ready = false; needSave = false; busy = false; };
  return { start, tick, top, gainOf, rollover, isReady: () => ready, _resetForTest };
}

module.exports = { createPeriod };
