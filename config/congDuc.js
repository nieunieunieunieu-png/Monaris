// ===== config/congDuc.js — Farm Công Đức (ngồi phòng voice nghe gõ mõ, thắp/đốt hương, Cảnh Giới Phật pháp) =====
// Hai hệ thống điểm SONG SONG: Level (EXP/Điểm HĐ) và Công Đức (Công Đức/Điểm Lòng Thành). Chỉ nối nhau ở "Đốt hương".
// Logic: congDuc/core.js · Sheet: googleSheets/congDucSheet.js. File này chỉ chứa giá trị, không chứa logic.
// ENV (đều tuỳ chọn): CONG_DUC_ENABLED, CONG_DUC_CHANNEL_ID, CONG_DUC_ANNOUNCE_CHANNEL_ID, CONG_DUC_SPREADSHEET_ID, CONG_DUC_SOUND_ID,
//   CONG_DUC_SOUNDS, CONG_DUC_PER_MINUTE, CONG_DUC_DAILY_MAX_MINUTES, CONG_DUC_VOICE_STREAK_MINUTES, CONG_DUC_VOICE_STREAK_MERIT, CONG_DUC_VOICE_STREAK_EXP, CONG_DUC_VOICE_STREAK_DAILY_MAX_MINUTES, CONG_DUC_COUNT_MUTED, CONG_DUC_COUNT_ALONE,
//   CONG_DUC_INCENSE_BASE, CONG_DUC_INCENSE_STREAK_CAP, CONG_DUC_INCENSE_EXP_SCALE, CONG_DUC_INCENSE_PAID_ENABLED,
//   CONG_DUC_FLUSH_MS, CONG_DUC_AUTODELETE_DELAY_MS, CONG_DUC_NOTICE_TTL_MS, CONG_DUC_ROLE_IDS, CONG_DUC_SHOP_PRICE_MULT, CONG_DUC_SHOP_PRICES, CONG_DUC_WEEK_SHEET_NAME, CONG_DUC_MONTH_SHEET_NAME

const bool = (v, def) => {
  const s = String(v === undefined || v === '' ? def : v).trim();
  return !/^(0|false|off|no)$/i.test(s);
};
const num = (v, def, { min = -Infinity, int = false } = {}) => {
  const n = Number(v);
  if (v === undefined || v === '' || !Number.isFinite(n) || n < min) return def;
  return int ? Math.floor(n) : n;
};

// Công Đức đã được gỡ khỏi phiên Monaris này: giữ config để các module cũ không lỗi import.
const CONG_DUC_ENABLED = false;
const CONG_DUC_CHANNEL_ID = process.env.CONG_DUC_CHANNEL_ID || '';
// Khởi động bot: gửi lại tin Sảnh mới (xoá tin cũ) cho nằm cuối kênh. ENV CONG_DUC_HALL_RESEND_ON_START=false để giữ tin cũ.
const CONG_DUC_HALL_RESEND_ON_START = bool(process.env.CONG_DUC_HALL_RESEND_ON_START, 'true');
const CONG_DUC_ANNOUNCE_CHANNEL_ID = process.env.CONG_DUC_ANNOUNCE_CHANNEL_ID !== undefined ? process.env.CONG_DUC_ANNOUNCE_CHANNEL_ID : CONG_DUC_CHANNEL_ID;
// Mặc định dùng chung spreadsheet Level (đặt trong config/level.js); đọc trực tiếp ENV để file này không phụ thuộc thứ tự nạp.
const CONG_DUC_SPREADSHEET_ID = process.env.CONG_DUC_SPREADSHEET_ID || process.env.LEVEL_SPREADSHEET_ID || process.env.GOOGLE_SHEET_ID || '';
const CONG_DUC_SHEET_NAME = process.env.CONG_DUC_SHEET_NAME || 'Công Đức';
const CONG_DUC_CONFIG_SHEET_NAME = process.env.CONG_DUC_CONFIG_SHEET_NAME || 'Cấu Hình Công Đức';
const CONG_DUC_LEDGER_SHEET_NAME = process.env.CONG_DUC_LEDGER_SHEET_NAME || 'Lịch Sử Lòng Thành';
const CONG_DUC_WEEK_SHEET_NAME = process.env.CONG_DUC_WEEK_SHEET_NAME || 'Mốc Công Đức Tuần';
const CONG_DUC_MONTH_SHEET_NAME = process.env.CONG_DUC_MONTH_SHEET_NAME || 'Mốc Công Đức Tháng';

// ----- Tích Công Đức khi ngồi phòng voice bot treo -----
const CONG_DUC_PER_MINUTE = num(process.env.CONG_DUC_PER_MINUTE, 60, { min: 0, int: true }); // 1 giây = 1 Công Đức, ghi mỗi phút 1 lần
const CONG_DUC_DAILY_MAX_MINUTES = num(process.env.CONG_DUC_DAILY_MAX_MINUTES, 0, { min: 0, int: true }); // trần phút/ngày giờ VN; 0 = KHÔNG giới hạn (mặc định)
// Ngồi liên tục đủ CONG_DUC_VOICE_STREAK_MINUTES phút (mặc định 60) thì THƯỞNG THÊM, lặp lại mỗi giờ liên tục tiếp theo. 0 = tắt.
// Thưởng thiền trả bằng CÔNG ĐỨC (CONG_DUC_VOICE_STREAK_MERIT, mặc định 888), KHÔNG còn trả bằng EXP Level: bản cũ cho 888 EXP/giờ không trần
// (treo 24h = ~21.000 EXP/ngày, trong khi chat thường ~100-300/ngày, voice thường tối đa 300/ngày) nên người treo vượt cấp rất nhanh.
// CONG_DUC_VOICE_STREAK_EXP (mặc định 0 = TẮT) vẫn còn để bật lại EXP nếu muốn; nếu bật thì nên đặt thấp (vd 50) vì EXP này cộng thẳng vào cấp.
// CONG_DUC_VOICE_STREAK_DAILY_MAX_MINUTES (mặc định 0 = không trần): > 0 thì chỉ thưởng khi số phút ngồi phòng treo TRONG NGÀY (giờ VN, cột "phút hôm nay" tab Công Đức, nên không mất khi restart) còn dưới mức đó.
const CONG_DUC_VOICE_STREAK_MINUTES = num(process.env.CONG_DUC_VOICE_STREAK_MINUTES, 60, { min: 0, int: true });
const CONG_DUC_VOICE_STREAK_MERIT = num(process.env.CONG_DUC_VOICE_STREAK_MERIT, 888, { min: 0, int: true });
const CONG_DUC_VOICE_STREAK_EXP = num(process.env.CONG_DUC_VOICE_STREAK_EXP, 0, { min: 0 });
const CONG_DUC_VOICE_STREAK_DAILY_MAX_MINUTES = num(process.env.CONG_DUC_VOICE_STREAK_DAILY_MAX_MINUTES, 0, { min: 0, int: true });
const CONG_DUC_COUNT_MUTED = bool(process.env.CONG_DUC_COUNT_MUTED, 'true'); // mute mic vẫn tính (deaf thì không)
const CONG_DUC_COUNT_ALONE = bool(process.env.CONG_DUC_COUNT_ALONE, 'true'); // ngồi 1 mình với bot vẫn tính
const CONG_DUC_TICK_MS = 60_000;
const CONG_DUC_FLUSH_MS = num(process.env.CONG_DUC_FLUSH_MS, 30_000, { min: 1000, int: true });

// ----- Thắp hương miễn phí (chuỗi ngày) -----
const CONG_DUC_INCENSE_BASE = num(process.env.CONG_DUC_INCENSE_BASE, 50, { min: 0, int: true });
const CONG_DUC_INCENSE_STREAK_CAP = num(process.env.CONG_DUC_INCENSE_STREAK_CAP, 0, { min: 0, int: true }); // 0 = không giới hạn

// ----- Đốt hương (tốn Điểm HĐ -> EXP Level + Công Đức). Phần trăm tính trên số điểm đã tốn. -----
const CONG_DUC_INCENSE_PAID_ENABLED = bool(process.env.CONG_DUC_INCENSE_PAID_ENABLED, 'true');
const CONG_DUC_INCENSE_EXP_SCALE = num(process.env.CONG_DUC_INCENSE_EXP_SCALE, 1, { min: 0 });
const CONG_DUC_INCENSE_TIERS = [
  { cost: 5, expMinPct: 180, expMaxPct: 200, cdMinPct: 100, cdMaxPct: 200 },
  { cost: 10, expMinPct: 170, expMaxPct: 190, cdMinPct: 150, cdMaxPct: 300 },
  { cost: 20, expMinPct: 150, expMaxPct: 180, cdMinPct: 200, cdMaxPct: 400 },
  { cost: 30, expMinPct: 140, expMaxPct: 170, cdMinPct: 300, cdMaxPct: 600 },
  { cost: 50, expMinPct: 120, expMaxPct: 150, cdMinPct: 400, cdMaxPct: 700 },
  { cost: 75, expMinPct: 110, expMaxPct: 140, cdMinPct: 600, cdMaxPct: 900 },
  { cost: 100, expMinPct: 100, expMaxPct: 130, cdMinPct: 700, cdMaxPct: 1000 },
];
const CONG_DUC_PREMIUM_TOP_FRACTION = 0.2; // roll Công Đức nằm trong 20% cao nhất của khoảng -> "Thượng phẩm"

// ----- Cảnh Giới: mốc theo TỔNG Công Đức (neo theo đường cong Level × 60) -----
const CONG_DUC_REALMS = [
  { name: 'Phàm Phu', from: 0 },
  { name: 'Cư Sĩ', from: 24_000 },
  { name: 'Sa Di', from: 125_000 },
  { name: 'Tỳ Kheo', from: 380_000 },
  { name: 'Tu Đà Hoàn', from: 850_000 },
  { name: 'Tư Đà Hàm', from: 1_600_000 },
  { name: 'A Na Hàm', from: 2_600_000 },
  { name: 'A La Hán', from: 5_400_000 },
  { name: 'Bồ Tát', from: 7_300_000 },
  { name: 'Phật', from: 9_400_000 },
];
// ----- Dâng Lòng Thành nâng cấp khung + avatar Công Đức (congDuc/upgrade.js) -----
// Thay cho Cảnh Giới: khung và avatar nâng TÁCH RIÊNG, mỗi bên 9 lần nâng (bậc 1 -> 10). Phần tử i = giá (Điểm Lòng Thành) để nâng từ bậc i+1 lên bậc i+2.
// Mặc định lấy theo mốc Cảnh Giới cũ. ENV (tuỳ chọn) CONG_DUC_UPGRADE_COSTS="24000,125000,..." (đúng 9 số) để ghi đè.
const CONG_DUC_UPGRADE_COSTS_DEFAULT = [24_000, 125_000, 380_000, 850_000, 1_600_000, 2_600_000, 5_400_000, 7_300_000, 9_400_000];
const CONG_DUC_UPGRADE_COSTS = (() => {
  const list = String(process.env.CONG_DUC_UPGRADE_COSTS || '').split(',').map((x) => Number(x.trim()));
  return list.length === CONG_DUC_UPGRADE_COSTS_DEFAULT.length && list.every((n) => Number.isFinite(n) && n >= 0) ? list.map(Math.round) : CONG_DUC_UPGRADE_COSTS_DEFAULT;
})();
const CONG_DUC_UPGRADE_KINDS = ['khung', 'avatar']; // 2 loại nâng, mỗi loại có bậc riêng
const CONG_DUC_UPGRADE_MAX_TIER = CONG_DUC_UPGRADE_COSTS.length + 1; // 10

// Role theo cảnh giới (tuỳ chọn, mặc định TẮT): CONG_DUC_ROLE_IDS=Cư Sĩ=<id>,Sa Di=<id>,...
const CONG_DUC_ROLE_IDS = {};
for (const piece of String(process.env.CONG_DUC_ROLE_IDS || '').split(',')) {
  const i = piece.lastIndexOf('=');
  if (i < 0) continue;
  const name = piece.slice(0, i).trim();
  const id = piece.slice(i + 1).trim();
  if (name && /^\d{5,}$/.test(id)) CONG_DUC_ROLE_IDS[name] = id;
}

// ----- Kênh Sảnh: tự dọn tin -----
const CONG_DUC_AUTODELETE_DELAY_MS = num(process.env.CONG_DUC_AUTODELETE_DELAY_MS, 0, { min: 0, int: true });
const CONG_DUC_NOTICE_TTL_MS = num(process.env.CONG_DUC_NOTICE_TTL_MS, 0, { min: 0, int: true }); // 0 = giữ mãi
const CONG_DUC_CLEAN_SWEEP_MS = 10 * 60_000;

// ----- Âm thanh "Cốc Cốc" (auto sound emote) -----
// Nhiều âm, mỗi âm có chu kỳ riêng (phút). Khi nhiều âm trùng giờ -> chỉ phát âm có chu kỳ DÀI nhất, các âm ngắn hơn bỏ qua lượt đó (xem congDuc/sound.js).
// Mốc giờ tính theo đồng hồ (số phút kể từ epoch) nên không bị lệch khi bot restart.
// ENV (tuỳ chọn): CONG_DUC_SOUNDS="id=phút,id=phút,..." để ghi đè danh sách mặc định bên dưới.
const CONG_DUC_SOUNDS_DEFAULT = [];
const CONG_DUC_SOUNDS = [];
for (const piece of String(process.env.CONG_DUC_SOUNDS || '').split(',')) {
  const [id, v] = piece.split('=').map((x) => (x || '').trim());
  const n = Number(v);
  if (/^\d{5,}$/.test(id || '') && Number.isFinite(n) && n >= 1) CONG_DUC_SOUNDS.push({ id, everyMin: Math.round(n) });
}
if (!CONG_DUC_SOUNDS.length) CONG_DUC_SOUNDS.push(...CONG_DUC_SOUNDS_DEFAULT);
CONG_DUC_SOUNDS.sort((a, b) => b.everyMin - a.everyMin); // dài nhất trước = ưu tiên cao nhất
const CONG_DUC_SOUND_ID = (CONG_DUC_SOUNDS[CONG_DUC_SOUNDS.length - 1]?.id || ''); // giữ để tương thích (âm ngắn nhất)
const CONG_DUC_SOUND_GUILD_ID = process.env.CONG_DUC_SOUND_GUILD_ID || ''; // chỉ cần nếu âm không thuộc server này (source_guild_id)

// ----- Cửa hàng Công Đức (giá = giá shop Level × MULT) -----
// Thành tựu Công Đức trên /hoso (cùng cách tính với LEVEL_ACHIEVEMENTS: 5 bậc Đồng → Kim Cương; chỉ hiện khi bật HOSO_SHOW_ACHIEVEMENTS).
// from = trường của hồ sơ Công Đức ('total' tổng Công Đức · 'bestStreak' chuỗi thắp hương dài nhất); mốc Công Đức neo theo Cảnh Giới: Cư Sĩ, Tỳ Kheo, Tư Đà Hàm, A La Hán, Phật.
const CONG_DUC_ACHIEVEMENTS = [
  { key: 'cd_realm', label: 'Công Đức', from: 'total', tiers: [24000, 380000, 1600000, 5400000, 9400000], suffix: 'Công Đức' },
  { key: 'cd_streak', label: 'Thắp Hương', from: 'bestStreak', tiers: [7, 30, 100, 200, 365], unit: 'days' },
];
const CONG_DUC_SHOP_PRICE_MULT = num(process.env.CONG_DUC_SHOP_PRICE_MULT, 60, { min: 0 });
const CONG_DUC_SHOP_PRICE_OVERRIDE = {};
for (const piece of String(process.env.CONG_DUC_SHOP_PRICES || '').split(',')) {
  const [id, v] = piece.split('=').map((x) => (x || '').trim());
  const n = Number(v);
  if (id && Number.isFinite(n) && n >= 0) CONG_DUC_SHOP_PRICE_OVERRIDE[id] = Math.round(n);
}

// ----- Giờ Hoàng Đạo (congDuc/hoangDao.js): 1 khung 2 tiếng/ngày nhân Công Đức, đổi theo ngày Can Chi (dân gian) để "dồn người" vào giờ đông -----
// Mặc định TẮT (an toàn cho test/môi trường cũ) — bật bằng CONG_DUC_HOANGDAO_ENABLED=true.
// ENV (tuỳ chọn): CONG_DUC_HOANGDAO_ENABLED, CONG_DUC_HOANGDAO_FACTOR (2), CONG_DUC_HOANGDAO_IDEAL_HOUR (20, giờ VN mong muốn nhất để chọn khung),
//   CONG_DUC_HOANGDAO_PEAK_FROM_HOUR (18) / CONG_DUC_HOANGDAO_PEAK_TO_HOUR (23, ưu tiên chọn khung bắt đầu trong [from,to) nếu có),
//   CONG_DUC_HOANGDAO_FIXED ("20-22": ép khung cố định, bỏ qua tính Can Chi — dùng khi admin chỉ muốn 1 khung giờ đơn giản).
const CONG_DUC_HOANGDAO_ENABLED = bool(process.env.CONG_DUC_HOANGDAO_ENABLED, 'false');
const CONG_DUC_HOANGDAO_FACTOR = num(process.env.CONG_DUC_HOANGDAO_FACTOR, 2, { min: 1 });
const CONG_DUC_HOANGDAO_IDEAL_HOUR = num(process.env.CONG_DUC_HOANGDAO_IDEAL_HOUR, 20, { min: 0, int: true });
const CONG_DUC_HOANGDAO_PEAK_FROM_HOUR = num(process.env.CONG_DUC_HOANGDAO_PEAK_FROM_HOUR, 18, { min: 0, int: true });
const CONG_DUC_HOANGDAO_PEAK_TO_HOUR = num(process.env.CONG_DUC_HOANGDAO_PEAK_TO_HOUR, 23, { min: 0, int: true });
const CONG_DUC_HOANGDAO_FIXED = String(process.env.CONG_DUC_HOANGDAO_FIXED || '').trim();

// ----- Quẻ xăm hằng ngày (congDuc/queXam.js): thắp hương xong rút 1 quẻ Thượng Thượng -> Hạ Hạ, quẻ tốt cho buff Công Đức tạm thời -----
// ENV (tuỳ chọn): CONG_DUC_QUEXAM_ENABLED (true), CONG_DUC_QUEXAM_AI_ENABLED (true — cần GEMINI_API_KEY, không có/lỗi thì tự dùng lời sấm có sẵn).
const CONG_DUC_QUEXAM_ENABLED = bool(process.env.CONG_DUC_QUEXAM_ENABLED, 'true');
const CONG_DUC_QUEXAM_AI_ENABLED = bool(process.env.CONG_DUC_QUEXAM_AI_ENABLED, 'true');

// ----- Điểm Sám Hối (samHoi/): chửi tục -> trừ EXP + cộng sám hối; nhận EXP -> sám hối tăng; ngồi phòng voice bot treo = thiền, giảm sám hối -----
// ENV (tuỳ chọn): SAM_HOI_ENABLED, SAM_HOI_PENALTY_EXP (500), SAM_HOI_ADD_ON_SWEAR (500), SAM_HOI_GAIN_RATIO (0.5), SAM_HOI_STACK_PCT (0.1),
//   SAM_HOI_MEDITATE_PER_MIN (30), SAM_HOI_EXP_MULT (0.5: còn sám hối > 0 thì EXP Level + Công Đức thiền nhận được ×0.5), SAM_HOI_NOTICE_TTL_MS (30000, 0 = giữ mãi), SAM_HOI_INCLUDE_MILD (false), SAM_HOI_EXTRA_WORDS (từ/cụm thêm, cách nhau dấu phẩy), SAM_HOI_EXEMPT_IDS
const SAM_HOI_ENABLED = bool(process.env.SAM_HOI_ENABLED, 'true');
const SAM_HOI_PENALTY_EXP = num(process.env.SAM_HOI_PENALTY_EXP, 500, { min: 0 });
const SAM_HOI_ADD_ON_SWEAR = num(process.env.SAM_HOI_ADD_ON_SWEAR, 500, { min: 0 });
const SAM_HOI_GAIN_RATIO = num(process.env.SAM_HOI_GAIN_RATIO, 0.5, { min: 0 });
const SAM_HOI_STACK_PCT = num(process.env.SAM_HOI_STACK_PCT, 0.1, { min: 0 });
const SAM_HOI_MEDITATE_PER_MIN = num(process.env.SAM_HOI_MEDITATE_PER_MIN, 30, { min: 0 });
const SAM_HOI_EXP_MULT = num(process.env.SAM_HOI_EXP_MULT, 0.5, { min: 0 }); // hệ số EXP Level + Công Đức thiền nhận được khi điểm sám hối > 0 (0.5 = giảm 50%; 1 = tắt)
const SAM_HOI_NOTICE_TTL_MS = num(process.env.SAM_HOI_NOTICE_TTL_MS, 30_000, { min: 0, int: true });
const SAM_HOI_INCLUDE_MILD = bool(process.env.SAM_HOI_INCLUDE_MILD, 'false');
const SAM_HOI_EXTRA_WORDS = String(process.env.SAM_HOI_EXTRA_WORDS || '').split(',').map((s) => s.trim()).filter(Boolean);
const SAM_HOI_EXEMPT_IDS = String(process.env.SAM_HOI_EXEMPT_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);

module.exports = {
  SAM_HOI_ENABLED, SAM_HOI_PENALTY_EXP, SAM_HOI_ADD_ON_SWEAR, SAM_HOI_GAIN_RATIO, SAM_HOI_STACK_PCT, SAM_HOI_MEDITATE_PER_MIN, SAM_HOI_EXP_MULT, SAM_HOI_NOTICE_TTL_MS, SAM_HOI_INCLUDE_MILD, SAM_HOI_EXTRA_WORDS, SAM_HOI_EXEMPT_IDS,
  CONG_DUC_ENABLED, CONG_DUC_CHANNEL_ID, CONG_DUC_HALL_RESEND_ON_START, CONG_DUC_ANNOUNCE_CHANNEL_ID, CONG_DUC_SPREADSHEET_ID,
  CONG_DUC_SHEET_NAME, CONG_DUC_CONFIG_SHEET_NAME, CONG_DUC_LEDGER_SHEET_NAME, CONG_DUC_WEEK_SHEET_NAME, CONG_DUC_MONTH_SHEET_NAME,
  CONG_DUC_VOICE_STREAK_MINUTES, CONG_DUC_VOICE_STREAK_MERIT, CONG_DUC_VOICE_STREAK_EXP, CONG_DUC_VOICE_STREAK_DAILY_MAX_MINUTES,
  CONG_DUC_PER_MINUTE, CONG_DUC_DAILY_MAX_MINUTES, CONG_DUC_COUNT_MUTED, CONG_DUC_COUNT_ALONE, CONG_DUC_TICK_MS, CONG_DUC_FLUSH_MS,
  CONG_DUC_INCENSE_BASE, CONG_DUC_INCENSE_STREAK_CAP,
  CONG_DUC_INCENSE_PAID_ENABLED, CONG_DUC_INCENSE_EXP_SCALE, CONG_DUC_INCENSE_TIERS, CONG_DUC_PREMIUM_TOP_FRACTION,
  CONG_DUC_REALMS, CONG_DUC_ROLE_IDS,
  CONG_DUC_UPGRADE_COSTS, CONG_DUC_UPGRADE_KINDS, CONG_DUC_UPGRADE_MAX_TIER,
  CONG_DUC_AUTODELETE_DELAY_MS, CONG_DUC_NOTICE_TTL_MS, CONG_DUC_CLEAN_SWEEP_MS,
  CONG_DUC_SOUNDS, CONG_DUC_SOUND_ID, CONG_DUC_SOUND_GUILD_ID,
  CONG_DUC_SHOP_PRICE_MULT, CONG_DUC_SHOP_PRICE_OVERRIDE, CONG_DUC_ACHIEVEMENTS,
  CONG_DUC_HOANGDAO_ENABLED, CONG_DUC_HOANGDAO_FACTOR, CONG_DUC_HOANGDAO_IDEAL_HOUR,
  CONG_DUC_HOANGDAO_PEAK_FROM_HOUR, CONG_DUC_HOANGDAO_PEAK_TO_HOUR, CONG_DUC_HOANGDAO_FIXED,
  CONG_DUC_QUEXAM_ENABLED, CONG_DUC_QUEXAM_AI_ENABLED,
};
