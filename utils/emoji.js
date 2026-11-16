// Tag emote hợp lệ dạng <:ten:id> (tĩnh) hoặc <a:ten:id> (động/animated).
const VALID_EMOJI_TAG_PATTERN = /<a?:\w+:\d+>/g;

// Shortcode dạng :ten_emote: — cách người dùng hay gõ tay khi Discord client
// của họ không tự convert được thành emote thật (thường do họ không có
// quyền "Use External Emojis" với emote đó trong server, hoặc gõ tay thay vì
// chọn từ bảng emoji).
const SHORTCODE_PATTERN = /:([a-zA-Z0-9_]+):/g;

// Thay các shortcode :ten_emote: trong text thành emote thật (<:ten:id> hoặc
// <a:ten:id> nếu là animated) bằng cách tra trong danh sách emote của server
// (guild.emojis.cache theo TÊN). Những đoạn ĐÃ là tag emote hợp lệ
// (<:ten:id> / <a:ten:id>) được giữ nguyên, không bị xử lý lại (tránh phá
// hỏng emote đã đúng). Shortcode không khớp emote nào trong server thì giữ
// nguyên dạng chữ (không tìm thấy để thay).
function resolveEmojiShortcodes(text, guild) {
  if (!text || !guild || !guild.emojis || !guild.emojis.cache) return text;

  const existingTags = text.match(VALID_EMOJI_TAG_PATTERN) || [];
  const parts = text.split(VALID_EMOJI_TAG_PATTERN);

  const processedParts = parts.map((part) =>
    part.replace(SHORTCODE_PATTERN, (match, name) => {
      const emoji = guild.emojis.cache.find((e) => e.name === name);
      return emoji ? emoji.toString() : match;
    })
  );

  // Ghép lại xen kẽ processedParts và existingTags theo đúng thứ tự ban đầu
  // trong text gốc (String.split giữ nguyên thứ tự các phần bị tách).
  let result = '';
  processedParts.forEach((part, i) => {
    result += part;
    if (existingTags[i]) result += existingTags[i];
  });
  return result;
}

// Lấy danh sách emote tuỳ chỉnh (custom emoji) hiện có của server, dùng cho
// picker chèn emote trên trang web (Monaris Admin) — xem GET/POST /admin/emotes/*
// trong admin/api.js. Sắp xếp theo tên (không phân biệt hoa/thường) để danh
// sách ổn định, dễ tìm bằng mắt.
function getGuildEmoteList(guild) {
  if (!guild || !guild.emojis || !guild.emojis.cache) return [];
  return guild.emojis.cache
    .map((e) => ({ id: e.id, name: e.name, animated: Boolean(e.animated) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

module.exports = { resolveEmojiShortcodes, getGuildEmoteList };