const client = require('../client');
const { ADMIN_USER_ID } = require('../config');

// Gửi DM riêng cho admin (ADMIN_USER_ID trong config.js) báo ai vừa
// dùng lệnh tlmn, gửi ở kênh nào và nội dung gì — dùng chung cho cả
// mon!tlmn (commands/messageCommands.js) và /tlmn (commands/slashCommands.js).
// Đây là DM riêng, không liên quan tới tin nhắn tlmn được đăng công khai
// (tin công khai vẫn ẩn danh như cũ, chỉ admin nhận được DM này mới biết ai gửi).
// Nếu gửi DM lỗi (admin chặn DM, chưa từng chat với bot...) thì chỉ log ra
// console, không làm gián đoạn luồng tlmn chính.
async function notifyTlmnAdmin({ authorTag, authorId, channelId, content, attachmentUrls, replyToId }) {
  if (!ADMIN_USER_ID) return;

  try {
    const admin = await client.users.fetch(ADMIN_USER_ID);

    const lines = [
      '📨 **Có người vừa dùng lệnh tlmn**',
      `Người gửi: ${authorTag} (<@${authorId}>, ID: ${authorId})`,
      `Kênh: <#${channelId}>`,
    ];

    if (replyToId) lines.push(`Trả lời thay vào tin nhắn ID: ${replyToId}`);
    if (content) lines.push(`Nội dung: ${content}`);
    if (attachmentUrls && attachmentUrls.length > 0) {
      lines.push(`Ảnh đính kèm: ${attachmentUrls.join(', ')}`);
    }

    await admin.send({ content: lines.join('\n'), allowedMentions: { parse: [] } });
  } catch (error) {
    console.error('Không thể gửi DM báo tlmn cho admin:', error.message);
  }
}

module.exports = { notifyTlmnAdmin };