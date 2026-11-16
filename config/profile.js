// ===== config/profile.js — Hồ Sơ Cá Nhân (ảnh bìa + avatar + biệt danh trên thẻ /level) =====
// Dùng chung spreadsheet với kho ảnh (NM_IMAGE_SPREADSHEET_ID), tab riêng "Hồ Sơ Cá Nhân" (bot tự tạo).
// Ảnh đã xử lý (cắt/nén) lưu 1 lần lên Cloudinary (thư mục nm_profile, chế độ riêng tư như kho ảnh) — mỗi người 1 bìa + 1 avatar.
//   PROFILE_ENABLED=false               : tắt cả tính năng (mặc định bật)
//   PROFILE_MIN_LEVEL=5                 : cấp tối thiểu để dùng /profile
//   PROFILE_IMAGE_COOLDOWN_SECONDS=300  : khoảng nghỉ giữa 2 lần đổi ảnh (chống spam upload)
//   PROFILE_MAX_UPLOAD_MB=8             : dung lượng ảnh tối đa nhận vào
//   PROFILE_NICKNAME_MAX=24             : độ dài biệt danh tối đa
//   PROFILE_KIMLAN_NAME_MAX=32          : độ dài tên Kim Lan tối đa (ô nhập trong nút 💞 Quan hệ của /profile)
//   PROFILE_FRAME_UNLOCK=tutien=10,kiemhiep=20 : KHOÁ khung theo cấp — cấp tối thiểu để dùng từng phong cách khung /hoso (id: tutien, kiemhiep, vutru, congnghe, linhvat; 'macdinh' luôn mở).
//                                         Để trống (mặc định) = không khoá. Áp dụng cả lúc chọn (Discord + web) lẫn lúc vẽ thẻ: tụt dưới cấp mở khoá thì phần đó tự về mặc định.
//   PROFILE_FRAME_AUTO=0=macdinh,10=tutien,... : TỰ CHỌN khung theo cấp — thang "từ cấp N dùng phong cách X" cho lựa chọn 🎚️ Tự động theo cấp (người dùng tự bật trong từng ô chọn khung).
//                                         Mặc định: 0 macdinh · 10 tutien · 20 kiemhiep · 30 vutru · 40 congnghe · 50 linhvat. Đặt 'off' để ẩn lựa chọn tự động.
const PROFILE_ENABLED = !/^(0|false|off|no)$/i.test(String(process.env.PROFILE_ENABLED || 'true').trim());
const PROFILE_SHEET_NAME = 'Hồ Sơ Cá Nhân';
const PROFILE_MIN_LEVEL = Number.isFinite(Number(process.env.PROFILE_MIN_LEVEL)) && process.env.PROFILE_MIN_LEVEL !== '' ? Number(process.env.PROFILE_MIN_LEVEL) : 5;
const PROFILE_IMAGE_COOLDOWN_SECONDS = process.env.PROFILE_IMAGE_COOLDOWN_SECONDS === undefined || process.env.PROFILE_IMAGE_COOLDOWN_SECONDS === '' ? 300 : Math.max(0, Number(process.env.PROFILE_IMAGE_COOLDOWN_SECONDS) || 0);
const PROFILE_MAX_UPLOAD_MB = Number(process.env.PROFILE_MAX_UPLOAD_MB) || 8;
const PROFILE_NICKNAME_MAX = Number(process.env.PROFILE_NICKNAME_MAX) || 24;
const PROFILE_KIMLAN_NAME_MAX = Number(process.env.PROFILE_KIMLAN_NAME_MAX) || 32;


// "a=1,b=2" -> [['a','1'],['b','2']] (bỏ cặp thiếu vế); dùng cho 2 biến khung bên dưới.
const parsePairs = (raw) =>
  String(raw || '')
    .split(',')
    .map((s) => s.split('=').map((x) => x.trim()))
    .filter((kv) => kv.length === 2 && kv[0] && kv[1]);

// Khoá khung theo cấp: { idPhongCách: cấpTốiThiểu }. Trống = không khoá phong cách nào.
const FRAME_UNLOCK_LEVELS = {};
for (const [id, lv] of parsePairs(process.env.PROFILE_FRAME_UNLOCK)) {
  const n = Number(lv);
  if (Number.isFinite(n) && n > 0) FRAME_UNLOCK_LEVELS[id] = Math.floor(n);
}

// Thang tự chọn khung theo cấp: [{ min, id }] tăng dần theo min. 'off' (hoặc rỗng sau khi lọc) = tắt lựa chọn tự động.
const FRAME_AUTO_DEFAULT = '0=macdinh,10=tutien,20=kiemhiep,30=vutru,40=congnghe,50=linhvat';
const frameAutoRaw = process.env.PROFILE_FRAME_AUTO === undefined || process.env.PROFILE_FRAME_AUTO.trim() === '' ? FRAME_AUTO_DEFAULT : process.env.PROFILE_FRAME_AUTO;
const FRAME_AUTO_LADDER = /^(0|false|off|no)$/i.test(frameAutoRaw.trim())
  ? []
  : parsePairs(frameAutoRaw)
      .map(([min, id]) => ({ min: Number(min), id }))
      .filter((s) => Number.isFinite(s.min) && s.min >= 0)
      .sort((a, b) => a.min - b.min);

module.exports = { PROFILE_ENABLED, PROFILE_SHEET_NAME, PROFILE_MIN_LEVEL, PROFILE_IMAGE_COOLDOWN_SECONDS, PROFILE_MAX_UPLOAD_MB, PROFILE_NICKNAME_MAX, PROFILE_KIMLAN_NAME_MAX, FRAME_UNLOCK_LEVELS, FRAME_AUTO_LADDER };
