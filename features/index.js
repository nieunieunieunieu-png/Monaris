// ===== features/index.js — công tắt bật/tắt tính năng vui/giải trí =====
// Dùng ở điểm vào của từng tính năng:   if (!require('../features').isEnabled('moe')) return;
// - Trạng thái nằm trong RAM, lưu ở tab "Công Tắc Tính Năng" (googleSheets/featureFlagSheet.js) nên restart không mất.
// - Chưa từng bấm công tắt => dùng giá trị mặc định lấy theo ENV cũ (registry.defaultOn), hành vi bot không đổi.
// - Tính năng bị khoá cứng bằng ENV/khởi động (registry.locked) thì luôn coi là TẮT và web không bật được.
// - Có `requires` (tính năng cha): cha tắt thì con tắt theo.
// - Id không có trong registry => luôn trả true (không bao giờ chặn nhầm).
// Chặn tập trung cho slash/nút/menu: features/gate.js. Tin nhắn/sự kiện thì từng tính năng tự gọi isEnabled().

const { FEATURES } = require('./registry');
// Nạp Sheet theo kiểu lazy để gọi isEnabled() không kéo theo googleapis.
const sheet = () => require('../googleSheets/featureFlagSheet');

const byId = new Map(FEATURES.map((f) => [f.id, f]));
const state = new Map(); // id -> { on, by, at }
let loaded = false;
let saveChain = Promise.resolve();

function lockReason(f) {
  try { return (f.locked && f.locked()) || ''; } catch (_) { return ''; }
}

function ownDefault(f) {
  try { return Boolean(f.defaultOn()); } catch (_) { return true; }
}

// Công tắc của riêng mục này (chưa tính mục cha): đã bấm thì theo bấm, chưa thì theo mặc định.
function ownSwitch(f) {
  const s = state.get(f.id);
  return s ? s.on : ownDefault(f);
}

function isEnabled(id) {
  const f = byId.get(id);
  if (!f) return true;
  if (lockReason(f)) return false;
  if (!ownSwitch(f)) return false;
  return f.requires ? isEnabled(f.requires) : true;
}

function featureName(id) {
  const f = byId.get(id);
  return f ? f.name : id;
}

// Câu báo dùng chung khi người dùng gọi 1 tính năng đang tắt (mon!… hoặc nút/slash).
function disabledNotice(id) {
  return `⛔ Tính năng **${featureName(id)}** đang được tắt tạm thời.`;
}

function toPublic(f) {
  const s = state.get(f.id);
  const locked = lockReason(f);
  return {
    id: f.id,
    group: f.group,
    name: f.name,
    desc: f.desc,
    commands: f.commands || [],
    requires: f.requires || null,
    enabled: isEnabled(f.id), // trạng thái THỰC TẾ đang chạy
    switchOn: !locked && ownSwitch(f), // vị trí công tắc của riêng mục này
    defaultOn: ownDefault(f),
    customized: Boolean(s), // đã từng được chỉnh trên web
    locked: Boolean(locked),
    lockedReason: locked,
    parentOff: Boolean(f.requires) && !isEnabled(f.requires),
    updatedBy: (s && s.by) || '',
    updatedAt: (s && s.at) || '',
  };
}

function list() {
  return FEATURES.map(toPublic);
}

function groups() {
  const out = [];
  for (const f of FEATURES) if (!out.includes(f.group)) out.push(f.group);
  return out;
}

// Nạp từ Sheet (gọi lúc khởi động và khi web bấm "tải lại"). Lỗi đọc => giữ nguyên trạng thái hiện có (không xoá).
async function load() {
  const rows = await sheet().loadFeatureFlagRows();
  state.clear();
  for (const r of rows) if (byId.has(r.id)) state.set(r.id, { on: r.on, by: r.by, at: r.at });
  loaded = true;
  return state.size;
}

function persist() {
  const rows = FEATURES.map((f) => {
    const s = state.get(f.id);
    return { id: f.id, name: f.name, on: s ? s.on : null, by: s ? s.by : '', at: s ? s.at : '' };
  });
  // Ghi tuần tự để 2 lần bấm sát nhau không ghi đè lẫn nhau.
  saveChain = saveChain.then(() => sheet().saveFeatureFlagRows(rows));
  return saveChain.catch((error) => { saveChain = Promise.resolve(); throw error; });
}

const vnTime = () => new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });

// Đổi nhiều công tắt 1 lần (1 lần ghi Sheet). changes: [{ id, enabled }]. Lỗi nghiệp vụ là Error tiếng Việt.
// Lưu Sheet thất bại => hoàn tác RAM và ném lỗi (để web không hiện "đã tắt" mà thật ra restart lại bật).
async function setMany(changes, actor) {
  if (!Array.isArray(changes) || !changes.length) throw new Error('Không có thay đổi nào để áp dụng.');
  const by = String(actor || 'web').slice(0, 60);
  const at = vnTime();
  const before = new Map();
  for (const ch of changes) {
    const f = byId.get(ch && ch.id);
    if (!f) throw new Error(`Không có tính năng "${ch && ch.id}".`);
    if (typeof ch.enabled !== 'boolean') throw new Error(`Thiếu trạng thái bật/tắt cho "${f.name}".`);
    const locked = lockReason(f);
    if (locked && ch.enabled) throw new Error(`Không bật được "${f.name}": ${locked}`);
  }
  for (const ch of changes) {
    const f = byId.get(ch.id);
    if (!before.has(f.id)) before.set(f.id, state.has(f.id) ? { ...state.get(f.id) } : null);
    state.set(f.id, { on: ch.enabled, by, at });
  }
  try {
    await persist();
  } catch (error) {
    for (const [id, old] of before) { if (old) state.set(id, old); else state.delete(id); }
    throw new Error(`Không lưu được vào Google Sheet (${error.message}). Công tắt chưa đổi.`);
  }
  return changes.map((ch) => toPublic(byId.get(ch.id)));
}

// Đưa 1 công tắt về mặc định (xoá dòng đã chỉnh).
async function reset(id, actor) {
  const f = byId.get(id);
  if (!f) throw new Error(`Không có tính năng "${id}".`);
  const old = state.get(id);
  state.delete(id);
  try {
    await persist();
  } catch (error) {
    if (old) state.set(id, old);
    throw new Error(`Không lưu được vào Google Sheet (${error.message}).`);
  }
  return toPublic(f);
}

function isLoaded() {
  return loaded;
}

// Nếu lúc khởi động không đọc được Sheet thì trong lúc chờ, mọi công tắt chạy theo mặc định (ENV). Thử lại mỗi phút cho tới khi đọc được.
let retryTimer = null;
function retryLoadInBackground(intervalMs = 60 * 1000) {
  if (loaded || retryTimer) return;
  retryTimer = setInterval(async () => {
    try {
      await load();
      clearInterval(retryTimer);
      retryTimer = null;
      console.log('[features] Đã nạp lại công tắt tính năng từ Sheet.');
    } catch (error) {
      console.warn('[features] Chưa nạp được công tắt tính năng (sẽ thử lại):', error && error.message ? error.message : error);
    }
  }, intervalMs);
  if (retryTimer.unref) retryTimer.unref();
}

module.exports = { FEATURES, isEnabled, featureName, disabledNotice, list, groups, load, setMany, reset, isLoaded, retryLoadInBackground };
