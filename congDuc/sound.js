// ===== congDuc/sound.js — tiếng "Cốc Cốc" (soundboard) trong phòng voice bot treo =====
// Nhiều âm, mỗi âm một chu kỳ (config CONG_DUC_SOUNDS: 1h / 25p / 10p / 3p). Mỗi phút kiểm tra 1 lần (canh đúng đầu phút), chỉ khi phòng có >= 1 người đang được tích Công Đức.
// Trùng giờ -> chỉ phát âm có chu kỳ DÀI nhất, âm ngắn hơn bỏ qua lượt đó. Cờ chống chạy chồng.
// Thắp/đốt hương, lên cảnh giới KHÔNG phát thêm. Cần quyền Use Soundboard + Speak. Bị Discord từ chối -> ghi 1 dòng log rõ ràng (không lặp lại cùng lỗi), nuốt lỗi.
const client = require('../client');
const { VOICE_HOME_CHANNEL_ID } = require('../config');
const cfg = require('../config/congDuc');

let timer = null;
const TICK_MS = 60_000;
let running = false;
let getEligible = () => 0;
const status = { attempts: 0, ok: 0, lastOkAt: 0, lastError: '', lastVia: '', lastSoundId: '' };
let lastLoggedError = '';

async function sendSound(channel, soundId) {
  const guildId = cfg.CONG_DUC_SOUND_GUILD_ID;
  if (typeof channel.sendSoundboardSound === 'function') {
    try {
      await channel.sendSoundboardSound(guildId ? { soundId, guildId } : { soundId });
      return 'discord.js';
    } catch (error) {
      if (error && (error.status || error.rawError || error.code)) throw error; // lỗi từ Discord (quyền, âm không tồn tại...) -> không thử lại bằng REST
      // lỗi dạng TypeError (khác chữ ký hàm) -> thử REST bên dưới
    }
  }
  const body = { sound_id: soundId };
  if (guildId) body.source_guild_id = guildId;
  await client.rest.post(`/channels/${channel.id}/send-soundboard-sound`, { body });
  return 'rest';
}

// Chọn âm đến hạn ở phút `slot` (số phút kể từ epoch). Danh sách đã sắp chu kỳ dài -> ngắn nên âm đầu tiên khớp chính là âm ưu tiên.
function pickSound(slot, sounds = cfg.CONG_DUC_SOUNDS) {
  for (const s of sounds) if (slot % s.everyMin === 0) return s;
  return null;
}

async function playOnce(slot = Math.floor(Date.now() / TICK_MS)) {
  if (running) return; // chống chạy chồng
  running = true;
  try {
    if (!require('../features').isEnabled('congduc') || getEligible() < 1) return;
    const picked = pickSound(slot);
    if (!picked) return;
    const channel = await client.channels.fetch(VOICE_HOME_CHANNEL_ID).catch(() => null);
    if (!channel || !channel.isVoiceBased()) return;
    status.attempts += 1;
    status.lastVia = await sendSound(channel, picked.id);
    status.lastSoundId = picked.id;
    status.ok += 1;
    status.lastOkAt = Date.now();
    status.lastError = '';
    lastLoggedError = '';
  } catch (error) {
    const msg = error && error.message ? error.message : String(error);
    status.lastError = msg;
    if (msg !== lastLoggedError) { // chỉ log khi lỗi đổi, không spam mỗi lượt
      lastLoggedError = msg;
      console.error(`❌ [công đức] Không phát được tiếng Cốc Cốc (cần quyền Use Soundboard + Speak; bot đang selfDeaf có thể bị Discord từ chối): ${msg}`);
      try { require('../activityLog').logActivity(`⚠️ [công đức] Không phát được tiếng Cốc Cốc: ${msg}`); } catch { /* bỏ qua */ }
    }
  } finally {
    running = false;
  }
}

function start(eligibleFn) {
  if (timer) return;
  getEligible = typeof eligibleFn === 'function' ? eligibleFn : getEligible;
  const arm = () => {
    const now = Date.now();
    const next = (Math.floor(now / TICK_MS) + 1) * TICK_MS + 300; // đầu phút kế tiếp (+300ms để chắc chắn đã sang phút mới)
    timer = setTimeout(() => {
      const slot = Math.floor(Date.now() / TICK_MS);
      playOnce(slot).catch(() => {});
      arm();
    }, next - now);
    if (timer.unref) timer.unref();
  };
  arm();
}

const getSoundStatus = () => ({ ...status });
module.exports = { start, playOnce, pickSound, getSoundStatus };
