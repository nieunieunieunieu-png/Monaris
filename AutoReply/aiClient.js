// Gọi Google Gemini API cho các yêu cầu "tự do" (làm thơ, kể chuyện, giải
// thích...) mà không có sẵn trong danh sách KEYWORD_RESPONSES cố định.
// Chỉ chứa logic gọi API — không đụng vào Discord client hay parse tin nhắn
// (phần đó nằm ở AutoReply/index.js).
//
// Module được tách thành:
//   - contentFilter.js     : chặn nội dung 18+/nhạy cảm/bạo lực/trẻ em
//   - systemInstruction.js : persona/system instruction cho Gemini
//   - serperSearch.js      : gọi Serper lấy kết quả search thật
//   - geminiCore.js         : gọi generateContent + fallback nhiều model
//   - memberContext.js      : tra cứu + build khối "thông tin thành viên"
//   - promptContext.js      : build khối "lịch scrim/bang chiến" + "lịch sử chat"
//   - knowledgeBlock.js     : build khối "kho kiến thức game của bang" (tab Sheet "Kiến thức bang")
//   - channelContext.js     : "đọc không khí kênh" — các tin gần nhất của MỌI NGƯỜI trong kênh
//   - timeContext.js        : giờ hiện tại/thứ mấy/còn bao lâu tới bang chiến, scrim
//   - temperaturePolicy.js  : chat thường temperature cao, trả lời bám dữ liệu (kiến thức/search) temperature thấp
//   - fewShotExamples.js    : mẫu giọng, gắn vào CHAT_SYSTEM_INSTRUCTION (systemInstruction.js)
//   - aiClient.js (đây)    : askGemini() — ghép tất cả lại thành 1 lần gọi
const { GEMINI_API_KEY } = require('../config');
const { isBlockedContentQuery } = require('./contentFilter');
const { fetchSerperResults } = require('./serperSearch');
const { callGeminiWithFallback } = require('./geminiCore');
const { findMatchedMembersInText, buildMatchedMembersBlock, buildMemberDirectoryBlock, isRelationshipQuery } = require('./memberContext');
const { buildScrimContextBlock, buildChatHistoryBlock } = require('./promptContext');
const { buildKnowledgeBlock } = require('./knowledgeBlock');
const { buildChannelKnowledgeBlock } = require('./channelKnowledgeContext');
const { buildMonarisSheetKnowledgeBlock } = require('./monarisSheetKnowledge');

const {
  CHAT_SYSTEM_INSTRUCTION: ORIGINAL_SYSTEM_INSTRUCTION
} = require('./systemInstruction');

const {
  PERSONA
} = require('./bongPersona');

// Kết hợp tính cách Monaris hiện tại với tính cách Bông.
const CHAT_SYSTEM_INSTRUCTION =
  ORIGINAL_SYSTEM_INSTRUCTION +
  '\n\n' +
  PERSONA;

const { buildTimeContextBlock } = require('./timeContext');
const { buildChannelAtmosphereBlock } = require('./channelContext');
const { pickTemperature } = require('./temperaturePolicy');
const { scrimData: sharedScrimData, bcData: sharedBcData } = require('../state');

// Discord giới hạn 2000 ký tự / tin nhắn — cắt bớt cho an toàn nếu Gemini
// trả về đoạn quá dài (hiếm khi xảy ra với các yêu cầu ngắn như làm thơ).
const MAX_REPLY_LENGTH = 1900;

const PRIVATE_CHAT_CHANNEL_ID = '1566701909270601758';

const MONARIS_IDENTITY_RULE =
  'Bạn là Monaris, một bot AI. Khi trả lời thay hoặc hỗ trợ chủ bot, ' +
  'không được tự nhận mình là Mai hoặc khẳng định chính Mai đang nhắn. ' +
  'Không tiết lộ nội dung hội thoại của kênh riêng sang kênh khác.';

// useSearch = true -> gọi Serper trước để lấy dữ liệu thật, nhét vào prompt,
// rồi mới gọi Gemini để tổng hợp câu trả lời (Gemini không tự search nữa).
// memberInfo = { ingame, className } (lấy từ tab "Bang" qua Discord ID người
// đang chat, xem googleSheets/chatGlobalSheet.js) -> nếu có, nhét vào đầu prompt
// để AI biết đang nói chuyện với ai, xưng hô bằng tên ingame + nhắc đúng
// class của người đó (như bạn bè cùng bang chơi chung, không phải chat vô danh).
// memberDirectory = [{ ingame, nickname, className }] (lấy từ getAllChatGlobalMembers()) ->
// nếu có: (1) code TỰ TRA CHÍNH XÁC những tên được nhắc trong userRequest
// (findMatchedMembersInText) rồi nhét thẳng thông tin đó vào prompt với ưu
// tiên cao nhất, (2) vẫn kèm thêm toàn bộ danh sách làm phương án dự phòng
// cho tên gõ sai/viết tắt mà bước (1) không bắt được.
// chatHistory = [{ userMessage, botReply }] (lấy từ
// googleSheets/chatHistorySheet.js -> getRecentChatHistoryForUser()) -> nếu
// có, nhét vào cuối prompt làm ngữ cảnh trò chuyện trước đó với đúng người này.
// scrimData/bcData (state.js) -> nếu có, nhét khối "LỊCH SCRIM/BANG CHIẾN
// THỰC TẾ" (buildScrimContextBlock ở trên) vào prompt để AI trả lời đúng
// giờ đánh scrim thật/tình trạng điểm danh bang chiến thật, thay vì chỉ dựa vào
// mô tả chung chung trong SYSTEM_INSTRUCTION (không có giờ giấc cụ thể).
// channelMessages = [{ time, label, text }] (lấy từ channelContext.fetchRecentChannelMessages()) -> nếu có,
// nhét khối "KHÔNG KHÍ KÊNH" (mọi người đang tám gì, không chỉ lượt hỏi–đáp với bot) vào prompt.
// Khối "NGỮ CẢNH THỜI GIAN" (giờ VN, còn bao lâu tới bang chiến/scrim) LUÔN được thêm, dùng scrimData/bcData
// truyền vào hoặc lấy từ state.js nếu nơi gọi không truyền (vd chào buổi sáng, từ khóa).
async function askGemini(
  userRequest,
  {
    useSearch = false,
    memberInfo = null,
    memberDirectory = null,
    chatHistory = null,
    scrimData = null,
    bcData = null,
    channelMessages = null,
    channelId = null,
    requesterId = null,
  } = {}
) {
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY chưa được set — bỏ qua yêu cầu AI.');
    return null;
  }

  // Chặn NGAY từ đầu, áp dụng cho MỌI yêu cầu (kể cả chat thường không bật
  // search) — không để lọt qua chỉ vì không đi qua nhánh search bên dưới.
  if (isBlockedContentQuery(userRequest)) {
    return 'Bot không hỗ trợ nội dung này nha 🙅‍♀️, hỏi bot cái khác đi!';
  }

  let finalPrompt = userRequest;
  let sourceLinks = [];

  // memberInfo.isCreator = true khi discordId khớp BOT_CREATOR_DISCORD_ID
  // (gắn từ AutoReply/index.js -> getMemberInfoAnySource) — người đã dạy/
  // tạo ra bot, gọi là "Sếp". Prepend NGAY ĐẦU prompt (ưu tiên cao nhất, áp
  // dụng cho CẢ 2 nhánh useSearch true/false bên dưới) để AI luôn biết và
  // đối xử đúng mực với người này, bất kể có/không có ingame/class trong
  // sheet thành viên.
  
const creatorNote = memberInfo && memberInfo.isCreator
  ? 'Người đang chat là Bông, chủ bot Monaris. ' +
    'Chỉ gọi người này là Bông. ' +
    'Không dùng tên thật hoặc danh xưng cũ. ' +
    'Trò chuyện tự nhiên, thân thiết, không quá trang trọng. '
  : '';

  const disciplenote = memberInfo && memberInfo.isCreatorDisciple
    ? 'Ghi chú: người đang chat cùng bạn lần này là đệ tử của "Sếp" (người đã tạo ra bạn) trong ' +
      'game. Cứ chat bình thường như với thành viên khác, chưa cần đổi thái độ gì đặc biệt. '
    : '';

  const privateNote =
    String(chatHistory?.channelId || '') === PRIVATE_CHAT_CHANNEL_ID &&
    memberInfo?.isCreator
      ? 'QUY TẮC RIÊNG CHO KÊNH NÀY: Bạn đang trò chuyện với chủ bot. ' +
        'Hãy gọi người ấy là "bé", trò chuyện tự nhiên và thân mật. ' +
        'Không gọi là "Sếp" trong kênh này. '
      : '';

  if (memberInfo && (memberInfo.ingame || memberInfo.className)) {
    const who = [
      memberInfo.ingame ? `tên ingame "${memberInfo.ingame}"` : null,
      memberInfo.className ? `chơi class "${memberInfo.className}"` : null,
    ]
      .filter(Boolean)
      .join(', ');

    finalPrompt =
      `Người bạn đang chat cùng trong bang là 1 thành viên có ${who}. Có thể gọi tên ingame của ` +
      `họ hoặc nhắc tới class đó cho thân mật như bạn bè trong game, nhưng KHÔNG lạm dụng nhắc ` +
      `tên/class ở mọi câu — chỉ chèn vào khi tự nhiên phù hợp ngữ cảnh. Tin nhắn/yêu cầu của họ: ` +
      `${finalPrompt}`;
  } else if (memberInfo && memberInfo.discordDisplayName) {
    // FIX (bug "chọn nhầm tên đầu tiên trong danh sách Bang"): người này
    // CHƯA có ingame/class trong tab "Bang"/"ChatGlobal" (chưa từng
    // /setprofile). Trước đây không nhét gì vào đây cả -> AI không biết đang
    // nói chuyện với ai, mà bên dưới vẫn có nguyên danh sách đầy đủ thành
    // viên bang (memberDocsBlock) làm phương án dự phòng, nên AI hay tự đoán
    // bừa và LUÔN chốt nhầm vào đúng người ĐẦU TIÊN trong danh sách đó để
    // xưng hô, bất kể ai đang thực sự tag/chat. Chốt cứng: dùng NGAY tên
    // Discord (nickname trong server, hoặc username) của chính người đang
    // chat, cấm tuyệt đối tự lấy tên người khác trong danh sách bang.
    finalPrompt =
      `Người bạn đang chat cùng lần này có tên Discord là "${memberInfo.discordDisplayName}" ` +
      `(họ CHƯA đăng ký tên ingame trong bang). Nếu cần xưng hô, gọi ĐÚNG tên Discord này — ` +
      `TUYỆT ĐỐI KHÔNG tự lấy/đoán tên của một người khác trong danh sách thành viên bang bên ` +
      `dưới để gọi thay cho họ. Tin nhắn/yêu cầu của họ: ${finalPrompt}`;
  }

  finalPrompt = creatorNote + disciplenote + privateNote + finalPrompt;

  // Tra cứu CHÍNH XÁC bằng code (dựa trên userRequest GỐC, chưa bị sửa bởi
  // nhánh search bên dưới) + build 2 khối tài liệu — dùng chung cho cả 2
  // nhánh useSearch true/false, vì nhánh useSearch BUILD LẠI finalPrompt từ
  // đầu (ghi đè hoàn toàn phần đã nhét ở trên).
  const matchedMembers = findMatchedMembersInText(userRequest, memberDirectory);
  const isRelationshipQuestion = isRelationshipQuery(userRequest);

  // FIX (bug "Tín"/tự đoán nhầm người hỏi): findMatchedMembersInText() CHỈ
  // khớp được khi người dùng gõ RÕ 1 cái tên trong danh sách. Nhưng rất
  // nhiều câu hỏi (đặc biệt câu hỏi quan hệ) lại tự xưng ("tri kỷ tôi/tao/
  // mình đâu", "sư phụ tao là ai") — không hề gõ tên, nên matchedMembers rỗng,
  // buildMatchedMembersBlock() không có gì để hiện, và AI phải tự dò cả
  // danh sách đầy đủ để đoán xem "tôi" là ai -> hay đoán sai/lặp lại NHẦM
  // sang đúng 1 người cố định bất kể ai đang hỏi (đây là nguyên nhân đúng
  // của lỗi "Tín" xuất hiện lặp lại ở nhiều người hỏi khác nhau trong ảnh
  // chụp màn hình). Vì đã biết CHÍNH XÁC người đang chat là ai qua
  // memberInfo.discordId (getMemberInfoAnySource ở index.js), tự bù thẳng
  // hồ sơ ĐẦY ĐỦ (kèm suPhuName/triKyName/kimLan...) của họ vào matchedMembers
  // — không cần và không nên bắt AI đoán chuyện này nữa.
  if (memberInfo && memberInfo.discordId && Array.isArray(memberDirectory)) {
    const alreadyMatched = matchedMembers.some((m) => m.discordId === memberInfo.discordId);
    if (!alreadyMatched) {
      const selfRecord = memberDirectory.find((m) => m.discordId === memberInfo.discordId);
      if (selfRecord) {
        matchedMembers.unshift(selfRecord);
      }
    }
  }
  const memberDocsBlock =
    buildMatchedMembersBlock(matchedMembers, isRelationshipQuestion) + buildMemberDirectoryBlock(memberDirectory);
  const historyBlock = buildChatHistoryBlock(chatHistory);
  const scrimContextBlock = buildScrimContextBlock(scrimData, bcData);
  const timeContextBlock = buildTimeContextBlock(scrimData || sharedScrimData, bcData || sharedBcData);
  const channelAtmosphereBlock = buildChannelAtmosphereBlock(channelMessages);

  // Kho kiến thức game của bang (tab "Kiến thức bang"): câu hỏi về game CHỈ được trả lời theo kho, không có thì
  // "chưa có thông tin". Khớp theo câu hỏi hiện tại + vài tin gần nhất trong kênh (để câu hỏi nối tiếp vẫn đúng mục).
  const recentContextText = Array.isArray(chatHistory)
    ? chatHistory
        .slice(-2)
        .map((entry) => entry.userMessage || '')
        .join(' ')
    : '';
  const knowledgeBlock = await buildKnowledgeBlock(userRequest, { useSearch, extraText: recentContextText });
  const channelKnowledgeBlock = buildChannelKnowledgeBlock(userRequest);
  const monarisSheetBlock = await buildMonarisSheetKnowledgeBlock(userRequest);


  if (useSearch) {
    const searchResult = await fetchSerperResults(userRequest);

    if (!searchResult) {
      return 'Bot không tìm kiếm được lúc này 😅, hỏi không cần search thử xem sao nha!';
    }

    sourceLinks = searchResult.links;
    const memberContextPrefix = memberInfo && (memberInfo.ingame || memberInfo.className)
      ? `Người hỏi có ${[
          memberInfo.ingame ? `tên ingame "${memberInfo.ingame}"` : null,
          memberInfo.className ? `chơi class "${memberInfo.className}"` : null,
        ]
          .filter(Boolean)
          .join(', ')} — có thể nhắc tới nếu tự nhiên phù hợp.\n\n`
      : memberInfo && memberInfo.discordDisplayName
      // Cùng fix ở trên, áp dụng cho nhánh useSearch (build lại finalPrompt
      // từ đầu nên phải lặp lại note fallback tên Discord ở đây).
      ? `Người hỏi có tên Discord là "${memberInfo.discordDisplayName}" (chưa đăng ký tên ingame) ` +
        `— gọi ĐÚNG tên này nếu cần xưng hô, KHÔNG tự đoán tên người khác trong danh sách bang.\n\n`
      : '';

    finalPrompt =
      `${creatorNote}${disciplenote}${privateNote}${memberContextPrefix}Dưới đây là kết quả tìm kiếm mới nhất liên quan đến câu hỏi:\n\n${searchResult.text}\n\n` +
      `Dựa vào thông tin trên (nếu liên quan), trả lời câu hỏi sau bằng tiếng Việt, ` +
      `ngắn gọn tự nhiên: ${userRequest}` +
      memberDocsBlock +
      scrimContextBlock +
      timeContextBlock +
      knowledgeBlock +
      monarisSheetBlock +
      channelKnowledgeBlock +
      channelAtmosphereBlock +
      historyBlock;
  } else {
    finalPrompt +=
      memberDocsBlock + scrimContextBlock + timeContextBlock + knowledgeBlock + monarisSheetBlock + channelKnowledgeBlock + channelAtmosphereBlock + historyBlock;
  }

  // Chat thường -> temperature cao cho đỡ nhạt; hỏi kiến thức game / có kèm search -> temperature thấp để khỏi bịa
  // (xem temperaturePolicy.js). Persona dùng bản có few-shot mẫu giọng.
  const temperature = await pickTemperature(userRequest, { useSearch });
  const ownerMemory = await require('./ownerLearning').getPrivateInstruction({ channelId, userId: requesterId });
  const rawText = await callGeminiWithFallback(finalPrompt, {
    systemInstruction: CHAT_SYSTEM_INSTRUCTION + ownerMemory + require('../admin/control/settings').prompt() + '\n' + MONARIS_IDENTITY_RULE,
    temperature,
  });

  if (rawText === '__QUOTA_EXCEEDED__') {
    return 'Bot dùng hết lượt hỏi AI hôm nay rồi 😅 mai quay lại nha!';
  }
  if (!rawText) return null;

  let finalText =
    require('./bongPersona').normalizeReply(rawText);
  if (useSearch && sourceLinks.length) {
    // Bọc link trong <...> — cú pháp Discord để KHÔNG tự tạo embed/preview
    // (ảnh thu nhỏ, tiêu đề trang...) cho link đó, chỉ hiện link trần dạng
    // text. Tránh trường hợp trang nguồn có ảnh/preview không phù hợp dù
    // tiêu đề/snippet đã qua lọc ở fetchSerperResults.
    const suppressedLinks = sourceLinks.map((link) => `<${link}>`);
    finalText += `\n\n-# Nguồn: ${suppressedLinks.join(', ')}`;
  }

  return finalText.length > MAX_REPLY_LENGTH
    ? `${finalText.slice(0, MAX_REPLY_LENGTH)}…`
    : finalText;
}

module.exports = { askGemini };
