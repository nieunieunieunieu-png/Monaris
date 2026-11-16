// ===== Nhật ký hoạt động của bot =====
// Ghi lại MỌI hoạt động của bot thành các dòng log ngắn rồi gửi vào kênh
// ACTIVITY_LOG_CHANNEL_ID (config/activityLog.js). File này CHỈ "đứng ngoài" lắng nghe —
// không sửa luồng xử lý của bất kỳ tính năng nào. Ghi lại:
//   🟢/🔴 Bot khởi động xong / nhận tín hiệu tắt (deploy mới, restart) / mất kết nối Discord
//   ⌨️ Slash command (kèm tham số) và lệnh chat mon!...
//   🔘 Nút bấm, 📋 menu chọn, 📝 form (popup) được gửi — CHỈ ghi customId, KHÔNG ghi nội dung form
//   🗳️ Reaction trên tin vote scrim / bang chiến + ✅ auto-vote, 🎭 role auto-vote đổi
//   💬 Tin bot gửi trong server (rút gọn) · 📨 DM bot gửi (chỉ ghi gửi cho ai, KHÔNG ghi nội dung)
//   🔊 Bot vào/rời/chuyển kênh voice
//   ❗/⚠️ Mọi console.error / console.warn (lỗi, cảnh báo)
// (Hoạt động của THÀNH VIÊN — gửi/sửa/xoá tin, ra vào voice — nằm ở activityLog/memberLog.js, dùng chung hàng đợi này.)
//
// ẨN DANH LÀ THẬT: nút/form góp ý ẨN DANH tuyệt đối không ghi người bấm (xem isAnonymousFeedbackId).
//
// Chống spam/quá tải: gom lô mỗi ACTIVITY_LOG_FLUSH_SECONDS giây, hàng đợi tối đa MAX_QUEUE dòng
// (quá thì bỏ dòng cũ nhất + báo số dòng bị bỏ), lỗi trùng lặp trong 60s chỉ ghi 1 lần. Tin
// trong chính kênh log không bao giờ được ghi lại (tránh vòng lặp vô hạn).
// Có thể dùng ở nơi khác: const { logActivity } = require('./activityLog'); logActivity('🎯 ...');

const util = require('util');
const { Events, EmbedBuilder } = require('discord.js');
const client = require('../client');
const { ACTIVITY_LOG_ENABLED, ACTIVITY_LOG_CHANNEL_ID, ACTIVITY_LOG_FLUSH_SECONDS } = require('../config');
const { KEYWORD_FILTER_LOG_CHANNEL_ID, MEMBER_LOG_ALL_CHANNEL_IDS } = require('../config');
const { scrimData, bcData } = require('../state');
const { AUTOVOTE_ROLE_ID, AUTOVOTE_EMOJI } = require('../config');

const MAX_QUEUE = 1000;
const MAX_EMBED_CHARS = 3800;
const ERROR_DEDUPE_MS = 60 * 1000;

const originalConsoleError = console.error.bind(console);
const originalConsoleWarn = console.warn.bind(console);

let started = false;
const recentErrors = new Map(); // key -> lastTs

// ---------- Tiện ích định dạng ----------
// esc: dùng cho chữ hiển thị THƯỜNG (tên người, nội dung tin) — thêm dấu \\ trước ký tự markdown.
function esc(text) {
  return String(text === undefined || text === null ? '' : text).replace(/[`*_~|>\\]/g, '\\$&');
}

// tick: dùng cho chữ nằm TRONG dấu ` ` (lệnh, customId) — chỉ bỏ dấu ` để không vỡ khối code,
// giữ nguyên _ và <@id> cho đúng nguyên văn.
function tick(text) {
  return String(text === undefined || text === null ? '' : text).replace(/`/g, '');
}

function clip(text, max) {
  const s = String(text === undefined || text === null ? '' : text).replace(/\s+/g, ' ').trim();
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

// clipKeep: như clip nhưng GIỮ xuống dòng (chỉ gom khoảng trắng/tab và bỏ bớt dòng trống thừa) — dùng cho nội dung tin nhắn nhiều dòng.
function clipKeep(text, max) {
  const s = String(text === undefined || text === null ? '' : text)
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

// quote: nội dung tin -> khối trích dẫn, mỗi dòng gốc là 1 dòng "> ..." (không dính nhau). Rỗng -> "> (không có chữ)".
function quote(text, max, empty = '(không có chữ)') {
  const body = clipKeep(text, max);
  if (!body) return `> ${empty}`;
  return body.split('\n').map((line) => `> ${esc(line) || '\u200b'}`).join('\n');
}

function who(user) {
  if (!user) return 'ai đó';
  return `<@${user.id}> (${esc(user.username || user.tag || user.id)})`;
}

function isLogChannel(channelId) {
  return channelId === ACTIVITY_LOG_CHANNEL_ID || channelId === KEYWORD_FILTER_LOG_CHANNEL_ID || MEMBER_LOG_ALL_CHANNEL_IDS.has(channelId);
}

// customId nút/form góp ý ẨN DANH (feedbackBox/index.js) — không được ghi người dùng.
function isAnonymousFeedbackId(customId) {
  return typeof customId === 'string' && customId.startsWith('feedbackform_') && customId.endsWith('_anon');
}

// ---------- Hàng đợi + gửi gom lô ----------
// Mỗi kênh log có 1 hàng đợi riêng (kênh bot / kênh tin nhắn thành viên / kênh sự kiện thành viên ...) để tách được kênh bằng ENV.
const channelQueues = new Map(); // channelId -> { queue, dropped, timer, flushing, failWarnedAt }

function stateFor(channelId) {
  let st = channelQueues.get(channelId);
  if (!st) {
    st = { queue: [], dropped: 0, timer: null, flushing: false, failWarnedAt: 0 };
    channelQueues.set(channelId, st);
  }
  return st;
}

// maxChars: mặc định 400 ký tự/dòng; nhật ký thành viên truyền số lớn hơn để giữ nguyên văn tin nhắn.
// channelId: mặc định kênh log hoạt động của bot; nhật ký thành viên truyền kênh riêng (config/activityLog.js).
function logActivity(text, maxChars = 400, channelId = ACTIVITY_LOG_CHANNEL_ID) {
  if (!ACTIVITY_LOG_ENABLED || !channelId) return;
  const st = stateFor(channelId);
  // Dòng nhiều dòng (có xuống dòng) giữ nguyên xuống dòng + chừa 1 dòng trống phía sau để các mục không dính nhau.
  const multiline = String(text).includes('\n');
  const body = multiline ? clipKeep(text, Math.min(maxChars, MAX_EMBED_CHARS - 100)) : clip(text, Math.min(maxChars, MAX_EMBED_CHARS - 100));
  const line = `<t:${Math.floor(Date.now() / 1000)}:T> ${body}${multiline ? '\n' : ''}`;
  st.queue.push(line);
  if (st.queue.length > MAX_QUEUE) {
    st.queue.shift();
    st.dropped += 1;
  }
  if (started) scheduleFlush(channelId, ACTIVITY_LOG_FLUSH_SECONDS * 1000);
}

function scheduleFlush(channelId, delayMs) {
  const st = stateFor(channelId);
  if (st.timer || st.flushing) return;
  st.timer = setTimeout(() => {
    st.timer = null;
    flushNow(channelId).catch((error) => originalConsoleError('[ActivityLog] Lỗi gửi log:', error.message));
  }, delayMs);
}

async function getLogChannel(channelId) {
  try {
    return client.channels.cache.get(channelId) || (await client.channels.fetch(channelId));
  } catch (error) {
    return null;
  }
}

// Gửi tối đa 1 tin (embed) gồm nhiều dòng; còn dư thì hẹn lượt sau 2 giây.
async function flushNow(channelId) {
  const st = stateFor(channelId);
  if (st.flushing || (!st.queue.length && !st.dropped)) return;
  st.flushing = true;
  try {
    const lines = [];
    if (st.dropped) {
      lines.push(`⚠️ [ActivityLog] Bỏ qua ${st.dropped} dòng log cũ do quá tải.`);
      st.dropped = 0;
    }
    let size = lines.reduce((n, l) => n + l.length + 1, 0);
    while (st.queue.length && size + st.queue[0].length + 1 <= MAX_EMBED_CHARS) {
      const line = st.queue.shift();
      lines.push(line);
      size += line.length + 1;
    }
    if (!lines.length) return;

    const channel = await getLogChannel(channelId);
    if (!channel) {
      warnSendFailure(st, channelId, 'không lấy được kênh log');
      return;
    }
    const embed = new EmbedBuilder().setColor(0x95a5a6).setDescription(lines.join('\n'));
    try {
      await channel.send({ embeds: [embed], allowedMentions: { parse: [] } });
    } catch (error) {
      warnSendFailure(st, channelId, error.message);
    }
  } finally {
    st.flushing = false;
    if (st.queue.length) scheduleFlush(channelId, 2000);
  }
}

function warnSendFailure(st, channelId, reason) {
  const now = Date.now();
  if (now - st.failWarnedAt < 5 * 60 * 1000) return;
  st.failWarnedAt = now;
  originalConsoleError(`[ActivityLog] Không gửi được log vào kênh ${channelId}: ${reason}`);
}

// Xả hết hàng đợi (dùng lúc bot sắp tắt) — có giới hạn thời gian.
async function flushAll(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  const pendingChannels = () => [...channelQueues.entries()].filter(([, st]) => st.queue.length || st.dropped);
  while (pendingChannels().length && Date.now() < deadline) {
    // eslint-disable-next-line no-await-in-loop
    await Promise.all(pendingChannels().map(([id]) => flushNow(id).catch(() => {})));
    // eslint-disable-next-line no-await-in-loop
    if ([...channelQueues.values()].some((st) => st.flushing)) await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

// ---------- Ghi lại console.error / console.warn ----------
function mirrorConsole(level, original) {
  return (...args) => {
    original(...args);
    try {
      const text = clip(util.format(...args), 300);
      if (!text || text.includes('[ActivityLog]')) return;
      const key = `${level}:${text.slice(0, 120)}`;
      const now = Date.now();
      const last = recentErrors.get(key);
      if (last && now - last < ERROR_DEDUPE_MS) return;
      recentErrors.set(key, now);
      if (recentErrors.size > 200) {
        for (const [k, ts] of recentErrors) if (now - ts > ERROR_DEDUPE_MS) recentErrors.delete(k);
      }
      logActivity(`${level === 'error' ? '❗' : '⚠️'} ${esc(text)}`);
    } catch (error) {
      // không để việc ghi log làm hỏng console gốc
    }
  };
}
if (ACTIVITY_LOG_ENABLED) {
  console.error = mirrorConsole('error', originalConsoleError);
  console.warn = mirrorConsole('warn', originalConsoleWarn);
}

// ---------- Tương tác: slash command / nút / menu chọn / form ----------
function formatOptionValue(option) {
  if (option.attachment) return option.attachment.name || 'file';
  if (option.type === 6) return `<@${option.value}>`; // USER
  if (option.type === 7) return `<#${option.value}>`; // CHANNEL
  if (option.type === 8) return `<@&${option.value}>`; // ROLE
  return clip(option.value, 80);
}

function formatOptions(options) {
  const parts = [];
  for (const option of options || []) {
    if (option.type === 1 || option.type === 2) {
      // Subcommand / SubcommandGroup
      parts.push(tick(option.name), ...formatOptions(option.options));
    } else {
      parts.push(`${tick(option.name)}:${tick(formatOptionValue(option))}`);
    }
  }
  return parts;
}

client.on(Events.InteractionCreate, (interaction) => {
  try {
    const where = interaction.channelId ? ` ở <#${interaction.channelId}>` : '';

    if (interaction.isChatInputCommand && interaction.isChatInputCommand()) {
      const opts = formatOptions(interaction.options && interaction.options.data).join(' ');
      logActivity(`⌨️ ${who(interaction.user)} dùng \`/${tick(interaction.commandName)}${opts ? ` ${opts}` : ''}\`${where}`);
      return;
    }
    if (interaction.isContextMenuCommand && interaction.isContextMenuCommand()) {
      logActivity(`⌨️ ${who(interaction.user)} dùng menu ngữ cảnh \`${tick(interaction.commandName)}\`${where}`);
      return;
    }

    const isButton = interaction.isButton && interaction.isButton();
    const isModal = interaction.isModalSubmit && interaction.isModalSubmit();
    const isSelect = interaction.isStringSelectMenu && interaction.isStringSelectMenu();
    if (!isButton && !isModal && !isSelect) return;

    const customId = clip(interaction.customId, 80);
    if (isAnonymousFeedbackId(interaction.customId)) {
      logActivity(`🕵️ Có người ${isModal ? 'gửi' : 'mở'} form góp ý ẨN DANH`);
      return;
    }
    if (isButton) logActivity(`🔘 ${who(interaction.user)} bấm nút \`${tick(customId)}\`${where}`);
    else if (isModal) logActivity(`📝 ${who(interaction.user)} gửi form \`${tick(customId)}\`${where}`);
    else logActivity(`📋 ${who(interaction.user)} chọn menu \`${tick(customId)}\` → ${tick(clip((interaction.values || []).join(', '), 100))}${where}`);
  } catch (error) {
    originalConsoleError('[ActivityLog] Lỗi ghi tương tác:', error.message);
  }
});

// ---------- Tin nhắn: lệnh mon!... của người dùng + tin/DM bot gửi ----------
client.on(Events.MessageCreate, (message) => {
  try {
    if (isLogChannel(message.channelId)) return; // KHÔNG ghi tin trong kênh log

    const isSelf = client.user && message.author && message.author.id === client.user.id;

    if (isSelf) {
      if (!message.guildId) {
        // DM: chỉ ghi gửi cho ai, KHÔNG ghi nội dung.
        const recipientId = message.channel && (message.channel.recipientId || (message.channel.recipient && message.channel.recipient.id));
        logActivity(`📨 Bot gửi DM cho ${recipientId ? `<@${recipientId}>` : 'một người dùng'}`);
        return;
      }
      const embedTitles = (message.embeds || []).map((e) => e.title).filter(Boolean).join(' | ');
      const parts = [];
      if (message.content) parts.push(clip(message.content, 120));
      if (embedTitles) parts.push(`[embed: ${clip(embedTitles, 80)}]`);
      if (message.attachments && message.attachments.size) parts.push(`[${message.attachments.size} file]`);
      if (message.components && message.components.length && !parts.length) parts.push('[tin có nút bấm]');
      logActivity(`💬 Bot gửi tin ở <#${message.channelId}>: ${esc(parts.join(' ') || '(trống)')}`);
      return;
    }

    if (message.author && !message.author.bot && /^mon!/i.test(String(message.content || '').trim())) {
      const where = message.guildId ? ` ở <#${message.channelId}>` : ' (trong DM)';
      logActivity(`⌨️ ${who(message.author)} dùng lệnh \`${tick(clip(message.content, 150))}\`${where}`);
    }
  } catch (error) {
    originalConsoleError('[ActivityLog] Lỗi ghi tin nhắn:', error.message);
  }
});

// ---------- Vote: reaction trên tin vote scrim / bang chiến ----------
function voteTargetOf(message) {
  if (scrimData.messageId && message.id === scrimData.messageId) return 'vote scrim';
  if (bcData.messageId && message.id === bcData.messageId) return 'bang chiến';
  return null;
}

function logReaction(action, reaction, user) {
  try {
    if (!user || user.bot) return;
    const target = voteTargetOf(reaction.message);
    if (!target) return;
    const emoji = reaction.emoji.name === AUTOVOTE_EMOJI ? `${AUTOVOTE_EMOJI} (đăng ký auto-vote)` : reaction.emoji.toString();
    logActivity(`🗳️ ${who(user)} ${action} ${emoji} trên tin ${target}`);
  } catch (error) {
    originalConsoleError('[ActivityLog] Lỗi ghi reaction:', error.message);
  }
}
client.on(Events.MessageReactionAdd, (reaction, user) => logReaction('thả', reaction, user));
client.on(Events.MessageReactionRemove, (reaction, user) => logReaction('gỡ', reaction, user));

client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
  try {
    if (oldMember.partial) return;
    const had = oldMember.roles.cache.has(AUTOVOTE_ROLE_ID);
    const has = newMember.roles.cache.has(AUTOVOTE_ROLE_ID);
    if (had === has) return;
    logActivity(`🎭 ${who(newMember.user)} ${has ? 'được gắn' : 'bị gỡ'} role auto-vote → bot cập nhật vote`);
  } catch (error) {
    originalConsoleError('[ActivityLog] Lỗi ghi đổi role:', error.message);
  }
});

// ---------- Voice của chính bot ----------
client.on(Events.VoiceStateUpdate, (oldState, newState) => {
  try {
    if (!client.user || newState.id !== client.user.id) return;
    if (oldState.channelId === newState.channelId) return;
    if (!oldState.channelId) logActivity(`🔊 Bot vào voice <#${newState.channelId}>`);
    else if (!newState.channelId) logActivity(`🔇 Bot rời voice <#${oldState.channelId}>`);
    else logActivity(`🔊 Bot chuyển voice <#${oldState.channelId}> → <#${newState.channelId}>`);
  } catch (error) {
    originalConsoleError('[ActivityLog] Lỗi ghi voice:', error.message);
  }
});

// ---------- Vòng đời bot ----------
client.on(Events.ShardDisconnect, (event, shardId) => logActivity(`🔌 Mất kết nối Discord (shard ${shardId}, code ${event && event.code})`));
client.on(Events.ShardResume, (shardId) => logActivity(`🔁 Đã kết nối lại Discord (shard ${shardId})`));

client.once(Events.ClientReady, (readyClient) => {
  started = true;
  for (const channelId of channelQueues.keys()) scheduleFlush(channelId, ACTIVITY_LOG_FLUSH_SECONDS * 1000); // log xếp hàng trước khi bot sẵn sàng
  logActivity(`🟢 Bot online: ${esc(readyClient.user.tag)} — đang khởi động (deploy/restart)`);
});

let shuttingDown = false;
process.on('SIGTERM', () => {
  if (shuttingDown) return;
  shuttingDown = true;
  logActivity('🔴 Bot nhận tín hiệu tắt (deploy mới / restart / hết RAM)');
  // Xả log còn lại rồi thoát — thêm handler SIGTERM làm mất cách tắt mặc định của Node nên phải tự exit.
  flushAll(3000)
    .catch(() => {})
    .finally(() => process.exit(0));
});

module.exports = { logActivity, flushAll, esc, tick, clip, clipKeep, quote, who, isLogChannel };
