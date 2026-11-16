const { Events } = require('discord.js');
const client = require('../client');
const { TEMP_VOICE_LOBBY_CHANNEL_ID, VOICE_HOME_CHANNEL_ID } = require('../config');
const { VOICE_GREET_USER_IDS, VOICE_GREET_MESSAGES, buildGenericGreeting, buildMeditationGreeting } = require('./voiceGreetData');

// Chống spam khi 1 người ra/vào voice liên tục: mỗi người tối đa 1 lời chào / 60 giây.
const GREET_COOLDOWN_MS = 60 * 1000;
const lastGreetAt = new Map();

// BẤT KỲ AI JOIN vào 1 voice channel (kể cả khi chuyển từ kênh khác sang) bot
// đều gửi 1 câu chào ngắn vào đúng ô chat (text-in-voice) của kênh đó:
//  - user nằm trong VOICE_GREET_USER_IDS: câu chào riêng (VOICE_GREET_MESSAGES) như cũ.
//  - vào phòng thiền (VOICE_HOME_CHANNEL_ID): lời chào Phật pháp (buildMeditationGreeting) cho TẤT CẢ mọi người.
//  - mọi người còn lại: "Chào <tên> vào <tên kênh>, <lời chúc ngắn>" tự ghép
//    ngẫu nhiên (buildGenericGreeting, phần chữ tự do <= 20 từ).
client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  const member = newState.member;
  if (!member || member.user.bot) return;
  if (!require('../features').isEnabled('chaovoice')) return; // công tắc web "Chào khi vào voice"

  // Chỉ trigger khi thực sự VỪA VÀO 1 channel mới (channel thay đổi và
  // channel mới khác null) — bỏ qua mute/deafen/... không đổi channel,
  // và bỏ qua trường hợp rời voice (newState.channel === null).
  if (oldState.channelId === newState.channelId) return;
  if (!newState.channel) return;

  // Kênh cổng "tạo phòng voice" (tempVoice) cũng không chào — người đó sẽ được kéo sang phòng riêng ngay.
  if (newState.channelId === TEMP_VOICE_LOBBY_CHANNEL_ID) return;

  // Kênh AFK thì không chào (không ai nhìn chat ở đó).
  if (newState.guild.afkChannelId && newState.channelId === newState.guild.afkChannelId) return;

  const now = Date.now();
  if (now - (lastGreetAt.get(member.id) || 0) < GREET_COOLDOWN_MS) return;
  lastGreetAt.set(member.id, now);
  if (lastGreetAt.size > 500) {
    for (const [id, t] of lastGreetAt) if (now - t > GREET_COOLDOWN_MS) lastGreetAt.delete(id);
  }

  // Chỉ hiện TÊN, không dùng <@id> để tránh ping/làm phiền người đó.
  const displayName = member.displayName || member.user.username;

  let greeting;
  if (VOICE_HOME_CHANNEL_ID && newState.channelId === VOICE_HOME_CHANNEL_ID) {
    // Phòng thiền (phòng bot treo): ai vào cũng nhận lời chào Phật pháp, thay cho câu chào riêng/chung.
    greeting = buildMeditationGreeting(displayName, newState.channel.name);
  } else if (VOICE_GREET_USER_IDS.includes(member.id)) {
    const messages = Array.isArray(VOICE_GREET_MESSAGES) && VOICE_GREET_MESSAGES.length > 0
      ? VOICE_GREET_MESSAGES
      : ['Chào {mention}! 👋'];
    const template = messages[Math.floor(Math.random() * messages.length)];
    greeting = template.replace('{mention}', displayName);
  } else {
    greeting = buildGenericGreeting(displayName, newState.channel.name);
  }

  try {
    await newState.channel.send(greeting);
  } catch (error) {
    console.error(`Failed to send voice greeting to user ${member.id}:`, error.message);
  }
});