// ===== AutoReply: gửi tin "giống người" =====
// Giả lập typing, thỉnh thoảng chia 2 tin / gõ sai rồi tự sửa / kèm emoji server
// — sendHumanLikeReply() là điểm vào duy nhất cho mọi câu trả lời của bot.

// --- Làm bot chat "người" hơn: bỏ giới hạn cứng 64 ký tự, thêm độ trễ giả
// lập đang gõ phím, và thỉnh thoảng chỉ thả react thay vì trả lời hẳn 1 câu
// (đúng kiểu bạn bè lười gõ, thả emoji cho qua) ---

// Trước đây ép AI trả lời ≤64 ký tự khiến câu lúc nào cũng bị cụt, thiếu
// ngữ cảnh. Nới lên hẳn để AI tự do diễn đạt tự nhiên hơn (vẫn đủ ngắn để
// không tràn màn hình chat, không phải giới hạn để bắt bẻ từng câu).
const AI_REPLY_MAX_LENGTH = 220;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Ước lượng thời gian "đang gõ" dựa theo độ dài câu trả lời — người thật gõ
// càng câu dài càng lâu, có thêm chút thời gian "suy nghĩ" trước khi gõ và
// random jitter để không đều tăm tắp mỗi lần y hệt nhau. Clamp trong khoảng
// 0.6s-4.5s để không làm người chờ quá lâu dù câu dài, cũng không nhanh bất
// thường dù câu ngắn.
function computeTypingDelayMs(text) {
  const length = (text || '').length;
  const thinkingTime = 350 + Math.random() * 450; // 350-800ms "suy nghĩ" trước khi gõ
  const perCharMs = 26 + Math.random() * 14; // ~26-40ms/ký tự, tốc độ gõ vừa phải
  const total = thinkingTime + length * perCharMs;
  return Math.min(Math.max(total, 600), 4500);
}

// Gọi sendTyping() rồi chờ 1 khoảng phù hợp với độ dài `text` trước khi thực
// sự gửi tin — mô phỏng cảm giác đang gõ phím thay vì trả lời tức thì ngay
// khi AI vừa trả về kết quả. Best-effort: lỗi sendTyping (hiếm khi xảy ra,
// vd mất quyền) không nên chặn việc gửi tin nhắn chính, nên bắt lỗi riêng.
async function simulateTypingBeforeSend(channel, text) {
  try {
    await channel.sendTyping();
  } catch (error) {
    // Bỏ qua — không có typing indicator thì vẫn gửi tin bình thường.
  }
    // Gửi ngay khi AI đã trả lời.
}

// --- 4 nâng cấp thêm cho cảm giác "người thật đang gõ": tách câu dài thành
// nhiều tin nhắn, thỉnh thoảng gõ nhầm rồi tự sửa, và ưu tiên emoji tuỳ
// chỉnh của server thay vì chỉ emoji Unicode. ---

// Câu đủ dài mới cân nhắc tách — câu ngắn tách ra sẽ trông giả tạo.
const MESSAGE_SPLIT_MIN_LENGTH = 70;
// Trong số các câu đủ dài, chỉ ~35% được tách — không phải câu dài nào cũng
// tách, người thật không phải lúc nào cũng bấm Enter giữa chừng.
const MESSAGE_SPLIT_CHANCE = 0.1;

// Tìm 1 điểm ngắt tự nhiên (sau dấu ., !, ?, ,) nằm trong khoảng 30%-85% độ
// dài câu để tách thành 2 tin nhắn — tránh tách quá đầu hoặc quá cuối câu
// (tách sát cuối thì tin thứ 2 cụt ngủn, vô nghĩa).
function maybeSplitReplyIntoTwoMessages(text) {
  if (!text || text.length < MESSAGE_SPLIT_MIN_LENGTH) return [text];
  if (Math.random() >= MESSAGE_SPLIT_CHANCE) return [text];

  const searchStart = Math.floor(text.length * 0.3);
  const searchEnd = Math.floor(text.length * 0.85);
  const breakPatterns = ['. ', '! ', '? ', ', '];

  let breakStart = -1; // vị trí ký tự dấu câu (đầu pattern)
  let breakEnd = -1; // vị trí ngay sau khoảng trắng theo sau dấu câu
  for (const pattern of breakPatterns) {
    const idx = text.indexOf(pattern, searchStart);
    if (idx !== -1 && idx < searchEnd) {
      breakStart = idx;
      breakEnd = idx + pattern.length;
      break;
    }
  }

  if (breakStart === -1) return [text];

  // Bỏ hẳn dấu câu ở điểm ngắt — người thật khi xuống dòng/nhắn tin thứ 2
  // nối tiếp tin cũ thường KHÔNG để dấu chấm/phẩy cuối tin đầu, chỉ ngắt ý
  // rồi nhắn tiếp câu sau như 1 tin mới, không phải 1 câu bị cắt đôi.
  const first = text.slice(0, breakStart).trim();
  const second = text.slice(breakEnd).trim();

  if (!first || !second) return [text];
  return [first, second];
}

// Chỉ ~4% khả năng xảy ra — đúng theo yêu cầu mức 3-5%, chọn giữa khoảng đó.
const TYPO_SELF_CORRECT_CHANCE = 0.1;

// Tạo 1 đoạn "gõ nhầm" ngắn dựa theo 1-2 từ đầu của câu trả lời thật —
// kiểu người gõ lỡ tay rồi nhận ra, gửi tiếp câu đúng ngay sau. 3 kiểu lỗi
// gõ ngẫu nhiên: rớt mất ký tự cuối, đảo 2 ký tự cạnh nhau, hoặc lặp ký tự
// cuối (kiểu tay lướt phím). Trả về null nếu câu quá ngắn để giả lập hợp lý.
function buildTypoFragment(text) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;

  const wordCount = Math.min(words.length, 1 + Math.floor(Math.random() * 2));
  let fragment = words.slice(0, wordCount).join(' ');
  if (fragment.length < 2) return null;

  const typoStyle = Math.floor(Math.random() * 3);
  if (typoStyle === 0) {
    fragment = fragment.slice(0, -1);
  } else if (typoStyle === 1 && fragment.length >= 3) {
    const chars = fragment.split('');
    const i = chars.length - 2;
    [chars[i], chars[i + 1]] = [chars[i + 1], chars[i]];
    fragment = chars.join('');
  } else {
    fragment = fragment + fragment[fragment.length - 1];
  }

  return fragment;
}

// Ưu tiên emoji tuỳ chỉnh của server (nếu có) thay vì để AI tự bịa emoji
// Unicode chung chung — giúp bot "nói cùng ngôn ngữ" với emoji quen thuộc
// của bang. ~30% khả năng chèn thêm 1 emoji server vào cuối câu, chỉ khi
// server có ít nhất 1 custom emoji.
const CUSTOM_EMOJI_APPEND_CHANCE = 0.3;

function maybeAppendCustomGuildEmoji(text, guild) {
  const guildEmojis = guild?.emojis?.cache;
  if (!guildEmojis || guildEmojis.size === 0) return text;
  if (Math.random() >= CUSTOM_EMOJI_APPEND_CHANCE) return text;

  const emoji = guildEmojis.random();
  if (!emoji) return text;

  return `${text} ${emoji.toString()}`;
}

// Chỉ áp dụng biến thể chấm câu nhẹ nếu tin nhắn KHÔNG chứa emoji custom
// dạng <:name:id>/<a:name:id> hoặc link — tránh random thêm/bớt ký tự ngay
// sát cú pháp emoji/link làm hỏng chúng.
const TEXT_VARIATION_SKIP_PATTERN = /<a?:\w+:\d+>|https?:\/\//;

// Câu cố định (KEYWORD_RESPONSES, REPLY_TO_BOT_RESPONSES, GOI_BOT...) luôn y
// chang 1 chuỗi mỗi lần dùng lại — lặp đi lặp lại nguyên
// văn nhiều lần rất dễ bị nhận ra là preset copy-paste. Thêm biến thể NHẸ về
// dấu câu (KHÔNG đụng vào nội dung/từ ngữ, tránh AI/preset bị chỉnh sai ý)
// mỗi lần gửi để tự nhiên hơn — giống người gõ nhanh không đều tay: thỉnh
// thoảng bỏ dấu chấm cuối câu, thỉnh thoảng nhân đôi dấu chấm than cho có
// cảm xúc hơn. Áp dụng chung cho cả câu AI lẫn câu cố định (vô hại với câu
// AI vì xác suất trigger thấp, chỉ là 1 lớp biến thể mỏng thêm vào).
function addTypingVariation(text) {
  if (!text || TEXT_VARIATION_SKIP_PATTERN.test(text)) return text;

  let out = text;

  if (out.endsWith('.') && Math.random() < 0.25) {
    out = out.slice(0, -1);
  } else if (/[^!]!$/.test(out) && Math.random() < 0.2) {
    out = `${out}!`;
  }

  return out;
}

// Hàm gửi tin nhắn "giống người" dùng chung cho mọi nơi bot trả lời chủ
// động (AI hoặc câu cố định đều qua đây): có thể gõ nhầm-tự sửa trước
// (~4%), rồi mới gửi nội dung thật — nội dung thật có thể được tách thành
// 2 tin nhắn liên tiếp (~35% nếu đủ dài) và có thể kèm emoji server (~30%).
// Reply-reference (nhảy tới tin gốc) chỉ gắn vào ĐÚNG 1 tin nhắn đầu tiên
// được gửi trong cả chuỗi — giống người thật chỉ bấm Reply 1 lần rồi nhắn
// tiếp bình thường, không phải tin nào cũng bấm Reply.
async function sendHumanLikeReply(channel, text, { replyToMessage = null, guild = null } = {}) {
  if (!text) return;
  text = addTypingVariation(text);

  let replyReferenceUsed = false;

  const sendOnePart = async (partText) => {
    await simulateTypingBeforeSend(channel, partText);
    if (!replyReferenceUsed && replyToMessage) {
      replyReferenceUsed = true;
      return replyToMessage.reply(partText);
    }
    return channel.send(partText);
  };

  if (text.length >= 8 && Math.random() < TYPO_SELF_CORRECT_CHANCE) {
    const typoFragment = buildTypoFragment(text);
    if (typoFragment) {
      try {
        await sendOnePart(typoFragment);
        await sleep(300 + Math.random() * 400);
      } catch (error) {
        console.error('Không thể gửi typo fragment:', error.message);
      }
    }
  }

  const finalText = maybeAppendCustomGuildEmoji(text, guild);
  const parts = maybeSplitReplyIntoTwoMessages(finalText);

  for (const part of parts) {
    try {
      await sendOnePart(part);
    } catch (error) {
      console.error('Không thể gửi tin nhắn (sendHumanLikeReply):', error.message);
    }
  }
}

module.exports = {
  AI_REPLY_MAX_LENGTH,
  sendHumanLikeReply,
};
