// ===== utils/knowledgeAccess.js — ai được XEM và DÙNG kho kiến thức bot =====
// Quy tắc: CHỈ thành viên bang (role KNOWLEDGE_VIEW_ROLE_ID, mặc định 1450590370194001941) được xem (nút Hub "Tra Cứu")
// và dùng lệnh hỏi bằng dấu "?". SỬA kho (trang web "Kiến Thức Bot", lệnh mon!kienthuc) vẫn chỉ Bông — không đổi ở đây.
const { KNOWLEDGE_VIEW_ROLE_ID } = require('../config');

const KNOWLEDGE_NO_ACCESS_TEXT = '🔒 Bạn không có quyền truy cập kho kiến thức.';

// member: GuildMember (có thể null khi chưa cache) -> true nếu có role member bang.
function hasKnowledgeAccess(member) {
  if (process.env.MONARIS_KNOWLEDGE_REQUIRE_MEMBER_ROLE !== 'true') return true;
  return Boolean(member && member.roles && member.roles.cache && member.roles.cache.has(KNOWLEDGE_VIEW_ROLE_ID));
}

// Lấy GuildMember của tác giả tin nhắn (ưu tiên cache, không có thì gọi API 1 lần).
async function resolveMessageMember(message) {
  if (message.member) return message.member;
  try {
    return await message.guild.members.fetch(message.author.id);
  } catch (_) {
    return null;
  }
}

module.exports = { hasKnowledgeAccess, resolveMessageMember, KNOWLEDGE_NO_ACCESS_TEXT };
