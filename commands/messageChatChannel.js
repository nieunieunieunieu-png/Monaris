// ===== Lệnh mon!: kênh chat cố định =====
// mon!setchatchannel, mon!removechatchannel, mon!chatchannels, mon!allchatchannels.

const { PermissionFlagsBits } = require('discord.js');
const client = require('../client');
const { chatChannels } = require('../state');
const { ADMIN_USER_ID } = require('../config');
const { addChatChannelRow, removeChatChannelRow } = require('../googleSheets/chatChannelAllowsSheet');
const { getChatChannelsForGuild } = require('../AutoReply');

// Trả về true nếu tin nhắn đã được xử lý ở nhóm lệnh này (tương ứng `return;` trong listener gốc).
async function handleChatChannelMessageCommands(message, content) {
  if (content.toLowerCase().startsWith('mon!setchatchannel')) {
    // Lệnh dùng CHUNG cho MỌI server bot được mời vào (kể cả server gốc,
    // nếu admin server gốc muốn dùng luôn). Cố tình làm dạng lệnh
    // "mon!..." (prefix command) thay vì slash command global — slash
    // command global mất tới ~1 tiếng để Discord đồng bộ ra hết các
    // server, còn prefix command thì có tác dụng NGAY LẬP TỨC, không cần
    // đợi gì cả và không cần bot chủ động đăng ký gì thêm cho từng server.
    if (!message.guild) {
      message.reply('❌ Lệnh này chỉ dùng được trong server, không dùng được ở tin nhắn riêng (DM).');
      return true;
    }

    // Không dùng BONG_ROLE_ID ở đây vì role đó chỉ tồn tại ở server gốc —
    // server khác sẽ không có role này nên không ai set được. Dùng quyền
    // Discord có sẵn "Manage Server" (Quản lý máy chủ) — quyền chuẩn mực
    // cho việc cấu hình bot, admin server nào cũng có sẵn quyền này.
    if (!message.member || !message.member.roles.cache.has('1566691821806026862')) {
      message.reply('❌ Bạn cần quyền "Quản lý máy chủ" (Manage Server) để dùng lệnh này.');
      return true;
    }

    const targetChannel = message.mentions.channels.first();
    if (!targetChannel) {
      message.reply('❌ Vui lòng tag kèm kênh muốn set, VD: `mon!setchatchannel #chat-chit`.');
      return true;
    }

    // THÊM kênh vào danh sách (không ghi đè) — 1 server có thể cho phép
    // chat ở nhiều kênh cùng lúc. Tự chuyển dữ liệu cũ (string đơn) sang
    // mảng nếu cần, để tương thích ngược với server đã set từ trước.
    const existing = getChatChannelsForGuild(message.guild.id);
    if (existing.includes(targetChannel.id)) {
      message.reply(`⚠️ Kênh ${targetChannel} đã có trong danh sách kênh chat của bot rồi.`);
      return true;
    }

    chatChannels[message.guild.id] = [...existing, targetChannel.id];
    // Lưu vào sheet riêng "ChatChanelAllows" (serverId | channelId) —
    // KHÔNG dùng saveState() nữa vì chatChannels không còn nằm trong blob
    // JSON của sheet BotState, tránh lưu trùng lặp ở 2 chỗ.
    await addChatChannelRow(message.guild.id, targetChannel.id);

    message.reply(
      `✅ Đã thêm ${targetChannel} vào danh sách kênh chat của bot ở server này. Từ giờ bot sẽ CHỈ trò chuyện ` +
        `(từ khóa, tag bot, "bot ơi, ...", ...) trong các kênh đã set. Dùng \`mon!chatchannels\` để xem danh sách hiện tại.`
    );
    return true;
  }

  if (content.toLowerCase().startsWith('mon!removechatchannel')) {
    if (!message.guild) {
      message.reply('❌ Lệnh này chỉ dùng được trong server, không dùng được ở tin nhắn riêng (DM).');
      return true;
    }

    if (!message.member || !message.member.roles.cache.has('1566691821806026862')) {
      message.reply('❌ Bạn cần quyền "Quản lý máy chủ" (Manage Server) để dùng lệnh này.');
      return true;
    }

    const targetChannel = message.mentions.channels.first();
    if (!targetChannel) {
      message.reply('❌ Vui lòng tag kèm kênh muốn bỏ, VD: `mon!removechatchannel #chat-chit`.');
      return true;
    }

    const existing = getChatChannelsForGuild(message.guild.id);
    if (!existing.includes(targetChannel.id)) {
      message.reply(`⚠️ Kênh ${targetChannel} hiện không có trong danh sách kênh chat của bot.`);
      return true;
    }

    const updated = existing.filter((id) => id !== targetChannel.id);
    if (updated.length > 0) {
      chatChannels[message.guild.id] = updated;
    } else {
      delete chatChannels[message.guild.id];
    }
    // Xoá đúng dòng (serverId, channelId) khỏi sheet "ChatChanelAllows".
    await removeChatChannelRow(message.guild.id, targetChannel.id);

    message.reply(`✅ Đã bỏ ${targetChannel} khỏi danh sách kênh chat của bot ở server này.`);
    return true;
  }

  if (content.toLowerCase().startsWith('mon!chatchannels')) {
    // Liệt kê nhanh cho admin/thành viên server hiện tại xem bot đang được
    // phép trò chuyện ở những kênh nào — không cần quyền đặc biệt gì,
    // thuần thông tin, không thay đổi state.
    if (!message.guild) {
      message.reply('❌ Lệnh này chỉ dùng được trong server, không dùng được ở tin nhắn riêng (DM).');
      return true;
    }

    const channelIds = getChatChannelsForGuild(message.guild.id);
    if (channelIds.length === 0) {
      message.reply(
        '⚠️ Server này CHƯA set kênh chat nào — bot sẽ trò chuyện ở bất kỳ kênh nào có người nhắn (mặc định). ' +
          'Dùng `mon!setchatchannel #kênh` để giới hạn lại.'
      );
      return true;
    }

    const lines = channelIds.map((id) => `<#${id}>`).join('\n');
    message.reply(`📋 Bot đang được phép trò chuyện ở các kênh sau trong server này:\n${lines}`);
    return true;
  }

  if (content.toLowerCase().startsWith('mon!allchatchannels')) {
    // Lệnh CHỈ chủ bot dùng được — liệt kê TẤT CẢ server bot đang ở, kèm
    // guild ID và danh sách kênh chat đã set (nếu có), để chủ bot tra cứu
    // nhanh mà không cần vào từng server gõ mon!chatchannels riêng lẻ.
    if (!message.member?.roles?.cache?.has('1566691821806026862')) {
      message.reply('❌ Lệnh này chỉ dành cho chủ bot.');
      return true;
    }

    const guilds = [...client.guilds.cache.values()];
    if (guilds.length === 0) {
      message.reply('⚠️ Bot hiện chưa ở trong server nào.');
      return true;
    }

    const lines = guilds.map((guild) => {
      const channelIds = getChatChannelsForGuild(guild.id);
      const channelsText =
        channelIds.length > 0 ? channelIds.map((id) => `<#${id}>`).join(', ') : '_chưa set (mặc định: mọi kênh)_';
      return `• **${guild.name}** (\`${guild.id}\`) — ${channelsText}`;
    });

    // Discord giới hạn 2000 ký tự/tin nhắn — chia nhỏ nếu danh sách dài.
    const header = `📋 Bot đang ở **${guilds.length}** server:\n`;
    let chunk = header;
    for (const line of lines) {
      if ((chunk + '\n' + line).length > 1900) {
        await message.reply(chunk);
        chunk = '';
      }
      chunk += (chunk ? '\n' : '') + line;
    }
    if (chunk) await message.reply(chunk);
    return true;
  }

  return false;
}

module.exports = {
  handleChatChannelMessageCommands,
};
