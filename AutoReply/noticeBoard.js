// ===== AutoReply: Bảng Tin Monaris =====
// Đăng thông báo định kỳ vào kênh chat lúc kênh im ắng, tự xoá sau 1 thời gian,
// và gửi thử 1 tin vào kênh test (/testnotice).

const client = require('../client');
const { noticeBoardNotices } = require('../state');
const { getVnNow } = require('../utils/time');
const {
  IDLE_CHAT_CHANNEL_ID,
  NOTICE_BOARD_INTERVAL_MS,
  NOTICE_BOARD_QUIET_HOUR_START,
  NOTICE_BOARD_QUIET_HOUR_END,
  NOTICE_BOARD_TEST_CHANNEL_ID,
  NOTICE_BOARD_AUTO_DELETE_MS,
  BOT_CREATOR_DISCORD_ID,
} = require('../config');
const {
  pickNextNoticeBoardNotice,
  pickRandomNoticeBoardNotice,
  markNoticeBoardNoticeAsPosted,
} = require('../googleSheets/noticeBoardSheet');
const { getMemberInfoAnySource } = require('./memberDirectory');

// --- Bảng Tin Monaris: tự động đăng tin (lấy từ Google Sheet, luân phiên
// đều tin) vào kênh IDLE_CHAT_CHANNEL_ID theo lịch CỐ ĐỊNH mỗi
// NOTICE_BOARD_INTERVAL_MINUTES phút — THAY THẾ HOÀN TOÀN tính năng idle
// chat cũ. Xem giải thích chi tiết ở config.js (NOTICE_BOARD_*) và
// googleSheets/noticeBoardSheet.js (cơ chế chọn tin theo LRU).

// CHỈ còn dùng làm cờ "đã init xong sau khi bot khởi động" (không còn dùng
// để tính kênh im lặng bao lâu như trước, vì lịch đăng giờ CỐ ĐỊNH theo
// NOTICE_BOARD_INTERVAL_MS, không phụ thuộc kênh có động tĩnh gì không
// nữa) — null = chưa init, checkNoticeBoard() sẽ bỏ qua cho tới khi có giá
// trị, tránh gửi tin ngay khi bot vừa restart trước khi initNoticeBoardState()
// kịp khôi phục đúng noticeBoardLastPostedAt bên dưới.
let noticeBoardLastMessageAt = null;

// Thời điểm (ms, Date.now()) tin Bảng Tin Monaris GẦN NHẤT được đăng —
// khởi tạo từ dữ liệu đã nạp trong noticeBoardNotices (cột "Lần đăng gần
// nhất" trên sheet, xem initNoticeBoardState()), để việc tính "đã quá
// NOTICE_BOARD_INTERVAL_MS chưa" không bị reset về 0 mỗi khi bot restart
// (khác với biến RAM thuần, xem chú thích ở sendVoteStatusAutoChat bên dưới
// về việc bot restart làm mất biến RAM). null = chưa từng đăng tin nào.
let noticeBoardLastPostedAt = null;

// Gọi 1 lần lúc ClientReady (xem index.js), SAU KHI loadNoticeBoardNotices()
// đã nạp xong dữ liệu từ sheet vào noticeBoardNotices. Khôi phục
// noticeBoardLastPostedAt = "Lần đăng gần nhất" MỚI NHẤT trong số các tin đã
// nạp — để mốc NOTICE_BOARD_INTERVAL_MS tính đúng dù bot vừa mới restart
// (không đăng dồn ngay khi vừa bật lên nếu chưa tới hạn). Không cần gọi API
// lấy tin nhắn cuối kênh nữa (lịch đăng giờ CỐ ĐỊNH, không còn phụ thuộc
// kênh im lặng bao lâu) — chỉ đơn giản đánh dấu đã init xong.
async function initNoticeBoardState() {
  noticeBoardLastMessageAt = Date.now(); // chỉ còn là cờ "đã init xong"

  let latestPostedAt = null;
  for (const notice of noticeBoardNotices) {
    if (notice.lastPostedAt !== null && (latestPostedAt === null || notice.lastPostedAt > latestPostedAt)) {
      latestPostedAt = notice.lastPostedAt;
    }
  }
  noticeBoardLastPostedAt = latestPostedAt;
}

// Bỏ hết dấu "#" (và khoảng trắng theo sau) THỪA ở ĐẦU nội dung trước khi
// tự thêm đúng "## " (2 dấu thăng — Discord markdown H2, chữ to + đậm) —
// tránh trường hợp nội dung trong Google Sheet lỡ có sẵn dấu "#" (do người
// nhập tay thêm vào, tưởng cần tự thêm) khiến cộng dồn thành "## #", dư 1
// dấu # hiện ra như chữ thường ngay trước nội dung.
function stripLeadingHeadingHashes(content) {
  return (content || '').replace(/^#+\s*/, '');
}

// Build nội dung tin nhắn Discord cho 1 tin Bảng Tin Monaris — dùng CHUNG
// cho cả postNextNoticeBoardMessage (LRU, kênh chính) và
// sendTestNoticeBoardMessage (random, kênh test) để đổi format chỉ cần sửa
// 1 chỗ DUY NHẤT này.
// Dòng 1: "## " (H2 Discord) + emoji dance + tên bảng tin (in nghiêng) +
//         ngày giờ lúc gửi (Discord timestamp <t:...:F> — tự hiển thị đúng
//         múi giờ của TỪNG người xem, không cần bot tự format ngày giờ VN).
// Dòng 2: "### " (H3 Discord) + nội dung tin + " - <Ingame người đăng>" +
//         Id tin. Tra Ingame bằng CHÍNH getMemberInfoAnySource() ở trên
//         (đối chiếu postedByUserId với tab "Bang" + "ChatGlobal", giống
//         hệt cách AI xưng hô tên người chat) — KHÔNG in thẳng Discord ID
//         ra tin nữa. Nếu người đăng chưa có Ingame trong sheet nào (chưa
//         từng /setprofile, chưa có trong tab Bang) thì fallback về đúng
//         Discord ID (dạng CHỮ THƯỜNG THUẦN TUÝ, KHÔNG bọc <@id> để tránh
//         Discord render thành mention/tag/ping thật). Nếu tin không có
//         postedByUserId (tin cũ đăng trước khi có cột này) thì bỏ hẳn
//         đoạn tên, không hiện "- undefined"/"- null". RIÊNG trường hợp
//         postedByUserId === BOT_CREATOR_DISCORD_ID (chính người tạo ra
//         bot đăng) thì cũng ẨN LUÔN đoạn tên, không hiện gì cả.
async function buildNoticeBoardMessage(notice) {
  const cleanedContent = stripLeadingHeadingHashes(notice.content);
  const timestampTag = `<t:${Math.floor(Date.now() / 1000)}:F>`;

  let posterLabel = null;
  if (notice.postedByUserId && notice.postedByUserId !== BOT_CREATOR_DISCORD_ID) {
    try {
      const memberInfo = await getMemberInfoAnySource(notice.postedByUserId);
      posterLabel = (memberInfo && memberInfo.ingame) || notice.postedByUserId;
    } catch (error) {
      console.error('Không thể tra Ingame người đăng tin Bảng Tin Monaris:', error.message);
      posterLabel = notice.postedByUserId;
    }
  }

  const postedBySuffix = posterLabel ? ` - ${posterLabel}` : '';
  return (
    `## ✨  _Bảng Tin Monaris_ (${timestampTag}): \n` +
    `### ${cleanedContent}${postedBySuffix} (#${notice.id})`
  );
}

// Tự xoá 1 tin Bảng Tin Monaris sau 1 khoảng thời gian kể từ lúc đăng — giữ
// kênh idle chat gọn, không để tin cũ trôi nổi mãi. Thời gian này giờ có thể
// đặt RIÊNG cho từng tin (cột "Tự xoá sau (giây)" trên sheet — đặt được khi
// thêm/sửa tin trên trang quản lý web, xem googleSheets/noticeBoardSheet.js):
//   - notice.autoDeleteSeconds là số (kể cả 0) -> dùng đúng giá trị đó
//     (0 = KHÔNG tự xoá tin này).
//   - notice.autoDeleteSeconds là null/undefined (RỖNG, chưa từng đặt riêng)
//     -> dùng mặc định chung NOTICE_BOARD_AUTO_DELETE_MS (config/autoChat.js).
// Chỉ là hẹn giờ trong RAM (giống pattern loadingMsg.delete() ở
// commands/messageCommands.js) — nếu bot restart giữa chừng (redeploy,
// crash, OOM-kill) thì hẹn giờ mất, tin đó sẽ ở lại kênh vĩnh viễn
// thay vì tự xoá; chấp nhận được vì đây chỉ là dọn dẹp phụ, không phải logic
// quan trọng. catch() nuốt lỗi để không log ồn khi tin đã bị ai đó xoá tay
// trước đó (Discord trả lỗi "Unknown Message").
function scheduleNoticeBoardAutoDelete(message, notice) {
  const hasCustomValue =
    notice && notice.autoDeleteSeconds !== null && notice.autoDeleteSeconds !== undefined;
  const autoDeleteMs = hasCustomValue ? notice.autoDeleteSeconds * 1000 : NOTICE_BOARD_AUTO_DELETE_MS;
  if (!autoDeleteMs) return; // 0/falsy = tắt tính năng này (riêng tin này hoặc mặc định chung)
  setTimeout(() => {
    message.delete().catch(() => {});
  }, autoDeleteMs);
}

// Chọn 1 tin (theo pickNextNoticeBoardNotice — cơ chế LRU, xem
// googleSheets/noticeBoardSheet.js) rồi gửi vào kênh IDLE_CHAT_CHANNEL_ID
// với định dạng cố định "Bảng Tin Monaris: <nội dung>", KHÔNG mention ai.
// Đánh dấu tin vừa đăng (mark posted) + cập nhật noticeBoardLastPostedAt
// NGAY sau khi gửi thành công.
async function postNextNoticeBoardMessage() {
  const notice = pickNextNoticeBoardNotice();
  if (!notice) return;

  try {
    const channel = await client.channels.fetch(IDLE_CHAT_CHANNEL_ID);
    // Gắn Id vào cuối nội dung lúc đăng (KHÔNG đụng vào nội dung lưu trong
    // sheet) — để ai đọc tin trên kênh cũng thấy ngay Id, copy dùng luôn cho
    // /removenotice mà không cần vào sheet tra.
    const sentMessage = await channel.send({
      content: await buildNoticeBoardMessage(notice),
      allowedMentions: { parse: [] },
    });
    scheduleNoticeBoardAutoDelete(sentMessage, notice);

    const postedAt = Date.now();
    noticeBoardLastPostedAt = postedAt;
    await markNoticeBoardNoticeAsPosted(notice.id, postedAt);
  } catch (error) {
    console.error('Không thể gửi tin Bảng Tin Monaris:', error.message);
  }
}

// Được gọi mỗi phút (setInterval trong index.js). Đăng lịch CỐ ĐỊNH: cứ đều
// đặn mỗi NOTICE_BOARD_INTERVAL_MS kể từ tin Bảng Tin Monaris gần nhất là
// đăng 1 tin tiếp theo — không còn phụ thuộc kênh có đang im lặng hay không
// như trước nữa.
// Bỏ qua hoàn toàn trong khung giờ yên lặng (NOTICE_BOARD_QUIET_HOUR_START ->
// NOTICE_BOARD_QUIET_HOUR_END, giờ VN) để không làm phiền lúc mọi người
// đang ngủ.
async function checkNoticeBoard() {
  if (noticeBoardLastMessageAt === null) return; // chưa init xong, bỏ qua lượt này
  if (!noticeBoardNotices.length) return; // sheet chưa có tin nào để đăng

  const vnHour = getVnNow().getHours();
  if (vnHour >= NOTICE_BOARD_QUIET_HOUR_START && vnHour < NOTICE_BOARD_QUIET_HOUR_END) return;

  const now = Date.now();
  const intervalElapsed =
    noticeBoardLastPostedAt === null || now - noticeBoardLastPostedAt >= NOTICE_BOARD_INTERVAL_MS;

  if (!intervalElapsed) return;

  await postNextNoticeBoardMessage();
}

// Gửi thử 1 tin Bảng Tin Monaris vào kênh TEST (NOTICE_BOARD_TEST_CHANNEL_ID)
// — dùng cho lệnh /testnotice. Chọn NGẪU NHIÊN (KHÔNG theo LRU, KHÔNG mark
// posted) để không ảnh hưởng vòng xoay đăng tin thật ở kênh chính. Throw lỗi
// (thay vì tự bắt) để lệnh gọi hàm này tự reply lỗi cho người dùng.
async function sendTestNoticeBoardMessage() {
  const notice = pickRandomNoticeBoardNotice();
  if (!notice) {
    throw new Error('Chưa có tin nào trong Bảng Tin Monaris.');
  }

  const channel = await client.channels.fetch(NOTICE_BOARD_TEST_CHANNEL_ID);
  const sentMessage = await channel.send({
    content: await buildNoticeBoardMessage(notice),
    allowedMentions: { parse: [] },
  });
  scheduleNoticeBoardAutoDelete(sentMessage, notice);

  return notice;
}

module.exports = {
  initNoticeBoardState,
  checkNoticeBoard,
  sendTestNoticeBoardMessage,
};
