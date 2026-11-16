// ===== Bộ lọc từ khoá nhạy cảm =====
// Tin nhắn (mới HOẶC vừa sửa) trong server chứa từ khoá ở tab "Từ Khoá Nhạy Cảm" (xem
// googleSheets/keywordFilterSheet.js) -> bot XOÁ tin đó và gửi log vào kênh
// KEYWORD_FILTER_LOG_CHANNEL_ID (config/keywordFilter.js) để admin biết ai nói gì, ở đâu.
//
// So khớp: chữ thường + mọi ký tự không phải chữ/số thành khoảng trắng, rồi tìm CẢ CỤM từ khoá theo
// ranh giới từ ("out bang" bắt "OUT bang", "out-bang", "Out Bang!"; KHÔNG bắt "about bangkok").
// Mỗi từ khoá thử theo 2 cách, để KHÔNG xoá nhầm chữ khác chỉ vì giống nhau khi bỏ dấu (vd "đĩ" ≠ "đi", "dì", "dĩ"):
//   - cột "có dấu"   : so với tin GIỮ NGUYÊN dấu (đĩ chỉ khớp "đĩ"; "đi" / "dì" / "dĩ nhiên" KHÔNG bị xoá).
//   - cột "không dấu": chỉ so với những TỪ trong tin được gõ hoàn toàn không dấu (để bắt người gõ "di", "roi bang" lách luật).
//                      Từ có dấu / có đ ("đi", "rồi") không bao giờ khớp cột này. Cột B bỏ trống thì bot tự bỏ dấu cột A.
//
// Bot cần quyền Manage Messages + View Channel ở các kênh cần lọc, và Send Messages + Embed
// Links ở kênh log. Thiếu quyền xoá -> vẫn gửi log, ghi rõ "KHÔNG XOÁ ĐƯỢC".
// Nếu chưa đọc được sheet (lỗi Sheets/quota), bot dùng tạm danh sách mặc định trong code.

const { Events, EmbedBuilder } = require('discord.js');
const client = require('../client');
const {
  KEYWORD_FILTER_LOG_CHANNEL_ID,
  KEYWORD_FILTER_REFRESH_MINUTES,
  KEYWORD_FILTER_EXEMPT_IDS,
} = require('../config');
const { readKeywordRows, ensureKeywordFilterSheetExists } = require('../googleSheets/keywordFilterSheet');
const { quotaFriendlyMessage } = require('../utils/retry');

const DEFAULT_KEYWORDS = [
  { accented: 'out bang', plain: 'out bang', enabled: true },
  { accented: 'rời bang', plain: 'roi bang', enabled: true },
];

// Chuẩn hoá để so khớp: bỏ ký tự vô hình, bỏ dấu, đ->d, chữ thường, ký tự lạ -> khoảng trắng.
function normalize(text) {
  return String(text || '')
    .replace(/[\u200b-\u200f\u2060\ufeff]/g, '')
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

// Chuẩn hoá GIỮ dấu (dùng cho cột "có dấu"): NFC, bỏ ký tự vô hình, chữ thường, ký tự lạ -> khoảng trắng. "đ" vẫn là "đ", "ĩ" vẫn là "ĩ".
function normalizeAccented(text) {
  return String(text || '')
    .replace(/[\u200b-\u200f\u2060\ufeff]/g, '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

// Chuẩn hoá tin nhắn cho cột "không dấu": chỉ giữ nguyên những từ gõ hoàn toàn bằng chữ không dấu (a-z, 0-9);
// từ nào có dấu / có "đ" / chữ ngoài ASCII thì thay bằng "~" (không khớp được từ khoá nào, nhưng vẫn giữ ranh giới từ).
function normalizePlainText(text) {
  return String(text || '')
    .replace(/[\u200b-\u200f\u2060\ufeff]/g, '')
    .normalize('NFC')
    .toLowerCase()
    .split(/[^\p{L}\p{N}\p{M}]+/u)
    .filter(Boolean)
    .map((word) => (/[^\u0000-\u007f]/.test(word) ? '~' : word))
    .join(' ');
}

// Danh sách cụm đã chuẩn hoá: [{ pattern, label, mode }] — label là chữ hiển thị trong log; mode 'accent' | 'plain'.
let compiled = [];
let loadedFromSheet = false;

function compileKeywords(rows) {
  const out = [];
  const seen = new Set();
  for (const row of rows) {
    if (!row.enabled) continue;
    const label = row.accented || row.plain;
    const variants = [
      { mode: 'accent', pattern: normalizeAccented(row.accented) },
      { mode: 'plain', pattern: normalize(row.plain || row.accented) }, // cột B trống -> tự bỏ dấu cột A
    ];
    for (const { mode, pattern } of variants) {
      const key = `${mode}:${pattern}`;
      if (!pattern || seen.has(key)) continue;
      seen.add(key);
      out.push({ pattern, label, mode });
    }
  }
  return out;
}

compiled = compileKeywords(DEFAULT_KEYWORDS);

async function refreshKeywords() {
  try {
    const rows = await readKeywordRows();
    compiled = compileKeywords(rows);
    loadedFromSheet = true;
    console.log(`[KeywordFilter] Đã nạp ${compiled.length} cụm từ khoá từ sheet.`);
  } catch (error) {
    // Giữ nguyên danh sách hiện có (không ghi đè bằng rỗng khi Sheets lỗi tạm thời).
    console.error('[KeywordFilter] Không đọc được sheet từ khoá (giữ danh sách cũ):', quotaFriendlyMessage(error));
  }
}

function findMatchedKeyword(content) {
  const accented = ` ${normalizeAccented(content)} `;
  if (accented.trim() === '') return null;
  const plain = ` ${normalizePlainText(content)} `;
  for (const entry of compiled) {
    const haystack = entry.mode === 'plain' ? plain : accented;
    if (haystack.includes(` ${entry.pattern} `)) return entry.label;
  }
  return null;
}

let logChannelPromise = null;
async function getLogChannel() {
  if (!KEYWORD_FILTER_LOG_CHANNEL_ID) return null;
  try {
    return client.channels.cache.get(KEYWORD_FILTER_LOG_CHANNEL_ID) || (await client.channels.fetch(KEYWORD_FILTER_LOG_CHANNEL_ID));
  } catch (error) {
    console.error('[KeywordFilter] Không lấy được kênh log:', error.message);
    return null;
  }
}

async function sendLog({ message, keyword, deleted, deleteError, edited }) {
  const channel = await getLogChannel();
  if (!channel) return;

  const content = String(message.content || '');
  const shown = content.length > 1000 ? `${content.slice(0, 1000)}…` : content;
  const author = message.author;

  const embed = new EmbedBuilder()
    .setColor(deleted ? 0xe74c3c : 0xf39c12)
    .setTitle(deleted ? '🚫 Đã xoá tin chứa từ khoá nhạy cảm' : '⚠️ Phát hiện từ khoá nhạy cảm — KHÔNG XOÁ ĐƯỢC')
    .addFields(
      { name: 'Người gửi', value: `<@${author.id}> (${author.tag || author.username} • \`${author.id}\`)`, inline: false },
      { name: 'Kênh', value: `<#${message.channelId}>`, inline: true },
      { name: 'Từ khoá khớp', value: `\`${keyword}\``, inline: true },
      { name: 'Loại tin', value: edited ? 'Tin vừa được SỬA' : 'Tin mới', inline: true },
      { name: 'Nội dung', value: shown ? `>>> ${shown}` : '*(trống)*', inline: false }
    )
    .setTimestamp(new Date());
  if (!deleted && deleteError) {
    embed.addFields({ name: 'Lý do không xoá được', value: String(deleteError).slice(0, 300), inline: false });
  }

  try {
    await channel.send({ embeds: [embed], allowedMentions: { parse: [] } });
  } catch (error) {
    console.error('[KeywordFilter] Không gửi được log:', error.message);
  }
}

async function inspectMessage(message, { edited }) {
  try {
    if (!message.guild) return; // chỉ lọc trong server, không đụng DM
    if (message.channelId === KEYWORD_FILTER_LOG_CHANNEL_ID) return; // không lọc chính kênh log
    if (!message.author || message.author.bot || message.webhookId) return;
    if (KEYWORD_FILTER_EXEMPT_IDS.includes(message.author.id)) return;

    const keyword = findMatchedKeyword(message.content);
    if (!keyword) return;

    let deleted = false;
    let deleteError = null;
    try {
      await message.delete();
      deleted = true;
    } catch (error) {
      // Tin đã bị xoá bởi handler khác / người dùng trước đó -> vẫn coi là đã xoá.
      if (error && (error.code === 10008 || error.status === 404)) deleted = true;
      else deleteError = error.message;
    }

    await sendLog({ message, keyword, deleted, deleteError, edited });
  } catch (error) {
    console.error('[KeywordFilter] Lỗi xử lý tin nhắn:', error.message);
  }
}

client.on(Events.MessageCreate, (message) => {
  inspectMessage(message, { edited: false });
});

// Sửa tin để lách luật cũng bị bắt. Bỏ qua cập nhật không đổi nội dung (vd Discord gắn embed).
client.on(Events.MessageUpdate, (oldMessage, newMessage) => {
  if (newMessage.content === null || newMessage.content === undefined) return; // tin partial chưa có nội dung
  if (oldMessage && oldMessage.content !== null && oldMessage.content === newMessage.content) return;
  inspectMessage(newMessage, { edited: true });
});

let refreshTimer = null;
// Gọi 1 lần ở Giai đoạn 2 lúc khởi động (index.js): tạo tab nếu chưa có, nạp từ khoá, rồi tự
// nạp lại định kỳ để sửa sheet là có hiệu lực mà không cần restart bot.
async function startKeywordFilter(authClient) {
  try {
    await ensureKeywordFilterSheetExists(authClient);
  } catch (error) {
    console.error('[KeywordFilter] Không tạo/kiểm tra được tab từ khoá:', error.message);
  }
  await refreshKeywords();
  if (!refreshTimer) {
    refreshTimer = setInterval(refreshKeywords, KEYWORD_FILTER_REFRESH_MINUTES * 60 * 1000);
  }
  console.log(`[KeywordFilter] Đang bật (nạp lại sheet mỗi ${KEYWORD_FILTER_REFRESH_MINUTES} phút).`);
}

module.exports = { startKeywordFilter, refreshKeywords, normalize, findMatchedKeyword, isLoadedFromSheet: () => loadedFromSheet };
