// ===== Build khối "KHO KIẾN THỨC GAME CỦA BANG" cho prompt AI =====
// Tách khỏi aiClient.js. Dữ liệu lấy từ tab "Kiến thức bang" (googleSheets/knowledgeSheet.js).
//
// Quy tắc: câu hỏi về kiến thức game (build, kỹ năng, class, trang bị, sự kiện, cơ chế, phiên bản...) CHỈ được
// trả lời dựa trên kho; không có mục liên quan thì AI nói "chưa có thông tin", không đoán từ trí nhớ. Các nội
// dung khác (tám chuyện, lịch scrim, thông tin thành viên...) không bị ảnh hưởng.

const {
  KNOWLEDGE_ENABLED,
  KNOWLEDGE_MAX_MATCHED,
  KNOWLEDGE_MAX_BLOCK_CHARS,
  KNOWLEDGE_ENTRY_MAX_CHARS,
  KNOWLEDGE_INCLUDE_ALL_MAX_CHARS,
  KNOWLEDGE_INDEX_MAX_TOPICS,
} = require('../config');
const { getKnowledgeEntries, getSiblingEntries } = require('../googleSheets/knowledgeSheet');

// Chữ thường, bỏ dấu tiếng Việt, mọi ký tự không phải chữ/số thành 1 khoảng trắng, bọc 2 đầu bằng khoảng
// trắng -> so khớp theo TỪ NGUYÊN VẸN (vd "ky nang" không dính vào "ky nangx").
function normalize(text) {
  const base = String(text || '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  return ` ${base} `;
}

// Điểm khớp của 1 mục với văn bản đã chuẩn hoá: mỗi từ khoá khớp +1, chủ đề khớp nguyên +2.
function scoreEntry(entry, normalizedText) {
  let score = 0;
  const topic = normalize(entry.topic);
  if (topic.trim().length >= 2 && normalizedText.includes(topic)) score += 2;
  for (const keyword of entry.keywords) {
    const normalized = normalize(keyword);
    if (normalized.trim().length >= 2 && normalizedText.includes(normalized)) score += 1;
  }
  return score;
}

function clip(text, max) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function formatEntry(entry) {
  const version = entry.version ? ` (phiên bản ${entry.version})` : '';
  return `- [${entry.topic}]${version}: ${clip(entry.content, KNOWLEDGE_ENTRY_MAX_CHARS)}`;
}

function buildRules(useSearch) {
  const searchNote = useSearch
    ? 'Câu hỏi này có kèm kết quả tìm kiếm ở trên: ƯU TIÊN kho; chỉ khi kho không có mục liên quan mới dùng kết quả ' +
      'tìm kiếm và nói rõ đó là thông tin từ internet, chưa được bang xác nhận. '
    : '';
  return (
    '\nQUY TẮC VỀ KIẾN THỨC GAME: nếu người dùng hỏi kiến thức game (build, kỹ năng, class/hệ phái, trang bị, ' +
    'sự kiện, cơ chế, phiên bản, cách chơi...) thì CHỈ trả lời dựa trên các mục của kho kiến thức bên trên. ' +
    'Không có mục nào liên quan thì nói tự nhiên theo giọng thường ngày rằng bot CHƯA CÓ THÔNG TIN về chuyện đó ' +
    'trong kho kiến thức của bang (có thể gợi ý nhờ admin/Bông bổ sung), TUYỆT ĐỐI KHÔNG tự đoán hay bịa từ trí nhớ, ' +
    'kể cả khi nghe quen. Mục nào có ghi phiên bản thì nhớ rằng game có thể đã đổi sau đó. ' +
    searchNote +
    'Quy tắc này CHỈ áp dụng cho kiến thức game — tám chuyện, lịch scrim/bang chiến, thông tin thành viên và các ' +
    'nội dung khác vẫn trả lời bình thường.'
  );
}

// userRequest: câu hỏi hiện tại. extraText: văn bản bổ sung để khớp từ khoá (vd vài tin gần nhất trong kênh,
// để câu hỏi nối tiếp kiểu "còn kỹ năng 2 thì sao" vẫn tìm đúng mục). Trả về chuỗi (có thể rỗng nếu tắt).
async function buildKnowledgeBlock(userRequest, { useSearch = false, extraText = '' } = {}) {
  if (!KNOWLEDGE_ENABLED) return '';

  let entries = [];
  try {
    entries = await getKnowledgeEntries();
  } catch (error) {
    console.error('[kiến thức] Lỗi lấy kho kiến thức:', error.message);
  }

  const header = '\n\nKHO KIẾN THỨC GAME CỦA BANG (do admin bang tự soạn, là NGUỒN DUY NHẤT để trả lời kiến thức game):\n';

  if (!entries.length) {
    return `${header}(kho đang trống — chưa có mục nào)${buildRules(useSearch)}`;
  }

  const currentText = normalize(userRequest);
  const contextText = normalize(`${userRequest} ${extraText}`);

  // Ưu tiên khớp theo CÂU HỎI HIỆN TẠI; không khớp mới xét thêm ngữ cảnh gần nhất.
  let scored = entries
    .map((entry) => ({ entry, score: scoreEntry(entry, currentText) }))
    .filter((item) => item.score > 0);
  if (!scored.length && extraText) {
    scored = entries
      .map((entry) => ({ entry, score: scoreEntry(entry, contextText) }))
      .filter((item) => item.score > 0);
  }
  scored.sort((a, b) => b.score - a.score || a.entry.row - b.entry.row);

  let selected = scored.slice(0, KNOWLEDGE_MAX_MATCHED).map((item) => item.entry);

  if (!selected.length) {
    const totalChars = entries.reduce((sum, e) => sum + Math.min(e.content.length, KNOWLEDGE_ENTRY_MAX_CHARS), 0);
    if (totalChars <= KNOWLEDGE_INCLUDE_ALL_MAX_CHARS) {
      selected = entries; // kho nhỏ: đưa hết cho AI tự chọn
    } else {
      // Kho lớn mà không khớp mục nào: chỉ đưa danh sách chủ đề để AI biết kho có gì (và biết câu hỏi nằm ngoài).
      const topics = entries
        .slice(0, KNOWLEDGE_INDEX_MAX_TOPICS)
        .map((e) => e.topic)
        .join('; ');
      return (
        `${header}(không có mục nào khớp với câu hỏi này. Các chủ đề hiện có trong kho: ${topics})` +
        buildRules(useSearch)
      );
    }
  }

  // Mục khớp thuộc 1 nhóm (A1/A2/A3...) thì đưa kèm các phần cùng nhóm, xếp SAU các mục khớp (nếu còn chỗ trong giới hạn
  // ký tự) để AI trả lời được cả câu hỏi nối tiếp "còn phần sau thì sao" mà không cần khớp từ khoá lần nữa.
  if (scored.length && selected.length) {
    const have = new Set(selected.map((entry) => entry.row));
    const extras = [];
    for (const entry of selected) {
      for (const sibling of getSiblingEntries(entry, entries)) {
        if (!have.has(sibling.row)) {
          have.add(sibling.row);
          extras.push(sibling);
        }
      }
    }
    selected = selected.concat(extras);
  }

  const lines = [];
  let used = 0;
  for (const entry of selected) {
    const line = formatEntry(entry);
    if (used + line.length > KNOWLEDGE_MAX_BLOCK_CHARS && lines.length) break;
    lines.push(line);
    used += line.length;
  }

  return `${header}${lines.join('\n')}${buildRules(useSearch)}`;
}

// Dùng cho mon!kienthuc test <câu hỏi>: trả về các mục khớp (đã sắp theo điểm) để admin kiểm tra từ khoá.
async function findMatchedEntries(text) {
  const entries = await getKnowledgeEntries();
  const normalized = normalize(text);
  return entries
    .map((entry) => ({ entry, score: scoreEntry(entry, normalized) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.row - b.entry.row);
}

module.exports = { buildKnowledgeBlock, findMatchedEntries };
