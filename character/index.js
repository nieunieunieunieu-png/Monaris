
'use strict';

const {
  Events, SlashCommandBuilder, PermissionFlagsBits,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  EmbedBuilder, MessageFlags,
} = require('discord.js');

const client = require('../client');
const { getGoogleAuthClient } = require('../googleSheets/auth');

const SHEET = 'Character_Profiles';
const PREFIX = 'monaris:character:';
const MARKER = 'MONARIS_CHARACTER_REACTION_V2';
const EPH = { flags: MessageFlags.Ephemeral };



const CLASSES = [
  ['Tố Vấn', '1570279721751674992', 'tv_ToVan'],
  ['Thiết Y', '1570279893973864550', 'ty_ThietY'],
  ['Huyết Hà', '1570279793696571572', 'hh_HuyetHa'],
  ['Thần Tương', '1570279835769634867', 'tt_ThanTuong'],
  ['Cửu Linh', '1570279976777814066', 'cl_CuuLinh'],
  ['Toái Mộng', '1570280195573686415', 'tm_ToaiMong'],
  ['Long Ngâm', '1570280026027589723', 'ln_LongNgam'],
  ['Huyền Cơ', '1570280088035926176', 'hc'],
];



const COMMANDS = [
  new SlashCommandBuilder()
    .setName('bang-nhanvat')
    .setDescription('Đăng bảng chọn môn phái bằng emoji')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName('nhanvat')
    .setDescription('Xem hồ sơ nhân vật'),

  new SlashCommandBuilder()
    .setName('xoa-nhanvat')
    .setDescription('Xóa hồ sơ nhân vật'),
].map(x => x.toJSON());

const cooldown = new Map();

function mapping() {
  try {
    return JSON.parse(
      process.env.CHARACTER_CLASS_ROLE_IDS || '{}'
    );
  } catch {
    return {};
  }
}

function sheetId() {
  return process.env.CHARACTER_SPREADSHEET_ID ||
    process.env.GOOGLE_SHEET_ID ||
    process.env.MONARIS_KNOWLEDGE_SPREADSHEET_ID;
}

function safe(s) {
  return String(s || '').trim().slice(0, 80);
}

function display(s) {
  return String(s || '')
    .replace(/([\\*_`~|>])/g, '\\$1')
    .replace(/@/g, '@\u200b');
}

// ===== GOOGLE SHEETS =====

async function request(method, range, data) {
  const auth = await getGoogleAuthClient();

  if (!auth || !sheetId()) {
    throw new Error('Chưa cấu hình Google Sheets');
  }

  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/` +
    `${encodeURIComponent(sheetId())}/values/` +
    `${encodeURIComponent("'" + SHEET + "'!" + range)}`;

  const res = await auth.request({
    url,
    method,
    ...(method === 'GET'
      ? {}
      : { params: { valueInputOption: 'RAW' } }),
    ...(data ? { data } : {}),
  });

  return res.data;
}

async function find(userId) {
  const rows = (
    await request('GET', 'A2:I1000')
  ).values || [];

  const index = rows.findIndex(
    row => String(row[0]) === String(userId)
  );

  const empty = rows.findIndex(row => !row[0]);

  return {
    row: index >= 0 ? index + 2 : null,
    values: index >= 0 ? rows[index] : null,
    nextRow: empty >= 0 ? empty + 2 : rows.length + 2,
  };
}

async function save(user, name, className) {
  const found = await find(user.id);
  const row = found.row || found.nextRow;

  await request('PUT', `A${row}:I${row}`, {
    values: [[
      user.id,
      user.username,
      name,
      className,
      '',
      '',
      '',
      'Có',
      new Date().toISOString(),
    ]],
  });
}


 // ===== BẢNG REACTION =====

function panel(guild) {
  const lines = CLASSES.map(([className, emojiId, emojiName]) => {
    const emoji = guild.emojis.cache.get(emojiId);

    if (emoji) {
      return `${emoji.toString()} **${className}**`;
    }

    // Hien thi ten phai neu emoji khong ton tai
    return `**${className}**`;
  });

  return new EmbedBuilder()
    .setTitle('🎭 CHỌN MÔN PHÁI CỦA BẠN')
    .setDescription([
      'Nhấn vào **emoji môn phái** bên dưới để đăng ký.',
      '',
      ...lines,
      '',
      '📝 Sau khi chọn, Monaris sẽ gửi nút đăng ký.',
      '🎮 Bạn chỉ cần nhập **tên nhân vật Ingame**.',
      '✨ Monaris sẽ tự động cấp role môn phái.',
      '',
      'Dùng `/nhanvat` để xem hồ sơ.',
      'Dùng `/xoa-nhanvat` để xóa hồ sơ.'
    ].join('\n'))
    .setFooter({ text: MARKER })
    .setColor(0x9a76df);
}



function button(guildId, userId, index) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(
        `${PREFIX}open:${guildId}:${userId}:${index}`
      )
      .setLabel(`Đăng ký Ingame - ${CLASSES[index][0]}`)
      .setStyle(ButtonStyle.Primary)
  );
}

function modal(guildId, userId, index) {
  return new ModalBuilder()
    .setCustomId(
      `${PREFIX}submit:${guildId}:${userId}:${index}`
    )
    .setTitle(`Đăng ký - ${CLASSES[index][0]}`)
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('name')
          .setLabel('Tên nhân vật Ingame')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(80)
      )
    );
}

// ===== CẤP ROLE =====

 // ===== DOI BIET DANH THEO TEN INGAME =====

async function syncNickname(member, ingameName) {
  const nickname = String(ingameName || '').trim();

  if (!nickname) {
    return 'Tên Ingame không hợp lệ.';
  }

  if ([...nickname].length > 32) {
    return 'Tên Ingame dài hơn 32 ký tự, không thể đổi biệt danh.';
  }

  try {
    const botMember = await member.guild.members.fetchMe();

    if (!botMember.permissions.has(
      PermissionFlagsBits.ManageNicknames
    )) {
      return 'Monaris chưa có quyền Manage Nicknames.';
    }

    if (!member.manageable) {
      return 'Monaris không thể đổi biệt danh của thành viên này do thứ tự role hoặc quyền quản lý.';
    }

    if (member.nickname === nickname) {
      return 'Biệt danh đã trùng với tên Ingame.';
    }

    await member.setNickname(
      nickname,
      'Đồng bộ biệt danh khi đăng ký Ingame'
    );

    return `Đã đổi biệt danh thành ${nickname}.`;
  } catch (error) {
    console.error('[PickRole] Lỗi đổi biệt danh:', error);
    return `Không đổi được biệt danh: ${error.message}`;
  }
}

async function syncRole(member, className) {
  const map = mapping();
  const desiredId = map[className];

  if (!desiredId) {
    return 'Chưa cấu hình Discord Role cho môn phái này.';
  }

  const role = await member.guild.roles
    .fetch(String(desiredId))
    .catch(() => null);

  if (!role) {
    return 'Không tìm thấy role đã cấu hình.';
  }

  const bot = await member.guild.members.fetchMe();

  if (
    !bot.permissions.has(PermissionFlagsBits.ManageRoles) ||
    !role.editable
  ) {
    return 'Bot thiếu quyền cấp role hoặc role bot quá thấp.';
  }

  const classRoleIds = Object.values(map).map(String);

  const old = member.roles.cache.filter(
    r => classRoleIds.includes(r.id) && r.id !== role.id
  );

  if (old.size) {
    await member.roles.remove([...old.keys()]);
  }

  if (!member.roles.cache.has(role.id)) {
    await member.roles.add(role);
  }

  return `Đã cấp role ${role.name}.`;
}

// ===== NGƯỜI CHƠI THẢ EMOJI =====

client.on(Events.MessageReactionAdd, async (reaction, user) => {
  try {
    if (user.bot) return;

    if (reaction.partial) {
      reaction = await reaction.fetch();
    }

    const message = reaction.message;

    if (!message.guildId) return;

    if (message.partial) {
      await message.fetch();
    }

    if (message.author?.id !== client.user?.id) return;

    const validPanel = message.embeds?.some(
      e => e.footer?.text === MARKER
    );

    if (!validPanel) return;

    const index = CLASSES.findIndex(
      c => c[1] === reaction.emoji.id
    );

    if (index < 0) return;

    const key = `${message.guildId}:${user.id}`;
    const now = Date.now();

    if (now - (cooldown.get(key) || 0) < 12000) {
      return;
    }

    cooldown.set(key, now);

    if (cooldown.size > 2000) {
      cooldown.clear();
    }

    const row = button(message.guildId, user.id, index);

    const content =
      `⚔️ Bạn đã chọn **${CLASSES[index][0]}**.\n` +
      'Bấm nút bên dưới để nhập tên nhân vật Ingame.';

    try {
      await user.send({
        content,
        components: [row],
      });
    } catch {
      // Nếu người chơi chặn DM:
      // gửi nút ở kênh và tự xóa sau 2 phút.
      const notice = await message.channel.send({
        content:
          `<@${user.id}> Bạn đang tắt DM.\n` +
          `Bấm nút để đăng ký **${CLASSES[index][0]}**.\n` +
          'Chỉ bạn mới có thể sử dụng nút này.',
        components: [row],
        allowedMentions: { users: [user.id] },
      });

      const timer = setTimeout(
        () => notice.delete().catch(() => {}),
        120000
      );

      timer.unref?.();
    }
  } catch (error) {
    console.error('[CharacterProfiles] Reaction:', error);
  }
});

// ===== SLASH COMMAND / BUTTON / MODAL =====

client.on(Events.InteractionCreate, async i => {
  const isCommand =
    i.isChatInputCommand() &&
    ['bang-nhanvat', 'nhanvat', 'xoa-nhanvat']
      .includes(i.commandName);

  const isComponent =
    (i.isButton() || i.isModalSubmit()) &&
    i.customId.startsWith(PREFIX);

  if (!isCommand && !isComponent) return;

  try {
    if (isCommand && !i.inGuild()) {
      return i.reply('Lệnh này chỉ dùng trong server.');
    }

    // Đăng bảng emoji
    if (
      i.isChatInputCommand() &&
      i.commandName === 'bang-nhanvat'
    ) {
      if (!i.memberPermissions.has(
        PermissionFlagsBits.ManageGuild
      )) {
        return i.reply({
          content: 'Bạn không có quyền đăng bảng.',
          ...EPH,
        });
      }

      await i.deferReply(EPH);

      

      // Lay danh sach emoji cua server
      await i.guild.emojis.fetch();

console.log(
  `[PickRole] Server hiện tại: ${i.guild.name} (${i.guild.id})`
);

console.log(
  '[PickRole] Danh sách emoji bot nhìn thấy:'
);

for (const emoji of i.guild.emojis.cache.values()) {
  console.log(
    `- ${emoji.name} | ${emoji.id}`
  );
}


      const msg = await i.channel.send({
        embeds: [panel(i.guild)],
      });

      let success = 0;
      const failures = [];

      // Monaris tu tha tung emoji ben duoi bang
      for (const [className, emojiId] of CLASSES) {
        try {
          const emoji = i.guild.emojis.cache.get(emojiId);

          if (!emoji || !emoji.name) {
            failures.push(
              `${className}: Emoji khong ton tai trong server`
            );
            continue;
          }

          // Truyen emoji object, khong truyen ID rieng
          await msg.react(emoji);

          success++;

          console.log(
            `[PickRole] OK: ${className} - ${emoji.name}`
          );
        } catch (error) {
          failures.push(
            `${className}: ${error.message}`
          );

          console.error(
            `[PickRole] ERROR ${className}:`,
            error
          );
        }
      }

      return i.editReply([
        `Đã tạo bảng Pick Role.`,
        `Đã thêm ${success}/${CLASSES.length} emoji.`,
        failures.length
          ? `Lỗi:\n${failures.join('\n')}`
          : 'Tất cả emoji đã sẵn sàng!'
      ].join('\n'));
    }

    

    // Xem hồ sơ
    if (
      i.isChatInputCommand() &&
      i.commandName === 'nhanvat'
    ) {
      await i.deferReply(EPH);

      const profile = await find(i.user.id);

      if (!profile.values) {
        return i.editReply(
          'Bạn chưa đăng ký. Hãy thả emoji tại bảng môn phái.'
        );
      }

      return i.editReply([
        '🌸 **Hồ sơ nhân vật**',
        `🎮 Ingame: **${display(profile.values[2])}**`,
        `⚔️ Môn phái: **${display(profile.values[3])}**`,
        '',
        'Để cập nhật, hãy chọn lại môn phái ở bảng.',
      ].join('\n'));
    }

    // Xóa hồ sơ
    if (
      i.isChatInputCommand() &&
      i.commandName === 'xoa-nhanvat'
    ) {
      await i.deferReply(EPH);

      const found = await find(i.user.id);

      if (!found.row) {
        return i.editReply('Bạn chưa có hồ sơ.');
      }

      await request(
        'PUT',
        `A${found.row}:I${found.row}`,
        { values: [Array(9).fill('')] }
      );

      let status = '';

      try {
        const member = await i.guild.members.fetch(i.user.id);
        const ids = Object.values(mapping()).map(String);

        const old = member.roles.cache.filter(
          r => ids.includes(r.id)
        );

        if (old.size) {
          await member.roles.remove([...old.keys()]);
        }
      } catch (error) {
        status = ` Không gỡ được role: ${error.message}`;
      }

      return i.editReply('Đã xóa hồ sơ.' + status);
    }

    // Xử lý nút và form
    if (isComponent) {
      const parts = i.customId
        .slice(PREFIX.length)
        .split(':');

      const [action, guildId, userId, rawIndex] = parts;
      const index = Number(rawIndex);

      if (
        !['open', 'submit'].includes(action) ||
        !/^\d+$/.test(guildId || '') ||
        !/^\d+$/.test(userId || '') ||
        !Number.isInteger(index) ||
        !CLASSES[index]
      ) {
        return i.reply({
          content: 'Thông tin đăng ký không hợp lệ.',
          ...(i.inGuild() ? EPH : {}),
        });
      }

      if (i.user.id !== userId) {
        return i.reply({
          content: 'Nút này chỉ dành cho người đã thả emoji.',
          ...(i.inGuild() ? EPH : {}),
        });
      }

      // Bấm nút -> mở form
      if (action === 'open' && i.isButton()) {
        return i.showModal(
          modal(guildId, userId, index)
        );
      }

      // Gửi form -> lưu hồ sơ và cấp role
      if (action === 'submit' && i.isModalSubmit()) {
        await i.deferReply(i.inGuild() ? EPH : {});

        const name = safe(
          i.fields.getTextInputValue('name')
        );

        if (!name) {
          return i.editReply(
            'Vui lòng nhập tên nhân vật Ingame.'
          );
        }

        const guild = await client.guilds.fetch(guildId);
        const member = await guild.members.fetch(i.user.id);

        await save(i.user, name, CLASSES[index][0]);

        
        let roleStatus;

        try {
          roleStatus = await syncRole(
            member,
            CLASSES[index][0]
          );
        } catch (error) {
          roleStatus =
            'Lưu hồ sơ thành công nhưng cấp role thất bại: ' +
            error.message;
        }

        // Chi doi ten khi nguoi choi gui form dang ky
        const nicknameStatus = await syncNickname(member, name);

        return i.editReply([
          '✅ **Đăng ký nhân vật thành công!**',
          '',
          `🎮 Ingame: **${display(name)}**`,
          `⚔️ Môn phái: **${CLASSES[index][0]}**`,
          '',
          `🎭 ${roleStatus}`,
          `📝 ${nicknameStatus}`,
        ].join('\n'));

      }
    }
  } catch (error) {
    console.error('[CharacterProfiles]', error);

    const msg =
      'Không thể xử lý. Kiểm tra Google Sheets, ' +
      'quyền bot và log CMD.';

    if (i.deferred || i.replied) {
      await i.editReply(msg).catch(() => {});
    } else {
      await i.reply({
        content: msg,
        ...(i.inGuild() ? EPH : {}),
      }).catch(() => {});
    }
  }
});

module.exports = {
  CHARACTER_SLASH_COMMANDS: COMMANDS,
};
