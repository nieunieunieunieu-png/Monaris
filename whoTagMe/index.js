// ===== /whotagme: xem ai đã tag / trả lời tin nhắn của mình trong 6 tiếng gần nhất =====
// - Chỉ lắng nghe tin nhắn (không đổi luồng xử lý của các module khác), không gọi AI.
// - Ghi lại: tin có @mention trực tiếp tới người nào đó, và tin reply vào tin của người nào đó.
// - Dữ liệu nằm trong RAM và được LƯU THÊM vào tab "WhoTagMe" của CÙNG Google Sheet với tab "ChatDigest"
//   (CHAT_DIGEST_SPREADSHEET_ID) để bot restart/redeploy vẫn còn. Pattern giống chatDigestSheet.js:
//   chỉ giữ cửa sổ 6 tiếng, mỗi lần lưu ghi đè toàn bộ cửa sổ, chỉ lưu khi có thay đổi (tối đa 1 lần/phút).
// - Kết quả chỉ hiện cho người gõ lệnh (ephemeral), không ping ai.
// Cột tab WhoTagMe: A = id tin, B = userId người được tag, C = userId người tag, D = timestamp (ms),
//   E = giờ VN, F = id kênh, G = id server, H = loại (tag|reply|both), I = tên người tag.
// id/userId ghi dạng CHỮ (RAW) để Sheets không làm tròn số 18-19 chữ số của Discord.
const { Events, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const client = require('../client');
const { google } = require('../googleSheets/googleClient');
const { getGoogleAuthClient } = require('../googleSheets/auth');
const { retryOnQuotaExceeded } = require('../utils/retry');
const { CHAT_DIGEST_SPREADSHEET_ID } = require('../config');

const WINDOW_HOURS = 6;
const WINDOW_MS = WINDOW_HOURS * 60 * 60 * 1000;
const MAX_PER_USER = 60; // tối đa số lượt nhớ cho mỗi người (cũ nhất bị bỏ)
const MAX_TOTAL = 2500; // trần tổng số dòng lưu RAM + Sheet (bảo vệ RAM/quota)
const MAX_LINES = 25; // số dòng tối đa hiện trong 1 lần gọi
const FLUSH_INTERVAL_MS = 60 * 1000;
const FIRST_LOAD_DELAY_MS = 25_000; // lệch với chatDigest (20s) để không dồn quota Sheets lúc vừa deploy
const LOAD_WAIT_FOR_COMMAND_MS = 10_000; // lệnh gọi sớm thì đợi nạp tối đa chừng này rồi dùng dữ liệu đang có

const WHOTAGME_SHEET_NAME = 'WhoTagMe';
const HEADER_ROW = ['id tin', 'userId được tag', 'userId người tag', 'timestamp', 'giờ VN', 'id kênh', 'id server', 'loại', 'tên người tag'];
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

const WHOTAGME_SLASH_COMMANDS = [
  new SlashCommandBuilder()
    .setName('whotagme')
    .setDescription(`Xem ai đã tag hoặc trả lời tin nhắn của bạn trong ${WINDOW_HOURS} tiếng gần đây`)
    .addIntegerOption((o) =>
      o
        .setName('gio')
        .setDescription(`Chỉ xem trong N tiếng gần đây (mặc định ${WINDOW_HOURS}, tối đa ${WINDOW_HOURS})`)
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(WINDOW_HOURS)
    ),
].map((cmd) => cmd.toJSON());

// ---- Kho trong RAM ----------------------------------------------------------------------

// targetUserId -> [{ messageId, byId, byName, at, guildId, channelId, tag, reply }]  (cũ -> mới)
const mentionLog = new Map();
let dirty = false; // có thay đổi chưa lưu lên Sheet
let loaded = false; // đã nạp từ Sheet xong -> mới được ghi đè Sheet (tránh ghi đè dữ liệu cũ bằng dữ liệu thiếu)
let loadPromise = null;
let flushing = false;

function markDirty() {
  dirty = true;
}

function totalCount() {
  let n = 0;
  for (const list of mentionLog.values()) n += list.length;
  return n;
}

function addEntry(targetId, entry) {
  let list = mentionLog.get(targetId);
  if (!list) {
    list = [];
    mentionLog.set(targetId, list);
  }
  if (list.some((e) => e.messageId === entry.messageId)) return; // đã có (vd nạp lại từ Sheet)
  if (totalCount() >= MAX_TOTAL && !list.length) {
    mentionLog.delete(targetId);
    return; // quá tải: bỏ qua người mới thay vì ăn thêm RAM
  }
  list.push(entry);
  if (list.length > MAX_PER_USER) list.splice(0, list.length - MAX_PER_USER);
  markDirty();
}

function prune() {
  const cutoff = Date.now() - WINDOW_MS;
  for (const [targetId, list] of mentionLog) {
    const kept = list.filter((e) => e.at >= cutoff);
    if (kept.length === list.length) continue;
    markDirty();
    if (kept.length) mentionLog.set(targetId, kept);
    else mentionLog.delete(targetId);
  }
}

// ---- Lưu / nạp Google Sheet --------------------------------------------------------------

let sheetReady = false;
let lastRowCount = 0;

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatVnTime(ts) {
  const d = new Date(ts + VN_OFFSET_MS);
  return `${pad2(d.getUTCDate())}/${pad2(d.getUTCMonth() + 1)} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`;
}

async function getSheetsApi() {
  const authClient = await getGoogleAuthClient();
  if (!authClient) return null;
  return google.sheets({ version: 'v4', auth: authClient });
}

async function ensureSheetExists(sheets) {
  if (sheetReady) return;
  const response = await sheets.spreadsheets.get({ spreadsheetId: CHAT_DIGEST_SPREADSHEET_ID });
  const exists = (response.data.sheets || []).some((s) => s.properties.title === WHOTAGME_SHEET_NAME);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: CHAT_DIGEST_SPREADSHEET_ID,
      resource: { requests: [{ addSheet: { properties: { title: WHOTAGME_SHEET_NAME } } }] },
    });
  }
  const head = await sheets.spreadsheets.values
    .get({ spreadsheetId: CHAT_DIGEST_SPREADSHEET_ID, range: `'${WHOTAGME_SHEET_NAME}'!A1:I1` })
    .catch(() => ({ data: {} }));
  if (!(head.data.values || []).length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: CHAT_DIGEST_SPREADSHEET_ID,
      range: `'${WHOTAGME_SHEET_NAME}'!A1:I1`,
      valueInputOption: 'RAW',
      resource: { values: [HEADER_ROW] },
    });
  }
  sheetReady = true;
}

function kindOf(entry) {
  if (entry.tag && entry.reply) return 'both';
  return entry.reply ? 'reply' : 'tag';
}

async function loadFromSheet() {
  if (!CHAT_DIGEST_SPREADSHEET_ID) return;
  const sheets = await getSheetsApi();
  if (!sheets) throw new Error('Chưa có Google auth');

  const rows = await retryOnQuotaExceeded(
    async () => {
      await ensureSheetExists(sheets);
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: CHAT_DIGEST_SPREADSHEET_ID,
        range: `'${WHOTAGME_SHEET_NAME}'!A2:I`,
      });
      return response.data.values || [];
    },
    { attempts: 3, baseDelayMs: 20_000, label: 'WhoTagMe load' }
  );

  lastRowCount = rows.length;
  const cutoff = Date.now() - WINDOW_MS;
  const parsed = [];
  for (const row of rows) {
    const at = Number(row[3]);
    const messageId = String(row[0] || '');
    const targetId = String(row[1] || '');
    if (!messageId || !targetId || !Number.isFinite(at) || at < cutoff) continue;
    const kind = String(row[7] || 'tag');
    parsed.push({
      targetId,
      entry: {
        messageId,
        byId: String(row[2] || ''),
        byName: String(row[8] || ''),
        at,
        guildId: String(row[6] || ''),
        channelId: String(row[5] || ''),
        tag: kind === 'tag' || kind === 'both',
        reply: kind === 'reply' || kind === 'both',
      },
    });
  }
  // Gộp với những gì đã ghi nhận trong RAM từ lúc bot khởi động tới giờ (không mất tin mới).
  for (const { targetId, entry } of parsed) {
    if (!entry.byId || !entry.guildId || !entry.channelId) continue;
    addEntry(targetId, entry);
  }
  for (const list of mentionLog.values()) list.sort((a, b) => a.at - b.at);
}

function ensureLoaded() {
  if (loaded) return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = loadFromSheet()
    .then(() => {
      loaded = true;
      markDirty(); // gộp xong -> lưu lại bản đầy đủ ở lần flush tới
    })
    .catch((error) => {
      console.error('[WhoTagMe] Không nạp được từ Sheet (sẽ thử lại):', error.message);
    })
    .finally(() => {
      loadPromise = null;
    });
  return loadPromise;
}

async function saveToSheet(rows) {
  if (!CHAT_DIGEST_SPREADSHEET_ID) return;
  const sheets = await getSheetsApi();
  if (!sheets) return;
  await retryOnQuotaExceeded(
    async () => {
      await ensureSheetExists(sheets);
      // Ghi dữ liệu mới TRƯỚC rồi mới xoá phần dư phía dưới: lỡ bot sập giữa chừng thì Sheet vẫn còn dữ liệu.
      if (rows.length) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: CHAT_DIGEST_SPREADSHEET_ID,
          range: `'${WHOTAGME_SHEET_NAME}'!A2`,
          valueInputOption: 'RAW',
          resource: { values: rows },
        });
      }
      if (lastRowCount > rows.length) {
        await sheets.spreadsheets.values.clear({
          spreadsheetId: CHAT_DIGEST_SPREADSHEET_ID,
          range: `'${WHOTAGME_SHEET_NAME}'!A${rows.length + 2}:I${lastRowCount + 1}`,
        });
      }
      lastRowCount = rows.length;
    },
    { attempts: 3, baseDelayMs: 20_000, label: 'WhoTagMe save' }
  );
}

async function flushToSheet() {
  if (flushing) return;
  if (!loaded) await ensureLoaded(); // chưa nạp xong thì KHÔNG ghi đè Sheet
  if (!loaded || !dirty) return;
  flushing = true;
  dirty = false; // thay đổi mới trong lúc lưu sẽ bật lại cờ này
  try {
    const all = [];
    for (const [targetId, list] of mentionLog) for (const e of list) all.push({ targetId, e });
    all.sort((a, b) => a.e.at - b.e.at);
    const keep = all.length > MAX_TOTAL ? all.slice(all.length - MAX_TOTAL) : all;
    await saveToSheet(
      keep.map(({ targetId, e }) => [e.messageId, targetId, e.byId, String(e.at), formatVnTime(e.at), e.channelId, e.guildId, kindOf(e), e.byName || ''])
    );
  } catch (error) {
    dirty = true; // lưu lỗi -> lần sau thử lại
    console.error('[WhoTagMe] Lỗi lưu Sheet:', error.message);
  } finally {
    flushing = false;
  }
}

function startBackground() {
  setTimeout(() => ensureLoaded().catch(() => {}), FIRST_LOAD_DELAY_MS).unref();
  setInterval(() => {
    try {
      prune();
    } catch (error) {
      console.error('[WhoTagMe] Lỗi dọn bản ghi:', error.message);
    }
    flushToSheet().catch(() => {});
  }, FLUSH_INTERVAL_MS).unref();
}

if (client.isReady()) startBackground();
else client.once(Events.ClientReady, startBackground);

// ---- Ghi nhận tag / reply ---------------------------------------------------------------

function hasExplicitMention(content, userId) {
  return content.includes(`<@${userId}>`) || content.includes(`<@!${userId}>`);
}

// Người được reply: ưu tiên mentions.repliedUser (có cả khi tắt ping), không có thì thử tin trong cache.
function getRepliedUserId(message) {
  const direct = message.mentions && message.mentions.repliedUser;
  if (direct) return direct.id;
  const refId = message.reference && message.reference.messageId;
  if (!refId || !message.channel || !message.channel.messages) return '';
  const cached = message.channel.messages.cache.get(refId);
  return cached && cached.author ? cached.author.id : '';
}

client.on(Events.MessageCreate, (message) => {
  try {
    if (!message.guildId || !message.author || message.author.bot || message.webhookId) return;
    if (!require('../features').isEnabled('whotagme')) return; // công tắc web: tắt thì ngừng ghi lượt tag

    const content = message.content || '';
    const repliedId = message.reference ? getRepliedUserId(message) : '';
    const targets = new Map(); // targetId -> { tag, reply }

    if (message.mentions && message.mentions.users) {
      for (const [id, user] of message.mentions.users) {
        if (user.bot) continue;
        const tag = hasExplicitMention(content, id);
        const reply = id === repliedId;
        if (tag || reply) targets.set(id, { tag, reply });
      }
    }
    // Reply tắt ping: không nằm trong mentions.users nhưng vẫn là "trả lời" người đó.
    if (repliedId && !targets.has(repliedId)) {
      const repliedUser = message.mentions && message.mentions.repliedUser;
      if (!repliedUser || !repliedUser.bot) targets.set(repliedId, { tag: false, reply: true });
    }

    if (!targets.size) return;
    const at = message.createdTimestamp || Date.now();
    const byName = String((message.member && message.member.displayName) || message.author.globalName || message.author.username || '').slice(0, 60);
    for (const [targetId, kind] of targets) {
      if (targetId === message.author.id) continue; // tự tag / tự reply mình thì bỏ
      addEntry(targetId, {
        messageId: message.id,
        byId: message.author.id,
        byName,
        at,
        guildId: message.guildId,
        channelId: message.channelId,
        tag: kind.tag,
        reply: kind.reply,
      });
    }
  } catch (error) {
    console.error('[WhoTagMe] Lỗi ghi nhận tag/reply:', error.message);
  }
});

// Tin bị xoá (kể cả bị bộ lọc từ khoá xoá) thì bỏ khỏi danh sách, tránh link chết.
function removeMessageIds(ids) {
  const set = new Set(ids);
  for (const [targetId, list] of mentionLog) {
    const kept = list.filter((e) => !set.has(e.messageId));
    if (kept.length === list.length) continue;
    markDirty();
    if (kept.length) mentionLog.set(targetId, kept);
    else mentionLog.delete(targetId);
  }
}

client.on(Events.MessageDelete, (message) => {
  try {
    if (message && message.id) removeMessageIds([message.id]);
  } catch (error) {
    console.error('[WhoTagMe] Lỗi bỏ tin đã xoá:', error.message);
  }
});

client.on(Events.MessageBulkDelete, (messages) => {
  try {
    removeMessageIds([...messages.keys()]);
  } catch (error) {
    console.error('[WhoTagMe] Lỗi bỏ tin đã xoá hàng loạt:', error.message);
  }
});

// ---- Lệnh /whotagme ---------------------------------------------------------------------

function describeKind(entry) {
  if (entry.tag && entry.reply) return 'tag & trả lời';
  return entry.reply ? 'trả lời' : 'tag';
}

// "<user> đã tag/trả lời bạn lúc <thời gian> + link" — link dạng [Link](...) giống bài tóm tắt chat.
function formatEntry(entry) {
  const unix = Math.floor(entry.at / 1000);
  const link = `https://discord.com/channels/${entry.guildId}/${entry.channelId}/${entry.messageId}`;
  return `<@${entry.byId}> đã ${describeKind(entry)} bạn lúc <t:${unix}:t> (<t:${unix}:R>) [Link](${link})`;
}

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'whotagme') return;

    await interaction.deferReply({ ephemeral: true });

    // Gọi sớm sau khi bot vừa bật: đợi nạp lại dữ liệu cũ từ Sheet (tối đa vài giây) rồi hiện những gì đang có.
    let loadNote = '';
    if (!loaded) {
      await Promise.race([ensureLoaded(), new Promise((resolve) => setTimeout(resolve, LOAD_WAIT_FOR_COMMAND_MS))]);
      if (!loaded) loadNote = ' (đang nạp dữ liệu cũ, có thể còn thiếu)';
    }

    const hours = Math.min(WINDOW_HOURS, Math.max(1, interaction.options.getInteger('gio') || WINDOW_HOURS));
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    const list = (mentionLog.get(interaction.user.id) || []).filter((e) => e.at >= cutoff);

    if (!list.length) {
      await interaction.editReply({ content: `📭 Không ai tag hay trả lời bạn trong ${hours} tiếng gần đây${loadNote}.` });
      return;
    }

    const newestFirst = list.slice().reverse();
    const shown = newestFirst.slice(0, MAX_LINES).map(formatEntry);
    const extra = newestFirst.length - shown.length;
    const footer = extra > 0 ? `Hiện ${shown.length} lượt mới nhất, còn ${extra} lượt cũ hơn.` : `Tổng ${shown.length} lượt (mới nhất trước).`;

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`🔔 Ai đã tag/trả lời bạn (${hours} tiếng gần đây)`)
      .setDescription(shown.join('\n').slice(0, 4000))
      .setFooter({ text: `${footer}${loadNote}` });

    await interaction.editReply({ embeds: [embed], allowedMentions: { parse: [] } });
  } catch (error) {
    console.error('[WhoTagMe] Lỗi /whotagme:', error.message);
    try {
      if (interaction.deferred || interaction.replied) await interaction.editReply({ content: '❌ Có lỗi khi xem danh sách tag, xem log bot.' });
      else await interaction.reply({ content: '❌ Có lỗi khi xem danh sách tag, xem log bot.', ephemeral: true });
    } catch (_) {
      /* bỏ qua */
    }
  }
});

module.exports = { WHOTAGME_SLASH_COMMANDS };
