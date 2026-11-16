// ===== congDuc/state.js — trạng thái bền của Sảnh (tab "Cấu Hình Công Đức": sanh_message_id, notice_ids) =====
// Đọc lúc khởi động, ghi ngay khi đổi (hiếm khi đổi nên không đáng ngại quota).
const state = { sanhMessageId: '', noticeIds: new Set(), order: [] };
const MAX_NOTICES = 100;
const sheet = () => require('../googleSheets/congDucSheet');

async function load() {
  const c = await sheet().loadConfig();
  state.sanhMessageId = String(c.sanh_message_id || '').trim();
  state.order = String(c.notice_ids || '').split(',').map((x) => x.trim()).filter(Boolean);
  state.noticeIds = new Set(state.order);
}
async function setSanhId(id) {
  state.sanhMessageId = String(id);
  await sheet().setConfig('sanh_message_id', state.sanhMessageId);
}
async function saveNotices() {
  await sheet().setConfig('notice_ids', state.order.join(','));
}
async function addNoticeId(id) {
  id = String(id);
  if (state.noticeIds.has(id)) return;
  state.order.push(id);
  state.noticeIds.add(id);
  while (state.order.length > MAX_NOTICES) state.noticeIds.delete(state.order.shift());
  await saveNotices();
}
async function removeNoticeId(id) {
  id = String(id);
  if (!state.noticeIds.delete(id)) return;
  state.order = state.order.filter((x) => x !== id);
  await saveNotices();
}
module.exports = { state, load, setSanhId, addNoticeId, removeNoticeId };
