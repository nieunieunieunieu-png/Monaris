// ===== congDuc/core.js — logic lõi Công Đức: bộ nhớ RAM, Cảnh Giới, tích phút voice, thắp hương miễn phí, bậc thang đốt hương =====
// KHÔNG phụ thuộc Discord. Sheet chỉ được nạp lười (lúc load/flush) nên test thuần chạy được không cần credentials.
// Phần Đốt hương: file này chỉ tính giá/roll/ghi nhận kết quả; trừ Điểm HĐ + cộng EXP Level nằm ở congDuc/incense.js (phần sau).
const cfg = require('../config/congDuc');

const users = new Map(); // userId -> record (xem rowToRecord ở googleSheets/congDucSheet.js)
const dirty = new Set(); // userId cần flush
const realmListeners = [];
let loaded = false;
let flushTimer = null;
let flushing = null;

// ---------- Ngày giờ VN ----------
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const vnDay = (ms = Date.now()) => new Date(ms + VN_OFFSET_MS).toISOString().slice(0, 10); // YYYY-MM-DD
const vnYesterday = (ms = Date.now()) => vnDay(ms - 24 * 60 * 60 * 1000);

// ---------- Record ----------
function blankRecord(userId, name) {
  return { userId: String(userId), name: name || '', total: 0, todayCd: 0, todayMin: 0, totalMin: 0, dayKey: '', streak: 0, bestStreak: 0, lastIncenseDay: '', incenseDays: 0, burnToday: 0, burnDay: '', burnTotal: 0, realm: cfg.CONG_DUC_REALMS[0].name, bonusExp: 0, repent: 0, row: 0 };
}
function getRecord(userId, name, { create = true } = {}) {
  const id = String(userId);
  let rec = users.get(id);
  if (!rec && create) { rec = blankRecord(id, name); users.set(id, rec); }
  if (rec && name && rec.name !== name) { rec.name = name; markDirty(rec); }
  return rec || null;
}
const markDirty = (rec) => { dirty.add(rec.userId); };

// Sang ngày mới (giờ VN) thì xoá bộ đếm "hôm nay". Gọi trước mọi lần đọc/ghi các cột D, E, K.
function rollDay(rec, day = vnDay()) {
  if (rec.dayKey !== day) { rec.dayKey = day; rec.todayCd = 0; rec.todayMin = 0; markDirty(rec); }
  if (rec.burnDay !== day) { rec.burnDay = day; rec.burnToday = 0; markDirty(rec); }
  return rec;
}

// ---------- Cảnh Giới ----------
function realmIndexFor(total) {
  let idx = 0;
  for (let i = 0; i < cfg.CONG_DUC_REALMS.length; i += 1) if (total >= cfg.CONG_DUC_REALMS[i].from) idx = i;
  return idx;
}
// { name, index, from, next: {name, from}|null, toNext, pct }
function realmInfo(total) {
  const index = realmIndexFor(total);
  const cur = cfg.CONG_DUC_REALMS[index];
  const next = cfg.CONG_DUC_REALMS[index + 1] || null;
  const span = next ? next.from - cur.from : 0;
  return { name: cur.name, index, from: cur.from, next: next ? { name: next.name, from: next.from } : null, toNext: next ? Math.max(0, next.from - total) : 0, pct: next ? Math.min(100, Math.floor(((total - cur.from) / span) * 100)) : 100 };
}
function onRealmUp(fn) { realmListeners.push(fn); }

// Hệ số nhân Công Đức bên ngoài (Giờ Hoàng Đạo congDuc/hoangDao.js, buff Quẻ Xăm congDuc/queXam.js...), gắn qua
// setMeritMultiplierProvider() ở congDuc/index.js — KHÔNG require thẳng 2 module đó ở đây để tránh phụ thuộc vòng
// (2 module đó đều cần gọi lại core.getRecord/addMerit). Mặc định 1 (không đổi hành vi) nếu chưa ai gắn.
let meritMultiplierProvider = () => 1;
function setMeritMultiplierProvider(fn) { meritMultiplierProvider = typeof fn === 'function' ? fn : () => 1; }

// Cộng Công Đức (mọi nguồn đều đi qua đây: voice, thắp hương, đốt hương, thưởng quẻ xăm). Trả { added, realmUp: {from,to,index}|null }.
// `countsToday=true` -> cộng cả vào "Công Đức hôm nay" (cột D, dùng cho top ngày).
function addMerit(rec, amount, { day = vnDay(), now = Date.now() } = {}) {
  let mult = 1;
  try { mult = Number(meritMultiplierProvider(rec.userId, now)) || 1; } catch { mult = 1; }
  const add = Math.max(0, Math.floor((Number(amount) || 0) * Math.max(1, mult)));
  rollDay(rec, day);
  if (!add) return { added: 0, realmUp: null };
  const before = realmIndexFor(rec.total);
  rec.total += add;
  rec.todayCd += add;
  const after = realmIndexFor(rec.total);
  rec.realm = cfg.CONG_DUC_REALMS[after].name;
  markDirty(rec);
  let realmUp = null;
  if (after > before) {
    realmUp = { from: cfg.CONG_DUC_REALMS[before].name, to: cfg.CONG_DUC_REALMS[after].name, index: after };
    for (const fn of realmListeners) { try { fn(rec, realmUp); } catch (e) { console.error('❌ [công đức] listener lên cảnh giới lỗi:', e && e.message); } }
  }
  return { added: add, realmUp };
}

// ---------- Tích phút ngồi voice ----------
// Mỗi phút gọi 1 lần cho mỗi người ĐƯỢC tính. Trả { added, capped }.
function addVoiceMinute(userId, name, { now = Date.now() } = {}) {
  const day = vnDay(now);
  const rec = rollDay(getRecord(userId, name), day);
  if (cfg.CONG_DUC_DAILY_MAX_MINUTES > 0 && rec.todayMin >= cfg.CONG_DUC_DAILY_MAX_MINUTES) return { added: 0, capped: true, rec };
  rec.todayMin += 1;
  rec.totalMin = (rec.totalMin || 0) + 1; // tổng phút ngồi thiền từ trước đến nay (không reset theo ngày) — để đối chiếu điểm với số phút thật
  // Còn điểm sám hối -> Công Đức thiền nhận được giảm (×SAM_HOI_EXP_MULT); vẫn tối thiểu 1 nếu cấu hình gốc > 0.
  const f = repentFactor(userId);
  const base = f < 1 && cfg.CONG_DUC_PER_MINUTE > 0 ? Math.max(1, Math.floor(cfg.CONG_DUC_PER_MINUTE * f)) : cfg.CONG_DUC_PER_MINUTE;
  const res = addMerit(rec, base, { day, now });
  return { added: res.added, capped: false, realmUp: res.realmUp, rec };
}

// Thuần: phút liên tục thứ `run` (1, 2, 3…) có chạm mốc thưởng giờ không? (mỗi CONG_DUC_VOICE_STREAK_MINUTES phút liên tục, lặp lại)
const voiceStreakDue = (run) => cfg.CONG_DUC_VOICE_STREAK_MINUTES > 0 && (cfg.CONG_DUC_VOICE_STREAK_MERIT > 0 || cfg.CONG_DUC_VOICE_STREAK_EXP > 0) && run > 0 && run % cfg.CONG_DUC_VOICE_STREAK_MINUTES === 0;

// Thuần: hôm nay người này còn được nhận thưởng ngồi liên tục không? Dựa trên số phút ngồi phòng treo trong ngày (rec.todayMin, đã lưu Sheet nên không mất khi bot restart).
// Gọi TRƯỚC addVoiceMinute của phút hiện tại: todayMin = số phút đã tính trước phút này. Trần = CONG_DUC_VOICE_STREAK_DAILY_MAX_MINUTES (0 = không trần).
function voiceStreakAllowedToday(rec, { now = Date.now() } = {}) {
  const max = cfg.CONG_DUC_VOICE_STREAK_DAILY_MAX_MINUTES;
  if (!(max > 0)) return true;
  if (!rec || rec.dayKey !== vnDay(now)) return true; // sang ngày mới / chưa có hồ sơ: bộ đếm hôm nay = 0
  return (rec.todayMin || 0) < max;
}

// Thuần: người này có được tính phút không? state = { selfDeaf, serverDeaf, selfMute, serverMute }, humans = số người thật trong phòng.
function isCountable(state, humans, opts = {}) {
  const countMuted = opts.countMuted === undefined ? cfg.CONG_DUC_COUNT_MUTED : opts.countMuted;
  const countAlone = opts.countAlone === undefined ? cfg.CONG_DUC_COUNT_ALONE : opts.countAlone;
  if (!state) return false;
  if (state.selfDeaf || state.serverDeaf) return false; // deaf = không tính
  if (!countMuted && (state.selfMute || state.serverMute)) return false;
  if (!countAlone && humans < 2) return false;
  return true;
}

// ---------- Thắp hương miễn phí (chuỗi ngày) ----------
const locks = new Set(); // khoá theo userId chống bấm đúp
async function withUserLock(userId, fn) {
  const id = String(userId);
  if (locks.has(id)) return { busy: true };
  locks.add(id);
  try { return await fn(); } finally { locks.delete(id); }
}

// Chuỗi đang còn hiệu lực tại `day`? (thắp hôm qua hoặc hôm nay thì còn; bỏ lỡ >= 1 ngày thì về 0)
function currentStreak(rec, now = Date.now()) {
  if (!rec) return 0;
  const day = vnDay(now);
  return rec.lastIncenseDay === day || rec.lastIncenseDay === vnYesterday(now) ? rec.streak : 0;
}
const freeIncenseDone = (rec, now = Date.now()) => !!rec && rec.lastIncenseDay === vnDay(now);

function freeIncenseReward(streakDay) {
  const mult = cfg.CONG_DUC_INCENSE_STREAK_CAP > 0 ? Math.min(streakDay, cfg.CONG_DUC_INCENSE_STREAK_CAP) : streakDay;
  return cfg.CONG_DUC_INCENSE_BASE * mult;
}

// Thắp hương miễn phí. Không tốn điểm, không cho EXP Level, chỉ cho Công Đức. Đồng bộ (không await) nên không thể chạy chồng.
// Trả { ok:false, reason:'already' } hoặc { ok:true, streak, best, reward, realmUp, rec }.
function doFreeIncense(userId, name, { now = Date.now() } = {}) {
  const day = vnDay(now);
  const rec = rollDay(getRecord(userId, name), day);
  if (rec.lastIncenseDay === day) return { ok: false, reason: 'already', rec };
  rec.streak = rec.lastIncenseDay === vnYesterday(now) ? rec.streak + 1 : 1;
  if (rec.streak > rec.bestStreak) rec.bestStreak = rec.streak;
  rec.lastIncenseDay = day;
  rec.incenseDays += 1;
  const reward = freeIncenseReward(rec.streak);
  const res = addMerit(rec, reward, { day, now });
  markDirty(rec);
  return { ok: true, streak: rec.streak, best: rec.bestStreak, reward, realmUp: res.realmUp, rec };
}

// ---------- Đốt hương: bậc thang giá + roll (chưa trừ điểm — việc đó ở incense.js) ----------
const MAX_BURNS_PER_DAY = cfg.CONG_DUC_INCENSE_TIERS.length;
const burnsToday = (rec, now = Date.now()) => (rec && rec.burnDay === vnDay(now) ? rec.burnToday : 0);

// Lần đốt kế tiếp: { n (1..7), cost } hoặc null nếu đã đủ lượt.
function nextBurn(rec, now = Date.now()) {
  const done = burnsToday(rec, now);
  if (done >= MAX_BURNS_PER_DAY) return null;
  return { n: done + 1, cost: cfg.CONG_DUC_INCENSE_TIERS[done].cost };
}

const randIn = (min, max, rng) => min + (max - min) * rng();
// Roll phần thưởng lần đốt thứ n. EXP làm tròn 2 số lẻ (× EXP_SCALE), Công Đức số nguyên. premium: roll Công Đức nằm ở 20% cao nhất của khoảng.
function rollBurn(n, rng = Math.random) {
  const t = cfg.CONG_DUC_INCENSE_TIERS[n - 1];
  if (!t) throw new Error(`Lần đốt không hợp lệ: ${n}`);
  const expPct = randIn(t.expMinPct, t.expMaxPct, rng);
  const cdFrac = rng();
  const cdPct = t.cdMinPct + (t.cdMaxPct - t.cdMinPct) * cdFrac;
  const exp = Math.round(((t.cost * expPct) / 100) * cfg.CONG_DUC_INCENSE_EXP_SCALE * 100) / 100;
  const cd = Math.round((t.cost * cdPct) / 100);
  return { n, cost: t.cost, exp, cd, premium: cdFrac >= 1 - cfg.CONG_DUC_PREMIUM_TOP_FRACTION };
}

// Ghi nhận 1 lần đốt ĐÃ trừ điểm thành công: tăng đếm trong ngày + cộng Công Đức. Trả { realmUp }.
function applyBurn(userId, name, n, cd, { now = Date.now() } = {}) {
  const day = vnDay(now);
  const rec = rollDay(getRecord(userId, name), day);
  rec.burnToday = Math.max(rec.burnToday, n);
  rec.burnTotal += 1;
  const res = addMerit(rec, cd, { day, now });
  markDirty(rec);
  return { realmUp: res.realmUp, rec };
}

// ---------- Bảng xếp hạng (RAM) ----------
function topToday(limit = 10, now = Date.now()) {
  const day = vnDay(now);
  return [...users.values()].filter((r) => r.dayKey === day && r.todayCd > 0).sort((a, b) => b.todayCd - a.todayCd).slice(0, limit);
}
function topTotal(limit = 10) {
  return [...users.values()].filter((r) => r.total > 0).sort((a, b) => b.total - a.total).slice(0, limit);
}
// Hạng theo Tổng Công Đức (1 = cao nhất). Trả { rank: 0 nếu chưa có Công Đức, count: số người có Công Đức }.
function rankOf(userId) {
  const list = [...users.values()].filter((r) => r.total > 0);
  const me = users.get(String(userId));
  if (!me || me.total <= 0) return { rank: 0, count: list.length };
  return { rank: list.filter((r) => r.total > me.total).length + 1, count: list.length };
}
const allRecords = () => [...users.values()];
function incensedToday(now = Date.now()) {
  const day = vnDay(now);
  return [...users.values()].filter((r) => r.lastIncenseDay === day);
}
// Điểm Lòng Thành = Tổng Công Đức − đã dùng ở Cửa hàng (congDuc/shop.js gắn nguồn số đã chi qua setSpentProvider).
let spentProvider = () => 0;
function setSpentProvider(fn) { spentProvider = fn; }
const sincerityOf = (rec) => Math.max(0, (rec ? rec.total : 0) - (rec ? spentProvider(rec.userId) : 0));

// TRỪ Tổng Công Đức (phạt chửi tục). Không xuống dưới 0, tính lại cảnh giới (có thể tụt). KHÔNG đụng EXP/Level/Điểm HĐ. Trả số thực trừ.
function deductMerit(rec, amount) {
  const want = Math.round((Number(amount) || 0) * 100) / 100;
  const take = Math.min(want, Math.max(0, rec.total || 0));
  if (!(take > 0)) return 0;
  rec.total = Math.round((rec.total - take) * 100) / 100;
  rec.realm = cfg.CONG_DUC_REALMS[realmIndexFor(rec.total)].name;
  markDirty(rec);
  return take;
}

// Admin chỉnh tay Tổng Công Đức (/addpoint): KHÔNG nhân hệ số, KHÔNG vào "Công Đức hôm nay". Dương = cộng, âm = trừ (không xuống dưới 0). Trả mức đã đổi (có dấu).
function adjustMeritRaw(rec, delta) {
  const d = Math.round((Number(delta) || 0) * 100) / 100;
  if (d < 0) return -deductMerit(rec, -d);
  if (!(d > 0)) return 0;
  rec.total = Math.round(((rec.total || 0) + d) * 100) / 100;
  rec.realm = cfg.CONG_DUC_REALMS[realmIndexFor(rec.total)].name;
  markDirty(rec);
  return d;
}

// ---------- Điểm sám hối (samHoi/) ----------
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
// Cộng sám hối (amount > 0). Trả về số đã cộng.
function addRepent(rec, amount) {
  const a = round2(amount);
  if (!(a > 0)) return 0;
  rec.repent = round2((rec.repent || 0) + a);
  markDirty(rec);
  return a;
}
// Nhận EXP -> sám hối tăng = SAM_HOI_GAIN_RATIO (½) × EXP nhận được. Chỉ chạy khi Công Đức đã nạp (chưa nạp thì bỏ qua, không tạo dòng).
function onExpGained(userId, exp, name) {
  if (!require('../features').isEnabled('samhoi') || !loaded) return 0;
  return addRepent(getRecord(userId, name), Number(exp) * cfg.SAM_HOI_GAIN_RATIO);
}
// Thiền 1 phút (ngồi phòng voice bot treo): −SAM_HOI_MEDITATE_PER_MIN, không xuống dưới 0. Trả số đã giảm.
function meditateMinute(userId) {
  if (!require('../features').isEnabled('samhoi')) return 0;
  const rec = getRecord(userId, '', { create: false });
  if (!rec || !(rec.repent > 0)) return 0;
  const cut = Math.min(rec.repent, cfg.SAM_HOI_MEDITATE_PER_MIN);
  rec.repent = round2(rec.repent - cut);
  markDirty(rec);
  return cut;
}
// Đang dính sám hối (điểm > 0)? Không tạo dòng mới cho người chưa có hồ sơ.
function hasRepent(userId) {
  if (!require('../features').isEnabled('samhoi') || !loaded) return false;
  const rec = getRecord(userId, '', { create: false });
  return Boolean(rec && rec.repent > 0);
}
// Hệ số nhận EXP/Công Đức thiền: còn sám hối > 0 -> SAM_HOI_EXP_MULT (0.5), ngược lại 1.
const repentFactor = (userId) => (hasRepent(userId) ? cfg.SAM_HOI_EXP_MULT : 1);
// Phạt EXP cho lần chửi KẾ TIẾP: 500, nếu sám hối còn > 0 thì + 10% số sám hối đang có.
const swearPenaltyFor = (rec) => round2(cfg.SAM_HOI_PENALTY_EXP + (rec && rec.repent > 0 ? rec.repent * cfg.SAM_HOI_STACK_PCT : 0));
// Ghi nhận 1 lần chửi: trả { penalty (EXP định trừ), repentBefore, repentAfter } rồi cộng SAM_HOI_ADD_ON_SWEAR vào sám hối. Việc trừ EXP thật do samHoi/ gọi level.penalizeExp.
function registerSwear(userId, name) {
  const rec = getRecord(userId, name);
  const repentBefore = rec.repent || 0;
  const penalty = swearPenaltyFor(rec);
  addRepent(rec, cfg.SAM_HOI_ADD_ON_SWEAR);
  return { penalty, repentBefore, repentAfter: rec.repent || 0, rec };
}

// ---------- Nạp + flush theo lô ----------
async function load() {
  const sheet = require('../googleSheets/congDucSheet');
  const list = await sheet.loadAll();
  users.clear();
  for (const r of list) users.set(r.userId, r);
  loaded = true;
  return list.length;
}
const isLoaded = () => loaded;

async function flush() {
  if (flushing) return flushing; // chống chạy chồng
  if (!dirty.size) return 0;
  const ids = [...dirty];
  const recs = ids.map((id) => users.get(id)).filter(Boolean);
  dirty.clear();
  flushing = (async () => {
    try {
      await require('../googleSheets/congDucSheet').saveBatch(recs);
      return recs.length;
    } catch (error) {
      for (const id of ids) dirty.add(id); // giữ lại để thử ở lượt sau, không mất dữ liệu
      console.error('❌ [công đức] flush Sheet lỗi (sẽ thử lại):', error && error.message ? error.message : error);
      return 0;
    } finally { flushing = null; }
  })();
  return flushing;
}
function startFlushLoop() {
  if (flushTimer) return;
  flushTimer = setInterval(() => { flush().catch(() => {}); }, cfg.CONG_DUC_FLUSH_MS);
  if (flushTimer.unref) flushTimer.unref();
}
function stopFlushLoop() { if (flushTimer) clearInterval(flushTimer); flushTimer = null; }

// Chỉ dùng cho test: xoá sạch RAM.
function _setLoadedForTest(v = true) { loaded = v; }
function _resetForTest() { users.clear(); dirty.clear(); locks.clear(); realmListeners.length = 0; loaded = false; spentProvider = () => 0; meritMultiplierProvider = () => 1; }

module.exports = {
  vnDay, vnYesterday, getRecord, rollDay, markDirty,
  realmIndexFor, realmInfo, onRealmUp, addMerit, setMeritMultiplierProvider,
  addVoiceMinute, voiceStreakDue, voiceStreakAllowedToday, isCountable, withUserLock,
  currentStreak, freeIncenseDone, freeIncenseReward, doFreeIncense,
  MAX_BURNS_PER_DAY, burnsToday, nextBurn, rollBurn, applyBurn,
  deductMerit, adjustMeritRaw, addRepent, hasRepent, repentFactor, onExpGained, meditateMinute, swearPenaltyFor, registerSwear, topToday, topTotal, rankOf, allRecords, incensedToday, setSpentProvider, sincerityOf,
  load, isLoaded, flush, startFlushLoop, stopFlushLoop, _resetForTest, _setLoadedForTest,
  _users: users, _dirty: dirty,
};
