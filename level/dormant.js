// ===== level/dormant.js — người "ngủ đông": còn trong server + tab Bang nhưng lâu không có EXP thật =====
// Mốc tính = cột "Ngày HĐ Cuối" (streakDay: ngày VN gần nhất có EXP thật), KHÔNG dùng lastAt. Ngưỡng N = LEVEL_DORMANT_DAYS (mặc định 14).
// Số ngày không hoạt động = (hôm nay - ngày mốc) theo giờ VN. Mốc = max(Ngày HĐ Cuối, ngày vào server), nên người mới vào server chưa đủ N ngày
// không bao giờ bị liệt kê; người chưa từng có EXP chỉ bị liệt kê khi đã vào server >= N ngày. Loại bot, người đã rời server, người ngoài tab Bang
// hoặc đã đánh dấu "Không Trong Bang". Chỉ ĐỌC (tab Bang đọc 1 lần, cache 60 giây; danh sách thành viên server cache 5 phút).
// Dùng ở: level/monthly.js (field "😴 Ngủ đông" trong Tổng kết tháng) và lệnh /nguodong + mon!nguodong (Bông).
const { Events, EmbedBuilder, escapeMarkdown } = require('discord.js');
const client = require('../client');
const { LEVEL_ENABLED, LEVEL_DORMANT_DAYS, LEVEL_DORMANT_MONTHLY_MAX, BONG_ROLE_ID, ADMIN_USER_ID } = require('../config');
const { getBangMemberList } = require('../googleSheets/memberSheet');
const status = require('../monitoring/status');
const profile = require('./profile');
const { isBotReady, replyNotReadyToInteraction, replyNotReadyToMessage } = require('../utils/readyGate');

const DAY_MS = 24 * 60 * 60 * 1000;
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const BANG_CACHE_MS = 60 * 1000;
const MEMBERS_FETCH_MS = 5 * 60 * 1000;
const EMBED_CHARS = 3800; // chừa chỗ dưới giới hạn 4096 của description
const EMBEDS_PER_MESSAGE = 10;
const NO_PERMISSION = '❌ Bạn không có quyền sử dụng lệnh này. Cần role Bông.';

let deps = null; // { getMembers: () => Map, isLoaded: () => boolean }
let bangCache = { at: 0, ids: null };
let lastMembersFetch = 0;
let running = false;

const vnDay = (ms) => new Date(ms + VN_OFFSET_MS).toISOString().slice(0, 10);
const dayNum = (s) => Math.floor(Date.parse(`${s}T00:00:00Z`) / DAY_MS);

async function bangIds() {
  if (bangCache.ids && Date.now() - bangCache.at < BANG_CACHE_MS) return bangCache.ids;
  try {
    const rows = await getBangMemberList();
    const ids = new Set(rows.filter((r) => !r.khongTrongBang).map((r) => String(r.discordId)));
    bangCache = { at: Date.now(), ids };
    status.recordSheetOk('Ngủ đông: tab Bang');
    return ids;
  } catch (error) {
    status.recordSheetError('Ngủ đông: tab Bang', error);
    throw error;
  }
}

async function ensureGuildMembers(guild) {
  if (Date.now() - lastMembersFetch < MEMBERS_FETCH_MS) return;
  try {
    await guild.members.fetch();
    lastMembersFetch = Date.now();
  } catch (error) {
    console.error('[level] Ngủ đông: không nạp được danh sách thành viên server:', error.message);
  }
}

// Trả { days: N, list: [{ id, name, days, level, noDay }] } sắp theo số ngày giảm dần. Ném lỗi nếu không đọc được tab Bang
// (không có danh sách Bang thì không thể biết ai đang trong bang -> không liệt kê bừa).
async function collect(guild) {
  const ids = await bangIds();
  await ensureGuildMembers(guild);
  const members = deps.getMembers();
  const today = dayNum(vnDay(Date.now()));
  const found = [];
  for (const id of ids) {
    const gm = guild.members.cache.get(id);
    if (!gm || gm.user.bot) continue; // đã rời server / bot
    const rec = members.get(id) || null;
    const streakDay = rec && /^\d{4}-\d{2}-\d{2}$/.test(String(rec.streakDay || '')) ? rec.streakDay : '';
    const joinNum = gm.joinedTimestamp ? dayNum(vnDay(gm.joinedTimestamp)) : null;
    let base;
    if (streakDay) base = joinNum !== null ? Math.max(dayNum(streakDay), joinNum) : dayNum(streakDay);
    else base = joinNum;
    if (base === null) continue; // không biết mốc nào -> không kết luận
    const days = today - base;
    if (days < LEVEL_DORMANT_DAYS) continue;
    found.push({ id, gm, days, noDay: !streakDay, hasExp: Boolean(rec && rec.exp > 0), level: rec ? Number(rec.level) || 0 : 0 });
  }
  found.sort((a, b) => b.days - a.days);
  const list = [];
  for (const f of found) {
    // Biệt danh > ingame > tên Discord (cùng cách các thẻ đang dùng).
    const name = await profile.resolveName(f.id, f.gm.displayName || f.gm.user.globalName || f.gm.user.username).catch(() => f.gm.displayName || f.gm.user.username);
    list.push({ id: f.id, name, days: f.days, level: f.level, noDay: f.noDay, hasExp: f.hasExp });
  }
  return { days: LEVEL_DORMANT_DAYS, list };
}

function lineOf(x) {
  const name = `**${escapeMarkdown(String(x.name || 'Thành viên'))}**`;
  const what = x.noDay ? (x.hasExp ? `chưa ghi nhận ngày HĐ cuối, vào server ${x.days} ngày` : `chưa từng có EXP, vào server ${x.days} ngày`) : `${x.days} ngày không hoạt động`;
  return `${name} — ${what} · Cấp ${x.level}`;
}

// Field cho Tổng kết tháng: tối đa LEVEL_DORMANT_MONTHLY_MAX tên, còn thừa ghi "và N người khác". null = không có ai / lỗi (không chèn field).
async function monthlyField(guild) {
  if (!LEVEL_ENABLED || !deps || !deps.isLoaded() || !guild) return null;
  const res = await collect(guild);
  if (!res.list.length) return null;
  const shown = [];
  let len = 0;
  for (const x of res.list.slice(0, LEVEL_DORMANT_MONTHLY_MAX)) {
    const line = lineOf(x);
    if (len + line.length + 1 > 850) break;
    shown.push(line);
    len += line.length + 1;
  }
  const rest = res.list.length - shown.length;
  if (rest > 0) shown.push(`… và ${rest} người khác (xem \`/nguodong\`)`);
  return { name: `😴 Ngủ đông (từ ${res.days} ngày không có EXP)`, value: shown.join('\n').slice(0, 1024), inline: false };
}

function buildEmbeds(res) {
  if (!res.list.length) {
    return [new EmbedBuilder().setColor(0x2ecc71).setTitle('😴 Người ngủ đông').setDescription(`Không có ai ngủ đông ✅ (ngưỡng ${res.days} ngày không có EXP thật).`)];
  }
  const chunks = [];
  let cur = [];
  let len = 0;
  for (const x of res.list) {
    const line = lineOf(x);
    if (cur.length && len + line.length + 1 > EMBED_CHARS) {
      chunks.push(cur);
      cur = [];
      len = 0;
    }
    cur.push(line);
    len += line.length + 1;
  }
  if (cur.length) chunks.push(cur);
  return chunks.map((lines, i) =>
    new EmbedBuilder()
      .setColor(0x7f8c8d)
      .setTitle(i === 0 ? `😴 Người ngủ đông — ${res.list.length} người` : '😴 Người ngủ đông (tiếp)')
      .setDescription(lines.join('\n'))
      .setFooter({ text: `Trang ${i + 1}/${chunks.length} · từ ${res.days} ngày không có EXP thật (theo "Ngày HĐ Cuối")` })
  );
}

function canUse(userId, member) {
  
  const roles = member && member.roles && member.roles.cache;
  return Boolean(roles && roles.has(BONG_ROLE_ID));
}

// Trả { content } (thông báo) hoặc { batches: [[embed...], ...] } (mỗi lô <= 10 embed).
async function run(guild) {
  if (!deps || !deps.isLoaded()) return { content: 'Dữ liệu level chưa nạp xong, thử lại sau ít giây.' };
  if (running) return { content: '⏳ Đang tổng hợp rồi, đợi xong lượt này nhé.' };
  running = true;
  try {
    const embeds = buildEmbeds(await collect(guild));
    const batches = [];
    for (let i = 0; i < embeds.length; i += EMBEDS_PER_MESSAGE) batches.push(embeds.slice(i, i + EMBEDS_PER_MESSAGE));
    return { batches };
  } catch (error) {
    console.error('[level] Lỗi /nguodong:', error.message);
    return { content: '❌ Không lấy được danh sách (có thể lỗi đọc tab Bang), xem log bot hoặc /status.' };
  } finally {
    running = false;
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'nguodong') return;
    if (!isBotReady()) return void (await replyNotReadyToInteraction(interaction));
    if (!LEVEL_ENABLED) return void (await interaction.reply({ content: 'Hệ thống level đang tắt.', ephemeral: true }));
    if (!interaction.guildId || !canUse(interaction.user.id, interaction.member)) return void (await interaction.reply({ content: NO_PERMISSION, ephemeral: true }));
    await interaction.deferReply({ ephemeral: true });
    const out = await run(interaction.guild);
    if (out.content) return void (await interaction.editReply({ content: out.content }));
    await interaction.editReply({ embeds: out.batches[0], allowedMentions: { parse: [] } });
    for (const batch of out.batches.slice(1)) await interaction.followUp({ embeds: batch, ephemeral: true, allowedMentions: { parse: [] } });
  } catch (error) {
    console.error('[level] Lỗi slash /nguodong:', error.message);
    try {
      if (interaction.deferred || interaction.replied) await interaction.editReply({ content: '❌ Có lỗi khi lấy danh sách, xem log bot.' });
    } catch (_) {
      /* bỏ qua */
    }
  }
});

// mon!nguodong không có chế độ "chỉ mình bạn thấy" như slash -> trả lời công khai trong kênh gõ lệnh (chỉ Bông/admin gõ được).
client.on(Events.MessageCreate, async (message) => {
  try {
    if (message.author.bot || !message.guildId || !/^mon!nguodong(\s|$)/i.test(String(message.content || '').trim())) return;
    if (!LEVEL_ENABLED) return;
    if (!isBotReady()) return void (await replyNotReadyToMessage(message));
    if (!canUse(message.author.id, message.member)) return void (await message.reply({ content: NO_PERMISSION, allowedMentions: { repliedUser: false } }));
    const out = await run(message.guild);
    if (out.content) return void (await message.reply({ content: out.content, allowedMentions: { parse: [], repliedUser: false } }));
    await message.reply({ embeds: out.batches[0], allowedMentions: { parse: [], repliedUser: false } });
    for (const batch of out.batches.slice(1)) await message.channel.send({ embeds: batch, allowedMentions: { parse: [] } });
  } catch (error) {
    console.error('[level] Lỗi lệnh mon!nguodong:', error.message);
  }
});

module.exports = {
  init(d) {
    deps = d;
  },
  monthlyField,
};
