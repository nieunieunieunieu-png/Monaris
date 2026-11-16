// ===== /logtim (Bông): tra cứu tab "Nhật Ký Tin Nhắn" =====
// /logtim [nguoi] [tu_khoa] [loai: tất cả|gửi|sửa|xoá] [ngay: 1-90, mặc định 7] [so_dong: 1-25, mặc định 10]
// Kết quả chỉ hiện cho người gõ lệnh (ephemeral), mới nhất trước. Ghi nốt các sự kiện đang chờ lên Sheet trước khi tra.
const { Events, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const client = require('../client');
const { BONG_ROLE_ID, ADMIN_USER_ID, MEMBER_LOG_ENABLED, MEMBER_LOG_SHEET_ENABLED } = require('../config');
const { flushSheet } = require('./memberLog');
const store = require('../googleSheets/memberLogSheet');
const { quote } = require('./index');

const LOGSEARCH_SLASH_COMMANDS = [
  new SlashCommandBuilder()
    .setName('logtim')
    .setDescription('(Bông) Tra cứu nhật ký tin nhắn: ai gửi / sửa / xoá gì')
    .addUserOption((o) => o.setName('nguoi').setDescription('Chỉ xem của người này').setRequired(false))
    .addStringOption((o) => o.setName('tu_khoa').setDescription('Chỉ lấy tin có chứa từ/cụm này').setRequired(false).setMaxLength(100))
    .addStringOption((o) =>
      o
        .setName('loai')
        .setDescription('Loại sự kiện (bỏ trống = tất cả)')
        .setRequired(false)
        .addChoices({ name: 'Tất cả', value: 'all' }, { name: 'Gửi', value: 'GỬI' }, { name: 'Sửa', value: 'SỬA' }, { name: 'Xoá', value: 'XOÁ' })
    )
    .addIntegerOption((o) => o.setName('ngay').setDescription('Tìm trong N ngày gần đây (mặc định 7, tối đa 90)').setRequired(false).setMinValue(1).setMaxValue(90))
    .addIntegerOption((o) => o.setName('so_dong').setDescription('Số dòng tối đa hiển thị (mặc định 10, tối đa 25)').setRequired(false).setMinValue(1).setMaxValue(25)),
].map((cmd) => cmd.toJSON());

const ICON = { GỬI: '✉️', SỬA: '✏️', XOÁ: '🗑️' };

function isAllowed(interaction) {
  
  const roles = interaction.member && interaction.member.roles && interaction.member.roles.cache;
  return Boolean(roles && roles.has(BONG_ROLE_ID));
}

function norm(text) {
  return String(text || '').normalize('NFC').toLowerCase();
}

function formatEvent(e) {
  const ts = e.at ? `<t:${Math.floor(e.at / 1000)}:f>` : e.time;
  const who = e.userId ? `<@${e.userId}>` : e.userName || 'không rõ';
  const by = e.type === 'XOÁ' && e.deletedBy ? ` — ${e.deletedBy}` : '';
  const file = e.files.length ? ` 📎${e.files.length}` : '';
  const head = `${ICON[e.type] || '•'} ${ts} ${who} <#${e.channelId}>${by}${file}`;
  if (e.type === 'SỬA') return `${head}\n**Trước:**\n${quote(e.before, 300)}\n**Sau:**\n${quote(e.content, 400)}`;
  return `${head}\n${quote(e.content, 600)}`;
}

async function runSearch(opts) {
  await flushSheet().catch(() => {});
  const all = await store.readAllEvents();
  const since = Date.now() - opts.days * 24 * 60 * 60 * 1000;
  const kw = norm(opts.keyword);
  const hits = all.filter((e) => {
    if (e.at < since) return false;
    if (opts.type !== 'all' && e.type !== opts.type) return false;
    if (opts.userId && e.userId !== opts.userId) return false;
    if (kw && !norm(`${e.content}\n${e.before}`).includes(kw)) return false;
    return true;
  });
  hits.reverse(); // mới nhất trước
  const shown = [];
  let size = 0;
  for (const e of hits.slice(0, opts.limit)) {
    const line = formatEvent(e);
    if (size + line.length + 2 > 3800) break;
    shown.push(line);
    size += line.length + 2;
  }
  return { total: hits.length, shown };
}

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'logtim') return;
    if (!MEMBER_LOG_ENABLED || !MEMBER_LOG_SHEET_ENABLED) {
      await interaction.reply({ content: 'Nhật ký thành viên / lưu Sheet đang tắt.', ephemeral: true });
      return;
    }
    if (!interaction.guildId || !isAllowed(interaction)) {
      await interaction.reply({ content: '❌ Bạn không có quyền sử dụng lệnh này. Cần role Bông.', ephemeral: true });
      return;
    }
    await interaction.deferReply({ ephemeral: true });
    const user = interaction.options.getUser('nguoi');
    const opts = {
      userId: user ? user.id : '',
      keyword: interaction.options.getString('tu_khoa') || '',
      type: interaction.options.getString('loai') || 'all',
      days: interaction.options.getInteger('ngay') || 7,
      limit: interaction.options.getInteger('so_dong') || 10,
    };
    const { total, shown } = await runSearch(opts);
    if (!total) {
      await interaction.editReply({ content: 'Không tìm thấy dòng nào khớp.' });
      return;
    }
    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('🔎 Nhật ký tin nhắn')
      .setDescription(shown.join('\n\n'))
      .setFooter({ text: `Hiện ${shown.length}/${total} dòng khớp trong ${opts.days} ngày gần đây (mới nhất trước). Xem đủ ở tab "Nhật Ký Tin Nhắn".` });
    await interaction.editReply({ embeds: [embed], allowedMentions: { parse: [] } });
  } catch (error) {
    console.error('[ActivityLog] Lỗi /logtim:', error.message);
    try {
      if (interaction.deferred || interaction.replied) await interaction.editReply({ content: '❌ Có lỗi khi tra nhật ký, xem log bot.' });
    } catch (_) {
      /* bỏ qua */
    }
  }
});

module.exports = { LOGSEARCH_SLASH_COMMANDS, runSearch };
