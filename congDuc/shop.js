// ===== congDuc/shop.js — Cửa hàng Công Đức: mua BỘ KHUNG bằng Điểm Lòng Thành =====
// Điểm Lòng Thành = Tổng Công Đức − đã chi ở đây (core.sincerityOf). Sổ chi riêng: tab "Lịch Sử Lòng Thành" (KHÔNG đụng "Lịch Sử Dùng Điểm" của Điểm HĐ).
// Khung đã mua ghi chung tab "Shop Khung" (nguồn "công đức") qua shop/ownership.js nên /profile → Khung thẻ mở khoá như khung shop thường.
// Thứ tự mua (idempotent theo ghi chú `cd|<id>`): (1) khoá userId → (2) đủ Lòng Thành → (3) ghi sổ chi → (4) ghi "Shop Khung" + ownership. Lỗi ở (4) thì bấm mua lại chỉ KHÔI PHỤC khung, không trừ lần 2.
const core = require('./core');
const catalog = require('./catalog');
const ownership = require('../shop/ownership');

const sheet = () => require('../googleSheets/congDucSheet');
const shopSheet = () => require('../googleSheets/shopSheet');

const spent = new Map(); // userId -> tổng Lòng Thành đã chi
const notes = new Set(); // `${userId}|${note}` đã có trong sổ
let loaded = false;
let retryTimer = null;
let deps = { appendLedgerRow: (r) => sheet().appendLedgerRow(r), appendOwned: (rows) => shopSheet().appendOwned(rows), loadLedger: () => sheet().loadLedger() };
function setDeps(d) { deps = { ...deps, ...d }; } // chỉ dùng cho test

const noteOf = (id) => `cd|${id}`;
const isReady = () => loaded;

function ingest(rows) {
  spent.clear(); notes.clear();
  for (const r of rows) {
    spent.set(r.userId, (spent.get(r.userId) || 0) + r.cost);
    if (r.note) notes.add(`${r.userId}|${r.note}`);
  }
  core.setSpentProvider((userId) => spent.get(String(userId)) || 0);
  loaded = true;
}

async function load() { ingest(await deps.loadLedger()); return spent.size; }

// Nạp sổ chi lúc khởi động; lỗi thì thử lại mỗi 60 giây (trong lúc chưa nạp được, cửa hàng từ chối mua để khỏi tiêu quá số dư).
async function start() {
  try { await load(); } catch (error) {
    console.error('[công đức] Chưa nạp được sổ Lịch Sử Lòng Thành (cửa hàng tạm khoá, sẽ thử lại):', error && error.message ? error.message : error);
    if (retryTimer) return;
    retryTimer = setInterval(() => { load().then(() => { clearInterval(retryTimer); retryTimer = null; console.log('[công đức] Đã nạp sổ Lòng Thành.'); }).catch(() => {}); }, 60_000);
    if (retryTimer.unref) retryTimer.unref();
  }
}

const ownedBy = (userId, id) => ownership.has(userId, id) === true;
const balanceOf = (userId) => core.sincerityOf(core.getRecord(userId, '', { create: false }));

// Dữ liệu cho màn danh sách / chi tiết (đọc RAM, đồng bộ).
function homeData(userId) {
  const items = catalog.listItems().filter((it) => it.available && it.price !== null).map((it) => ({ ...it, owned: ownedBy(userId, it.id) }));
  return { items, balance: balanceOf(userId), ready: loaded && ownership.isLoaded() };
}
function itemData(userId, id) {
  const item = catalog.getItem(id);
  if (!item || !item.available || item.price === null) return null;
  return { item, owned: ownedBy(userId, id), balance: balanceOf(userId) };
}

// Trả { ok:true, item, restored, left } hoặc { ok:false, msg }.
async function buy(userId, name, id, { now = Date.now() } = {}) {
  userId = String(userId);
  const item = catalog.getItem(id);
  if (!item || item.price === null) return { ok: false, msg: '❌ Bộ khung này không bán.' };
  if (!item.available) return { ok: false, msg: '❌ Bộ khung này chưa có trong bot.' };
  if (!loaded || !ownership.isLoaded()) return { ok: false, msg: '⏳ Cửa hàng đang nạp dữ liệu, thí chủ thử lại sau ít phút.' };
  const res = await core.withUserLock(userId, async () => {
    if (ownership.has(userId, id)) return { ok: false, msg: `✅ Thí chủ đã sở hữu **${item.name}** rồi.` };
    const note = noteOf(id);
    const key = `${userId}|${note}`;
    let restored = false;
    if (notes.has(key)) restored = true; // lần trước đã trừ nhưng chưa ghi được khung -> chỉ khôi phục
    else {
      const have = balanceOf(userId);
      if (have < item.price) return { ok: false, msg: `❌ Không đủ Lòng Thành: cần **${core_fmt(item.price)}**, thí chủ có **${core_fmt(have)}**. Chưa trừ gì cả.` };
      try {
        await deps.appendLedgerRow({ day: core.vnDay(now), userId, name, item: `Mua khung: ${item.name}`, cost: item.price, note });
      } catch (error) {
        console.error('[công đức] Lỗi ghi sổ Lịch Sử Lòng Thành (chưa trừ):', error && error.message ? error.message : error);
        return { ok: false, msg: '❌ Có lỗi khi ghi sổ — chưa trừ gì cả, thí chủ thử lại sau nhé.' };
      }
      spent.set(userId, (spent.get(userId) || 0) + item.price);
      notes.add(key);
    }
    try {
      await deps.appendOwned([{ userId, name, frameId: id, source: 'công đức', price: item.price }]);
    } catch (error) {
      console.error(`❌ [công đức] ĐÃ trừ Lòng Thành nhưng chưa ghi được khung ${id} cho ${userId} (bấm mua lại sẽ khôi phục, không trừ lần 2):`, error && error.message ? error.message : error);
      return { ok: false, msg: '⚠️ Đã trừ Lòng Thành nhưng chưa ghi được khung — thí chủ bấm **Mua** lại, bot sẽ khôi phục mà không trừ lần 2.' };
    }
    ownership.add(userId, id);
    return { ok: true, item, restored, left: balanceOf(userId) };
  });
  if (res && res.busy) return { ok: false, msg: '⏳ Đang xử lý lần bấm trước, thí chủ chờ một chút.' };
  return res;
}
const core_fmt = (n) => Number(n || 0).toLocaleString('vi-VN');

function _resetForTest() { spent.clear(); notes.clear(); loaded = false; }

module.exports = { start, load, ingest, isReady, homeData, itemData, buy, setDeps, _resetForTest, _spent: spent, _notes: notes };
