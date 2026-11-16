// ===== level/notices.js — Thông báo lên cấp / chuỗi ngày =====
// - Tag KHÔNG ping (allowedMentions rỗng: hiện @tên nhưng không rung chuông, không ping role).
// - Tin thường tự xoá sau LEVEL_NOTICE_TTL_MS; tin nhận role mốc lớn (keep) thì giữ lại (vẫn không ping).
// - Gom các tin cùng kênh trong LEVEL_NOTICE_BATCH_MS thành 1 tin (nhiều người lên cấp cùng lúc -> đỡ rate limit).
// - Người đã /levelnotify tắt thì bỏ qua hẳn (không tag, không đăng).
// - Lời chúc đổi theo bậc cấp. Kiểm tra quyền Manage Messages (log 1 lần), dọn tin còn sót khi bot khởi động lại / tắt.
// Module không bao giờ ném lỗi ra ngoài.
const { PermissionFlagsBits } = require('discord.js');
const client = require('../client');
const { LEVEL_NOTICE_TTL_MS, LEVEL_NOTICE_BATCH_MS, LEVEL_ANNOUNCE_CHANNEL_ID, LEVEL_MILESTONE_CHANNEL_ID } = require('../config');

const MAX_CHUNK = 1800;
let optOuts = new Set();
const buckets = new Map(); // `${channelId}|${keep}` -> { channelId, keep, lines: [], timer }
const liveDeletes = new Map(); // messageId -> { message, timer }  (tin đang chờ xoá, để xoá sớm lúc bot tắt)
const warned = new Set();

function warnOnce(key, message) {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[level] ${message}`);
}

// ---------------------------------------------------------------- tuỳ chọn cá nhân
function setOptOuts(set) {
  if (set instanceof Set) optOuts = set; // null (đọc sheet lỗi) = giữ bản cũ
}
function isOptedOut(userId) {
  return optOuts.has(String(userId));
}
function setOptOut(userId, off) {
  if (off) optOuts.add(String(userId));
  else optOuts.delete(String(userId));
}

// ---------------------------------------------------------------- lời chúc theo bậc cấp
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const TIERS = [
  { min: 100, pool: ['👑 {u} đạt **cấp {n}** — TỐI THƯỢNG! Đỉnh cao tuyệt đối!', '👑 Tối thượng! {u} chạm **cấp {n}**, chạm tới đỉnh cao nhất!'] },
  { min: 90, pool: ['🌟 {u} vươn tới **cấp {n}** — gần chạm đỉnh!', '🌟 Sao sáng {u} đã đạt **cấp {n}**!'] },
  { min: 80, pool: ['✨ {u} bứt phá lên **cấp {n}**, quá phi thường!', '✨ {u} sải bước tới **cấp {n}**!'] },
  { min: 70, pool: ['🌠 {u} chinh phục **cấp {n}**, đáng nể!', '🌠 Huyền thoại {u} tiến lên **cấp {n}**!'] },
  { min: 60, pool: ['💫 {u} thăng lên **cấp {n}**, sao ngày một sáng!', '💫 {u} vừa đạt **cấp {n}**, vượt xa huyền thoại!'] },
  { min: 50, pool: ['🏆 {u} chạm **cấp {n}** — đỉnh cao rồi!', '🏆 Huyền thoại {u} đã đạt **cấp {n}**!'] },
  { min: 40, pool: ['👑 {u} thăng hoa lên **cấp {n}**!', '👑 Cao thủ {u} vừa đạt **cấp {n}**!'] },
  { min: 30, pool: ['💎 {u} đã vươn tới **cấp {n}**!', '💎 Quá đỉnh! {u} lên **cấp {n}**!'] },
  { min: 20, pool: ['🔥 {u} bùng cháy lên **cấp {n}**!', '🔥 {u} tăng tốc lên **cấp {n}**!'] },
  { min: 10, pool: ['⭐ {u} đã lên **cấp {n}**, quá xịn!', '⭐ {u} tiến lên **cấp {n}**!'] },
  { min: 5, pool: ['🔰 {u} đã lên **cấp {n}**, giữ vững phong độ nhé!', '🔰 {u} vừa đạt **cấp {n}**!'] },
  { min: 0, pool: ['🎉 {u} đã lên **cấp {n}**!', '✨ {u} vừa đạt **cấp {n}**!', '🌱 {u} thăng lên **cấp {n}**!'] },
];
const MILESTONE_POOL = ['🎊 {u} đạt mốc **cấp {n}**!', '🏅 Chúc mừng {u} chạm mốc **cấp {n}**!'];

function levelUpText(userId, level) {
  const tier = TIERS.find((t) => level >= t.min) || TIERS[TIERS.length - 1];
  return pick(tier.pool).replace('{u}', `<@${userId}>`).replace('{n}', String(level));
}
function milestoneText(userId, level, roleIds) {
  const roles = roleIds.map((id) => `<@&${id}>`).join(' ');
  return `${pick(MILESTONE_POOL).replace('{u}', `<@${userId}>`).replace('{n}', String(level))}\n🏅 Nhận role: ${roles}`;
}
function streakText(userId, days, bonus) {
  return `🔥 <@${userId}> đạt chuỗi **${days} ngày** hoạt động liên tiếp — thưởng **+${bonus} EXP**!`;
}

// ---------------------------------------------------------------- quyền
function botPerms(channel) {
  try {
    const me = channel.guild && channel.guild.members.me;
    return me ? channel.permissionsFor(me) : null;
  } catch (_) {
    return null;
  }
}
function canDelete(channel) {
  const perms = botPerms(channel);
  return Boolean(perms && perms.has(PermissionFlagsBits.ManageMessages));
}

// Kiểm tra các kênh thông báo cố định (gọi lúc khởi động). Thiếu quyền chỉ log, không chặn.
async function checkPermissions() {
  const ids = [...new Set([LEVEL_ANNOUNCE_CHANNEL_ID, LEVEL_MILESTONE_CHANNEL_ID].filter(Boolean))];
  for (const id of ids) {
    try {
      const channel = await client.channels.fetch(id);
      const perms = channel && botPerms(channel);
      if (!perms) {
        warnOnce(`perm:${id}`, `Không kiểm tra được quyền ở kênh thông báo ${id}.`);
        continue;
      }
      const missing = [];
      if (!perms.has(PermissionFlagsBits.ViewChannel)) missing.push('View Channel');
      if (!perms.has(PermissionFlagsBits.SendMessages)) missing.push('Send Messages');
      if (LEVEL_NOTICE_TTL_MS > 0 && !perms.has(PermissionFlagsBits.ManageMessages)) missing.push('Manage Messages (cần để tự xoá thông báo)');
      if (missing.length) warnOnce(`perm:${id}`, `Bot thiếu quyền ở kênh thông báo ${id}: ${missing.join(', ')}.`);
    } catch (error) {
      warnOnce(`perm:${id}`, `Không mở được kênh thông báo ${id}: ${error.message}`);
    }
  }
}

// ---------------------------------------------------------------- gửi + hẹn xoá
function scheduleDelete(message) {
  const timer = setTimeout(() => {
    liveDeletes.delete(message.id);
    message.delete().catch(() => {}); // đã xoá rồi / mất quyền thì bỏ qua
  }, LEVEL_NOTICE_TTL_MS);
  if (timer.unref) timer.unref();
  liveDeletes.set(message.id, { message, timer });
}

function chunkLines(lines) {
  const chunks = [];
  let cur = '';
  for (const line of lines) {
    if (cur && cur.length + line.length + 1 > MAX_CHUNK) {
      chunks.push(cur);
      cur = '';
    }
    cur = cur ? `${cur}\n${line}` : line;
  }
  if (cur) chunks.push(cur);
  return chunks;
}

async function flushBucket(key) {
  const bucket = buckets.get(key);
  if (!bucket) return;
  buckets.delete(key);
  try {
    const channel = await client.channels.fetch(bucket.channelId);
    if (!channel || typeof channel.isTextBased !== 'function' || !channel.isTextBased() || typeof channel.send !== 'function') return;
    const willDelete = !bucket.keep && LEVEL_NOTICE_TTL_MS > 0;
    let deletable = willDelete;
    if (willDelete && !canDelete(channel)) {
      deletable = false;
      warnOnce(`nodel:${channel.id}`, `Bot thiếu quyền Manage Messages ở kênh ${channel.id} — thông báo lên cấp sẽ KHÔNG tự xoá được.`);
    }
    for (const content of chunkLines(bucket.lines)) {
      const sent = await channel.send({ content, allowedMentions: { parse: [] } });
      if (deletable) scheduleDelete(sent);
    }
  } catch (error) {
    console.error('[level] Không gửi được thông báo:', error.message);
  }
}

// opts: { channelId, userId, text, keep }. Người đã tắt thông báo thì bỏ qua.
function queueNotice({ channelId, userId, text, keep = false }) {
  try {
    if (!channelId || !text || isOptedOut(userId)) return;
    const key = `${channelId}|${keep ? 1 : 0}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { channelId, keep, lines: [], timer: null };
      buckets.set(key, bucket);
      bucket.timer = setTimeout(() => flushBucket(key), LEVEL_NOTICE_BATCH_MS);
      if (bucket.timer.unref) bucket.timer.unref();
    }
    bucket.lines.push(text);
  } catch (error) {
    console.error('[level] Lỗi xếp hàng thông báo:', error.message);
  }
}

// ---------------------------------------------------------------- dọn tin sót
const TEMP_NOTICE_RE = /<@\d+>[^\n]*\*\*(cấp \d+|\d+ ngày)\*\*/;
const ROLE_MENTION_RE = /<@&\d+>/;

// Lúc khởi động: tin thông báo thường của bot ở kênh cố định đã quá hạn (do restart giữa chừng) thì xoá nốt.
async function sweepStale() {
  if (LEVEL_NOTICE_TTL_MS <= 0) return;
  const ids = [...new Set([LEVEL_ANNOUNCE_CHANNEL_ID, LEVEL_MILESTONE_CHANNEL_ID].filter(Boolean))];
  for (const id of ids) {
    try {
      const channel = await client.channels.fetch(id);
      if (!channel || !channel.isTextBased() || !channel.messages || !canDelete(channel)) continue;
      const recent = await channel.messages.fetch({ limit: 50 });
      const cutoff = Date.now() - LEVEL_NOTICE_TTL_MS;
      for (const msg of recent.values()) {
        if (!client.user || msg.author.id !== client.user.id) continue;
        if (msg.createdTimestamp > cutoff) continue;
        const text = String(msg.content || '');
        if (!TEMP_NOTICE_RE.test(text) || ROLE_MENTION_RE.test(text)) continue; // tin có role = tin mốc, giữ lại
        await msg.delete().catch(() => {});
      }
    } catch (error) {
      console.error(`[level] Không dọn được thông báo cũ ở kênh ${id}:`, error.message);
    }
  }
}

// Lúc bot sắp tắt: gửi nốt hàng chờ rồi xoá luôn các tin đang chờ xoá (để không bị sót lại).
async function shutdown(timeoutMs = 3000) {
  try {
    const work = (async () => {
      const keys = [...buckets.keys()];
      for (const key of keys) {
        const b = buckets.get(key);
        if (b && b.timer) clearTimeout(b.timer);
        if (b && b.keep) await flushBucket(key);
        else buckets.delete(key); // tin tạm chưa kịp gửi: bỏ luôn
      }
      await Promise.all(
        [...liveDeletes.values()].map(({ message, timer }) => {
          clearTimeout(timer);
          return message.delete().catch(() => {});
        })
      );
      liveDeletes.clear();
    })();
    await Promise.race([work, new Promise((resolve) => setTimeout(resolve, timeoutMs))]);
  } catch (_) {
    /* bỏ qua */
  }
}

module.exports = {
  setOptOuts,
  setOptOut,
  isOptedOut,
  levelUpText,
  milestoneText,
  streakText,
  queueNotice,
  checkPermissions,
  sweepStale,
  shutdown,
};
