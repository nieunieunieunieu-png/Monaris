// ===== Nhật ký THÀNH VIÊN — các sự kiện ngoài tin nhắn (gửi vào MEMBER_SERVER_LOG_CHANNEL_ID) =====
//   🎙️ vào/rời/chuyển voice (MEMBER_LOG_VOICE) · 😀 thả/gỡ reaction (MEMBER_LOG_REACTIONS, trừ tin vote scrim/bang chiến đã có log riêng)
//   📥 vào server · 📤 rời server/bị kick · 🔨 ban/gỡ ban · 🏷️ đổi biệt danh · 🖼️ đổi avatar server · 🎭 đổi role · ⏳ timeout (MEMBER_LOG_MEMBERS)
//   📁 tạo / xoá / đổi tên / đổi mô tả kênh (MEMBER_LOG_CHANNELS)
// Chỉ lắng nghe, không đổi luồng xử lý của tính năng nào. Cần quyền View Audit Log để biết ai kick/ban (không có thì chỉ ghi sự kiện).
const { Events } = require('discord.js');
const client = require('../client');
const {
  ACTIVITY_LOG_ENABLED,
  MEMBER_LOG_ENABLED,
  MEMBER_LOG_VOICE,
  MEMBER_LOG_REACTIONS,
  MEMBER_LOG_MEMBERS,
  MEMBER_LOG_CHANNELS,
  MEMBER_SERVER_LOG_CHANNEL_ID,
  AUTOVOTE_ROLE_ID,
} = require('../config');
const { scrimData, bcData } = require('../state');
const { logActivity, esc, clip, who } = require('./index');
const { skipChannel } = require('./memberLog');

const log = (text) => logActivity(text, 500, MEMBER_SERVER_LOG_CHANNEL_ID);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const safe = (label, fn) => (...args) => {
  try {
    const r = fn(...args);
    if (r && typeof r.catch === 'function') r.catch((error) => console.error(`[ActivityLog] Lỗi ghi ${label}:`, error.message));
  } catch (error) {
    console.error(`[ActivityLog] Lỗi ghi ${label}:`, error.message);
  }
};

// Tìm người thực hiện trong Audit Log (type: 20 = MEMBER_KICK, 22 = MEMBER_BAN_ADD, 23 = MEMBER_BAN_REMOVE). null nếu không thấy / thiếu quyền.
async function auditExecutor(guild, type, targetId) {
  try {
    await wait(1500);
    const entries = await guild.fetchAuditLogs({ type, limit: 6 });
    const now = Date.now();
    const entry = [...entries.entries.values()].find((e) => now - e.createdTimestamp < 20000 && e.target && e.target.id === targetId);
    return entry ? { executor: entry.executor, reason: entry.reason } : null;
  } catch (error) {
    return null;
  }
}

const byText = (found) => (found && found.executor ? ` — bởi <@${found.executor.id}> (${esc(found.executor.username)})${found.reason ? `, lý do: ${esc(found.reason)}` : ''}` : '');

if (ACTIVITY_LOG_ENABLED && MEMBER_LOG_ENABLED) {
  // ---- Voice ----
  if (MEMBER_LOG_VOICE) {
    client.on(
      Events.VoiceStateUpdate,
      safe('voice thành viên', (oldState, newState) => {
        const member = newState.member || oldState.member;
        if (!member || member.user.bot || oldState.channelId === newState.channelId) return;
        const name = who(member.user);
        if (!oldState.channelId) log(`🎙️ ${name} vào voice <#${newState.channelId}>`);
        else if (!newState.channelId) log(`🎙️ ${name} rời voice <#${oldState.channelId}>`);
        else log(`🎙️ ${name} chuyển voice <#${oldState.channelId}> → <#${newState.channelId}>`);
      })
    );
  }

  // ---- Reaction ----
  if (MEMBER_LOG_REACTIONS) {
    const logReaction = (action) =>
      safe('reaction', (reaction, user) => {
        if (!user || user.bot) return;
        const message = reaction.message;
        if (!message || !message.guildId || skipChannel(message.channelId)) return;
        if ((scrimData.messageId && message.id === scrimData.messageId) || (bcData.messageId && message.id === bcData.messageId)) return; // đã có log vote riêng
        const author = message.author ? ` của <@${message.author.id}>` : '';
        log(`😀 ${who(user)} ${action} ${reaction.emoji.toString()} vào tin${author} ở <#${message.channelId}> [🔗 Xem tin](https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id})`);
      });
    client.on(Events.MessageReactionAdd, logReaction('thả'));
    client.on(Events.MessageReactionRemove, logReaction('gỡ'));
  }

  // ---- Thành viên ----
  if (MEMBER_LOG_MEMBERS) {
    client.on(
      Events.GuildMemberAdd,
      safe('thành viên vào', (member) => {
        if (member.user.bot) return;
        log(`📥 ${who(member.user)} vào server (tài khoản tạo <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>)`);
      })
    );

    client.on(
      Events.GuildMemberRemove,
      safe('thành viên rời', async (member) => {
        if (member.user && member.user.bot) return;
        const kicked = await auditExecutor(member.guild, 20, member.id);
        log(`📤 ${who(member.user)} ${kicked ? 'bị KICK khỏi' : 'rời'} server${byText(kicked)}`);
      })
    );

    client.on(
      Events.GuildBanAdd,
      safe('ban', async (ban) => {
        const found = await auditExecutor(ban.guild, 22, ban.user.id);
        log(`🔨 ${who(ban.user)} bị BAN${byText(found)}${!found && ban.reason ? `, lý do: ${esc(ban.reason)}` : ''}`);
      })
    );
    client.on(
      Events.GuildBanRemove,
      safe('gỡ ban', async (ban) => {
        const found = await auditExecutor(ban.guild, 23, ban.user.id);
        log(`🔓 ${who(ban.user)} được GỠ BAN${byText(found)}`);
      })
    );

    client.on(
      Events.GuildMemberUpdate,
      safe('cập nhật thành viên', (oldMember, newMember) => {
        if (oldMember.partial || newMember.user.bot) return; // oldMember chưa có trong cache thì không so được
        const name = who(newMember.user);
        if (oldMember.nickname !== newMember.nickname) {
          log(`🏷️ ${name} đổi biệt danh: ${esc(oldMember.nickname || '(không có)')} → ${esc(newMember.nickname || '(không có)')}`);
        }
        if (oldMember.avatar !== newMember.avatar) log(`🖼️ ${name} đổi avatar trong server`);

        const oldRoles = new Set(oldMember.roles.cache.keys());
        const added = [...newMember.roles.cache.values()].filter((r) => !oldRoles.has(r.id) && r.id !== AUTOVOTE_ROLE_ID);
        const removed = [...oldMember.roles.cache.values()].filter((r) => !newMember.roles.cache.has(r.id) && r.id !== AUTOVOTE_ROLE_ID);
        if (added.length) log(`🎭 ${name} được gắn role: ${added.map((r) => `<@&${r.id}>`).join(' ')}`);
        if (removed.length) log(`🎭 ${name} bị gỡ role: ${removed.map((r) => `<@&${r.id}>`).join(' ')}`);

        const before = oldMember.communicationDisabledUntilTimestamp || 0;
        const after = newMember.communicationDisabledUntilTimestamp || 0;
        if (after > Date.now() && after !== before) log(`⏳ ${name} bị timeout đến <t:${Math.floor(after / 1000)}:f>`);
        else if (before > Date.now() && after <= Date.now()) log(`⏳ ${name} được gỡ timeout`);
      })
    );
  }

  // ---- Kênh ----
  if (MEMBER_LOG_CHANNELS) {
    const here = (channel) => channel && channel.guildId && !(typeof channel.isThread === 'function' && channel.isThread());
    client.on(Events.ChannelCreate, safe('tạo kênh', (channel) => here(channel) && log(`📁 Tạo kênh <#${channel.id}> (${esc(channel.name)})`)));
    client.on(Events.ChannelDelete, safe('xoá kênh', (channel) => here(channel) && log(`📁 Xoá kênh **${esc(channel.name)}** (ID ${channel.id})`)));
    client.on(
      Events.ChannelUpdate,
      safe('sửa kênh', (oldChannel, newChannel) => {
        if (!here(newChannel)) return;
        if (oldChannel.name !== newChannel.name) log(`📁 Đổi tên kênh <#${newChannel.id}>: ${esc(oldChannel.name)} → ${esc(newChannel.name)}`);
        if ((oldChannel.topic || '') !== (newChannel.topic || '')) {
          log(`📁 Đổi mô tả kênh <#${newChannel.id}>: "${esc(clip(oldChannel.topic || '(trống)', 150))}" → "${esc(clip(newChannel.topic || '(trống)', 150))}"`);
        }
      })
    );
  }
}
