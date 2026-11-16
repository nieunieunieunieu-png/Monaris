// ===== config/knowledge.js — Kho kiến thức bang cho AI (tab Google Sheet "Kiến thức bang") =====
// Chỉ chứa giá trị, không chứa logic. Xem googleSheets/knowledgeSheet.js + AutoReply/knowledgeBlock.js.
//
// Game đổi theo từng phiên bản nên AI rất dễ trả lời sai về build/kỹ năng/sự kiện. Kho này là
// 1 tab Sheet do admin/Bông tự soạn: AI CHỈ được trả lời kiến thức game dựa trên kho; không có
// mục liên quan thì nói "chưa có thông tin" thay vì đoán.

const { BOT_CHAT_HISTORY_SPREADSHEET_ID } = require('./sheets');
const { TEAM_VIEWER_ROLE_ID } = require('./core');

// Mặc định dùng chung spreadsheet với "Bảng Tin Monaris"/"ChatGlobal" (bot đã có quyền ghi).
// Đổi qua ENV KNOWLEDGE_SPREADSHEET_ID nếu muốn tách riêng.
const KNOWLEDGE_SPREADSHEET_ID = process.env.KNOWLEDGE_SPREADSHEET_ID || BOT_CHAT_HISTORY_SPREADSHEET_ID;
const KNOWLEDGE_SHEET_NAME = 'Kiến thức bang';

// ENV KNOWLEDGE_ENABLED=false để tắt hẳn (AI quay về cách trả lời cũ, không có khối kho).
const KNOWLEDGE_ENABLED = !/^(0|false|off|no)$/i.test(String(process.env.KNOWLEDGE_ENABLED || 'true').trim());

// Đọc lại Sheet tối đa 1 lần / chừng này ms (sửa Sheet xong chờ tối đa ngần này, hoặc gõ mon!kienthuc reload).
const KNOWLEDGE_CACHE_TTL_MS = Number(process.env.KNOWLEDGE_CACHE_TTL_MS) || 5 * 60 * 1000;

// Mỗi câu hỏi chỉ nhét tối đa ngần này mục KHỚP từ khoá vào prompt, và tổng ký tự khối kho tối đa.
const KNOWLEDGE_MAX_MATCHED = 6;
const KNOWLEDGE_MAX_BLOCK_CHARS = 6000;
// Nội dung 1 mục dài hơn mức này thì bị cắt khi đưa vào prompt (tránh 1 ô quá dài nuốt hết chỗ).
const KNOWLEDGE_ENTRY_MAX_CHARS = 1500;
// Không mục nào khớp từ khoá: nếu TOÀN BỘ kho ngắn hơn mức này thì đưa hết cho AI, dài hơn thì chỉ đưa danh sách chủ đề.
const KNOWLEDGE_INCLUDE_ALL_MAX_CHARS = 3000;
// Số chủ đề tối đa liệt kê trong "danh sách chủ đề" khi không khớp mục nào.
const KNOWLEDGE_INDEX_MAX_TOPICS = 60;

// Role được XEM + DÙNG lệnh kho kiến thức (nút Hub "Tra Cứu", hỏi bằng dấu "?"): mặc định role member bang
// (1450590370194001941). Sửa kho (web "Kiến Thức Bot", mon!kienthuc) vẫn chỉ Bông. Xem utils/knowledgeAccess.js.
const KNOWLEDGE_VIEW_ROLE_ID = process.env.KNOWLEDGE_VIEW_ROLE_ID || TEAM_VIEWER_ROLE_ID;

// ===== Kho ảnh RIÊNG của kiến thức (tách hẳn khỏi /saveimg) =====
// Ảnh gắn vào mục kiến thức nằm ở 1 tab riêng (mặc định cùng spreadsheet với tab "Kiến thức bang") và 1 folder
// Cloudinary riêng; KHÔNG nằm trong tab "Cây Thư Mục" nên /viewlistimg, /send_img, /renameimg không thấy ảnh này.
// ID ảnh là số tự tăng riêng của tab này (1, 2, 3...), đếm độc lập với /saveimg. Đổi qua ENV nếu muốn tách spreadsheet.
const KNOWLEDGE_IMAGE_SPREADSHEET_ID = process.env.KNOWLEDGE_IMAGE_SPREADSHEET_ID || KNOWLEDGE_SPREADSHEET_ID;
const KNOWLEDGE_IMAGE_SHEET_NAME = process.env.KNOWLEDGE_IMAGE_SHEET_NAME || 'Ảnh Kiến Thức';
const KNOWLEDGE_IMAGE_CLOUDINARY_FOLDER = process.env.KNOWLEDGE_IMAGE_CLOUDINARY_FOLDER || 'nm_kienthuc';

// Giới hạn độ dài khi admin sửa kho qua web (API /admin/kienthuc/*). Nội dung khớp KNOWLEDGE_ENTRY_MAX_CHARS.
// images = số ảnh tối đa gắn vào 1 mục (ảnh nằm trong tab riêng "Ảnh Kiến Thức", không phải kho của /saveimg).
// group = tên "nhóm liên kết": các mục CÙNG nhóm (vd A1, A2, A3 cùng nhóm "A") tự gợi ý nhau khi xem 1 phần.
const KNOWLEDGE_LIMITS = { topic: 80, keywords: 300, content: 1500, version: 30, images: 10, group: 60 };
// Số phần cùng nhóm tối đa hiện thành nút gợi ý dưới 1 câu trả lời (2 hàng x 5 nút).
const KNOWLEDGE_RELATED_MAX = 10;
// Số mục tối đa 1 lần nhập hàng loạt (1 lệnh ghi duy nhất vào Sheet).
const KNOWLEDGE_BULK_MAX = 50;

// ===== Hỏi nhanh trong chat: tin kết thúc bằng dấu "?" (xem AutoReply/knowledgeQuestion.js) =====
// Vd "cửu linh build pvp thế nào ?" (khớp từ khoá thì bot trả lời) hoặc "bot, abc xyz ?" (có "bot," ở đầu thì bot
// LUÔN trả lời, không khớp từ khoá thì báo chưa có thông tin).
// ENV KNOWLEDGE_QA_ENABLED=false để tắt riêng tính năng này (kho kiến thức cho AI vẫn chạy bình thường).
const KNOWLEDGE_QA_ENABLED = !/^(0|false|off|no)$/i.test(String(process.env.KNOWLEDGE_QA_ENABLED || 'true').trim());
// true: nhờ AI diễn đạt lại theo ĐÚNG các mục khớp (có fallback nội dung gốc khi AI lỗi/hết quota).
// false: luôn trả nguyên nội dung mục khớp nhất, không gọi AI (đỡ quota, không bao giờ "bịa").
const KNOWLEDGE_QA_USE_AI = !/^(0|false|off|no)$/i.test(String(process.env.KNOWLEDGE_QA_USE_AI || 'true').trim());
// Điểm khớp tối thiểu (mỗi từ khoá khớp +1, chủ đề khớp nguyên +2). Tăng lên 2 nếu bot trả lời quá dễ dãi.
const KNOWLEDGE_QA_MIN_SCORE = Number(process.env.KNOWLEDGE_QA_MIN_SCORE) || 1;
// Số mục khớp tối đa đưa cho AI / liệt kê làm "mục liên quan".
const KNOWLEDGE_QA_MAX_ENTRIES = 3;
// Mỗi người chỉ được hỏi 1 lần / chừng này ms trong 1 kênh (chống spam; trong lúc chờ bot im lặng).
const KNOWLEDGE_QA_COOLDOWN_MS = Number(process.env.KNOWLEDGE_QA_COOLDOWN_MS) || 8 * 1000;
// Số ảnh tối đa bot gửi kèm khi trả lời (lấy từ mục khớp nhất). Bằng số ảnh tối đa của 1 mục (10 = giới hạn file đính kèm của 1 tin Discord).
const KNOWLEDGE_QA_MAX_IMAGES = KNOWLEDGE_LIMITS.images;
// Có "bot," ở đầu mà không mục nào khớp: true = trả lời "chưa có thông tin", false = im lặng.
const KNOWLEDGE_QA_REPLY_WHEN_NO_MATCH = !/^(0|false|off|no)$/i.test(
  String(process.env.KNOWLEDGE_QA_REPLY_WHEN_NO_MATCH || 'true').trim()
);

// Câu trả lời kiến thức dài hơn chừng này ký tự thì chia trang (nút Trang trước/Trang sau), mỗi trang khoảng
// chừng này ký tự (cắt ở chỗ xuống dòng/hết câu gần nhất để không đứt giữa chừng).
const KNOWLEDGE_PAGE_CHARS = Number(process.env.KNOWLEDGE_PAGE_CHARS) || 1000;

// Phiên bản game HIỆN TẠI, vd "1.4.0". Mục kiến thức có ghi phiên bản THẤP hơn mức này sẽ kèm dòng cảnh báo
// "có thể đã đổi". Để trống = không cảnh báo (mặc định). Đổi qua ENV KNOWLEDGE_CURRENT_VERSION.
const KNOWLEDGE_CURRENT_VERSION = String(process.env.KNOWLEDGE_CURRENT_VERSION || '').trim();

// Nút "Tra Cứu" ở Hub: đọc lại Sheet nếu bản cache cũ hơn chừng này ms (nhìn gần như trực tiếp mà không dồn quota).
const KNOWLEDGE_LOOKUP_MAX_AGE_MS = Number(process.env.KNOWLEDGE_LOOKUP_MAX_AGE_MS) || 30 * 1000;

module.exports = {
  KNOWLEDGE_QA_ENABLED,
  KNOWLEDGE_QA_USE_AI,
  KNOWLEDGE_QA_MIN_SCORE,
  KNOWLEDGE_QA_MAX_ENTRIES,
  KNOWLEDGE_QA_COOLDOWN_MS,
  KNOWLEDGE_QA_MAX_IMAGES,
  KNOWLEDGE_QA_REPLY_WHEN_NO_MATCH,
  KNOWLEDGE_LOOKUP_MAX_AGE_MS,
  KNOWLEDGE_PAGE_CHARS,
  KNOWLEDGE_CURRENT_VERSION,
  KNOWLEDGE_LIMITS,
  KNOWLEDGE_RELATED_MAX,
  KNOWLEDGE_BULK_MAX,
  KNOWLEDGE_SPREADSHEET_ID,
  KNOWLEDGE_SHEET_NAME,
  KNOWLEDGE_VIEW_ROLE_ID,
  KNOWLEDGE_IMAGE_SPREADSHEET_ID,
  KNOWLEDGE_IMAGE_SHEET_NAME,
  KNOWLEDGE_IMAGE_CLOUDINARY_FOLDER,
  KNOWLEDGE_ENABLED,
  KNOWLEDGE_CACHE_TTL_MS,
  KNOWLEDGE_MAX_MATCHED,
  KNOWLEDGE_MAX_BLOCK_CHARS,
  KNOWLEDGE_ENTRY_MAX_CHARS,
  KNOWLEDGE_INCLUDE_ALL_MAX_CHARS,
  KNOWLEDGE_INDEX_MAX_TOPICS,
};
