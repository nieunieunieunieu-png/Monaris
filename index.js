process.env.FONTCONFIG_PATH = require('path').join(__dirname, 'assets', 'fonts');

// Cân bằng tốc độ và RAM (Railway tính tiền RAM theo mức dùng): cache libvips nhỏ (50 MB / 20 mục) để vẽ lại
// thẻ/bảng ảnh nhanh hơn, và 2 luồng cho mỗi lần vẽ (sharp + font CJK 19 MB). Nếu RAM tăng đều/chạm 90% trần thì
// quay lại sharp.cache(false) + sharp.concurrency(1).
{
  const sharp = require('sharp');
  sharp.cache({ memory: 50, items: 20 });
  sharp.concurrency(2);
}

// Chốt chặn cuối cho request bị treo hẳn (mất kết nối, máy chủ không trả lời). Đặt rất dài (5 phút) để KHÔNG cắt các
// việc cần nhiều thời gian như Gemini đọc ảnh, upload ảnh, Google Sheet/Drive chậm. Chỉ request chết thật mới bị hủy,
// tránh giữ buffer ảnh trong RAM mãi và kẹt hàng đợi (runQueued, flushChain).
{
  const FETCH_TIMEOUT_MS = 5 * 60 * 1000;
  const nativeFetch = globalThis.fetch;
  globalThis.fetch = (input, init) => {
    if (init && init.signal) return nativeFetch(input, init); // nơi nào đã tự đặt timeout thì giữ nguyên
    return nativeFetch(input, { ...(init || {}), signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  };
}
const { Events } = require('discord.js');
const http = require('http');

const client = require('./client');
// Các module của Monaris
require('./welcome');
require('./autoRole');
require('./character');
require('./mechBoss');
require('./bantime'); // Ban tam thoi va tu dong go ban

// Đăng nhập Discord
client.login(process.env.DISCORD_TOKEN);
const channelKnowledge = require('./services/channelKnowledge');
channelKnowledge.loadKnowledge();

client.on(Events.MessageCreate, (message) => {
  try { channelKnowledge.rememberMessage(message); }
  catch (error) { console.error('[ChannelKnowledge] Save failed:', error); }
});
client.on(Events.MessageDelete, (message) => {
  if (message.channelId === process.env.MONARIS_READ_CHANNEL_ID) {
    try { channelKnowledge.removeKnowledge(message.id); }
    catch (error) { console.error('[ChannelKnowledge] Delete failed:', error); }
  }
});
client.on(Events.MessageUpdate, (_oldMessage, newMessage) => {
  if (newMessage.channelId !== process.env.MONARIS_READ_CHANNEL_ID || newMessage.partial) return;
  try {
    channelKnowledge.removeKnowledge(newMessage.id);
    channelKnowledge.rememberMessage(newMessage);
  } catch (error) { console.error('[ChannelKnowledge] Update failed:', error); }
});

const { BANG_INTEGRATION_ENABLED } = require('./config/branding');
const { ensureCommunitySheets } = require('./googleSheets/communitySetup');
require('./features/gate'); // công tắt tính năng vui/giải trí: chặn slash/nút của tính năng đang tắt (features/gate.js)
const features = require('./features');
const { SPREADSHEET_ID, SHEET_NAME, RESULT_SHEET_NAME, BC_SHEET_NAME, AUTOVOTE_SHEET_NAME, DISCORD_GUILD_ID, ADMIN_USER_ID } = require('./config');

const { getGoogleAuthClient } = require('./googleSheets/auth');
const { retryOnQuotaExceeded } = require('./utils/retry');
const { ensureStateSheetExists, loadState } = require('./googleSheets/stateSheet');
const { ensureChatChannelAllowsSheetExists, loadChatChannelAllows } = require('./googleSheets/chatChannelAllowsSheet');
const { ensureNoticeBoardSheetExists, loadNoticeBoardNotices } = require('./googleSheets/noticeBoardSheet');
const { loadChatHistory } = require('./googleSheets/chatHistorySheet');
const { startMemoryWatcher } = require('./monitoring/memoryWatcher');
const { startHealthCheck, HEALTH_SLASH_COMMANDS } = require('./monitoring/healthCheck');
const { SLASH_COMMANDS } = require('./commands/help');
const { startTempVoice } = require('./tempVoice');
const { ensureNmImageSheetExists, NMIMAGE_SLASH_COMMANDS } = require('./nmImage');
const { ensureKnowledgeSheetExists, getKnowledgeEntries } = require('./googleSheets/knowledgeSheet');
const { ensureKnowledgeImageSheetExists } = require('./googleSheets/knowledgeImageSheet');
const { startDailyBackup } = require('./backup');
const { startKeywordFilter } = require('./keywordFilter');
const { startAntiSpam } = require('./antiSpam');
const { startLevel, LEVEL_SLASH_COMMANDS } = require('./level');
const { startCongDuc, CONG_DUC_SLASH_COMMANDS } = require('./congDuc');
const { HOSO_SLASH_COMMANDS, startManualAchievements } = require('./hoso');
const { SHOP_SLASH_COMMANDS, startShop } = require('./shop'); // cửa hàng khung hồ sơ (/shopkhung, /shopcap)
const { CUSTOM_ACHIEVEMENT_SLASH_COMMANDS, startCustomAchievements } = require('./hoso/customAchievement');
const { STATUS_SLASH_COMMANDS } = require('./monitoring/statusCommand');
const { logActivity } = require('./activityLog');
const { startMemberLog } = require('./activityLog/memberLog');
const { LOGSEARCH_SLASH_COMMANDS } = require('./activityLog/logSearch');
const { WHOTAGME_SLASH_COMMANDS } = require('./whoTagMe'); // /whotagme: ai đã tag/trả lời bạn trong 6 tiếng
const { setBotReady } = require('./utils/readyGate');

// Đăng ký các event handler theo từng tính năng (side-effect requires).
require('./activityLog'); // ghi log mọi hoạt động của bot (chỉ lắng nghe, không đổi luồng xử lý)
require('./activityLog/memberLog'); // ghi tin gửi/sửa/xoá của thành viên (chỉ lắng nghe)
require('./activityLog/memberEvents'); // voice/reaction/vào-rời/ban/role/kênh (chỉ lắng nghe)
require('./activityLog/logSearch'); // lệnh /logtim (Bông)
require('./keywordFilter'); // đăng ký TRƯỚC các handler khác để xoá tin nhạy cảm sớm nhất có thể
require('./antiSpam'); // chống spam tin giống nhau ở kênh ANTISPAM_CHANNEL_IDS: cảnh báo -> cấm chat -> ghi tab "Spam Chat"
require('./commands/messageCommands');
require('./commands/shutdown').installShutdownListener();
require('./commands/slashCommands');
require('./character'); // Pick Role + Character Profiles
require('./character');
require('./mechBoss');
require('./events/voiceEvents');
require('./tempVoice'); // phòng voice tạm: vào kênh cổng -> bot tạo phòng riêng + menu điều khiển
require('./events/voiceFollow');
require('./welcome'); // người MỚI vào server: tự gán role + gửi ảnh chào
const { initNoticeBoardState, checkNoticeBoard, checkScheduledAutoChat } = require('./AutoReply');
require('./level'); // hệ thống Level/EXP: đếm hoạt động, cộng EXP, ghi Google Sheet + /level /toplevel /expinfo

// Bắt lỗi 'error' trên client — nếu không có handler này, khi 1 Promise
// bị reject bên trong 1 listener (vd messageCreate) mà không có try/catch,
// discord.js chỉ in ra "đường đi" của lỗi (stack các hàm gọi nhau) chứ
// KHÔNG in rõ nguyên nhân thật sự. Có handler ở đây thì log tiếp theo sẽ
// hiện đúng message + stack của lỗi gốc, dễ debug hơn nhiều.
client.on('error', (error) => {
  console.error('❌ Discord client error:', error);
});

// Bắt luôn các Promise reject không ai catch trong toàn bộ tiến trình
// (phòng trường hợp lỗi không xuất phát từ client mà từ chỗ khác, vd
// Google Sheets API). Chỉ log ra, không thoát process — để bot không bị
// crash chỉ vì 1 tác vụ lẻ tẻ lỗi.
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled promise rejection:', reason);
});

// Lỗi ném đồng bộ trong listener/setInterval mà không ai catch sẽ làm Node thoát ngay
// -> Railway tự khởi động lại (trông như "tự redeploy"). Chỉ log, giữ tiến trình sống.
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
});
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
  channelKnowledge.syncHistory(readyClient).catch(error => console.error('[ChannelKnowledge] History sync failed:', error.message));

  // ===== KHỞI ĐỘNG CHIA 2 GIAI ĐOẠN — TRÁNH LỖI "Quota exceeded" =====
  // Google Sheets API (free tier) chỉ cho ~60 read request/phút/user. Trước
  // đây, MỌI bước ensure*/load* (15+ lượt gọi Sheets liên tiếp) chạy dồn
  // cục ngay khi vừa deploy, RẤT dễ dính lỗi 429 "Quota exceeded" — và vì
  // các bước này KHÔNG có try/catch, 1 lỗi ở bước bất kỳ làm dừng LUÔN toàn
  // bộ hàm ClientReady, khiến setBotReady(true) không bao giờ được gọi ->
  // bot kẹt "đang nạp thông tin" vĩnh viễn cho tới khi restart thủ công.
  //
  // Cách sửa: tách dữ liệu làm 2 nhóm.
  //   - GIAI ĐOẠN 1 (CẦN DÙNG NGAY): tối thiểu dữ liệu để bot bắt đầu trả
  //     lời lệnh + web (Monaris Admin) gọi admin API không bị lỗi (scrimData/
  //     bcData, quyền kênh chat, quyền truy cập, Bảng Tin, 2 bảng cố định
  //     Vinh Danh/Thí Kiếm, slash command). Chạy XONG mới setBotReady(true).
  //   - GIAI ĐOẠN 2 (KHÔNG CẦN DÙNG NGAY): dữ liệu "nice to have" hoặc chỉ
  //     phục vụ tính năng ít dùng ngay lúc mới deploy (lịch sử chat AI, Auto
  //     DM, Broadcast, Feedback, Vote/BC/Rank sheet ensure, đồng bộ
  //     RoleAutoVote...) — chạy NGẦM sau khi bot đã sẵn sàng, RẢI CÁCH NHAU
  //     vài giây/bước để không dồn cục request lên Sheets, và mỗi bước có
  //     retry + try/catch RIÊNG nên 1 bước lỗi không ảnh hưởng bước khác.
  //
  // Mọi lệnh gọi Sheets ở cả 2 giai đoạn đều bọc qua safeStep() bên dưới
  // (dùng lại retryOnQuotaExceeded() sẵn có ở utils/retry.js) để tự thử lại
  // khi dính đúng lỗi quota, và KHÔNG BAO GIỜ ném lỗi ra ngoài làm gãy chuỗi
  // khởi động — lỗi (kể cả sau khi đã thử lại hết số lần) chỉ được log lại.
  async function safeStep(label, fn) {
    try {
      return await retryOnQuotaExceeded(fn, { label });
    } catch (error) {
      console.error(`❌ [Khởi động] Bước "${label}" thất bại (đã thử lại vẫn lỗi):`, error.message);
      return null;
    }
  }
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  // Khoảng nghỉ giữa các bước ở Giai đoạn 2 — "từ từ chậm rãi" đúng nghĩa,
  // để KHÔNG cộng dồn thêm request vào đúng lúc Giai đoạn 1 vừa gọi xong.
  const DEFERRED_STEP_DELAY_MS = 4000;

  // ===== GIAI ĐOẠN 1: DỮ LIỆU CẦN DÙNG NGAY =====
  const authClient = await safeStep('getGoogleAuthClient', () => getGoogleAuthClient());
  if (authClient && SPREADSHEET_ID) {
    // Chỉ ensure những sheet mà các bước NGAY BÊN DƯỚI cần dùng liền (State,
    // ChatChannelAllows, NoticeBoard, Vinh Danh, Thí Kiếm) — sheet của các
    // tính năng Vote/BC/AutoVote/AutoDM/Broadcast/Feedback/BcStat/VoteHistory
    // để dành ensure ở Giai đoạn 2 (xem runDeferredStartup bên dưới), vì
    // hầu như không ai dùng ngay trong vài giây đầu sau khi vừa deploy.
    await safeStep('ensureCommunitySheets', () => ensureCommunitySheets(authClient));
    if (BANG_INTEGRATION_ENABLED) await safeStep('ensureStateSheetExists', () => ensureStateSheetExists(authClient));
    await safeStep('ensureChatChannelAllowsSheetExists', () => ensureChatChannelAllowsSheetExists(authClient));
    await safeStep('ensureNoticeBoardSheetExists', () => ensureNoticeBoardSheetExists(authClient));
    await safeStep('ensureNmImageSheetExists', () => ensureNmImageSheetExists());
  }

  // Khôi phục scrimData/bcData (lịch scrim, messageId đang active, ...) đã
  // lưu từ lần chạy trước — CẦN NGAY vì web (Monaris Admin) có thể gọi admin API
  // đọc 2 dữ liệu này bất cứ lúc nào sau khi bot vừa deploy lại.
  if (BANG_INTEGRATION_ENABLED) await safeStep('loadState', () => loadState());
  // scrimData/bcData do bot BANG ghi (BotState) — bot gốc chỉ ĐỌC lại định kỳ (AI chat biết lịch scrim, Level thưởng voice đúng giờ scrim, nhật ký). KHÔNG gọi saveState ở bot này.
  if (BANG_INTEGRATION_ENABLED) setInterval(() => { loadState().catch((e) => console.error('[state] Làm mới BotState lỗi:', e.message)); }, 5 * 60 * 1000);

  // Khôi phục danh sách kênh chat được phép/server (chatChannels) — cần
  // ngay cho mọi tin nhắn tới (AutoReply kiểm tra quyền kênh).
  await safeStep('loadChatChannelAllows', () => loadChatChannelAllows());

  // Công tắt bật/tắt tính năng vui/giải trí (chỉnh trên web Monaris Admin) — nạp sớm để lệnh đầu tiên đã theo đúng công tắt.
  await safeStep('loadFeatureFlags', () => features.load());
  if (!features.isLoaded()) features.retryLoadInBackground();

  // Khôi phục danh sách tin của "Bảng Tin Monaris" — PHẢI chạy trước
  // initNoticeBoardState() ở dưới.
  await safeStep('loadNoticeBoardNotices', () => loadNoticeBoardNotices());

  // MỖI LẦN DEPLOY: dọn sạch kênh Hub rồi đăng lại đúng 1 tin menu (Check Gear /
  // Đua Rank / Vinh Danh / Góp Ý — xem hub/index.js) — người dùng nhìn thấy NGAY
  // nên xếp vào Giai đoạn 1. Các kênh cũ (Thí Kiếm, Vinh Danh, Check Gear) không
  // còn tin cố định riêng; tin nút cũ của bot còn sót ở đó được xoá bên dưới.

  // KÊNH BẢNG XẾP HẠNG (THIKIEM_BOARD_CHANNEL_ID / VINHDANH_CHANNEL_ID trong config.js):
  // resetFixedBoardChannels() ở trên đã dọn sạch kênh này -> đăng lại "Sảnh Vinh Danh" rồi
  // "Bảng Xếp Hạng Thí Kiếm". Sau đó 2 tin này tự được EDIT mỗi khi có người cập nhật
  // điểm/Vinh Danh (xem refreshLeaderboardMessage / refreshVinhDanhBoard). Hai hàm tự
  // bỏ qua nếu chưa cấu hình kênh (hoặc kênh trùng Hub), và tự retry khi dính quota.


  // Kênh Hub chỉ nhận tin của người đang có phiên chờ gửi ảnh (xoá ngay tin khác — đã tự
  // chạy từ lúc nạp hub/messageGuard.js) + BẬT dọn định kỳ mỗi HUB_AUTO_CLEAR_MINUTES phút.

  let guild = null;
  try {
    // Chỉ đăng ký slash command (kể cả /setchatchannel, /removechatchannel,
    // /chatchannels mới thêm) cho ĐÚNG 1 server gốc (DISCORD_GUILD_ID) —
    // không đăng ký cho server khác. Các server khác vẫn dùng được đầy đủ
    // tính năng tương đương qua bản PREFIX COMMAND (mon!setchatchannel,
    // mon!removechatchannel, mon!chatchannels trong commands/messageCommands.js),
    // không cần chờ gì thêm.
    guild = await client.guilds.fetch(DISCORD_GUILD_ID);

const allSlashCommands = [
  ...require('./commands/registry').getSlashCommands()
];

// Đăng ký tính năng Báo Danh Phó Bản 12 Người.
const { PHOBAN12_SLASH_COMMANDS } = require('./phoban12');

// Tarot Reader của Monaris
const { TAROT_SLASH_COMMANDS } = require('./tarot');

for (const command of TAROT_SLASH_COMMANDS) {
  if (!allSlashCommands.some(
    item => item.name === command.name
  )) {
    allSlashCommands.push(command);
  }
}

for (const command of PHOBAN12_SLASH_COMMANDS) {
  if (!allSlashCommands.some(item => item.name === command.name)) {
    allSlashCommands.push(command);
  }
}
    // Discord chỉ cho TỐI ĐA 100 slash command/server; vượt là TOÀN BỘ lần đăng ký bị từ chối (lệnh mới không hiện). Xem docs/LENH_SLASH.md.
    if (allSlashCommands.length > 100) console.error(`[slash] ${allSlashCommands.length} lệnh > 100 — Discord sẽ từ chối, hãy gộp/bớt lệnh (docs/LENH_SLASH.md).`);
    else if (allSlashCommands.length > 95) console.warn(`[slash] ${allSlashCommands.length}/100 lệnh — sắp hết slot.`);
    await guild.commands.set(allSlashCommands);
    console.log(`Registered ${allSlashCommands.length} slash commands for guild ${DISCORD_GUILD_ID}.`);

    // Dọn RÁC global command còn sót lại từ lúc code cũ bị bug (HOME_GUILD_ID
    // undefined -> luôn rơi vào nhánh đăng ký global) — global command một
    // khi đã đăng ký sẽ TỒN TẠI VĨNH VIỄN cho tới khi bị xoá tường minh,
    // không tự biến mất chỉ vì code ngừng gọi nữa. Thiếu bước này Discord sẽ
    // hiện SONG SONG cả bộ global cũ lẫn bộ guild mới -> lệnh bị double y hệt
    // đã thấy. set([]) rỗng = xoá sạch toàn bộ global command hiện có. An
    // toàn để gọi lại mỗi lần khởi động (nếu không còn global command nào
    // thì không có gì để xoá, không ảnh hưởng gì).
    await client.application.commands.set([]);
    console.log('Đã dọn sạch global slash commands cũ (nếu có).');

    // Lệnh dùng chung cho MỌI server bot được mời vào (vd mon!setchatchannel)
    // được cài đặt dưới dạng PREFIX COMMAND (commands/messageCommands.js),
    // KHÔNG phải slash command global — có tác dụng ngay lập tức ở mọi
    // server, không cần đợi Discord đồng bộ global (~1 tiếng) và không cần
    // đăng ký gì thêm ở đây.
  } catch (error) {
    console.error('Failed to register slash commands:', error.message);
  }

  console.log('Started reminder scheduler (checks every minute).');

  // Bảng Tin Monaris: init thời điểm tin nhắn cuối cùng trong kênh theo
  // dõi + khôi phục thời điểm đăng tin gần nhất, rồi check mỗi phút xem đã
  // đủ điều kiện đăng tin tiếp theo chưa (im lặng 30 phút HOẶC đã quá 1
  // tiếng 30 phút kể từ tin gần nhất — trừ khung giờ yên lặng 1h-7h sáng,
  // xem AutoReply/index.js). Thay thế hoàn toàn idle chat checker cũ.
  await safeStep('initNoticeBoardState', () => initNoticeBoardState());
  setInterval(checkNoticeBoard, 60 * 1000);
  console.log('Started notice board checker (checks every minute).');

  // Auto chat theo giờ cố định: chào buổi sáng (AI, 7h) + nhắc PvP mở cửa
  // (10h) + nhắc Cao điểm PvP (20h) — cùng kênh với idle chat.
  setInterval(checkScheduledAutoChat, 60 * 1000);
  console.log('Started scheduled auto-chat checker (checks every minute).');

  // Auto chat "Cập nhật tình hình vote" — check mỗi phút, gửi vào các mốc
  // giờ cố định (8h, 11h, 14h... xem AutoReply/index.js), không còn phụ
  // thuộc "đã trôi qua bao lâu" nên chịu được restart giữa chừng.
  console.log('Started vote status auto-chat checker (checks every minute).');

  // Theo dõi RAM tiến trình, DM admin khi vượt 25/50/75/90% MEMORY_LIMIT_MB
  // (config.js) — xem monitoring/memoryWatcher.js để đổi ngưỡng/tần suất.
  startMemoryWatcher();

  // Kiểm tra sức khỏe tự động mỗi ngày (Sheet/Cloudinary/Gemini) -> kênh admin, xem monitoring/healthCheck.js.
  startHealthCheck();

  // ĐÁNH DẤU BOT ĐÃ SẴN SÀNG NGAY SAU GIAI ĐOẠN 1 — không đợi Giai đoạn 2
  // (dữ liệu phụ) nữa. Từ thời điểm này, mọi entry point (lệnh mon!...,
  // slash command, nút bấm, modal, auto chat...) đã xử lý bình thường thay
  // vì trả lời "Bot đang nạp thông tin, vui lòng thử lại sau." — xem
  // utils/readyGate.js.
  setBotReady(true);
  logActivity('✅ Giai đoạn 1 xong — bot đã sẵn sàng nhận lệnh (đang nạp dữ liệu phụ ở nền)');
  console.log('✅ Bot đã nạp xong dữ liệu cần dùng ngay (Giai đoạn 1), sẵn sàng phản hồi người dùng.');

  // Báo admin (DM) ngay khi Giai đoạn 1 xong — để biết bot đã lên lại và
  // sẵn sàng phản hồi mà không cần tự mở log Railway lên kiểm tra. Lỗi gửi DM
  // (admin chặn DM, chưa từng chat với bot lần nào...) chỉ log ra console,
  // không làm crash tiến trình khởi động.
  if (ADMIN_USER_ID) {
    try {
      const admin = await client.users.fetch(ADMIN_USER_ID);
      await admin.send(
        '✅ Bot vừa deploy lại xong, các tính năng chính đã sẵn sàng hoạt động. Đang tiếp tục nạp thêm dữ liệu phụ (lịch sử chat AI, Auto DM, Broadcast, Feedback...) ở nền, rải cách nhau vài giây để tránh lỗi quota Google Sheets — sẽ không ảnh hưởng gì tới hoạt động hiện tại.'
      );
    } catch (error) {
      console.error('Không gửi được DM báo admin bot đã sẵn sàng sau deploy:', error.message);
    }
  }

  // ===== GIAI ĐOẠN 2: DỮ LIỆU KHÔNG CẦN DÙNG NGAY (chạy NGẦM) =====
  // Cố ý KHÔNG await ở đây — để không chặn ClientReady/setBotReady(true) ở
  // trên. Chạy tuần tự, CÁCH NHAU DEFERRED_STEP_DELAY_MS giữa mỗi bước, mỗi
  // bước tự retry + tự bắt lỗi riêng (safeStep) nên 1 bước lỗi không ảnh
  // hưởng các bước còn lại hay các lệnh đã chạy được từ Giai đoạn 1.
  (async function runDeferredStartup() {
    const failedSteps = [];
    async function deferredStep(label, fn) {
      await wait(DEFERRED_STEP_DELAY_MS);
      const result = await safeStep(label, fn);
      if (result === null) failedSteps.push(label);
      return result;
    }

    if (authClient && SPREADSHEET_ID) {
      // Sheet của Vote/BC/AutoVote — hiếm khi cần trong vài giây đầu sau
      // deploy (chỉ cần trước khi có ai chạy lệnh !vote/!bc thật sự).
      // Bộ lọc từ khoá nhạy cảm: nạp sớm nhất có thể trong Giai đoạn 2 (trước đó bot dùng
      // tạm danh sách mặc định trong keywordFilter/index.js).
      await deferredStep('startKeywordFilter', () => startKeywordFilter(authClient));
      await deferredStep('startAntiSpam', () => startAntiSpam(authClient));
      await deferredStep('startTempVoice', () => startTempVoice());
      // Level/EXP: tạo tab Level + Cấu Hình EXP + Bảng Cấp Độ, nạp dữ liệu rồi bật vòng ghi Sheet theo lô.
      await deferredStep('startLevel', () => startLevel());
      // Farm Công Đức: nạp tab "Công Đức", bật tích voice (phòng bot treo) + tiếng Cốc Cốc. Phải SAU startLevel (Đốt hương cần Level đã nạp).
      await deferredStep('startCongDuc', () => startCongDuc());
      // Pick Role bằng react (hệ phái + hoạt động): nạp tab "Pick Role", đăng/đồng bộ 2 tin trong PICK_ROLE_CHANNEL_ID.
      // Role team (xếp đội hình): tạo tab "Team Role" + kiểm tra 5 role (tên/quyền) và chỉ log cảnh báo, không tự sửa.
      // Cửa hàng khung hồ sơ: tạo tab "Shop Khung" + nạp khung đã sở hữu (khung shop_* chỉ chọn được khi đã mua, xem hoso/frame/levelRules.js).
      await deferredStep('startShop', () => startShop());
      // Thành Tựu Đặt Tay (chọn từ danh sách có sẵn qua /profile): tạo tab "Thành Tựu Đặt Tay" + nạp cache RAM.
      await deferredStep('startManualAchievements', () => startManualAchievements());
      // Thành Tựu Riêng (/themthanhtuu, /suathanhtuu, /xoathanhtuu, /dsthanhtuu): gõ tự do, chỉ 1 người được dùng lệnh.
      await deferredStep('startCustomAchievements', () => startCustomAchievements());
      // Nhật ký thành viên: tạo tab "Nhật Ký Tin Nhắn", nạp lại bản chụp tin sau restart, bật ghi Sheet theo lô.
      await deferredStep('startMemberLog', () => startMemberLog());

      // Auto DM: PHẢI ensure + load XONG trước khi bật interval check bên
      // dưới, để có đủ dữ liệu cho lần check đầu tiên — nhưng bật CHẬM hơn
      // vài giây so với trước hoàn toàn không sao vì interval vẫn còn chạy
      // đủ 60s/lần như cũ.
      console.log('Started Auto DM scheduler (checks every minute).');

      // Broadcast: tương tự Auto DM — ensure + load lịch trước khi bật
      // interval check.
      console.log('Started Broadcast scheduler (checks every minute).');

      // Lịch sử broadcast "Gửi ngay" — chỉ để trang web hiển thị lại/"Dùng
      // lại", không ảnh hưởng interval nào nên không cần vội.

      // Lịch Bang tuỳ chỉnh (sự kiện admin tạo trên web) — chỉ để hiển thị /lich và trang web.

      // Hòm Thư Góp Ý: ensure + load xong mới bật interval dọn dẹp mỗi giờ
      // (hạn 2 tuần, sai lệch vài chục giây lúc khởi động không đáng kể).
      console.log('Started Hòm Thư Góp Ý cleanup scheduler (checks every hour).');

      // Nhật Ký Cập Nhật Đua Rank Thí Kiếm (tin "ai đã cập nhật rank" ở kênh
      // Bảng Xếp Hạng) — tự xoá sạch mỗi 30 phút thay vì giữ mãi các dòng cũ.
    }

    // Khôi phục lịch sử chat AI (tối đa 100 tin gần nhất) — chỉ để AI nhớ
    // ngữ cảnh trò chuyện trước lúc restart, bot vẫn trả lời bình thường dù
    // bước này chưa xong (chỉ tạm "quên" ngữ cảnh cũ vài phút đầu).
    await deferredStep('loadChatHistory', () => loadChatHistory());

    // Kho kiến thức game cho AI: tạo tab "Kiến thức bang" (kèm 1 dòng ví dụ đang Tắt) nếu chưa có rồi nạp sẵn
    // vào cache — AI trả lời kiến thức game CHỈ theo kho này (xem AutoReply/knowledgeBlock.js).
    if (authClient) {
      await deferredStep('ensureKnowledgeSheetExists', () => ensureKnowledgeSheetExists());
      await deferredStep('ensureKnowledgeImageSheetExists', () => ensureKnowledgeImageSheetExists());
      await deferredStep('loadKnowledgeEntries', async () => {
        await getKnowledgeEntries({ force: true });
      });
    }

    // Sao lưu Google Sheet sang Drive hằng ngày (cần ENV BACKUP_DRIVE_FOLDER_ID, xem config/backup.js).
    await deferredStep('startDailyBackup', () => startDailyBackup());

    // Refresh sheet log/backup RoleAutoVote từ role thực tế trên Discord —
    // có thể gọi nhiều request nếu server đông thành viên, không urgent.

    // Đồng bộ lại BotVote từ react thực tế trên tin vote đang mở: lúc bot tắt/
    // restart/deploy, ai react hoặc gỡ react đều KHÔNG được ghi nhận (event chỉ
    // bắn khi bot đang chạy) nên sheet bị lệch. Chạy 1 lần lúc khởi động để tự
    // khớp lại, giống bấm nút "Đồng bộ vote" — vote tay thắng auto như mọi nơi.

    // Quét lại toàn bộ lịch sử kênh Highlight (2 light) — có thể phải gọi
    // Discord API nhiều lần nếu kênh có nhiều tin cũ, nên để cuối Giai đoạn
    // 2. Tự bỏ qua tin đã ghi nhận rồi (chống trùng), an toàn khi restart.

    if (failedSteps.length) {
      console.warn(`⚠️ Giai đoạn 2: ${failedSteps.length} bước lỗi sau khi đã thử lại: ${failedSteps.join(', ')}. Dữ liệu liên quan sẽ được nạp lại ở lần deploy sau, không ảnh hưởng dữ liệu Giai đoạn 1.`);
    } else {
      console.log('✅ Bot đã nạp xong toàn bộ dữ liệu phụ (Giai đoạn 2).');
      logActivity('✅ Giai đoạn 2 xong — đã nạp đủ dữ liệu phụ');
    }
  })().catch((error) => {
    console.error('❌ Lỗi không mong muốn trong luồng nạp dữ liệu nền (Giai đoạn 2):', error);
  });
});

const token = process.env.DISCORD_TOKEN;

if (!token) {
  console.error('❌ ERROR: DISCORD_TOKEN is not set. Please set the DISCORD_TOKEN environment variable.');
  process.exit(1);
}

// Start HTTP server (Railway healthcheck tuỳ chọn) + API quản trị cho trang web
// (Monaris Admin) — xem admin/api.js. Vẫn CHỈ 1 http.createServer duy nhất như cũ,
// chỉ thêm nhánh rẽ theo pathname.
const { handleAdminRequest } = require('./admin/api');
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  const pathname = (req.url || '/').split('?')[0];

  if (req.method === 'GET' && (pathname === '/control' || pathname === '/control/')) {
    const fs = require('fs');
    const path = require('path');
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
    });
    res.end(fs.readFileSync(path.join(__dirname, 'admin/control/index.html')));
    return;
  }

  if (pathname.startsWith('/admin/')) {
    // CORS: cho phép trang Monaris Admin (chạy ở domain khác) gọi được route này
    // bằng fetch(). Token trong header Authorization mới là lớp bảo mật
    // thật sự — CORS chỉ để trình duyệt không tự chặn request trước khi tới
    // được đây.
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    handleAdminRequest(req, res, pathname);
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ bot: 'Monaris', status: 'running', ready: require('./utils/readyGate').isBotReady() }));
}).listen(PORT, () => {
  console.log(`✅ HTTP server listening on port ${PORT}`);
});

// Railway mặc định không tự "ngủ" nên không cần tự ping giữ sống.

client.login(token).catch(() => {
  console.error('[Monaris] Đăng nhập Discord thất bại. Kiểm tra token và Gateway Intents.');
  process.exit(1);
});
