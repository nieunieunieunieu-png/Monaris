// ===== Lệnh mon!: Bảng Tin =====
// mon!viewnotice.

const { BONG_ROLE_ID } = require('../config');
const { buildNoticeBoardListChunks } = require('../googleSheets/noticeBoardSheet');

// Trả về true nếu tin nhắn đã được xử lý ở nhóm lệnh này (tương ứng `return;` trong listener gốc).
async function handleAutoDmMessageCommands(message, content) {
  if (content.toLowerCase() === 'mon!viewnotice') {
    // Không check role Bông — chỉ là lệnh XEM, và cần dùng được cả trong DM
    // (message.member = null ở DM nên không thể check role kiểu thông
    // thường được). Gọi buildNoticeBoardListChunks() cũng tự đồng bộ lại
    // bộ nhớ với sheet (xem googleSheets/noticeBoardSheet.js), nên lệnh
    // này tiện thể dùng để "làm mới" khi vừa xoá/sửa tay trên sheet.
    try {
      const chunks = await buildNoticeBoardListChunks();
      await message.reply(chunks[0]);
      for (let i = 1; i < chunks.length; i++) {
        await message.channel.send(chunks[i]);
      }
    } catch (error) {
      console.error('Lỗi khi xem Bảng Tin Monaris:', error.message);
      message.reply(`❌ Không thể lấy danh sách tin: ${error.message}`);
    }
    return true;
  }

  return false;
}

module.exports = {
  handleAutoDmMessageCommands,
};
