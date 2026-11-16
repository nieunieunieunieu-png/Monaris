// ===== AutoReply: điều phối chung =====
// Module này giờ chỉ còn re-export API công khai (index.js / commands/* vẫn
// require('./AutoReply') như cũ) + require messageHandler.js để đăng ký listener
// MessageCreate. Logic thật đã tách theo đúng ranh giới chức năng:
//   - triggers.js        : regex gọi bot (AI_TRIGGER_REGEX / AI_SEARCH_TRIGGER_REGEX)
//   - cooldowns.js       : cooldown từ khóa/mention + chống tag dồn dập
//   - reactions.js       : chọn emoji + thả react (cooldown, buồn, react-only, vu vơ)
//   - humanLikeReply.js  : gửi tin "giống người" (typing, chia 2 tin, lỗi gõ, emoji server)
//   - memberDirectory.js : danh bạ thành viên (Bang + ChatGlobal) + resolve <@ID> -> tên
//   - chatRouting.js     : kênh chat cố định, nhận diện tin gọi bot, getKeywordReply
//   - noticeBoard.js     : Bảng Tin Monaris (đăng định kỳ + tự xoá + tin test)
//   - scheduledChat.js   : chat theo lịch (chào sáng, PvP)
//   - messageHandler.js  : listener Events.MessageCreate (thứ tự ưu tiên 0 -> 3)

const { initNoticeBoardState, checkNoticeBoard, sendTestNoticeBoardMessage } = require('./noticeBoard');
const { checkScheduledAutoChat } = require('./scheduledChat');
const { getChatChannelsForGuild } = require('./chatRouting');
const { getMemberInfoAnySource } = require('./memberDirectory');
require('./ownerLearning');
require('./messageHandler');

module.exports = {
  // Bảng Tin Monaris (thay thế checkIdleChannel/initIdleChatState cũ) —
  // gọi ở index.js lúc ClientReady (init) + mỗi phút (check).
  checkNoticeBoard,
  initNoticeBoardState,
  // Gửi thử 1 tin vào kênh test — dùng cho lệnh /testnotice
  // (commands/slashCommands.js).
  sendTestNoticeBoardMessage,
  checkScheduledAutoChat,
  // Export để commands/messageCommands.js dùng chung logic đọc chatChannels
  // (tương thích ngược string/mảng) cho lệnh mon!chatchannels / mon!allchatchannels.
  getChatChannelsForGuild,
  // Export để commands/slashCommands.js tra Ingame của người vừa set quan
  // hệ (/setmqh) — dùng để DM thông báo cho phía bên kia gọi đúng tên
  // Ingame thay vì trần trụi 1 dãy Discord ID.
  getMemberInfoAnySource,
};
