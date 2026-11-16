// ===== Admin API routes: nội dung tự động =====
// Bảng thông báo (notice + duyệt), Auto DM (nội dung/lịch) và danh sách Access ID.

const { accessIds } = require('../../state');
const {
  loadNoticeBoardNotices,
  addNoticeBoardNotice,
  updateNoticeBoardNotice,
  removeNoticeBoardNotice,
} = require('../../googleSheets/noticeBoardSheet');
const {
  loadAutoDmContents,
  loadAutoDmSchedules,
  addAutoDmContent,
  addAutoDmSchedule,
  removeAutoDmSchedule,
} = require('../../googleSheets/autoDmSheet');
const {
  listPendingNoticeApprovals,
  resolvePendingNoticeApproval,
  updatePendingNoticeApproval,
} = require('../../commands/noticeApproval');
const { addAccessIdRow, removeAccessIdRow } = require('../../googleSheets/accessIdSheet');
const { sendJson } = require('../httpUtils');

const contentRoutes = {
  // ---- Quản lý Bảng Tin Monaris (thêm/sửa/xoá) — thay cho phải gõ
  // /addnotice + duyệt qua DM Discord khi cần chỉnh sửa nhanh. ----
  'GET /admin/notice/list': async (req, res) => {
    const notices = await loadNoticeBoardNotices();
    sendJson(res, 200, { notices: [...notices].sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10)) });
  },
  // body.autoDeleteSeconds (tuỳ chọn): số giây tự xoá RIÊNG cho tin này —
  // để trống/không gửi = dùng mặc định chung (xem parseAutoDeleteSecondsInput
  // trong googleSheets/noticeBoardSheet.js).
  'POST /admin/notice/add': async (req, res, body) => {
    const notice = await addNoticeBoardNotice(body.content, body.postedByUserId || null, body.autoDeleteSeconds);
    sendJson(res, 200, { ok: true, notice });
  },
  // body.autoDeleteSeconds: CHỈ cập nhật cột "Tự xoá sau (giây)" nếu field
  // này thật sự có mặt trong body (kể cả rỗng/0) — không gửi field này thì
  // giữ nguyên giá trị tự xoá cũ của tin.
  'POST /admin/notice/update': async (req, res, body) => {
    if (!body.id) return sendJson(res, 400, { error: 'Thiếu id.' });
    const autoDeleteSeconds = Object.prototype.hasOwnProperty.call(body, 'autoDeleteSeconds')
      ? body.autoDeleteSeconds
      : undefined;
    const found = await updateNoticeBoardNotice(body.id, body.content, autoDeleteSeconds);
    if (!found) return sendJson(res, 404, { error: `Không tìm thấy tin #${body.id}.` });
    sendJson(res, 200, { ok: true });
  },
  'POST /admin/notice/delete': async (req, res, body) => {
    if (!body.id) return sendJson(res, 400, { error: 'Thiếu id.' });
    const found = await removeNoticeBoardNotice(body.id);
    if (!found) return sendJson(res, 404, { error: `Không tìm thấy tin #${body.id}.` });
    sendJson(res, 200, { ok: true });
  },

  // ---- Duyệt tin đang chờ (do người không có role Bông gửi) ngay trên web,
  // thay vì phải chờ mở DM Discord để bấm nút Đồng Ý/Từ Chối. ----
  'GET /admin/notice/pending': async (req, res) => {
    sendJson(res, 200, { pending: listPendingNoticeApprovals() });
  },
  // Sửa nội dung tin đang chờ duyệt (vd chỉnh lỗi chính tả, chèn emote
  // server) trước khi bấm Đồng Ý/Từ Chối — không đổi người đăng gốc.
  'POST /admin/notice/pending/update': async (req, res, body) => {
    if (!body.id) return sendJson(res, 400, { error: 'Thiếu id.' });
    if (!body.content || !String(body.content).trim()) return sendJson(res, 400, { error: 'Thiếu nội dung.' });
    const pending = updatePendingNoticeApproval(String(body.id), String(body.content).trim());
    if (!pending) return sendJson(res, 404, { error: `Không tìm thấy tin chờ duyệt #${body.id} (có thể đã được xử lý hoặc bot đã restart).` });
    sendJson(res, 200, { ok: true, pending: { id: body.id, ...pending } });
  },
  'POST /admin/notice/approve': async (req, res, body) => {
    if (!body.id) return sendJson(res, 400, { error: 'Thiếu id.' });
    const { notice } = await resolvePendingNoticeApproval(String(body.id), true);
    sendJson(res, 200, { ok: true, notice });
  },
  'POST /admin/notice/reject': async (req, res, body) => {
    if (!body.id) return sendJson(res, 400, { error: 'Thiếu id.' });
    await resolvePendingNoticeApproval(String(body.id), false);
    sendJson(res, 200, { ok: true });
  },

  // ---- Quản lý Auto DM (mẫu nội dung + lịch gửi) — thay cho phải sửa tay
  // trực tiếp trên Google Sheet mỗi khi thêm/đổi lịch cho 1 người. ----
  'GET /admin/autodm/list': async (req, res) => {
    const contents = await loadAutoDmContents();
    const schedules = await loadAutoDmSchedules();
    sendJson(res, 200, { contents, schedules });
  },
  'POST /admin/autodm/content/add': async (req, res, body) => {
    const content = await addAutoDmContent(body.content);
    sendJson(res, 200, { ok: true, content });
  },
  // Body: { userId, dmId, time } — THÊM 1 lịch DM mới cho 1 người (mỗi
  // người tối đa MAX_SCHEDULES_PER_USER lịch, xem googleSheets/autoDmSheet.js).
  'POST /admin/autodm/schedule/set': async (req, res, body) => {
    const result = await addAutoDmSchedule(body.userId, body.dmId, body.time);
    sendJson(res, 200, { ok: true, ...result });
  },
  // Body: { userId, scheduleId? } — có scheduleId thì chỉ xoá đúng lịch đó,
  // không có thì xoá TOÀN BỘ lịch của user.
  'POST /admin/autodm/schedule/remove': async (req, res, body) => {
    if (!body.userId) return sendJson(res, 400, { error: 'Thiếu userId.' });
    const result = await removeAutoDmSchedule(body.userId, body.scheduleId || null);
    if (!result.removedCount) return sendJson(res, 404, { error: `Không tìm thấy lịch của user ${body.userId}.` });
    sendJson(res, 200, { ok: true, ...result });
  },

  // ---- Quản lý AccessID (quyền ngang Bông cho tính năng chat) — thay cho
  // chỉ có thể THÊM qua role Bông, giờ có thêm cả xem danh sách + gỡ quyền. ----
  'GET /admin/access/list': async (req, res) => {
    sendJson(res, 200, { accessIds: Array.from(accessIds) });
  },
  'POST /admin/access/add': async (req, res, body) => {
    const discordId = String(body.discordId || '').trim();
    if (!/^\d{15,25}$/.test(discordId)) return sendJson(res, 400, { error: 'discordId không hợp lệ.' });
    if (accessIds.has(discordId)) return sendJson(res, 200, { ok: true, alreadyExists: true });
    accessIds.add(discordId);
    await addAccessIdRow(discordId);
    sendJson(res, 200, { ok: true });
  },
  'POST /admin/access/remove': async (req, res, body) => {
    const discordId = String(body.discordId || '').trim();
    if (!discordId) return sendJson(res, 400, { error: 'Thiếu discordId.' });
    accessIds.delete(discordId);
    const found = await removeAccessIdRow(discordId);
    sendJson(res, 200, { ok: true, foundOnSheet: found });
  },
};

// Đã vô hiệu hóa cấp quyền ngoại lệ qua AccessID.
contentRoutes['POST /admin/access/add'] =
  async (_req, res) => sendJson(res, 403, {
    error: 'Chỉ sử dụng role Bông.'
  });

contentRoutes['POST /admin/access/remove'] =
  async (_req, res) => sendJson(res, 403, {
    error: 'Cơ chế AccessID đã ngừng hoạt động.'
  });

module.exports = {
  contentRoutes,
};
