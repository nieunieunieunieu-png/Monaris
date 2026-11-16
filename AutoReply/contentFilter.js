// ===== Chặn nội dung 18+ / nhạy cảm / bạo lực / liên quan trẻ em =====
// Tách khỏi aiClient.js. Áp dụng cho MỌI yêu cầu AI (cả chat thường lẫn
// search) — để tránh trường hợp "bot ơi, kể chuyện <nội dung nhạy cảm>" lọt
// qua chỉ vì không bật search. Bỏ dấu tiếng Việt để so khớp không phân biệt
// có dấu/không dấu (vd: "khiêu dâm" và "khieu dam" đều bị chặn).

function stripDiacritics(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd');
}

// Danh sách từ khoá cần chặn — có thể bổ sung thêm sau nếu phát hiện từ
// khoá lọt lưới. Gộp 3 nhóm: (1) tình dục/khiêu dâm người lớn, (2) bạo lực/
// bạo hành/tự hại, (3) liên quan tới trẻ em bị xâm hại/khai thác tình dục —
// nhóm (3) LUÔN chặn tuyệt đối, không có ngoại lệ.
const BLOCKED_CONTENT_KEYWORDS = [
  // Tình dục / khiêu dâm người lớn
  'sex', 'xxx', 'porn', 'nude', 'nsfw', 'jav', 'hentai',
  '18+', 'khieu dam', 'khoa than', 'phim sex', 'phim nguoi lon',
  'clip nong', 'clip nhay cam', 'anh nong', 'anh nhay cam', 'video nong',
  'noi dung nguoi lon', 'lam tinh', 'quan he tinh duc', 'gai goi',
  'sex tape', 'onlyfans', 'khoi dam',

  // Bạo lực / bạo hành / tự hại
  'bao luc', 'bao hanh', 'giet nguoi', 'tra tan', 'danh dap',
  'tu tu', 'tu hai', 'tu sat', 'mau me', 'xac chet', 'thi the',

  // Liên quan tới trẻ em bị xâm hại/khai thác tình dục — chặn tuyệt đối
  'au dam', 'xam hai tinh duc tre em', 'tre em khoa than',
  'child porn', 'childporn', 'cp', 'loli', 'shota',
];

function isBlockedContentQuery(text) {
  const normalized = stripDiacritics(text.toLowerCase());
  return BLOCKED_CONTENT_KEYWORDS.some((keyword) => normalized.includes(stripDiacritics(keyword)));
}

module.exports = { stripDiacritics, isBlockedContentQuery };
