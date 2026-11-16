// ===== samHoi/index.js — chửi tục trong chat -> trừ CÔNG ĐỨC (không trừ EXP) + cộng điểm sám hối =====
// Luật (config/congDuc.js, mục SAM_HOI_*): mỗi TIN trúng từ trong samHoi/words.js (1 tin = 1 lần dù nhiều từ):
//   • trừ SAM_HOI_PENALTY_EXP (500) Công Đức tổng; nếu điểm sám hối còn > 0 thì trừ thêm 10% số sám hối đang có;
//   • cộng SAM_HOI_ADD_ON_SWEAR (500) điểm sám hối.
// Nhận EXP -> sám hối +½ EXP (congDuc/core.onExpGained, móc qua level/expHooks.js). Thiền (ngồi phòng voice bot treo) -> −30/phút (congDuc/voice.js).
// Chỉ tính tin MỚI (sửa tin không bị phạt thêm). Level chưa nạp / Công Đức chưa nạp -> bỏ qua hẳn (không phạt, không cộng sám hối).
const { Events } = require('discord.js');
const client = require('../client');
const { DISCORD_GUILD_ID } = require('../config');
const cfg = require('../config/congDuc');
const { isBotReady } = require('../utils/readyGate');
const core = require('../congDuc/core');
const { silentPayload } = require('../congDuc/send');
const { findSwear } = require('./words');

const fmt = (n) => Number(n || 0).toLocaleString('vi-VN', { maximumFractionDigits: 2 });

// Thuần-ish: xử lý 1 tin đã biết là có từ tục. Trả { taken, penalty, repentBefore, repentAfter } hoặc null nếu bỏ qua.
function applyPenalty(userId, name) {
  if (!core.isLoaded()) return null;
  // Phạt vào CÔNG ĐỨC (không đụng EXP/Level/Điểm HĐ).
  const { penalty, repentBefore, repentAfter, rec } = core.registerSwear(userId, name);
  const taken = core.deductMerit(rec, penalty);
  return { taken, penalty, repentBefore, repentAfter };
}

function noticeText(userId, res) {
  const extra = res.repentBefore > 0 ? ` (đang còn ${fmt(res.repentBefore)} điểm sám hối nên bị trừ thêm)` : '';
  const short = res.taken < res.penalty ? ` (Công Đức chỉ còn đủ để trừ ${fmt(res.taken)})` : '';
  return `🪷 A Di Đà Phật, <@${userId}> vừa buông lời không đẹp: **−${fmt(res.taken)} Công Đức**${extra}${short}, **+${fmt(cfg.SAM_HOI_ADD_ON_SWEAR)}** điểm sám hối (hiện ${fmt(res.repentAfter)}). Ngồi thiền ở phòng voice có bot để giảm ${fmt(cfg.SAM_HOI_MEDITATE_PER_MIN)} điểm mỗi phút.`;
}

async function onMessage(message) {
  try {
    if (!require('../features').isEnabled('samhoi')) return;
    if (!message || !message.author || message.author.bot || !message.guildId || message.guildId !== DISCORD_GUILD_ID) return;
    if (cfg.SAM_HOI_EXEMPT_IDS.includes(message.author.id)) return;
    if (!isBotReady()) return;
    const word = findSwear(message.content);
    if (!word) return;
    const name = (message.member && message.member.displayName) || message.author.globalName || message.author.username;
    const res = applyPenalty(message.author.id, name);
    if (!res) return;
    try { require('../activityLog').logActivity(`🪷 [sám hối] <@${message.author.id}> chửi tục ("${word}") ở <#${message.channelId}>: −${fmt(res.taken)} Công Đức, +${fmt(cfg.SAM_HOI_ADD_ON_SWEAR)} sám hối`); } catch { /* bỏ qua */ }
    const sent = await message.channel.send(silentPayload({ content: noticeText(message.author.id, res), reply: { messageReference: message.id, failIfNotExists: false } })).catch(() => null);
    if (sent && cfg.SAM_HOI_NOTICE_TTL_MS > 0) setTimeout(() => { sent.delete().catch(() => {}); }, cfg.SAM_HOI_NOTICE_TTL_MS).unref();
  } catch (error) {
    console.error('[sám hối] Lỗi xử lý tin:', error && error.message ? error.message : error);
  }
}

let started = false;
function startSamHoi() {
  if (started || !cfg.CONG_DUC_ENABLED) return; // luôn đăng ký listener; bật/tắt thật bằng features.isEnabled('samhoi') trong onMessage
  started = true;
  client.on(Events.MessageCreate, onMessage);
  console.log('Started Sám Hối (chửi tục -> trừ Công Đức, cộng điểm sám hối).');
}

module.exports = { startSamHoi, applyPenalty, noticeText, findSwear };
