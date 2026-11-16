// ===== nmImage/format.js — định nghĩa slash command + format /viewlistimg =====
const { SlashCommandBuilder } = require('discord.js');

const NMIMAGE_SLASH_COMMANDS = [
  new SlashCommandBuilder()
    .setName('saveimg')
    .setDescription('Lưu 1 ảnh vào kho ảnh chung, đặt tên để lấy lại sau này')
    .addStringOption((opt) => opt.setName('ten').setDescription('Tên để đặt cho ảnh (dùng lại khi /send_img)').setRequired(true))
    .addAttachmentOption((opt) => opt.setName('anh').setDescription('Ảnh cần lưu').setRequired(true)),
  new SlashCommandBuilder()
    .setName('send_img')
    .setDescription('Gửi lại 1 ảnh đã lưu vào chat, theo tên hoặc ID ảnh')
    .addStringOption((opt) =>
      opt.setName('ten_hoac_id').setDescription('Tên ảnh (xem /viewlistimg) hoặc ID ảnh').setRequired(true)
    )
    .addUserOption((opt) =>
      opt.setName('nguoi_nhan').setDescription('Tag người này kèm ảnh (không bắt buộc)').setRequired(false)
    )
    .addStringOption((opt) =>
      opt
        .setName('noi_dung')
        .setDescription('Nội dung chữ gửi kèm ảnh (không bắt buộc)')
        .setRequired(false)
    )
    .addStringOption((opt) =>
      opt
        .setName('reply_id')
        .setDescription('ID tin nhắn muốn rep vào (không bắt buộc)')
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('renameimg')
    .setDescription('Đổi tên 1 ảnh đã lưu trong kho')
    .addStringOption((opt) => opt.setName('ten_cu').setDescription('Tên hiện tại của ảnh').setRequired(true))
    .addStringOption((opt) => opt.setName('ten_moi').setDescription('Tên mới muốn đổi thành').setRequired(true)),
  new SlashCommandBuilder()
    .setName('viewlistimg')
    .setDescription('Xem danh sách tên ảnh đã lưu trong kho'),
].map((cmd) => cmd.toJSON());

// Giới hạn ký tự an toàn cho 1 tin nhắn Discord (2000) — chừa lề cho phần
// tiêu đề/markdown, chia nhỏ nếu danh sách quá dài (giống tinh thần
// getHelpTextChunksForGuild bên commands/help.js).
const CHUNK_LIMIT = 1800;

function formatImageListChunks(entries) {
  if (!entries.length) {
    return ['📂 Kho ảnh hiện chưa có ảnh nào. Dùng `/saveimg` hoặc `mon!saveimg <tên>` (kèm ảnh) để lưu ảnh đầu tiên.'];
  }

  const lines = entries.map((entry) => `**${entry.name}** — ID: \`${entry.fileId}\``);
  const header = `📂 **Danh sách ảnh đã lưu (${entries.length}):**\n`;

  const chunks = [];
  let current = header;
  for (const line of lines) {
    if (current.length + line.length + 1 > CHUNK_LIMIT) {
      chunks.push(current);
      current = '';
    }
    current += line + '\n';
  }
  if (current.trim()) chunks.push(current);
  return chunks;
}

module.exports = { NMIMAGE_SLASH_COMMANDS, formatImageListChunks };
