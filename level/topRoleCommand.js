// ===== level/topRoleCommand.js — /toprole + mon!toprole (Bông / admin) =====
// Hiện ai đang giữ role Top tuần / Top tháng, hạn tới khi nào (giờ VN), và đối chiếu với role thực tế trên Discord để biết bot gắn đúng chưa.
const { Events, EmbedBuilder } = require('discord.js');
const client = require('../client');
const { LEVEL_ENABLED, BONG_ROLE_ID, ADMIN_USER_ID } = require('../config');
const topRole = require('./topRole');

function isBongMember(member, userId) {
  
  return Boolean(member && member.roles && member.roles.cache && member.roles.cache.has(BONG_ROLE_ID));
}

function vnString(ms) {
  const d = new Date(ms + 7 * 60 * 60 * 1000);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())} ${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

function buildEmbed(guild) {
  const embed = new EmbedBuilder().setColor(0xf5c542).setTitle('🏅 Role Top tuần / Top tháng');
  const blocks = topRole.describe(guild);
  if (!blocks.length) return embed.setDescription('Chưa bật role Top nào (LEVEL_TOP_ROLE_ID / LEVEL_MONTH_ROLE_ID đang tắt).');
  for (const b of blocks) {
    const lines = b.list.length ? b.list.map((id, i) => `**${i + 1}.** <@${id}>`).join('\n') : '_Chưa có ai (chưa có dữ liệu kỳ trước)._';
    const warn = [];
    if (b.roleMissing) warn.push(`⚠️ Không tìm thấy role <@&${b.roleId}> trong server.`);
    if (b.missing.length) warn.push(`⚠️ Chưa được gắn role: ${b.missing.map((id) => `<@${id}>`).join(' ')}`);
    if (b.extra.length) warn.push(`⚠️ Đang giữ role nhưng không có trong danh sách: ${b.extra.map((id) => `<@${id}>`).join(' ')}`);
    const hiddenNote = b.hidden && b.hidden.length ? `\n🙈 Đã tắt role (theo /profile): ${b.hidden.map((id) => `<@${id}>`).join(' ')}` : '';
    embed.addFields({
      name: `${b.kind === 'month' ? '🥇' : '🥈'} ${b.title} — <@&${b.roleId}>`,
      value: `Hết hạn: **${vnString(b.endsAt)}** (${b.remain})\n${lines}${hiddenNote}${warn.length ? `\n${warn.join('\n')}` : '\n✅ Role trên Discord khớp danh sách.'}`.slice(0, 1024),
    });
  }
  return embed.setFooter({ text: 'Bot đối chiếu mỗi phút; quét lại cả server mỗi 10 phút' });
}

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'toprole') return;
    if (!LEVEL_ENABLED) return void (await interaction.reply({ content: 'Hệ thống level đang tắt.', ephemeral: true }));
    if (!interaction.guildId || !isBongMember(interaction.member, interaction.user.id)) {
      return void (await interaction.reply({ content: '❌ Bạn không có quyền sử dụng lệnh này. Cần role Bông.', ephemeral: true }));
    }
    await interaction.reply({ embeds: [buildEmbed(interaction.guild)], ephemeral: true, allowedMentions: { parse: [] } });
  } catch (error) {
    console.error('[level] Lỗi /toprole:', error.message);
  }
});

client.on(Events.MessageCreate, async (message) => {
  try {
    if (message.author.bot || !message.guildId || !/^mon!toprole(\s|$)/i.test(String(message.content || '').trim())) return;
    if (!LEVEL_ENABLED) return;
    if (!isBongMember(message.member, message.author.id)) {
      return void (await message.reply({ content: '❌ Bạn không có quyền sử dụng lệnh này. Cần role Bông.', allowedMentions: { repliedUser: false } }));
    }
    await message.reply({ embeds: [buildEmbed(message.guild)], allowedMentions: { parse: [], repliedUser: false } });
  } catch (error) {
    console.error('[level] Lỗi mon!toprole:', error.message);
  }
});
