const { SlashCommandBuilder } = require('discord.js');
const { BOT_NAME, BOT_PREFIX, COMMUNITY_NAME } = require('../config/branding');
const ABOUT_SLASH_COMMANDS = [new SlashCommandBuilder().setName('monaris').setDescription('Giới thiệu Monaris và các lệnh bắt đầu')];
function aboutText() {
  return `✨ **${BOT_NAME}** · ${COMMUNITY_NAME}\n` +
    'Bạn đồng hành Discord: trò chuyện AI, kiến thức game, hồ sơ cơ bản và phòng voice tạm.\n\n' +
    '**Bắt đầu:** `/help` · `/setpf`\n' +
    `**Trò chuyện:** tag mình hoặc gõ “Monaris ơi, kể chuyện vui”.\n**Lệnh chữ:** \`${BOT_PREFIX}help\` · \`${BOT_PREFIX}ping\`\n` +
    'Một số tính năng cần quản trị viên cấu hình trước.';
}
module.exports = { ABOUT_SLASH_COMMANDS, aboutText };
