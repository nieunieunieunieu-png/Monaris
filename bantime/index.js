
'use strict';

const {
  Events,
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags
} = require('discord.js');

const { sheets } = require('@googleapis/sheets');
const { getGoogleAuthClient } = require('../googleSheets/auth');
const client = require('../client');

const GUILD_ID =
  process.env.DISCORD_GUILD_ID ||
  '1566691700850688013';

const SHEET_ID =
  process.env.BANTIME_SPREADSHEET_ID ||
  '1gEIRbebFXvVrQ3zOHueHyzXDXySTBTO6B1MuGjcv_O8';

const RESTRICT_ROLE_ID = '1570679562873077852';
const TAB = 'BanTime';

const MAX_MINUTES = 40320;
const CHECK_MS = 30000;

const BANTIME_SLASH_COMMANDS = [
  new SlashCommandBuilder()
    .setName('bantime')
    .setDescription('Timeout thành viên, tự khôi phục role khi hết hạn')
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ModerateMembers
    )
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Thành viên cần Timeout')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('phut')
        .setDescription('Số phút Timeout')
        .setMinValue(1)
        .setMaxValue(MAX_MINUTES)
        .setRequired(true)
    )
    .toJSON()
];

const locks = new Set();
let watcherRunning = false;

function log(...args) {
  console.log('[BanTime]', ...args);
}

async function getApi() {
  const auth = await getGoogleAuthClient();
  if (!auth) throw new Error('Google Sheets chưa xác thực');
  return sheets({ version: 'v4', auth });
}

async function getRecords(api) {
  const response = await api.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${TAB}'!A2:L`
  });

  return (response.data.values || []).map((r, index) => {
    let roles = [];
    let rolesValid = true;

    try {
      const parsed = JSON.parse(r[10] || '[]');
      if (!Array.isArray(parsed)) throw new Error('Invalid roles');
      roles = parsed.map(String);
    } catch {
      rolesValid = false;
    }

    return {
      row: index + 2,
      id: String(r[0] || ''),
      guildId: String(r[1] || ''),
      userId: String(r[2] || ''),
      username: String(r[3] || ''),
      moderatorId: String(r[4] || ''),
      minutes: Number(r[5]) || 0,
      startedAt: String(r[6] || ''),
      expiresAt: String(r[7] || ''),
      status: String(r[8] || ''),
      roles,
      rolesValid,
      mode: String(r[11] || '')
    };
  }).filter(r =>
    r.id && r.userId && r.mode === 'TIMEOUT'
  );
}

async function appendRecord(api, record) {
  const response = await api.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `'${TAB}'!A:L`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[
        record.id,
        record.guildId,
        record.userId,
        record.username,
        record.moderatorId,
        record.minutes,
        record.startedAt,
        record.expiresAt,
        'PENDING',
        new Date().toISOString(),
        JSON.stringify(record.roles),
        'TIMEOUT'
      ]]
    }
  });

  const range = response.data.updates?.updatedRange || '';
  const match = range.match(/!A(\d+)(?::|$)/i);

  if (match) return Number(match[1]);

  const records = await getRecords(api);
  const found = records.find(r => r.id === record.id);

  if (!found) {
    throw new Error('Không xác nhận được bản ghi sao lưu role');
  }

  return found.row;
}

async function setStatus(api, record, status) {
  await api.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `'${TAB}'!I${record.row}:J${record.row}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[status, new Date().toISOString()]]
    }
  });

  record.status = status;
}

function isOpen(record) {
  return [
    'PENDING',
    'ACTIVE',
    'WAITING_USER',
    'REVIEW'
  ].includes(record.status);
}

async function fetchMember(guild, userId) {
  try {
    return await guild.members.fetch({
      user: userId,
      force: true
    });
  } catch (error) {
    if (['10007', '10013'].includes(String(error.code))) {
      return null;
    }
    throw error;
  }
}

function getOriginalRoles(member) {
  return [...member.roles.cache.values()]
    .filter(role => role.id !== member.guild.id);
}

async function checkRestrictionRole(guild) {
  const role = await guild.roles.fetch(RESTRICT_ROLE_ID);

  if (!role || !role.editable || role.managed) {
    throw new Error(
      'Role Timeout không tồn tại hoặc Monaris không thể quản lý'
    );
  }

  if (role.permissions.has(PermissionFlagsBits.Administrator)) {
    throw new Error('Role Timeout không được có Administrator');
  }

  return role;
}

// Khôi phục role đã lưu mà không xóa các role mới
// do người quản trị cấp trong thời gian Timeout.
async function restoreRoles(member, record) {
  if (!record.rolesValid) {
    throw new Error('Dữ liệu role sao lưu không hợp lệ');
  }

  const valid = [];
  const missing = [];

  for (const id of record.roles) {
    if (id === RESTRICT_ROLE_ID) continue;

    const role = await member.guild.roles.fetch(id)
      .catch(() => null);

    if (!role || role.managed || !role.editable) {
      missing.push(id);
    } else {
      valid.push(id);
    }
  }

  if (valid.length) {
    await member.roles.add(
      valid,
      'Monaris: khôi phục role trước Timeout'
    );
  }

  if (member.roles.cache.has(RESTRICT_ROLE_ID)) {
    await member.roles.remove(
      RESTRICT_ROLE_ID,
      'Monaris: kết thúc Timeout'
    );
  } else {
    const refreshed = await fetchMember(
      member.guild,
      member.id
    );

    if (refreshed?.roles.cache.has(RESTRICT_ROLE_ID)) {
      await refreshed.roles.remove(
        RESTRICT_ROLE_ID,
        'Monaris: kết thúc Timeout'
      );
    }
  }

  return missing;
}

async function restoreExpired(api, record, guild) {
  const member = await fetchMember(guild, record.userId);

  if (!member) {
    if (record.status !== 'WAITING_USER') {
      await setStatus(api, record, 'WAITING_USER');
    }
    return;
  }

  if (!record.rolesValid) {
    await setStatus(api, record, 'REVIEW');
    log('Snapshot role lỗi, cần kiểm tra:', record.userId);
    return;
  }

  const nativeEnd =
    member.communicationDisabledUntilTimestamp || 0;

  // Không ghi đè một Timeout mới do moderator gia hạn.
  if (nativeEnd > Date.now() + 20000) {
    await setStatus(api, record, 'REVIEW');
    log('Có Timeout khác/gia hạn:', record.userId);
    return;
  }

  if (nativeEnd > Date.now() + 1000) {
    return;
  }

  const missing = await restoreRoles(member, record);

  await setStatus(
    api,
    record,
    missing.length ? 'DONE_PARTIAL' : 'DONE'
  );

  if (missing.length) {
    log('Role không thể khôi phục:', record.userId, missing);
  } else {
    log('Đã tự khôi phục toàn bộ role:', record.userId);
  }
}

async function checkTimeouts() {
  if (watcherRunning || !client.isReady()) return;
  watcherRunning = true;

  try {
    const api = await getApi();
    const records = await getRecords(api);

    for (const record of records) {
      if (
        record.guildId !== GUILD_ID ||
        !isOpen(record) ||
        record.status === 'REVIEW'
      ) continue;

      const key = `${record.guildId}:${record.userId}`;
      if (locks.has(key)) continue;

      const expires = Date.parse(record.expiresAt);

      if (!Number.isFinite(expires)) {
        await setStatus(api, record, 'REVIEW');
        continue;
      }

      if (
        record.status === 'PENDING' &&
        Date.now() - Date.parse(record.startedAt) < 45000
      ) continue;

      locks.add(key);

      try {
        const guild = await client.guilds.fetch(
          record.guildId
        );

        const member = await fetchMember(
          guild,
          record.userId
        );

        // PENDING cũ chỉ có thể tự phục hồi khi
        // role hạn chế đã thực sự được gán.
        if (record.status === 'PENDING') {
          if (!member?.roles.cache.has(RESTRICT_ROLE_ID)) {
            await setStatus(api, record, 'REVIEW');
            continue;
          }

          await setStatus(api, record, 'ACTIVE');
        }

        if (expires <= Date.now()) {
          await restoreExpired(api, record, guild);
        } else if (!member) {
          if (record.status !== 'WAITING_USER') {
            await setStatus(api, record, 'WAITING_USER');
          }
        } else if (
          !member.roles.cache.has(RESTRICT_ROLE_ID)
        ) {
          await setStatus(api, record, 'REVIEW');
          log('Role Timeout bị thay đổi:', record.userId);
        }
      } catch (error) {
        console.error(
          '[BanTime] Không thể xử lý:',
          record.userId,
          error.message
        );
      } finally {
        locks.delete(key);
      }
    }
  } catch (error) {
    console.error(
      '[BanTime] Không đọc được Google Sheets:',
      error.message
    );
  } finally {
    watcherRunning = false;
  }
}

// =====================================
// LỆNH /bantime
// =====================================

async function handleBanTime(interaction) {
  await interaction.deferReply({
    flags: MessageFlags.Ephemeral
  });

  const guild = interaction.guild;
  const user = interaction.options.getUser('user', true);
  const minutes = interaction.options.getInteger('phut', true);

  const owner = interaction.user.id === guild.ownerId;

  if (!require('../utils/bongPermission').isBong(interaction)) {
    return interaction.editReply(
      '⛔ Chỉ role Bông mới được dùng /bantime.'
    );
  }

  if (
    user.id === guild.ownerId ||
    user.id === interaction.user.id ||
    user.id === client.user.id
  ) {
    return interaction.editReply(
      '❌ Không thể Timeout tài khoản này.'
    );
  }

  if (!Number.isInteger(minutes) ||
      minutes < 1 || minutes > MAX_MINUTES) {
    return interaction.editReply(
      '❌ Thời gian phải từ 1 đến 40320 phút.'
    );
  }

  const key = `${guild.id}:${user.id}`;

  if (locks.has(key)) {
    return interaction.editReply(
      '⚠️ Đang xử lý yêu cầu khác cho thành viên này.'
    );
  }

  locks.add(key);

  try {
    const api = await getApi();
    const records = await getRecords(api);

    if (
      records.some(r =>
        r.guildId === guild.id &&
        r.userId === user.id &&
        isOpen(r)
      )
    ) {
      return interaction.editReply(
        '⚠️ Thành viên này đang có Timeout chưa hoàn tất.'
      );
    }

    const target = await fetchMember(guild, user.id);

    if (!target) {
      return interaction.editReply(
        '❌ Thành viên không còn trong server.'
      );
    }

    const me = await guild.members.fetchMe();

    if (
      !me.permissions.has(PermissionFlagsBits.ModerateMembers) ||
      !me.permissions.has(PermissionFlagsBits.ManageRoles)
    ) {
      return interaction.editReply(
        '❌ Monaris thiếu quyền Moderate Members hoặc Manage Roles.'
      );
    }

    await checkRestrictionRole(guild);

    if (!target.moderatable) {
      return interaction.editReply(
        '❌ Monaris không thể Timeout thành viên này. ' +
        'Kiểm tra Administrator và thứ bậc role.'
      );
    }

    const moderator = await fetchMember(
      guild,
      interaction.user.id
    );

    if (
      !owner &&
      moderator.roles.highest.comparePositionTo(
        target.roles.highest
      ) <= 0
    ) {
      return interaction.editReply(
        '❌ Bạn không thể Timeout thành viên có role ngang/cao hơn.'
      );
    }

    const originalRoles = getOriginalRoles(target);

    if (
      originalRoles.some(
        role => role.id === RESTRICT_ROLE_ID
      ) ||
      (target.communicationDisabledUntilTimestamp || 0) >
        Date.now()
    ) {
      return interaction.editReply(
        '⚠️ Thành viên đang bị hạn chế bởi một thao tác khác.'
      );
    }

    const blocked = originalRoles.filter(
      role => role.managed || !role.editable
    );

    if (blocked.length) {
      return interaction.editReply(
        '❌ Không thể tạm gỡ toàn bộ role: ' +
        blocked.map(r => r.name).join(', ')
      );
    }

    // Sao lưu role trước khi thao tác.
    const now = Date.now();

    const record = {
      id: interaction.id,
      guildId: guild.id,
      userId: user.id,
      username: user.username,
      moderatorId: interaction.user.id,
      minutes,
      startedAt: new Date(now).toISOString(),
      expiresAt: new Date(
        now + minutes * 60000
      ).toISOString(),
      roles: originalRoles.map(r => r.id),
      status: 'PENDING'
    };

    record.row = await appendRecord(api, record);

    let nativeApplied = false;

    try {
      // Không kick hoặc ban người chơi.
      await target.timeout(
        minutes * 60000,
        `Monaris /bantime ${record.id}`
      );

      nativeApplied = true;

      // Thay role hiện có bằng role hạn chế.
      await target.roles.set(
        [RESTRICT_ROLE_ID],
        `Monaris /bantime ${record.id}`
      );

    } catch (error) {
      // Hoàn tác nếu thao tác thất bại.
      let rollbackOK = true;

      if (nativeApplied) {
        try {
          await target.roles.set(
            record.roles,
            'Monaris: hoàn tác Timeout thất bại'
          );

          await target.timeout(
            null,
            'Monaris: hoàn tác Timeout'
          );
        } catch (rollbackError) {
          rollbackOK = false;
          console.error(
            '[BanTime] Khôi phục khẩn cấp thất bại:',
            rollbackError
          );
        }
      }

      await setStatus(
        api,
        record,
        rollbackOK ? 'FAILED' : 'REVIEW'
      ).catch(console.error);

      throw error;
    }

    let saved = true;

    try {
      await setStatus(api, record, 'ACTIVE');
    } catch (error) {
      saved = false;
      console.error(
        '[BanTime] Chưa cập nhật trạng thái ACTIVE:',
        error
      );
    }

    const endTimestamp = Math.floor(
      Date.parse(record.expiresAt) / 1000
    );

    return interaction.editReply(
      `✅ **Đã Timeout ${user.username}**\n` +
      `⏱️ Thời gian: ${minutes} phút\n` +
      `🔓 Hết hạn: <t:${endTimestamp}:F>\n` +
      `🛡️ Role hạn chế: <@&${RESTRICT_ROLE_ID}>\n` +
      '👀 Người chơi vẫn có thể đọc những kênh được cấp quyền xem.\n' +
      '📋 Role cũ đã được sao lưu.' +
      (saved ? '' : '\n⚠️ Cần kiểm tra trạng thái trên Sheet.')
    );

  } catch (error) {
    console.error('[BanTime] Lỗi Timeout:', error);

    return interaction.editReply(
      '❌ Timeout thất bại. Kiểm tra log [BanTime] ' +
      'và quyền role của Monaris.'
    ).catch(() => {});
  } finally {
    locks.delete(key);
  }
}

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'bantime') return;
  if (!interaction.inGuild()) return;
  if (interaction.guildId !== GUILD_ID) return;

  try {
    await handleBanTime(interaction);
  } catch (error) {
    console.error('[BanTime] Interaction:', error);

    if (!interaction.deferred && !interaction.replied) {
      await interaction.reply({
        content: '❌ Lệnh Timeout thất bại.',
        flags: MessageFlags.Ephemeral
      }).catch(() => {});
    }
  }
});

// Tự đăng ký lệnh. Không chỉnh sửa phần vote.
async function registerCommand() {
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    const commands = await guild.commands.fetch();
    const existing = commands.find(
      command => command.name === 'bantime'
    );

    const definition = BANTIME_SLASH_COMMANDS[0];

    if (!existing) {
      await guild.commands.create(definition);
      log('Đã đăng ký /bantime');
      return;
    }

    const currentPermission =
      existing.defaultMemberPermissions?.bitfield
        ?.toString() || '';

    const desiredPermission =
      PermissionFlagsBits.ModerateMembers.toString();

    if (
      existing.description !== definition.description ||
      currentPermission !== desiredPermission
    ) {
      await guild.commands.edit(existing.id, definition);
      log('Đã cập nhật /bantime sang Timeout');
    }
  } catch (error) {
    console.error(
      '[BanTime] Đăng ký lệnh thất bại:',
      error.message
    );
  }
}

function start() {
  const firstCheck = setTimeout(
    () => checkTimeouts().catch(console.error),
    5000
  );
  firstCheck.unref?.();

  const watcher = setInterval(
    () => checkTimeouts().catch(console.error),
    CHECK_MS
  );
  watcher.unref?.();

  const firstRegister = setTimeout(
    () => registerCommand().catch(console.error),
    20000
  );
  firstRegister.unref?.();

  const registrar = setInterval(
    () => registerCommand().catch(console.error),
    120000
  );
  registrar.unref?.();
}

if (client.isReady()) {
  start();
} else {
  client.once(Events.ClientReady, start);
}

module.exports = {
  BANTIME_SLASH_COMMANDS,
  checkTimeouts,
  RESTRICT_ROLE_ID
};
