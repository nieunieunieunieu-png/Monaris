// ===== Lệnh mon!: chào / test nhắc / moe / tlmn =====
// mon!hi, mon!testbc, mon!testgcmn, mon!testscrim1, mon!testscrim2, mon!testnotice, mon!moe, mon!tlmn.

const { AttachmentBuilder, PermissionFlagsBits } = require('discord.js');
const client = require('../client');
const { scrimData } = require('../state');
const {
  BONG_ROLE_ID,
  MOE_GIF_URLS,
  BC_REMINDER_CHANNEL_ID,
  SCRIM_REMINDER_CHANNEL_ID,
  GUILD_REMINDER_CHANNEL_ID,
} = require('../config');
const { resolveEmojiShortcodes } = require('../utils/emoji');
const { hasChatFeatureAccess } = require('../utils/permissions');
const { sendTestNoticeBoardMessage } = require('../AutoReply');
const { notifyTlmnAdmin } = require('./tlmnNotify');

// Trả về true nếu tin nhắn đã được xử lý ở nhóm lệnh này (tương ứng `return;` trong listener gốc).
async function handleMiscMessageCommands(message, content) {
  if (content.toLowerCase() === 'mon!testnotice') {
    if (!message.member || !message.member.roles.cache.has(BONG_ROLE_ID)) {
      message.reply('❌ Bạn không có quyền sử dụng lệnh này. Cần role Bông.');
      return true;
    }

    try {
      const notice = await sendTestNoticeBoardMessage();
      await message.reply(`✅ Đã gửi thử tin **#${notice.id}** vào kênh test.`);
    } catch (error) {
      console.error('Lỗi khi gửi thử tin Bảng Tin Monaris:', error.message);
      await message.reply(`❌ Không thể gửi thử: ${error.message}`);
    }
    return true;
  }

  if (content.toLowerCase().startsWith('mon!moe')) {
    if (!require('../features').isEnabled('moe')) {
      await message.reply(require('../features').disabledNotice('moe')).catch(() => {});
      return true;
    }
    const taggedUser = message.mentions.users.first();
    const tagText = taggedUser ? `<@${taggedUser.id}> ` : '';

    const randomGifUrl = MOE_GIF_URLS[Math.floor(Math.random() * MOE_GIF_URLS.length)];

    try {
      const gifResponse = await fetch(randomGifUrl);
      const gifBuffer = Buffer.from(await gifResponse.arrayBuffer());
      const gifAttachment = new AttachmentBuilder(gifBuffer, { name: 'moe.gif' });

      const moeMessage = await message.channel.send({
        content: `${tagText}Doki doki fuwa fuwa oshikunare moe moe kyun`,
        files: [gifAttachment],
      });

      setTimeout(() => {
        moeMessage.delete().catch(err => console.error('Failed to auto-delete moe message:', err.message));
      }, 30 * 1000);
    } catch (error) {
      console.error('Failed to send moe gif:', error.message);
      message.reply('❌ Lỗi khi gửi gif.');
    }

    await message.delete().catch(err => console.error('Failed to delete command message:', err.message));
    return true;
  }

  if (content.toLowerCase().startsWith('mon!tlmn')) {
    if (!require('../features').isEnabled('tlmn')) {
      await message.reply(require('../features').disabledNotice('tlmn')).catch(() => {});
      return true;
    }
    if (!hasChatFeatureAccess(message.author.id, message.member)) {
      message.reply('❌ Bạn không có quyền sử dụng lệnh này. Cần role Bông hoặc được cấp quyền qua role Bông.');
      return true;
    }

    const isDm = !message.guild;

    // Lấy nguyên văn phần sau "mon!tlmn " từ message.content GỐC (không phải
    // biến content đã lowercase) để giữ đúng chữ hoa/thường/emoji người dùng gõ.
    let rawContent = message.content.slice('mon!tlmn'.length).trim();

    // Ở DM KHÔNG có "kênh hiện tại" nên bắt buộc phải tự cung cấp ID kênh
    // muốn đăng vào — token ĐẦU TIÊN luôn là channelId trong trường hợp
    // này. Cú pháp: mon!tlmn <ID kênh> [ID tin nhắn muốn reply] <nội dung>
    // Ví dụ:   mon!tlmn 1111111111111111111 Chúc cả nhà ngày mới vui vẻ!
    //          mon!tlmn 1111111111111111111 2222222222222222222 Đồng ý luôn!
    let targetChannelId = null;
    if (isDm) {
      const channelIdMatch = rawContent.match(/^(\d{15,25})(?:\s+([\s\S]*))?$/);
      if (!channelIdMatch) {
        const usageMsg = await message.reply(
          '⚠️ Dùng qua DM cần cho biết đăng vào KÊNH nào. Cú pháp: `mon!tlmn <ID kênh> <nội dung>`\n' +
            'Muốn reply thay vào 1 tin nhắn cụ thể trong kênh đó: `mon!tlmn <ID kênh> <ID tin nhắn> <nội dung>`\n' +
            '(bấm chuột phải vào kênh/tin nhắn → Copy Channel ID / Copy Message ID, cần bật Developer Mode trong Discord)'
        );
        setTimeout(() => usageMsg.delete().catch(() => {}), 15 * 1000);
        return true;
      }
      targetChannelId = channelIdMatch[1];
      rawContent = (channelIdMatch[2] || '').trim();
    }

    // Cho phép trả lời thay 1 tin nhắn cụ thể: nếu từ đầu tiên (SAU khi đã
    // tách channelId ở trên, nếu là DM) là ID tin nhắn Discord (snowflake,
    // chỉ gồm số, dài 17-20 ký tự) thì tách ra làm "replyToId", phần còn
    // lại mới là nội dung thật sự.
    // Cú pháp (trong server): mon!tlmn <id_tin_nhắn> <nội dung>
    // Ví dụ:   mon!tlmn 1234567890123456789 Đồng ý luôn!
    let replyToId = null;
    const replyIdMatch = rawContent.match(/^(\d{17,20})(?:\s+([\s\S]*))?$/);
    if (replyIdMatch) {
      replyToId = replyIdMatch[1];
      rawContent = (replyIdMatch[2] || '').trim();
    }

    // Xác định kênh THẬT SỰ sẽ đăng vào: kênh hiện tại (trong server) hoặc
    // kênh theo ID người dùng cung cấp (qua DM) — TRƯỚC khi resolve emoji
    // shortcode, vì cần đúng guild của kênh đó (có thể KHÁC guild caller
    // đang thấy trong DM) để tra emote cho đúng server.
    let targetChannel = message.channel;
    if (isDm) {
      try {
        targetChannel = await client.channels.fetch(targetChannelId);
      } catch (fetchChannelError) {
        targetChannel = null;
      }

      if (!targetChannel || !targetChannel.guild || typeof targetChannel.send !== 'function') {
        message.reply(
          `❌ Không tìm thấy kênh có ID \`${targetChannelId}\` — kiểm tra lại ID, hoặc bot không ở trong server có kênh đó.`
        );
        return true;
      }

      // Quyền Bông gắn theo ROLE của TỪNG SERVER — ở DM không có sẵn
      // message.member, phải tự fetch member trong ĐÚNG guild của kênh
      // đích để check lại cho chính xác (AccessID thì không cần guild nào
      // cũng có quyền, đã check hasChatFeatureAccess ở đầu, đây chỉ fetch
      // thêm để check trường hợp Bông role — người có role Bông ở server A
      // nhưng không nằm trong AccessID mà lại chỉ định kênh ở server B thì
      // vẫn phải bị chặn).
      let memberInTargetGuild = null;
      try {
        memberInTargetGuild = await targetChannel.guild.members.fetch(message.author.id);
      } catch (fetchMemberError) {
        memberInTargetGuild = null;
      }

      if (!hasChatFeatureAccess(message.author.id, memberInTargetGuild)) {
        message.reply(
          '❌ Bạn không có quyền đăng vào kênh đó — cần role Bông ở ĐÚNG server chứa kênh này, hoặc được cấp quyền qua role Bông.'
        );
        return true;
      }

      // Kiểm tra bot có quyền Xem kênh + Gửi tin nhắn ở kênh đích không —
      // đúng yêu cầu: báo lại qua DM nếu kênh đó bot không gửi được.
      const botMember = targetChannel.guild.members.me;
      const permissions = botMember ? targetChannel.permissionsFor(botMember) : null;
      if (
        !permissions ||
        !permissions.has(PermissionFlagsBits.ViewChannel) ||
        !permissions.has(PermissionFlagsBits.SendMessages)
      ) {
        message.reply(`❌ Kênh đó không có quyền gửi tin nhắn (bot thiếu quyền Xem kênh/Gửi tin nhắn ở kênh \`${targetChannelId}\`).`);
        return true;
      }
    }

    // Tự thay các shortcode :ten_emote: (mà client Discord của người gõ
    // không tự convert được thành emote thật) thành đúng mã <:ten:id> /
    // <a:ten:id> bằng cách tra trong danh sách emote của server chứa kênh đích.
    const finalContent = resolveEmojiShortcodes(rawContent, targetChannel.guild);
    const attachmentUrls = [...message.attachments.values()].map((a) => a.url);

    if (!rawContent && attachmentUrls.length === 0) {
      const usageMsg = await message.reply(
        '⚠️ Cú pháp: `mon!tlmn <nội dung>` — ví dụ: `mon!tlmn Chúc cả nhà ngày mới vui vẻ!` (có thể đính kèm ảnh).\n' +
        '➡️ Muốn bot trả lời thay vào 1 tin nhắn cụ thể: `mon!tlmn <ID tin nhắn> <nội dung>` (bấm chuột phải vào tin nhắn đó → Copy Message ID, cần bật Developer Mode trong Discord).' +
        (isDm ? '\n➡️ Qua DM: `mon!tlmn <ID kênh> <nội dung>` hoặc `mon!tlmn <ID kênh> <ID tin nhắn> <nội dung>`.' : '')
      );
      setTimeout(() => usageMsg.delete().catch(() => {}), 15 * 1000);
      await message.delete().catch(err => console.error('Failed to delete tlmn command message:', err.message));
      return true;
    }

    try {
      // Nếu có replyToId, thử lấy tin nhắn gốc trong đúng kênh đích để bot
      // reply thẳng vào đó; nếu không tìm thấy (sai ID, tin đã bị xóa, hoặc
      // ở kênh khác) thì báo lỗi cho người dùng thay vì gửi lạc như tin thường.
      let targetMessage = null;
      if (replyToId) {
        try {
          targetMessage = await targetChannel.messages.fetch(replyToId);
        } catch (fetchError) {
          const usageMsg = await message.reply(
            `❌ Không tìm thấy tin nhắn có ID \`${replyToId}\` trong kênh ${isDm ? 'đã chỉ định' : 'này'}. Kiểm tra lại ID hoặc đảm bảo tin nhắn đó nằm trong cùng kênh.`
          );
          setTimeout(() => usageMsg.delete().catch(() => {}), 15 * 1000);
          await message.delete().catch(err => console.error('Failed to delete tlmn command message:', err.message));
          return true;
        }
      }

      const sendPayload = {
        content: finalContent || undefined,
        files: attachmentUrls.length ? attachmentUrls : undefined,
        // Chỉ cho phép mention user cụ thể, chặn @everyone/@here/role để
        // tránh bị lợi dụng spam ping ẩn danh.
        allowedMentions: { parse: ['users'] },
      };

      if (targetMessage) {
        await targetMessage.reply(sendPayload);
      } else {
        await targetChannel.send(sendPayload);
      }

      // Báo riêng cho admin (DM) biết ai vừa dùng lệnh tlmn và nội dung gì —
      // tin công khai vẫn ẩn danh như cũ, chỉ admin nhận được DM này.
      await notifyTlmnAdmin({
        authorTag: message.author.tag,
        authorId: message.author.id,
        channelId: targetChannel.id,
        content: finalContent,
        attachmentUrls,
        replyToId,
      });

      // Qua DM thì báo luôn 1 dòng xác nhận đã gửi (khác với trong server —
      // ở đó tin nhắn lệnh gốc bị xoá để ẩn danh, tự nó đã là "xác nhận").
      if (isDm) {
        await message.reply(`✅ Đã đăng vào kênh <#${targetChannel.id}>.`);
      }
    } catch (error) {
      console.error('Không thể gửi tin nhắn tlmn:', error.message);
      if (isDm) {
        message.reply('❌ Đã xảy ra lỗi khi gửi tin nhắn.');
      }
    }

    // Xóa tin nhắn lệnh gốc để ẩn danh người gửi — cần bot có quyền "Manage
    // Messages" trong kênh; nếu thiếu quyền thì chỉ log lỗi (không throw),
    // tin tlmn vẫn được gửi nhưng tin nhắn lệnh gốc của người dùng sẽ còn hiển thị.
    // Ở DM, Discord KHÔNG cho bot xoá tin nhắn của người khác (kể cả DM gửi
    // cho chính bot) nên lệnh này sẽ luôn thất bại (best-effort, chỉ log,
    // không ảnh hưởng gì) — không cần và cũng không nên xoá vì DM vốn đã
    // riêng tư, chỉ người gõ lệnh + bot nhìn thấy được.
    if (!isDm) {
      await message.delete().catch(err => console.error('Failed to delete tlmn command message:', err.message));
    }
    return true;
  }

  return false;
}

module.exports = {
  handleMiscMessageCommands,
};
