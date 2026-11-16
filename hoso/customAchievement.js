// ===== hoso/customAchievement.js — /themthanhtuu /suathanhtuu /xoathanhtuu /dsthanhtuu (cũng gõ được dạng mon!themthanhtuu …): THÀNH TỰU RIÊNG, tự đặt tên, CHỈ 1 NGƯỜI được dùng lệnh =====
// Khác thành tựu tự chọn đại trà (hoso/manualAchievements.js, nút 🏅 trong /profile, chọn từ danh sách LEVEL_ACHIEVEMENTS):
// ở đây tên + ghi chú gõ tự do, không nằm trong danh sách chung, và chỉ CUSTOM_ACHIEVEMENT_USER_ID (mặc định ADMIN_USER_ID,
// đổi được bằng ENV CUSTOM_ACHIEVEMENT_USER_ID) mới gõ được lệnh. Mỗi người nhận tối đa 1 thành tựu riêng (gắn lại = thay cái cũ),
// hiện trên thẻ /hoso cùng thành tựu tự chọn (nhãn "Độc quyền"). Lưu ở tab "Thành Tựu Riêng", cache RAM như manualAchievements.
// Module này KHÔNG require hoso/data hay level/profile để tránh vòng phụ thuộc (data.js gọi getCustomAchievements).
const { Events, SlashCommandBuilder } = require('discord.js');
const client = require('../client');
const { CUSTOM_ACHIEVEMENT_USER_ID, CUSTOM_ACHIEVEMENT_NAME_MAX, MANUAL_ACHIEVEMENT_NOTE_MAX } = require('../config');
const { isBotReady, replyNotReadyToInteraction, replyNotReadyToMessage } = require('../utils/readyGate');
const {
  ensureCustomAchievementSheetExists,
  getAllCustomAchievements,
  appendCustomAchievement,
  markCustomAchievementsRemoved,
} = require('../googleSheets/customAchievementSheet');

const USER_OPT = (opt, desc) => opt.setName('nguoi').setDescription(desc).setRequired(false);

const CUSTOM_ACHIEVEMENT_SLASH_COMMANDS = [
  new SlashCommandBuilder()
    .setName('themthanhtuu')
    .setDescription('(Chỉ admin) Gắn thành tựu tự đặt tên lên thẻ /hoso — gắn lại sẽ thay cái cũ')
    .addStringOption((opt) => opt.setName('ten').setDescription('Tên thành tựu (gõ tự do)').setRequired(true).setMaxLength(CUSTOM_ACHIEVEMENT_NAME_MAX))
    .addStringOption((opt) => opt.setName('ghi_chu').setDescription('Dòng mô tả nhỏ dưới tên (tuỳ chọn)').setRequired(false).setMaxLength(MANUAL_ACHIEVEMENT_NOTE_MAX))
    .addUserOption((opt) => USER_OPT(opt, 'Người nhận thành tựu (bỏ trống = chính bạn, KHÔNG dùng chung)')),
  new SlashCommandBuilder()
    .setName('suathanhtuu')
    .setDescription('(Chỉ admin) Sửa tên / ghi chú thành tựu riêng đã gắn (chỉ điền phần muốn đổi)')
    .addStringOption((opt) => opt.setName('ten').setDescription('Tên mới (bỏ trống = giữ nguyên)').setRequired(false).setMaxLength(CUSTOM_ACHIEVEMENT_NAME_MAX))
    .addStringOption((opt) => opt.setName('ghi_chu').setDescription('Ghi chú mới (gõ - để xoá ghi chú; bỏ trống = giữ nguyên)').setRequired(false).setMaxLength(MANUAL_ACHIEVEMENT_NOTE_MAX))
    .addUserOption((opt) => USER_OPT(opt, 'Người cần sửa (bỏ trống = chính bạn)')),
  new SlashCommandBuilder()
    .setName('xoathanhtuu')
    .setDescription('(Chỉ admin) Gỡ thành tựu riêng khỏi thẻ /hoso')
    .addUserOption((opt) => USER_OPT(opt, 'Người cần gỡ (bỏ trống = chính bạn)')),
  new SlashCommandBuilder().setName('dsthanhtuu').setDescription('(Chỉ admin) Xem danh sách thành tựu riêng đang gắn (chỉ hiện cho bạn)'),
];

// Cache RAM: discordId -> { tenThanhTuu, ghiChu } (mỗi người tối đa 1, chỉ giữ dòng "Còn"; dòng ghi sau cùng thắng).
let cache = new Map();
let loaded = false;

function rebuildCacheFromRows(rows) {
  const next = new Map();
  for (const row of rows) {
    if (row.trangThai !== 'Còn') continue;
    next.set(row.discordId, { tenThanhTuu: row.tenThanhTuu, ghiChu: row.ghiChu });
  }
  cache = next;
  loaded = true;
}

// Gọi 1 lần lúc khởi động (index.js, giai đoạn ngầm): đảm bảo tab Sheet tồn tại + nạp cache.
async function startCustomAchievements() {
  await ensureCustomAchievementSheetExists();
  rebuildCacheFromRows(await getAllCustomAchievements());
}

// Cho hoso/data.js: [{ tenThanhTuu, ghiChu, custom: true }] (tối đa 1 phần tử), [] nếu chưa nạp xong hoặc người đó không có.
function getCustomAchievements(discordId) {
  if (!loaded) return [];
  const one = cache.get(String(discordId));
  return one ? [{ tenThanhTuu: one.tenThanhTuu, ghiChu: one.ghiChu, custom: true }] : [];
}

// Gắn (hoặc thay) thành tựu riêng cho targetId. Trả { message } hoặc { error }; lỗi ghi Sheet thì ném ra (chỗ gọi bắt).
async function setCustomAchievement({ targetId, ten, ghiChu, actorId }) {
  const id = String(targetId);
  if (!loaded) return { error: '⏳ Dữ liệu thành tựu đang được nạp, thử lại sau ít phút.' };
  const name = String(ten || '').replace(/\s+/g, ' ').trim().slice(0, CUSTOM_ACHIEVEMENT_NAME_MAX);
  const note = String(ghiChu || '').replace(/\s+/g, ' ').trim().slice(0, MANUAL_ACHIEVEMENT_NOTE_MAX);
  if (!name) return { error: '❌ Tên thành tựu không được để trống.' };

  // Mỗi người chỉ 1 thành tựu riêng: có cái cũ thì gỡ trước (giữ lại lịch sử trong Sheet) rồi mới ghi cái mới.
  if (cache.has(id)) {
    await markCustomAchievementsRemoved(id);
    cache.delete(id);
  }
  await appendCustomAchievement({ discordId: id, tenThanhTuu: name, ghiChu: note, nguoiGan: String(actorId), createdAt: new Date() });
  cache.set(id, { tenThanhTuu: name, ghiChu: note });
  return { message: `⭐ Đã gắn thành tựu riêng **${name}**${note ? ` — _${note}_` : ''} cho <@${id}>. Gõ \`/hoso\` để xem trên thẻ.` };
}

// Sửa tại chỗ: giữ phần không điền. ghiChu '-' = xoá ghi chú. Ghi Sheet theo kiểu gỡ dòng cũ + thêm dòng mới (giữ lịch sử).
async function editCustomAchievement({ targetId, ten, ghiChu, actorId }) {
  const id = String(targetId);
  if (!loaded) return { error: '⏳ Dữ liệu thành tựu đang được nạp, thử lại sau ít phút.' };
  const cur = cache.get(id);
  if (!cur) return { error: `ℹ️ <@${id}> chưa có thành tựu riêng — dùng \`/themthanhtuu\` để gắn.` };
  if (!ten && !ghiChu) return { error: '❌ Điền ít nhất 1 phần muốn sửa (tên hoặc ghi chú).' };
  const newNote = ghiChu ? (String(ghiChu).trim() === '-' ? '' : ghiChu) : cur.ghiChu;
  return setCustomAchievement({ targetId: id, ten: ten || cur.tenThanhTuu, ghiChu: newNote, actorId });
}

async function removeCustomAchievement(targetId) {
  const id = String(targetId);
  if (!loaded) return { error: '⏳ Dữ liệu thành tựu đang được nạp, thử lại sau ít phút.' };
  const cur = cache.get(id);
  if (!cur) return { message: `ℹ️ <@${id}> chưa có thành tựu riêng nào để gỡ.` };
  await markCustomAchievementsRemoved(id);
  cache.delete(id);
  return { message: `🗑️ Đã gỡ thành tựu riêng **${cur.tenThanhTuu}** của <@${id}>.` };
}

function listCustomAchievementsText() {
  if (!loaded) return '⏳ Dữ liệu thành tựu đang được nạp, thử lại sau ít phút.';
  if (!cache.size) return 'ℹ️ Chưa có thành tựu riêng nào.';
  const lines = [...cache.entries()].map(([id, a], i) => `${i + 1}. <@${id}> — **${a.tenThanhTuu}**${a.ghiChu ? ` _(${a.ghiChu})_` : ''}`);
  let out = `⭐ **Thành tựu riêng đang gắn (${lines.length})**\n`;
  for (const line of lines) {
    if (out.length + line.length + 30 > 1900) return `${out}… và ${lines.length - out.split('\n').length + 2} người nữa (xem tab "Thành Tựu Riêng" trong Sheet).`;
    out += `${line}\n`;
  }
  return out;
}

const COMMAND_NAMES = ['themthanhtuu', 'suathanhtuu', 'xoathanhtuu', 'dsthanhtuu'];

// ---- Bản prefix (cùng quyền: chỉ CUSTOM_ACHIEVEMENT_USER_ID). Cú pháp:
//   mon!themthanhtuu [@người|ID] <tên> ; [ghi chú]   mon!suathanhtuu [@người|ID] [tên] ; [ghi chú] (ghi chú "-" = xoá)
//   mon!xoathanhtuu [@người|ID]                       mon!dsthanhtuu
// Không tag/không ID = chính người gõ. Kết quả gửi vào kênh nên tin trả lời CHỈ nhắc tên (không ping).
client.on(Events.MessageCreate, async (message) => {
  try {
    if (message.author.bot) return;
    const content = String(message.content || '').trim();
    const m = /^mon!(themthanhtuu|suathanhtuu|xoathanhtuu|dsthanhtuu)(\s|$)/i.exec(content);
    if (!m) return;
    if (!message.guildId) return;
    if (String(message.author.id) !== String(CUSTOM_ACHIEVEMENT_USER_ID)) return void (await message.reply({ content: '❌ Lệnh này không dành cho bạn.', allowedMentions: { parse: [], repliedUser: false } }));
    if (!isBotReady()) return void (await replyNotReadyToMessage(message));
    const name = m[1].toLowerCase();
    let rest = content.slice(m[0].length).trim();
    let target = message.mentions.users.first() || null;
    if (target) {
      rest = rest.replace(new RegExp(`<@!?${target.id}>`), '').trim();
    } else {
      const idMatch = rest.match(/(^|\s)(\d{17,20})(?=\s|$)/);
      if (idMatch) {
        target = await message.client.users.fetch(idMatch[2]).catch(() => null);
        if (target) rest = rest.replace(idMatch[2], '').trim();
      }
    }
    target = target || message.author;
    if (name !== 'dsthanhtuu' && target.bot) return void (await message.reply({ content: '❌ Không gắn thành tựu cho bot được.', allowedMentions: { parse: [], repliedUser: false } }));
    const [tenRaw, ...noteParts] = rest.split(';');
    const ten = String(tenRaw || '').trim().slice(0, CUSTOM_ACHIEVEMENT_NAME_MAX);
    const ghiChu = noteParts.join(';').trim().slice(0, MANUAL_ACHIEVEMENT_NOTE_MAX);
    let result;
    if (name === 'themthanhtuu') {
      if (!ten) return void (await message.reply({ content: 'Cú pháp: `mon!themthanhtuu [@người] <tên thành tựu> ; [ghi chú]`', allowedMentions: { parse: [], repliedUser: false } }));
      result = await setCustomAchievement({ targetId: target.id, ten, ghiChu, actorId: message.author.id });
    } else if (name === 'suathanhtuu') {
      result = await editCustomAchievement({ targetId: target.id, ten, ghiChu, actorId: message.author.id });
    } else if (name === 'xoathanhtuu') {
      result = await removeCustomAchievement(target.id);
    } else {
      result = { message: listCustomAchievementsText() };
    }
    await message.reply({ content: result.error || result.message, allowedMentions: { parse: [], repliedUser: false } });
  } catch (error) {
    console.error('[hoso] Lỗi lệnh mon! thành tựu riêng:', error.message);
    message.reply({ content: '❌ Có lỗi khi xử lý thành tựu riêng, xem log bot.', allowedMentions: { parse: [], repliedUser: false } }).catch(() => {});
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.isChatInputCommand() || !COMMAND_NAMES.includes(interaction.commandName)) return;
    if (!isBotReady()) return void (await replyNotReadyToInteraction(interaction));
    if (String(interaction.user.id) !== String(CUSTOM_ACHIEVEMENT_USER_ID)) {
      return void (await interaction.reply({ content: '❌ Lệnh này không dành cho bạn.', ephemeral: true }));
    }
    const name = interaction.commandName;
    const target = interaction.options.getUser('nguoi') || interaction.user;
    if (name !== 'dsthanhtuu' && target.bot) return void (await interaction.reply({ content: '❌ Không gắn thành tựu cho bot được.', ephemeral: true }));
    await interaction.deferReply({ ephemeral: true });
    let result;
    if (name === 'themthanhtuu') {
      result = await setCustomAchievement({
        targetId: target.id,
        ten: interaction.options.getString('ten', true),
        ghiChu: interaction.options.getString('ghi_chu') || '',
        actorId: interaction.user.id,
      });
    } else if (name === 'suathanhtuu') {
      result = await editCustomAchievement({
        targetId: target.id,
        ten: interaction.options.getString('ten') || '',
        ghiChu: interaction.options.getString('ghi_chu') || '',
        actorId: interaction.user.id,
      });
    } else if (name === 'xoathanhtuu') {
      result = await removeCustomAchievement(target.id);
    } else {
      result = { message: listCustomAchievementsText() };
    }
    await interaction.editReply({ content: result.error || result.message, allowedMentions: { parse: [] } });
  } catch (error) {
    console.error('[hoso] Lỗi lệnh thành tựu riêng:', error.message);
    try {
      const payload = { content: '❌ Có lỗi khi xử lý thành tựu riêng, xem log bot.' };
      if (interaction.deferred || interaction.replied) await interaction.editReply(payload);
      else await interaction.reply({ ...payload, ephemeral: true });
    } catch (_) {
      /* bỏ qua */
    }
  }
});

module.exports = { CUSTOM_ACHIEVEMENT_SLASH_COMMANDS, startCustomAchievements, getCustomAchievements };
