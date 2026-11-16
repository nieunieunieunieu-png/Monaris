// ===== congDuc/keep.js — quyết định tin nào trong kênh Sảnh được GIỮ LẠI (THUẦN) =====
// Giữ đúng 2 loại: (1) tin Sảnh (id lưu bền) (2) thông báo công khai của tính năng (id đã lưu, hoặc footer embed có MARKER).
// KHÔNG giữ theo "mọi tin của bot".
const { MARKER } = require('./view');

function hasMarker(message) {
  return (message.embeds || []).some((e) => {
    const t = e && e.footer ? (typeof e.footer === 'string' ? e.footer : e.footer.text) : '';
    return t === MARKER;
  });
}
// message: { id, embeds }; st: { sanhMessageId, noticeIds (Set) }
function shouldKeep(message, st) {
  if (!message) return true;
  if (st.sanhMessageId && message.id === st.sanhMessageId) return true;
  if (st.noticeIds && st.noticeIds.has(message.id)) return true;
  return hasMarker(message);
}
module.exports = { shouldKeep, hasMarker };
