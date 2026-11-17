'use strict';

// PC controller: lightweight independent Discord bot; NEVER use the main bot token.
// Keep this window running if /moboss must work while Monaris is offline.
const path = require('node:path');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const { Client, Events, GatewayIntentBits, SlashCommandBuilder } = require('discord.js');

const ROOT = path.resolve(__dirname, '..');
const CONTROLLER_ENV = path.join(__dirname, '.env');
const MAIN_ENV = path.join(ROOT, '.env');

function loadConfiguration() {
  if (fs.existsSync(MAIN_ENV)) process.loadEnvFile(MAIN_ENV);
  if (fs.existsSync(CONTROLLER_ENV)) process.loadEnvFile(CONTROLLER_ENV);
  const token = process.env.MONARIS_CONTROLLER_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  const ownerId = process.env.ADMIN_USER_ID;
  if (!token || !guildId || !ownerId) {
    throw new Error('Thieu MONARIS_CONTROLLER_TOKEN, DISCORD_GUILD_ID hoac ADMIN_USER_ID.');
  }
  if (token === process.env.DISCORD_TOKEN) {
    throw new Error('Controller phai dung BOT TOKEN KHAC voi Monaris chinh.');
  }
  return { token, guildId, ownerId };
}

function makeRunner({ spawnChild = spawn, cwd = ROOT, node = process.execPath } = {}) {
  let child = null;
  function start() {
    if (child && child.exitCode === null && child.signalCode === null) {
      return { started: false, reason: 'running', pid: child.pid };
    }
    child = spawnChild(node, [path.join(cwd, 'start.js')], {
      cwd,
      stdio: 'inherit',
      windowsHide: false,
      env: { ...process.env },
    });
    const current = child;
    current.on('error', error => {
      console.error('[Controller] Khong the chay Monaris:', error.message);
      if (child === current) child = null;
    });
    current.on('exit', (code, signal) => {
      console.log('[Controller] Monaris da dung (' + (signal || code) + ').');
      if (child === current) child = null;
    });
    return { started: true, pid: child.pid };
  }
  return { start };
}

async function handleMoboss(interaction, runner, ownerId) {
  if (!interaction.isChatInputCommand() || interaction.commandName !== 'moboss') return false;
  if (String(interaction.user?.id) !== String(ownerId)) {
    await interaction.reply({ content: 'Chi Bong moi duoc bat Monaris.', ephemeral: true });
    return true;
  }
  const result = runner.start();
  await interaction.reply({
    content: result.started
      ? 'Da gui lenh khoi dong Monaris tren PC. Kiem tra cua so Controller de xem log.'
      : 'Monaris dang chay trong phien do Controller quan ly.',
    ephemeral: true,
  });
  return true;
}

async function main() {
  const config = loadConfiguration();
  const runner = makeRunner();
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  client.once(Events.ClientReady, async () => {
    const guild = await client.guilds.fetch(config.guildId);
    // Sets commands ONLY for the controller application; never touches Monaris commands.
    await guild.commands.set([
      new SlashCommandBuilder()
        .setName('moboss')
        .setDescription('Chi Bong: bat Monaris tren PC')
        .setDMPermission(false)
        .toJSON(),
    ]);
    console.log('[Controller] Online. Lenh /moboss da duoc dang ky.');
    console.log('[Controller] De cua so nay mo neu muon bat bot tu Discord.');
  });
  client.on(Events.InteractionCreate, interaction => {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'moboss') return;
    handleMoboss(interaction, runner, config.ownerId)
      .catch(async error => {
        console.error('[Controller] /moboss error:', error.message);
        if (!interaction.replied) await interaction.reply({
          content: 'Khong the khoi dong Monaris. Xem log Controller tren PC.',
          ephemeral: true,
        }).catch(() => {});
      });
  });
  await client.login(config.token);
}

if (require.main === module) {
  main().catch(error => {
    console.error('[Controller] Loi:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { loadConfiguration, makeRunner, handleMoboss };
