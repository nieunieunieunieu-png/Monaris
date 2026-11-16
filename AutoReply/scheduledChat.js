// ===== AutoReply: chat theo lịch =====
// Chào buổi sáng + mốc PvP (checkScheduledAutoChat). Báo tình hình vote scrim đã chuyển sang bot BANG (voteStatus/autoChat.js).

const client = require('../client');
const { reminderState } = require('../state');
const { getVnNow, getDateKey } = require('../utils/time');
const {
  IDLE_CHAT_CHANNEL_ID,
  PVP_REMINDERS_ENABLED,
  MORNING_GREETING_HOUR,
  MORNING_GREETING_MINUTE,
  PVP_OPEN_HOUR,
  PVP_OPEN_MINUTE,
  PVP_OPEN_MESSAGE,
  PVP_PEAK_HOUR,
  PVP_PEAK_MINUTE,
  PVP_PEAK_MESSAGE,
} = require('../config');
const { askGemini } = require('./aiClient');

// --- Auto chat theo giờ cố định: chào buổi sáng (AI) + 2 mốc nhắc PvP ---
// Gửi vào CÙNG kênh với idle chat (IDLE_CHAT_CHANNEL_ID). Guard bằng
// reminderState.lastXDate (giống hệt pattern reminders/scheduler.js) để
// không gửi trùng trong cùng 1 ngày nếu tick nhiều lần hoặc bot restart
// đúng lúc gần mốc giờ đó.
async function sendAutoChatMessage(text) {
  try {
    const channel = await client.channels.fetch(IDLE_CHAT_CHANNEL_ID);
    // Gửi thẳng string, KHÔNG kèm allowedMentions/role gì — đảm bảo không
    // mention ai theo đúng yêu cầu, chỉ đơn thuần là 1 tin nhắn chat.
    await channel.send(text);
  } catch (error) {
    console.error('Không thể gửi tin nhắn auto chat theo giờ:', error.message);
  }
}

// Được gọi mỗi phút (setInterval trong index.js), y hệt cơ chế checkReminders.
async function checkScheduledAutoChat() {
  if (!IDLE_CHAT_CHANNEL_ID || !require('../features').isEnabled('chatlich')) return; // công tắc web "Chat theo lịch" (chào sáng + mốc PvP)
  const vnNow = getVnNow();
  const hours = vnNow.getHours();
  const minutes = vnNow.getMinutes();
  const todayKey = getDateKey(vnNow);

  // Chào buổi sáng — mỗi ngày, câu chào do AI tạo (không dùng preset cố
  // định) để mỗi hôm 1 khác, đúng tính cách bot.
  if (
    hours === MORNING_GREETING_HOUR &&
    minutes === MORNING_GREETING_MINUTE &&
    reminderState.lastMorningGreetingDate !== todayKey
  ) {
    reminderState.lastMorningGreetingDate = todayKey;
    try {
      const greeting = await askGemini(
        'Viết 1 câu chào buổi sáng ngắn gọn, vui vẻ, đúng tính cách của bạn, gửi cho ' +
          'cả bang lúc 7 giờ sáng. Chỉ 1-2 câu ngắn, không dài dòng, không dùng markdown.'
      );
      await sendAutoChatMessage(greeting || 'Chào buổi sáng cả bang ơi, dậy đi cày/đánh PvP thôi! ☀️');
    } catch (error) {
      console.error('Lỗi khi tạo câu chào buổi sáng AI:', error.message);
    }
  }

  // Nhắc Thí Kiếm / Luận Võ mở cửa — nội dung cố định, không qua AI.
  if (
    PVP_REMINDERS_ENABLED && hours === PVP_OPEN_HOUR &&
    minutes === PVP_OPEN_MINUTE &&
    reminderState.lastPvpOpenReminderDate !== todayKey
  ) {
    reminderState.lastPvpOpenReminderDate = todayKey;
    await sendAutoChatMessage(PVP_OPEN_MESSAGE);
  }

  // Nhắc Cao điểm PvP — nội dung cố định, không qua AI.
  if (
    PVP_REMINDERS_ENABLED && hours === PVP_PEAK_HOUR &&
    minutes === PVP_PEAK_MINUTE &&
    reminderState.lastPvpPeakReminderDate !== todayKey
  ) {
    reminderState.lastPvpPeakReminderDate = todayKey;
    await sendAutoChatMessage(PVP_PEAK_MESSAGE);
  }
}

module.exports = {
  checkScheduledAutoChat,
};
