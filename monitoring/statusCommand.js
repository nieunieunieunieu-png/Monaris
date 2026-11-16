// ===== monitoring/statusCommand.js — /status (Bông/admin): sức khoẻ bot gom 1 chỗ =====
// RAM + uptime (memoryWatcher), ping Discord, lỗi Google Sheet gần đây
// (monitoring/status.js — các module ghi nhận ở chỗ đã bắt lỗi sẵn). Chỉ người dùng lệnh thấy (ephemeral).
const { Events, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const client = require('../client');
const { BONG_ROLE_ID, DISCORD_GUILD_ID } = require('../config');
const { getMemoryStatus } = require('./memoryWatcher');
const { getSheetStatus } = require('./status');

const STATUS_SLASH_COMMANDS = [new SlashCommandBuilder().setName('status').setDescription('(Bông) Xem tình trạng bot: RAM, uptime, lỗi Google Sheet')];

function dur(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return d ? `${d} ngày ${h} giờ` : h ? `${h} giờ ${m} phút` : `${m} phút`;
}

const ago = (ms) => (ms ? `${dur((Date.now() - ms) / 1000)} trước` : 'chưa có');
const ts = (ms) => (ms ? `<t:${Math.floor(ms / 1000)}:R>` : 'chưa có');

function buildStatusEmbed() {
  const mem = getMemoryStatus();
  const sheets = getSheetStatus();
  const guild = client.guilds.cache.get(DISCORD_GUILD_ID);
  const memIcon = mem.percent >= 90 ? '🔴' : mem.percent >= 50 ? '🟡' : '🟢';

  const e = new EmbedBuilder().setTitle('📊 Tình trạng bot').setColor(mem.percent >= 90 ? 0xed4245 : 0x57f287).setTimestamp(new Date());
  e.addFields(
    {
      name: '⚙️ Hệ thống',
      value:
        `${memIcon} RAM: **${mem.rssMb} MB** / ${mem.limitMb} MB (**${mem.percent}%**) · Heap ${mem.heapUsedMb}/${mem.heapTotalMb} MB\n` +
        `⏱️ Uptime: **${dur(mem.uptimeSeconds)}** · 📡 Ping Discord: **${Math.round(client.ws.ping)} ms**\n` +
        `🧩 Node ${process.version} · Server: ${guild ? `${guild.memberCount} thành viên` : 'chưa nạp'}`,
    }
  );

  const withErr = sheets.sources.filter((s) => s.errors > 0);
  const okCount = sheets.sources.filter((s) => s.errors === 0).length;
  const sheetLines = [`Từ lúc bot khởi động ${ago(sheets.startedAt)}: **${okCount}** nguồn không lỗi, **${withErr.length}** nguồn có lỗi.`];
  for (const s of withErr.slice(0, 6)) sheetLines.push(`• **${s.name}** — ${s.errors} lỗi, gần nhất ${ts(s.lastErrorAt)}: \`${s.lastError.slice(0, 80)}\``);
  if (!sheets.recent.length) sheetLines.push('Chưa ghi nhận lỗi Google Sheet nào ✅');
  sheetLines.push('_Chỉ gồm các nguồn đã được gắn theo dõi._');
  e.addFields({ name: '📑 Google Sheet', value: sheetLines.join('\n').slice(0, 1024) });

  return e;
}

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'status') return;
    const allowed = (interaction.member && interaction.member.roles && interaction.member.roles.cache.has(BONG_ROLE_ID));
    if (!allowed) return void (await interaction.reply({ content: '❌ Chỉ Bông mới dùng được lệnh này.', ephemeral: true }));
    await interaction.reply({ embeds: [buildStatusEmbed()], ephemeral: true });
  } catch (error) {
    console.error('[status] Lỗi /status:', error.message);
  }
});

module.exports = { STATUS_SLASH_COMMANDS, buildStatusEmbed };
