// ===== AutoReply: cooldown =====
// Cooldown theo kênh cho trigger từ khóa/mention + phát hiện 1 người tag bot dồn dập.

const { AUTOREPLY_KEYWORD_COOLDOWN_MS, BOT_MENTION_COOLDOWN_MS } = require('../config');

// Chống spam KEYWORD_RESPONSES / MENTION_RESPONSES: lưu thời điểm (ms) lần
// cuối 1 "cooldownKey" được trigger — xem checkAutoReplyCooldown bên dưới.
// Format cooldownKey: `${channelId}:keyword` (DÙNG CHUNG cho mọi từ khóa
// trong cùng 1 kênh — không tách riêng theo từng từ khóa) hoặc
// `${channelId}:mention:${userId}` (mention thì vẫn tách riêng theo từng
// user bị mention). Map sống trong bộ nhớ, tự reset khi bot restart — không
// cần lưu persistent vì cooldown chỉ vài chục giây, restart lại là hợp lý
// để tính lại.
const autoReplyCooldowns = new Map();

// true nếu cooldownKey đang trong thời gian chờ (KHÔNG được reply) — nếu
// false (hết cooldown / lần đầu trigger) thì đồng thời ghi nhận luôn thời
// điểm trigger hiện tại để lần sau tính tiếp. cooldownMs mặc định dùng cho
// keyword (5 phút) — tag trực tiếp bot (mục 0.7) KHÔNG dùng cooldown này
// nữa, chỉ mention-tới-user-khác (MENTION_RESPONSES) và keyword mới cooldown.
function isOnAutoReplyCooldown(cooldownKey, cooldownMs = AUTOREPLY_KEYWORD_COOLDOWN_MS) {
  const lastTriggeredAt = autoReplyCooldowns.get(cooldownKey) || 0;
  const onCooldown = Date.now() - lastTriggeredAt < cooldownMs;

  if (!onCooldown) {
    autoReplyCooldowns.set(cooldownKey, Date.now());
  }

  return onCooldown;
}

// Theo dõi lần TAG TRỰC TIẾP GẦN NHẤT của từng user trong từng kênh — dùng
// BOT_MENTION_COOLDOWN_MS (config.js, mặc định 5 phút, trước đây khai báo
// sẵn nhưng chưa dùng ở đâu) làm "cửa sổ dồn dập": nếu CÙNG 1 người tag bot
// LẦN NỮA trong lúc còn cửa sổ này thì coi là dồn dập — xem nhánh 0.7 bên
// dưới đổi cách phản hồi khi isRepeatedMention = true. Mỗi lần gọi hàm này
// đều CẬP NHẬT LẠI mốc thời gian (cửa sổ trượt theo lượt tag mới nhất), map
// sống trong bộ nhớ, tự reset khi bot restart.
const lastBotMentionAtByUser = new Map();

function isRepeatedBotMention(trackKey) {
  const lastAt = lastBotMentionAtByUser.get(trackKey) || 0;
  const isRepeated = Date.now() - lastAt < BOT_MENTION_COOLDOWN_MS;
  lastBotMentionAtByUser.set(trackKey, Date.now());
  return isRepeated;
}

module.exports = {
  isOnAutoReplyCooldown,
  isRepeatedBotMention,
};
