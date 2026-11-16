
'use strict';

// ===== welcome/index.js =====
// Tu dong gan role, gui anh chao mung va tam biet thanh vien.

const { Events, AttachmentBuilder } = require('discord.js');
const client = require('../client');

const {
  WELCOME_GUILD_ID,
  WELCOME_ROLE_ID,
  WELCOME_CHANNEL_ID,
  WELCOME_ENABLED,
  FEEDBACK_CHANNEL_ID,
  WELCOME_NAME_WAIT_MS,
  WELCOME_NAME_MAX_CHECKS,
} = require('../config');

const { runRenderQueue } = require('../utils/renderQueue');
const { renderWelcomeCard, FAREWELL_QUIPS } = require('./card');

// ===== CAU HINH KENH HUONG DAN =====

// ID kenh chon mon phai
const PICK_ROLE_CHANNEL_ID =
  process.env.PICK_ROLE_CHANNEL_ID ||
  '1570260630919979179';

// ID kenh chon mau
const PICK_COLOR_CHANNEL_ID =
  process.env.PICK_COLOR_CHANNEL_ID ||
  '1570277180234145792';

// ===== LOI CHAO THANH VIEN MOI =====

function buildWelcomeText(userId, serverName) {
  const roleLine = PICK_ROLE_CHANNEL_ID
    ? `⚔️ **Bước 1:** Chọn môn phái và đăng ký nhân vật tại <#${PICK_ROLE_CHANNEL_ID}>`
    : '';

  const colorLine = PICK_COLOR_CHANNEL_ID
    ? `🎨 **Bước 2:** Chọn màu tên yêu thích tại <#${PICK_COLOR_CHANNEL_ID}>`
    : '';

  return [
    `🎉 Chào mừng <@${userId}> đến với **${serverName}**!`,
    '',
    '🌸 **Bắt đầu hành trình của bạn:**',
    roleLine,
    colorLine,
    '',
    '✨ Chúc bạn có những trải nghiệm vui vẻ cùng mọi người!'
  ].filter(Boolean).join('\n');
}

// ===== TU DONG GAN ROLE =====

async function assignWelcomeRole(member) {
  if (!WELCOME_ROLE_ID) return;

  if (member.roles.cache.has(WELCOME_ROLE_ID)) return;

  try {
    await member.roles.add(
      WELCOME_ROLE_ID,
      'Tự gán role khi thành viên vào server'
    );

    console.log(
      `[welcome] Đã gán role ${WELCOME_ROLE_ID} cho ${member.user.tag} (${member.id}).`
    );
  } catch (error) {
    const hint =
      error.code === 50013
        ? ' — kiểm tra quyền Manage Roles và thứ tự role của bot'
        : error.code === 10011
          ? ' — role không tồn tại trong server'
          : '';

    console.error(
      `[welcome] Không gán được role ${WELCOME_ROLE_ID} cho ${member.id}: ${error.message}${hint}`
    );
  }
}

// ===== TIM KENH CHAO MUNG =====

async function resolveWelcomeChannel(guild) {
  const ids = [
    WELCOME_CHANNEL_ID,
    guild.systemChannelId,
    FEEDBACK_CHANNEL_ID,
  ].filter(Boolean);

  for (const id of ids) {
    try {
      const channel =
        guild.channels.cache.get(id) ||
        (await guild.channels.fetch(id));

      if (
        channel &&
        typeof channel.isTextBased === 'function' &&
        channel.isTextBased() &&
        !channel.isVoiceBased()
      ) {
        return channel;
      }
    } catch (_) {
      // Thu kenh tiep theo
    }
  }

  return null;
}

// ===== XU LY TEN THANH VIEN =====

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function nameOf(member) {
  return (
    member.nickname ||
    (member.user &&
      (member.user.globalName || member.user.username)) ||
    member.displayName ||
    ''
  );
}

async function fetchSettledMember(member) {
  let current = member;

  const maxChecks = Math.max(
    0,
    Number(WELCOME_NAME_MAX_CHECKS) || 0
  );

  const waitMs = Math.max(
    0,
    Number(WELCOME_NAME_WAIT_MS) || 0
  );

  for (let i = 0; i < maxChecks; i++) {
    if (current.nickname) break;

    await sleep(waitMs);

    try {
      current = await member.guild.members.fetch({
        user: member.id,
        force: true,
      });
    } catch (_) {
      break;
    }
  }

  return current;
}

// ===== GUI LOI CHAO VA ANH =====

async function sendWelcome(joined) {
  const member = await fetchSettledMember(joined);

  const channel = await resolveWelcomeChannel(member.guild);

  if (!channel) {
    console.error(
      '[welcome] Không tìm được kênh chào mừng.'
    );
    return;
  }

  const serverName = member.guild.name;

  const content = buildWelcomeText(
    member.id,
    serverName
  );

  const allowedMentions = {
    users: [member.id],
  };

  let files = [];

  try {
    const png = await runRenderQueue(() =>
      renderWelcomeCard({
        displayName: nameOf(member),
        serverName: serverName,
        avatarUrl: member.displayAvatarURL({
          extension: 'png',
          size: 256,
          forceStatic: true,
        }),
      })
    );

    files = [
      new AttachmentBuilder(png, {
        name: 'chao-mung.png',
      }),
    ];
  } catch (error) {
    console.error(
      '[welcome] Vẽ ảnh chào lỗi, gửi tin chữ thay thế:',
      error.message
    );
  }

  await channel.send({
    content,
    files,
    allowedMentions,
  });
}

// ===== SU KIEN THANH VIEN VAO SERVER =====

client.on(Events.GuildMemberAdd, async (member) => {
  try {
    if (!WELCOME_ENABLED) return;

    if (
      !member.guild ||
      member.guild.id !== WELCOME_GUILD_ID
    ) {
      return;
    }

    if (member.user.bot) return;

    // Gan role truoc, loi gan role khong chan loi chao.
    await assignWelcomeRole(member);

    // Cong tac bat/tat loi chao tren website.
    if (
      !require('../features').isEnabled(
        'chaothanhvien'
      )
    ) {
      return;
    }

    await sendWelcome(member);
  } catch (error) {
    console.error(
      '[welcome] Lỗi xử lý thành viên mới:',
      error.message
    );
  }
});

// ===== LOI TAM BIET =====

function buildFarewellText(
  displayName,
  quip,
  serverName
) {
  const safe =
    String(displayName || '')
      .replace(/[*_`~|>@#]/g, '')
      .slice(0, 60)
      .trim() || 'Một huynh đệ';

  const quips = Array.isArray(FAREWELL_QUIPS)
    ? FAREWELL_QUIPS
    : [];

  const tail =
    quip ||
    (quips.length
      ? quips[Math.floor(Math.random() * quips.length)]
      : 'Hẹn gặp lại nhé!');

  return `👋 **${safe}** đã rời **${serverName || 'server'}**. ${tail}`;
}

// ===== SU KIEN THANH VIEN ROI SERVER =====

client.on(Events.GuildMemberRemove, async (member) => {
  try {
    if (!WELCOME_ENABLED) return;

    if (
      !require('../features').isEnabled(
        'tambietthanhvien'
      )
    ) {
      return;
    }

    if (
      !member.guild ||
      member.guild.id !== WELCOME_GUILD_ID
    ) {
      return;
    }

    if (member.user && member.user.bot) return;

    const channel = await resolveWelcomeChannel(
      member.guild
    );

    if (!channel) return;

    const name = nameOf(member);
    const serverName = member.guild.name;

    const quips = Array.isArray(FAREWELL_QUIPS)
      ? FAREWELL_QUIPS
      : [];

    const quip = quips.length
      ? quips[Math.floor(Math.random() * quips.length)]
      : 'Hẹn gặp lại nhé!';

    let files = [];

    // Neu anh loi, gui tin chu day du.
    let content = buildFarewellText(
      name,
      quip,
      serverName
    );

    try {
      const png = await runRenderQueue(() =>
        renderWelcomeCard({
          mode: 'farewell',
          displayName: name,
          serverName: serverName,
          quip: quip,
          avatarUrl: member.displayAvatarURL({
            extension: 'png',
            size: 256,
            forceStatic: true,
          }),
        })
      );

      files = [
        new AttachmentBuilder(png, {
          name: 'tam-biet.png',
        }),
      ];

      // Anh da co cau chuc, tin nhan ngan gon.
      const safeName =
        String(name || '')
          .replace(/[*_`~|>@#]/g, '')
          .slice(0, 60)
          .trim() || 'Một huynh đệ';

      content =
        `👋 **${safeName}** đã rời **${serverName}**.`;
    } catch (error) {
      console.error(
        '[welcome] Vẽ ảnh tạm biệt lỗi, gửi tin chữ thay thế:',
        error.message
      );
    }

    await channel.send({
      content,
      files,
      allowedMentions: {
        parse: [],
      },
    });
  } catch (error) {
    console.error(
      '[welcome] Lỗi gửi lời tạm biệt:',
      error.message
    );
  }
});

// ===== EXPORT =====

module.exports = {
  buildWelcomeText,
  buildFarewellText,
};
