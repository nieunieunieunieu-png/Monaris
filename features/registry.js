// ===== features/registry.js — danh sách tính năng VUI/GIẢI TRÍ (không liên quan bang) có công tắc =====
// Mỗi mục:
//   id         : khoá cố định (lưu ở Sheet, web gọi theo id) — KHÔNG đổi sau khi đã dùng.
//   group/name/desc : hiển thị trên web.
//   commands   : chỉ để hiển thị (lệnh liên quan).
//   slash      : tên slash command bị chặn khi tắt (features/gate.js trả "đang tắt" cho người dùng).
//   prefixes   : tiền tố customId của nút/menu/modal bị chặn khi tắt.
//   requires   : id tính năng cha — cha tắt thì con coi như tắt.
//   defaultOn  : trạng thái khi CHƯA từng bấm công tắt (lấy theo ENV cũ để hành vi không đổi).
//   locked     : trả chuỗi lý do nếu bị khoá cứng bằng ENV/khởi động (web không bật được), '' nếu mở.
// Thêm tính năng mới: thêm 1 mục ở đây, rồi gọi require('../features').isEnabled('<id>') ở điểm vào của tính năng đó.

const c = () => require('../config');
const FEATURES = [
  // ---------------------------------------------------------------- Hồ sơ & cấp độ
  {
    id: 'hoso', group: 'Hồ sơ & Cấp độ', name: 'Hồ sơ cá nhân',
    desc: 'Thẻ hồ sơ /hoso, thành tựu kiếm hiệp tự chọn, tuỳ biến /profile (biệt danh, ảnh bìa, khung thẻ, Tri Kỷ), kể cả trang hồ sơ trên web.',
    commands: ['/hoso', '/profile', '/profilexoa', 'mon!hoso', 'mon!profile'],
    slash: ['hoso', 'profile', 'profilexoa'], prefixes: ['profile:'],
    defaultOn: () => c().PROFILE_ENABLED && c().LEVEL_ENABLED,
    locked: () => (c().PROFILE_ENABLED && c().LEVEL_ENABLED ? '' : 'Đang bị tắt cứng bằng ENV PROFILE_ENABLED/LEVEL_ENABLED=false trên Railway.'),
  },
  {
    id: 'shopkhung', group: 'Hồ sơ & Cấp độ', name: 'Cửa hàng khung',
    desc: 'Mua khung thẻ/avatar bằng điểm hoạt động. Tắt chỉ ẩn cửa hàng, khung đã mua vẫn dùng được.',
    commands: ['/shopkhung'], slash: ['shopkhung'], prefixes: ['shop:'],
    defaultOn: () => c().SHOP_ENABLED,
    locked: () => (c().SHOP_ENABLED ? '' : 'Đang bị tắt cứng bằng ENV SHOP_ENABLED=false trên Railway.'),
  },
  {
    id: 'level', group: 'Hồ sơ & Cấp độ', name: 'Xem Level / Top / Streak',
    desc: 'Thẻ /level, bảng /toplevel, /topstreak và nhắc streak qua DM. Tắt chỉ ẩn phần xem và ngừng nhắc; bot VẪN ghi EXP ngầm nên không mất dữ liệu.',
    commands: ['/level', '/toplevel', '/topstreak', '/nhacstreak', 'mon!level', 'mon!toplevel', 'mon!topstreak', 'mon!nhacstreak'],
    slash: ['level', 'toplevel', 'topstreak', 'nhacstreak'], prefixes: [],
    defaultOn: () => c().LEVEL_ENABLED,
    locked: () => (c().LEVEL_ENABLED ? '' : 'Đang bị tắt cứng bằng ENV LEVEL_ENABLED=false trên Railway.'),
  },

  // ---------------------------------------------------------------- Bot trò chuyện
  {
    id: 'aichat', group: 'Bot trò chuyện', name: 'Bot trò chuyện (AI)',
    desc: 'Gọi "bot ơi, …", trả lời khi bị tag hoặc reply, trả lời theo từ khoá và thả react vu vơ. Không đụng tới hỏi kho kiến thức bằng dấu "?" và hỏi lịch scrim.',
    commands: [], slash: [], prefixes: [],
    defaultOn: () => true,
  },
  {
    id: 'chatlich', group: 'Bot trò chuyện', name: 'Chat theo lịch (chào sáng, mốc PvP)',
    desc: 'Câu chào buổi sáng do AI viết và 2 tin nhắc mốc PvP mỗi ngày. Báo tình hình vote scrim không bị ảnh hưởng.',
    commands: [], slash: [], prefixes: [],
    defaultOn: () => true,
  },

  // ---------------------------------------------------------------- Lệnh vui
  {
    id: 'moe', group: 'Lệnh vui', name: 'Lệnh /moe',
    desc: 'Gửi gif moe moe kyun (có thể tag người nhận).',
    commands: ['/moe', 'mon!moe'], slash: ['moe'], prefixes: [],
    defaultOn: () => true,
  },
  {
    id: 'tlmn', group: 'Lệnh vui', name: 'Lệnh /tlmn (gửi tin ẩn danh)',
    desc: 'Nhờ bot đăng tin/ảnh ẩn danh vào kênh (chỉ Bông hoặc người được cấp quyền).',
    commands: ['/tlmn', 'mon!tlmn'], slash: ['tlmn'], prefixes: [],
    defaultOn: () => true,
  },
  {
    id: 'translate', group: 'Lệnh vui', name: 'Dịch nhanh',
    desc: '/translate và "bot dịch …" trong chat.',
    commands: ['/translate', 'bot dịch …'], slash: ['translate'], prefixes: [],
    defaultOn: () => true,
  },

  // ---------------------------------------------------------------- Chào hỏi
  {
    id: 'chaovoice', group: 'Chào hỏi', name: 'Chào khi vào voice',
    desc: 'Bot nhắn 1 câu chào vào chat của phòng voice khi có người vào (kể cả lời chào Phật pháp ở phòng thiền).',
    commands: [], slash: [], prefixes: [],
    defaultOn: () => true,
  },
  {
    id: 'chaothanhvien', group: 'Chào hỏi', name: 'Ảnh chào thành viên mới',
    desc: 'Ảnh chào kiếm hiệp khi có người mới vào server. Việc tự gán role cho người mới KHÔNG bị ảnh hưởng.',
    commands: [], slash: [], prefixes: [],
    defaultOn: () => c().WELCOME_ENABLED,
    locked: () => (c().WELCOME_ENABLED ? '' : 'Đang bị tắt cứng bằng ENV WELCOME_ENABLED=false trên Railway.'),
  },
  {
    id: 'tambietthanhvien', group: 'Chào hỏi', name: 'Ảnh tạm biệt thành viên rời server',
    desc: 'Ảnh + dòng chữ tạm biệt khi có người rời/bị đá khỏi server (cùng kênh với lời chào). Công tắc riêng, độc lập với ảnh chào.',
    commands: [], slash: [], prefixes: [],
    defaultOn: () => c().WELCOME_ENABLED,
    locked: () => (c().WELCOME_ENABLED ? '' : 'Đang bị tắt cứng bằng ENV WELCOME_ENABLED=false trên Railway.'),
  },

  // ---------------------------------------------------------------- Sự kiện & voice
  {
    id: 'tempvoice', group: 'Sự kiện & Voice', name: 'Phòng voice tạm',
    desc: 'Vào kênh cổng thì bot tạo phòng riêng kèm menu điều khiển. Tắt thì kênh cổng không tạo phòng mới (phòng đang có vẫn dùng bình thường).',
    commands: ['mon!menuv'], slash: [], prefixes: [],
    defaultOn: () => true,
  },
  {
    id: 'loveroom', group: 'Sự kiện & Voice', name: 'Phòng Đôi', requires: 'tempvoice',
    desc: 'Phòng 2 người riêng tư, có bảng xếp hạng thời gian các cặp ngồi cùng nhau (mon!topdoi).',
    commands: ['mon!topdoi'], slash: [], prefixes: [],
    defaultOn: () => c().LOVE_ROOM_ENABLED,
    locked: () => (c().LOVE_ROOM_ENABLED ? '' : 'Phòng Đôi có đồng hồ tính phí chạy từ lúc bot khởi động: cần đặt ENV LOVE_ROOM_ENABLED=true và restart bot một lần, sau đó mới bật/tắt được trên web.'),
  },
  // ---------------------------------------------------------------- Bang Chiến
  {
    id: 'vinhdanh', group: 'Bang Chiến', name: 'Sảnh Vinh Danh Bang Chiến',
    desc: 'Bảng "Danh hiệu vinh quang" sau mỗi trận Bang Chiến: Bông cập nhật bằng ảnh, bot đọc ảnh, ghi sheet lịch sử và gắn role Quần Long Chi Chủ. Tắt thì không đăng bảng, ẩn nút ở menu Hub (hiện sau lần khởi động tới), lệnh báo "đang tắt"; dữ liệu cũ vẫn giữ nguyên.',
    commands: ['/vinhdanh', '/xem-vinh-danh', 'mon!vinhdanh'],
    slash: ['vinhdanh', 'xem-vinh-danh'], prefixes: ['vinhdanh_', 'hub:vinh_danh'],
    defaultOn: () => c().VINHDANH_ENABLED,
  },
  {
    id: 'whotagme', group: 'Sự kiện & Voice', name: '/whotagme',
    desc: 'Xem ai đã tag hoặc trả lời bạn trong 6 tiếng gần nhất. Tắt thì bot cũng ngừng ghi lại các lượt tag.',
    commands: ['/whotagme'], slash: ['whotagme'], prefixes: [],
    defaultOn: () => true,
  },
];

module.exports = { FEATURES };
