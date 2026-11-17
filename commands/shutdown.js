'use strict';

const { SlashCommandBuilder, Events } = require('discord.js');
const client = require('../client');
const { OWNER } = require('../AutoReply/ownerStyle');

// Không dừng tiến trình trên máy chủ cloud ngoài ý muốn khi bé muốn tắt CMD PC.
const HOSTED_ENV_KEYS = ['RAILWAY_ENVIRONMENT', 'RAILWAY_SERVICE_ID', 'RENDER_SERVICE_ID', 'FLY_APP_NAME'];

const SHUTDOWN_SLASH_COMMANDS = [
  new SlashCommandBuilder()
    .setName('tatbot')
    .setDescription('Chỉ chủ bot: tắt hoàn toàn tiến trình Monaris đang chạy')
    .setDMPermission(false)
    .toJSON(),
];

function isOwner(userId) {
  return String(userId || '') === OWNER;
}
function isHosted(env = process.env) {
  return HOSTED_ENV_KEYS.some(key => Boolean(env[key]));
}

async function handleShutdown(interaction, dependencies = {}) {
  if (!interaction.isChatInputCommand() || interaction.commandName !== 'tatbot') return false;

  if (!isOwner(interaction.user?.id)) {
    await interaction.reply({
      content: '❌ Chỉ Bông mới có thể tắt Monaris.',
      ephemeral: true,
    });
    return true;
  }

  if (isHosted(dependencies.env || process.env)) {
    await interaction.reply({
      content: '⚠️ Phiên Monaris này đang chạy trên máy chủ cloud, không phải CMD PC. Mình không tắt nhầm phiên cloud nhé.',
      ephemeral: true,
    });
    return true;
  }

  await interaction.reply({
    content: 'Monaris đã nhận lệnh tắt. Tạm biệt bé nhé! 💙',
    ephemeral: true,
  });

  console.log('[Shutdown] Lệnh /tatbot được chủ bot xác nhận; đang dừng Monaris.');
  const discordClient = dependencies.client || client;
  const exit = dependencies.exit || ((code) => process.exit(code));
  const schedule = dependencies.schedule || ((fn, ms) => setTimeout(fn, ms));
  try {
    discordClient.destroy();
  } catch (error) {
    console.error('[Shutdown] Lỗi ngắt kết nối Discord:', error.message);
  }
  // Đã gửi phản hồi xác nhận trước khi kết thúc; process.exit kết thúc
  // cả các scheduler, HTTP server và các module cùng tiến trình Node.
  schedule(() => exit(0), 500);
  return true;
}

// Listener riêng để /tatbot có thể tắt bot kể cả khi readyGate chưa hoàn tất.
// Đăng ký handler này TRƯỚC commands/slashCommands trong index.js.
function installShutdownListener() {
  if (client.__shutdownListenerInstalled) return;
  client.__shutdownListenerInstalled = true;
  client.on(Events.InteractionCreate, interaction => {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'tatbot') return;
    handleShutdown(interaction).catch(error => {
      console.error('[Shutdown] Không thực hiện được /tatbot:', error.message);
    });
  });
}

module.exports = {
  SHUTDOWN_SLASH_COMMANDS,
  handleShutdown,
  installShutdownListener,
  isOwner,
  isHosted,
};
