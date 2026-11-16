// ===== congDuc/index.js — khởi động Farm Công Đức (nạp dữ liệu, tích voice, tiếng Cốc Cốc, Sảnh + nút + slash, tự dọn kênh) =====
// Gọi từ index.js qua deferredStep('startCongDuc', ...) SAU startLevel. Cửa hàng Công Đức (shop.js), Top tuần/tháng (week.js, month.js, period.js), mục Công Đức + thành tựu trên /hoso (hoso/data.js, hoso/achievements.js) và loại EXP hương khỏi Top tháng Level (level/expExclude.js) là Phần 4–5.
const cfg = require('../config/congDuc');
const core = require('./core');
const voice = require('./voice');
const sound = require('./sound');
const state = require('./state');
const realm = require('./realm');
const hall = require('./hall');
const cleaner = require('./cleaner');
const shop = require('./shop');
const week = require('./week');
const month = require('./month');
const expExclude = require('../level/expExclude');
const hoangDao = require('./hoangDao'); // Giờ Hoàng Đạo: 1 khung 2 tiếng/ngày nhân Công Đức (mục 7 backlog)
const queXam = require('./queXam'); // Quẻ xăm hằng ngày: rút sau khi thắp hương (mục 8 backlog)
const interactions = require('./interactions'); // đăng ký listener nút/slash (tự kiểm tra core.isLoaded)

let started = false;

// Gắn hệ số nhân Công Đức (Giờ Hoàng Đạo × buff Quẻ Xăm) vào core.addMerit — qua provider để tránh require vòng
// (core.js không được require thẳng hoangDao.js/queXam.js vì 2 module đó cần gọi lại core.getRecord/addMerit).
if (cfg.CONG_DUC_ENABLED) {
  core.setMeritMultiplierProvider((userId, now) => hoangDao.multiplierNow(now) * queXam.buffMultiplierFor(userId, now));
}

// Đăng ký NGAY khi nạp module (trước khi Level chụp mốc tháng): EXP thưởng đốt hương không được tính vào Top tháng/báo cáo tháng của Level.
if (cfg.CONG_DUC_ENABLED) {
  expExclude.setProvider({ get: (userId) => { const r = core.getRecord(userId, '', { create: false }); return r ? r.bonusExp || 0 : 0; }, isReady: () => core.isLoaded() });
}

// (ĐÃ BỎ) Trước đây nhận EXP -> sám hối tăng ½ EXP khiến người KHÔNG chửi tục vẫn bị dính 0.5 điểm sám hối. Giờ sám hối chỉ tăng khi chửi tục (samHoi/ -> core.registerSwear).
// Còn điểm sám hối (> 0): EXP Level nhận được ×SAM_HOI_EXP_MULT (0.5). Công Đức thiền giảm tương tự ở core.addVoiceMinute.
if (cfg.CONG_DUC_ENABLED) require('../level/expHooks').onBeforeGain((userId, exp) => exp * core.repentFactor(userId));

async function startCongDuc() {
  if (!cfg.CONG_DUC_ENABLED || started) return;
  const n = await core.load(); // ném lỗi nếu Sheet không đọc được -> safeStep của index.js tự bắt/retry
  started = true;
  await state.load().catch((e) => console.error('[công đức] Không đọc được tab cấu hình (sẽ dựng lại Sảnh):', e.message));
  core.startFlushLoop();
  await shop.start(); // nạp sổ Lịch Sử Lòng Thành (lỗi thì cửa hàng tạm khoá, tự thử lại)
  await week.start().catch((e) => console.error('[công đức] Chưa dựng được mốc tuần (sẽ thử lại):', e.message));
  await month.start().catch((e) => console.error('[công đức] Chưa dựng được mốc tháng (sẽ thử lại):', e.message));
  voice.start();
  sound.start(voice.eligibleCount);
  realm.init();
  interactions.setHallRefresh(() => { hall.refresh().catch(() => {}); });
  await hall.start();
  cleaner.start();
  require('../samHoi').startSamHoi(); // chửi tục -> trừ EXP + sám hối (cần Level + Công Đức đã nạp, tự kiểm tra từng tin)
  console.log(`Started Công Đức (${n} người, tích mỗi ${cfg.CONG_DUC_TICK_MS / 1000}s, flush Sheet mỗi ${cfg.CONG_DUC_FLUSH_MS / 1000}s).`);
}

// Khi bot tắt: ghi nốt phần Công Đức còn trong RAM (không tự thoát tiến trình — các handler SIGTERM khác lo việc đó như voiceStats/level).
process.on('SIGTERM', async () => {
  try { await Promise.race([core.flush(), new Promise((resolve) => setTimeout(resolve, 5000))]); }
  catch (error) { console.error('[công đức] Lỗi khi ghi lúc tắt bot:', error.message); }
});

const { CONG_DUC_SLASH_COMMANDS } = require('./view');
module.exports = { startCongDuc, CONG_DUC_SLASH_COMMANDS, getSoundStatus: sound.getSoundStatus, getCleanerStatus: cleaner.getCleanerStatus };
