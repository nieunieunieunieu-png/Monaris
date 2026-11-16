// ===== AutoReply: danh bạ thành viên =====
// Gộp danh bạ Bang + ChatGlobal, làm giàu quan hệ/tên Discord, tra thông tin 1
// thành viên từ mọi nguồn và đổi <@ID> thành tên thật trước khi đưa vào AI.

const { BOT_CREATOR_DISCORD_ID, BOT_CREATOR_DISCIPLE_DISCORD_IDS } = require('../config');
const {
  getChatGlobalMemberByDiscordId,
  getAllChatGlobalMembers,
} = require('../googleSheets/chatGlobalSheet');
const { getMemberInfoByDiscordId, getAllBangMembers } = require('../googleSheets/memberSheet');
const { getAllUpdateProfileMembers, getUpdateProfileInfoByDiscordId } = require('../googleSheets/updateProfileSheet');

// Danh sách thành viên cho AI auto-chat — ĐỌC LẠI GỘP CẢ 2 nguồn: tab
// "Bang" (server chính, memberSheet.js, cột A/C/D) VÀ tab "ChatGlobal" (mọi
// server, chatGlobalSheet.js). Trước đây từng bỏ tab "Bang" vì tưởng
// "ChatGlobal" đã đồng bộ đủ, nhưng dùng lại song song cho chắc — 2 tab có
// thể lệch nhau (vd đổi class trong tab "Bang" nhưng chưa /setprofile lại ở
// "ChatGlobal", hoặc ngược lại) — xem mergeMemberDirectories() bên dưới để
// biết cách gộp/ưu tiên dữ liệu khi 1 người có mặt ở cả 2 tab.
async function getCombinedMemberDirectory() {
  const [bangMembers, chatGlobalMembers, profileMembers] = await Promise.all([
    getAllBangMembers(),
    getAllChatGlobalMembers(),
    getAllUpdateProfileMembers(),
  ]);

  const merged = mergeMemberDirectories(bangMembers, chatGlobalMembers, profileMembers);
  return enrichMemberDirectoryWithRelationships(merged);
}

// Tra ngược Discord ID -> TÊN HIỂN THỊ (ingame ưu tiên, không có thì
// nickname) trong CHÍNH danh sách đã gộp `directory` — dùng để hiển thị Sư
// Phụ/Tri Kỷ (đang lưu dạng ID thô ở suPhuId/triKyId) thành tên đọc được
// cho AI, thay vì 1 dãy số vô nghĩa.
function findDisplayNameById(directory, discordId) {
  if (!discordId) return null;
  const found = directory.find((m) => m.discordId === discordId);
  return found ? found.ingame || found.nickname || null : null;
}

// Gắn thêm 4 field ĐÃ TRA SẴN cho mỗi thành viên trong memberDirectory (đầu
// vào là mảng đã gộp từ mergeMemberDirectories(), mỗi người có suPhuId/
// triKyId/kimLan dạng THÔ — xem googleSheets/chatGlobalSheet.js):
//   - suPhuName      : tên (ingame/nickname) của người có ID trùng suPhuId
//   - triKyName      : tên của người có ID trùng triKyId
//   - discipleNames  : tên của TẤT CẢ những người có suPhuId TRỎ NGƯỢC về
//                      chính discordId của người này (đệ tử của họ) — đây
//                      là lý do phải quét TOÀN BỘ directory, không thể làm
//                      lúc đọc từng dòng ở chatGlobalSheet.js.
//   - kimLanMembers  : tên của những người KHÁC (khác discordId) có cùng
//                      giá trị kimLan (so khớp không phân biệt hoa/thường/
//                      khoảng trắng thừa, giống logic setKimLan()).
// Dùng ID thô (KHÔNG dùng discipleIds) làm khoá so khớp để không phụ thuộc
// hoa/thường của tên; bỏ qua khi không tra được tên (vd sư phụ chưa từng
// /setprofile nên chưa có ingame/nickname nào).
function enrichMemberDirectoryWithRelationships(directory) {
  if (!Array.isArray(directory) || !directory.length) return directory;

  return directory.map((member) => {
    const suPhuName = findDisplayNameById(directory, member.suPhuId);
    const triKyName = findDisplayNameById(directory, member.triKyId);

    const discipleNames = member.discordId
      ? directory
          .filter((other) => other.suPhuId === member.discordId)
          .map((other) => other.ingame || other.nickname)
          .filter(Boolean)
      : [];

    const normalizedKimLan = member.kimLan ? member.kimLan.trim().toLowerCase() : null;
    const kimLanMembers = normalizedKimLan
      ? directory
          .filter(
            (other) =>
              other !== member &&
              other.kimLan &&
              other.kimLan.trim().toLowerCase() === normalizedKimLan
          )
          .map((other) => other.ingame || other.nickname)
          .filter(Boolean)
      : [];

    return { ...member, suPhuName, triKyName, discipleNames, kimLanMembers };
  });
}

// Gộp danh sách thành viên từ tab "Bang" ([{ discordId, ingame, className }])
// VỚI tab "ChatGlobal" ([{ discordId, ingame, className, nickname, suPhuId,
// triKyId, kimLan }]) thành 1 danh sách DUY NHẤT — mỗi người chỉ xuất hiện 1
// dòng, tránh liệt kê trùng (1 dòng/tab) với dữ liệu có thể xung đột (vd
// class khác nhau giữa 2 tab) khiến AI bị rối khi tra cứu
// (findMatchedMembersInText/buildMemberDirectoryBlock ở aiClient.js). Khớp
// theo discordId (ưu tiên), fallback theo tên ingame đã chuẩn hoá (chữ
// thường, trim) nếu thiếu discordId. Với mỗi field: ưu tiên giá trị từ
// "ChatGlobal" trước (nơi thành viên tự cập nhật qua /setprofile, thường mới
// hơn), thiếu thì lấy từ "Bang" bù vào — riêng nickname VÀ 3 field mối quan
// hệ (suPhuId/triKyId/kimLan) CHỈ có ở "ChatGlobal" (tab "Bang" không có các
// cột này).
//
// profileMembers (tab "Cập nhật phái" — nơi thành viên tự cập nhật bằng nút Hub
// "Cập Nhật Thông Tin", xem memberInfo/index.js) là NGUỒN MỚI NHẤT: ghi đè
// ingame/class của cả 2 tab trên (người chưa có ở đâu thì được thêm mới).
function mergeMemberDirectories(bangMembers, chatGlobalMembers, profileMembers) {
  const merged = new Map();

  const keyFor = (member) =>
    member.discordId || (member.ingame ? `ingame:${member.ingame.trim().toLowerCase()}` : null);

  for (const member of bangMembers || []) {
    const key = keyFor(member);
    if (!key) continue;

    merged.set(key, {
      discordId: member.discordId || null,
      ingame: member.ingame || null,
      className: member.className || null,
      nickname: null,
      suPhuId: null,
      triKyId: null,
      kimLan: null,
    });
  }

  for (const member of chatGlobalMembers || []) {
    const key = keyFor(member);
    if (!key) continue;

    const existing = merged.get(key);
    merged.set(key, {
      discordId: member.discordId || (existing && existing.discordId) || null,
      ingame: member.ingame || (existing && existing.ingame) || null,
      className: member.className || (existing && existing.className) || null,
      nickname: member.nickname || (existing && existing.nickname) || null,
      suPhuId: member.suPhuId || null,
      triKyId: member.triKyId || null,
      kimLan: member.kimLan || null,
    });
  }

  for (const member of profileMembers || []) {
    const key = keyFor(member);
    if (!key) continue;

    const existing = merged.get(key);
    merged.set(key, {
      discordId: member.discordId || (existing && existing.discordId) || null,
      ingame: member.ingame || (existing && existing.ingame) || null,
      className: member.className || (existing && existing.className) || null,
      nickname: (existing && existing.nickname) || null,
      suPhuId: (existing && existing.suPhuId) || null,
      triKyId: (existing && existing.triKyId) || null,
      kimLan: (existing && existing.kimLan) || null,
    });
  }

  return Array.from(merged.values());
}

// Tra "thông tin của CHÍNH người đang chat" (dùng để AI xưng hô đúng tên/
// class/biệt danh với họ) — ĐỌC GỘP CẢ 2 nguồn (tab "Bang" + tab
// "ChatGlobal", song song với getCombinedMemberDirectory() ở trên), ưu tiên
// giá trị từ "ChatGlobal" (mới hơn vì tự /setprofile), thiếu field nào thì
// lấy từ "Bang" bù vào. Nếu discordId khớp BOT_CREATOR_DISCORD_ID
// (config.js) thì gắn thêm cờ `isCreator: true` — aiClient.js dựa vào cờ
// này để biết đây là "Sếp" (người đã dạy/tạo ra bot) và đối xử đặc biệt
// kính trọng hơn, dù người đó có/không có trong sheet nào (isCreator vẫn
// được gắn kể cả khi info null, để không bỏ sót trường hợp Sếp chưa từng
// /setprofile hay chưa có trong tab "Bang").
async function getMemberInfoAnySource(discordId) {
  const [chatGlobalInfo, bangInfo, profileInfo] = await Promise.all([
    getChatGlobalMemberByDiscordId(discordId),
    getMemberInfoByDiscordId(discordId),
    getUpdateProfileInfoByDiscordId(discordId), // tab "Cập nhật phái" — mới nhất, ưu tiên cao nhất
  ]);

  // FIX (bug "Tín"): trước đây object này KHÔNG có discordId -> aiClient.js
  // không có cách nào tự tra lại đúng hồ sơ (kèm suPhuName/triKyName/kimLan...)
  // của CHÍNH người đang chat trong memberDirectory, nên khi câu hỏi là dạng
  // tự xưng ("tri kỷ tôi/tao/mình đâu" — không gõ tên ai cả) thì
  // findMatchedMembersInText() không khớp được ai, khối "THÔNG TIN CHÍNH XÁC"
  // bị bỏ trống, và AI phải tự đoán mò trong danh sách đầy đủ -> hay chốt
  // nhầm vào đúng 1 người cố định (vd "Tín") bất kể ai đang hỏi. Gắn thêm
  // discordId ở đây để askGemini() bù lại đúng hồ sơ của người hỏi.
  const info =
    chatGlobalInfo || bangInfo || profileInfo
      ? {
          discordId,
          ingame: (profileInfo && profileInfo.ingame) || (chatGlobalInfo && chatGlobalInfo.ingame) || (bangInfo && bangInfo.ingame) || null,
          className: (profileInfo && profileInfo.className) || (chatGlobalInfo && chatGlobalInfo.className) || (bangInfo && bangInfo.className) || null,
          nickname: (chatGlobalInfo && chatGlobalInfo.nickname) || null,
        }
      : null;

  if (discordId === BOT_CREATOR_DISCORD_ID) {
    return { ...(info || {}), isCreator: true };
  }

  // Đệ tử của Sếp trong game (danh sách ở config.js, Sếp sẽ bổ sung dần) —
  // chỉ gắn cờ để bot BIẾT, chưa cần đổi thái độ/cách nhắn nhiều ở hiện tại
  // (xem thêm ghi chú ở aiClient.js chỗ dùng cờ này).
  if (BOT_CREATOR_DISCIPLE_DISCORD_IDS.includes(discordId)) {
    return { ...(info || {}), isCreatorDisciple: true };
  }

  return info;
}

// Ghép tên DISCORD (username, global display name, nickname riêng trong
// server) của từng thành viên trong memberDirectory (lấy từ tab
// "ChatGlobal", xem googleSheets/chatGlobalSheet.js -> getAllChatGlobalMembers())
// vào field `discordNames` — để aiClient.js coi TÊN DISCORD và TÊN INGAME
// là 1 khi đối chiếu người được hỏi tới trong tin nhắn: người chat trong
// Discord thường gọi nhau bằng tên Discord (hoặc nickname trong server) chứ
// không phải lúc nào cũng nhớ/gõ đúng tên ingame, nên 2 loại tên này cần
// được coi là cùng 1 người thay vì chỉ dò được theo tên ingame như trước.
// Chỉ dùng cache sẵn có (guild.members.cache, nhờ intent GuildMembers) —
// KHÔNG gọi guild.members.fetch() cho từng người để tránh chậm/tốn rate
// limit; thành viên hiếm khi chưa có trong cache (vd vừa join) vẫn được
// giữ nguyên, chỉ là tạm thời chưa có thêm tên Discord để đối chiếu.
function enrichMemberDirectoryWithDiscordNames(memberDirectory, guild) {
  if (!guild || !Array.isArray(memberDirectory)) return memberDirectory;

  return memberDirectory.map((member) => {
    if (!member.discordId) return member;

    const guildMember = guild.members.cache.get(member.discordId);
    if (!guildMember) return member;

    const discordNames = [
      guildMember.user.username,
      guildMember.user.globalName,
      guildMember.nickname,
      guildMember.displayName,
    ].filter(Boolean);

    return { ...member, discordNames };
  });
}

// Thay từng <@ID> / <@!ID> (Discord tự chèn dạng này vào message.content khi
// ai đó gõ @TênNgườiDùng) bằng TÊN THẬT (ưu tiên ingame/nickname trong
// memberDirectory, không có thì fallback displayName/username Discord từ
// cache tin nhắn) — BẮT BUỘC phải làm bước này TRƯỚC khi đưa nội dung tin
// nhắn vào askGemini().
//
// BUG đã sửa: hỏi "@bot @UserB là ai?" thì bot trả lời nhầm UserB CHÍNH LÀ
// người đang hỏi. Nguyên nhân: message.content thật ra là `<@BOT_ID>
// <@USERB_ID> là ai?` — toàn ID số, không có chữ nào để đối chiếu. Trong khi
// đó askGemini() luôn nhét thông tin ingame của NGƯỜI ĐANG CHAT (memberInfo)
// lên ĐẦU prompt dưới dạng "Người bạn đang chat cùng có tên ingame X...".
// Vì phần còn lại của tin nhắn chỉ toàn ID vô nghĩa, AI không có cách nào
// phân biệt "X" (người hỏi) với người bị hỏi tới trong mention, nên lẫn
// luôn info của người hỏi vào câu trả lời cho UserB. Sau khi resolve ID
// thành tên thật (vd "@Ingame_B"), findMatchedMembersInText() ở aiClient.js
// mới dò được ĐÚNG UserB và nhét info CHÍNH XÁC của UserB (không phải người
// hỏi) vào prompt.
function resolveMentionsToNames(content, message, memberDirectory) {
  if (!content) return content;

  return content.replace(/<@!?(\d+)>/g, (match, userId) => {
    const directoryMember = Array.isArray(memberDirectory)
      ? memberDirectory.find((member) => member.discordId === userId)
      : null;

    if (directoryMember && (directoryMember.ingame || directoryMember.nickname)) {
      return `@${directoryMember.ingame || directoryMember.nickname}`;
    }

    // Không có trong memberDirectory (vd chưa từng /setprofile, hoặc chính
    // là bot) -> fallback tên Discord lấy từ cache mentions của tin nhắn
    // (không tốn thêm API call), còn hơn để nguyên 1 dãy ID vô nghĩa.
    const mentionedMember = message.mentions.members?.get(userId);
    const mentionedUser = message.mentions.users?.get(userId);
    const fallbackLabel =
      (mentionedMember && (mentionedMember.displayName || mentionedMember.user?.username)) ||
      (mentionedUser && (mentionedUser.globalName || mentionedUser.username));

    return fallbackLabel ? `@${fallbackLabel}` : match;
  });
}

module.exports = {
  getCombinedMemberDirectory,
  getMemberInfoAnySource,
  enrichMemberDirectoryWithDiscordNames,
  resolveMentionsToNames,
};
