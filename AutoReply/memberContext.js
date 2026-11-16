// ===== Tra cứu + build khối "thông tin thành viên" nhét vào prompt Gemini =====
// Tách khỏi aiClient.js.
const { stripDiacritics } = require('./contentFilter');

// Chuẩn hoá 1 chuỗi để so khớp tên: bỏ dấu tiếng Việt, chữ thường, gộp
// khoảng trắng thừa. Dùng cho cả tên thành viên lẫn nội dung tin nhắn khi
// tìm xem người dùng đang nhắc tới ai trong danh sách bang.
function normalizeForNameMatch(str) {
  return stripDiacritics(String(str || ''))
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// Nhận diện câu hỏi đang hỏi về 1 trong 3 mối quan hệ (Sư Phụ/Đệ Tử, Tri
// Kỷ, Kim Lan) — dùng để (1) ép buildMatchedMembersBlock() hiện ĐẦY ĐỦ cả 3
// mục quan hệ kèm "chưa có" cho người được hỏi thay vì bỏ trống hoàn toàn
// khi không có dữ liệu, và (2) chèn thêm chỉ dẫn CỨNG buộc AI trả lời thẳng
// vào đúng câu hỏi thay vì né sang chuyện khác (bug đã gặp: hỏi "tri kỷ Ji
// Ches là ai" dù data đúng nhưng AI lại chỉ đùa về class, không trả lời).
// Match trên bản đã bỏ dấu (stripDiacritics) nên "tri kỷ" -> "tri ky" và
// "tri kỉ" -> "tri ki" là 2 chuỗi KHÁC NHAU (kỷ gốc "y", kỉ gốc "i") — cả 2
// cách viết đều phổ biến trong tiếng Việt nên phải liệt kê riêng cả 2.
const RELATIONSHIP_QUERY_KEYWORDS = ['su phu', 'de tu', 'tri ky', 'tri ki', 'chi duyen', 'kim lan'];

function isRelationshipQuery(text) {
  const normalized = normalizeForNameMatch(text);
  if (!normalized) return false;
  return RELATIONSHIP_QUERY_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

// Tìm CHÍNH XÁC (bằng code, không phải để AI đoán) những thành viên có tên
// (ingame HOẶC tên Discord — username/nickname, xem `member.discordNames`,
// coi 2 loại tên này là 1 khi tra cứu vì người chat trong Discord thường
// gọi nhau bằng tên Discord chứ không phải lúc nào cũng nhớ đúng tên ingame)
// xuất hiện trong `text` (thường là câu hỏi của người dùng) — so khớp trọn
// từ/cụm từ (không dính vào giữa 1 từ khác), không phân biệt hoa thường và
// có/không dấu. Đây là bước quan trọng để tránh AI tự "đoán mò" khớp nhầm
// người này với người khác khi phải tự dò cả danh sách dài (đã từng xảy ra:
// hỏi "Ji Ches" nhưng AI trả lời nhầm thông tin của "10PM") — việc so khớp
// 1 chuỗi con CÓ SẴN trong danh sách tên đã biết thì code làm chính xác
// 100%, không cần AI đoán.
function findMatchedMembersInText(text, memberDirectory) {
  if (!Array.isArray(memberDirectory) || !memberDirectory.length) return [];

  const normalizedText = normalizeForNameMatch(text);
  if (!normalizedText) return [];

  const matches = [];
  const seenMembers = new Set();

  for (const member of memberDirectory) {
    // Gộp tên ingame + biệt danh (nếu có, từ tab "ChatGlobal" —
    // googleSheets/chatGlobalSheet.js) + mọi tên Discord (username/global
    // name/nickname, nếu có) thành 1 danh sách "biệt danh" để dò — khớp bất
    // kỳ cái nào trong số đó là đủ, không cần phân biệt người dùng gọi theo
    // kiểu tên nào.
    const nameVariants = [
      member.ingame,
      member.nickname,
      ...(Array.isArray(member.discordNames) ? member.discordNames : []),
    ];

    for (const rawName of nameVariants) {
      const normalizedName = normalizeForNameMatch(rawName);
      if (!normalizedName) continue;

      const escaped = normalizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Ranh giới là ký tự KHÔNG phải chữ/số (hoặc đầu/cuối chuỗi) — để
      // tránh khớp nhầm 1 tên ngắn nằm lọt giữa 1 từ khác (vd tên "An"
      // không được khớp vào giữa từ "Ngoan").
      const boundaryPattern = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');

      if (boundaryPattern.test(normalizedText)) {
        // Khoá theo discordId (nếu có) hoặc tên ingame — tránh thêm trùng
        // 1 người 2 lần dù khớp qua nhiều biệt danh khác nhau của họ.
        const memberKey = member.discordId || normalizeForNameMatch(member.ingame);
        if (!seenMembers.has(memberKey)) {
          seenMembers.add(memberKey);
          matches.push(member);
        }
        break; // đã khớp 1 biệt danh của người này rồi, khỏi cần dò tiếp
      }
    }
  }

  return matches;
}

// Build khối "THÔNG TIN CHÍNH XÁC" cho những thành viên CODE ĐÃ TRA RA được
// (từ findMatchedMembersInText ở trên) — đặt ưu tiên cao hơn hẳn danh sách
// đầy đủ, kèm chỉ dẫn rất rõ ràng để AI KHÔNG được gán nhầm class của người
// này cho người khác nữa. Từ khi có bảng mối quan hệ (Sư Phụ/Tri Kỷ/Kim Lan
// — xem CHAT_GLOBAL_RELATIONSHIP_COLUMNS ở config.js, đã được TRA SẴN thành
// tên đọc được ở AutoReply/index.js -> enrichMemberDirectoryWithRelationships()),
// mỗi dòng có thêm phần quan hệ (nếu có) để AI dùng KHI ĐƯỢC HỎI TỚI đúng
// chủ đề đó (vd "B là đệ tử của ai", "ai là đệ tử B", "B kết tri kỷ với ai",
// "B ở kim lan nào") — KHÔNG tự ý chêm info quan hệ vào câu trả lời cho
// những câu hỏi khác không liên quan.
// forceShowAll = true (câu hỏi ĐÃ được xác định là hỏi về quan hệ, xem
// isRelationshipQuery() ở trên) -> LUÔN hiện đủ Sư Phụ/Tri Kỷ/Kim Lan kèm
// "chưa có" nếu trống, thay vì bỏ qua hoàn toàn — để AI KHÔNG bị thiếu dữ
// kiện rồi tự né câu hỏi/lảng sang chuyện khác (bug đã gặp: data đúng,
// nhưng field không xuất hiện trong prompt nên AI không biết mà trả lời).
// Đệ Tử vẫn chỉ hiện khi có (không có khái niệm "chưa có đệ tử" cần nhấn
// mạnh, vì phần lớn thành viên vốn dĩ không có đệ tử).
function formatRelationshipSuffix(member, forceShowAll = false) {
  const parts = [];
  if (member.suPhuName) {
    parts.push(`Sư Phụ: ${member.suPhuName}`);
  } else if (forceShowAll) {
    parts.push('Sư Phụ: chưa có');
  }

  if (Array.isArray(member.discipleNames) && member.discipleNames.length) {
    parts.push(`Đệ Tử: ${member.discipleNames.join(', ')}`);
  }

  if (member.triKyName) {
    parts.push(`Tri Kỷ: ${member.triKyName}`);
  } else if (forceShowAll) {
    parts.push('Tri Kỷ: chưa có');
  }

  if (member.kimLan) {
    const kimLanMembersPart =
      Array.isArray(member.kimLanMembers) && member.kimLanMembers.length
        ? ` (cùng nhóm: ${member.kimLanMembers.join(', ')})`
        : '';
    parts.push(`Kim Lan: "${member.kimLan}"${kimLanMembersPart}`);
  } else if (forceShowAll) {
    parts.push('Kim Lan: chưa có');
  }

  return parts.length ? `; ${parts.join('; ')}` : '';
}

function buildMatchedMembersBlock(matchedMembers, isRelationshipQuestion = false) {
  if (!matchedMembers.length) return '';

  const lines = matchedMembers
    .map((member) => {
      const displayName = member.ingame || member.nickname || 'Không rõ tên';
      const nicknamePart = member.nickname && member.ingame ? ` (biệt danh: "${member.nickname}")` : '';
      return `- "${displayName}"${nicknamePart}: class ${member.className || 'chưa rõ (chưa cập nhật trong sheet)'}${formatRelationshipSuffix(member, isRelationshipQuestion)}`;
    })
    .join('\n');

  // Khi câu hỏi ĐÃ xác định là hỏi về quan hệ (Sư Phụ/Đệ Tử/Tri Kỷ/Tri
  // Kỉ/Kim Lan, chấp nhận cả 2 cách viết "tri kỷ"/"tri kỉ"), chèn thêm chỉ
  // dẫn CỨNG buộc AI trả lời THẲNG vào đúng mối quan hệ được hỏi (kể cả khi
  // giá trị là "chưa có") — không được lảng sang class/chuyện khác thay vì
  // trả lời, đây chính xác là lỗi đã gặp trước đó.
  const relationshipDirective = isRelationshipQuestion
    ? `\n\nQUAN TRỌNG: đây là câu hỏi về MỐI QUAN HỆ (Sư Phụ/Đệ Tử/Tri Kỷ/Tri Kỉ/Kim Lan) của 1 người cụ ` +
      `thể trong danh sách trên. PHẢI trả lời THẲNG vào đúng mối quan hệ được hỏi, dựa Y NGUYÊN theo giá ` +
      `trị đã tra sẵn ở trên, đừng lảng tránh/đừng chỉ nói về class/biệt danh/chuyện khác thay cho câu trả lời. ` +
      `NẾU giá trị đó là "chưa có" — tức người này CHƯA khai báo — thì TUYỆT ĐỐI KHÔNG được tự bịa ra bất ` +
      `kỳ ai (kể cả Sếp/chủ bot/chính bạn/admin/người đang chat cùng bạn/bất kỳ ai khác) làm Sư Phụ/Tri Kỷ/ ` +
      `Kim Lan của họ, dù chỉ để đùa vui hay lấy lòng người hỏi. Lúc đó chỉ trả lời đúng sự thật kiểu ` +
      `"[tên người này] chưa cho mình biết ai là Sư Phụ/Tri Kỷ" hoặc "chưa cho mình biết ở Kim Lan nào" ` +
      `(chọn đúng mục đang được hỏi) — có thể thêm 1 câu bông đùa ngắn đúng tính cách bạn sau đó nếu muốn, ` +
      `nhưng phần thông tin chính không được sai/bịa. ` +
      `VỀ CÁCH VIẾT CÂU TRẢ LỜI: nói THẲNG cái tên đó ra ngay trong câu chính (vd "đã có tri kỷ là [tên] ` +
      `rồi", "Sư Phụ của [người này] là [tên]") — cái tên đó là NỘI DUNG CHÍNH của câu trả lời, TUYỆT ĐỐI ` +
      `KHÔNG được nhét nó vào trong ngoặc đơn () như thể chỉ là biệt danh/chú thích phụ (ngoặc đơn ở phần ` +
      `giới thiệu class phía trên là để ghi tên vui của class, KHÔNG áp dụng kiểu viết đó cho tên người ở đây).`
    : '';

  return (
    `\n\nTHÔNG TIN CHÍNH XÁC (đã tra cứu sẵn từ Google Sheet, PHẢI dùng ĐÚNG y hệt như dưới đây, ` +
    `TUYỆT ĐỐI KHÔNG được gán nhầm class/quan hệ của người này sang người khác, mỗi người là 1 ` +
    `thông tin độc lập, không liên quan gì tới người khác trong danh sách bên dưới. Phần Sư Phụ/` +
    `Đệ Tử/Tri Kỷ/Kim Lan (nếu có) CHỈ dùng khi câu hỏi thực sự hỏi về mối quan hệ đó — đừng tự ý ` +
    `nhắc tới nếu không được hỏi):\n${lines}${relationshipDirective}`
  );
}

// Build khối "tài liệu tham khảo" liệt kê TOÀN BỘ thành viên (ingame +
// biệt danh + class) từ memberDirectory = [{ ingame, nickname, className }]
// (lấy từ googleSheets/chatGlobalSheet.js -> getAllChatGlobalMembers() —
// tab "ChatGlobal" giờ đã bao gồm luôn cả danh sách bang, xem
// AutoReply/index.js -> getCombinedMemberDirectory()). Chỉ dùng làm phương
// án DỰ PHÒNG cho trường hợp tên gõ sai/viết tắt mà findMatchedMembersInText
// (so khớp chính xác) không bắt được — vì để AI tự dò nguyên khối này rất dễ
// nhầm lẫn giữa các hàng (xem cảnh báo trong buildMatchedMembersBlock), nên
// LUÔN ưu tiên khối "THÔNG TIN CHÍNH XÁC" ở trên nếu có.
// Xáo trộn ngẫu nhiên (Fisher-Yates) — KHÔNG đụng vào mảng gốc (trả về bản
// sao). Lý do cần xáo trộn: memberDirectory luôn tới đây theo ĐÚNG 1 thứ tự
// cố định (thứ tự trong sheet). Khi AI không tra được chính xác ai (không
// có trong "THÔNG TIN CHÍNH XÁC"), nó vẫn phải nhìn vào danh sách ĐẦY ĐỦ
// này để dò — và LLM có xu hướng thiên vị vị trí (primacy bias): lúc không
// chắc, dễ "chọn đại" người ĐẦU TIÊN trong 1 danh sách dài thay vì thừa
// nhận không biết. Vì thứ tự sheet không đổi, hậu quả là BẤT KỲ câu hỏi
// "không tra được" nào cũng ra cùng 1 người cố định — đúng lỗi đã gặp
// (vd luôn ra "Tín" bất kể ai/hỏi gì). Xáo trộn lại mỗi lần build prompt để
// nếu AI có lỡ thiên vị vị trí thì cũng không còn lặp lại đúng 1 người nữa
// (kết hợp thêm chỉ dẫn cấm hẳn hành vi này ở dưới).
function shuffledCopy(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildMemberDirectoryBlock(memberDirectory) {
  if (!Array.isArray(memberDirectory) || !memberDirectory.length) return '';

  const lines = shuffledCopy(memberDirectory)
    .map((member) => {
      const displayName = member.ingame || member.nickname || 'Không rõ tên';
      const nicknamePart = member.nickname && member.ingame ? ` (biệt danh: "${member.nickname}")` : '';
      const classPart = member.className ? ` - class ${member.className}` : ' - chưa rõ class';
      return `- ${displayName}${nicknamePart}${classPart}${formatRelationshipSuffix(member)}`;
    })
    .join('\n');

  return (
    `\n\nDanh sách ĐẦY ĐỦ thành viên trong bang (tên ingame - class đang chơi, kèm Sư Phụ/Đệ Tử/Tri ` +
    `Kỷ/Kim Lan nếu có) — CHỈ dùng để tra cứu khi KHÔNG có mục "THÔNG TIN CHÍNH XÁC" ở trên cho ` +
    `người được hỏi (vd tên bị gõ sai/viết tắt/thiếu dấu). Nếu ĐÃ có "THÔNG TIN CHÍNH XÁC" ở trên ` +
    `cho người đó rồi thì DÙNG Y NGUYÊN, KHÔNG cần và KHÔNG được tra lại/đối chiếu với danh sách ` +
    `dưới đây nữa. THỨ TỰ danh sách dưới đây HOÀN TOÀN NGẪU NHIÊN, không mang ý nghĩa gì (không ` +
    `phải xếp hạng/độ liên quan/độ ưu tiên) — TUYỆT ĐỐI KHÔNG được lấy người đầu tiên hay bất kỳ ` +
    `người nào trong danh sách này ra làm câu trả lời chỉ vì không chắc/không tra được ai đang ` +
    `được hỏi tới. Nếu không xác định được rõ ràng người dùng đang hỏi về ai (tên không khớp ai ` +
    `trong danh sách, hoặc câu hỏi không nêu rõ tên) thì PHẢI nói thẳng là không biết/không tìm ` +
    `thấy/không rõ đang hỏi về ai, KHÔNG được tự chọn đại 1 cái tên bất kỳ (dù là tên đầu danh ` +
    `sách hay tên nào khác) để trả lời cho có, và KHÔNG được bịa ra class/quan hệ hay thông tin ` +
    `không có trong danh sách:\n${lines}\n` +
    `Mỗi dòng là 1 người ĐỘC LẬP, tuyệt đối không trộn/gán nhầm thông tin (class, quan hệ) giữa ` +
    `các dòng với nhau. Phần Sư Phụ/Đệ Tử/Tri Kỷ/Kim Lan CHỈ dùng khi câu hỏi thực sự hỏi về mối ` +
    `quan hệ đó, không tự ý nhắc tới.`
  );
}

module.exports = {
  normalizeForNameMatch,
  isRelationshipQuery,
  findMatchedMembersInText,
  buildMatchedMembersBlock,
  buildMemberDirectoryBlock,
};
