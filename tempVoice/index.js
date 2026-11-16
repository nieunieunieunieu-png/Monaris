// Phòng voice tạm: ai vào kênh "cổng" (TEMP_VOICE_LOBBY_CHANNEL_ID) -> bot tạo 1 phòng voice mới
// (tên = tên đã lưu trong sheet, chưa có thì = tên hiển thị Discord), kéo người đó sang phòng mới,
// rồi gửi menu điều khiển vào ô chat của phòng:
//   ✏️ Đổi tên            — đổi tên phòng + LƯU vào sheet "Voice Nickname" cho lần sau
//   🙈 Ẩn phòng / 👁️ Hiện phòng — ẩn phòng khỏi mọi người (người đang ngồi trong phòng vẫn được giữ lại)
//   ➕ Cho phép người     — chọn người được thấy + vào phòng; "được phép" cũng = xem được chat của phòng voice
//   ➖ Gỡ quyền           — thu lại quyền đã cho (phòng đang ẩn/khoá mà người đó còn ngồi trong phòng thì mời ra)
//   🔒 Khoá / 🔓 Mở khoá  — khoá: mọi người VẪN THẤY phòng nhưng không vào được; người đang ngồi + người được "Cho phép" vẫn vào lại được
//   👥 Giới hạn           — số người tối đa trong phòng (0 = không giới hạn)
//   🥾 Đá người           — ngắt kết nối + chặn vào lại (muốn mở lại thì dùng ➕ Cho phép)
//   👑 Chuyển chủ         — giao quyền chủ phòng cho 1 người đang ngồi trong phòng
//   mon!topdoi [@người]    — bảng xếp hạng cặp ngồi Phòng Đôi nhiều nhất (tổng phút 2 người cùng ngồi); kèm @người = các "người ấy" nhiều nhất của họ.
//   mon!menuv              — gọi lại menu điều khiển (chat trôi mất tin menu): gõ trong chat của phòng voice, hoặc gõ ở kênh bất kỳ khi
//                           đang ngồi trong phòng của mình; dùng cho cả phòng thường lẫn Phòng Đôi, chỉ chủ phòng gọi được.
// Chỉ chủ phòng bấm được menu. Chủ phòng thoát mà phòng còn người -> quyền chủ chuyển cho người còn lại.
// Phòng không còn ai -> bot tự xoá sau 5 phút (có người vào lại trong 5 phút thì giữ phòng).
//
// Quyền bot cần (ở danh mục chứa kênh cổng): Manage Channels, Move Members, View Channel, Connect,
// Send Messages (+ Manage Roles nếu danh mục có đặt quyền riêng — để bot cấp quyền cho từng người).
//
// ---------------------------------------------------------------------------------------------------
// 💕 PHÒNG ĐÔI — HIỆN ĐANG TẮT (config/loveRoom.js: LOVE_ROOM_ENABLED=false mặc định; bật lại bằng ENV LOVE_ROOM_ENABLED=true).
// Khi tắt: kênh cổng Phòng Đôi bị bỏ qua, không auto-detect, không tính phí, không đếm thống kê; phòng 💕 còn sót lúc khởi động được trả về phòng thường.
// (LOVE_ROOM_LOBBY_CHANNEL_ID riêng, xem config/loveRoom.js) — biến thể chỉ dành cho 2 người:
//   - Vào kênh cổng riêng này -> bot tạo phòng đặt tên LUÔN có tiền tố "💕 " (nhận biết + không gỡ được).
//   - Giới hạn cứng: chủ phòng + tối đa 1 người được MỜI (nút 💘 "Mời vào voice" mới) + 1 bot nhạc
//     (role MUSIC_BOT_ROLE_ID) — áp bằng userLimit + permissionOverwrites, có thêm chốt chặn (guard) ở
//     VoiceStateUpdate để đá ngay bất kỳ ai/bot thứ 2 lọt vào ngoài ý muốn.
//   - Mặc định phòng KHOÁ (mọi người vẫn THẤY nhưng không vào được) trừ bot nhạc luôn vào được dù khoá.
//   - Menu giống phòng thường, chỉ thay nút "👥 Giới hạn" bằng "💘 Mời vào voice" (giới hạn đã cố định).
//   - Cơ chế "cho thuê": mỗi phút có mặt trong Phòng Đôi, mỗi người bị trừ LOVE_ROOM_RENT_PER_MINUTE Công
//     Đức; không đủ trừ thì phần thiếu cộng ngược vào điểm Sám Hối (core.deductMerit + core.addRepent).
//   - 💔 "Về phòng thường" (chỉ chủ phòng bấm, không cần ai xác nhận): bỏ 💕, mở khoá, trả giới hạn người, hết tính phí. Không có
//     ngoại lệ riêng — nếu SAU ĐÓ vẫn chỉ đúng 2 người ngồi liên tục LOVE_ROOM_AUTO_DETECT_MINUTES phút (không có người thứ 3 vào)
//     thì cơ chế auto-detect sẽ tự đưa phòng về Phòng Đôi; có người thứ 3 vào thì đếm lại từ đầu.
//   - Chủ Phòng Đôi tự thoát voice (không qua nút Chuyển chủ): bot báo cho người kia (chat phòng + DM) rồi xoá phòng sau 1 phút.
//   - 💘 Mời vào voice: ngoài tag trong chat phòng, bot còn DM lời mời (kèm nút link vào phòng) cho người được mời.

const {
  Events,
  ChannelType,
  PermissionFlagsBits,
  OverwriteType,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  UserSelectMenuBuilder,
} = require('discord.js');
const client = require('../client');
const { isBotReady, replyNotReadyToMessage } = require('../utils/readyGate');
const { TEMP_VOICE_LOBBY_CHANNEL_ID } = require('../config');
const {
  LOVE_ROOM_ENABLED,
  LOVE_ROOM_LOBBY_CHANNEL_ID,
  MUSIC_BOT_ROLE_ID,
  LOVE_ROOM_PREFIX,
  LOVE_ROOM_SLOT_LIMIT,
  LOVE_ROOM_RENT_PER_MINUTE,
  LOVE_ROOM_RENT_TICK_MS,
  LOVE_ROOM_AUTO_DETECT_MINUTES,
  LOVE_ROOM_AUTO_DETECT_MS,
  LOVE_ROOM_AUTO_CHECK_MS,
} = require('../config/loveRoom');
const {
  ensureTempVoiceSheets,
  getSavedRoomName,
  saveUserVoiceInfo,
  getActiveRooms,
  getRoomOwner,
  setActiveRoom,
  removeActiveRoom,
  addLovePairMinutes,
  getLoveStats,
  flushLoveStats,
} = require('../googleSheets/tempVoiceSheet');

const PREFIX = 'tv';
const RENAME_WAIT_MS = 10 * 1000;
const EMPTY_DELETE_MS = 5 * 60 * 1000; // phòng trống người quá lâu này thì xoá
const MEMBER_PERMS = {
  ViewChannel: true,
  Connect: true,
  Speak: true,
  SendMessages: true,
  ReadMessageHistory: true,
};

const emptyTimers = new Map(); // channelId -> timeout xoá phòng trống
// Chống spam tạo phòng: mỗi người tối đa CREATE_LIMIT phòng trong CREATE_WINDOW_MS (đếm trong RAM, bot restart thì đếm lại từ đầu).
const CREATE_LIMIT = 4;
const CREATE_WINDOW_MS = 30 * 60 * 1000;
const NOTICE_COOLDOWN_MS = 60 * 1000; // báo "quá giới hạn" tối đa 1 lần/phút/người, tránh bot tự spam lại
const createLog = new Map(); // userId -> [thời điểm tạo phòng, ...]
const lastLimitNoticeAt = new Map();
const creating = new Set(); // userId đang được tạo phòng (chống tạo trùng khi vào/ra cổng liên tục)

// ----- Riêng cho Phòng Đôi -----
const loveRoomIds = new Set(); // channelId các phòng đang là Phòng Đôi (sống trong RAM — khôi phục lại lúc khởi động từ tiền tố tên)
const lovePartner = new Map(); // channelId -> userId người được chủ phòng mời (chỉ 1 người, "cho thuê" thu cả chủ phòng lẫn người này)
const closingLove = new Set(); // channelId đang trong thời gian chờ xoá vì chủ Phòng Đôi đã thoát
const OWNER_LEFT_DELETE_DELAY_MS = 60 * 1000;
const pairSince = new Map(); // channelId -> { key: "id1|id2", since: ts } — chống gian lận: theo dõi cặp 2 người ngồi chung liên tục
let loveRentTimer = null;
let loveStatsTimer = null;
const LOVE_STATS_FLUSH_MS = 5 * 60 * 1000; // ghi thống kê lên sheet mỗi 5 phút (bot restart đột ngột có thể mất tối đa ~5 phút)
let autoLoveTimer = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const logErr = (label) => (error) => console.error(`[tempVoice] ${label}:`, error && error.message);

function cleanName(raw, fallback = '') {
  const name = String(raw || '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100)
    .trim();
  return name || fallback;
}

// Bỏ tiền tố 💕 nếu người dùng tự gõ vào ô đổi tên — tên lưu Sheet luôn KHÔNG có tiền tố (tiền tố chỉ gắn khi hiển thị phòng Phòng Đôi).
function stripLovePrefix(raw) {
  return String(raw || '').replace(/^\s*💕\s*/u, '');
}

function isLoveRoom(channel) {
  return Boolean(channel && loveRoomIds.has(channel.id));
}

function humansIn(channel) {
  return channel.members.filter((m) => !m.user.bot);
}

function isHidden(channel) {
  const ow = channel.permissionOverwrites.cache.get(channel.guild.id);
  return Boolean(ow && ow.deny.has(PermissionFlagsBits.ViewChannel));
}

// Khoá = @everyone bị cấm Connect (vẫn thấy phòng). Người đã có quyền riêng (đang ngồi lúc khoá / được "Cho phép") vẫn vào được.
function isLocked(channel) {
  const ow = channel.permissionOverwrites.cache.get(channel.guild.id);
  return Boolean(ow && ow.deny.has(PermissionFlagsBits.Connect));
}

// mentionId: có giá trị -> tag (ping) chủ phòng trong tin nhắn (chỉ dùng lúc vừa tạo phòng).
// Trạng thái ẩn / khoá / giới hạn được đọc thẳng từ kênh nên không cần lưu riêng.
function buildMenu(channel, ownerName, mentionId, isLove = isLoveRoom(channel)) {
  const channelId = channel.id;
  const hidden = isHidden(channel);
  const locked = isLocked(channel);
  const limit = channel.userLimit || 0;
  const rowMain = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`${PREFIX}:ren:${channelId}`).setLabel('Đổi tên').setEmoji('✏️').setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`${PREFIX}:hide:${channelId}`)
      .setLabel(hidden ? 'Hiện phòng' : 'Ẩn phòng')
      .setEmoji(hidden ? '👁️' : '🙈')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`${PREFIX}:allow:${channelId}`).setLabel('Cho phép người vào').setEmoji('➕').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`${PREFIX}:deny:${channelId}`).setLabel('Gỡ quyền').setEmoji('➖').setStyle(ButtonStyle.Danger)
  );
  const rowMore = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${PREFIX}:lock:${channelId}`)
      .setLabel(locked ? 'Mở khoá' : 'Khoá phòng')
      .setEmoji(locked ? '🔓' : '🔒')
      .setStyle(locked ? ButtonStyle.Success : ButtonStyle.Secondary),
    isLove
      ? new ButtonBuilder().setCustomId(`${PREFIX}:inv:${channelId}`).setLabel('Mời vào voice').setEmoji('💘').setStyle(ButtonStyle.Primary)
      : new ButtonBuilder().setCustomId(`${PREFIX}:lim:${channelId}`).setLabel('Giới hạn người').setEmoji('👥').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`${PREFIX}:kick:${channelId}`).setLabel('Đá người').setEmoji('🥾').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`${PREFIX}:give:${channelId}`).setLabel('Chuyển chủ phòng').setEmoji('👑').setStyle(ButtonStyle.Secondary)
  );
  if (isLove) {
    rowMore.addComponents(
      new ButtonBuilder().setCustomId(`${PREFIX}:unlove:${channelId}`).setLabel('Về phòng thường').setEmoji('💔').setStyle(ButtonStyle.Danger)
    );
  }

  const loveLines = isLove
    ? `\n💕 **Phòng Đôi** — chỉ chủ phòng + 1 người được 💘 mời + 1 bot nhạc được vào. Mặc định **khoá** (ai cũng thấy, không ai vào được trừ người được mời & bot nhạc).\n` +
      `💸 Mỗi phút ngồi trong phòng: **-${LOVE_ROOM_RENT_PER_MINUTE} Công Đức**/người (không đủ thì phần thiếu cộng ngược vào điểm Sám Hối).\n` +
      `💔 Muốn ngồi chung với nhiều người? Bấm **Về phòng thường** — nhưng nếu sau đó vẫn chỉ 2 người ngồi liên tục **${LOVE_ROOM_AUTO_DETECT_MINUTES} phút** (không có người thứ 3) thì phòng tự về Phòng Đôi.\n`
    : '';

  return {
    content:
      `🎛️ **Phòng của ${mentionId ? `<@${mentionId}>` : ownerName}** — chỉ chủ phòng dùng được menu này.` +
      loveLines +
      `\nHiển thị: ${hidden ? '🙈 đang **ẩn** (chỉ người được phép mới thấy & vào)' : '👁️ đang **hiện** với mọi người'}\n` +
      `Vào phòng: ${locked ? '🔒 đang **khoá** (mọi người vẫn thấy phòng, nhưng chỉ người đang ngồi hoặc được phép mới vào được)' : '🔓 **mở** cho mọi người vào'}\n` +
      `Giới hạn: 👥 ${limit > 0 ? `**${limit}** người${isLove ? ' (đã gồm 1 slot bot nhạc, cố định)' : ''}` : '**không giới hạn**'}\n` +
      `Người được phép vào phòng ẩn/khoá cũng xem được tin nhắn trong chat của phòng.`,
    components: [rowMain, rowMore],
    allowedMentions: mentionId ? { users: [mentionId] } : { parse: [] },
  };
}

// ---------------------------------------------------------------- tạo / dọn phòng

async function findOwnRoom(guild, userId) {
  for (const [channelId, ownerId] of getActiveRooms()) {
    if (ownerId !== userId) continue;
    const ch = guild.channels.cache.get(channelId);
    if (ch) return ch;
  }
  return null;
}

async function handleJoinLobby(state, { isLove = false } = {}) {
  const member = state.member;
  if (!member || member.user.bot) return;
  const guild = state.guild;
  const lobby = state.channel;

  await ensureTempVoiceSheets().catch(logErr('nạp sheet (tạm dùng tên Discord)'));

  // Đang có phòng riêng rồi (vd chủ phòng thoát ra cổng trong khi phòng còn người) -> đưa về phòng cũ.
  const existing = await findOwnRoom(guild, member.id);
  if (existing) {
    await member.voice.setChannel(existing).catch(logErr('đưa về phòng cũ'));
    return;
  }

  if (creating.has(member.id)) return;
  creating.add(member.id);
  let channel = null;
  try {
    const now = Date.now();
    const recent = (createLog.get(member.id) || []).filter((t) => now - t < CREATE_WINDOW_MS);
    createLog.set(member.id, recent);
    if (recent.length >= CREATE_LIMIT) {
      if (now - (lastLimitNoticeAt.get(member.id) || 0) >= NOTICE_COOLDOWN_MS) {
        lastLimitNoticeAt.set(member.id, now);
        const waitMin = Math.max(1, Math.ceil((recent[0] + CREATE_WINDOW_MS - now) / 60000));
        const notice = await lobby
          .send({
            content: `⛔ <@${member.id}> bạn đã tạo đủ **${CREATE_LIMIT} phòng** trong 30 phút. Vui lòng thử lại sau khoảng **${waitMin} phút**.`,
            allowedMentions: { users: [member.id] },
          })
          .catch(logErr('báo quá giới hạn tạo phòng'));
        if (notice) setTimeout(() => notice.delete().catch(() => {}), 60 * 1000).unref();
      }
      return;
    }
    const displayName = member.displayName || member.user.username;
    const savedName = cleanName(stripLovePrefix(getSavedRoomName(member.id)), cleanName(displayName, 'Phòng voice'));
    const roomName = isLove ? `${LOVE_ROOM_PREFIX}${savedName}`.slice(0, 100) : savedName;

    const permissionOverwrites = [
      // Bot phải có quyền riêng — nếu sau này phòng bị ẩn với @everyone, bot vẫn thấy & điều khiển được.
      {
        id: client.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.Connect,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.MoveMembers,
        ],
      },
      {
        id: member.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.Connect,
          PermissionFlagsBits.Speak,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
    ];
    if (isLove) {
      // Mặc định KHOÁ ngay từ lúc tạo: @everyone vẫn thấy phòng nhưng không Connect được.
      permissionOverwrites.push({
        id: guild.id,
        deny: [PermissionFlagsBits.Connect],
      });
      // Bot nhạc (role) luôn vào được dù phòng khoá.
      if (MUSIC_BOT_ROLE_ID) {
        permissionOverwrites.push({
          id: MUSIC_BOT_ROLE_ID,
          type: OverwriteType.Role,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
        });
      }
    }

    channel = await guild.channels.create({
      name: roomName,
      type: ChannelType.GuildVoice,
      parent: lobby.parentId || undefined,
      bitrate: lobby.bitrate || undefined,
      userLimit: isLove ? LOVE_ROOM_SLOT_LIMIT : lobby.userLimit || 0,
      reason: isLove ? `Phòng Đôi của ${member.user.tag}` : `Phòng voice tạm của ${member.user.tag}`,
      permissionOverwrites,
    });
    recent.push(Date.now());
    await setActiveRoom(channel.id, member.id).catch(logErr('lưu phòng đang mở'));
    if (isLove) loveRoomIds.add(channel.id);

    // Kéo người tạo sang phòng mới. Nếu họ vừa thoát voice thì dọn phòng ngay.
    try {
      await member.voice.setChannel(channel);
    } catch (error) {
      console.error('[tempVoice] Không kéo được người tạo vào phòng mới:', error.message);
      await closeRoom(channel);
      return;
    }

    saveUserVoiceInfo(member.id, displayName).catch(logErr('ghi sheet Voice Nickname'));
    await channel.send(buildMenu(channel, displayName, member.id, isLove));
  } catch (error) {
    console.error('[tempVoice] Lỗi tạo phòng voice:', error.message);
    if (channel) await closeRoom(channel);
  } finally {
    creating.delete(member.id);
  }
}

function cancelEmptyDelete(channelId) {
  const timer = emptyTimers.get(channelId);
  if (timer) {
    clearTimeout(timer);
    emptyTimers.delete(channelId);
  }
}

// Hẹn xoá phòng sau EMPTY_DELETE_MS; tới giờ kiểm tra lại, còn trống mới xoá.
function scheduleEmptyDelete(channel) {
  if (emptyTimers.has(channel.id)) return;
  const timer = setTimeout(() => {
    emptyTimers.delete(channel.id);
    const current = client.channels.cache.get(channel.id);
    if (!current) {
      removeActiveRoom(channel.id).catch(logErr('dọn phòng đã mất'));
      return;
    }
    if (humansIn(current).size === 0) closeRoom(current).catch(logErr('xoá phòng trống'));
  }, EMPTY_DELETE_MS);
  if (timer.unref) timer.unref();
  emptyTimers.set(channel.id, timer);
}

async function closeRoom(channel, reason = 'Phòng voice tạm đã trống') {
  cancelEmptyDelete(channel.id);
  loveRoomIds.delete(channel.id);
  lovePartner.delete(channel.id);
  pairSince.delete(channel.id);
  menuvAt.delete(channel.id);
  await removeActiveRoom(channel.id).catch(logErr('xoá phòng khỏi sheet'));
  await channel.delete(reason).catch((error) => {
    if (error.code !== 10003) console.error('[tempVoice] Không xoá được phòng:', error.message);
  });
}

async function handleLeaveRoom(oldState) {
  const ownerId = getRoomOwner(oldState.channelId);
  if (!ownerId) return;
  const channel = oldState.guild.channels.cache.get(oldState.channelId);
  if (!channel) {
    await removeActiveRoom(oldState.channelId).catch(logErr('dọn phòng đã mất'));
    return;
  }

  const humans = humansIn(channel);
  if (humans.size === 0) {
    scheduleEmptyDelete(channel);
    return;
  }

  // Chủ phòng vừa thoát, phòng còn người -> chuyển quyền chủ phòng cho người còn lại (vào phòng sớm nhất trong cache).
  if (oldState.id === ownerId && !humans.has(ownerId)) {
    // Phòng Đôi: chủ tự thoát (không qua nút Chuyển chủ) -> báo người kia rồi xoá phòng (không chạy ngầm chờ để khỏi chặn các xử lý VoiceStateUpdate khác).
    if (isLoveRoom(channel)) {
      dissolveLoveRoomAfterOwnerLeft(channel, ownerId, oldState.member ? oldState.member.displayName : 'Chủ phòng').catch(logErr('xoá Phòng Đôi khi chủ thoát'));
      return;
    }
    const next = humans.first();
    await setActiveRoom(channel.id, next.id).catch(logErr('đổi chủ phòng'));
    await channel.permissionOverwrites.edit(next.id, MEMBER_PERMS).catch(logErr('cấp quyền chủ mới'));
    if (lovePartner.get(channel.id) === next.id) lovePartner.delete(channel.id);
    await channel
      .send({ content: `👑 Chủ phòng đã thoát — **${next.displayName}** là chủ phòng mới (dùng menu phía trên).`, allowedMentions: { parse: [] } })
      .catch(logErr('báo chủ mới'));
  }
}

// Chủ Phòng Đôi thoát -> báo cho người còn lại (tin trong chat phòng + DM, vì chat phòng sẽ mất cùng phòng) rồi xoá phòng sau OWNER_LEFT_DELETE_DELAY_MS.
// Trong thời gian chờ nếu chủ phòng quay lại thì giữ phòng (vd chủ ra kênh cổng thì bot kéo về phòng cũ).
async function dissolveLoveRoomAfterOwnerLeft(channel, ownerId, ownerName) {
  if (closingLove.has(channel.id)) return;
  closingLove.add(channel.id);
  try {
    const others = new Set([...humansIn(channel).keys()]);
    const invited = lovePartner.get(channel.id);
    if (invited) others.add(invited);
    others.delete(ownerId);
    const secs = Math.round(OWNER_LEFT_DELETE_DELAY_MS / 1000);
    const waitLabel = secs % 60 === 0 ? `${secs / 60} phút` : `${secs} giây`;
    const ids = [...others];

    if (ids.length) {
      await channel
        .send({
          content: `💔 ${ids.map((id) => `<@${id}>`).join(' ')} — chủ phòng **${ownerName}** đã rời Phòng Đôi nên phòng sẽ bị **xoá sau ${waitLabel}**.`,
          allowedMentions: { users: ids },
        })
        .catch(logErr('báo chủ Phòng Đôi đã thoát'));
      for (const id of ids) {
        const user = await client.users.fetch(id).catch(() => null);
        if (user) {
          await user
            .send(`💔 **${ownerName}** đã rời Phòng Đôi **${channel.name}** nên phòng đã bị xoá. Bạn có thể vào kênh cổng Phòng Đôi để tạo phòng mới.`)
            .catch(() => {}); // người nhận tắt DM thì thôi
        }
      }
    }

    await sleep(OWNER_LEFT_DELETE_DELAY_MS);
    const current = client.channels.cache.get(channel.id);
    if (!current) {
      await removeActiveRoom(channel.id).catch(logErr('dọn phòng đã mất'));
      return;
    }
    if (getRoomOwner(channel.id) === ownerId && current.members.has(ownerId)) {
      await current.send({ content: '💕 Chủ phòng đã quay lại — phòng được giữ nguyên.', allowedMentions: { parse: [] } }).catch(() => {});
      return;
    }
    await closeRoom(current, 'Chủ Phòng Đôi đã rời phòng');
    try {
      require('../activityLog').logActivity(`💔 [phòng đôi] Chủ phòng <@${ownerId}> thoát Phòng Đôi — đã báo người kia và xoá phòng.`);
    } catch { /* bỏ qua */ }
  } finally {
    closingLove.delete(channel.id);
  }
}

// Chốt chặn an toàn cho Phòng Đôi: phòng đã giới hạn bằng userLimit + permissionOverwrites rồi, hàm này chỉ
// đá ngay bất kỳ ai lọt vào ngoài ý muốn (vd admin có quyền bỏ qua userLimit, bot lạ không thuộc role nhạc,
// bot nhạc thứ 2…) để đảm bảo đúng "chủ phòng + 1 người được mời + 1 bot nhạc".
async function enforceLoveRoomCap(channel) {
  if (!isLoveRoom(channel)) return;
  const ownerId = getRoomOwner(channel.id);
  const partnerId = lovePartner.get(channel.id);
  let botSeen = false;
  for (const member of [...channel.members.values()]) {
    if (member.user.bot) {
      const isMusicBot = MUSIC_BOT_ROLE_ID && member.roles.cache.has(MUSIC_BOT_ROLE_ID);
      if (!isMusicBot || botSeen) {
        await member.voice.disconnect('Phòng Đôi chỉ cho 1 bot nhạc vào').catch(logErr('đá bot lạ khỏi Phòng Đôi'));
        continue;
      }
      botSeen = true;
    } else if (member.id !== ownerId && member.id !== partnerId) {
      await member.voice.disconnect('Phòng Đôi chỉ dành cho chủ phòng + người được mời').catch(logErr('đá người lạ khỏi Phòng Đôi'));
    }
  }
}

// ---------------------------------------------------------------- Chống gian lận: tự phát hiện "cặp đôi núp bóng phòng thường"
// Né kênh cổng Phòng Đôi, tạo/qua phòng voice tạm THƯỜNG rồi kéo nhau 2 người ngồi chung để khỏi bị trừ Công Đức ->
// quét mỗi LOVE_ROOM_AUTO_CHECK_MS, phòng nào đúng 2 người thật ngồi chung LIÊN TỤC (vẫn cho thêm 1 bot, vd bot nhạc)
// đủ LOVE_ROOM_AUTO_DETECT_MINUTES phút thì TỰ chuyển thành Phòng Đôi (thêm 💕, khoá phòng, bắt đầu tính phí).

// Cặp 2 người thật đang ngồi trong phòng (nếu có bot thì vẫn được, chỉ không tính bot) -> "id nhỏ|id lớn" để so sánh ổn định; khác 2 người -> null.
function pairKeyOf(channel) {
  const humans = humansIn(channel);
  if (humans.size !== 2) return null;
  return [...humans.keys()].sort().join('|');
}

async function convertToLoveRoom(channel, ownerId, pairKey) {
  const guild = channel.guild;
  const partnerId = pairKey.split('|').find((id) => id !== ownerId) || null;
  if (!partnerId) return;

  if (!channel.name.startsWith(LOVE_ROOM_PREFIX)) {
    await channel
      .setName(`${LOVE_ROOM_PREFIX}${channel.name}`.slice(0, 100), `[chống gian lận] 2 người ngồi chung quá ${LOVE_ROOM_AUTO_DETECT_MINUTES} phút -> tự chuyển Phòng Đôi`)
      .catch(logErr('đổi tên tự động Phòng Đôi'));
  }
  // Dọn sạch quyền riêng còn sót lại từ lúc còn là phòng thường (vd từng "Cho phép" người khác) — tránh họ vẫn Connect được
  // dù phòng đã khoá, dù enforceLoveRoomCap vẫn sẽ đá ra nếu họ cố vào.
  for (const [id] of channel.permissionOverwrites.cache) {
    if (id === channel.guild.id || id === client.user.id || id === ownerId || id === partnerId || id === MUSIC_BOT_ROLE_ID) continue;
    await channel.permissionOverwrites.delete(id).catch(logErr('dọn quyền cũ (tự Phòng Đôi)'));
  }
  // Khoá lại y như Phòng Đôi tạo bằng kênh cổng: chỉ 2 người này + bot nhạc được Connect.
  await channel.permissionOverwrites.edit(ownerId, MEMBER_PERMS).catch(logErr('cấp quyền chủ phòng (tự Phòng Đôi)'));
  await channel.permissionOverwrites.edit(partnerId, MEMBER_PERMS).catch(logErr('cấp quyền người kia (tự Phòng Đôi)'));
  await channel.permissionOverwrites.edit(guild.id, { Connect: false }).catch(logErr('khoá phòng (tự Phòng Đôi)'));
  if (MUSIC_BOT_ROLE_ID) {
    await channel.permissionOverwrites
      .edit(MUSIC_BOT_ROLE_ID, { ViewChannel: true, Connect: true, Speak: true })
      .catch(logErr('cấp quyền bot nhạc (tự Phòng Đôi)'));
  }
  await channel.setUserLimit(LOVE_ROOM_SLOT_LIMIT, '[chống gian lận] tự chuyển Phòng Đôi').catch(logErr('đặt giới hạn (tự Phòng Đôi)'));

  loveRoomIds.add(channel.id);
  lovePartner.set(channel.id, partnerId);

  await channel
    .send({
      content:
        `💕 Phát hiện **<@${ownerId}>** và **<@${partnerId}>** ngồi chung phòng liên tục quá **${LOVE_ROOM_AUTO_DETECT_MINUTES} phút** — ` +
        `hệ thống đã TỰ chuyển phòng này thành **Phòng Đôi** 💕 (khoá phòng, chỉ 2 người + bot nhạc vào được) và bắt đầu tính phí ` +
        `**-${LOVE_ROOM_RENT_PER_MINUTE} Công Đức/phút/người** (không đủ Công Đức thì cộng ngược vào Sám Hối). Menu điều khiển mới:`,
      allowedMentions: { users: [ownerId, partnerId] },
    })
    .catch(logErr('báo tự chuyển Phòng Đôi'));

  const owner = await guild.members.fetch(ownerId).catch(() => null);
  await channel.send(buildMenu(channel, owner ? owner.displayName : ownerId, ownerId, true)).catch(logErr('gửi menu Phòng Đôi (tự chuyển)'));

  try {
    require('../activityLog').logActivity(
      `💕 [phòng đôi] Tự chuyển <#${channel.id}> thành Phòng Đôi — <@${ownerId}> & <@${partnerId}> ngồi chung >${LOVE_ROOM_AUTO_DETECT_MINUTES} phút.`
    );
  } catch { /* bỏ qua */ }
}

function checkAutoLoveTick() {
  try {
    const now = Date.now();
    for (const [channelId, ownerId] of getActiveRooms()) {
      const channel = client.channels.cache.get(channelId);
      if (!channel) {
        pairSince.delete(channelId);
        continue;
      }
      if (isLoveRoom(channel)) {
        pairSince.delete(channelId); // đã là Phòng Đôi rồi, khỏi theo dõi nữa
        continue;
      }
      const key = pairKeyOf(channel);
      if (!key) {
        pairSince.delete(channelId); // không đúng 2 người -> đứt theo dõi
        continue;
      }
      const track = pairSince.get(channelId);
      if (!track || track.key !== key) {
        pairSince.set(channelId, { key, since: now }); // cặp mới (hoặc lần đầu thấy) -> tính lại từ đây
        continue;
      }
      if (now - track.since >= LOVE_ROOM_AUTO_DETECT_MS) {
        pairSince.delete(channelId);
        convertToLoveRoom(channel, ownerId, key).catch(logErr('tự chuyển Phòng Đôi'));
      }
    }
  } catch (error) {
    console.error('[tempVoice] Lỗi quét chống gian lận Phòng Đôi:', error && error.message ? error.message : error);
  }
}

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  try {
    if (oldState.channelId === newState.channelId) return;
    if (newState.channelId) cancelEmptyDelete(newState.channelId);
    if (oldState.channelId) await handleLeaveRoom(oldState);
    if (newState.channelId === TEMP_VOICE_LOBBY_CHANNEL_ID) { if (require('../features').isEnabled('tempvoice')) await handleJoinLobby(newState); }
    else if (require('../features').isEnabled('loveroom') && newState.channelId === LOVE_ROOM_LOBBY_CHANNEL_ID) await handleJoinLobby(newState, { isLove: true });
    else if (newState.channel && isLoveRoom(newState.channel)) await enforceLoveRoomCap(newState.channel);
  } catch (error) {
    console.error('[tempVoice] Lỗi VoiceStateUpdate:', error.message);
  }
});

// ---------------------------------------------------------------- Phòng Đôi — cơ chế "cho thuê" (trừ Công Đức/phút)

function chargeLoveRent(userId, name) {
  try {
    const core = require('../congDuc/core');
    const rec = core.rollDay(core.getRecord(userId, name));
    const taken = core.deductMerit(rec, LOVE_ROOM_RENT_PER_MINUTE);
    const remain = Math.max(0, LOVE_ROOM_RENT_PER_MINUTE - taken);
    if (remain > 0) core.addRepent(rec, remain);
    if (taken > 0 || remain > 0) {
      const parts = [];
      if (taken > 0) parts.push(`-${taken} Công Đức`);
      if (remain > 0) parts.push(`+${remain} Sám Hối (không đủ Công Đức để trừ)`);
      require('../activityLog').logActivity(`💕 [phòng đôi] <@${userId}> ngồi Phòng Đôi: ${parts.join(', ')}`);
    }
  } catch (error) {
    console.error('[tempVoice] Lỗi trừ Công Đức "cho thuê" Phòng Đôi:', error && error.message ? error.message : error);
  }
}

// Mỗi phút: Phòng Đôi nào đang có ĐÚNG 2 người thật ngồi cùng -> cộng 1 phút cho cặp đó (không phụ thuộc Công Đức bật/tắt).
function countLovePairMinutes() {
  try {
    for (const channelId of loveRoomIds) {
      const channel = client.channels.cache.get(channelId);
      if (!channel) continue;
      const key = pairKeyOf(channel);
      if (!key) continue;
      const [a, b] = key.split('|');
      addLovePairMinutes(a, b, 1);
    }
  } catch (error) {
    console.error('[tempVoice] Lỗi đếm thống kê Phòng Đôi:', error && error.message ? error.message : error);
  }
}

function tickLoveRent() {
  countLovePairMinutes();
  try {
    const cfg = require('../config/congDuc');
    const core = require('../congDuc/core');
    if (!cfg.CONG_DUC_ENABLED || !core.isLoaded()) return;
    for (const channelId of [...loveRoomIds]) {
      const channel = client.channels.cache.get(channelId);
      if (!channel) {
        loveRoomIds.delete(channelId);
        lovePartner.delete(channelId);
        continue;
      }
      for (const m of humansIn(channel).values()) chargeLoveRent(m.id, m.displayName || m.user.username);
    }
  } catch (error) {
    console.error('[tempVoice] Lỗi vòng lặp "cho thuê" Phòng Đôi:', error && error.message ? error.message : error);
  }
}

// Phòng Đôi đã tắt mà vẫn còn phòng mang tiền tố 💕 (tạo trước khi tắt) -> trả về phòng thường. Không chờ (đổi tên bị Discord giới hạn tốc độ).
function releaseLeftoverLoveRoom(channel) {
  channel.setName(cleanName(stripLovePrefix(channel.name), 'Phòng voice'), 'Phòng Đôi đã tắt').catch(logErr('bỏ 💕 khỏi tên phòng (Phòng Đôi tắt)'));
  channel.permissionOverwrites.edit(channel.guild.id, { Connect: null }).catch(logErr('mở khoá phòng (Phòng Đôi tắt)'));
  const lobby = client.channels.cache.get(TEMP_VOICE_LOBBY_CHANNEL_ID);
  channel.setUserLimit((lobby && lobby.userLimit) || 0, 'Phòng Đôi đã tắt').catch(logErr('trả giới hạn người (Phòng Đôi tắt)'));
}

// Gọi 1 lần lúc khởi động: nạp sheet + dọn phòng mồ côi (phòng bị mất; phòng đang trống thì hẹn xoá sau 5 phút).
async function startTempVoice() {
  await ensureTempVoiceSheets();
  loveRoomIds.clear();
  for (const channelId of [...getActiveRooms().keys()]) {
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      await removeActiveRoom(channelId).catch(logErr('dọn phòng đã mất'));
    } else {
      // Khôi phục lại phòng nào là Phòng Đôi sau khi bot restart, dựa vào tiền tố tên (không cần lưu thêm cột Sheet).
      // Phòng Đôi đang TẮT: phòng 💕 còn sót thì trả về phòng thường (bỏ 💕, mở khoá, trả giới hạn người).
      if (channel.name && channel.name.startsWith(LOVE_ROOM_PREFIX)) {
        if (LOVE_ROOM_ENABLED) loveRoomIds.add(channelId);
        else releaseLeftoverLoveRoom(channel);
      }
      if (humansIn(channel).size === 0) scheduleEmptyDelete(channel);
    }
  }
  if (LOVE_ROOM_ENABLED && !loveRentTimer) {
    loveRentTimer = setInterval(tickLoveRent, LOVE_ROOM_RENT_TICK_MS);
    if (loveRentTimer.unref) loveRentTimer.unref();
  }
  if (LOVE_ROOM_ENABLED && !loveStatsTimer) {
    loveStatsTimer = setInterval(() => flushLoveStats().catch(logErr('ghi thống kê Phòng Đôi')), LOVE_STATS_FLUSH_MS);
    if (loveStatsTimer.unref) loveStatsTimer.unref();
  }
  if (LOVE_ROOM_ENABLED && !autoLoveTimer) {
    autoLoveTimer = setInterval(checkAutoLoveTick, LOVE_ROOM_AUTO_CHECK_MS);
    if (autoLoveTimer.unref) autoLoveTimer.unref();
  }
  console.log(
    `[tempVoice] Sẵn sàng — kênh cổng ${TEMP_VOICE_LOBBY_CHANNEL_ID}, Phòng Đôi ${LOVE_ROOM_ENABLED ? `BẬT (kênh cổng ${LOVE_ROOM_LOBBY_CHANNEL_ID})` : 'TẮT'}, ${getActiveRooms().size} phòng đang mở (${loveRoomIds.size} Phòng Đôi).`
  );
}

// ---------------------------------------------------------------- menu / nút

function userPicker(action, channelId, placeholder, maxValues = 10) {
  return new ActionRowBuilder().addComponents(
    new UserSelectMenuBuilder()
      .setCustomId(`${PREFIX}:${action}:${channelId}`)
      .setPlaceholder(placeholder)
      .setMinValues(1)
      .setMaxValues(maxValues)
  );
}

async function replyEphemeral(interaction, content) {
  const payload = { content, flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } };
  if (interaction.deferred || interaction.replied) await interaction.followUp(payload);
  else await interaction.reply(payload);
}

async function toggleHide(interaction, channel) {
  await interaction.deferUpdate();
  const guildId = channel.guild.id;
  if (isHidden(channel)) {
    await channel.permissionOverwrites.edit(guildId, { ViewChannel: null });
  } else {
    // Cấp quyền riêng cho mọi người đang ngồi trong phòng TRƯỚC khi ẩn, để không ai bị đá ra / mất chat.
    for (const m of humansIn(channel).values()) {
      await channel.permissionOverwrites.edit(m.id, MEMBER_PERMS);
    }
    await channel.permissionOverwrites.edit(guildId, { ViewChannel: false });
  }
  await refreshMenu(interaction, channel);
}

// Vẽ lại menu trên chính tin nhắn có nút vừa bấm (interaction đã deferUpdate).
async function refreshMenu(interaction, channel) {
  const owner = await channel.guild.members.fetch(getRoomOwner(channel.id)).catch(() => null);
  await interaction.editReply(buildMenu(channel, owner ? owner.displayName : interaction.user.username));
}

async function toggleLock(interaction, channel) {
  await interaction.deferUpdate();
  const guildId = channel.guild.id;
  if (isLocked(channel)) {
    await channel.permissionOverwrites.edit(guildId, { Connect: null });
  } else {
    // Cấp quyền riêng cho mọi người đang ngồi trong phòng TRƯỚC khi khoá, để lỡ rớt mạng vẫn vào lại được.
    for (const m of humansIn(channel).values()) {
      await channel.permissionOverwrites.edit(m.id, MEMBER_PERMS);
    }
    await channel.permissionOverwrites.edit(guildId, { Connect: false });
  }
  await refreshMenu(interaction, channel);
}

async function applyLimit(interaction, channel, rawLimit) {
  if (isLoveRoom(channel)) {
    await replyEphemeral(interaction, '❌ Phòng Đôi đã cố định số người (2 + 1 bot nhạc), không đổi giới hạn được.');
    return;
  }
  const text = String(rawLimit || '').trim();
  if (!/^\d{1,2}$/.test(text)) {
    await replyEphemeral(interaction, '❌ Hãy nhập số nguyên từ 0 đến 99 (0 = không giới hạn).');
    return;
  }
  const limit = Number(text);
  if (!interaction.isFromMessage()) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await channel.setUserLimit(limit, `Chủ phòng ${interaction.user.tag} đổi giới hạn người`);
    await interaction.editReply(limit > 0 ? `✅ Đã đặt giới hạn **${limit}** người.` : '✅ Đã bỏ giới hạn số người.');
    return;
  }
  await interaction.deferUpdate();
  await channel.setUserLimit(limit, `Chủ phòng ${interaction.user.tag} đổi giới hạn người`);
  await refreshMenu(interaction, channel);
}

async function applyRename(interaction, channel, rawName) {
  const love = isLoveRoom(channel);
  const name = cleanName(stripLovePrefix(rawName));
  if (!name) {
    await replyEphemeral(interaction, '❌ Tên phòng không được để trống.');
    return;
  }
  const finalName = love ? `${LOVE_ROOM_PREFIX}${name}`.slice(0, 100) : name;

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  // Lưu tên trước (KHÔNG kèm tiền tố 💕) — dù Discord đang giới hạn tốc độ đổi tên, lần tạo phòng sau vẫn dùng tên này.
  await saveUserVoiceInfo(interaction.user.id, interaction.member ? interaction.member.displayName : interaction.user.username, name).catch(
    logErr('lưu tên phòng')
  );
  const renaming = channel.setName(finalName, `Chủ phòng ${interaction.user.tag} đổi tên`);
  const done = await Promise.race([renaming.then(() => true), sleep(RENAME_WAIT_MS).then(() => false)]);
  if (done) {
    await interaction.editReply(`✅ Đã đổi tên phòng thành **${finalName}** (và lưu cho lần tạo phòng sau).`);
  } else {
    renaming.catch(logErr('đổi tên'));
    await interaction.editReply(
      `⏳ Discord chỉ cho đổi tên kênh 2 lần / 10 phút nên chưa đổi ngay được. Tên **${finalName}** đã được lưu và sẽ tự áp dụng khi hết giới hạn.`
    );
  }
}

async function applyAllow(interaction, channel) {
  if (isLoveRoom(channel)) {
    await interaction.update({ content: '❌ Phòng Đôi chỉ cho tối đa 1 người + bạn — dùng nút 💘 **Mời vào voice** thay vì "Cho phép".', components: [] });
    return;
  }
  const users = [...interaction.users.values()].filter((u) => !u.bot);
  for (const u of users) await channel.permissionOverwrites.edit(u.id, MEMBER_PERMS);
  const names = users.map((u) => `**${u.displayName || u.username}**`).join(', ') || '(không có ai)';
  await interaction.update({ content: `✅ Đã cho phép ${names} thấy & vào phòng (xem được chat của phòng).`, components: [] });
}

async function applyDeny(interaction, channel, ownerId) {
  const users = [...interaction.users.values()].filter((u) => !u.bot && u.id !== ownerId);
  const restricted = isHidden(channel) || isLocked(channel);
  for (const u of users) {
    await channel.permissionOverwrites.delete(u.id).catch(logErr('gỡ quyền'));
    if (lovePartner.get(channel.id) === u.id) lovePartner.delete(channel.id);
    // Phòng đang ẩn/khoá mà người đó còn ngồi trong phòng -> mời ra.
    const m = channel.members.get(u.id);
    if (restricted && m) await m.voice.disconnect('Bị chủ phòng gỡ quyền').catch(logErr('ngắt kết nối'));
  }
  const names = users.map((u) => `**${u.displayName || u.username}**`).join(', ') || '(không có ai — không gỡ quyền chủ phòng được)';
  await interaction.update({ content: `✅ Đã gỡ quyền của ${names}.`, components: [] });
}

async function applyKick(interaction, channel, ownerId) {
  const users = [...interaction.users.values()].filter((u) => !u.bot && u.id !== ownerId);
  for (const u of users) {
    // Chặn vào lại + chặn chat (người đó có thể đang có quyền riêng từ "Cho phép" / lúc khoá) rồi mới ngắt kết nối.
    await channel.permissionOverwrites.edit(u.id, { Connect: false, SendMessages: false }).catch(logErr('chặn vào lại'));
    if (lovePartner.get(channel.id) === u.id) lovePartner.delete(channel.id);
    const m = channel.members.get(u.id);
    if (m) await m.voice.disconnect('Bị chủ phòng đá khỏi phòng').catch(logErr('ngắt kết nối'));
  }
  const names = users.map((u) => `**${u.displayName || u.username}**`).join(', ');
  await interaction.update({
    content: names
      ? `✅ Đã đá ${names} khỏi phòng và chặn vào lại (dùng ➕ Cho phép nếu muốn mở lại).`
      : '❌ Không đá được chủ phòng hay bot — hãy chọn người khác.',
    components: [],
  });
}

async function applyGive(interaction, channel, ownerId) {
  const target = interaction.users.first();
  const member = target && !target.bot && target.id !== ownerId ? channel.members.get(target.id) : null;
  if (!member) {
    await interaction.update({ content: '❌ Chỉ chuyển được cho người **đang ngồi trong phòng** (không phải bạn, không phải bot).', components: [] });
    return;
  }
  await setActiveRoom(channel.id, member.id);
  await channel.permissionOverwrites.edit(member.id, MEMBER_PERMS).catch(logErr('cấp quyền chủ mới'));
  // Phòng Đôi: chủ cũ phải chuyển thành "người được mời" (partner), không thì enforceLoveRoomCap sẽ đá nhầm họ khỏi phòng.
  if (isLoveRoom(channel)) lovePartner.set(channel.id, ownerId);
  await interaction.update({ content: `✅ Đã chuyển quyền chủ phòng cho **${member.displayName}**. Menu phòng giờ chỉ họ dùng được.`, components: [] });
  await channel
    .send({ content: `👑 **${interaction.member ? interaction.member.displayName : interaction.user.username}** đã chuyển quyền chủ phòng cho **${member.displayName}** (dùng menu phía trên).`, allowedMentions: { parse: [] } })
    .catch(logErr('báo chuyển chủ'));
}

// 💔 Về phòng thường: bỏ 💕, mở khoá, trả giới hạn người, hết tính phí. KHÔNG có ngoại lệ: nếu sau đó vẫn đúng 2 người ngồi chung
// liên tục LOVE_ROOM_AUTO_DETECT_MINUTES phút thì checkAutoLoveTick tự đưa phòng về Phòng Đôi (có người thứ 3 vào thì đếm lại).
async function revertLoveRoom(interaction, channel, ownerId) {
  if (!isLoveRoom(channel)) {
    await replyEphemeral(interaction, '❌ Phòng này đã là phòng thường rồi.');
    return;
  }
  await interaction.deferUpdate();
  loveRoomIds.delete(channel.id);
  lovePartner.delete(channel.id);
  pairSince.delete(channel.id); // để vòng quét sau đếm lại 5 phút từ đầu

  // Đổi tên bị Discord giới hạn 2 lần/10 phút nên không chờ; lệnh vẫn nằm trong hàng đợi và tự áp dụng.
  if (channel.name.startsWith(LOVE_ROOM_PREFIX)) {
    channel.setName(cleanName(stripLovePrefix(channel.name), 'Phòng voice'), 'Chủ phòng chuyển về phòng thường').catch(logErr('bỏ 💕 khỏi tên phòng'));
  }
  await channel.permissionOverwrites.edit(channel.guild.id, { Connect: null }).catch(logErr('mở khoá phòng khi về phòng thường'));
  const lobby = client.channels.cache.get(TEMP_VOICE_LOBBY_CHANNEL_ID);
  await channel.setUserLimit((lobby && lobby.userLimit) || 0, 'Chủ phòng chuyển về phòng thường').catch(logErr('trả giới hạn người khi về phòng thường'));

  const owner = await channel.guild.members.fetch(ownerId).catch(() => null);
  await channel
    .send({
      content:
        `💔 <@${ownerId}> đã chuyển phòng về **phòng thường**: bỏ nhãn 💕, mở khoá, ngừng tính phí. ` +
        `Lưu ý: nếu vẫn chỉ đúng 2 người ngồi liên tục **${LOVE_ROOM_AUTO_DETECT_MINUTES} phút** (không có người thứ 3 vào) thì phòng sẽ **tự về Phòng Đôi**. Menu phòng thường:`,
      allowedMentions: { users: [ownerId] },
    })
    .catch(logErr('báo về phòng thường'));
  await channel.send(buildMenu(channel, owner ? owner.displayName : ownerId, null, false)).catch(logErr('gửi menu phòng thường'));
  try {
    require('../activityLog').logActivity(`💔 [phòng đôi] <@${ownerId}> chuyển <#${channel.id}> về phòng thường.`);
  } catch { /* bỏ qua */ }
}

// 💘 Mời vào voice — riêng cho Phòng Đôi: chỉ 1 người được mời tại 1 thời điểm (giữ đúng giới hạn 2 người).
// Mời người mới -> thu quyền của người được mời trước đó (nếu khác).
async function applyInvite(interaction, channel, ownerId) {
  const target = interaction.users.first();
  if (!target || target.bot || target.id === ownerId) {
    await interaction.update({ content: '❌ Hãy chọn đúng **1 người** (không phải bạn, không phải bot).', components: [] });
    return;
  }
  const prevPartnerId = lovePartner.get(channel.id);
  if (prevPartnerId && prevPartnerId !== target.id) {
    await channel.permissionOverwrites.delete(prevPartnerId).catch(logErr('gỡ người cũ trong Phòng Đôi'));
    const prevMember = channel.members.get(prevPartnerId);
    if (prevMember) await prevMember.voice.disconnect('Chủ phòng mời người khác vào Phòng Đôi').catch(logErr('ngắt người cũ khỏi Phòng Đôi'));
  }
  lovePartner.set(channel.id, target.id);
  await channel.permissionOverwrites.edit(target.id, MEMBER_PERMS).catch(logErr('cấp quyền người được mời'));
  await interaction.deferUpdate();

  // Nhắn riêng (DM) lời mời kèm nút link thẳng vào phòng voice. Người nhận tắt DM thì báo lại cho chủ phòng.
  const ownerName = interaction.member ? interaction.member.displayName : interaction.user.username;
  const roomUrl = `https://discord.com/channels/${channel.guild.id}/${channel.id}`;
  const dmOk = await target
    .send({
      content:
        `💘 **${ownerName}** mời bạn vào **Phòng Đôi** 💕 **${channel.name}** ở server **${channel.guild.name}**.\n` +
        `Bấm nút bên dưới để vào phòng voice. (Phòng Đôi tính phí **${LOVE_ROOM_RENT_PER_MINUTE} Công Đức/phút**/người khi cả hai ngồi trong phòng.)`,
      components: [
        new ActionRowBuilder().addComponents(new ButtonBuilder().setStyle(ButtonStyle.Link).setURL(roomUrl).setLabel('Vào Phòng Đôi').setEmoji('💕')),
      ],
      allowedMentions: { parse: [] },
    })
    .then(() => true)
    .catch(() => false);

  await interaction.editReply({
    content:
      `✅ Đã mời **${target.displayName || target.username}** vào Phòng Đôi 💕 — họ thấy & vào được phòng ngay.\n` +
      (dmOk ? '📩 Đã nhắn riêng lời mời cho họ.' : '⚠️ Không nhắn riêng được (họ đang tắt tin nhắn từ thành viên server) — mình đã tag họ trong chat phòng.'),
    components: [],
  });
  await channel
    .send({ content: `💘 <@${ownerId}> đã mời <@${target.id}> vào Phòng Đôi!`, allowedMentions: { users: [target.id] } })
    .catch(logErr('báo mời vào Phòng Đôi'));
}

// ---------------------------------------------------------------- mon!topdoi — thống kê ai ngồi Phòng Đôi với ai nhiều nhất
const TOPDOI_COOLDOWN_MS = 10 * 1000;
const topdoiAt = new Map(); // userId -> lần gọi gần nhất

function formatMinutes(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h} giờ ${m} phút` : `${m} phút`;
}

const MEDALS = ['🥇', '🥈', '🥉'];

client.on(Events.MessageCreate, async (message) => {
  try {
    if (message.author.bot) return;
    const m = /^mon!topdoi(\s|$)/i.exec(String(message.content || '').trim());
    if (!m) return;
    if (!message.guildId) return void (await message.reply('❌ Lệnh này chỉ dùng được trong server.'));
    if (!isBotReady()) return void (await replyNotReadyToMessage(message));
    if (!require('../features').isEnabled('loveroom')) return void (await message.reply({ content: '💕 Tính năng Phòng Đôi đang tắt.', allowedMentions: { parse: [], repliedUser: false } }));
    const now = Date.now();
    if (now - (topdoiAt.get(message.author.id) || 0) < TOPDOI_COOLDOWN_MS) return;
    topdoiAt.set(message.author.id, now);
    const noPing = { parse: [], repliedUser: false };

    await ensureTempVoiceSheets().catch(logErr('nạp sheet (mon!topdoi)'));
    const all = [...getLoveStats().values()];
    const target = message.mentions.users.first() || null;

    if (target) {
      const mine = all
        .filter((e) => e.a === target.id || e.b === target.id)
        .map((e) => ({ other: e.a === target.id ? e.b : e.a, minutes: e.minutes }))
        .sort((x, y) => y.minutes - x.minutes)
        .slice(0, 5);
      if (!mine.length) return void (await message.reply({ content: `💕 <@${target.id}> chưa ngồi Phòng Đôi với ai cả.`, allowedMentions: noPing }));
      const lines = mine.map((e, i) => `${MEDALS[i] || `**${i + 1}.**`} <@${e.other}> — ${formatMinutes(e.minutes)}`);
      return void (await message.reply({ content: `💕 **Người ấy của <@${target.id}>** (ngồi Phòng Đôi nhiều nhất)\n${lines.join('\n')}`, allowedMentions: noPing }));
    }

    const top = all.sort((x, y) => y.minutes - x.minutes).slice(0, 10);
    if (!top.length) return void (await message.reply({ content: '💕 Chưa có cặp nào ngồi Phòng Đôi cả.', allowedMentions: noPing }));
    const lines = top.map((e, i) => `${MEDALS[i] || `**${i + 1}.**`} <@${e.a}> 💕 <@${e.b}> — ${formatMinutes(e.minutes)}`);
    await message.reply({
      content: `💕 **Top cặp Phòng Đôi** (tổng thời gian 2 người cùng ngồi)\n${lines.join('\n')}\n_Gõ \`mon!topdoi @ai đó\` để xem "người ấy" của riêng họ._`,
      allowedMentions: noPing,
    });
  } catch (error) {
    console.error('[tempVoice] Lỗi mon!topdoi:', error && error.message ? error.message : error);
  }
});

// ---------------------------------------------------------------- mon!menuv — gọi lại menu (cả phòng thường & Phòng Đôi)
const MENUV_COOLDOWN_MS = 10 * 1000;
const menuvAt = new Map(); // channelId -> lần gọi gần nhất (chống spam)

client.on(Events.MessageCreate, async (message) => {
  try {
    if (message.author.bot) return;
    if (!/^mon!menuv\s*$/i.test(String(message.content || '').trim())) return;
    if (!message.guildId) return void (await message.reply('❌ Lệnh này chỉ dùng được trong server.'));
    if (!isBotReady()) return void (await replyNotReadyToMessage(message));
    const noMention = { parse: [], repliedUser: false };

    // Tìm phòng: ưu tiên chat của chính phòng voice tạm; không thì phòng voice tạm mà người gõ đang ngồi.
    let channel = getRoomOwner(message.channelId) ? message.channel : null;
    if (!channel) {
      const voiceCh = message.member && message.member.voice ? message.member.voice.channel : null;
      if (voiceCh && getRoomOwner(voiceCh.id)) channel = voiceCh;
    }
    if (!channel) {
      return void (await message.reply({
        content: '❌ Hãy gõ `mon!menuv` trong chat của phòng voice tạm, hoặc đang ngồi trong phòng của bạn rồi gõ lại.',
        allowedMentions: noMention,
      }));
    }
    if (getRoomOwner(channel.id) !== message.author.id) {
      return void (await message.reply({ content: '🚫 Chỉ chủ phòng mới gọi lại được menu.', allowedMentions: noMention }));
    }
    const now = Date.now();
    if (now - (menuvAt.get(channel.id) || 0) < MENUV_COOLDOWN_MS) return;
    menuvAt.set(channel.id, now);

    const ownerName = message.member ? message.member.displayName : message.author.username;
    await channel.send(buildMenu(channel, ownerName, null));
    if (channel.id !== message.channelId) {
      await message.reply({ content: `✅ Đã gửi lại menu vào chat của phòng <#${channel.id}>.`, allowedMentions: noMention }).catch(() => {});
    }
  } catch (error) {
    console.error('[tempVoice] Lỗi mon!menuv:', error && error.message ? error.message : error);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  const customId = interaction.customId;
  if (!customId || !customId.startsWith(`${PREFIX}:`)) return;
  if (!interaction.isButton() && !interaction.isModalSubmit() && !interaction.isUserSelectMenu()) return;

  try {
    const [, action, channelId] = customId.split(':');
    const ownerId = getRoomOwner(channelId);
    const channel = interaction.guild && interaction.guild.channels.cache.get(channelId);
    if (!ownerId || !channel) {
      await replyEphemeral(interaction, '❌ Phòng này không còn tồn tại.');
      return;
    }
    if (interaction.user.id !== ownerId) {
      await replyEphemeral(interaction, '🚫 Chỉ chủ phòng mới dùng được menu này.');
      return;
    }
    // Menu cũ còn sót nút Phòng Đôi sau khi phòng đã về phòng thường -> báo thay vì chạy sai.
    if ((action === 'inv' || action === 'invsel') && !isLoveRoom(channel)) {
      await replyEphemeral(interaction, '❌ Phòng này đang là phòng thường nên không mời kiểu Phòng Đôi được. Gõ `mon!menuv` để lấy menu mới.');
      return;
    }

    if (interaction.isButton()) {
      if (action === 'ren') {
        const modal = new ModalBuilder().setCustomId(`${PREFIX}:renm:${channelId}`).setTitle('Đổi tên phòng');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('name')
              .setLabel('Tên phòng mới')
              .setStyle(TextInputStyle.Short)
              .setMinLength(1)
              .setMaxLength(100)
              .setRequired(true)
              .setValue(stripLovePrefix(channel.name).slice(0, 100))
          )
        );
        await interaction.showModal(modal);
      } else if (action === 'hide') {
        await toggleHide(interaction, channel);
      } else if (action === 'allow') {
        await interaction.reply({
          content: '➕ Chọn người được phép thấy & vào phòng (gõ tên để tìm):',
          components: [userPicker('allowsel', channelId, 'Chọn tối đa 10 người…')],
          flags: MessageFlags.Ephemeral,
        });
      } else if (action === 'deny') {
        await interaction.reply({
          content: '➖ Chọn người muốn gỡ quyền:',
          components: [userPicker('denysel', channelId, 'Chọn tối đa 10 người…')],
          flags: MessageFlags.Ephemeral,
        });
      } else if (action === 'lock') {
        await toggleLock(interaction, channel);
      } else if (action === 'lim') {
        const modal = new ModalBuilder().setCustomId(`${PREFIX}:limm:${channelId}`).setTitle('Giới hạn số người');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('limit')
              .setLabel('Số người tối đa (0 = không giới hạn)')
              .setStyle(TextInputStyle.Short)
              .setMinLength(1)
              .setMaxLength(2)
              .setRequired(true)
              .setValue(String(channel.userLimit || 0))
          )
        );
        await interaction.showModal(modal);
      } else if (action === 'kick') {
        await interaction.reply({
          content: '🥾 Chọn người muốn đá khỏi phòng (bị chặn vào lại cho tới khi bạn ➕ Cho phép):',
          components: [userPicker('kicksel', channelId, 'Chọn tối đa 10 người…')],
          flags: MessageFlags.Ephemeral,
        });
      } else if (action === 'give') {
        await interaction.reply({
          content: '👑 Chọn người đang ngồi trong phòng để giao quyền chủ phòng:',
          components: [userPicker('givesel', channelId, 'Chọn 1 người…', 1)],
          flags: MessageFlags.Ephemeral,
        });
      } else if (action === 'unlove') {
        await revertLoveRoom(interaction, channel, ownerId);
      } else if (action === 'inv') {
        await interaction.reply({
          content: '💘 Chọn 1 người muốn mời vào Phòng Đôi (mời người mới sẽ thay người được mời trước đó):',
          components: [userPicker('invsel', channelId, 'Chọn 1 người…', 1)],
          flags: MessageFlags.Ephemeral,
        });
      }
    } else if (interaction.isModalSubmit() && action === 'renm') {
      await applyRename(interaction, channel, interaction.fields.getTextInputValue('name'));
    } else if (interaction.isModalSubmit() && action === 'limm') {
      await applyLimit(interaction, channel, interaction.fields.getTextInputValue('limit'));
    } else if (interaction.isUserSelectMenu()) {
      if (action === 'allowsel') await applyAllow(interaction, channel);
      else if (action === 'denysel') await applyDeny(interaction, channel, ownerId);
      else if (action === 'kicksel') await applyKick(interaction, channel, ownerId);
      else if (action === 'givesel') await applyGive(interaction, channel, ownerId);
      else if (action === 'invsel') await applyInvite(interaction, channel, ownerId);
    }
  } catch (error) {
    console.error('[tempVoice] Lỗi xử lý menu:', error.message);
    await replyEphemeral(interaction, `❌ Có lỗi: ${error.message}`).catch(() => {});
  }
});

module.exports = { startTempVoice };
