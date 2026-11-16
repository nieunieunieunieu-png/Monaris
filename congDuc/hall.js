// ===== congDuc/hall.js — tin SẢNH CÔNG ĐỨC cố định ở CONG_DUC_CHANNEL_ID =====
// Id tin lưu bền (tab "Cấu Hình Công Đức", ô sanh_message_id). Khi bot khởi động: mặc định (CONG_DUC_HALL_RESEND_ON_START=true) gửi tin Sảnh MỚI rồi xoá tin cũ cho tin nằm cuối kênh; tắt thì dùng lại tin cũ. Mất/bị xoá thì tự dựng lại. Cập nhật tối đa mỗi 60 giây, chỉ sửa khi nội dung đổi.
const client = require('../client');
const cfg = require('../config/congDuc');
const core = require('./core');
const view = require('./view');
const voice = require('./voice');
const state = require('./state');
const hoangDao = require('./hoangDao');
const { sendSilent, silentReply } = require('./send');

let message = null;
let lastHash = '';
let busy = false;
let timer = null;
let lastEditAt = 0;

function currentPayload() {
  return view.hallPayload({ sitting: voice.sittingCount(), incensed: core.incensedToday(), top: core.topToday(3), hoangDaoLine: hoangDao.describeToday() });
}

async function ensureHall({ resend = false } = {}) {
  const channel = await client.channels.fetch(cfg.CONG_DUC_CHANNEL_ID).catch(() => null);
  if (!channel || !channel.isTextBased()) { console.error(`[công đức] Không thấy kênh Sảnh ${cfg.CONG_DUC_CHANNEL_ID}`); return null; }
  const id = state.state.sanhMessageId;
  if (id) {
    const found = await channel.messages.fetch(id).catch(() => null);
    if (found && !resend) { message = found; return found; }
    if (found && resend) { // gửi tin mới trước, xoá tin cũ sau (không để kênh trống giữa chừng)
      const payload = currentPayload();
      const sent = await sendSilent(channel, payload);
      await state.setSanhId(sent.id);
      message = sent;
      lastHash = JSON.stringify(payload);
      lastEditAt = Date.now();
      await found.delete().catch((e) => console.error('[công đức] Không xoá được tin Sảnh cũ:', e && e.message ? e.message : e));
      return sent;
    }
  }
  const payload = currentPayload();
  const sent = await sendSilent(channel, payload);
  await state.setSanhId(sent.id);
  message = sent;
  lastHash = JSON.stringify(payload);
  lastEditAt = Date.now();
  return sent;
}

async function refresh(force = false) {
  if (busy) return;
  busy = true;
  try {
    if (!message) await ensureHall();
    if (!message) return;
    if (!force && Date.now() - lastEditAt < 55_000) return; // tối đa ~mỗi 60 giây (vòng 60s sẽ bắt kịp)
    const payload = currentPayload();
    const hash = JSON.stringify(payload);
    if (!force && hash === lastHash) return;
    try {
      await message.edit(silentReply(payload));
      lastHash = hash;
      lastEditAt = Date.now();
    } catch (error) {
      if (error && (error.code === 10008 || error.status === 404)) { message = null; lastHash = ''; await ensureHall(); } // tin bị xoá -> dựng lại
      else throw error;
    }
  } catch (error) {
    console.error('[công đức] Lỗi cập nhật Sảnh:', error && error.message ? error.message : error);
  } finally { busy = false; }
}

async function start() {
  await ensureHall({ resend: cfg.CONG_DUC_HALL_RESEND_ON_START }).catch((e) => console.error('[công đức] Không dựng được Sảnh:', e.message));
  if (timer) return;
  timer = setInterval(() => { refresh().catch(() => {}); }, 60_000);
  if (timer.unref) timer.unref();
}
module.exports = { start, refresh, ensureHall };
