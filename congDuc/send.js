// ===== congDuc/send.js — gửi tin IM LẶNG (không ping, không thông báo) cho mọi tin của tính năng Công Đức =====
// Mọi chỗ module Công Đức gửi/sửa tin đều đi qua đây. Không dùng `content: '@…'` thô ở bất kỳ đâu.
let SUPPRESS = 4096; // MessageFlags.SuppressNotifications
try {
  const { MessageFlags } = require('discord.js');
  if (MessageFlags && MessageFlags.SuppressNotifications) SUPPRESS = MessageFlags.SuppressNotifications;
} catch { /* chạy test thuần không cần discord.js */ }

const NO_MENTIONS = Object.freeze({ parse: [] });

// Chuẩn hoá payload: chuỗi -> { content }, luôn thêm SuppressNotifications + allowedMentions.parse = [].
function silentPayload(payload) {
  const base = typeof payload === 'string' ? { content: payload } : { ...(payload || {}) };
  const flags = base.flags;
  let bits = 0;
  if (typeof flags === 'number') bits = flags;
  else if (flags && typeof flags.bitfield === 'number') bits = flags.bitfield;
  else if (Array.isArray(flags)) bits = flags.reduce((a, f) => a | (typeof f === 'number' ? f : 0), 0);
  base.flags = bits | SUPPRESS;
  base.allowedMentions = { ...NO_MENTIONS };
  return base;
}

// Trả lời tương tác (ephemeral không ping sẵn) — chỉ ép allowedMentions, không đổi flags (tránh làm mất Ephemeral của người gọi).
function silentReply(payload) {
  const base = typeof payload === 'string' ? { content: payload } : { ...(payload || {}) };
  base.allowedMentions = { ...NO_MENTIONS };
  return base;
}

async function sendSilent(channel, payload) {
  return channel.send(silentPayload(payload));
}

module.exports = { sendSilent, silentPayload, silentReply, SUPPRESS_NOTIFICATIONS: SUPPRESS };
