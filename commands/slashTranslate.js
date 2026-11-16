// ===== Slash: /translate =====
// /translate noi_dung:<nội dung> [ngon_ngu:<ngôn ngữ>] — bỏ trống ngôn ngữ -> tiếng Việt.
// (Discord bắt buộc option "required" đứng trước option tuỳ chọn nên noi_dung đứng trước ngon_ngu.)

const {
  DEFAULT_LANGUAGE,
  MAX_INPUT_LENGTH,
  translateText,
  buildReplyChunks,
  isOnCooldown,
} = require('../translate');

const NO_PING = { parse: [], repliedUser: false };

// Trả về true nếu interaction đã được xử lý ở nhóm lệnh này.
async function handleTranslateSlashCommands(interaction, commandName) {
  if (commandName !== 'translate') return false;

  const text = interaction.options.getString('noi_dung', true);
  const language = (interaction.options.getString('ngon_ngu') || '').trim() || DEFAULT_LANGUAGE;

  if (isOnCooldown(interaction.user.id)) {
    await interaction.reply({ content: '⏳ Từ từ thôi, đợi vài giây rồi dịch tiếp nha.', ephemeral: true });
    return true;
  }

  if (text.length > MAX_INPUT_LENGTH) {
    await interaction.reply({
      content: `❌ Nội dung dài quá (${text.length}/${MAX_INPUT_LENGTH} ký tự), chia nhỏ ra rồi dịch từng đoạn nha.`,
      ephemeral: true,
    });
    return true;
  }

  // Gọi AI có thể mất > 3 giây -> defer trước để interaction không hết hạn.
  await interaction.deferReply();
  const result = await translateText(text, language);

  if (!result.ok) {
    await interaction.editReply({ content: result.error, allowedMentions: NO_PING });
    return true;
  }

  const [first, ...others] = buildReplyChunks(result.text, result.language);
  await interaction.editReply({ content: first, allowedMentions: NO_PING });
  for (const chunk of others) {
    await interaction.followUp({ content: chunk, allowedMentions: NO_PING });
  }
  return true;
}

module.exports = { handleTranslateSlashCommands };
