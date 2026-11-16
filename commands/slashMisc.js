// ===== Slash: nhóm lệnh tổng hợp =====
// /join, /out, /ping, /help, /hi, /moe, /tlmn, /setchatchannel, /removechatchannel, /chatchannels, /ai.

const { AttachmentBuilder, PermissionFlagsBits } = require('discord.js');
const { chatChannels } = require('../state');
const { BONG_ROLE_ID, MOE_GIF_URLS } = require('../config');
const { resolveEmojiShortcodes } = require('../utils/emoji');
const { hasChatFeatureAccess } = require('../utils/permissions');
const { getHelpTextChunksForGuild } = require('./help');
const { addChatChannelRow, removeChatChannelRow } = require('../googleSheets/chatChannelAllowsSheet');
const { notifyTlmnAdmin } = require('./tlmnNotify');
const { getChatChannelsForGuild } = require('../AutoReply');
const { handleJoinCommand, handleOutCommand } = require('./voiceJoin');
const { getMemberIngameInfo } = require('../googleSheets/updateProfileSheet');

// Trả về true nếu interaction đã được xử lý ở nhóm lệnh này (tương ứng `return;` trong listener gốc).
async function handleMiscSlashCommands(interaction, commandName) {
    if (commandName === 'monaris') {
      await interaction.reply({ content: require('./about').aboutText(), ephemeral: true });
      return true;
    }
    if (commandName === 'setchatchannel') {
      if (!interaction.guild) {
        await interaction.reply({
          content: '❌ Lệnh này chỉ dùng được trong server, không dùng được ở tin nhắn riêng (DM).',
          ephemeral: true,
        });
        return true;
      }

      // Discord đã tự ẩn lệnh này với người không có quyền Manage Guild
      // nhờ setDefaultMemberPermissions lúc đăng ký, nhưng vẫn check lại
      // trong code cho chắc (đề phòng admin server đổi quyền lệnh thủ công
      // trong Integrations settings).
      if (!interaction.member?.roles?.cache?.has('1566691821806026862')) {
        await interaction.reply({ content: '❌ Bạn cần quyền "Quản lý máy chủ" (Manage Server) để dùng lệnh này.', ephemeral: true });
        return true;
      }

      const targetChannel = interaction.options.getChannel('kenh', true);
      const existing = getChatChannelsForGuild(interaction.guild.id);

      if (existing.includes(targetChannel.id)) {
        await interaction.reply({ content: `⚠️ Kênh ${targetChannel} đã có trong danh sách kênh chat của bot rồi.`, ephemeral: true });
        return true;
      }

      chatChannels[interaction.guild.id] = [...existing, targetChannel.id];
      await addChatChannelRow(interaction.guild.id, targetChannel.id);

      await interaction.reply(
        `✅ Đã thêm ${targetChannel} vào danh sách kênh chat của bot ở server này. Từ giờ bot sẽ CHỈ trò chuyện ` +
          `(từ khóa, tag bot, "bot ơi, ...", ...) trong các kênh đã set. Dùng \`/chatchannels\` để xem danh sách hiện tại.`
      );
      return true;
    }

    if (commandName === 'removechatchannel') {
      if (!interaction.guild) {
        await interaction.reply({
          content: '❌ Lệnh này chỉ dùng được trong server, không dùng được ở tin nhắn riêng (DM).',
          ephemeral: true,
        });
        return true;
      }

      if (!interaction.member?.roles?.cache?.has('1566691821806026862')) {
        await interaction.reply({ content: '❌ Bạn cần quyền "Quản lý máy chủ" (Manage Server) để dùng lệnh này.', ephemeral: true });
        return true;
      }

      const targetChannel = interaction.options.getChannel('kenh', true);
      const existing = getChatChannelsForGuild(interaction.guild.id);

      if (!existing.includes(targetChannel.id)) {
        await interaction.reply({ content: `⚠️ Kênh ${targetChannel} hiện không có trong danh sách kênh chat của bot.`, ephemeral: true });
        return true;
      }

      const updated = existing.filter((id) => id !== targetChannel.id);
      if (updated.length > 0) {
        chatChannels[interaction.guild.id] = updated;
      } else {
        delete chatChannels[interaction.guild.id];
      }
      await removeChatChannelRow(interaction.guild.id, targetChannel.id);

      await interaction.reply(`✅ Đã bỏ ${targetChannel} khỏi danh sách kênh chat của bot ở server này.`);
      return true;
    }

    if (commandName === 'chatchannels') {
      if (!interaction.guild) {
        await interaction.reply({
          content: '❌ Lệnh này chỉ dùng được trong server, không dùng được ở tin nhắn riêng (DM).',
          ephemeral: true,
        });
        return true;
      }

      const channelIds = getChatChannelsForGuild(interaction.guild.id);
      if (channelIds.length === 0) {
        await interaction.reply({
          content:
            '⚠️ Server này CHƯA set kênh chat nào — bot sẽ trò chuyện ở bất kỳ kênh nào có người nhắn (mặc định). ' +
            'Dùng `/setchatchannel` để giới hạn lại.',
          ephemeral: true,
        });
        return true;
      }

      const lines = channelIds.map((id) => `<#${id}>`).join('\n');
      await interaction.reply({ content: `📋 Bot đang được phép trò chuyện ở các kênh sau trong server này:\n${lines}`, ephemeral: true });
      return true;
    }

    if (commandName === 'join') {
      await handleJoinCommand(interaction);
      return true;
    }

    if (commandName === 'out') {
      await handleOutCommand(interaction);
      return true;
    }

    if (commandName === 'ping') {
      await interaction.reply('Pong!');
      return true;
    }

    if (commandName === 'help') {
      // Nội dung help có thể dài hơn giới hạn 2000 ký tự/tin của Discord —
      // PHẢI chia nhỏ và gửi thành NHIỀU tin nối tiếp (reply cho đoạn đầu,
      // followUp cho các đoạn sau), gửi nguyên 1 tin dài như trước sẽ bị
      // Discord từ chối thẳng ("Must be 2000 or fewer in length").
      const chunks = getHelpTextChunksForGuild(interaction.guildId);
      await interaction.reply({ content: chunks[0], ephemeral: true });
      for (let i = 1; i < chunks.length; i++) {
        await interaction.followUp({ content: chunks[i], ephemeral: true });
      }
      return true;
    }

    if (commandName === 'moe') {
      const taggedUser = interaction.options.getUser('user');
      const tagText = taggedUser ? `<@${taggedUser.id}> ` : '';
      const randomGifUrl = MOE_GIF_URLS[Math.floor(Math.random() * MOE_GIF_URLS.length)];

      await interaction.deferReply();

      try {
        const gifResponse = await fetch(randomGifUrl);
        const gifBuffer = Buffer.from(await gifResponse.arrayBuffer());
        const gifAttachment = new AttachmentBuilder(gifBuffer, { name: 'moe.gif' });

        await interaction.editReply({
          content: `${tagText}Doki doki fuwa fuwa oshikunare moe moe kyun`,
          files: [gifAttachment],
        });

        const sentMessage = await interaction.fetchReply();
        setTimeout(() => {
          sentMessage.delete().catch(err => console.error('Failed to auto-delete moe message:', err.message));
        }, 30 * 1000);
      } catch (error) {
        console.error('Failed to send moe gif via slash command:', error.message);
        await interaction.editReply('❌ Lỗi khi gửi gif.');
      }
      return true;
    }

    if (commandName === 'tlmn') {
      if (!hasChatFeatureAccess(interaction.user.id, interaction.member)) {
        await interaction.reply({
          content: '❌ Bạn không có quyền sử dụng lệnh này. Cần role Bông hoặc được cấp quyền qua role Bông.',
          ephemeral: true,
        });
        return true;
      }

      const noiDung = interaction.options.getString('noi_dung');
      const hinhAnh = interaction.options.getAttachment('hinh_anh');
      const replyId = interaction.options.getString('reply_id');

      if (!noiDung && !hinhAnh) {
        await interaction.reply({ content: '⚠️ Cần nhập nội dung hoặc đính kèm ảnh.', ephemeral: true });
        return true;
      }

      // Ô nhập text của slash command KHÔNG có bảng chọn emoji như khung
      // chat thường, nên emote gần như luôn bị gõ dưới dạng shortcode
      // :ten_emote: — tự tra danh sách emote của server để thay thành đúng
      // mã <:ten:id> / <a:ten:id> trước khi gửi.
      const finalContent = resolveEmojiShortcodes(noiDung, interaction.guild);

      try {
        // Nếu có reply_id, thử lấy tin nhắn gốc trong kênh hiện tại để bot
        // reply thẳng vào đó thay vì gửi 1 tin mới rời rạc.
        let targetMessage = null;
        if (replyId) {
          try {
            targetMessage = await interaction.channel.messages.fetch(replyId);
          } catch (fetchError) {
            await interaction.reply({
              content: `❌ Không tìm thấy tin nhắn có ID \`${replyId}\` trong kênh này. Kiểm tra lại ID hoặc đảm bảo tin nhắn đó nằm trong cùng kênh.`,
              ephemeral: true,
            });
            return true;
          }
        }

        const sendPayload = {
          content: finalContent || undefined,
          files: hinhAnh ? [hinhAnh.url] : undefined,
          // Chỉ cho phép mention user cụ thể (nếu người dùng có ghi @ai đó
          // trong nội dung), chặn @everyone/@here/role để tránh spam ping.
          allowedMentions: { parse: ['users'] },
        };

        // Gửi vào kênh dưới danh nghĩa bot (channel.send / message.reply),
        // KHÔNG dùng interaction.reply công khai — nếu dùng interaction.reply
        // công khai Discord sẽ hiện dòng "X đã sử dụng /tlmn" cho mọi người thấy.
        if (targetMessage) {
          await targetMessage.reply(sendPayload);
        } else {
          await interaction.channel.send(sendPayload);
        }

        // Báo riêng cho admin (DM) biết ai vừa dùng lệnh tlmn và nội dung gì —
        // tin công khai vẫn ẩn danh như cũ, chỉ admin nhận được DM này.
        await notifyTlmnAdmin({
          authorTag: interaction.user.tag,
          authorId: interaction.user.id,
          channelId: interaction.channel.id,
          content: finalContent,
          attachmentUrls: hinhAnh ? [hinhAnh.url] : [],
          replyToId: replyId || null,
        });

        // Reply ephemeral — chỉ người gọi lệnh thấy dòng xác nhận này, nên
        // Discord không hiện "X đã sử dụng /tlmn" công khai trong kênh.
        await interaction.reply({ content: '✅ Đã gửi.', ephemeral: true });
      } catch (error) {
        console.error('Không thể gửi tin nhắn tlmn qua slash command:', error.message);
        await interaction.reply({ content: '❌ Đã xảy ra lỗi khi gửi tin nhắn.', ephemeral: true }).catch(() => {});
      }
      return true;
    }

    if (commandName === 'ai') {
      try {
        const targetUser = interaction.options.getUser('user', true);

        // Tra cứu Ingame/Class: ưu tiên tab "Cập nhật phái" (nút Hub "Cập Nhật Thông Tin"), thiếu thì tab "Bang"
        const memberInfo = await getMemberIngameInfo(targetUser.id);

        if (!memberInfo || !memberInfo.ingame) {
          // Không tìm thấy thông tin hoặc ingame trống
          await interaction.reply({
            content: `❌ Tag user là ai, mình chưa biết. Bảo bạn cập nhật thông tin đi mới biết`,
            ephemeral: true,
          });
          return true;
        }

        // Có thông tin ingame - trả về
        const ingameName = memberInfo.ingame;
        const className = memberInfo.className ? ` (${memberInfo.className})` : '';

        await interaction.reply({
          content: `**Ingame:** ${ingameName}${className}`,
          ephemeral: true,
        });
        return true;
      } catch (error) {
        console.error('[slashAi] Lỗi xử lý lệnh /ai:', error);
        await interaction.reply({
          content: '❌ Có lỗi xảy ra khi tra cứu thông tin. Vui lòng thử lại sau.',
          ephemeral: true,
        });
        return true;
      }
    }

  return false;
}

module.exports = {
  handleMiscSlashCommands,
};
