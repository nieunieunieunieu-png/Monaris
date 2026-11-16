// ===== AutoReply: regex gọi bot =====
// Biến các cụm từ gọi bot (config) thành regex cho chat thường và chat có search.

const { AI_CHAT_TRIGGER_PHRASES, AI_SEARCH_TRIGGER_PHRASES } = require('../config');

// Biến 1 cụm từ gọi bot (vd "bot ơi", "ê bot") thành regex fragment: cho
// phép nhiều khoảng trắng liên tiếp giữa các từ trong cụm. Không phân biệt
// hoa/thường — flag 'i' áp dụng ở regex tổng khi build.
function toRegexFragment(phrase) {
  return phrase.trim().split(/\s+/).join('\\s+');
}

// Ghép danh sách cụm từ (từ config.js) thành 1 regex: khớp khi tin nhắn BẮT
// ĐẦU bằng 1 trong các cụm, theo sau là dấu phẩy, rồi tới nội dung yêu cầu.
// Vd với phrases=['bot ơi','ê bot'] -> khớp "bot ơi, làm thơ" và "ê bot, ê"
// nhưng KHÔNG khớp "ê bot đâu rồi" (thiếu dấu phẩy ngay sau).
function buildTriggerRegex(phrases) {
  const fragments = phrases.map(toRegexFragment).join('|');
  return new RegExp(`^(?:${fragments})\\s*,\\s*(.+)$`, 'is');
}

// "bot ơi, <yêu cầu>" / "ê bot, <yêu cầu>" / ... — chat/sáng tác thường,
// KHÔNG search. "bot ơi tìm, <yêu cầu>" / "tìm giúp tôi, <yêu cầu>" — có
// kèm search Serper trước khi trả lời. Danh sách cụm từ nằm ở config.js,
// thêm/bớt cách gọi thì sửa ở đó, không cần đụng vào regex ở đây.
const AI_TRIGGER_REGEX = buildTriggerRegex(AI_CHAT_TRIGGER_PHRASES);
const AI_SEARCH_TRIGGER_REGEX = buildTriggerRegex(AI_SEARCH_TRIGGER_PHRASES);

module.exports = {
  AI_TRIGGER_REGEX,
  AI_SEARCH_TRIGGER_REGEX,
};
