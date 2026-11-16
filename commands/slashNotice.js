// ===== Slash: Bảng Tin =====
// /addnotice, /removenotice, /viewnotice, /testnotice.

const { BONG_ROLE_ID, BOT_CREATOR_DISCORD_ID } = require('../config');
const {
  addNoticeBoardNotice,
  removeNoticeBoardNotice,
  getNoticeBoardNoticeById,
  buildNoticeBoardListChunks,
} = require('../googleSheets/noticeBoardSheet');
const { requestNoticeApproval } = require('./noticeApproval');
const { sendTestNoticeBoardMessage } = require('../AutoReply');

// Trả về true nếu interaction đã được xử lý ở nhóm lệnh này (tương ứng `return;` trong listener gốc).
async function handleNoticeSlashCommands(interaction, commandName) {
    if (commandName === 'addnotice') {
      // Ai cũng dùng được lệnh này. Có role Bông -> lưu thẳng vào sheet như
      // cũ. KHÔNG có role Bông -> KHÔNG lưu ngay, gửi DM cho
      // BOT_CREATOR_DISCORD_ID (config.js) kèm 2 nút Đồng Ý/Từ Chối duyệt
      // trước (xem commands/noticeApproval.js) — chỉ khi được Đồng Ý mới
      // thật sự lưu vào sheet.
      const content = interaction.options.getString('noi_dung', true);
      const isBong = Boolean(interaction.member && interaction.member.roles.cache.has(BONG_ROLE_ID));

      if (isBong) {
        try {
          const notice = await addNoticeBoardNotice(content, interaction.user.id);
          await interaction.reply({
            content: `✅ Đã thêm tin **#${notice.id}** vào Bảng Tin Monaris:\n> ${notice.content}`,
            ephemeral: true,
          });
        } catch (error) {
          console.error('Lỗi khi thêm tin Bảng Tin Monaris:', error.message);
          await interaction.reply({ content: `❌ Không thể thêm tin: ${error.message}`, ephemeral: true });
        }
        return true;
      }

      try {
        await requestNoticeApproval({
          content,
          submitterId: interaction.user.id,
          submitterTag: interaction.user.tag,
        });
        await interaction.reply({
          content: '📨 Tin của bạn đã được gửi cho quản lý duyệt trước khi đăng vào Bảng Tin Monaris — chờ phản hồi nhé!',
          ephemeral: true,
        });
      } catch (error) {
        console.error('Lỗi khi gửi duyệt tin Bảng Tin Monaris:', error.message);
        await interaction.reply({ content: `❌ Không thể gửi tin để duyệt: ${error.message}`, ephemeral: true });
      }
      return true;
    }

    if (commandName === 'removenotice') {
      const id = interaction.options.getString('id', true);
      const notice = getNoticeBoardNoticeById(id);

      if (!notice) {
        await interaction.reply({ content: `⚠️ Không tìm thấy tin có Id \`${id}\` trong Bảng Tin Monaris.`, ephemeral: true });
        return true;
      }

      const isBong = Boolean(interaction.member && interaction.member.roles.cache.has(BONG_ROLE_ID));
      const isCreator = interaction.user.id === BOT_CREATOR_DISCORD_ID;
      const isOwner = Boolean(notice.postedByUserId) && interaction.user.id === notice.postedByUserId;

      if (!isBong && !isCreator && !isOwner) {
        await interaction.reply({
          content: '❌ Bạn không có quyền xoá tin này — chỉ Bông, người tạo bot, hoặc chính người đã đăng tin đó mới xoá được.',
          ephemeral: true,
        });
        return true;
      }

      try {
        const removed = await removeNoticeBoardNotice(id);
        if (!removed) {
          // getNoticeBoardNoticeById(id) ở trên đã tìm thấy tin này trong bộ
          // nhớ (không thì đã return ở nhánh !notice rồi), nhưng sheet lại
          // không có dòng đó -> tin đã bị xoá TRỰC TIẾP trên sheet trước đó
          // (không qua /removenotice), bộ nhớ bị lệch. removeNoticeBoardNotice
          // đã tự dọn nó khỏi bộ nhớ rồi nên không còn bị đăng lặp lại nữa.
          await interaction.reply({
            content: `⚠️ Tin **#${id}** đã bị xoá trực tiếp trên sheet trước đó rồi (không phải qua \`/removenotice\`) — mình đã đồng bộ lại bộ nhớ, tin này sẽ không còn được đăng nữa.`,
            ephemeral: true,
          });
          return true;
        }
        await interaction.reply({ content: `✅ Đã xoá tin **#${id}** khỏi Bảng Tin Monaris.`, ephemeral: true });
      } catch (error) {
        console.error('Lỗi khi xoá tin Bảng Tin Monaris:', error.message);
        await interaction.reply({ content: `❌ Không thể xoá tin: ${error.message}`, ephemeral: true });
      }
      return true;
    }

    if (commandName === 'viewnotice') {
      try {
        await interaction.deferReply({ ephemeral: true });
        const chunks = await buildNoticeBoardListChunks();
        await interaction.editReply(chunks[0]);
        for (let i = 1; i < chunks.length; i++) {
          await interaction.followUp({ content: chunks[i], ephemeral: true });
        }
      } catch (error) {
        console.error('Lỗi khi xem Bảng Tin Monaris:', error.message);
        const payload = { content: `❌ Không thể lấy danh sách tin: ${error.message}`, ephemeral: true };
        if (interaction.deferred) {
          await interaction.editReply(payload);
        } else {
          await interaction.reply(payload);
        }
      }
      return true;
    }

    if (commandName === 'testnotice') {
      if (!interaction.member || !interaction.member.roles.cache.has(BONG_ROLE_ID)) {
        await interaction.reply({ content: '❌ Bạn cần role Bông để dùng lệnh này.', ephemeral: true });
        return true;
      }

      try {
        const notice = await sendTestNoticeBoardMessage();
        await interaction.reply({ content: `✅ Đã gửi thử tin **#${notice.id}** vào kênh test.`, ephemeral: true });
      } catch (error) {
        console.error('Lỗi khi gửi thử tin Bảng Tin Monaris:', error.message);
        await interaction.reply({ content: `❌ Không thể gửi thử: ${error.message}`, ephemeral: true });
      }
      return true;
    }

  return false;
}

module.exports = {
  handleNoticeSlashCommands,
};
