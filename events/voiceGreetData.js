// Dữ liệu cho tính năng chào khi vào voice (events/voiceEvents.js).
// Tách riêng khỏi config.js để dễ chỉnh sửa, giống cách AutoReply/keywords.js
// tách riêng khỏi config.js.

// Danh sách user ID: khi 1 trong các user này JOIN vào 1 voice channel bất kỳ,
// bot sẽ gửi 1 câu chào ngẫu nhiên vào đúng ô chat của voice channel đó.
// Thêm/bớt ID vào mảng bên dưới (mỗi ID 1 chuỗi, cách nhau bởi dấu phẩy).
const { VOICE_GREET_USER_IDS } = require('../config/branding');

// Các câu chào — mỗi lần trigger sẽ chọn ngẫu nhiên 1 câu. Dùng {mention}
// để chèn TÊN user vào đúng vị trí (chỉ là tên, KHÔNG tag/ping thật —
// tránh làm phiền/gây thông báo cho họ).
const VOICE_GREET_MESSAGES = [
  'Chào sếp {mention} vào voice ạ! ✨ ',
  '{mention} vào rồi kìa, chào đại ca t đi! 🎉',
  'Tự nhiên thấy áp lực nặng nề, thì ra uy áp của đại ca {mention} tới chơi voice ✨ ',
  'Rồng ghé ổ tôm tép, đại ca {mention} ghé qua chốn này, thật là vinh hạnh! ✨',
];

// ---- Lời chào CHUNG cho BẤT KỲ AI vào voice (không nằm trong danh sách ID ở trên) ----
// Bot tự ghép ngẫu nhiên "khung câu" + "lời chúc" nên mỗi lần một khác, không
// cần gọi AI (nhanh, miễn phí, không lỗi/quota). {name} = tên Discord người
// vào, {channel} = tên kênh voice. GIỚI HẠN: phần chữ tự do (không tính tên
// người + tên kênh) KHÔNG quá GENERIC_MAX_WORDS từ — buildGenericGreeting
// tự kiểm tra lại và bỏ qua tổ hợp nào lỡ vượt.
const GENERIC_MAX_WORDS = 20;

const GENERIC_FRAMES = [
  'Chào {name} vào {channel}, {wish}',
  '{name} vừa vào {channel} kìa, {wish}',
  'Hello {name}! Chào mừng đến {channel}, {wish}',
  'Chào bạn {name} đã ghé {channel}, {wish}',
  '{name} xuất hiện ở {channel}, {wish}',
];

const GENERIC_WISHES = [
  'chúc chơi game vui vẻ!',
  'chúc bạn có buổi chơi thật vui!',
  'chúc cả team leo rank thần tốc!',
  'mong bạn tâm trạng thật tốt hôm nay!',
  'cùng quẩy thôi nào!',
  'chúc bạn gặp toàn đồng đội xịn!',
  'nhớ uống nước, chơi vui nhé!',
  'hôm nay chắc chắn là ngày may mắn của bạn!',
  'chúc bạn một ngày thật nhiều niềm vui!',
  'nay đánh đâu thắng đó nhé!',
  'ngồi thoải mái và chơi vui nha!',
  'chúc bạn nói chuyện vui, chơi game đỉnh!',
];

// Đếm từ của phần chữ tự do (bỏ {name}/{channel}).
function countFreeWords(text) {
  return text.replace(/\{name\}|\{channel\}/g, ' ').split(/\s+/).filter(Boolean).length;
}

function buildGenericGreeting(name, channelName) {
  for (let i = 0; i < 10; i++) {
    const frame = GENERIC_FRAMES[Math.floor(Math.random() * GENERIC_FRAMES.length)];
    const wish = GENERIC_WISHES[Math.floor(Math.random() * GENERIC_WISHES.length)];
    const template = frame.replace('{wish}', wish);
    if (countFreeWords(template) > GENERIC_MAX_WORDS) continue;
    return template.replace('{name}', name).replace('{channel}', channelName);
  }
  return `Chào ${name} vào ${channelName}!`;
}

// ---- Lời chào riêng cho PHÒNG THIỀN (phòng voice bot treo, VOICE_HOME_CHANNEL_ID) ----
// Ai vào phòng này (kể cả người trong VOICE_GREET_USER_IDS) đều nhận lời chào tu tâm dưỡng tính:
// bot ghép ngẫu nhiên "khung chào" + "một câu Phật pháp ngắn". {name} = tên người vào, {channel} = tên phòng.
const MEDITATION_FRAMES = [
  '🪷 A Di Đà Phật, {name} vừa ghé {channel}.',
  '🙏 Chào mừng {name} đến {channel}, xin an tọa và hít thở nhẹ nhàng.',
  '🪷 {name} đã an tọa tại {channel}, nguyện tâm được bình an.',
  '🧘 {name} bước vào {channel}, buông bỏ muộn phiền ngoài cửa nhé.',
  '🙏 Nam Mô A Di Đà Phật, {name} đã đến {channel}.',
];

const MEDITATION_QUOTES = [
  'Tâm bình thì thế giới bình.',
  'Quá khứ đã qua, tương lai chưa đến, hãy sống trọn giây phút này.',
  'Hơi thở vào, tâm tĩnh lặng. Hơi thở ra, lòng mỉm cười.',
  'Nước lặng mới soi rõ trăng, tâm lặng mới thấy rõ mình.',
  'Vạn pháp vô thường, được mất cũng chỉ như mây bay.',
  'Buông bỏ không phải là mất đi, mà là nhẹ lòng.',
  'Hận thù không dập tắt được hận thù, chỉ có từ bi mới làm được.',
  'Biết đủ là đủ, tham muốn là khổ.',
  'Gieo nhân lành, gặt quả ngọt.',
  'Phiền não vốn không, chỉ do tâm khởi lên.',
  'Một niệm nhẫn, trăm điều lành.',
  'Quay đầu là bờ.',
  'Cho đi không mất, buông xuống thì nhẹ.',
  'Đừng cầu gió yên sóng lặng, hãy luyện tâm vững giữa phong ba.',
  'Người thắng được mình mới là người thắng lớn nhất.',
  'Sống chậm lại một nhịp, sẽ thấy bình yên nhiều hơn.',
  'Lời hay ý đẹp cũng là một cách bố thí.',
  'Thấy được tâm mình là bắt đầu của giác ngộ.',
];

function buildMeditationGreeting(name, channelName) {
  const frame = MEDITATION_FRAMES[Math.floor(Math.random() * MEDITATION_FRAMES.length)];
  const quote = MEDITATION_QUOTES[Math.floor(Math.random() * MEDITATION_QUOTES.length)];
  return `${frame.replace('{name}', name).replace('{channel}', channelName)}\n*${quote}*`;
}

module.exports = { VOICE_GREET_USER_IDS, VOICE_GREET_MESSAGES, buildGenericGreeting, buildMeditationGreeting };