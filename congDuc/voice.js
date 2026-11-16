// ===== congDuc/voice.js — tích Công Đức cho người ngồi phòng voice bot treo (VOICE_HOME_CHANNEL_ID) =====
// Theo dõi ai ngồi bằng VoiceStateUpdate riêng; 1 vòng setInterval(60s) quét người đang ngồi, mỗi người đủ điều kiện +CONG_DUC_PER_MINUTE vào RAM
// (core.addVoiceMinute) — không timer mỗi giây, không ghi Sheet mỗi phút (core.flush gom lô 30s).
// Chỉ tính người THẬT ở ĐÚNG phòng bot treo, VÀ khi bot thật sự đang kết nối ở đó (bot rớt/bị kéo đi thì tạm ngừng để Công Đức luôn đi cùng tiếng gõ mõ).
// Một người chỉ được tính phút nếu đã ngồi trọn khoảng giữa 2 lần quét (vào giữa phút thì tính từ lần quét sau) -> ra–vào liên tục không ra Công Đức.
const { Events } = require('discord.js');
const { getVoiceConnection, VoiceConnectionStatus } = require('@discordjs/voice');
const client = require('../client');
const { DISCORD_GUILD_ID, VOICE_HOME_CHANNEL_ID, LEVEL_ENABLED } = require('../config');
const cfg = require('../config/congDuc');
const core = require('./core');
const antiFarm = require('../level/antiFarm');

const sitting = new Map(); // userId -> { joinedAt, name }
const warnedAt = new Map(); // userId -> ts (log chống farm tối đa 1 lần/30 phút)
let lastTickAt = 0;
let lastCredited = 0; // số người được tích ở lần quét gần nhất (sound.js dùng để quyết định có gõ mõ không)
let lastBotHome = false;
let timer = null;

function botIsHome(guild) {
  try {
    const conn = getVoiceConnection(guild.id);
    return Boolean(conn && conn.state.status === VoiceConnectionStatus.Ready && conn.joinConfig.channelId === VOICE_HOME_CHANNEL_ID
      && guild.members.me && guild.members.me.voice && guild.members.me.voice.channelId === VOICE_HOME_CHANNEL_ID);
  } catch { return false; }
}

function warnBlocked(userId) {
  const now = Date.now();
  if (now - (warnedAt.get(userId) || 0) < 30 * 60_000) return;
  warnedAt.set(userId, now);
  if (warnedAt.size > 500) for (const [k, ts] of warnedAt) if (now - ts > 30 * 60_000) warnedAt.delete(k);
  try { require('../activityLog').logActivity(`🚫 [chống farm] <@${userId}> ra vào voice liên tục — tạm không tích Công Đức`); } catch { /* bỏ qua */ }
}

// Ngồi liên tục đủ mốc (mặc định 60 phút) -> thưởng CÔNG ĐỨC (CONG_DUC_VOICE_STREAK_MERIT, mặc định 888) qua core.addMerit: chịu hệ số Hoàng Đạo/Quẻ Xăm như Công Đức thiền thường, còn điểm sám hối thì ×SAM_HOI_EXP_MULT.
// EXP Level KHÔNG còn là phần thưởng mặc định (CONG_DUC_VOICE_STREAK_EXP = 0); đặt > 0 thì cộng thêm qua grantBonusExp (cộng EXP tổng; KHÔNG cộng Điểm HĐ, không vào EXP tuần/chuỗi ngày) và ghi vào rec.bonusExp
// để level/expExclude.js LOẠI khỏi Top tháng / role Top tháng / /baocaothang (giống EXP đốt hương). Level tắt/chưa nạp -> grantBonusExp trả 0 (mốc đó bỏ qua, mốc giờ kế vẫn tính).
// Có trần theo ngày tuỳ chọn (core.voiceStreakAllowedToday, mặc định không trần).
function grantStreakBonus(userId, name, now = Date.now()) {
  try {
    const day = core.vnDay(now);
    const rec = core.rollDay(core.getRecord(userId, name), day);
    if (!core.voiceStreakAllowedToday(rec, { now })) return; // đã đủ trần thưởng hôm nay (CONG_DUC_VOICE_STREAK_DAILY_MAX_MINUTES)
    const parts = [];
    if (cfg.CONG_DUC_VOICE_STREAK_MERIT > 0) {
      const f = core.repentFactor(userId);
      const base = f < 1 ? Math.max(1, Math.floor(cfg.CONG_DUC_VOICE_STREAK_MERIT * f)) : cfg.CONG_DUC_VOICE_STREAK_MERIT;
      const res = core.addMerit(rec, base, { day, now });
      if (res.added > 0) parts.push(`+${res.added} Công Đức`);
    }
    if (cfg.CONG_DUC_VOICE_STREAK_EXP > 0) {
      const got = require('../level').grantBonusExp(userId, cfg.CONG_DUC_VOICE_STREAK_EXP, { name });
      if (got > 0) {
        rec.bonusExp = Math.round(((rec.bonusExp || 0) + got) * 100) / 100;
        core.markDirty(rec);
        parts.push(`+${got} EXP`);
      }
    }
    if (parts.length) require('../activityLog').logActivity(`🕐 [công đức] <@${userId}> ngồi voice liên tục ${cfg.CONG_DUC_VOICE_STREAK_MINUTES} phút: ${parts.join(', ')}`);
  } catch (error) { console.error('[công đức] Lỗi thưởng ngồi voice liên tục:', error && error.message ? error.message : error); }
}

function tick() {
  const now = Date.now();
  const prev = lastTickAt;
  lastTickAt = now;
  lastCredited = 0;
  try {
    if (!require('../features').isEnabled('congduc') || !core.isLoaded()) return;
    const guild = client.guilds.cache.get(DISCORD_GUILD_ID);
    if (!guild) return;
    lastBotHome = botIsHome(guild);
    if (!lastBotHome) { for (const s of sitting.values()) s.run = 0; return; } // bot không ở phòng treo -> ngừng tích + đứt chuỗi liên tục
    const channel = guild.channels.cache.get(VOICE_HOME_CHANNEL_ID);
    if (!channel || !channel.members) return;
    const humans = channel.members.filter((m) => !m.user.bot);
    const present = new Set();
    for (const m of humans.values()) {
      present.add(m.id);
      let s = sitting.get(m.id);
      if (!s) { s = { joinedAt: now, name: m.displayName }; sitting.set(m.id, s); continue; } // lỡ sự kiện vào phòng: tính từ giờ
      s.name = m.displayName || s.name;
      if (s.joinedAt > prev) continue; // mới vào giữa 2 lần quét
      if (!core.isCountable(m.voice, humans.size)) { s.run = 0; continue; } // deaf/mute/ngồi 1 mình (theo cờ) -> đứt chuỗi liên tục
      if (antiFarm.voiceBlocked(m.id)) { s.run = 0; warnBlocked(m.id); continue; }
      s.run = (s.run || 0) + 1;
      if (core.voiceStreakDue(s.run)) grantStreakBonus(m.id, s.name, now);
      core.meditateMinute(m.id); // thiền: mỗi phút ngồi đúng điều kiện giảm điểm sám hối (không bị trần phút/ngày của Công Đức)
      const res = core.addVoiceMinute(m.id, s.name, { now });
      if (res.added > 0) lastCredited += 1;
    }
    for (const id of [...sitting.keys()]) if (!present.has(id)) sitting.delete(id); // đã rời mà lỡ sự kiện
  } catch (error) {
    console.error('[công đức] Lỗi tích voice:', error && error.message ? error.message : error);
  }
}

function onVoiceState(oldState, newState) {
  try {
    if (!require('../features').isEnabled('congduc') || newState.guild.id !== DISCORD_GUILD_ID) return;
    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;
    // Level đã gọi antiFarm.noteVoiceJoin cho mọi lần vào voice; chỉ tự gọi khi Level tắt (tránh đếm đôi làm đổi hành vi Level).
    if (!LEVEL_ENABLED) {
      const afk = newState.guild.afkChannelId;
      const was = Boolean(oldState.channelId) && oldState.channelId !== afk;
      const nowIn = Boolean(newState.channelId) && newState.channelId !== afk;
      if (!was && nowIn) antiFarm.noteVoiceJoin(member.id);
    }
    const wasHome = oldState.channelId === VOICE_HOME_CHANNEL_ID;
    const isHome = newState.channelId === VOICE_HOME_CHANNEL_ID;
    if (!wasHome && isHome) sitting.set(member.id, { joinedAt: Date.now(), name: member.displayName });
    else if (wasHome && !isHome) sitting.delete(member.id); // rời phòng = đứt chuỗi liên tục
  } catch (error) {
    console.error('[công đức] Lỗi xử lý voice:', error && error.message ? error.message : error);
  }
}

function start() {
  if (timer) return;
  lastTickAt = Date.now();
  client.on(Events.VoiceStateUpdate, onVoiceState);
  // Quét sẵn người đang ngồi lúc bot khởi động: tính từ bây giờ.
  try {
    const guild = client.guilds.cache.get(DISCORD_GUILD_ID);
    if (guild) guild.voiceStates.cache.forEach((vs) => {
      if (vs.channelId === VOICE_HOME_CHANNEL_ID && vs.member && !vs.member.user.bot) sitting.set(vs.id, { joinedAt: lastTickAt, name: vs.member.displayName });
    });
  } catch (error) { console.error('[công đức] Không quét được voice lúc khởi động:', error.message); }
  timer = setInterval(tick, cfg.CONG_DUC_TICK_MS);
  if (timer.unref) timer.unref();
}

// Số người đang được tích ở lần quét gần nhất; số người đang ngồi phòng treo.
const eligibleCount = () => lastCredited;
const sittingCount = () => sitting.size;
const botHome = () => lastBotHome;

module.exports = { start, tick, eligibleCount, sittingCount, botHome, _sitting: sitting };
