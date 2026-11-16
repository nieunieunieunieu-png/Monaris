const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

// Chỉ dùng cho 1 server Discord duy nhất -> KHÔNG cần phân biệt "server
// gốc" với "server khác" nữa, help luôn hiện TOÀN BỘ danh sách lệnh. Cờ
// `global` trên từng dòng bên dưới không còn tác dụng lọc gì cả (giữ lại
// data cho gọn, không phải xóa từng dòng), chỉ còn ý nghĩa ghi chú.
const HELP_ENTRIES = [
  { text: '`/monaris` hoặc `mon!about` — Giới thiệu Monaris và các lệnh bắt đầu', global: true },
  { text: '`moe [@user]` — Gửi gif moe moe kyun ngẫu nhiên', global: true },
  { text: '`mon!tlmn <nội dung>` hoặc `/tlmn` — Thay lời muốn nói: bot đăng nội dung/ảnh của bạn, không hiện ai đã gửi (cần role Bông hoặc được cấp quyền qua `role Bông`)' },
  { text: '`mon!tlmn <ID tin nhắn> <nội dung>` hoặc `/tlmn reply_id:<ID>` — Bot trả lời thay vào đúng tin nhắn đó (cần role Bông hoặc được cấp quyền qua `role Bông`)' },
  { text: '`mon!ai @user` hoặc reply rồi gõ `mon!ai` — Tra cứu Ingame game name của ai đó từ thông tin đã cập nhật trong bảng Bang. Nếu chưa biết thì bot báo: "Tag user là ai, mình chưa biết. Bảo bạn cập nhật thông tin đi mới biết"', global: true },
  { text: '`mon!kienthuc [reload | test <câu hỏi>]` — Xem kho kiến thức game của AI (tab Sheet "Kiến thức bang"): số mục + danh sách chủ đề; `reload` đọc lại Sheet ngay; `test` xem câu hỏi khớp mục nào (Bông)' },
  { text: 'Hỏi kiến thức bang — gõ từ khoá của 1 mục kèm dấu `?` ở CUỐI câu (vd `cửu linh build pvp ?`), bot trả lời theo kho kiến thức; thêm `bot,` ở đầu (vd `bot, tên chủ đề ?`) thì bot luôn trả lời, chưa có thông tin sẽ nói thẳng. Mục nào có ảnh thì bot gửi kèm ảnh. Bấm nút "🔎 Tra Cứu" ở menu trong kênh Hub để xem danh sách chủ đề (và ảnh) bot đang biết', global: true },
  { text: '`mon!poll <ID tin nhắn | link tin nhắn>` (hoặc reply vào tin poll rồi gõ `mon!poll`) — Đọc poll của Discord: lấy ID + Ingame + Hệ phái người đã bình chọn theo từng đáp án, lưu vào Google Sheet (mỗi poll 1 tab, tên tab = tiêu đề poll); chat chỉ báo đã xong (Bông)' },
  { text: '`mon!spam [số ngày]` — Tổng kết người spam tin giống nhau (mặc định hôm nay, vd `mon!spam 7`) từ tab "Spam Chat". Chống spam chỉ chạy ở 1 kênh: 2 tin giống nhau trong 5 phút -> bot cảnh báo, từ tin thứ 3 bị cấm chat 3 phút (Bông)' },
  { text: '`mon!backup [info]` —Sao lưu ngay các Google Sheet của bot sang folder Drive (tự chạy hằng ngày lúc 4h sáng); `info` xem trạng thái (Bông)' },
  { text: '`bot dịch [ngôn ngữ], <câu cần dịch>` (vd `bot dịch anh, xin chào`; bỏ ngôn ngữ = tiếng Việt) — hoặc reply vào 1 tin rồi gõ `bot dịch [ngôn ngữ]` — hoặc `/translate noi_dung:<nội dung> [ngon_ngu:<ngôn ngữ>]` — Nhờ AI dịch sang ngôn ngữ bất kỳ', global: true },
  { text: '`mon!saveimg <tên>` (kèm 1 ảnh đính kèm) hoặc `/saveimg` — Lưu 1 ảnh vào kho ảnh chung, đặt tên để lấy lại sau này', global: true },
  { text: '`mon!send_img <tên hoặc ID ảnh> [| nội dung thêm] [@ai đó] [ID tin nhắn]` hoặc `/send_img` (kèm `noi_dung`/`nguoi_nhan`/`reply_id` không bắt buộc) — Gửi lại 1 ảnh đã lưu vào chat, có thể kèm chữ, tag thật 1 người (sẽ ping) và/hoặc rep vào 1 tin nhắn cụ thể (gõ tay: reply sẵn 1 tin nhắn khi gõ lệnh cũng tự rep lại đúng tin đó)', global: true },
  { text: '`mon!viewlistimg` hoặc `/viewlistimg` — Xem danh sách tên ảnh đã lưu trong kho', global: true },
  { text: '`mon!level [@user]` hoặc `/level [nguoi]` — Xem thẻ Cấp độ (ảnh): avatar, cấp, thanh tiến độ, hạng tổng, EXP tổng, EXP tuần này kiếm được, chuỗi ngày, hệ phái của bạn hoặc của người khác', global: true },
  { text: '`mon!toplevel [tuan]` hoặc `/toplevel [loai]` — Bảng xếp hạng Cấp độ/EXP (Top 10, mặc định theo tổng; chọn `tuần` để xem EXP tuần này) + Top hoạt động sôi nổi nhất', global: true },
  { text: '`mon!topstreak` hoặc `/topstreak` — Bảng xếp hạng chuỗi ngày hoạt động liên tiếp đang có (Top 10, kèm emote hệ phái) + Top 5 kỷ lục chuỗi mọi thời đại', global: true },
  { text: '`mon!expinfo` hoặc `/expinfo` — Xem cách tích EXP (mỗi hoạt động được bao nhiêu) và EXP cần để lên từng cấp', global: true },
  { text: '`/levelnotify [che_do]` — Tự bật/tắt thông báo lên cấp & chuỗi ngày của bạn trong kênh (bỏ trống = đảo trạng thái; phản hồi chỉ hiện cho bạn; bản `mon!profile` hiện công khai nhưng chỉ bạn bấm được nút, tự gỡ nút sau 15 phút)', global: true },
  { text: '`mon!nhacstreak [bat|tat|xem]` hoặc `/nhacstreak [che_do]` — Bật/tắt/xem nhắc streak qua DM khi chuỗi ngày hoạt động của bạn sắp đứt (mặc định TẮT; chỉ DM khi chuỗi đủ dài (mặc định từ 3 ngày), hôm nay chưa có EXP, từ 20:00 giờ VN)', global: true },
  { text: '`mon!profile` hoặc `/profile` — Mở hồ sơ của bạn (thẻ `/level` + nút bấm) để đặt biệt danh, ảnh bìa, avatar riêng, ảnh nền hồ sơ cho thẻ `/hoso`, tự chọn 1 thành tựu (nút 🏅 Thành tựu, tên kiếm hiệp) để đeo trên thẻ, và ghép khung thẻ + khung avatar (nút 🧩 Khung thẻ: chọn 1 bộ khung + 1 bộ avatar, hoặc 🎚️ theo level; một số khung mở theo cấp) (cần đạt cấp 5; không đặt biệt danh thì dùng tên ingame, không có thì tên Discord; chỉ hiện cho bạn)', global: true },
  { text: '`mon!profilexoa <@người/ID>` hoặc `/profilexoa <nguoi>` — Gỡ toàn bộ hồ sơ tuỳ chỉnh (biệt danh, bìa, avatar, ảnh nền hồ sơ) của 1 thành viên (Bông)' },
  { text: '`mon!hoso [@user]` (hoặc `mon!hồ sơ`) hoặc `/hoso [nguoi]` — Thẻ Hồ Sơ Thành Viên: cấp độ + chuỗi ngày, Thí Kiếm, kỷ lục Bang Chiến, hoạt động (tin nhắn/ảnh/bài thảo luận/voice), thành tựu, hệ phái của bạn hoặc người khác', global: true },
  { text: '`mon!levelsync` hoặc `/levelsync` — Đồng bộ lại role theo cấp độ cho toàn bộ thành viên (Bông)' },
  { text: '`/status` — Xem tình trạng bot: RAM, uptime, lỗi Google Sheet, lần ghi EXP (Bông; chỉ hiện cho bạn)' },
  { text: '`mon!expadd <@người|ID> <±EXP> <lý do>` hoặc `/expadd` — Cộng/trừ EXP thủ công cho 1 thành viên, ghi log kèm lý do (CHỈ admin). Mặc định KHÔNG đổi Điểm HĐ; thêm `+diem` cuối lý do (hoặc chọn `doi_diem_hd` ở slash) để đổi luôn' },
  { text: '`mon!expset <@người|ID> <EXP mới> <lý do>` hoặc `/expset` — Đặt TỔNG EXP của 1 thành viên, ghi log kèm lý do (CHỈ admin)' },
  { text: '`mon!nguodong` hoặc `/nguodong` — Danh sách thành viên "ngủ đông" (còn trong server + tab Bang nhưng lâu không có EXP thật, mặc định 14 ngày); slash chỉ hiện cho bạn (Bông)' },
  { text: '`/toprole` — Xem ai đang giữ role Top tuần / Top tháng, hạn tới khi nào, và đối chiếu bot đã gắn đúng chưa (Bông; chỉ hiện cho bạn)' },
  { text: '`/baocaothang` — Xem báo cáo tháng này (Top EXP / chat / voice, chuỗi ngày) tính đến hiện tại; đầu mỗi tháng bot tự đăng tổng kết tháng trước (Bông)' },
  { text: '`/logtim [nguoi] [tu_khoa] [loai] [ngay] [so_dong]` — Tra nhật ký tin nhắn: ai gửi / sửa / xoá gì (tab "Nhật Ký Tin Nhắn"), chỉ hiện cho bạn (Bông)' },
  { text: '`/setpf [ingame] [class] [biet_danh] [user] [user_id]` — Cập nhật Ingame/Class/Biệt Danh của bạn (ai cũng dùng được), hoặc của người khác qua tag (`user`) hoặc Discord ID (`user_id`, dùng cho người quen KHÔNG có trong server) — set THAY người khác cần role Bông hoặc được cấp quyền qua `role Bông`', global: true },
  { text: '`/setmqh loai nguoi_a nguoi_b` (tag trực tiếp) hoặc `/setmqh loai id_a id_b` (Discord ID số) hoặc `mon!setmqh <idA|@tag> <suphu(sp)|triky(tk)|kimlan(kl)> <idB|@tag hoặc tên kim lan>` (hoặc `mon!setmqh dt<idA>; sp<idB>` cho Sư Phụ/Đệ Tử, cũng nhận @tag) — Set mối quan hệ Sư Phụ / Tri Kỷ (tự đồng bộ 2 chiều) / Kim Lan cho 2 Discord ID. `id_a`/`nguoi_a` PHẢI là chính bạn (chỉ Bông mới set thay được người khác)', global: true },
  { text: '`mon!setchatchannel #kenh` hoặc `/setchatchannel kenh:#kenh` — [Cần quyền Quản lý máy chủ] THÊM kênh vào danh sách kênh bot được trò chuyện (từ khóa, tag bot, "bot ơi, ...") ở server này (có thể set nhiều kênh, gọi lệnh nhiều lần). Server chưa set kênh nào thì bot chat ở bất kỳ kênh nào có người nhắn', global: true },
  { text: '`mon!removechatchannel #kenh` hoặc `/removechatchannel kenh:#kenh` — [Cần quyền Quản lý máy chủ] Bỏ 1 kênh khỏi danh sách kênh chat của server này', global: true },
  { text: '`mon!chatchannels` hoặc `/chatchannels` — Xem danh sách kênh bot đang được phép trò chuyện ở server này', global: true },
  { text: '`/addnotice noi_dung:<nội dung>` — Ai cũng dùng được. Có role Bông thì lưu thẳng luôn; không có role Bông thì tin sẽ được gửi duyệt riêng trước khi đăng. Bot tự động luân phiên đăng các tin đã duyệt vào kênh cố định khi kênh im lặng >30 phút hoặc đã quá 1 tiếng chưa đăng tin nào, đảm bảo mọi tin đều được đăng đủ 1 lượt trước khi lặp lại', global: true },
  { text: '`/removenotice id:<Id>` — Xoá 1 tin khỏi Bảng Tin Monaris theo Id (id cũng được bot in kèm cuối mỗi tin khi đăng, dễ copy). Chỉ Bông, người tạo bot, hoặc chính người đã đăng tin đó mới xoá được', global: true },
  { text: '`mon!viewnotice` hoặc `/viewnotice` — Xem tất cả tin trong Bảng Tin Monaris kèm Id, lần đăng gần nhất, người đăng. Dùng được cả trong DM. Mỗi lần xem sẽ tự đồng bộ lại từ sheet nên cũng tiện để "làm mới" nếu vừa xoá/sửa tay trên sheet', global: true },
  { text: '`mon!testnotice` — [Bông] Gửi thử 1 tin Bảng Tin Monaris ngẫu nhiên vào kênh test, không ảnh hưởng vòng đăng tin thật', global: true },
  { text: '`ping` — Kiểm tra bot còn sống không', global: true },
  { text: '`help` — Xem danh sách lệnh của bot', global: true },
];

// Discord giới hạn 2000 ký tự/tin nhắn — help text gộp lại vượt xa mức đó,
// nên PHẢI chia thành nhiều đoạn (mỗi đoạn <= maxLen) rồi gửi nối tiếp
// nhau, thay vì gửi nguyên 1 chuỗi dài sẽ bị Discord từ chối thẳng
// ("Must be 2000 or fewer in length").
function chunkLines(lines, maxLen = 1900) {
  const chunks = [];
  let current = '';

  for (const line of lines) {
    const candidate = current ? `${current}\n${line}` : line;
    if (candidate.length > maxLen) {
      if (current) chunks.push(current);
      current = line;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);

  return chunks;
}

// Chỉ 1 server duy nhất -> luôn trả về TOÀN BỘ HELP_ENTRIES, tham số
// guildId giữ lại trong chữ ký hàm để chỗ gọi cũ (messageCommands.js,
// getHelpText bên dưới) không cần sửa gì thêm, dù giờ không dùng tới nữa.
function getHelpLinesForGuild() {
  return HELP_ENTRIES.map((entry) => entry.text);
}

function getHelpTextChunksForGuild(guildId) {
  const lines = ['**Danh sách lệnh của bot** (dùng `mon!...` hoặc `/...`):', ...getHelpLinesForGuild(guildId)];
  return chunkLines(lines);
}

// Giữ lại cho code cũ còn gọi getHelpText() không kèm guildId — LƯU Ý:
// chuỗi trả về có thể dài hơn 2000 ký tự, KHÔNG được gửi thẳng vào 1 tin
// nhắn Discord. Nơi gọi cần dùng getHelpTextChunksForGuild() để chia đoạn
// trước khi gửi.
function getHelpText() {
  return getHelpTextChunksForGuild().join('\n\n');
}

const SLASH_COMMANDS = [
  new SlashCommandBuilder()
    .setName('moe')
    .setDescription('Gửi gif moe moe kyun ngẫu nhiên')
    .addUserOption((opt) => opt.setName('user').setDescription('Tag người nhận (tùy chọn)').setRequired(false)),
  new SlashCommandBuilder()
    .setName('ai')
    .setDescription('Tra cứu Ingame game name của ai đó từ thông tin trong bảng Bang')
    .addUserOption((opt) => opt.setName('user').setDescription('Người cần tra cứu').setRequired(true)),
  new SlashCommandBuilder()
    .setName('tlmn')
    .setDescription('[Bông] Thay lời muốn nói — bot đăng nội dung/ảnh của bạn, không hiện ai đã gửi')
    .addStringOption((opt) => opt.setName('noi_dung').setDescription('Nội dung muốn gửi').setRequired(false))
    .addAttachmentOption((opt) => opt.setName('hinh_anh').setDescription('Ảnh đính kèm (tùy chọn)').setRequired(false))
    .addStringOption((opt) => opt.setName('reply_id').setDescription('ID tin nhắn muốn bot trả lời thay (tùy chọn)').setRequired(false)),
  new SlashCommandBuilder()
    .setName('setpf')
    .setDescription('Cập nhật Ingame/Class/Biệt Danh của bạn (hoặc của người khác, kể cả người không có trong server)')
    .addStringOption((opt) => opt.setName('ingame').setDescription('Tên Ingame').setRequired(false))
    .addStringOption((opt) => opt.setName('class').setDescription('Môn phái đang chơi').setRequired(false))
    .addStringOption((opt) => opt.setName('biet_danh').setDescription('Biệt danh thân thiết (ngoài ingame)').setRequired(false))
    .addUserOption((opt) => opt.setName('user').setDescription('Set thay cho người này (tag được, tức đang ở trong server)').setRequired(false))
    .addStringOption((opt) =>
      opt
        .setName('user_id')
        .setDescription('Discord ID của người QUEN KHÔNG có trong server (dùng khi không tag được bằng user)')
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('setmqh')
    .setDescription('Set mối quan hệ trong game (Sư Phụ / Tri Kỷ / Kim Lan) cho 1 Discord ID')
    .addStringOption((opt) =>
      opt.setName('loai').setDescription('Loại mối quan hệ').setRequired(true).addChoices(
        { name: 'Sư Phụ (A nhận B làm sư phụ)', value: 'suphu' },
        { name: 'Tri Kỷ (A - B, tự động 2 chiều)', value: 'triky' },
        { name: 'Kim Lan (B là TÊN kim lan)', value: 'kimlan' }
      )
    )
    .addUserOption((opt) =>
      opt.setName('nguoi_a').setDescription('Người A (tag được, đang ở trong server) — dùng thay cho id_a').setRequired(false)
    )
    .addStringOption((opt) =>
      opt
        .setName('id_a')
        .setDescription('Discord ID của người A — dùng khi không tag được bằng nguoi_a')
        .setRequired(false)
    )
    .addUserOption((opt) =>
      opt
        .setName('nguoi_b')
        .setDescription('Người B (Sư Phụ/Tri Kỷ, tag được) — dùng thay cho id_b. KHÔNG áp dụng cho Kim Lan')
        .setRequired(false)
    )
    .addStringOption((opt) =>
      opt
        .setName('id_b')
        .setDescription('Discord ID của B (Sư Phụ/Tri Kỷ, khi không tag được) — HOẶC TÊN Kim Lan nếu loai = Kim Lan')
        .setRequired(false)
    ),
new SlashCommandBuilder()
    .setName('setchatchannel')
    .setDescription('[Cần quyền Quản lý máy chủ] Thêm 1 kênh vào danh sách kênh bot được phép trò chuyện')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((opt) =>
      opt
        .setName('kenh')
        .setDescription('Kênh muốn thêm vào danh sách chat')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('removechatchannel')
    .setDescription('[Cần quyền Quản lý máy chủ] Bỏ 1 kênh khỏi danh sách kênh bot được phép trò chuyện')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((opt) =>
      opt
        .setName('kenh')
        .setDescription('Kênh muốn bỏ khỏi danh sách chat')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('chatchannels')
    .setDescription('Xem danh sách kênh bot đang được phép trò chuyện ở server này'),
  new SlashCommandBuilder()
    .setName('addnotice')
    .setDescription('Thêm 1 tin vào Bảng Tin Monaris (Bông lưu thẳng, người khác cần duyệt)')
    .addStringOption((opt) =>
      opt.setName('noi_dung').setDescription('Nội dung tin muốn thêm').setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('removenotice')
    .setDescription('Xoá 1 tin khỏi Bảng Tin Monaris theo Id (Bông/người tạo bot/chủ tin)')
    .addStringOption((opt) =>
      opt.setName('id').setDescription('Id của tin muốn xoá (bot in kèm cuối mỗi tin đã đăng)').setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('viewnotice')
    .setDescription('Xem tất cả tin trong Bảng Tin Monaris (tự đồng bộ lại từ sheet)'),
  new SlashCommandBuilder()
    .setName('translate')
    .setDescription('Nhờ AI dịch văn bản (bỏ trống ngôn ngữ = tiếng Việt)')
    .addStringOption((opt) =>
      opt.setName('noi_dung').setDescription('Nội dung cần dịch').setRequired(true).setMaxLength(1500)
    )
    .addStringOption((opt) =>
      opt.setName('ngon_ngu').setDescription('Dịch sang ngôn ngữ nào (vd: tiếng Anh, tiếng Nhật) — mặc định tiếng Việt').setRequired(false).setMaxLength(30)
    ),
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Kiểm tra bot còn sống không'),
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Xem danh sách lệnh của bot'),
].map((cmd) => cmd.toJSON());

module.exports = { getHelpText, getHelpTextChunksForGuild, SLASH_COMMANDS };