// ===== AutoReply: thả react =====
// Chọn emoji (tránh emoji vui khi ai đó buồn) và các kiểu react: báo cooldown,
// react-only thay cho trả lời, react vu vơ.

// Số phút còn lại (làm tròn lên, tối thiểu 1) tới khi cooldownKey hết cooldown
// — CHỈ ĐỌC, không ghi nhận gì cả (khác isOnAutoReplyCooldown ở trên). Dùng
// để báo cho người tag bot biết còn bao lâu nữa mới trả lời lại được, thay
// vì im lặng bỏ qua hoàn toàn.
// Emoji fallback nếu server KHÔNG có custom emoji nào (guild.emojis.cache
// rỗng) — dùng khi thả react báo "đang cooldown" cho lượt tag bot.
const FALLBACK_COOLDOWN_EMOJIS = ['👀', '😅', '🤖', '✨', '🙈', '🤐'];

// --- React "đúng cảm xúc" thay vì random tuyệt đối trong toàn bộ emoji
// server: nếu tin nhắn đang buồn/tiêu cực rõ ràng thì KHÔNG được lỡ trúng
// emoji cười cợt/troll (vd 🤣 random ngay lúc người ta đang than thở) —
// lệch tông rất dễ nhận ra là bot vô tri. Chỉ phân biệt "buồn" hay "còn
// lại" bằng match từ khóa đơn giản (không gọi AI cho việc này — vừa nhanh
// vừa không tốn quota Gemini). ---
function stripDiacriticsForSentiment(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd');
}

const SAD_SENTIMENT_KEYWORDS = [
  'buon', 'chan qua', 'met qua', 'met moi', 'khoc', 'te qua', 'that vong',
  'buc minh', 'buc qua', 'gian qua', 'co don', 'dau long', 'toi te',
  'huhu', 'khong on', 'stress', 'ap luc', 'chan doi',
];

// Emoji đồng cảm — dùng khi tin nhắn buồn/tiêu cực, KHÔNG dùng chung bộ
// emoji vui nhộn (😂🤣...) ở dưới cho trường hợp này để tránh lệch tông.
const SAD_FALLBACK_EMOJIS = ['🥲', '🫂', '💛', '😢', '🤗'];

// Vài từ khoá thường gặp trong TÊN custom emoji buồn/đồng cảm (không dấu,
// viết thường) — nếu server có sẵn emoji tên khớp thì ưu tiên dùng thay vì
// bộ fallback Unicode ở trên, cho đúng "chất" của bang hơn.
const SAD_CUSTOM_EMOJI_NAME_HINTS = ['khoc', 'buon', 'sad', 'cry', 'te'];

function detectSadSentiment(text) {
  const normalized = stripDiacriticsForSentiment((text || '').toLowerCase());
  return SAD_SENTIMENT_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

// Chọn 1 emoji để react, có cân nhắc cảm xúc tin nhắn (`isSad`):
// - isSad = true: ưu tiên custom emoji có TÊN gợi ý buồn/đồng cảm (nếu có),
//   không thì dùng SAD_FALLBACK_EMOJIS — KHÔNG bao giờ random custom emoji
//   bất kỳ trong trường hợp này (tránh trúng emoji cười/troll không hợp cảnh).
// - isSad = false: giữ hành vi CŨ — random custom emoji của server (nếu có),
//   fallback về `neutralFallbackList` nếu server chưa có custom emoji nào.
function pickReactionEmoji(guild, isSad, neutralFallbackList) {
  const guildEmojis = guild?.emojis?.cache;

  if (isSad) {
    const sadCustomEmoji = guildEmojis?.find(
      (emoji) => emoji.name && SAD_CUSTOM_EMOJI_NAME_HINTS.some((hint) => emoji.name.toLowerCase().includes(hint))
    );
    if (sadCustomEmoji) return sadCustomEmoji;
    return SAD_FALLBACK_EMOJIS[Math.floor(Math.random() * SAD_FALLBACK_EMOJIS.length)];
  }

  return guildEmojis && guildEmojis.size > 0
    ? guildEmojis.random()
    : neutralFallbackList[Math.floor(Math.random() * neutralFallbackList.length)];
}

// Thả 1 react — ưu tiên emoji CUSTOM của chính server (nếu có, và tin nhắn
// không buồn), fallback về emoji Unicode thường nếu server chưa có custom
// emoji nào. Dùng để "phản hồi" lượt tag bot lúc đang cooldown mà không
// gửi thêm tin nhắn nào cả (khỏi làm phiền/spam kênh).
async function reactWithRandomServerEmoji(message) {
  const isSad = detectSadSentiment(message.content);
  const emoji = pickReactionEmoji(message.guild, isSad, FALLBACK_COOLDOWN_EMOJIS);
  await message.react(emoji);
}

// Emoji dùng khi chọn "chỉ react thay vì reply" — khác bộ FALLBACK_COOLDOWN_EMOJIS
// ở trên (đó là báo hiệu đang cooldown), bộ này mang nghĩa "đã đọc/hưởng ứng"
// bình thường như bạn bè thật thả react qua loa thay vì gõ hẳn 1 câu.
const REACT_ONLY_FALLBACK_EMOJIS = ['👀', '😂', '🤣', '👍', '😅', '🥲', '😏', '🙃'];

// Xác suất chỉ thả react thay vì gõ hẳn 1 câu trả lời — áp dụng cho các tình
// huống "chat vu vơ" (từ khóa, tag bot, reply-to-bot), KHÔNG áp dụng cho lúc
// người dùng nhờ vả cụ thể ("bot ơi, ...") vì lúc đó im lặng/chỉ react sẽ
// mất lịch sự, không giúp được gì.
const REACT_ONLY_REPLY_CHANCE = 0.05;

// Xác suất bot tự buông 1 react vu vơ vào tin nhắn BẤT KỲ không liên quan
// gì tới bot (không mention/không trúng từ khóa/không reply bot) — cố tình
// để RẤT thấp, chỉ là điểm nhấn nhỏ cho cảm giác "có mặt", không phải tính
// năng chính, tránh spam react tràn lan vào mọi tin nhắn trong kênh.
const SPONTANEOUS_REACT_CHANCE = 0.015;

function shouldReactOnlyInsteadOfReply() {
  return Math.random() < REACT_ONLY_REPLY_CHANCE;
}

async function reactOnlyInsteadOfReply(message) {
  const isSad = detectSadSentiment(message.content);
  const emoji = pickReactionEmoji(message.guild, isSad, REACT_ONLY_FALLBACK_EMOJIS);
  await message.react(emoji);
}

module.exports = {
  detectSadSentiment,
  reactWithRandomServerEmoji,
  SPONTANEOUS_REACT_CHANCE,
  shouldReactOnlyInsteadOfReply,
  reactOnlyInsteadOfReply,
};
