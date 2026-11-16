// Bot TREO CỐ ĐỊNH trong 1 phòng voice (VOICE_HOME_CHANNEL_ID, config/core.js)
// thay cho kiểu "đi theo người" cũ.
//
// Cách hoạt động (nhẹ RAM, không tạo vòng lặp rò rỉ):
//   - Lúc bot lên (ClientReady) -> vào phòng.
//   - Nếu bot bị đá/kéo sang phòng khác/rớt kết nối (VoiceStateUpdate của CHÍNH
//     bot, hoặc connection bị destroy) -> hẹn giờ vào lại.
//   - Thêm 1 vòng kiểm tra mỗi 60 giây làm lưới an toàn (phòng khi Discord không
//     bắn event). Chỉ MỘT timer duy nhất tồn tại tại 1 thời điểm, và có cờ `busy`
//     nên không bao giờ có 2 lần join chạy chồng nhau.
//   - Vào lỗi liên tiếp -> giãn dần (5s, 10s, 20s ... tối đa 30 giây), không spam
//     Discord, không dồn request.
const { Events } = require('discord.js');
const { VoiceConnectionStatus, getVoiceConnection } = require('@discordjs/voice');
const client = require('../client');
const { VOICE_HOME_CHANNEL_ID } = require('../config');
const { connectToChannel, disconnectGuild } = require('../commands/voiceJoin');
const { getVnNow, getDateKey } = require('../utils/time');

const CHECK_INTERVAL_MS = 60_000;
const BACKOFF_BASE_MS = 5_000;
const BACKOFF_MAX_MS = 30_000; // luôn thử lại nhanh để bot giữ chỗ trong phòng
const RESET_HOUR = 3; // 3h sáng giờ VN: reset kết nối voice mỗi ngày
const RESET_MINUTE = 0;

let timer = null;
let busy = false;
let failCount = 0;

async function ensureHome() {
  const channel = await client.channels.fetch(VOICE_HOME_CHANNEL_ID); // lấy từ cache, không gọi API nếu đã có
  if (!channel || !channel.isVoiceBased()) {
    throw new Error(`VOICE_HOME_CHANNEL_ID (${VOICE_HOME_CHANNEL_ID}) không phải kênh voice`);
  }

  const connection = getVoiceConnection(channel.guild.id);
  if (
    connection &&
    connection.state.status === VoiceConnectionStatus.Ready &&
    connection.joinConfig.channelId === channel.id
  ) {
    return; // đang treo đúng chỗ
  }

  try {
    await connectToChannel(channel);
  } catch (error) {
    disconnectGuild(channel.guild.id); // dọn kết nối dở dang để lần sau join sạch
    throw error;
  }
}

async function tick() {
  if (!VOICE_HOME_CHANNEL_ID) return;
  timer = null;
  busy = true;
  let delay = CHECK_INTERVAL_MS;
  try {
    await ensureHome();
    failCount = 0;
  } catch (error) {
    failCount += 1;
    delay = Math.min(BACKOFF_BASE_MS * 2 ** (failCount - 1), BACKOFF_MAX_MS);
    console.error(`Lỗi khi bot treo voice (lần ${failCount}, thử lại sau ${Math.round(delay / 1000)}s):`, error.message);
  } finally {
    busy = false;
  }
  schedule(delay);
}

function schedule(delay) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(tick, delay);
}

// Gọi khi nghi ngờ bot vừa mất chỗ — chỉ đẩy lần kiểm tra lên sớm, không tạo timer mới.
function kick(delay) {
  if (busy) return; // đang join dở, tick xong tự đặt lịch tiếp
  schedule(delay);
}

// Reset hằng ngày 3h sáng giờ VN: huỷ kết nối cũ (tránh kết nối chết âm thầm sau nhiều giờ) rồi vào lại sạch.
let lastResetKey = null;
setInterval(() => {
  if (!VOICE_HOME_CHANNEL_ID) return;
  const now = getVnNow();
  const key = getDateKey(now);
  if (now.getHours() !== RESET_HOUR || now.getMinutes() !== RESET_MINUTE || lastResetKey === key) return;
  lastResetKey = key;
  console.log('[voice] Reset định kỳ 3h sáng: vào lại phòng voice.');
  try {
    const channel = client.channels.cache.get(VOICE_HOME_CHANNEL_ID);
    if (channel) disconnectGuild(channel.guild.id);
  } catch (e) { console.error('[voice] Lỗi khi reset:', e.message); }
  failCount = 0;
  kick(3_000);
}, 30_000);

// Chỉ quan tâm trạng thái voice của CHÍNH BOT: rời hẳn, bị kéo sang phòng khác...
client.on(Events.VoiceStateUpdate, (oldState, newState) => {
  if (!VOICE_HOME_CHANNEL_ID || !client.user || newState.id !== client.user.id) return;
  if (newState.channelId === VOICE_HOME_CHANNEL_ID) return;
  // Đang trong backoff (vào lỗi liên tiếp): destroy() dọn kết nối dở cũng bắn event này,
  // nếu kick() ở đây sẽ ghi đè lịch backoff -> bot thử lại mỗi ~20s thay vì 5 phút.
  if (failCount > 0) return;
  kick(3_000 + Math.floor(Math.random() * 2_000)); // lệch ngẫu nhiên để 2 instance (lúc deploy chồng nhau) không giằng co đồng bộ
});

if (VOICE_HOME_CHANNEL_ID) {
  if (client.isReady()) kick(2_000);
  else client.once(Events.ClientReady, () => kick(5_000));
}
