// ===== Nhật ký THÀNH VIÊN: ghi lại gửi / sửa / xoá tin nhắn của mọi người =====
// Mục đích: ai lỡ nói gì rồi xoá/sửa thì vẫn còn bằng chứng nguyên văn. Chỉ "đứng ngoài" lắng nghe,
// không đổi luồng xử lý của tính năng nào. Ghi ở 2 nơi:
//   1) Kênh Discord MEMBER_LOG_CHANNEL_ID (gom lô qua activityLog/index.js) — ✉️ gửi · ✏️ sửa · 🗑️ xoá.
//   2) Tab Google Sheet "Nhật Ký Tin Nhắn" (googleSheets/memberLogSheet.js) — bền vững, tra cứu bằng /logtim,
//      và là nguồn để NẠP LẠI bản chụp tin sau khi bot restart.
// Bản chụp (snapshot) mỗi tin giữ trong 1 Map riêng (giới hạn số lượng + số giờ), KHÔNG dựa cache discord.js.
// Không ghi DM, không ghi tin của bot/webhook, không ghi tin trong các kênh log. Sự kiện khác (voice, reaction, vào/rời, role...):
// activityLog/memberEvents.js. Cảnh báo: activityLog/memberAlerts.js. Tra cứu: activityLog/logSearch.js.
const { Events } = require('discord.js');
const client = require('../client');
const {
  ACTIVITY_LOG_ENABLED,
  MEMBER_LOG_ENABLED,
  MEMBER_LOG_CREATE,
  MEMBER_LOG_CACHE_MAX,
  MEMBER_LOG_CACHE_HOURS,
  MEMBER_LOG_MAX_CHARS,
  MEMBER_LOG_IGNORE_CHANNEL_IDS,
  MEMBER_LOG_CHANNEL_ID,
  MEMBER_LOG_SHEET_ENABLED,
  MEMBER_LOG_SHEET_FLUSH_SECONDS,
  MEMBER_LOG_SHEET_KEEP_DAYS,
} = require('../config');
const { logActivity, esc, quote, who, isLogChannel } = require('./index');
const alerts = require('./memberAlerts');
const store = require('../googleSheets/memberLogSheet');

const snapshots = new Map(); // messageId -> { authorId, authorName, channelId, content, files, at }
const TTL_MS = MEMBER_LOG_CACHE_HOURS * 60 * 60 * 1000;
const SHEET_BUFFER_MAX = 5000;
let sheetBuffer = []; // sự kiện chờ ghi Sheet
let sheetReady = false;
let sheetId;
let flushing = false;
let flushChain = Promise.resolve();

const active = ACTIVITY_LOG_ENABLED && MEMBER_LOG_ENABLED;
const log = (text) => logActivity(text, MEMBER_LOG_MAX_CHARS + 250, MEMBER_LOG_CHANNEL_ID);

const PRIVATE_CHANNEL_IDS = new Set([
  '1566701909270601758',
  ...(process.env.MONARIS_PRIVATE_CHANNEL_IDS || '')
    .split(/[\s,;]+/)
    .filter(Boolean)
]);

function skipChannel(channelId) {
  if (!channelId) return true;

  const id = String(channelId);
  const channel = client.channels.cache.get(id);
  const parentId = channel?.parentId;

  return (
    isLogChannel(id) ||
    MEMBER_LOG_IGNORE_CHANNEL_IDS.has(id) ||
    PRIVATE_CHANNEL_IDS.has(id) ||
    (parentId && (
      MEMBER_LOG_IGNORE_CHANNEL_IDS.has(parentId) ||
      PRIVATE_CHANNEL_IDS.has(parentId)
    ))
  );
}

function filesOf(message) {
  if (!message.attachments || !message.attachments.size) return [];
  return [...message.attachments.values()].map((a) => `${a.name || 'file'}: ${a.url}`);
}

function channelNameOf(channelId) {
  const c = client.channels.cache.get(channelId);
  return (c && c.name) || '';
}

const jump = (guildId, channelId, messageId) => `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;

// ---------- Bản chụp trong RAM ----------
function remember(message) {
  snapshots.delete(message.id);
  snapshots.set(message.id, {
    authorId: message.author.id,
    authorName: message.author.username || message.author.id,
    channelId: message.channelId,
    content: String(message.content || ''),
    files: filesOf(message),
    at: Date.now(),
  });
  while (snapshots.size > MEMBER_LOG_CACHE_MAX) snapshots.delete(snapshots.keys().next().value);
}

function sweepSnapshots() {
  const limit = Date.now() - TTL_MS;
  for (const [id, snap] of snapshots) {
    if (snap.at < limit) snapshots.delete(id);
    else break; // Map giữ thứ tự thêm vào -> gặp tin còn hạn là dừng
  }
}

// ---------- Ghi Sheet theo lô ----------
function queueSheet(event) {
  if (!active || !MEMBER_LOG_SHEET_ENABLED || skipChannel(event.channelId)) return;
  sheetBuffer.push({ at: Date.now(), ...event });
  if (sheetBuffer.length > SHEET_BUFFER_MAX) sheetBuffer.shift();
}

// Ghi nốt mọi thứ đang chờ (gọi tuần tự). Dùng cả cho /logtim (để đọc được tin mới nhất) và lúc bot tắt.
function flushSheet() {
  const run = flushChain.then(async () => {
    if (!sheetReady || flushing || !sheetBuffer.length) return;
    flushing = true;
    const batch = sheetBuffer;
    sheetBuffer = [];
    try {
      await store.appendEvents(batch);
    } catch (error) {
      sheetBuffer = batch.concat(sheetBuffer).slice(-SHEET_BUFFER_MAX); // ghi lỗi: giữ lại thử lần sau
      console.error('[ActivityLog] Lỗi ghi tab Nhật Ký Tin Nhắn (sẽ thử lại):', error.message);
    } finally {
      flushing = false;
    }
  });
  flushChain = run.catch(() => {});
  return run;
}

// Nạp lại bản chụp từ sheet (các tin còn trong hạn lưu, chưa bị xoá) để restart không mất nguyên văn.
function restoreSnapshots(events) {
  const limit = Date.now() - TTL_MS;
  for (const e of events) {
    if (!e.messageId || e.at < limit || skipChannel(e.channelId)) continue;
    if (e.type === 'XOÁ') snapshots.delete(e.messageId);
    else if (e.type === 'GỬI' || e.type === 'SỬA') {
      snapshots.set(e.messageId, { authorId: e.userId, authorName: e.userName, channelId: e.channelId, content: e.content, files: e.files, at: e.at });
    }
  }
  while (snapshots.size > MEMBER_LOG_CACHE_MAX) snapshots.delete(snapshots.keys().next().value);
}

// Gọi 1 lần ở index.js (Giai đoạn 2): tạo tab, nạp lại bản chụp, bật vòng ghi + dọn dòng cũ.
async function startMemberLog() {
  if (!active || !MEMBER_LOG_SHEET_ENABLED) return;
  sheetId = await store.ensureMemberLogSheet();
  const events = await store.readAllEvents();
  restoreSnapshots(events);
  sheetReady = true;
  console.log(`Started member log (Sheet "Nhật Ký Tin Nhắn": ${events.length} dòng, nạp lại ${snapshots.size} bản chụp tin).`);

  const prune = () =>
    store
      .pruneOld(sheetId, MEMBER_LOG_SHEET_KEEP_DAYS)
      .then((n) => n && console.log(`[ActivityLog] Đã xoá ${n} dòng nhật ký cũ hơn ${MEMBER_LOG_SHEET_KEEP_DAYS} ngày.`))
      .catch((error) => console.error('[ActivityLog] Lỗi dọn nhật ký cũ:', error.message));
  prune();
  const timers = [
    setInterval(() => flushSheet().catch(() => {}), MEMBER_LOG_SHEET_FLUSH_SECONDS * 1000),
    setInterval(prune, 24 * 60 * 60 * 1000),
    setInterval(sweepSnapshots, 60 * 60 * 1000),
  ];
  timers.forEach((t) => t.unref && t.unref());
}

process.on('SIGTERM', () => {
  Promise.race([flushSheet(), new Promise((resolve) => setTimeout(resolve, 3000))]).catch(() => {});
});

// ---------- Định dạng dòng log Discord ----------
// Mỗi mục log gồm 1 dòng tiêu đề + nội dung tin trong khối trích dẫn (giữ nguyên các dòng gốc) + chừa 1 dòng trống phía sau.
const block = (text) => quote(text, MEMBER_LOG_MAX_CHARS);
const fmtFiles = (files) => (files && files.length ? `\n📎 ${files.length} file: ${esc(files.join(' , '))}` : '');
const snapWho = (snap) => (snap ? `<@${snap.authorId}> (${esc(snap.authorName)})` : 'không rõ người gửi');

if (active) {
  // ---- Gửi tin mới ----
  client.on(Events.MessageCreate, (message) => {
    try {
      if (!message.guildId || !message.author || message.author.bot || message.webhookId || skipChannel(message.channelId)) return;
      remember(message);
      const files = filesOf(message);
      const link = jump(message.guildId, message.channelId, message.id);
      queueSheet({
        type: 'GỬI',
        userId: message.author.id,
        userName: message.author.username,
        channelId: message.channelId,
        channelName: channelNameOf(message.channelId),
        content: message.content,
        files,
        messageId: message.id,
        link,
      });
      if (!MEMBER_LOG_CREATE) return;
      const reply = message.reference && message.reference.messageId ? ` ↩️ trả lời tin ${message.reference.messageId}` : '';
      log(`✉️ ${who(message.author)} gửi ở <#${message.channelId}>${reply}\n${block(message.content)}${fmtFiles(files)}\n-# tin ${message.id}`);
    } catch (error) {
      console.error('[ActivityLog] Lỗi ghi tin mới:', error.message);
    }
  });

  // ---- Sửa tin ----
  client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
    try {
      if (!newMessage.guildId || skipChannel(newMessage.channelId)) return;
      let current = newMessage;
      if (current.partial) current = await current.fetch().catch(() => null);
      if (!current || !current.author || current.author.bot || current.webhookId) return;

      const snap = snapshots.get(current.id);
      const before = snap ? snap.content : oldMessage && !oldMessage.partial && oldMessage.content !== null ? String(oldMessage.content) : null;
      const after = String(current.content || '');
      const beforeFiles = snap ? snap.files : null;
      const afterFiles = filesOf(current);

      const textChanged = before !== null && before !== after;
      const filesRemoved = beforeFiles ? beforeFiles.filter((f) => !afterFiles.includes(f)) : [];
      if (!textChanged && !filesRemoved.length) {
        if (!snap) remember(current); // chưa có bản chụp thì lưu lại để lần sửa/xoá sau còn nguyên văn
        return;
      }
      remember(current);
      const link = jump(current.guildId, current.channelId, current.id);
      queueSheet({
        type: 'SỬA',
        userId: current.author.id,
        userName: current.author.username,
        channelId: current.channelId,
        channelName: channelNameOf(current.channelId),
        before: before === null ? '(không có bản gốc)' : before,
        content: after,
        files: afterFiles,
        deletedBy: filesRemoved.length ? `gỡ file: ${filesRemoved.join(' , ')}` : '',
        messageId: current.id,
        link,
      });
      const removed = filesRemoved.length ? `\n🗑️ gỡ file: ${esc(filesRemoved.join(' , '))}` : '';
      const beforeBlock = before === null ? '> (không có bản gốc — tin cũ trước khi bot chạy)' : block(before);
      log(`✏️ ${who(current.author)} SỬA tin ở <#${current.channelId}>\n**Trước:**\n${beforeBlock}\n**Sau:**\n${block(after)}${removed}\n-# [🔗 Xem tin](${link})`);
      if (textChanged) alerts.onEdit({ authorId: current.author.id, authorName: current.author.username, before, after, channelId: current.channelId, link });
    } catch (error) {
      console.error('[ActivityLog] Lỗi ghi sửa tin:', error.message);
    }
  });

  // ---- Xoá tin: cố tìm người xoá trong Audit Log (cần quyền View Audit Log; tự xoá tin của mình thì Discord không ghi audit) ----
  async function findDeleter(guild, authorId, channelId) {
    try {
      if (!guild || !authorId) return null;
      const entries = await guild.fetchAuditLogs({ type: 72, limit: 6 }); // 72 = MESSAGE_DELETE
      const now = Date.now();
      const entry = [...entries.entries.values()].find(
        (e) => now - e.createdTimestamp < 15000 && e.target && e.target.id === authorId && e.extra && e.extra.channel && e.extra.channel.id === channelId
      );
      return entry && entry.executor ? entry.executor : null;
    } catch (error) {
      return null; // thiếu quyền Audit Log -> bỏ qua
    }
  }

  async function logDeleted(messageId, channelId, guild, partialMessage, bulk) {
    const snap = snapshots.get(messageId);
    snapshots.delete(messageId);
    const authorId = snap ? snap.authorId : partialMessage && partialMessage.author ? partialMessage.author.id : null;
    if (partialMessage && partialMessage.author && partialMessage.author.bot) return;
    const authorName = snap ? snap.authorName : partialMessage && partialMessage.author ? partialMessage.author.username : '';
    const content = snap ? snap.content : partialMessage && partialMessage.content ? String(partialMessage.content) : null;
    const files = snap ? snap.files : partialMessage && !partialMessage.partial ? filesOf(partialMessage) : [];
    const authorText = snap ? snapWho(snap) : partialMessage && partialMessage.author ? who(partialMessage.author) : 'không rõ người gửi';

    let by = '';
    let byName = '';
    let selfDelete = false;
    if (!bulk) {
      await new Promise((resolve) => setTimeout(resolve, 1500)); // chờ Audit Log kịp ghi
      const executor = await findDeleter(guild, authorId, channelId);
      if (executor) {
        byName = executor.bot ? `BOT ${executor.username}` : `${executor.username} (${executor.id})`;
        by = executor.bot ? ` — bị BOT xoá (${esc(executor.username)})` : ` — bị <@${executor.id}> (${esc(executor.username)}) xoá`;
      } else if (authorId) {
        byName = 'người gửi tự xoá (hoặc không đọc được Audit Log)';
        by = ' — người gửi tự xoá (hoặc không đọc được Audit Log)';
        selfDelete = true;
      }
    }
    const link = guild ? jump(guild.id, channelId, messageId) : '';
    queueSheet({
      type: 'XOÁ',
      userId: authorId || '',
      userName: authorName,
      channelId,
      channelName: channelNameOf(channelId),
      content: content === null ? '(không còn nguyên văn)' : content,
      files,
      deletedBy: bulk ? 'xoá hàng loạt' : byName,
      messageId,
      link,
    });
    const body = content === null ? '> (không còn nguyên văn — tin gửi trước khi bot chạy / quá hạn lưu)' : block(content);
    log(`🗑️ XOÁ tin${bulk ? ' (xoá hàng loạt)' : ''} của ${authorText} ở <#${channelId}>${by}\n${body}${fmtFiles(files)}\n-# tin ${messageId}`);
    if (selfDelete && content !== null) alerts.onSelfDelete({ authorId, authorName, content, channelId, messageId, link });
  }

  client.on(Events.MessageDelete, (message) => {
    try {
      if (!message.guildId || skipChannel(message.channelId)) return;
      logDeleted(message.id, message.channelId, message.guild, message, false).catch((error) => console.error('[ActivityLog] Lỗi ghi xoá tin:', error.message));
    } catch (error) {
      console.error('[ActivityLog] Lỗi ghi xoá tin:', error.message);
    }
  });

  client.on(Events.MessageBulkDelete, (messages, channel) => {
    try {
      if (!channel || !channel.guildId || skipChannel(channel.id)) return;
      alerts.onBulkDelete(channel.id, messages.size);
      for (const message of messages.values()) {
        logDeleted(message.id, channel.id, channel.guild, message, true).catch(() => {});
      }
    } catch (error) {
      console.error('[ActivityLog] Lỗi ghi xoá hàng loạt:', error.message);
    }
  });
}

module.exports = { startMemberLog, flushSheet, skipChannel };
