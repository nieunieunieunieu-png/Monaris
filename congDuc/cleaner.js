// ===== congDuc/cleaner.js — kênh Sảnh Công Đức tự dọn tin =====
// Mọi tin trong CONG_DUC_CHANNEL_ID đều bị xoá TRỪ tin Sảnh + thông báo cảnh giới (congDuc/keep.js). Tuyệt đối không đụng kênh khác.
// Xoá ngay khi gửi (CONG_DUC_AUTODELETE_DELAY_MS, mặc định 0); quét lại lúc khởi động + mỗi 10 phút (100 tin gần nhất; bulkDelete tin < 14 ngày, xoá lẻ tuần tự tin cũ hơn).
// Cần quyền Manage Messages; thiếu thì ghi 1 dòng log rõ ràng (không crash).
const { Events, PermissionFlagsBits } = require('discord.js');
const client = require('../client');
const cfg = require('../config/congDuc');
const { shouldKeep } = require('./keep');
const { state } = require('./state');

const OWN_GRACE_MS = 20_000; // tin do chính bot vừa gửi: chờ id được lưu rồi mới quyết định (tránh xoá nhầm Sảnh/thông báo mới đăng)
const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000 - 60 * 60 * 1000;
let permWarned = false;
let sweeping = false;
let timer = null;
const status = { hasPermission: null, lastSweepAt: 0, deleted: 0 };

const keep = (m) => shouldKeep(m, state);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function canManage(channel) {
  try {
    const me = channel.guild.members.me;
    const ok = Boolean(me && channel.permissionsFor(me) && channel.permissionsFor(me).has(PermissionFlagsBits.ManageMessages));
    status.hasPermission = ok;
    if (!ok && !permWarned) {
      permWarned = true;
      console.error(`❌ [công đức] Bot THIẾU quyền Manage Messages ở kênh Sảnh ${channel.id} — không tự dọn tin được.`);
      try { require('../activityLog').logActivity('⚠️ [công đức] Bot thiếu quyền Manage Messages ở kênh Sảnh Công Đức — không tự dọn tin được.'); } catch { /* bỏ qua */ }
    }
    if (ok) permWarned = false;
    return ok;
  } catch { return false; }
}

async function deleteOne(message) {
  try { if (message.deletable !== false) { await message.delete(); status.deleted += 1; } } catch (error) { if (!(error && (error.code === 10008 || error.status === 404))) console.error('[công đức] Không xoá được tin:', error && error.message); }
}

async function sweep() {
  if (sweeping || !require('../features').isEnabled('congduc')) return;
  sweeping = true;
  try {
    const channel = await client.channels.fetch(cfg.CONG_DUC_CHANNEL_ID).catch(() => null);
    if (!channel || !channel.isTextBased() || !canManage(channel)) return;
    const fetched = await channel.messages.fetch({ limit: 100 });
    const now = Date.now();
    const doomed = [...fetched.values()].filter((m) => !keep(m) && !(client.user && m.author && m.author.id === client.user.id && now - m.createdTimestamp < OWN_GRACE_MS));
    const fresh = doomed.filter((m) => now - m.createdTimestamp < FOURTEEN_DAYS);
    const old = doomed.filter((m) => now - m.createdTimestamp >= FOURTEEN_DAYS);
    if (fresh.length >= 2) { const res = await channel.bulkDelete(fresh.map((m) => m.id), true).catch((e) => { console.error('[công đức] bulkDelete lỗi:', e.message); return null; }); if (res) status.deleted += res.size; }
    else for (const m of fresh) await deleteOne(m);
    for (const m of old) { await deleteOne(m); await sleep(700); } // tuần tự, không dồn rate limit
    status.lastSweepAt = Date.now();
  } catch (error) {
    console.error('[công đức] Lỗi quét dọn kênh Sảnh:', error && error.message ? error.message : error);
  } finally { sweeping = false; }
}

function onMessage(message) {
  try {
    if (!require('../features').isEnabled('congduc') || message.channelId !== cfg.CONG_DUC_CHANNEL_ID) return;
    const own = client.user && message.author && message.author.id === client.user.id;
    const run = async () => {
      if (keep(message)) return;
      const channel = message.channel;
      if (channel && !canManage(channel)) return;
      await deleteOne(message);
    };
    const delay = own ? Math.max(OWN_GRACE_MS, cfg.CONG_DUC_AUTODELETE_DELAY_MS) : cfg.CONG_DUC_AUTODELETE_DELAY_MS;
    if (delay > 0) setTimeout(() => { run().catch(() => {}); }, delay).unref();
    else run().catch(() => {});
  } catch (error) { console.error('[công đức] Lỗi cleaner:', error && error.message); }
}

function start() {
  if (timer) return;
  client.on(Events.MessageCreate, onMessage);
  sweep().catch(() => {});
  timer = setInterval(() => { sweep().catch(() => {}); }, cfg.CONG_DUC_CLEAN_SWEEP_MS);
  if (timer.unref) timer.unref();
}
const getCleanerStatus = () => ({ ...status });
module.exports = { start, sweep, getCleanerStatus };
