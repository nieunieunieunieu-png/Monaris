// ===== Cảnh báo riêng cho hành vi đáng chú ý (gửi ngay vào MEMBER_ALERT_CHANNEL_ID, không gom lô) =====
// Chỉ xét tin NGƯỜI GỬI TỰ XOÁ / TỰ SỬA (tin bị mod hoặc bot xoá không cảnh báo):
//   🗑️ xoá tin dài (>= MEMBER_ALERT_MIN_CHARS ký tự)
//   🗑️ xoá liên tiếp (>= MEMBER_ALERT_DELETE_COUNT tin trong MEMBER_ALERT_WINDOW_MINUTES phút)
//   ✏️ sửa gần như toàn bộ nội dung (đổi nghĩa) của tin dài
//   🧹 xoá hàng loạt (>= 5 tin một lần)
// Mỗi (người, loại) chỉ cảnh báo lại sau MEMBER_ALERT_COOLDOWN_MINUTES phút. Cấu hình: config/activityLog.js.
const { EmbedBuilder } = require('discord.js');
const client = require('../client');
const {
  ACTIVITY_LOG_ENABLED,
  MEMBER_ALERT_ENABLED,
  MEMBER_ALERT_CHANNEL_ID,
  MEMBER_ALERT_PING_ROLE_ID,
  MEMBER_ALERT_MIN_CHARS,
  MEMBER_ALERT_DELETE_COUNT,
  MEMBER_ALERT_WINDOW_MINUTES,
  MEMBER_ALERT_COOLDOWN_MINUTES,
} = require('../config');

const deletions = new Map(); // userId -> [timestamps]
const lastAlert = new Map(); // `${userId}|${kind}` -> ts

function enabled() {
  return ACTIVITY_LOG_ENABLED && MEMBER_ALERT_ENABLED && Boolean(MEMBER_ALERT_CHANNEL_ID);
}

function cooledDown(userId, kind) {
  const key = `${userId}|${kind}`;
  const now = Date.now();
  if (now - (lastAlert.get(key) || 0) < MEMBER_ALERT_COOLDOWN_MINUTES * 60 * 1000) return false;
  lastAlert.set(key, now);
  if (lastAlert.size > 500) {
    for (const [k, ts] of lastAlert) if (now - ts > MEMBER_ALERT_COOLDOWN_MINUTES * 60 * 1000) lastAlert.delete(k);
  }
  return true;
}

const { quote } = require('./index');

async function sendAlert(title, description) {
  try {
    const channel = client.channels.cache.get(MEMBER_ALERT_CHANNEL_ID) || (await client.channels.fetch(MEMBER_ALERT_CHANNEL_ID));
    const embed = new EmbedBuilder().setColor(0xe74c3c).setTitle(title).setDescription(String(description).slice(0, 3900)).setTimestamp();
    const payload = { embeds: [embed], allowedMentions: { parse: [] } };
    if (MEMBER_ALERT_PING_ROLE_ID) {
      payload.content = `<@&${MEMBER_ALERT_PING_ROLE_ID}>`;
      payload.allowedMentions = { parse: [], roles: [MEMBER_ALERT_PING_ROLE_ID] };
    }
    await channel.send(payload);
  } catch (error) {
    console.error('[ActivityLog] Không gửi được cảnh báo:', error.message);
  }
}

// e: { authorId, authorName, content, channelId, messageId, link }  — gọi khi người gửi TỰ xoá tin.
function onSelfDelete(e) {
  try {
    if (!enabled() || !e || !e.authorId) return;
    const now = Date.now();
    const windowMs = MEMBER_ALERT_WINDOW_MINUTES * 60 * 1000;
    const list = (deletions.get(e.authorId) || []).filter((t) => now - t < windowMs);
    list.push(now);
    deletions.set(e.authorId, list);
    if (deletions.size > 500) for (const [id, l] of deletions) if (!l.some((t) => now - t < windowMs)) deletions.delete(id);

    const who = `<@${e.authorId}> (${e.authorName || e.authorId})`;
    const text = String(e.content || '');
    if (text.length >= MEMBER_ALERT_MIN_CHARS && cooledDown(e.authorId, 'dai')) {
      sendAlert('🗑️ Xoá tin dài', `${who} tự xoá 1 tin dài ${text.length} ký tự ở <#${e.channelId}>:\n${quote(text, 1500)}\n${e.link ? `[🔗 Xem tin](${e.link})` : ''}`);
    }
    if (list.length >= MEMBER_ALERT_DELETE_COUNT && cooledDown(e.authorId, 'lien_tiep')) {
      sendAlert('🗑️ Xoá tin liên tiếp', `${who} vừa tự xoá **${list.length} tin** trong ${MEMBER_ALERT_WINDOW_MINUTES} phút (tin mới nhất ở <#${e.channelId}>):\n${quote(text, 800, '(không có nội dung)')}\nXem đủ bằng \`/logtim nguoi:@người loai:Xoá\`.`);
    }
  } catch (error) {
    console.error('[ActivityLog] Lỗi cảnh báo xoá tin:', error.message);
  }
}

// Tỉ lệ từ của bản cũ còn giữ trong bản mới (0..1). Thấp = sửa gần như viết lại.
function wordOverlap(before, after) {
  const a = new Set(String(before).toLowerCase().split(/\s+/).filter(Boolean));
  const b = new Set(String(after).toLowerCase().split(/\s+/).filter(Boolean));
  if (!a.size) return 1;
  let same = 0;
  for (const w of a) if (b.has(w)) same += 1;
  return same / a.size;
}

// e: { authorId, authorName, before, after, channelId, link }
function onEdit(e) {
  try {
    if (!enabled() || !e || !e.authorId) return;
    const before = String(e.before || '');
    if (before.length < Math.min(40, MEMBER_ALERT_MIN_CHARS)) return;
    if (wordOverlap(before, e.after) >= 0.3) return;
    if (!cooledDown(e.authorId, 'sua')) return;
    sendAlert(
      '✏️ Sửa gần như toàn bộ nội dung',
      `<@${e.authorId}> (${e.authorName || e.authorId}) sửa tin ở <#${e.channelId}>:\n**Trước:**\n${quote(before, 1200)}\n**Sau:**\n${quote(e.after, 1200, '(trống)')}\n${e.link ? `[🔗 Xem tin](${e.link})` : ''}`
    );
  } catch (error) {
    console.error('[ActivityLog] Lỗi cảnh báo sửa tin:', error.message);
  }
}

function onBulkDelete(channelId, count) {
  try {
    if (!enabled() || count < 5) return;
    if (!cooledDown(`bulk_${channelId}`, 'hang_loat')) return;
    sendAlert('🧹 Xoá hàng loạt', `**${count} tin** vừa bị xoá cùng lúc ở <#${channelId}>. Nguyên văn nằm ở kênh log / tab "Nhật Ký Tin Nhắn" (nếu bot đã lưu trước đó).`);
  } catch (error) {
    console.error('[ActivityLog] Lỗi cảnh báo xoá hàng loạt:', error.message);
  }
}

module.exports = { onSelfDelete, onEdit, onBulkDelete, wordOverlap };
