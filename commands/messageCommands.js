// ===== Lệnh mon! (message commands): điều phối chung =====
// Module này giờ chỉ giữ listener Events.MessageCreate ở dạng "dispatcher": lọc bot,
// gate "chưa sẵn sàng", rồi lần lượt gọi từng nhóm lệnh (mỗi nhóm trả true nếu đã
// xử lý -> dừng, giống `return;` ở listener gốc) + mon!help / mon!ping. Thứ tự gọi
// các nhóm GIỮ NGUYÊN thứ tự các lệnh trong listener cũ. Nhóm lệnh tách ra:
//   - messageHelpers.js     : helper dùng chung (resolveMentionToken, extractPostText)
//   - messageMisc.js        : mon!hi / testbc / testgcmn / testscrim1-2 / moe / tlmn
//   - messageChatChannel.js : mon!setchatchannel / removechatchannel / chatchannels / allchatchannels
//   - messageProfile.js     : mon!setpf / setmqh
//   - messageAutoDm.js      : mon!viewnotice / autodm / setuserdm / viewautodm / removeuserdm
//   - messageIngame.js      : mon!ai / tra cứu ingame từ tag/mention
//   - messageMaintenance.js : mon!backup (sao lưu Sheet sang Drive) / mon!kienthuc (kho kiến thức AI)

const { Events } = require('discord.js');
const client = require('../client');
const { getHelpTextChunksForGuild } = require('./help');
const { isBotReady, replyNotReadyToMessage } = require('../utils/readyGate');
const { handleMiscMessageCommands } = require('./messageMisc');
const { handleChatChannelMessageCommands } = require('./messageChatChannel');
const { handleProfileMessageCommands } = require('./messageProfile');
const { handleAutoDmMessageCommands } = require('./messageAutoDm');
const { handleIngameMessageCommands } = require('./messageIngame');
const { handleMaintenanceMessageCommands } = require('./messageMaintenance');
const { handlePollMessageCommands } = require('./messagePoll');

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  const content = message.content.trim();

  // Bot chưa nạp xong dữ liệu khởi động (xem utils/readyGate.js) — chỉ chặn
  // đúng những tin bắt đầu bằng "mon!" (namespace lệnh của file này), không
  // ảnh hưởng chat thường/tính năng khác đang tự kiểm tra riêng.
  if (content.toLowerCase().startsWith('mon!') && !isBotReady()) {
    await replyNotReadyToMessage(message);
    return;
  }

  if (/^mon!(?:about|monaris)$/i.test(content)) {
    await message.reply({ content: require('./about').aboutText(), allowedMentions: { parse: [] } });
    return;
  }

  if (await handleMiscMessageCommands(message, content)) return;

  if (await handleChatChannelMessageCommands(message, content)) return;

  if (await handleProfileMessageCommands(message, content)) return;

  if (await handleAutoDmMessageCommands(message, content)) return;

  if (await handleIngameMessageCommands(message, content)) return;

  if (await handleMaintenanceMessageCommands(message, content)) return;

  if (await handlePollMessageCommands(message, content)) return;

  if (content.toLowerCase() === 'mon!help') {
    // Chỉ 1 server duy nhất -> luôn hiện bản ĐẦY ĐỦ, không còn phân biệt
    // "server gốc"/"server khác" nữa (xem getHelpTextChunksForGuild trong
    // commands/help.js). Nội dung có thể dài hơn giới hạn 2000 ký tự/tin
    // của Discord -> PHẢI chia nhỏ và gửi thành NHIỀU tin nối tiếp, gửi
    // nguyên 1 tin dài như trước sẽ bị Discord từ chối thẳng.
    const chunks = getHelpTextChunksForGuild(message.guild?.id);
    await message.reply(chunks[0]);
    for (let i = 1; i < chunks.length; i++) {
      await message.channel.send(chunks[i]);
    }
    return;
  }

  if (content.toLowerCase() === 'mon!ping') {
    message.reply('Pong!');
  }
});
