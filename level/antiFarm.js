// ===== level/antiFarm.js — chống farm EXP (chat lặp / thả-gỡ reaction / ra vào voice liên tục) =====
// Chỉ TRẢ LỜI "có nên bỏ EXP không" — level/index.js vẫn đếm cột như cũ, chỉ không cộng EXP. Cấu hình: config/level.js (LEVEL_ANTIFARM_*).
// Mỗi người bị chặn lần đầu trong 30 phút được ghi 1 dòng "🚫 [chống farm]" vào kênh log hoạt động của bot.
const {
  LEVEL_ANTIFARM_ENABLED,
  LEVEL_ANTIFARM_CHAT_PER_HOUR,
  LEVEL_ANTIFARM_REACTION_PER_HOUR,
  LEVEL_ANTIFARM_VOICE_JOINS,
  LEVEL_ANTIFARM_VOICE_WINDOW_MINUTES,
  LEVEL_ANTIFARM_VOICE_BLOCK_MINUTES,
} = require('../config');

const HOUR = 60 * 60 * 1000;
const chatHits = new Map(); // userId -> [timestamps tin đã được EXP]
const recentTexts = new Map(); // userId -> [3 tin chuẩn hoá gần nhất]
const reactionHits = new Map(); // userId -> [timestamps]
const reactedMessages = new Map(); // `${userId}|${messageId}` -> ts
const voiceJoins = new Map(); // userId -> [timestamps]
const voiceBlockedUntil = new Map(); // userId -> ts
const warnedAt = new Map(); // `${userId}|${kind}` -> ts

function warnOnce(userId, kind, text) {
  try {
    const key = `${userId}|${kind}`;
    const now = Date.now();
    if (now - (warnedAt.get(key) || 0) < 30 * 60 * 1000) return;
    warnedAt.set(key, now);
    if (warnedAt.size > 500) for (const [k, ts] of warnedAt) if (now - ts > 30 * 60 * 1000) warnedAt.delete(k);
    require('../activityLog').logActivity(`🚫 [chống farm] <@${userId}> ${text}`);
  } catch (error) {
    /* log lỗi thì bỏ qua */
  }
}

function pruneList(map, userId, windowMs, now) {
  const list = (map.get(userId) || []).filter((t) => now - t < windowMs);
  map.set(userId, list);
  return list;
}

function normalize(text) {
  return String(text || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
}

// Trả về lý do (chuỗi) nếu tin này KHÔNG nên có EXP, ngược lại '' (và tính nó vào trần giờ).
// opts.skipHourlyCap: chat trong kênh thảo luận — không bị trần tin/giờ (vẫn lọc lặp/trùng và không đếm vào trần giờ của chat thường).
function checkChat(userId, plainText, now = Date.now(), opts = {}) {
  if (!LEVEL_ANTIFARM_ENABLED) return '';
  const norm = normalize(plainText);
  if (norm.length >= 4 && new Set(norm).size / norm.length <= 0.25) {
    warnOnce(userId, 'chat_lap', 'gửi tin lặp ký tự — không tính EXP');
    return 'lặp ký tự';
  }
  const recent = recentTexts.get(userId) || [];
  if (norm && recent.includes(norm)) {
    warnOnce(userId, 'chat_trung', 'gửi tin giống các tin gần đây — không tính EXP');
    return 'trùng tin gần đây';
  }
  if (norm) {
    recent.push(norm);
    if (recent.length > 3) recent.shift();
    recentTexts.set(userId, recent);
    if (recentTexts.size > 3000) recentTexts.delete(recentTexts.keys().next().value);
  }
  if (opts.skipHourlyCap) return '';
  const hits = pruneList(chatHits, userId, HOUR, now);
  if (hits.length >= LEVEL_ANTIFARM_CHAT_PER_HOUR) {
    warnOnce(userId, 'chat_tran', `đã gửi quá ${LEVEL_ANTIFARM_CHAT_PER_HOUR} tin trong 1 giờ — tạm không tính EXP chat`);
    return 'vượt trần giờ';
  }
  hits.push(now);
  return '';
}

function checkReaction(userId, messageId, now = Date.now()) {
  if (!LEVEL_ANTIFARM_ENABLED) return '';
  const key = `${userId}|${messageId}`;
  if (reactedMessages.has(key) && now - reactedMessages.get(key) < 24 * HOUR) {
    warnOnce(userId, 'react_lap', 'thả-gỡ-thả lại reaction cùng 1 tin — không tính EXP');
    return 'reaction lặp trên cùng tin';
  }
  const hits = pruneList(reactionHits, userId, HOUR, now);
  if (hits.length >= LEVEL_ANTIFARM_REACTION_PER_HOUR) {
    warnOnce(userId, 'react_tran', `đã thả quá ${LEVEL_ANTIFARM_REACTION_PER_HOUR} reaction trong 1 giờ — tạm không tính EXP reaction`);
    return 'vượt trần giờ';
  }
  hits.push(now);
  reactedMessages.set(key, now);
  if (reactedMessages.size > 5000) {
    for (const [k, ts] of reactedMessages) if (now - ts > 24 * HOUR) reactedMessages.delete(k);
    while (reactedMessages.size > 5000) reactedMessages.delete(reactedMessages.keys().next().value);
  }
  return '';
}

// Gọi khi 1 người VÀO voice (từ ngoài vào, không tính đổi kênh).
function noteVoiceJoin(userId, now = Date.now()) {
  if (!LEVEL_ANTIFARM_ENABLED) return;
  const hits = pruneList(voiceJoins, userId, LEVEL_ANTIFARM_VOICE_WINDOW_MINUTES * 60 * 1000, now);
  hits.push(now);
  if (hits.length >= LEVEL_ANTIFARM_VOICE_JOINS && !(voiceBlockedUntil.get(userId) > now)) {
    voiceBlockedUntil.set(userId, now + LEVEL_ANTIFARM_VOICE_BLOCK_MINUTES * 60 * 1000);
    voiceJoins.set(userId, []);
    warnOnce(userId, 'voice_churn', `ra vào voice ${hits.length} lần trong ${LEVEL_ANTIFARM_VOICE_WINDOW_MINUTES} phút — mất EXP voice ${LEVEL_ANTIFARM_VOICE_BLOCK_MINUTES} phút`);
  }
}

function voiceBlocked(userId, now = Date.now()) {
  if (!LEVEL_ANTIFARM_ENABLED) return false;
  const until = voiceBlockedUntil.get(userId);
  if (!until) return false;
  if (until <= now) {
    voiceBlockedUntil.delete(userId);
    return false;
  }
  return true;
}

module.exports = { checkChat, checkReaction, noteVoiceJoin, voiceBlocked, normalize };
