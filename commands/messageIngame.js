// ===== Lệnh mon!: tra cứu ingame từ tag/mention user =====
// mon!ai <@user> hoặc reply với mon!ai để tra cứu ingame (Ai game name) của người được tag
// Nếu không có thông tin hoặc người được tag không trong danh sách Bang, bot sẽ báo yêu cầu cập nhật

const { getMemberIngameInfo } = require('../googleSheets/updateProfileSheet');

/**
 * Xử lý lệnh mon!ai <@user> để tra cứu ingame
 * Format: mon!ai @username
 * Hoặc: reply vào tin nhắn của ai đó rồi gõ mon!ai
 *
 * @param {Message} message - Discord message object
 * @param {string} content - Nội dung tin nhắn đã lowercase
 * @returns {boolean} true nếu đã xử lý, false nếu không phải lệnh này
 */
async function handleIngameMessageCommands(message, content) {
  // Kiểm tra lệnh "mon!ai"
  if (!content.toLowerCase().startsWith('mon!ai')) {
    return false;
  }

  try {
    let targetUserId = null;

    // Cách 1: Tag user trực tiếp - mon!ai @user
    if (message.mentions.users.size > 0) {
      const mentionedUser = message.mentions.users.first();
      targetUserId = mentionedUser.id;
    }
    // Cách 2: Reply vào tin nhắn của ai đó rồi gõ mon!ai
    else if (message.reference) {
      try {
        const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
        targetUserId = repliedMessage.author.id;
      } catch (error) {
        console.error('Lỗi fetch tin nhắn được reply:', error.message);
        await message.reply('❌ Không thể lấy thông tin tin nhắn được reply. Vui lòng thử lại hoặc tag trực tiếp.');
        return true;
      }
    } else {
      // Không có mention hoặc reply
      await message.reply('❌ Vui lòng tag user (`mon!ai @user`) hoặc reply vào tin nhắn của ai đó rồi gõ `mon!ai`');
      return true;
    }

    // Tra cứu Ingame/Class: ưu tiên tab "Cập nhật phái" (nút Hub "Cập Nhật Thông Tin"), thiếu thì tab "Bang"
    const memberInfo = await getMemberIngameInfo(targetUserId);

    if (!memberInfo || !memberInfo.ingame) {
      // Không tìm thấy thông tin hoặc ingame trống
      await message.reply(
        `❌ Tag user là ai, mình chưa biết. Bảo bạn cập nhật thông tin đi mới biết`
      );
      return true;
    }

    // Có thông tin ingame - trả về
    const ingameName = memberInfo.ingame;
    const className = memberInfo.className ? ` (${memberInfo.className})` : '';

    await message.reply(`**Ingame:** ${ingameName}${className}`);
    return true;
  } catch (error) {
    console.error('[messageIngame] Lỗi xử lý lệnh mon!ai:', error);
    await message.reply('❌ Có lỗi xảy ra khi tra cứu thông tin. Vui lòng thử lại sau.');
    return true;
  }
}

module.exports = {
  handleIngameMessageCommands,
};
