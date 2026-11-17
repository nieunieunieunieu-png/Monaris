const GOI_BOT_KEYWORDS = ['monaris ơi', 'monaris đâu', 'bot ơi', 'bot đâu'];
const greetings = ['Monaris đây, bạn cần gì nè ✨', 'Có Monaris đây! Bạn cần gì nào?'];
const KEYWORD_RESPONSES = {
  'monaris ơi': greetings, 'monaris đâu': greetings, 'bot ơi': greetings, 'bot đâu': greetings,
  'buồn quá': ['Kể Monaris nghe nhé, hôm nay bạn gặp chuyện gì?', 'Monaris ở đây nghe bạn nè.'],
  'đi ngủ': ['Ngủ ngon nha, mai gặp lại 🌙'],
  'chúc mừng': ['Chúc mừng bạn nha 🎉']
};
const MENTION_RESPONSES = {};
const SCRIM_QUERY_KEYWORDS = ['lịch scrim', 'lich scrim', 'scrim với ai'];
const REPLY_TO_BOT_RESPONSES = ['Monaris nghe nè, bạn nói tiếp đi.', 'Bạn muốn Monaris giúp gì nào?'];
const IDLE_CHAT_MESSAGES = [];
module.exports = { IDLE_CHAT_MESSAGES, GOI_BOT_KEYWORDS, KEYWORD_RESPONSES, MENTION_RESPONSES, SCRIM_QUERY_KEYWORDS, REPLY_TO_BOT_RESPONSES };
