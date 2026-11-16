// ===== config/level.js — Hệ thống Level / EXP (kiểu level trong chat Discord) =====
// Mỗi hoạt động của thành viên (chat, đăng bài thảo luận, gửi ảnh, ...) được cộng EXP và
// cộng 1 vào cột đếm tương ứng trong Google Sheet — xem level/index.js. Đủ EXP thì lên cấp.
//
// Sheet (LEVEL_SPREADSHEET_ID) có 3 tab, bot tự tạo + điền sẵn nếu chưa có:
//   - "Level"        : 1 dòng / 1 thành viên — EXP, Cấp, số lần từng hành vi (bot tự ghi, đừng sửa tay
//                      trừ khi cần chỉnh EXP cho ai đó — sửa cột EXP là bot tự tính lại Cấp).
//   - "Cấu Hình EXP" : bảng EXP + cooldown từng hoạt động — SỬA TAY được, bot nạp lại mỗi 10 phút,
//                      không cần deploy lại.
//   - "Bảng Cấp Độ"  : EXP cần để lên từng cấp — SỬA TAY được (cột B), bot nạp lại mỗi 10 phút.
//   - "Role Cấp Độ"  : mốc cấp -> Role ID Discord (cột A Cấp, B Role ID) — đạt mốc là bot tự gắn role. SỬA TAY được.
//   (tab "Level" có 2 cột cuối "EXP Tuần" + "Tuần" do bot tự ghi — EXP tuần reset 00:00 Thứ Hai giờ VN, đừng sửa tay.)
//
// Cooldown: mỗi người chỉ được cộng EXP của 1 nhóm hoạt động mỗi N giây (chống spam/farm EXP).
// Số lần hành vi (cột đếm) vẫn +1 MỖI LẦN, kể cả khi đang cooldown — để biết ai hoạt động sôi nổi.
const { LIBRARY_CHANNEL_ID, HUB_CHANNEL_ID } = require('./hub');
const { CHECK_GEAR_POST_CHANNEL_ID, CHECK_GEAR_CHANNEL_ID } = require('./checkGear');
const { THIKIEM_BOARD_CHANNEL_ID } = require('./thiKiemVinhDanh');
const { ACTIVITY_LOG_CHANNEL_ID, MEMBER_LOG_ALL_CHANNEL_IDS } = require('./activityLog');
const { KEYWORD_FILTER_LOG_CHANNEL_ID } = require('./keywordFilter');

const LEVEL_SPREADSHEET_ID = process.env.LEVEL_SPREADSHEET_ID || process.env.GOOGLE_SHEET_ID || '';
const LEVEL_SHEET_NAME = process.env.LEVEL_SHEET_NAME || 'Level';
const LEVEL_CONFIG_SHEET_NAME = 'Cấu Hình EXP';
const LEVEL_TABLE_SHEET_NAME = 'Bảng Cấp Độ';
const LEVEL_ROLE_SHEET_NAME = 'Role Cấp Độ';
// Sổ điểm đổi event (googleSheets/eventPointSheet.js): điểm còn lại = Điểm HĐ (cột cuối tab Level, tích 1-1 với EXP kiếm được) − tổng điểm đã dùng; EXP/Cấp của bot KHÔNG bị trừ.
const LEVEL_EVENT_POINTS_SHEET_NAME = process.env.LEVEL_EVENT_POINTS_SHEET_NAME || 'Điểm Hoạt Động';
const LEVEL_EVENT_POINTS_LEGACY_NAME = 'Điểm Event'; // tên cũ: nếu còn thì bot tự đổi tên tab (giữ nguyên dữ liệu)
const LEVEL_EVENT_LOG_SHEET_NAME = process.env.LEVEL_EVENT_LOG_SHEET_NAME || 'Lịch Sử Dùng Điểm';

// Bật/tắt cả hệ thống: LEVEL_ENABLED=false
const LEVEL_ENABLED = !/^(0|false|off|no)$/i.test(String(process.env.LEVEL_ENABLED || 'true').trim());

// Cấp tối đa (EXP vẫn cộng tiếp sau khi chạm trần, chỉ không lên cấp nữa).
const LEVEL_MAX_LEVEL = Number(process.env.LEVEL_MAX_LEVEL) || 100;

// ROLE THEO MỐC CẤP (tab "Role Cấp Độ"): đạt cấp nào thì gắn role của mốc cao nhất đã đạt.
//   LEVEL_ROLE_STACK=true  : giữ luôn các role mốc thấp hơn (cộng dồn). Mặc định false: chỉ giữ role mốc cao nhất, gỡ role mốc thấp.
//   LEVEL_ROLE_SYNC_DELAY_MS : nghỉ giữa mỗi người khi /levelsync (tránh dính rate limit của Discord).
//   LEVEL_ROLE_SYNC_ON_START=true : tự đồng bộ role cho mọi thành viên mỗi lần bot khởi động (mặc định tắt, dùng /levelsync).
const LEVEL_ROLE_STACK = /^(1|true|on|yes)$/i.test(String(process.env.LEVEL_ROLE_STACK || '').trim());
const LEVEL_ROLE_SYNC_DELAY_MS = Number(process.env.LEVEL_ROLE_SYNC_DELAY_MS) || 300;
const LEVEL_ROLE_SYNC_ON_START = /^(1|true|on|yes)$/i.test(String(process.env.LEVEL_ROLE_SYNC_ON_START || '').trim());

// THẺ LEVEL BẰNG ẢNH (/level) + BXH TUẦN:
//   LEVEL_CARD_ENABLED=false           : tắt thẻ ảnh, /level quay về embed cũ (mặc định bật; vẽ lỗi cũng tự quay về embed).
//   LEVEL_CARD_AVATAR_TIMEOUT_MS       : thời gian tối đa chờ tải avatar (mặc định 4000).
//   LEVEL_WEEKLY_POST_ENABLED=false    : tắt việc đăng "Top EXP tuần" (mặc định bật; cần LEVEL_ANNOUNCE_CHANNEL_ID).
//   LEVEL_WEEKLY_POST_HOUR             : giờ VN (0-23) của Chủ Nhật để đăng bảng tuần (mặc định 21 = 21:00). Tuần reset 00:00 Thứ Hai giờ VN.
//   LEVEL_WEEKLY_TOP_SIZE              : số người trong bảng tuần (mặc định 10, tối đa 25).
const LEVEL_CARD_ENABLED = !/^(0|false|off|no)$/i.test(String(process.env.LEVEL_CARD_ENABLED || 'true').trim());
const LEVEL_CARD_AVATAR_TIMEOUT_MS = Number(process.env.LEVEL_CARD_AVATAR_TIMEOUT_MS) || 4000;
const LEVEL_WEEKLY_POST_ENABLED = !/^(0|false|off|no)$/i.test(String(process.env.LEVEL_WEEKLY_POST_ENABLED || 'true').trim());
const LEVEL_WEEKLY_POST_HOUR = Number.isInteger(Number(process.env.LEVEL_WEEKLY_POST_HOUR)) && process.env.LEVEL_WEEKLY_POST_HOUR !== '' && Number(process.env.LEVEL_WEEKLY_POST_HOUR) >= 0 && Number(process.env.LEVEL_WEEKLY_POST_HOUR) <= 23 ? Number(process.env.LEVEL_WEEKLY_POST_HOUR) : 21;
const LEVEL_WEEKLY_TOP_SIZE = Math.min(25, Math.max(3, Number(process.env.LEVEL_WEEKLY_TOP_SIZE) || 10));

// Gom EXP trong bộ nhớ rồi mới ghi Sheet theo lô mỗi N giây (Google Sheets chỉ ~60 request/phút).
const LEVEL_FLUSH_SECONDS = Number(process.env.LEVEL_FLUSH_SECONDS) || 30;
// Nạp lại "Cấu Hình EXP" + "Bảng Cấp Độ" từ Sheet mỗi N phút (để sửa tay trên sheet có hiệu lực).
const LEVEL_CONFIG_REFRESH_MINUTES = Number(process.env.LEVEL_CONFIG_REFRESH_MINUTES) || 10;

// Kênh thông báo "lên cấp". Để trống = thông báo ngay tại kênh người đó vừa hoạt động
// (hoạt động không có kênh như voice thì không thông báo).
const LEVEL_ANNOUNCE_CHANNEL_ID = process.env.LEVEL_ANNOUNCE_CHANNEL_ID || '';

// THÔNG BÁO LÊN CẤP (level/index.js):
//   LEVEL_NOTICE_TTL_MS=10000          : tin lên cấp/chuỗi ngày thường tự xoá sau N ms (0 = không xoá). Tag hiện @tên nhưng KHÔNG ping.
//   LEVEL_MILESTONE_CHANNEL_ID         : kênh đăng tin nhận role mốc lớn (tin này KHÔNG bị xoá, vẫn không ping). Trống = dùng LEVEL_ANNOUNCE_CHANNEL_ID / kênh hoạt động.
//   LEVEL_NOTICE_BATCH_MS=2500         : gom các thông báo cùng kênh trong N ms thành 1 tin (tránh rate limit khi nhiều người lên cấp cùng lúc).
const LEVEL_NOTICE_TTL_MS = process.env.LEVEL_NOTICE_TTL_MS === undefined || process.env.LEVEL_NOTICE_TTL_MS === '' ? 10 * 1000 : Math.max(0, Number(process.env.LEVEL_NOTICE_TTL_MS) || 0);
const LEVEL_MILESTONE_CHANNEL_ID = process.env.LEVEL_MILESTONE_CHANNEL_ID || '';
const LEVEL_NOTICE_BATCH_MS = Math.max(0, Number(process.env.LEVEL_NOTICE_BATCH_MS) || 2500);

// ROLE TOP TUẦN + TOP THÁNG (level/topRole.js) — phần THƯỞNG CÓ HẠN: tới tuần/tháng mới mới tính top của tuần/tháng vừa rồi, gắn role giữ suốt cả tuần/tháng mới,
// hết hạn (tuần/tháng kế) thì gỡ và cấp lại cho top mới.
//   TOP TUẦN  : top N EXP của TUẦN VỪA KẾT THÚC (tuần chạy 00:00 Thứ Hai -> hết Chủ Nhật, giờ VN; chốt từ tab "Mốc Tuần") giữ role cả tuần mới.
//     LEVEL_TOP_ROLE_ID    : ID role (mặc định role đã cấu hình; đặt rỗng/"off" để tắt)
//     LEVEL_TOP_ROLE_COUNT : số người (mặc định 10)
//   TOP THÁNG : top N EXP của THÁNG VỪA KẾT THÚC (chốt ngày 1 từ tab "Mốc Tháng") giữ role cả tháng mới. Thiếu dữ liệu tháng -> bù từ top tuần.
//     LEVEL_MONTH_ROLE_ID    : ID role (mặc định role đã cấu hình; đặt rỗng/"off" để tắt)
//     LEVEL_MONTH_ROLE_COUNT : số người (mặc định 5)
//   ƯU TIÊN THÁNG: ai có role tháng thì KHÔNG nhận role tuần (bảng tuần lấy người kế tiếp cho đủ N).
const LEVEL_WEEK_SHEET_NAME = 'Mốc Tuần';
const offOrId = (raw, def) => (/^(off|0|false)$/i.test(String(raw || '').trim()) ? '' : String(raw || def).trim());
const LEVEL_TOP_ROLE_ID = offOrId(process.env.LEVEL_TOP_ROLE_ID, '');
const LEVEL_TOP_ROLE_COUNT = Math.max(1, Math.floor(Number(process.env.LEVEL_TOP_ROLE_COUNT)) || 10);
const LEVEL_MONTH_ROLE_ID = offOrId(process.env.LEVEL_MONTH_ROLE_ID, '');
const LEVEL_MONTH_ROLE_COUNT = Math.max(1, Math.floor(Number(process.env.LEVEL_MONTH_ROLE_COUNT)) || 5);

const splitIds = (raw) => String(raw || '').split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);

// KÊNH THẢO LUẬN: chat trong các kênh này (và trong mọi thread/bài viết bên trong) tính "Chat Thảo
// Luận" (+2) thay vì "Chat" (+1). Mặc định: Forum Thư Viện Hệ Phái + kênh bài Check Gear.
// Thêm kênh khác qua ENV LEVEL_DISCUSSION_CHANNEL_IDS (nhiều ID cách nhau bằng dấu phẩy).
const LEVEL_DISCUSSION_CHANNEL_IDS = new Set(
  [LIBRARY_CHANNEL_ID, CHECK_GEAR_POST_CHANNEL_ID, ...splitIds(process.env.LEVEL_DISCUSSION_CHANNEL_IDS)].filter(Boolean)
);

// FORUM ĐĂNG BÀI THẢO LUẬN: mỗi bài (thread) mới do thành viên tạo trong các Forum này = +10 EXP.
// Mặc định: Forum Thư Viện Hệ Phái. Thêm qua ENV LEVEL_POST_CHANNEL_IDS.
const LEVEL_POST_CHANNEL_IDS = new Set([LIBRARY_CHANNEL_ID, ...splitIds(process.env.LEVEL_POST_CHANNEL_IDS)].filter(Boolean));

// Người bị LOẠI khỏi mọi bảng xếp hạng + role Top (vd admin): /toplevel (tổng + tuần), bài Top EXP tuần, /topstreak, báo cáo tháng,
// role Top tuần/tháng, hạng (#) trên /level và /hoso. Vẫn nhận EXP và dùng lệnh bình thường. Mặc định = ADMIN_USER_ID (config/core.js); muốn loại thêm người khác: ENV LEVEL_TOP_EXCLUDED_IDS (Discord ID, cách nhau dấu phẩy).
const LEVEL_TOP_EXCLUDED_IDS = new Set([require('./core').ADMIN_USER_ID, ...splitIds(process.env.LEVEL_TOP_EXCLUDED_IDS)].filter(Boolean));

// Kênh KHÔNG tính EXP (kênh bot tự dọn tin / kênh upload ảnh / log). Thêm qua ENV LEVEL_EXCLUDED_CHANNEL_IDS.
const LEVEL_EXCLUDED_CHANNEL_IDS = new Set(
  [
    HUB_CHANNEL_ID,
    THIKIEM_BOARD_CHANNEL_ID,
    CHECK_GEAR_CHANNEL_ID,
    ACTIVITY_LOG_CHANNEL_ID,
    KEYWORD_FILTER_LOG_CHANNEL_ID,
    ...MEMBER_LOG_ALL_CHANNEL_IDS, // các kênh nhật ký thành viên / cảnh báo
    ...splitIds(process.env.LEVEL_EXCLUDED_CHANNEL_IDS),
  ].filter(Boolean)
);

// Voice: EXP tính theo TỪNG PHÚT (bot quét mỗi 60 giây), mức EXP gốc = EXP của mã "voice" (tab Cấu Hình EXP)
// cho mỗi LEVEL_VOICE_BLOCK_MINUTES phút. Quy tắc theo số người THẬT (không tính bot) trong cùng kênh voice:
//   - Ngồi 1 mình: 0 EXP · người đang selfDeaf/serverDeaf: 0 EXP · kênh AFK không tính.
//   - Từ 2 người: hệ số x1; mỗi người thêm (từ người thứ 3) cộng thêm LEVEL_VOICE_EXTRA_PER_PERSON (mặc định 0.15),
//     tối đa LEVEL_VOICE_MAX_MULTIPLIER (mặc định x3).  Hệ số = 1 + (số người - 2) * EXTRA, bị chặn ở MAX.
//   - Trần theo ngày (giờ VN): EXP GỐC (x1) chỉ tính tối đa LEVEL_VOICE_DAILY_MAX_MINUTES phút/ngày (mặc định 600 = 10 giờ, chống treo máy).
//     PHẦN EXP THÊM nhờ ngồi từ 3 người trở lên (hệ số - 1) KHÔNG bị trần ngày này chặn.
// Cột đếm "Voice (phút)" vẫn +1 mỗi phút ngồi voice (kể cả ngồi 1 mình) — chỉ EXP mới bị chặn.
const LEVEL_VOICE_BLOCK_MINUTES = Number(process.env.LEVEL_VOICE_BLOCK_MINUTES) || 10;
const LEVEL_VOICE_EXTRA_PER_PERSON = Number.isFinite(Number(process.env.LEVEL_VOICE_EXTRA_PER_PERSON)) && String(process.env.LEVEL_VOICE_EXTRA_PER_PERSON || '').trim() !== ''
  ? Math.max(0, Number(process.env.LEVEL_VOICE_EXTRA_PER_PERSON))
  : 0.15;
const LEVEL_VOICE_MAX_MULTIPLIER = Math.max(1, Number(process.env.LEVEL_VOICE_MAX_MULTIPLIER) || 3);
const LEVEL_VOICE_DAILY_MAX_MINUTES = Number(process.env.LEVEL_VOICE_DAILY_MAX_MINUTES) || 600;

// Chống spam chat: tin quá ngắn / trùng tin trước đó (cùng người, trong LEVEL_DUPLICATE_WINDOW_SECONDS) vẫn được
// đếm vào cột nhưng KHÔNG được EXP và KHÔNG ăn cooldown. Tin chỉ có ảnh/sticker không bị xét độ dài.
const LEVEL_MIN_CHAT_LENGTH = Number.isFinite(Number(process.env.LEVEL_MIN_CHAT_LENGTH)) && String(process.env.LEVEL_MIN_CHAT_LENGTH || '').trim() !== '' ? Number(process.env.LEVEL_MIN_CHAT_LENGTH) : 4;
const LEVEL_DUPLICATE_WINDOW_SECONDS = Number(process.env.LEVEL_DUPLICATE_WINDOW_SECONDS) || 300;

// CHỐNG FARM EXP (level/antiFarm.js) — bổ sung cho cooldown / lọc tin ngắn / trùng tin ở trên. Phần bị chặn vẫn được ĐẾM vào cột, chỉ không có EXP:
//   LEVEL_ANTIFARM_ENABLED=false       : tắt toàn bộ.
//   LEVEL_ANTIFARM_CHAT_PER_HOUR       : tối đa N tin / giờ / người được xét EXP, từ tin thứ N+1 trở đi trong giờ đó không có EXP (mặc định 300).
//                                        Chat trong KÊNH THẢO LUẬN không bị trần giờ này (vẫn bị lọc tin lặp / trùng).
//   LEVEL_ANTIFARM_REACTION_PER_HOUR   : tối đa N reaction / giờ / người được xét EXP (mặc định 60). Thả-gỡ-thả lại cùng 1 tin trong 24h cũng không có thêm EXP.
//   LEVEL_ANTIFARM_VOICE_JOINS         : vào voice từ N lần trong LEVEL_ANTIFARM_VOICE_WINDOW_MINUTES (mặc định 6 lần / 10 phút) = nghi ra vào liên tục
//                                        -> mất EXP voice LEVEL_ANTIFARM_VOICE_BLOCK_MINUTES phút (mặc định 30).
//   Tin lặp 1 ký tự (aaaaa, ......) hoặc giống 1 trong 3 tin gần nhất của người đó (bỏ dấu câu/khoảng trắng) cũng không có EXP.
const antiBool = (v, def) => (v === undefined || String(v).trim() === '' ? def : !/^(0|false|off|no)$/i.test(String(v).trim()));
const antiNum = (v, def, min) => (Number.isFinite(Number(v)) && String(v || '').trim() !== '' ? Math.max(min, Number(v)) : def);
const LEVEL_ANTIFARM_ENABLED = antiBool(process.env.LEVEL_ANTIFARM_ENABLED, true);
const LEVEL_ANTIFARM_CHAT_PER_HOUR = antiNum(process.env.LEVEL_ANTIFARM_CHAT_PER_HOUR, 300, 1);
const LEVEL_ANTIFARM_REACTION_PER_HOUR = antiNum(process.env.LEVEL_ANTIFARM_REACTION_PER_HOUR, 60, 1);
const LEVEL_ANTIFARM_VOICE_JOINS = antiNum(process.env.LEVEL_ANTIFARM_VOICE_JOINS, 6, 2);
const LEVEL_ANTIFARM_VOICE_WINDOW_MINUTES = antiNum(process.env.LEVEL_ANTIFARM_VOICE_WINDOW_MINUTES, 10, 1);
const LEVEL_ANTIFARM_VOICE_BLOCK_MINUTES = antiNum(process.env.LEVEL_ANTIFARM_VOICE_BLOCK_MINUTES, 30, 1);

// BÁO CÁO THÁNG (level/monthly.js): ngày 1 hàng tháng (giờ VN) đăng "Tổng kết tháng" vào LEVEL_ANNOUNCE_CHANNEL_ID, dựa trên tab "Mốc Tháng"
// (ảnh chụp EXP/số tin/phút voice của mọi người lúc bắt đầu mỗi tháng — bot tự ghi, đừng sửa tay).
//   LEVEL_MONTHLY_POST_ENABLED=false : tắt đăng báo cáo (vẫn ghi mốc tháng).   LEVEL_MONTHLY_TOP_SIZE : số người mỗi bảng (mặc định 5, tối đa 10).
const LEVEL_MONTH_SHEET_NAME = 'Mốc Tháng';
const LEVEL_MONTHLY_POST_ENABLED = antiBool(process.env.LEVEL_MONTHLY_POST_ENABLED, true);
const LEVEL_MONTHLY_TOP_SIZE = Math.min(10, antiNum(process.env.LEVEL_MONTHLY_TOP_SIZE, 5, 3));

// NGƯỜI "NGỦ ĐÔNG" (level/dormant.js): đang ở server + có trong tab Bang (không đánh dấu "Không Trong Bang") nhưng KHÔNG có EXP thật liên tiếp N ngày
// (tính theo cột "Ngày HĐ Cuối"). Hiện ở bài Tổng kết tháng (tối đa LEVEL_DORMANT_MONTHLY_MAX tên) và lệnh /nguodong (Bông, đầy đủ).
//   LEVEL_DORMANT_DAYS : N ngày (mặc định 14, tối thiểu 1).
const LEVEL_DORMANT_DAYS = Math.floor(antiNum(process.env.LEVEL_DORMANT_DAYS, 14, 1));
const LEVEL_DORMANT_MONTHLY_MAX = 15;

// NHẮC STREAK SẮP ĐỨT (level/streakRemind.js): chỉ DM người TỰ BẬT bằng /nhacstreak (mặc định TẮT). Trạng thái lưu ở tab "Nhắc Streak" (bot tự tạo).
//   LEVEL_STREAK_REMIND_MIN  : chỉ nhắc khi chuỗi hiện tại >= N ngày (mặc định 3).
//   LEVEL_STREAK_REMIND_HOUR : giờ VN bắt đầu nhắc (0-23, mặc định 20); hôm nay chưa có EXP thật thì nhắc 1 lần/ngày, bot lên muộn trước 24:00 vẫn nhắc bù.
const LEVEL_STREAK_REMIND_SHEET_NAME = 'Nhắc Streak';
const LEVEL_STREAK_REMIND_MIN = Math.floor(antiNum(process.env.LEVEL_STREAK_REMIND_MIN, 3, 1));
const LEVEL_STREAK_REMIND_HOUR =
  String(process.env.LEVEL_STREAK_REMIND_HOUR || '').trim() !== '' && Number.isInteger(Number(process.env.LEVEL_STREAK_REMIND_HOUR)) && Number(process.env.LEVEL_STREAK_REMIND_HOUR) >= 0 && Number(process.env.LEVEL_STREAK_REMIND_HOUR) <= 23
    ? Number(process.env.LEVEL_STREAK_REMIND_HOUR)
    : 20;
const LEVEL_STREAK_REMIND_DM_DELAY_MS = 2000; // nghỉ giữa 2 DM liên tiếp để tránh rate limit

// Lệnh xem cấp (/level, /toplevel): dữ liệu cache mới hơn N giây thì dùng luôn, không đọc lại Google Sheet.
const LEVEL_DISPLAY_CACHE_SECONDS = Number(process.env.LEVEL_DISPLAY_CACHE_SECONDS) || 30;

// ===== DANH SÁCH HOẠT ĐỘNG =====
//   key      : mã (cột "Mã" ở tab Cấu Hình EXP — đừng đổi)
//   column   : tên cột đếm số lần ở tab "Level"
//   exp      : EXP mặc định mỗi lần (sửa ở tab Cấu Hình EXP)
//   cooldown : giây — mỗi người chỉ được cộng EXP hoạt động (nhóm) này 1 lần / khoảng này
//   group    : các hoạt động CÙNG group dùng chung 1 bộ đếm cooldown (mặc định = key)
const LEVEL_ACTIVITIES = [
  { key: 'chat', column: 'Chat', label: 'Chat thường', exp: 1, cooldown: 15, group: 'msg', note: 'Mỗi tin nhắn ở kênh thường (tính tối đa 1 lần / cooldown để chống spam)' },
  { key: 'chat_thao_luan', column: 'Chat Thảo Luận', label: 'Chat trong kênh thảo luận', exp: 2, cooldown: 15, group: 'msg', note: 'Tin nhắn trong Forum/kênh thảo luận (thay cho Chat thường)' },
  { key: 'bai_thao_luan', column: 'Bài Thảo Luận', label: 'Đăng bài thảo luận', exp: 10, cooldown: 30, group: 'post', note: 'Tạo 1 bài (thread) mới trong Forum thảo luận' },
  { key: 'anh', column: 'Ảnh', label: 'Đăng ảnh', exp: 2, cooldown: 10, group: 'image', note: 'Tin nhắn có kèm ảnh (cộng 1 lần / tin, không nhân theo số ảnh)' },
  { key: 'reaction', column: 'Reaction', label: 'Thả reaction', exp: 1, cooldown: 30, group: 'reaction', note: 'Thả reaction vào tin của người khác (không tính tin của bot / tin của chính mình)' },
  { key: 'voice', column: 'Voice (phút)', label: 'Ngồi voice', exp: 5, cooldown: 0, group: 'voice', note: `EXP gốc cho mỗi ${LEVEL_VOICE_BLOCK_MINUTES} phút ngồi voice. Ngồi 1 mình = 0 EXP, từ 2 người x1, mỗi người thêm +${LEVEL_VOICE_EXTRA_PER_PERSON} hệ số (tối đa x${LEVEL_VOICE_MAX_MULTIPLIER}). Cột đếm tính bằng phút` },
  { key: 'vote_scrim', column: 'Vote Scrim', label: 'Vote Scrim', exp: 3, cooldown: 21600, group: 'vote_scrim', note: 'Tích vote ngày scrim trên tin vote tuần này' },
  { key: 'highlight', column: 'Highlight', label: 'Đăng Highlight', exp: 8, cooldown: 300, group: 'highlight', note: 'Đăng clip vào kênh Highlight' },
  { key: 'check_gear', column: 'Check Gear', label: 'Check Gear', exp: 10, cooldown: 3600, group: 'check_gear', note: 'Gửi/cập nhật ảnh Check Gear thành công' },
  { key: 'thi_kiem', column: 'Thí Kiếm', label: 'Cập nhật rank Thí Kiếm', exp: 5, cooldown: 3600, group: 'thi_kiem', note: 'Cập nhật điểm rank Thí Kiếm thành công (điểm tăng)' },
  // --- Hoạt động đặc thù team / thưởng chuỗi: cột đếm của các mã này nằm Ở CUỐI tab Level (appended) để không làm lệch cột cũ ---
  { key: 'vote_du_tuan', column: 'Vote Đủ Tuần', label: 'Vote đủ cả tuần scrim', exp: 15, cooldown: 0, group: 'vote_du_tuan', appended: true, note: 'Tự tích vote ĐỦ mọi ngày scrim có trên tin vote tuần này (không tính vote hộ của role auto-vote). 1 lần / tuần' },
  { key: 'voice_dung_gio', column: 'Voice Đúng Giờ', label: 'Có mặt voice đúng giờ scrim', exp: 10, cooldown: 0, group: 'voice_dung_gio', appended: true, note: 'Đang ở kênh voice vào giờ scrim (giờ buổi + LEVEL_SCRIM_VOICE_GRACE_MINUTES phút). 1 lần / buổi scrim' },
  { key: 'streak_bonus', column: 'Thưởng Chuỗi', label: 'Thưởng chuỗi ngày hoạt động', exp: 0, cooldown: 0, group: 'streak_bonus', appended: true, bonus: true, note: 'Số lần nhận thưởng chuỗi. EXP thưởng đặt ở các dòng streak_<số ngày> bên dưới, không sửa dòng này' },
];

// Dòng cấu hình THÊM vào tab "Cấu Hình EXP" (chỉ thêm khi mã chưa có; sửa tay thoải mái, bot nạp lại mỗi LEVEL_CONFIG_REFRESH_MINUTES phút):
//   streak_<N> : thưởng EXP 1 lần khi đạt chuỗi N ngày hoạt động liên tiếp (cột EXP = số EXP thưởng, 0 = tắt mốc). Thêm mốc mới = thêm dòng streak_<số>.
//   event_*    : hệ số EXP sự kiện — F Hệ số (1 = không đổi) · G Thứ áp dụng (T2..T7, CN; trống = mọi ngày) · H/I Từ ngày/Đến ngày
//                (YYYY-MM-DD hoặc dd/mm; trống = không giới hạn) · J Mã hoạt động áp dụng (VD chat,voice; trống = tất cả). Nhiều sự kiện cùng lúc: lấy hệ số cao nhất.
const LEVEL_STREAK_DEFAULTS = { 3: 10, 7: 30, 14: 70, 30: 200 };
const LEVEL_EXTRA_CONFIG_ROWS = [
  ...Object.entries(LEVEL_STREAK_DEFAULTS).map(([days, exp]) => [`streak_${days}`, `Chuỗi hoạt động ${days} ngày liên tiếp`, exp, 0, 'Thưởng EXP 1 lần khi đạt chuỗi này (EXP = 0 để tắt mốc). Thêm mốc: thêm dòng mã streak_<số ngày>']),
  ['event_cuoi_tuan', 'Sự kiện: hệ số cuối tuần', '', 0, 'Đặt hệ số ở cột F (VD 2 = x2). Mặc định 1 = chưa bật. Xem hướng dẫn các cột F-J ở đầu config/level.js', 1, 'T7,CN', '', '', ''],
];

// Voice đúng giờ scrim: kiểm tra ai đang ngồi voice vào (giờ buổi scrim + GRACE phút). Giờ buổi lấy từ lịch scrim hiện có (mon!us1/us2).
//   LEVEL_SCRIM_VOICE_GRACE_MINUTES : mặc định 5.   LEVEL_SCRIM_VOICE_CHANNEL_IDS : giới hạn kênh voice tính (cách nhau dấu phẩy; trống = mọi kênh voice trừ AFK).
const LEVEL_SCRIM_VOICE_GRACE_MINUTES = Number.isFinite(Number(process.env.LEVEL_SCRIM_VOICE_GRACE_MINUTES)) && String(process.env.LEVEL_SCRIM_VOICE_GRACE_MINUTES || '').trim() !== '' ? Math.max(0, Number(process.env.LEVEL_SCRIM_VOICE_GRACE_MINUTES)) : 5;
const LEVEL_SCRIM_VOICE_CHANNEL_IDS = new Set(splitIds(process.env.LEVEL_SCRIM_VOICE_CHANNEL_IDS));

// EXP cần để lên cấp N (từ cấp N-1), mặc định theo "ngân sách mỗi dải 10 cấp" (docs/BANG_CAP_DO_MOI.xlsx, docs/KHUNG_LEVEL_PROMPT.md mục 3):
// dải k (cấp 10k-9..10k) có TỔNG EXP cố định LEVEL_BAND_EXP[k-1]; trong dải EXP mỗi cấp tăng đều (đường thẳng), cấp đầu dải sau = cấp cuối dải trước.
// Cấp đầu dải 1 = LEVEL1_EXP; cấp cuối = Tổng/5 − cấp đầu; EXP cấp thứ j = round5(đầu + (cuối − đầu)·(j−1)/9); cấp thứ 10 = Tổng − tổng 9 cấp trước (để tổng khớp tuyệt đối).
// Tích luỹ: cấp 10 = 395 · 20 = 2.085 · 30 = 6.305 · 40 = 14.180 · 50 = 26.555 · 100 = 155.930 (đã giảm 2 lần × 0,75 so với bản 700/3.000/…). Sửa tay ở tab "Bảng Cấp Độ" (tab là nguồn chân lý, bảng này chỉ dùng khi tab trống / thiếu cấp).
const LEVEL_BAND_EXP = [395, 1690, 4220, 7875, 12375, 16875, 21375, 25875, 30375, 34875];
const LEVEL1_EXP = 20;
const round5 = (x) => Math.round(x / 5) * 5;
const DEFAULT_LEVEL_COSTS = (() => {
  const costs = [0]; // costs[n] = EXP để lên cấp n
  let start = LEVEL1_EXP;
  LEVEL_BAND_EXP.forEach((total) => {
    const end = total / 5 - start;
    let sum = 0;
    for (let j = 1; j <= 9; j += 1) {
      const v = round5(start + ((end - start) * (j - 1)) / 9);
      costs.push(v);
      sum += v;
    }
    costs.push(total - sum);
    start = end;
  });
  return costs;
})();
function defaultExpToReachLevel(n) {
  const i = Math.max(1, Math.floor(Number(n) || 1));
  // Quá dải đã khai báo (LEVEL_MAX_LEVEL > 100): giữ nguyên mức cấp cuối.
  return DEFAULT_LEVEL_COSTS[Math.min(i, DEFAULT_LEVEL_COSTS.length - 1)];
}

// Emote riêng của server cho từng hệ phái — hiện cạnh tên hệ phái trên thẻ /level, /hoso (và embed dự phòng).
// Khoá = ĐÚNG tên hệ phái; { name, id } lấy từ emote dạng <:name:id>. Thẻ ảnh tải ảnh emote từ CDN Discord (lỗi thì vẽ huy hiệu không có emote).
const LEVEL_CLASS_EMOJIS = {
  'Thần Tương': { name: 'tt_ThanTuong', id: process.env.CLASS_EMOJI_THAN_TUONG || '' },
  'Huyết Hà': { name: 'hh_HuyetHa', id: process.env.CLASS_EMOJI_HUYET_HA || '' },
  'Cửu Linh': { name: 'cl_CuuLinh', id: process.env.CLASS_EMOJI_CUU_LINH || '' },
  'Long Ngâm': { name: 'ln_LongNgam', id: process.env.CLASS_EMOJI_LONG_NGAM || '' },
  'Tố Vấn': { name: 'tv_ToVan', id: process.env.CLASS_EMOJI_TO_VAN || '' },
  'Thiết Y': { name: 'ty_ThietY', id: process.env.CLASS_EMOJI_THIET_Y || '' },
  'Toái Mộng': { name: 'tm_ToaiMong', id: process.env.CLASS_EMOJI_TOAI_MONG || '' },
};

// THÀNH TỰU trên thẻ /hoso (hoso/achievements.js): mỗi mục 5 mốc tăng dần, tên/màu mốc lấy theo bậc ở level/theme.js (Đồng -> Kim Cương).
// label = TÊN KIẾM HIỆP hiện trên thẻ + trong nút 🏅 Thành tựu của /profile (ngắn, <= 16 ký tự cho vừa ô thẻ); plain = tên gốc dễ hiểu (chỉ để đối chiếu/ghi chú);
// quip = câu đùa kiếm hiệp hiện dưới tên (<= 100 ký tự vì là mô tả của dropdown). Đổi tên/câu đùa tuỳ ý ở đây, key giữ nguyên.
// sources = các khoá đếm ở LEVEL_ACTIVITIES được cộng lại; voice đếm bằng PHÚT (unit 'minutes' -> hiện theo giờ). Chỉ dựa trên số tích luỹ nên đã đạt là không mất.
// from: 'bestStreak' = lấy KỶ LỤC chuỗi ngày (getLevelSnapshot().bestStreak) thay vì cộng counts; unit 'days' -> hiện "N ngày".
const LEVEL_ACHIEVEMENTS = [
  { key: 'chat', label: 'Thần Khẩu', plain: 'Tin nhắn', quip: 'Gõ phím nhanh hơn rút kiếm, một câu quét sạch cả kênh.', sources: ['chat', 'chat_thao_luan'], tiers: [100, 1000, 5000, 20000, 100000] },
  { key: 'anh', label: 'Nhiếp Hồn Thủ', plain: 'Ảnh', quip: 'Búng tay một cái, hồn ai cũng bị chụp mất.', sources: ['anh'], tiers: [10, 50, 200, 500, 2000] },
  { key: 'thao_luan', label: 'Luận Kiếm Sư', plain: 'Bài thảo luận', quip: 'Mở bài luận võ, cãi ba ngày ba đêm chưa chịu hạ kiếm.', sources: ['bai_thao_luan'], tiers: [1, 10, 30, 100, 300] },
  { key: 'voice', label: 'Sư Tử Hống', plain: 'Voice', quip: 'Mở mic là thiên hạ biết, chưa kịp mute đã vang ba dặm.', sources: ['voice'], unit: 'minutes', tiers: [60, 600, 3000, 9000, 30000] },
  { key: 'check_gear', label: 'Giám Bảo Sư', plain: 'Check Gear', quip: 'Liếc qua trang bị là biết nội công, soi tới sợi chỉ cũng không thoát.', sources: ['check_gear'], tiers: [1, 5, 20, 50, 100] },
  { key: 'streak', label: 'Tẩu Hỏa Nhập Ma', plain: 'Chuỗi ngày', quip: 'Ngày nào cũng online, luyện công quên cả ăn cơm.', from: 'bestStreak', unit: 'days', tiers: [3, 7, 30, 100, 365] },
  // --- Mốc hoạt động Discord khác (suffix = đơn vị hiện ở "Mốc kế"); thẻ /hoso tự xếp 6 mục / hàng ---
  { key: 'reaction', label: 'Ám Khí Biểu Cảm', plain: 'Reaction', quip: 'Không nói nhiều, phóng một cái emoji trúng ngay tim.', sources: ['reaction'], tiers: [50, 300, 1000, 3000, 10000] },
  { key: 'vote_scrim', label: 'Điểm Binh Sứ', plain: 'Vote Scrim', quip: 'Lệnh triệu tập vừa phát, đã có mặt trước giờ khai chiến.', sources: ['vote_scrim'], suffix: 'lần', tiers: [4, 20, 50, 100, 200] },
  { key: 'highlight', label: 'Kinh Hồng Kiếm', plain: 'Highlight', quip: 'Một pha xử lý, cả bang hô vang, đối thủ quên luôn mình là ai.', sources: ['highlight'], tiers: [1, 5, 15, 40, 100] },
  { key: 'thi_kiem', label: 'Kiếm Cuồng', plain: 'Thí Kiếm', quip: 'Gặp ai cũng đòi thí kiếm, thắng thua gì cũng cười ha hả.', sources: ['thi_kiem'], suffix: 'lần', tiers: [1, 5, 15, 30, 60] },
  { key: 'vote_du_tuan', label: 'Đệ Tử Gương Mẫu', plain: 'Vote đủ tuần', quip: 'Vote đủ cả tuần, sư phụ nhìn cũng phải gật gù.', sources: ['vote_du_tuan'], suffix: 'tuần', tiers: [1, 4, 12, 26, 52] },
  { key: 'voice_dung_gio', label: 'Quân Tử Đúng Hẹn', plain: 'Voice đúng giờ', quip: 'Tứ mã nan truy, hẹn giờ nào có mặt giờ đó.', sources: ['voice_dung_gio'], suffix: 'buổi', tiers: [1, 10, 30, 80, 150] },
];

// THÀNH TỰU TỰ CHỌN (hoso/manualAchievements.js): mỗi người TỰ chọn 1 thành tựu để đeo trên thẻ /hoso, bằng nút 🏅 Thành tựu
// trong /profile (không còn admin gắn cho từng người). Danh sách chọn = LEVEL_ACHIEVEMENTS ở trên (tên kiếm hiệp + câu đùa),
// chọn qua dropdown trong hộp thoại, không gõ tay tự do. Mỗi người đeo ĐÚNG 1 thành tựu tại 1 thời điểm (chọn cái mới sẽ thay cái cũ,
// hoặc chọn "Không đeo" để gỡ). Lưu ở tab riêng MANUAL_ACHIEVEMENT_SHEET_NAME trong CHÍNH spreadsheet "Hồ Sơ Cá Nhân"
// (NM_IMAGE_SPREADSHEET_ID, config/nmImage.js), dòng cũ do admin gắn trước đây vẫn đọc bình thường.
const MANUAL_ACHIEVEMENT_SHEET_NAME = 'Thành Tựu Đặt Tay';
const MANUAL_ACHIEVEMENT_NOTE_MAX = 60;
const MANUAL_ACHIEVEMENT_PER_USER_MAX = 1; // chỉ 1 thành tựu đặt tay ĐANG CÒN / 1 người

// THÀNH TỰU RIÊNG (hoso/customAchievement.js — /themthanhtuu /suathanhtuu /xoathanhtuu /dsthanhtuu): gõ tên tự do,
// CHỈ admin (ADMIN_USER_ID, khoá cứng) được dùng lệnh.
// Lưu ở tab riêng CUSTOM_ACHIEVEMENT_SHEET_NAME, CÙNG spreadsheet "Hồ Sơ Cá Nhân" (NM_IMAGE_SPREADSHEET_ID).
const CUSTOM_ACHIEVEMENT_SHEET_NAME = 'Thành Tựu Riêng';
const CUSTOM_ACHIEVEMENT_NAME_MAX = 60;
const CUSTOM_ACHIEVEMENT_USER_ID = require('./core').ADMIN_USER_ID; // KHOÁ CỨNG = admin, không đổi được qua ENV, không role nào khác dùng được

module.exports = {
  LEVEL_CLASS_EMOJIS,
  LEVEL_ACHIEVEMENTS,
  MANUAL_ACHIEVEMENT_SHEET_NAME,
  MANUAL_ACHIEVEMENT_NOTE_MAX,
  MANUAL_ACHIEVEMENT_PER_USER_MAX,
  CUSTOM_ACHIEVEMENT_SHEET_NAME,
  CUSTOM_ACHIEVEMENT_NAME_MAX,
  CUSTOM_ACHIEVEMENT_USER_ID,
  LEVEL_ANTIFARM_ENABLED,
  LEVEL_ANTIFARM_CHAT_PER_HOUR,
  LEVEL_ANTIFARM_REACTION_PER_HOUR,
  LEVEL_ANTIFARM_VOICE_JOINS,
  LEVEL_ANTIFARM_VOICE_WINDOW_MINUTES,
  LEVEL_ANTIFARM_VOICE_BLOCK_MINUTES,
  LEVEL_MONTH_SHEET_NAME,
  LEVEL_MONTHLY_POST_ENABLED,
  LEVEL_MONTHLY_TOP_SIZE,
  LEVEL_DORMANT_DAYS,
  LEVEL_DORMANT_MONTHLY_MAX,
  LEVEL_STREAK_REMIND_SHEET_NAME,
  LEVEL_STREAK_REMIND_MIN,
  LEVEL_STREAK_REMIND_HOUR,
  LEVEL_STREAK_REMIND_DM_DELAY_MS,
  LEVEL_SPREADSHEET_ID,
  LEVEL_SHEET_NAME,
  LEVEL_CONFIG_SHEET_NAME,
  LEVEL_TABLE_SHEET_NAME,
  LEVEL_ROLE_SHEET_NAME,
  LEVEL_EVENT_POINTS_SHEET_NAME,
  LEVEL_EVENT_POINTS_LEGACY_NAME,
  LEVEL_EVENT_LOG_SHEET_NAME,
  LEVEL_ROLE_STACK,
  LEVEL_ROLE_SYNC_DELAY_MS,
  LEVEL_ROLE_SYNC_ON_START,
  LEVEL_CARD_ENABLED,
  LEVEL_CARD_AVATAR_TIMEOUT_MS,
  LEVEL_WEEKLY_POST_ENABLED,
  LEVEL_WEEKLY_POST_HOUR,
  LEVEL_WEEKLY_TOP_SIZE,
  LEVEL_ENABLED,
  LEVEL_MAX_LEVEL,
  LEVEL_FLUSH_SECONDS,
  LEVEL_CONFIG_REFRESH_MINUTES,
  LEVEL_ANNOUNCE_CHANNEL_ID,
  LEVEL_TOP_ROLE_ID,
  LEVEL_WEEK_SHEET_NAME,
  LEVEL_TOP_ROLE_COUNT,
  LEVEL_MONTH_ROLE_ID,
  LEVEL_MONTH_ROLE_COUNT,
  LEVEL_NOTICE_TTL_MS,
  LEVEL_MILESTONE_CHANNEL_ID,
  LEVEL_NOTICE_BATCH_MS,
  LEVEL_DISCUSSION_CHANNEL_IDS,
  LEVEL_POST_CHANNEL_IDS,
  LEVEL_EXCLUDED_CHANNEL_IDS,
  LEVEL_TOP_EXCLUDED_IDS,
  LEVEL_VOICE_BLOCK_MINUTES,
  LEVEL_VOICE_EXTRA_PER_PERSON,
  LEVEL_VOICE_MAX_MULTIPLIER,
  LEVEL_VOICE_DAILY_MAX_MINUTES,
  LEVEL_MIN_CHAT_LENGTH,
  LEVEL_DUPLICATE_WINDOW_SECONDS,
  LEVEL_DISPLAY_CACHE_SECONDS,
  LEVEL_ACTIVITIES,
  LEVEL_STREAK_DEFAULTS,
  LEVEL_EXTRA_CONFIG_ROWS,
  LEVEL_SCRIM_VOICE_GRACE_MINUTES,
  LEVEL_SCRIM_VOICE_CHANNEL_IDS,
  defaultExpToReachLevel,
  LEVEL_BAND_EXP,
  LEVEL1_EXP,
};
