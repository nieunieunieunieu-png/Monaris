
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const {
  getMechBossData,
  TTL
} = require('../googleSheets/mechBossSheet');

const GUILD =
  process.env.DISCORD_GUILD_ID || '1566691700850688013';

const FORUM =
  process.env.MECH_BOSS_FORUM_CHANNEL_ID ||
  '1570311769123979424';

const STATE = path.join(
  __dirname,
  '..',
  'data',
  'mech-boss-forum.json'
);

const PREFIX = 'mb1:';
const mentions = { parse: [], repliedUser: false };

// ==================================================
// 1. NHAN DIEN LENH
// ==================================================

function isMechRequest(message) {
  if (
    message.guildId !== GUILD ||
    message.author?.bot ||
    message.webhookId
  ) {
    return false;
  }

  const command = String(message.content || '')
    .trim()
    .toLowerCase();

  return (
    command === 'mechboss?' ||
    command === 'mon!mech sync'
  );
}

// ==================================================
// 2. NOI DUNG BOSS
// ==================================================

function splitText(text, size = 1750) {
  const chunks = [];
  let rest = String(text || '');

  while (rest.length > size) {
    let cut = rest.lastIndexOf('\n', size);

    if (cut < size / 2) cut = size;

    chunks.push(rest.slice(0, cut));
    rest = rest.slice(cut).replace(/^\n/, '');
  }

  if (rest) chunks.push(rest);

  return chunks.length
    ? chunks
    : ['Chưa có nội dung.'];
}

function bossText(data, boss) {
  const dungeon = data.dungeons.find(
    d => d.id === boss.dungeonId
  );

  const sections = data.mechanics.filter(
    m => m.bossId === boss.id
  );

  const title =
    '# ' +
    (boss.emoji ? boss.emoji + ' ' : '') +
    boss.name;

  const subtitle =
    '**' +
    (dungeon?.name || boss.dungeonId) +
    ' · Boss ' +
    boss.order +
    '**';

  const details = sections.length
    ? sections.map(
        m =>
          '## ' + (m.title || 'Cơ chế') +
          '\n' + m.content
      ).join('\n\n')
    : 'Chưa có cơ chế ở trạng thái PUBLISHED.';

  return title + '\n' + subtitle + '\n\n' + details;
}

// ==================================================
// 3. NUT MO MECH BOSS CONG KHAI
// ==================================================

function openButtonPanel() {
  return {
    content:
      '⚔️ **THƯ VIỆN MECH BOSS**\n' +
      'Bấm nút bên dưới để chọn phó bản và xem cơ chế Boss.\n' +
      '🔒 Menu sau khi bấm chỉ hiển thị cho bạn.',
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 1,
            label: '⚔️ Chọn Mech Boss',
            custom_id: PREFIX + 'open'
          }
        ]
      }
    ],
    allowedMentions: mentions
  };
}

const button = (label, id) => ({
  type: 2,
  style: 2,
  label,
  custom_id: PREFIX + id
});

// ==================================================
// 4. MENU CHON PHO BAN VA BOSS
// ==================================================

function picker(items, title, action, page = 0, back = false) {
  const count = Math.max(
    1,
    Math.ceil(items.length / 25)
  );

  page = Math.max(
    0,
    Math.min(count - 1, page)
  );

  const components = [];

  if (items.length) {
    components.push({
      type: 1,
      components: [
        {
          type: 3,
          custom_id: PREFIX + action,
          placeholder: title.slice(0, 150),
          min_values: 1,
          max_values: 1,
          options: items
            .slice(page * 25, (page + 1) * 25)
            .map(item => ({
              label: item.name.slice(0, 100),
              value: item.id
            }))
        }
      ]
    });
  }

  const nav = [];

  const pager = action === 'd'
    ? 'dp'
    : 'bp:' + action.slice(2);

  if (page > 0) {
    nav.push(
      button('Trang trước', pager + ':' + (page - 1))
    );
  }

  if (page + 1 < count) {
    nav.push(
      button('Trang sau', pager + ':' + (page + 1))
    );
  }

  if (back) {
    nav.push(
      button('Chọn phó bản', 'home')
    );
  }

  if (nav.length) {
    components.push({
      type: 1,
      components: nav
    });
  }

  return {
    content:
      '**' + title + '**' +
      (
        count > 1
          ? ' — trang ' + (page + 1) + '/' + count
          : ''
      ) +
      (
        items.length
          ? ''
          : '\nChưa có dữ liệu PUBLISHED.'
      ),
    components,
    allowedMentions: mentions
  };
}

function dungeonMenu(data, page = 0) {
  return picker(
    data.dungeons,
    '🏯 Chọn phó bản',
    'd',
    page
  );
}

function bossMenu(data, dungeonId, page = 0) {
  const dungeon = data.dungeons.find(
    d => d.id === dungeonId
  );

  const bosses = data.bosses.filter(
    b => b.dungeonId === dungeonId
  );

  return picker(
    bosses,
    'Chọn Boss · ' + (dungeon?.name || dungeonId),
    'b:' + dungeonId,
    page,
    true
  );
}

function bossPage(data, bossId, page = 0) {
  const boss = data.bosses.find(
    b => b.id === bossId
  );

  if (!boss) {
    return {
      content:
        'Boss này đã được gỡ hoặc chưa PUBLISHED.',
      components: [],
      allowedMentions: mentions
    };
  }

  const chunks = splitText(
    bossText(data, boss)
  );

  page = Math.max(
    0,
    Math.min(chunks.length - 1, page)
  );

  const nav = [];

  if (page > 0) {
    nav.push(
      button(
        'Trang trước',
        'v:' + bossId + ':' + (page - 1)
      )
    );
  }

  if (page + 1 < chunks.length) {
    nav.push(
      button(
        'Trang sau',
        'v:' + bossId + ':' + (page + 1)
      )
    );
  }

  nav.push(
    button(
      'Chọn Boss khác',
      'bp:' + boss.dungeonId + ':0'
    )
  );

  return {
    content:
      chunks[page] +
      (
        chunks.length > 1
          ? '\n\n*Trang ' +
            (page + 1) + '/' + chunks.length + '*'
          : ''
      ),
    components: [
      {
        type: 1,
        components: nav
      }
    ],
    allowedMentions: mentions
  };
}

// ==================================================
// 5. LUU TRANG THAI FORUM
// ==================================================

function readState() {
  try {
    return JSON.parse(
      fs.readFileSync(STATE, 'utf8')
    );
  } catch (error) {
    if (error.code === 'ENOENT') return {};

    throw new Error(
      'File data/mech-boss-forum.json bị lỗi. ' +
      'Không tự tạo lại để tránh trùng bài.'
    );
  }
}

function saveState(state) {
  fs.mkdirSync(
    path.dirname(STATE),
    { recursive: true }
  );

  fs.writeFileSync(
    STATE + '.tmp',
    JSON.stringify(state, null, 2),
    'utf8'
  );

  fs.renameSync(
    STATE + '.tmp',
    STATE
  );
}

const hash = text =>
  crypto.createHash('sha256')
    .update(text)
    .digest('hex');

// ==================================================
// 6. DONG BO BAI BOSS LEN FORUM
// ==================================================

function createForumSync(
  client,
  { load = readState, save = saveState } = {}
) {
  let running = false;

  return async function sync(data) {
    if (running) return;

    running = true;

    try {
      const forum = await client.channels.fetch(FORUM);

      if (
        !forum ||
        forum.type !== 15 ||
        forum.guildId !== GUILD
      ) {
        throw new Error(
          'Kênh Mech Boss không phải Forum hợp lệ.'
        );
      }

      const state = load();
      let threads;

      async function discover() {
        if (threads) return threads;

        threads = [
          ...(await forum.threads.fetchActive()).threads.values()
        ];

        let before;

        for (let i = 0; i < 50; i++) {
          const batch = await forum.threads.fetchArchived({
            limit: 100,
            ...(before ? { before } : {})
          });

          threads.push(...batch.threads.values());

          if (!batch.hasMore) return threads;

          const last = batch.threads.last();
          before = last?.archiveTimestamp;

          if (!before) {
            throw new Error(
              'Không phân trang được Forum.'
            );
          }
        }

        throw new Error(
          'Forum quá lớn để khôi phục an toàn.'
        );
      }

      // Đồng bộ từng Boss.
      for (const boss of data.bosses) {
        const key = FORUM + ':' + boss.id;

        const title = (
          '[MB:' + boss.id + '] ' +
          (boss.emoji ? boss.emoji + ' ' : '') +
          boss.name
        ).slice(0, 100);

        const chunks = splitText(
          bossText(data, boss)
        );

        const digest = hash(
          JSON.stringify({ title, chunks })
        );

        let entry = state[key];
        let thread;

        if (entry?.threadId) {
          try {
            thread = await client.channels.fetch(
              entry.threadId
            );
          } catch (error) {
            if (error.code !== 10003) throw error;
          }
        }

        if (
          thread &&
          (
            thread.parentId !== FORUM ||
            thread.ownerId !== client.user.id
          )
        ) {
          throw new Error(
            'Bài Forum không thuộc Monaris.'
          );
        }

        if (!thread) {
          thread = (await discover()).find(
            t =>
              t.ownerId === client.user.id &&
              t.name.startsWith('[MB:' + boss.id + '] ')
          );

          if (thread) {
            const starter =
              await thread.fetchStarterMessage();

            if (
              starter?.author.id !== client.user.id
            ) {
              throw new Error(
                'Không xác nhận được chủ bài.'
              );
            }

            entry = {
              threadId: thread.id,
              messageIds: [starter.id],
              hash: null
            };
          } else {
            const tags = (
              process.env.MECH_BOSS_FORUM_TAG_IDS || ''
            )
              .split(',')
              .map(x => x.trim())
              .filter(Boolean);

            thread = await forum.threads.create({
              name: title,
              autoArchiveDuration: 10080,
              ...(tags.length ? { appliedTags: tags } : {}),
              message: {
                content: chunks[0],
                allowedMentions: mentions
              }
            });

            entry = {
              threadId: thread.id,
              messageIds: [thread.id],
              hash: null
            };
          }

          state[key] = entry;
          save(state);
        }

        if (entry.hash === digest) continue;

        if (thread.locked) {
          throw new Error(
            'Bài ' + boss.id + ' đang khóa.'
          );
        }

        if (thread.archived) {
          await thread.setArchived(false);
        }

        if (thread.name !== title) {
          await thread.setName(title);
        }

        for (let i = 0; i < chunks.length; i++) {
          let msg;

          if (entry.messageIds[i]) {
            try {
              msg = await thread.messages.fetch(
                entry.messageIds[i]
              );
            } catch (error) {
              if (error.code !== 10008) throw error;
            }
          }

          if (msg) {
            if (msg.author.id !== client.user.id) {
              throw new Error(
                'Không sửa tin nhắn của người khác.'
              );
            }

            if (msg.content !== chunks[i]) {
              await msg.edit({
                content: chunks[i],
                allowedMentions: mentions
              });
            }
          } else {
            msg = await thread.send({
              content: chunks[i],
              allowedMentions: mentions
            });

            entry.messageIds[i] = msg.id;
            save(state);
          }
        }

        // Xóa phần nội dung cũ dư ra.
        for (
          const messageId of entry.messageIds.slice(
            chunks.length
          )
        ) {
          try {
            const msg = await thread.messages.fetch(
              messageId
            );

            if (msg.author.id === client.user.id) {
              await msg.delete();
            }
          } catch (error) {
            if (error.code !== 10008) throw error;
          }
        }

        entry.messageIds =
          entry.messageIds.slice(0, chunks.length);

        entry.hash = digest;
        entry.withdrawn = false;

        save(state);
      }

      // Chỉ thu hồi bài Boss được quản lý.
      // Không động tới bài menu cũ hoặc bình luận.
      const active = new Set(
        data.bosses.map(b => FORUM + ':' + b.id)
      );

      for (const [key, entry] of Object.entries(state)) {
        if (!key.startsWith(FORUM + ':')) continue;

        // Bỏ qua bài thư viện từ phiên bản trước.
        if (key === FORUM + ':__hub__') continue;

        if (
          active.has(key) ||
          entry.withdrawn
        ) {
          continue;
        }

        let thread;

        try {
          thread = await client.channels.fetch(
            entry.threadId
          );
        } catch (error) {
          if (error.code !== 10003) throw error;
        }

        if (!thread) {
          delete state[key];
          save(state);
          continue;
        }

        if (
          thread.ownerId !== client.user.id ||
          thread.parentId !== FORUM ||
          thread.locked
        ) {
          continue;
        }

        if (thread.archived) {
          await thread.setArchived(false);
        }

        for (
          const [i, messageId] of
          (entry.messageIds || []).entries()
        ) {
          try {
            const msg = await thread.messages.fetch(
              messageId
            );

            if (msg.author.id !== client.user.id) {
              continue;
            }

            if (i === 0) {
              await msg.edit({
                content:
                  'Hướng dẫn này đã ngừng công bố ' +
                  'trong Google Sheets.',
                allowedMentions: mentions
              });
            } else {
              await msg.delete();
            }
          } catch (error) {
            if (error.code !== 10008) throw error;
          }
        }

        entry.messageIds = (
          entry.messageIds || []
        ).slice(0, 1);

        entry.withdrawn = true;
        entry.hash = null;

        save(state);
      }

      return {
        bosses: data.bosses.length
      };
    } finally {
      running = false;
    }
  };
}

// ==================================================
// 7. KHOI DONG MODULE
// ==================================================

function install(client) {
  if (client.__monarisMechBossInstalled) return;

  client.__monarisMechBossInstalled = true;

  const sync = createForumSync(client);
  let refreshPending;

  async function refresh() {
    if (!refreshPending) {
      refreshPending = (async () => {
        const data = await getMechBossData({
          force: true
        });

        console.log(
          '[MechBoss] ' +
          data.dungeons.length + ' phó bản, ' +
          data.bosses.length + ' Boss, ' +
          data.mechanics.length + ' phần cơ chế.'
        );

        if (
          process.env.MECH_BOSS_FORUM_SYNC !== 'false'
        ) {
          await sync(data);
        }

        return data;
      })().finally(() => {
        refreshPending = null;
      });
    }

    return refreshPending;
  }

  const cooldown = new Map();

  // ==================================================
  // 8. LENH MECHBOSS?
  // ==================================================

  client.on('messageCreate', async message => {
    if (!isMechRequest(message)) return;

    const command = message.content
      .trim()
      .toLowerCase();

    // Lệnh đồng bộ dành riêng quản trị.
    if (command === 'mon!mech sync') {
      if (!require('../utils/bongPermission').isBong(message)) {
        await message.reply({
          content:
            'Chỉ quản trị mới được đồng bộ Mech Boss.',
          allowedMentions: mentions
        }).catch(() => {});

        return;
      }

      try {
        await refresh();

        await message.reply({
          content:
            '✅ Đã đọc lại Google Sheets và đồng bộ Mech Boss.',
          allowedMentions: mentions
        });
      } catch (error) {
        console.error(
          '[MechBoss] Sync:',
          error.message
        );

        await message.reply({
          content:
            'Không thể đồng bộ Mech Boss. ' +
            'Kiểm tra CMD.',
          allowedMentions: mentions
        }).catch(() => {});
      }

      return;
    }

    // Chỉ lệnh mechboss? mới đi tới đây.
    const key =
      message.channelId + ':' + message.author.id;

    if (
      Date.now() - (cooldown.get(key) || 0) < 10000
    ) {
      return;
    }

    cooldown.set(key, Date.now());

    if (cooldown.size > 1000) {
      for (const [id, timestamp] of cooldown) {
        if (Date.now() - timestamp > 60000) {
          cooldown.delete(id);
        }
      }
    }

    try {
      // Kiểm tra dữ liệu Boss đã sẵn sàng.
      await getMechBossData();

      // Chỉ gửi 1 nút, không gửi danh sách
      // phó bản công khai.
      const menuMessage = await message.reply(
        openButtonPanel()
      );

      // Tự xóa nút sau 60 giây.
      const timer = setTimeout(() => {
        menuMessage.delete().catch(() => {});
      }, 60000);

      timer.unref?.();

    } catch (error) {
      console.error(
        '[MechBoss] Open:',
        error.message
      );

      await message.reply({
        content:
          'Chưa tải được Mech Boss. ' +
          'Vui lòng thử lại sau.',
        allowedMentions: mentions
      }).catch(() => {});
    }
  });

  // ==================================================
  // 9. MENU RIENG TU EPHEMERAL
  // ==================================================

  client.on('interactionCreate', async interaction => {
    if (
      !interaction.customId?.startsWith(PREFIX) ||
      interaction.guildId !== GUILD
    ) {
      return;
    }

    if (
      !interaction.isButton() &&
      !interaction.isStringSelectMenu()
    ) {
      return;
    }

    try {
      const [op, arg, page] = interaction.customId
        .slice(PREFIX.length)
        .split(':');

      // Nút công khai -> menu riêng.
      // Các nút trong menu riêng -> cập nhật
      // chính menu của người đang bấm.
      const isPrivate = Boolean(
        interaction.message?.flags?.has?.(64)
      );

      if (op === 'open' || !isPrivate) {
        await interaction.deferReply({
          flags: 64
        });
      } else {
        await interaction.deferUpdate();
      }

      const data = await getMechBossData();

      let result;

      if (op === 'open' || op === 'home') {
        result = dungeonMenu(data);

      } else if (op === 'dp') {
        result = dungeonMenu(
          data,
          Number(arg) || 0
        );

      } else if (op === 'd') {
        result = bossMenu(
          data,
          interaction.values?.[0]
        );

      } else if (op === 'b') {
        result = bossPage(
          data,
          interaction.values?.[0]
        );

      } else if (op === 'bp') {
        result = bossMenu(
          data,
          arg,
          Number(page) || 0
        );

      } else if (op === 'v') {
        result = bossPage(
          data,
          arg,
          Number(page) || 0
        );

      } else {
        result = {
          content:
            'Menu không hợp lệ. ' +
            'Hãy gõ mechboss? để mở lại.',
          components: [],
          allowedMentions: mentions
        };
      }

      await interaction.editReply(result);

    } catch (error) {
      console.error(
        '[MechBoss] Interaction:',
        error.message
      );

      const payload = {
        content:
          'Không thể tải dữ liệu Boss. ' +
          'Vui lòng thử lại.',
        components: [],
        allowedMentions: mentions
      };

      if (interaction.deferred) {
        await interaction.editReply(payload)
          .catch(() => {});
      } else if (!interaction.replied) {
        await interaction.reply({
          ...payload,
          flags: 64
        }).catch(() => {});
      }
    }
  });

  // ==================================================
  // 10. TU DONG DONG BO GOOGLE SHEETS
  // ==================================================

  const start = () => {
    refresh().catch(error => {
      console.error(
        '[MechBoss] Khởi động:',
        error.message
      );
    });

    const timer = setInterval(
      () => refresh().catch(error => {
        console.error(
          '[MechBoss] Đồng bộ:',
          error.message
        );
      }),
      TTL
    );

    timer.unref?.();
  };

  if (client.isReady()) {
    start();
  } else {
    client.once('clientReady', start);
  }
}

// ==================================================
// 11. EXPORT
// ==================================================

module.exports = {
  install,
  isMechRequest,
  splitText,
  bossText,
  dungeonMenu,
  bossMenu,
  bossPage,
  createForumSync,
  openButtonPanel
};

if (process.env.MONARIS_MECH_TEST !== '1') {
  install(require('../client'));
}
