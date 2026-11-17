'use strict';

// /trangthai: chu bot doi dong hoat dong hien thi duoi ten Monaris.
const fs = require('node:fs');
const path = require('node:path');
const { SlashCommandBuilder, ActivityType, Events } = require('discord.js');
const client = require('../client');
const { OWNER } = require('../AutoReply/ownerStyle');

const STATUS_PATH = path.join(__dirname, '..', 'data', 'bot-presence.json');
const STATUS_SLASH_COMMANDS = [
  new SlashCommandBuilder()
    .setName('trangthai')
    .setDescription('Chi Bong: thay doi trang thai hien thi cua Monaris')
    .addStringOption(option => option
      .setName('noidung')
      .setDescription('Noi dung trang thai, vi du: Do Ngoc; nhap xoa de bo trang thai')
      .setRequired(true)
      .setMaxLength(128))
    .setDMPermission(false)
    .toJSON(),
];

function normalizeStatus(input) {
  const value = String(input || '').trim();
  if (!value) return null;
  if (/^(?:xoa|reset|off)$/i.test(value)) return '';
  if (value.length > 128 || /[\u0000-\u001f\u007f]/.test(value)) return null;
  return value;
}

function applyStatus(user, state) {
  if (!user) return false;
  user.setPresence({
    status: 'online',
    activities: state ? [{ type: ActivityType.Custom, name: 'custom', state }] : [],
  });
  return true;
}

function restoreStatus(user, filepath = STATUS_PATH) {
  try {
    const parsed = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    if (typeof parsed.status === 'string') return applyStatus(user, parsed.status);
  } catch (error) {
    if (error.code !== 'ENOENT') console.warn('[Presence] Khong doc duoc trang thai da luu:', error.message);
  }
  return false;
}

async function handleStatus(interaction, deps = {}) {
  if (!interaction.isChatInputCommand() || interaction.commandName !== 'trangthai') return false;
  if (String(interaction.user?.id) !== OWNER) {
    await interaction.reply({ content: 'Chi Bong moi duoc doi trang thai Monaris.', ephemeral: true });
    return true;
  }
  const status = normalizeStatus(interaction.options.getString('noidung', true));
  if (status === null) {
    await interaction.reply({ content: 'Noi dung khong hop le (toi da 128 ky tu).', ephemeral: true });
    return true;
  }
  const user = deps.user || client.user;
  if (!user) {
    await interaction.reply({ content: 'Monaris chua san sang de doi trang thai.', ephemeral: true });
    return true;
  }
  try {
    applyStatus(user, status);
    const filename = deps.filepath || STATUS_PATH;
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    fs.writeFileSync(filename, JSON.stringify({ status }, null, 2), { mode: 0o600 });
    await interaction.reply({
      content: status ? 'Da dat trang thai Monaris: ' + status : 'Da xoa trang thai Monaris.',
      ephemeral: true,
    });
  } catch (error) {
    console.error('[Presence] Khong the cap nhat:', error.message);
    await interaction.reply({ content: 'Khong the luu trang thai. Kiem tra quyen ghi thu muc data.', ephemeral: true });
  }
  return true;
}

function installStatusListener() {
  if (client.__statusListenerInstalled) return;
  client.__statusListenerInstalled = true;
  client.on(Events.ClientReady, () => restoreStatus(client.user));
  client.on(Events.InteractionCreate, interaction => {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'trangthai') return;
    handleStatus(interaction).catch(error => console.error('[Presence] Loi /trangthai:', error.message));
  });
}

module.exports = {
  STATUS_SLASH_COMMANDS, installStatusListener, handleStatus,
  restoreStatus, normalizeStatus, applyStatus,
};
