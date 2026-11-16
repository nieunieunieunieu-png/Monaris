// ===== Chống spam tin nhắn giống nhau (chỉ ở kênh ANTISPAM_CHANNEL_IDS) =====
// Luồng cho mỗi nội dung (đã chuẩn hoá) trong 1 kênh:
//   - Tin giống nhau thứ 2 trong vòng ANTISPAM_WINDOW_MINUTES phút (của 1 người hoặc nhiều người)
//     -> gửi cảnh báo "Phát hiện spam tin nhắn..." + ghi sheet những người đã gửi.
//   - Sau cảnh báo, ANTISPAM_GRACE_SECONDS (3) giây "thả" (tin giống nhau trong lúc này không tính).
//   - Hết thời gian thả, từ tin tương tự thứ 3 trở đi (còn trong cửa sổ 5 phút) -> timeout người gửi
//     ANTISPAM_TIMEOUT_MINUTES phút + ghi sheet.
//   - mon!spam [hôm nay | 7 | 30] : tổng kết người spam từ tab "Spam Chat" (Bông).
// Chỉ lắng nghe tin mới; không xoá tin. Mọi lỗi được bắt, không làm crash bot.

const { Events } = require('discord.js');
const client = require('../client');
const {
  ANTISPAM_ENABLED,
  ANTISPAM_WINDOW_MINUTES,
  ANTISPAM_GRACE_SECONDS,
  ANTISPAM_TIMEOUT_MINUTES,
  ANTISPAM_MIN_LENGTH,
  ANTISPAM_CHANNEL_IDS,
  ANTISPAM_EXEMPT_USER_IDS,
  ANTISPAM_FLUSH_SECONDS,
} = require('../config');
const { ensureAntiSpamSheetExists, appendSpamRows, readSpamRows } = require('../googleSheets/antiSpamSheet');

const WINDOW_MS = ANTISPAM_WINDOW_MINUTES * 60 * 1000;
const GRACE_MS = ANTISPAM_GRACE_SECONDS * 1000;
const TIMEOUT_MS = ANTISPAM_TIMEOUT_MINUTES * 60 * 1000;

// key = channelId + '|' + nội dung chuẩn hoá -> { entries: [{userId, name, at}], warned: bool, graceUntil: ms }
const groups = new Map();

function normalizeContent(text) {
  return String(text || '')
    .replace(/[​-‏⁠﻿]/g, '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// Bỏ emote (custom <:ten:id> / <a:ten:id>, emoji unicode, :shortcode:) rồi chỉ còn chữ/số.
// Tin toàn emote (hoặc quá ngắn) không bị tính spam.
const EMOTE_RE = /<a?:\w+:\d+>|:[a-z0-9_]+:|[\p{Extended_Pictographic}\p{Emoji_Presentation}\u200d\ufe0f\u20e3\u{1F3FB}-\u{1F3FF}\u{1F1E6}-\u{1F1FF}]/giu;
function lettersOnly(text) {
  return String(text || '').replace(EMOTE_RE, '').replace(/[^\p{L}\p{N}]+/gu, '');
}

function vnTimestamp(ms = Date.now()) {
  const d = new Date(ms + 7 * 3600 * 1000);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
}

// ---- Ghi sheet theo lô ----
let pendingRows = [];
let flushTimer = null;
function queueRow(row) {
  pendingRows.push(row);
  if (!flushTimer) flushTimer = setTimeout(flushRows, ANTISPAM_FLUSH_SECONDS * 1000);
}
async function flushRows() {
  flushTimer = null;
  if (!pendingRows.length) return;
  const rows = pendingRows;
  pendingRows = [];
  try {
    await appendSpamRows(rows);
  } catch (error) {
    console.error('[AntiSpam] Không ghi được sheet, giữ lại để ghi lần sau:', error.message);
    pendingRows = rows.concat(pendingRows).slice(-500);
    if (!flushTimer) flushTimer = setTimeout(flushRows, 60 * 1000);
  }
}

function shortContent(text) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  return t.length > 200 ? `${t.slice(0, 200)}…` : t;
}

function pruneGroups(now) {
  for (const [key, group] of groups) {
    group.entries = group.entries.filter((e) => now - e.at <= WINDOW_MS);
    if (group.entries.length < 2) group.warned = false;
    if (!group.entries.length && now > group.graceUntil) groups.delete(key);
  }
}
setInterval(() => pruneGroups(Date.now()), 60 * 1000).unref();

async function handleSpam(message) {
  if (!ANTISPAM_ENABLED) return;
  if (!message.guild || !ANTISPAM_CHANNEL_IDS.includes(message.channelId)) return;
  if (!message.author || message.author.bot || message.webhookId) return;
  if (ANTISPAM_EXEMPT_USER_IDS.includes(message.author.id)) return;

  const text = normalizeContent(message.content);
  if (lettersOnly(text).length < ANTISPAM_MIN_LENGTH) return; // toàn emote / quá ngắn -> bỏ qua
  if (text.startsWith('mon!')) return; // lệnh bot không tính

  const now = Date.now();
  const key = `${message.channelId}|${text}`;
  let group = groups.get(key);
  if (!group) {
    group = { entries: [], warned: false, graceUntil: 0 };
    groups.set(key, group);
  }
  group.entries = group.entries.filter((e) => now - e.at <= WINDOW_MS);
  if (group.entries.length < 2) group.warned = false;

  // Đang trong 3s "thả" sau cảnh báo: không tính tin này.
  if (now < group.graceUntil) return;

  const name = (message.member && message.member.displayName) || message.author.username;
  group.entries.push({ userId: message.author.id, name, at: now });
  const count = group.entries.length;
  const channelLabel = `#${message.channel && message.channel.name ? message.channel.name : message.channelId}`;
  const content = shortContent(message.content);

  if (count === 2 && !group.warned) {
    group.warned = true;
    group.graceUntil = now + GRACE_MS; // đặt trước khi gửi để tin đến ngay sau đó không bị tính
    // Người gửi đầu tiên = người bị copy (nếu người thứ 2 là người khác); người thứ 2 = người spam.
    const [first, second] = group.entries;
    if (first.userId === second.userId) {
      queueRow([vnTimestamp(second.at), second.userId, second.name, channelLabel, 'CẢNH BÁO', 'Tự lặp lại tin', content]);
    } else {
      queueRow([vnTimestamp(first.at), first.userId, first.name, channelLabel, 'BỊ COPY', `Bị ${second.name} gửi lại y hệt`, content]);
      queueRow([vnTimestamp(second.at), second.userId, second.name, channelLabel, 'CẢNH BÁO', `Gửi lại tin của ${first.name}`, content]);
    }
    try {
      await message.channel.send({
        content:
          `⚠️ Phát hiện spam tin nhắn. Từ người thứ 3 nhắn tin tương tự có thể bị cấm chat ${ANTISPAM_TIMEOUT_MINUTES} phút.`,
        allowedMentions: { parse: [] },
      });
    } catch (error) {
      console.error('[AntiSpam] Không gửi được cảnh báo:', error.message);
    }
    // Tính 10s thả từ lúc gửi xong cảnh báo (gửi có thể chậm).
    group.graceUntil = Date.now() + GRACE_MS;
    return;
  }

  if (count >= 3) {
    let result;
    try {
      const member = message.member || (await message.guild.members.fetch(message.author.id));
      if (!member.moderatable) {
        result = 'Không cấm được (bot thiếu quyền / role thấp hơn / là admin)';
      } else {
        await member.timeout(TIMEOUT_MS, `Spam tin nhắn giống nhau (${channelLabel})`);
        result = `Đã cấm chat ${ANTISPAM_TIMEOUT_MINUTES} phút`;
      }
    } catch (error) {
      result = `Không cấm được: ${String(error.message).slice(0, 120)}`;
    }
    queueRow([vnTimestamp(now), message.author.id, name, channelLabel, 'CẤM CHAT', result, content]);
    if (result.startsWith('Đã cấm')) {
      await message.channel
        .send({
          content: `🔇 ${name} bị cấm chat ${ANTISPAM_TIMEOUT_MINUTES} phút vì spam tin nhắn.`,
          allowedMentions: { parse: [] },
        })
        .catch(() => {});
    }
  }
}

client.on(Events.MessageCreate, (message) => {
  handleSpam(message).catch((error) => console.error('[AntiSpam] Lỗi xử lý tin nhắn:', error.message));
});

// ---- Tổng kết ----
// range: số ngày (1 = hôm nay theo giờ VN). Trả về nội dung tin trả lời.
async function buildSummary(days) {
  await flushRows();
  const rows = await readSpamRows();
  const vnNow = new Date(Date.now() + 7 * 3600 * 1000);
  const startVn = Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate()) - (days - 1) * 86400000;
  const stats = new Map();
  for (const row of rows) {
    const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(String(row[0] || ''));
    if (!m) continue;
    if (Date.UTC(+m[1], +m[2] - 1, +m[3]) < startVn) continue;
    const id = String(row[1] || '');
    const entry = stats.get(id) || { id, name: row[2] || id, warn: 0, ban: 0, copied: 0 };
    if (row[4] === 'CẤM CHAT') entry.ban += 1;
    else if (row[4] === 'BỊ COPY') entry.copied += 1;
    else entry.warn += 1;
    stats.set(id, entry);
  }
  const label = days === 1 ? 'hôm nay' : `${days} ngày gần đây`;
  const all = [...stats.values()];
  const spammers = all.filter((s) => s.warn || s.ban);
  const victims = all.filter((s) => s.copied);
  if (!spammers.length && !victims.length) return `✅ Không ghi nhận ai spam ${label}.`;
  const list = spammers.sort((a, b) => b.ban - a.ban || b.warn - a.warn);
  const lines = list.slice(0, 20).map((s, i) => `${i + 1}. ${s.name} — cảnh báo **${s.warn}**, bị cấm chat **${s.ban}**`);
  const copied = victims.sort((a, b) => b.copied - a.copied).slice(0, 10).map((s) => `${s.name} (${s.copied})`);
  return (
    `🚨 **Tổng kết spam ${label}**: ${list.length} người spam\n${lines.join('\n') || '—'}` +
    `${copied.length ? `\n📋 Người bị copy tin: ${copied.join(', ')}` : ''}`
  ).slice(0, 1900);
}

async function startAntiSpam(authClient) {
  try {
    await ensureAntiSpamSheetExists(authClient);
  } catch (error) {
    console.error('[AntiSpam] Không tạo/kiểm tra được tab "Spam Chat":', error.message);
  }
  console.log(
    `[AntiSpam] ${ANTISPAM_ENABLED ? 'Đang bật' : 'ĐANG TẮT'} — kênh ${ANTISPAM_CHANNEL_IDS.join(', ') || '(chưa cấu hình)'}.`
  );
}

module.exports = { startAntiSpam, buildSummary, normalizeContent };
