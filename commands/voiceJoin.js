// Lõi kết nối voice của bot + 2 lệnh /join, /out.
//
// Bot hiện TREO CỐ ĐỊNH trong 1 phòng voice (VOICE_HOME_CHANNEL_ID, xem
// events/voiceFollow.js) — không còn đi theo ai nữa, nên /join và /out chỉ còn
// trả lời thông báo (để không ai kéo bot sang phòng khác hay cho bot thoát).
// Bot KHÔNG NGHE và KHÔNG PHÁT audio (không tạo AudioPlayer/receiver; chỉ gửi soundboard qua REST, nên không selfDeaf — xem selfDeaf bên dưới)
// nên kết nối voice gần như không tốn thêm RAM/CPU.
//
// connectToChannel()/disconnectGuild() là phần LÕI, dùng cho events/voiceFollow.js.
const {
  joinVoiceChannel,
  getVoiceConnection,
  VoiceConnectionStatus,
  entersState,
} = require('@discordjs/voice');
const { VOICE_HOME_CHANNEL_ID } = require('../config');

// Các connection ĐÃ gắn listener Disconnected. joinVoiceChannel() cho 1 server
// đã có kết nối sẽ trả về CHÍNH connection cũ -> nếu mỗi lần gọi lại .on(...)
// thì listener cứ chồng chất theo số lần rejoin (rò RAM). WeakSet đảm bảo mỗi
// connection chỉ gắn đúng 1 lần, và tự được dọn khi connection bị destroy.
const watched = new WeakSet();

// Vào (hoặc DI CHUYỂN nếu đang ở kênh khác trong CÙNG server) 1 voice channel.
// Trả về VoiceConnection đã Ready. Ném lỗi nếu không kết nối được.
async function connectToChannel(channel) {
  const existing = getVoiceConnection(channel.guild.id);
  if (
    existing &&
    existing.state.status !== VoiceConnectionStatus.Destroyed &&
    existing.joinConfig.channelId === channel.id
  ) {
    if (existing.state.status !== VoiceConnectionStatus.Ready) {
      await entersState(existing, VoiceConnectionStatus.Ready, 15_000);
    }
    return existing; // đã ở đúng kênh này rồi
  }

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
    // Discord CHỈ cho bot phát soundboard (tiếng Cốc Cốc của Công Đức) khi bot KHÔNG deaf/mute/suppress -> mặc định selfDeaf=false.
    // Bot vẫn không tạo receiver/AudioPlayer nên gần như không tốn thêm RAM/CPU. Muốn quay lại selfDeaf: VOICE_HOME_SELF_DEAF=true (mất tiếng Cốc Cốc).
    selfDeaf: /^(1|true|on|yes)$/i.test(String(process.env.VOICE_HOME_SELF_DEAF || '')),
    selfMute: false,
  });

  if (!watched.has(connection)) {
    watched.add(connection);
    // Chẩn đoán "The operation was aborted": log các bước kết nối (signalling -> connecting -> ready) để biết kẹt ở bước nào.
    connection.on('stateChange', (o, n) => console.log(`[voice] ${o.status} -> ${n.status}${n.reason !== undefined ? ` (reason ${n.reason})` : ''}`));
    // Rớt kết nối: thử chờ tự nối lại vài giây, không được thì destroy() hẳn để
    // không treo kết nối chết trong bộ nhớ. (Vòng giám sát ở voiceFollow.js sẽ
    // tự vào lại sau đó.)
    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch {
        if (connection.state.status !== VoiceConnectionStatus.Destroyed) connection.destroy();
      }
    });
  }

  await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
  return connection;
}

// Rời voice của 1 server (no-op nếu không có kết nối / đã destroy).
function disconnectGuild(guildId) {
  const connection = getVoiceConnection(guildId);
  if (connection && connection.state.status !== VoiceConnectionStatus.Destroyed) connection.destroy();
}

async function handleJoinCommand(interaction) {
  await interaction.reply({
    content: `📌 Bot đang treo cố định ở <#${VOICE_HOME_CHANNEL_ID}>, không đi theo ai nữa nên lệnh này không còn tác dụng.`,
    ephemeral: true,
  });
}

async function handleOutCommand(interaction) {
  await interaction.reply({
    content: `📌 Bot treo cố định ở <#${VOICE_HOME_CHANNEL_ID}> — nếu bị đá ra sẽ tự vào lại, nên không có lệnh cho bot rời.`,
    ephemeral: true,
  });
}

module.exports = { handleJoinCommand, handleOutCommand, connectToChannel, disconnectGuild };
