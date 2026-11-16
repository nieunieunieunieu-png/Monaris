// ===== AutoReply: chọn temperature cho từng loại câu hỏi =====
// Chat thường (tám chuyện, trêu, chào...) -> temperature CAO (CHAT_TEMPERATURE ~0.95) để câu bớt an toàn/nhạt.
// Trả lời BÁM DỮ LIỆU (kiến thức game, có kèm kết quả search) -> temperature THẤP (GROUNDED_TEMPERATURE ~0.4)
// để khỏi bịa. Nhánh hỏi kho kiến thức bằng dấu "?" (knowledgeQuestion.js) vốn đã đặt 0.2 riêng, không đi qua đây.

const { CHAT_TEMPERATURE, GROUNDED_TEMPERATURE } = require('../config');
const { stripDiacritics } = require('./contentFilter');
const { findMatchedEntries } = require('./knowledgeBlock');

// Từ/cụm hay xuất hiện khi hỏi kiến thức game (so khớp trên văn bản đã bỏ dấu, theo TỪ nguyên vẹn).
const GAME_KNOWLEDGE_TERMS = [
  'build', 'ky nang', 'skill', 'class', 'he phai', 'noi cong', 'trang bi', 'tinh luyen', 'thuoc tinh', 'chi so',
  'su kien', 'co che', 'phien ban', 'combo', 'rotation', 'set do', 'ngoc', 'vo hoc', 'tam phap', 'cach choi',
  'cach build', 'cach len', 'buff', 'nerf', 'sat thuong', 'dame', 'patch', 'update',
];

function normalizeForTerms(text) {
  const base = stripDiacritics(String(text || '').toLowerCase())
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  return ` ${base} `;
}

function looksLikeGameKnowledge(text) {
  const normalized = normalizeForTerms(text);
  return GAME_KNOWLEDGE_TERMS.some((term) => normalized.includes(` ${term} `));
}

// userRequest: câu hỏi/yêu cầu gửi vào askGemini. Trả về số temperature.
async function pickTemperature(userRequest, { useSearch = false } = {}) {
  if (useSearch) return GROUNDED_TEMPERATURE;
  if (looksLikeGameKnowledge(userRequest)) return GROUNDED_TEMPERATURE;

  try {
    const matches = await findMatchedEntries(userRequest);
    if (matches.length) return GROUNDED_TEMPERATURE;
  } catch (error) {
    // Kho kiến thức lỗi/tắt thì thôi, dựa vào regex ở trên — không để chặn câu trả lời.
  }

  return CHAT_TEMPERATURE;
}

module.exports = { pickTemperature };
