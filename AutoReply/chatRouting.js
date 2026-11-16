// ===== AutoReply: định tuyến chat =====
// Kênh chat cố định của từng server, nhận diện tin nhắn "đang gọi bot" (để
// redirect/báo đang nạp) và trả lời theo từ khóa (50% AI, 50% câu cố định).

const client = require('../client');
const { chatChannels } = require('../state');
const { askGemini } = require('./aiClient');
const { getRecentChatHistoryForChannel } = require('../googleSheets/chatHistorySheet');
const { KEYWORD_RESPONSES = {}, MENTION_RESPONSES = {} } = require('./keywords');
const {
  getCombinedMemberDirectory,
  getMemberInfoAnySource,
  enrichMemberDirectoryWithDiscordNames,
} = require('./memberDirectory');
const { AI_REPLY_MAX_LENGTH } = require('./humanLikeReply');
const { AI_TRIGGER_REGEX, AI_SEARCH_TRIGGER_REGEX } = require('./triggers');
const { reactWithRandomServerEmoji } = require('./reactions');
const { fetchRecentChannelMessages } = require('./channelContext');
const { parseTranslateMessage, parseTranslateReplyCommand } = require('../translate');

// 50% dùng AI (Gemini) tạo 1 câu trả lời MỚI bám theo đúng từ khóa vừa
// khớp + nội dung tin nhắn gốc (đa dạng hơn, không lặp lại y hệt mỗi lần),
// 50% còn lại dùng câu CỐ ĐỊNH có sẵn trong KEYWORD_RESPONSES như cũ — kết
// hợp cả 2 nguồn theo đúng yêu cầu. Nếu AI lỗi/chưa cấu hình hoặc trả về
// câu quá dài (>AI_REPLY_MAX_LENGTH ký tự) thì fallback về câu cố định.
// beforeMessageId (tuỳ chọn): id tin vừa trigger từ khóa — để "đọc không khí kênh" chỉ lấy các tin NGAY TRƯỚC nó.
async function getKeywordReply(keyword, fixedResponse, originalMessageContent, discordId, guild, channelId, beforeMessageId = null) {
  const fixedReply = Array.isArray(fixedResponse)
    ? fixedResponse[Math.floor(Math.random() * fixedResponse.length)]
    : fixedResponse;

  const shouldUseAi = Math.random() < 0.5;
  if (!shouldUseAi) return fixedReply;

  try {
    const memberInfo = await getMemberInfoAnySource(discordId);
    const memberDirectory = enrichMemberDirectoryWithDiscordNames(await getCombinedMemberDirectory(), guild);
    // Trước đây KHÔNG truyền chatHistory vào đây (khác nhánh tag-bot/reply-bot) ->
    // AI không biết mình vừa nói gì trước đó nên hay lặp lại y chang 1 câu đùa
    // (vd đúng combo "sơ trán/trường ca" ở từ khóa "tố vấn") mỗi lần trigger.
    const chatHistory = channelId ? getRecentChatHistoryForChannel(channelId) : null;
    const channel = channelId ? client.channels.cache.get(channelId) : null;
    const channelMessages = await fetchRecentChannelMessages(channel, { beforeMessageId, memberDirectory });
    const aiReply = await askGemini(
      `Người dùng vừa gõ tin nhắn có chứa từ khóa "${keyword}": "${originalMessageContent}". ` +
        `Đáp lại NGẮN GỌN, tự nhiên, đúng tính cách của bạn, phù hợp với ngữ cảnh từ khóa đó — ` +
        `1 câu là đủ, không cần dài dòng, không quá ${AI_REPLY_MAX_LENGTH} ký tự. ` +
        `TRÁNH lặp lại y chang câu đùa/cách diễn đạt đã dùng gần đây (xem lịch sử chat bên dưới nếu có).`,
      { memberInfo, memberDirectory, chatHistory, channelMessages }
    );

    if (aiReply && aiReply.trim() && aiReply.trim().length <= AI_REPLY_MAX_LENGTH) {
      return aiReply.trim();
    }
  } catch (error) {
    console.error(`Lỗi khi tạo AI reply cho keyword "${keyword}":`, error.message);
  }

  return fixedReply;
}

// Kiểm tra xem tin nhắn này có phải đang "gọi" bot hay không — dùng lại
// ĐÚNG các điều kiện trigger ở logic xử lý bên dưới (AI trigger "bot ơi,
// ...", tag thẳng bot, mention 1 user có cấu hình sẵn trong
// MENTION_RESPONSES, hoặc trúng từ khóa trong KEYWORD_RESPONSES). KHÔNG
// tính reply-to-bot (cần fetch async tin nhắn gốc, tốn thêm 1 lần gọi API
// chỉ để quyết định có redirect hay không — không đáng, vì reply-to-bot chỉ
// xảy ra khi bot ĐÃ từng chat được ở đó rồi, ít có khả năng rơi vào đúng
// tình huống "kênh không cho bot chat" này).
// Trả về MẢNG channelId đã set cho 1 server (có thể rỗng nếu chưa set gì).
// Tự xử lý tương thích ngược: dữ liệu cũ (trước khi hỗ trợ nhiều kênh) lưu
// dạng string đơn (channelId) thay vì mảng.
function getChatChannelsForGuild(guildId) {
  const raw = chatChannels[guildId];
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

function wouldTriggerBotChat(message, content) {
  const trimmedContent = message.content.trim();
  if (AI_SEARCH_TRIGGER_REGEX.test(trimmedContent) || AI_TRIGGER_REGEX.test(trimmedContent)) return true;
  if (parseTranslateMessage(trimmedContent)) return true;
  if (message.reference?.messageId && parseTranslateReplyCommand(trimmedContent)) return true;
  if (message.mentions.users.has(client.user.id)) return true;

  for (const userId of Object.keys(MENTION_RESPONSES)) {
    if (message.content.includes(`<@${userId}>`) || message.content.includes(`<@!${userId}>`)) return true;
  }

  for (const keyword of Object.keys(KEYWORD_RESPONSES)) {
    if (content.includes(keyword.toLowerCase())) return true;
  }

  return false;
}

// Khi server ĐÃ set kênh chat cố định (mon!setchatchannel) mà có người GỌI
// bot (mention/từ khóa/"bot ơi, ...") ở 1 kênh KHÁC — kênh mà bot "không
// chat được" theo cấu hình admin — KHÔNG tag/nhắc tên người đó nữa (tránh
// làm phiền/lộ chuyện họ nhắn sai kênh), thay vào đó chỉ thả 1 react emoji
// NGAY TRÊN tin nhắn gốc của họ (dùng lại reactWithRandomServerEmoji có sẵn
// ở trên) để họ tự hiểu là bot "có thấy" nhưng không chat ở kênh này.
// Best-effort: lỗi gì cũng chỉ log lại, không throw ra ngoài làm crash toàn
// bộ MessageCreate handler.
async function redirectToFixedChatChannel(message) {
  try {
    await reactWithRandomServerEmoji(message);
  } catch (error) {
    console.error('Không thể thả react báo sai kênh chat cố định:', error.message);
  }
}

module.exports = {
  getKeywordReply,
  getChatChannelsForGuild,
  wouldTriggerBotChat,
  redirectToFixedChatChannel,
};
