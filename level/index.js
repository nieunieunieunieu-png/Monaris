// ===== level — Hệ thống Level / EXP =====
// Mỗi hoạt động của thành viên được cộng EXP + cộng 1 vào cột đếm tương ứng trong Google Sheet
// (config/level.js có danh sách hoạt động + EXP mặc định; EXP/cooldown/bảng cấp chỉnh được ngay trên
// sheet, xem googleSheets/levelSheet.js):
//   - Chat thường +1 · chat trong kênh thảo luận +2 · đăng bài thảo luận (thread mới trong Forum) +10
//   - Tin nhắn có ảnh +2 · thả reaction +1 · ngồi voice +5 / 10 phút (tính từng phút: 1 mình = 0 EXP, từ 2 người x1,
//     mỗi người thêm +0.3 hệ số, tối đa x2.5 — xem config/level.js)
//   - Vote Scrim +3 · Highlight +8 · Check Gear +10 · Thí Kiếm +5   (3 cái cuối + vote gọi awardExp từ module đó)
// Chống spam: EXP của mỗi nhóm hoạt động chỉ cộng 1 lần / cooldown, nhưng CỘT ĐẾM luôn +1 mỗi lần
// (để biết ai hoạt động sôi nổi). Tin quá ngắn / trùng tin trước cũng chỉ được đếm, không có EXP. EXP gom trong bộ nhớ, ghi Sheet theo lô mỗi LEVEL_FLUSH_SECONDS giây.
// Thẻ /level là ảnh (level/card.js, lỗi thì quay về embed). EXP tuần: 2 cột cuối tab Level, reset 00:00 Thứ Hai giờ VN (lúc flush);
// Chủ Nhật LEVEL_WEEKLY_POST_HOUR giờ bot đăng "Top EXP tuần" vào LEVEL_ANNOUNCE_CHANNEL_ID. /toplevel loai:tuần (mon!toplevel tuan).
// Streak ngày (2 cột Ngày HĐ Cuối / Chuỗi Ngày): ngày nào có EXP thật thì +1 chuỗi, đứt ngày thì về 1; đạt mốc streak_<N> ở tab Cấu Hình EXP thì thưởng 1 lần.
// Hoạt động đặc thù team (level/scrimActivity.js): vote đủ cả tuần scrim, có mặt voice đúng giờ scrim. Hệ số sự kiện: level/events.js.
// Admin (Bông): /expadd /expset (kèm lý do, ghi vào kênh ACTIVITY_LOG).
// Role Top tuần (top 10 tuần trước, chốt Thứ Hai) + Top tháng (top 5 tháng trước, chốt ngày 1) — giữ cả tuần/tháng mới: level/topRole.js (LEVEL_TOP_ROLE_ID / LEVEL_MONTH_ROLE_ID).
// Hồ sơ cá nhân (biệt danh/bìa/avatar trên thẻ): level/profile.js, /profile (cần cấp 5) + /profilexoa (Bông).
// Lệnh: /level [người] (mon!level), /toplevel [tổng|tuần] (mon!toplevel [tuan]), /topstreak (mon!topstreak), /expinfo (mon!expinfo), /levelsync (mon!levelsync — Bông).
// Chống farm EXP: level/antiFarm.js. Báo cáo tháng (tab "Mốc Tháng", /baocaothang): level/monthly.js. Người ngủ đông (/nguodong): level/dormant.js. Nhắc streak qua DM (/nhacstreak, tab "Nhắc Streak"): level/streakRemind.js.
// Role theo mốc cấp: tab "Role Cấp Độ" trên sheet, xem level/roles.js (lên cấp là tự gắn role, /levelsync đồng bộ lại tất cả).
// Module tự chứa (listener riêng, giống thiKiem/nmImage/highlight).
const { Events, AttachmentBuilder } = require('discord.js');
const client = require('../client');
const {
  DISCORD_GUILD_ID,
  LEVEL_SPREADSHEET_ID,
  LEVEL_ENABLED,
  LEVEL_FLUSH_SECONDS,
  LEVEL_CONFIG_REFRESH_MINUTES,
  LEVEL_ANNOUNCE_CHANNEL_ID,
  LEVEL_MILESTONE_CHANNEL_ID,
  LEVEL_DISCUSSION_CHANNEL_IDS,
  LEVEL_POST_CHANNEL_IDS,
  LEVEL_EXCLUDED_CHANNEL_IDS,
  LEVEL_TOP_EXCLUDED_IDS,
  LEVEL_VOICE_BLOCK_MINUTES,
  LEVEL_VOICE_EXTRA_PER_PERSON,
  LEVEL_VOICE_MAX_MULTIPLIER,
  LEVEL_VOICE_DAILY_MAX_MINUTES,
  LEVEL_MIN_CHAT_LENGTH,
  LEVEL_DUPLICATE_WINDOW_SECONDS,
  LEVEL_DISPLAY_CACHE_SECONDS,
  LEVEL_ROLE_SYNC_ON_START,
  LEVEL_CARD_ENABLED,
  LEVEL_WEEKLY_POST_ENABLED,
  LEVEL_WEEKLY_POST_HOUR,
  LEVEL_WEEKLY_TOP_SIZE,
  LEVEL_STREAK_DEFAULTS,
  ADMIN_USER_ID,
  BONG_ROLE_ID,
  LEVEL_ACTIVITIES,
} = require('../config');
const { ensureEventPointSheets } = require('../googleSheets/eventPointSheet');
const { ensureLevelSheets, loadLevelConfig, loadMembers, applyDeltas, ensureOptionsTab, loadNoticeOptOuts, setNoticeOptOut } = require('../googleSheets/levelSheet');
const { levelFromExp, progressInfo, setCosts, getDefaultCosts } = require('./curve');
const expHooks = require('./expHooks');
const { weekKey, vnParts, effectiveWeekExp } = require('./week');
const { renderLevelCard } = require('./card');
const { runRenderQueue } = require('../utils/renderQueue');
const status = require('../monitoring/status');
const { setEventRows, multiplierFor, activeEvents } = require('./events');
const { checkVoteFullWeek, checkScrimVoice } = require('./scrimActivity');
const { setMilestones, hasMilestones, applyLevelRoles, syncAllRoles } = require('./roles');
const antiFarm = require('./antiFarm');
const notices = require('./notices');
const profile = require('./profile');
const topRole = require('./topRole');
const monthly = require('./monthly');
const weekSnapshot = require('./weekSnapshot');
require('./topRoleCommand'); // /toprole + mon!toprole
const dormant = require('./dormant');
const streakRemind = require('./streakRemind');
const { LEVEL_SLASH_COMMANDS, buildLevelEmbed, buildTopEmbed, buildWeeklyEmbed, buildStreakEmbed, buildInfoEmbed } = require('./format');
const { classEmojiTag } = require('./classBadge');

const ACT = Object.fromEntries(LEVEL_ACTIVITIES.map((a) => [a.key, a]));
const FULL_READ_EVERY_MS = 10 * 60 * 1000;

// ---------------------------------------------------------------- trạng thái
let sheetCfg = {}; // { key: { exp, cooldown } } đọc từ tab "Cấu Hình EXP"
let pending = new Map(); // userId -> { name, exp, counts }  (chưa ghi Sheet)
// Bản membersCache KHÔNG có người bị loại khỏi bảng xếp hạng (LEVEL_TOP_EXCLUDED_IDS). Mọi bảng top / role Top / hạng dùng bản này.
function topMap() {
  if (!LEVEL_TOP_EXCLUDED_IDS.size) return membersCache;
  const out = new Map();
  for (const [id, m] of membersCache) if (!LEVEL_TOP_EXCLUDED_IDS.has(id)) out.set(id, m);
  return out;
}
let membersCache = new Map(); // userId -> { id, name, exp, level, counts, lastAt }  (đã gồm cả EXP đang chờ ghi)
let loaded = false; // đã nạp tab Level lần đầu chưa (chưa nạp thì không báo lên cấp, tránh báo nhầm)
let sheetsReady = false;
let started = false;
let lastFullRead = 0;
const cooldowns = new Map(); // `${userId}|${group}` -> timestamp
const voiceSessions = new Map(); // userId -> { name, carry }  carry = phần EXP lẻ (<1) chưa cộng
const voiceDaily = new Map(); // userId -> { day, minutes }  số phút voice đã được tính EXP trong ngày (giờ VN)
const lastTextChannel = new Map(); // userId -> id kênh chữ hoạt động gần nhất (để báo lên cấp khi ngồi voice)
const lastMessage = new Map(); // userId -> { text, at }  tin chat gần nhất (chống trùng lặp)

function getCfg(key) {
  const def = ACT[key];
  const o = sheetCfg[key] || {};
  return {
    exp: Number.isFinite(o.exp) ? o.exp : def.exp,
    cooldown: Number.isFinite(o.cooldown) ? o.cooldown : def.cooldown,
  };
}

// Tên hiển thị lấy từ cache của discord.js khi nơi gọi không biết (vd hook từ module khác).
function cachedName(userId) {
  try {
    const guild = client.guilds.cache.get(DISCORD_GUILD_ID);
    const member = guild && guild.members.cache.get(userId);
    if (member) return member.displayName;
    const user = client.users.cache.get(userId);
    return user ? user.globalName || user.username || '' : '';
  } catch (_) {
    return '';
  }
}

function zeroCounts() {
  const c = {};
  for (const a of LEVEL_ACTIVITIES) c[a.key] = 0;
  return c;
}

// ---------------------------------------------------------------- cộng EXP
// Thông báo lên cấp: xem level/notices.js (tag không ping, tự xoá, gom tin, tôn trọng /levelnotify).
// Nhận role mốc lớn -> tin giữ lại (không xoá) ở LEVEL_MILESTONE_CHANNEL_ID (trống = kênh thông báo thường).
function announceLevelUp(userId, level, channelId, gainedRoleIds = []) {
  if (gainedRoleIds.length) {
    const target = LEVEL_MILESTONE_CHANNEL_ID || LEVEL_ANNOUNCE_CHANNEL_ID || channelId;
    notices.queueNotice({ channelId: target, userId, text: notices.milestoneText(userId, level, gainedRoleIds), keep: true });
    return;
  }
  notices.queueNotice({ channelId: LEVEL_ANNOUNCE_CHANNEL_ID || channelId, userId, text: notices.levelUpText(userId, level) });
}

// Lên cấp: gắn role theo mốc (nếu có) rồi mới báo, để tin báo kèm tên role vừa nhận. Không bao giờ ném lỗi.
async function onLevelUp(userId, level, channelId) {
  let gained = [];
  try {
    gained = (await applyLevelRoles(userId, level)).added;
  } catch (error) {
    console.error('[level] Lỗi gắn role lên cấp:', error.message);
  }
  announceLevelUp(userId, level, channelId, gained);
}

function newCacheMember(userId, name) {
  return { id: userId, name, exp: 0, level: 0, counts: zeroCounts(), lastAt: '', weekExp: 0, weekKey: weekKey(), streakDay: '', streak: 0, bestStreak: 0, flags: '' };
}

// ---------------------------------------------------------------- streak ngày
// Mốc thưởng: các dòng streak_<N> ở tab Cấu Hình EXP (EXP = số thưởng, 0 = tắt mốc). Chưa nạp được sheet thì dùng mặc định.
function streakMap() {
  const map = {};
  let seen = false;
  for (const [k, v] of Object.entries(sheetCfg)) {
    const m = /^streak_(\d+)$/.exec(k);
    if (!m) continue;
    seen = true;
    if (Number.isFinite(v.exp) && v.exp > 0) map[Number(m[1])] = v.exp;
  }
  return seen ? map : { ...LEVEL_STREAK_DEFAULTS };
}

function announceStreak(userId, days, bonus, channelId) {
  notices.queueNotice({ channelId: LEVEL_ANNOUNCE_CHANNEL_ID || channelId, userId, text: notices.streakText(userId, days, bonus) });
}

// Gọi khi người này vừa nhận EXP thật (>0). m = bản ghi trong membersCache, p = mục pending (để ghi xuống sheet).
function updateStreak(userId, m, p, channelId) {
  const today = vnDayString();
  if (m.streakDay === today) return;
  m.streak = m.streakDay === vnDayString(Date.now() - 24 * 60 * 60 * 1000) ? (m.streak || 0) + 1 : 1;
  m.streakDay = today;
  p.streakDay = today;
  p.streak = m.streak;
  m.bestStreak = Math.max(m.bestStreak || 0, m.streak); // kỷ lục chuỗi: ghi cùng đợt flush với streak (không thêm lượt ghi Sheet)
  p.bestStreak = m.bestStreak;
  const bonus = streakMap()[m.streak];
  if (bonus > 0) {
    awardExp(userId, 'streak_bonus', { exp: bonus, noEvent: true, noStreak: true, skipCooldown: true, channelId });
    announceStreak(userId, m.streak, bonus, channelId);
  }
}

// ---------------------------------------------------------------- thưởng 1 lần / tuần (cột "Mốc Tuần")
function parseFlags(raw) {
  const [wk, list] = String(raw || '').split('|');
  return wk === weekKey() ? new Set(String(list || '').split(',').filter(Boolean)) : new Set();
}

function hasWeekly(userId, flag) {
  const m = membersCache.get(userId);
  return Boolean(m && parseFlags(m.flags).has(flag));
}

// true = vừa nhận lần đầu trong tuần này (đã ghi cờ vào cache + hàng chờ ghi sheet); false = đã nhận rồi / chưa nạp xong dữ liệu.
function claimWeekly(userId, flag) {
  if (!LEVEL_ENABLED || !loaded) return false;
  let m = membersCache.get(userId);
  if (!m) {
    m = newCacheMember(userId, cachedName(userId));
    membersCache.set(userId, m);
  }
  const set = parseFlags(m.flags);
  if (set.has(flag)) return false;
  set.add(flag);
  m.flags = `${weekKey()}|${[...set].join(',')}`;
  const p = pending.get(userId) || { name: '', exp: 0, weekExp: 0, counts: {} };
  p.flags = m.flags;
  if (!p.name && m.name) p.name = m.name;
  pending.set(userId, p);
  return true;
}

const scrimDeps = { claim: claimWeekly, has: hasWeekly, award: (...args) => awardExp(...args) };

// Gọi từ events/reactionEvents.js sau khi 1 vote tay được ghi.
function onScrimVote(message, user) {
  return checkVoteFullWeek(message, user, scrimDeps);
}

// Bot BANG báo "đã tích đủ mọi ngày scrim" qua HTTP (admin/routes/routesLevel.js) — việc kiểm tra reaction làm ở bot Bang,
// ở đây chỉ claim cờ tuần (chống thưởng lặp) rồi cộng EXP.
function awardScrimFullWeek(userId, channelId) {
  if (!userId) return false;
  if (hasWeekly(userId, 'vote_full')) return false;
  if (!claimWeekly(userId, 'vote_full')) return false;
  awardExp(userId, 'vote_du_tuan', { skipCooldown: true, channelId });
  return true;
}

// Cộng EXP + đếm 1 lần hoạt động. Dùng được từ module khác (vd awardExp(userId, 'check_gear')).
// opts: { name, channelId (nơi thông báo lên cấp; trống = kênh chữ gần nhất của người đó), count (số lần đếm, mặc định 1),
//         exp (ghi đè EXP), skipCooldown, noExp (chỉ đếm, KHÔNG cộng EXP và KHÔNG ghi cooldown),
//         noEvent (không nhân hệ số sự kiện), noStreak (không tính vào chuỗi ngày) }.
// Trả về số EXP thực sự được cộng (0 nếu đang cooldown). Không bao giờ ném lỗi.
function awardExp(userId, key, opts = {}) {
  try {
    if (!LEVEL_ENABLED || !userId || !ACT[key]) return 0;
    const cfg = getCfg(key);
    const now = Date.now();

    let eligible = !opts.noExp;
    if (eligible && !opts.skipCooldown && cfg.cooldown > 0) {
      const cdKey = `${userId}|${ACT[key].group || key}`;
      if (now - (cooldowns.get(cdKey) || 0) < cfg.cooldown * 1000) eligible = false;
      else cooldowns.set(cdKey, now);
    }
    let gained = eligible ? (opts.exp !== undefined ? opts.exp : cfg.exp) : 0;
    // Hệ số sự kiện (VD cuối tuần x2) — thưởng chuỗi / chỉnh tay (noEvent) thì không nhân.
    if (gained > 0 && !opts.noEvent) gained = Math.round(gained * multiplierFor(key) * 100) / 100;
    if (gained > 0) gained = expHooks.adjustGain(userId, gained); // còn điểm sám hối -> EXP nhận được giảm (samHoi/)
    const count = opts.count === undefined ? 1 : opts.count;
    const known = membersCache.get(userId);
    const name = opts.name || (known && known.name) || cachedName(userId);

    const p = pending.get(userId) || { name: '', exp: 0, weekExp: 0, counts: {} };
    p.exp += gained;
    if (gained > 0) p.points = (p.points || 0) + gained; // Điểm HĐ: chỉ cộng phần EXP kiếm được thật, 1-1
    p.weekExp = (p.weekExp || 0) + gained;
    p.counts[key] = (p.counts[key] || 0) + count;
    if (name) p.name = name;
    pending.set(userId, p);

    if (loaded) {
      let m = membersCache.get(userId);
      if (!m) {
        m = newCacheMember(userId, name);
        membersCache.set(userId, m);
      }
      const before = levelFromExp(m.exp);
      m.exp += gained;
      if (m.weekKey !== weekKey()) {
        m.weekExp = 0;
        m.weekKey = weekKey();
      }
      m.weekExp += gained;
      if (name) m.name = name;
      m.level = levelFromExp(m.exp);
      if (m.level > before) onLevelUp(userId, m.level, opts.channelId || lastTextChannel.get(userId));
      if (gained > 0 && !opts.noStreak) updateStreak(userId, m, p, opts.channelId || lastTextChannel.get(userId));
    }
    if (gained > 0) expHooks.emitGain(userId, gained, name);
    return gained;
  } catch (error) {
    console.error('[level] Lỗi awardExp:', error.message);
    return 0;
  }
}

// ---------------------------------------------------------------- ghi Sheet theo lô
function mergeBack(id, p) {
  const cur = pending.get(id);
  if (!cur) {
    pending.set(id, p);
    return;
  }
  cur.exp += p.exp;
  cur.points = (cur.points || 0) + (p.points || 0);
  cur.weekExp = (cur.weekExp || 0) + (p.weekExp || 0);
  if (cur.streakDay === undefined && p.streakDay !== undefined) {
    cur.streakDay = p.streakDay;
    cur.streak = p.streak;
  }
  if (p.bestStreak !== undefined) cur.bestStreak = Math.max(cur.bestStreak || 0, p.bestStreak);
  if (cur.flags === undefined && p.flags !== undefined) cur.flags = p.flags;
  for (const [k, v] of Object.entries(p.counts)) cur.counts[k] = (cur.counts[k] || 0) + v;
  if (!cur.name && p.name) cur.name = p.name;
}

function setCache(rows) {
  const next = new Map();
  const curWeek = weekKey();
  for (const r of rows) {
    const pend = pending.get(r.id);
    const exp = r.exp + ((pend && pend.exp) || 0);
    const weekExp = effectiveWeekExp(r, curWeek) + ((pend && pend.weekExp) || 0);
    const streakDay = pend && pend.streakDay !== undefined ? pend.streakDay : r.streakDay;
    const streak = pend && pend.streakDay !== undefined ? pend.streak : r.streak;
    const flags = pend && pend.flags !== undefined ? pend.flags : r.flags;
    const bestStreak = Math.max(r.bestStreak || 0, (pend && pend.bestStreak) || 0, streak || 0);
    next.set(r.id, { id: r.id, name: r.name, exp, level: levelFromExp(exp), counts: r.counts, lastAt: r.lastAt, weekExp, weekKey: curWeek, streakDay, streak, bestStreak, flags });
  }
  for (const [id, p] of pending) {
    if (next.has(id)) continue;
    next.set(id, { id, name: p.name, exp: p.exp, level: levelFromExp(p.exp), counts: { ...zeroCounts(), ...p.counts }, lastAt: '', weekExp: p.weekExp || 0, weekKey: curWeek, streakDay: p.streakDay || '', streak: p.streak || 0, bestStreak: Math.max(p.bestStreak || 0, p.streak || 0), flags: p.flags || '' });
  }
  membersCache = next;
  loaded = true;
}

let levelFlushAt = 0; // lần ghi Sheet thành công gần nhất (cho /status)

async function doFlush({ force = false } = {}) {
  if (!sheetsReady) return;

  if (pending.size === 0) {
    if (force || !loaded || Date.now() - lastFullRead > FULL_READ_EVERY_MS) {
      setCache(await loadMembers());
      lastFullRead = Date.now();
    }
    return;
  }

  const snapshot = pending;
  pending = new Map();
  let result;
  try {
    result = await applyDeltas(snapshot, levelFromExp);
  } catch (error) {
    result = { members: null, applied: new Set(), error };
  }
  for (const [id, p] of snapshot) if (!result.applied.has(id)) mergeBack(id, p); // ghi lỗi -> thử lại lần flush sau
  if (result.error) {
    console.error('[level] Ghi Google Sheet lỗi (sẽ thử lại):', result.error.message);
    status.recordSheetError('Level (ghi EXP)', result.error);
  } else {
    levelFlushAt = Date.now();
    status.recordSheetOk('Level (ghi EXP)');
  }
  if (result.members) {
    setCache(result.members);
    lastFullRead = Date.now();
  }

  // Dọn cooldown đã hết hạn cho nhẹ bộ nhớ.
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [k, t] of cooldowns) if (t < cutoff) cooldowns.delete(k);
}

// Xếp hàng: luôn chạy tuần tự, không bao giờ 2 lượt ghi chồng nhau.
let flushChain = Promise.resolve();
function flush(opts) {
  const run = flushChain.then(() => doFlush(opts));
  flushChain = run.catch(() => {});
  return run;
}

async function refreshConfig() {
  const { activities, costs, roles, eventRows } = await loadLevelConfig();
  sheetCfg = activities;
  setCosts(costs);
  setEventRows(eventRows);
  if (Array.isArray(roles)) setMilestones(roles); // null = đọc tab Role lỗi -> giữ mốc cũ
  notices.setOptOuts(await loadNoticeOptOuts()); // null = đọc lỗi -> giữ bản cũ
}

// ---------------------------------------------------------------- nhận diện hoạt động
function isExcludedChannel(channel) {
  if (!channel) return false;
  return LEVEL_EXCLUDED_CHANNEL_IDS.has(channel.id) || Boolean(channel.parentId && LEVEL_EXCLUDED_CHANNEL_IDS.has(channel.parentId));
}

function isDiscussionChannel(channel) {
  return LEVEL_DISCUSSION_CHANNEL_IDS.has(channel.id) || Boolean(channel.parentId && LEVEL_DISCUSSION_CHANNEL_IDS.has(channel.parentId));
}

function nameOf(member, user) {
  return (member && member.displayName) || (user && (user.globalName || user.username)) || '';
}

client.on(Events.MessageCreate, (message) => {
  try {
    if (!LEVEL_ENABLED || !message.guildId || message.guildId !== DISCORD_GUILD_ID) return;
    if (message.author.bot || message.webhookId || message.system) return;
    const content = String(message.content || '').trim();
    if (/^mon!/i.test(content)) return; // lệnh bot, không tính là chat
    if (!content && !message.attachments.size && !(message.stickers && message.stickers.size)) return;

    const channel = message.channel;
    if (isExcludedChannel(channel)) return;

    const isThread = typeof channel.isThread === 'function' && channel.isThread();
    // Tin gốc của bài Forum (id trùng id thread) đã được tính là "Bài Thảo Luận" ở ThreadCreate -> không tính thêm chat.
    const isStarter = isThread && message.id === channel.id;

    const ctx = { name: nameOf(message.member, message.author), channelId: message.channelId };
    lastTextChannel.set(message.author.id, message.channelId);

    // Chống spam: tin quá ngắn / trùng tin trước -> chỉ đếm, không EXP, không ăn cooldown (noExp).
    // Bỏ mention + emoji tuỳ chỉnh trước khi đo độ dài. Tin chỉ có ảnh/sticker (không chữ) không bị xét độ dài.
    const plain = content.replace(/<a?:\w+:\d+>|<[@#][!&]?\d+>/g, '').replace(/\s+/g, ' ').trim();
    const hasMedia = message.attachments.size > 0 || Boolean(message.stickers && message.stickers.size);
    const nowMs = Date.now();
    let noExp = false;
    if (plain || !hasMedia) {
      if ([...plain].length < LEVEL_MIN_CHAT_LENGTH) noExp = true;
      const prev = lastMessage.get(message.author.id);
      if (plain && prev && prev.text === plain.toLowerCase() && nowMs - prev.at < LEVEL_DUPLICATE_WINDOW_SECONDS * 1000) noExp = true;
      if (!noExp && plain && antiFarm.checkChat(message.author.id, plain, nowMs, { skipHourlyCap: isDiscussionChannel(channel) })) noExp = true; // lặp ký tự / tin giống gần đây / quá trần giờ
      lastMessage.set(message.author.id, { text: plain.toLowerCase(), at: nowMs });
      if (lastMessage.size > 2000) {
        const cutoff = nowMs - LEVEL_DUPLICATE_WINDOW_SECONDS * 1000;
        for (const [id, v] of lastMessage) if (v.at < cutoff) lastMessage.delete(id);
      }
    }

    if (!isStarter) awardExp(message.author.id, isDiscussionChannel(channel) ? 'chat_thao_luan' : 'chat', { ...ctx, noExp });

    const hasImage = [...message.attachments.values()].some((a) => (a.contentType || '').startsWith('image/'));
    if (hasImage) awardExp(message.author.id, 'anh', ctx);
  } catch (error) {
    console.error('[level] Lỗi xử lý tin nhắn:', error.message);
  }
});

client.on(Events.ThreadCreate, async (thread, newlyCreated) => {
  try {
    if (!LEVEL_ENABLED || !newlyCreated || !thread.guildId || thread.guildId !== DISCORD_GUILD_ID) return;
    if (!LEVEL_POST_CHANNEL_IDS.has(thread.parentId)) return;
    const ownerId = thread.ownerId;
    if (!ownerId || ownerId === (client.user && client.user.id)) return;
    const member = await thread.guild.members.fetch(ownerId).catch(() => null);
    if (member && member.user.bot) return;
    awardExp(ownerId, 'bai_thao_luan', { name: nameOf(member, null), channelId: thread.id });
  } catch (error) {
    console.error('[level] Lỗi xử lý bài thảo luận mới:', error.message);
  }
});

client.on(Events.MessageReactionAdd, async (reaction, user) => {
  try {
    if (!LEVEL_ENABLED || user.bot) return;
    let message = reaction.message;
    if (message.partial) message = await message.fetch().catch(() => null);
    if (!message || !message.guildId || message.guildId !== DISCORD_GUILD_ID) return;
    // Chỉ tính reaction vào tin của NGƯỜI KHÁC (bỏ tin của bot — vd tin vote đã có mục Vote Scrim riêng).
    if (!message.author || message.author.bot || message.author.id === user.id) return;
    if (isExcludedChannel(message.channel)) return;
    const member = message.guild && message.guild.members.cache.get(user.id);
    awardExp(user.id, 'reaction', { name: nameOf(member, user), channelId: message.channelId, noExp: Boolean(antiFarm.checkReaction(user.id, message.id)) });
  } catch (error) {
    console.error('[level] Lỗi xử lý reaction:', error.message);
  }
});

// ---------------------------------------------------------------- voice
// Session chỉ để biết ai đang ngồi voice; EXP được tính MỖI PHÚT ở tickVoice() (không tính lúc rời voice nữa).
function endVoiceSession(userId) {
  voiceSessions.delete(userId);
}

function vnDayString(ms = Date.now()) {
  return new Date(ms + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// Hệ số theo số người thật trong kênh: <2 người = 0 (không EXP), 2 người = 1, mỗi người thêm +EXTRA, tối đa MAX.
function voiceMultiplier(humans) {
  if (humans < 2) return 0;
  return Math.min(LEVEL_VOICE_MAX_MULTIPLIER, 1 + (humans - 2) * LEVEL_VOICE_EXTRA_PER_PERSON);
}

function tickVoice() {
  try {
    if (!LEVEL_ENABLED) return;
    const guild = client.guilds.cache.get(DISCORD_GUILD_ID);
    if (!guild) return;
    const today = vnDayString();
    const perMinute = getCfg('voice').exp / LEVEL_VOICE_BLOCK_MINUTES;

    for (const [userId, s] of [...voiceSessions]) {
      const vs = guild.voiceStates.cache.get(userId);
      if (!vs || !vs.channelId || vs.channelId === guild.afkChannelId || !vs.channel) {
        voiceSessions.delete(userId); // đã rời voice mà lỡ sự kiện
        continue;
      }
      // Tự tắt loa+mic (selfDeaf luôn kéo theo tắt mic) hoặc bị server deaf = 0 EXP, và cũng KHÔNG được tính vào số người để lấy hệ số cho người khác.
      const isDeaf = (state) => Boolean(state && (state.selfDeaf || state.serverDeaf));
      const humans = vs.channel.members.filter((m) => !m.user.bot && !isDeaf(m.voice)).size;
      const deaf = isDeaf(vs);
      const mult = deaf || antiFarm.voiceBlocked(userId) ? 0 : voiceMultiplier(humans); // deaf / ra-vào voice liên tục = 0 EXP

      let gained = 0;
      if (mult > 0) {
        let day = voiceDaily.get(userId);
        if (!day || day.day !== today) {
          day = { day: today, minutes: 0 };
          voiceDaily.set(userId, day);
        }
        // Trần ngày chỉ chặn EXP GỐC (x1). Phần thêm nhờ ngồi từ 3 người trở lên (mult - 1) luôn được tính, không bị trần ngày chặn.
        const underCap = day.minutes < LEVEL_VOICE_DAILY_MAX_MINUTES;
        if (underCap) day.minutes += 1;
        const factor = (underCap ? 1 : 0) + (mult - 1);
        if (factor > 0) {
          s.carry = (s.carry || 0) + perMinute * factor;
          gained = Math.floor(s.carry);
          s.carry -= gained;
        }
      }
      // Cột đếm (phút) luôn +1; EXP có thể = 0 (ngồi 1 mình / deaf / hết trần ngày mà chỉ có 2 người).
      awardExp(userId, 'voice', { name: s.name, count: 1, exp: gained, skipCooldown: true });
    }

    // Dọn bộ đếm ngày cũ cho nhẹ bộ nhớ.
    for (const [id, d] of voiceDaily) if (d.day !== today) voiceDaily.delete(id);
  } catch (error) {
    console.error('[level] Lỗi tính EXP voice:', error.message);
  }
}

client.on(Events.VoiceStateUpdate, (oldState, newState) => {
  try {
    if (!LEVEL_ENABLED || newState.guild.id !== DISCORD_GUILD_ID) return;
    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;
    const afk = newState.guild.afkChannelId;
    const was = Boolean(oldState.channelId) && oldState.channelId !== afk;
    const now = Boolean(newState.channelId) && newState.channelId !== afk;
    // Đổi kênh (was && now) giữ nguyên session — không reset phần EXP lẻ.
    if (!was && now) {
      antiFarm.noteVoiceJoin(member.id);
      voiceSessions.set(member.id, { name: nameOf(member, member.user), carry: 0 });
    }
    else if (was && !now) endVoiceSession(member.id);
  } catch (error) {
    console.error('[level] Lỗi xử lý voice:', error.message);
  }
});

// ---------------------------------------------------------------- lệnh xem cấp
const commandCooldown = new Map();
function onCommandCooldown(userId) {
  const now = Date.now();
  if (now - (commandCooldown.get(userId) || 0) < 5000) return true;
  commandCooldown.set(userId, now);
  return false;
}

const NOT_LOADED_TEXT = '⏳ Dữ liệu level đang được nạp, vui lòng thử lại sau ít phút.';

async function refreshForDisplay() {
  try {
    // membersCache đã gồm cả EXP đang chờ ghi -> cache còn mới thì dùng luôn, không đọc lại cả tab Level.
    if (loaded && Date.now() - lastFullRead < LEVEL_DISPLAY_CACHE_SECONDS * 1000) return;
    await flush({ force: true });
  } catch (error) {
    console.error('[level] Không làm mới được dữ liệu khi xem lệnh:', error.message);
  }
}

// Chuỗi ngày HIỆN TẠI của 1 bản ghi: 0 nếu ngày hoạt động cuối không phải hôm nay/hôm qua (chuỗi đã đứt dù Sheet còn giữ số cũ).
function liveStreak(rec) {
  if (!rec) return 0;
  const alive = rec.streakDay === vnDayString() || rec.streakDay === vnDayString(Date.now() - 24 * 60 * 60 * 1000);
  return alive ? Number(rec.streak) || 0 : 0;
}

// Kỷ lục chuỗi ngày: không bao giờ nhỏ hơn chuỗi đang lưu (dòng cũ chưa có cột kỷ lục thì lấy chuỗi hiện có).
function bestStreakOf(rec) {
  return rec ? Math.max(Number(rec.bestStreak) || 0, Number(rec.streak) || 0) : 0;
}

// onWait(ahead): (tuỳ chọn) gọi 1 lần nếu phải xếp hàng chờ vẽ thẻ — để báo "đang vẽ cho người trước".
async function buildLevelReply(guild, targetUser, onWait) {
  await refreshForDisplay();
  if (!loaded) return { content: NOT_LOADED_TEXT };
  const member = guild ? await guild.members.fetch(targetUser.id).catch(() => null) : null;
  const rec = membersCache.get(targetUser.id) || null;
  // Hạng: bỏ người bị loại khỏi bảng (trừ chính người đang xem, để họ vẫn thấy vị trí giả định của mình).
  const sorted = [...membersCache.values()].filter((m) => !LEVEL_TOP_EXCLUDED_IDS.has(m.id) || m.id === targetUser.id).sort((a, b) => b.exp - a.exp);
  const rank = rec ? sorted.findIndex((m) => m.id === rec.id) + 1 : 0;
  const displayName = await profile.resolveName(targetUser.id, nameOf(member, targetUser)); // biệt danh > ingame > tên Discord
  const embedReply = {
    embeds: [buildLevelEmbed({ user: targetUser, displayName, member: rec, rank, totalMembers: sorted.length, streak: liveStreak(rec) })],
    allowedMentions: { parse: [] },
  };
  if (!LEVEL_CARD_ENABLED) return embedReply;

  // Thẻ ảnh; vẽ lỗi (thiếu font/sharp, avatar hỏng...) thì tự quay về embed như cũ.
  try {
    const wk = weekKey();
    const weekExp = rec ? effectiveWeekExp(rec, wk) : 0;
    const [{ coverBuf, avatarBuf }, className, ingame] = await Promise.all([profile.getCardAssets(targetUser.id), profile.resolveClass(targetUser.id), profile.resolveIngame(targetUser.id)]);
    const png = await runRenderQueue(() => renderLevelCard({
      className,
      ingame,
      nameColors: profile.getNameStyle(targetUser.id), // gradient chọn ở /profile (null = theo bậc cấp)
      frame: profile.getFrame(targetUser.id) || undefined, // khung avatar (và bảng màu khung) chọn ở /profile; undefined = mặc định
      frameCtx: (() => { try { return require('../hoso/dragonKit').makeCtx(require('../shop/ownership').list(targetUser.id)); } catch (e) { return undefined; } })(), // khung Chí Tôn thức tỉnh theo số rồng sở hữu (khung khác bỏ qua)
      danhHieu: '', // TODO: tính năng Danh Hiệu — giống thẻ /hoso (trống = ẩn)
      coverBuf,
      avatarBuf,
      displayName,
      avatarUrl: (member || targetUser).displayAvatarURL({ extension: 'png', size: 256, forceStatic: true }),
      info: progressInfo(rec ? rec.exp : 0),
      rank,
      totalMembers: sorted.length,
      exp: rec ? rec.exp : 0,
      weekExp,
      streak: liveStreak(rec),
      topRole: topRole.statusOf(targetUser.id),
    }), onWait);
    return { files: [new AttachmentBuilder(png, { name: 'level.png' })], allowedMentions: { parse: [] } };
  } catch (error) {
    console.error('[level] Không vẽ được thẻ level, dùng embed:', error.message);
    return embedReply;
  }
}

async function buildTopReply(mode = 'tong') {
  await refreshForDisplay();
  if (!loaded) return { content: NOT_LOADED_TEXT };
  return { embeds: [buildTopEmbed([...topMap().values()], mode)], allowedMentions: { parse: [] } };
}

// /topstreak: top 10 chuỗi ngày đang sống + top 5 kỷ lục mọi thời đại; emote hệ phái tra song song cho tối đa 15 người (lỗi/không có thì bỏ emote).
async function buildStreakReply() {
  await refreshForDisplay();
  if (!loaded) return { content: NOT_LOADED_TEXT };
  const top = [...topMap().values()]
    .map((m) => ({ id: m.id, streak: liveStreak(m), exp: m.exp }))
    .filter((r) => r.streak > 0)
    .sort((a, b) => b.streak - a.streak || b.exp - a.exp)
    .slice(0, 10);
  const records = [...topMap().values()]
    .map((m) => ({ id: m.id, best: bestStreakOf(m), exp: m.exp }))
    .filter((r) => r.best > 0)
    .sort((a, b) => b.best - a.best || b.exp - a.exp)
    .slice(0, 5);
  const emojiById = new Map(); // người có mặt ở cả 2 bảng chỉ tra hệ phái 1 lần
  await Promise.all(
    [...new Set([...top, ...records].map((r) => r.id))].map(async (id) => {
      emojiById.set(id, classEmojiTag(await profile.resolveClass(id).catch(() => '')) || '');
    })
  );
  for (const r of [...top, ...records]) r.emoji = emojiById.get(r.id) || '';
  return { embeds: [buildStreakEmbed(top, records)], allowedMentions: { parse: [] } };
}

function buildInfoReply() {
  const streaks = Object.entries(streakMap())
    .map(([days, exp]) => ({ days: Number(days), exp }))
    .sort((a, b) => a.days - b.days);
  return { embeds: [buildInfoEmbed(getCfg, { streaks, events: activeEvents() })], allowedMentions: { parse: [] } };
}

async function handleMessageCommand(message) {
  try {
    if (message.author.bot) return;
    const content = String(message.content || '').trim();
    const m = /^mon!(level|toplevel|topstreak|expinfo)(\s|$)/i.exec(content);
    if (!m) return;
    if (!LEVEL_ENABLED) return;
    if (m[1].toLowerCase() !== 'expinfo' && !require('../features').isEnabled('level')) return void (await message.reply({ content: require('../features').disabledNotice('level'), allowedMentions: { parse: [], repliedUser: false } }));
    if (!message.guildId) {
      await message.reply('❌ Lệnh này chỉ dùng được trong server.');
      return;
    }
    if (onCommandCooldown(message.author.id)) return;
    const cmd = m[1].toLowerCase();

    let reply;
    let noticeP = null;
    if (cmd === 'expinfo') {
      reply = buildInfoReply();
    } else if (cmd === 'topstreak') {
      reply = await buildStreakReply();
    } else if (cmd === 'toplevel') {
      const arg = content.slice(m[0].length).trim().toLowerCase();
      reply = await buildTopReply(/^(tuan|tuần|week|weekly)$/.test(arg) ? 'tuan' : 'tong');
    } else {
      const rest = content.slice(m[0].length);
      let target = message.mentions.users.first() || null;
      if (!target) {
        const idMatch = rest.match(/\b(\d{17,20})\b/);
        if (idMatch) target = await client.users.fetch(idMatch[1]).catch(() => null);
      }
      reply = await buildLevelReply(message.guild, target || message.author, (ahead) => {
        noticeP = message.reply({ content: `⏳ Đang vẽ thẻ cho ${ahead} người trước, bạn chờ một chút nhé…`, allowedMentions: { parse: [], repliedUser: false } }).catch(() => null);
        return noticeP;
      });
    }
    await message.reply({ ...reply, allowedMentions: { parse: [], repliedUser: false } });
    if (noticeP) noticeP.then((m) => m && m.delete().catch(() => {})); // xoá tin báo chờ khi thẻ đã xong
  } catch (error) {
    console.error('[level] Lỗi lệnh mon! level:', error.message);
  }
}
client.on(Events.MessageCreate, handleMessageCommand);

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.isChatInputCommand()) return;
    if (!['level', 'toplevel', 'topstreak', 'expinfo'].includes(interaction.commandName)) return;
    if (!LEVEL_ENABLED) {
      await interaction.reply({ content: 'Hệ thống level đang tắt.', ephemeral: true });
      return;
    }
    if (!interaction.guildId) {
      await interaction.reply({ content: '❌ Lệnh này chỉ dùng được trong server.', ephemeral: true });
      return;
    }
    if (onCommandCooldown(interaction.user.id)) {
      await interaction.reply({ content: '⏳ Bạn thao tác nhanh quá, đợi vài giây rồi thử lại.', ephemeral: true });
      return;
    }
    await interaction.deferReply();
    let reply;
    if (interaction.commandName === 'expinfo') reply = buildInfoReply();
    else if (interaction.commandName === 'topstreak') reply = await buildStreakReply();
    else if (interaction.commandName === 'toplevel') reply = await buildTopReply(interaction.options.getString('loai') === 'tuan' ? 'tuan' : 'tong');
    else {
      reply = await buildLevelReply(interaction.guild, interaction.options.getUser('nguoi') || interaction.user, (ahead) =>
        interaction.editReply({ content: `⏳ Đang vẽ thẻ cho ${ahead} người trước, bạn chờ một chút nhé…` }).catch(() => {})
      );
    }
    await interaction.editReply({ ...reply, content: reply.content ?? null }); // content: null để xoá dòng báo chờ (nếu có)
  } catch (error) {
    console.error('[level] Lỗi slash command:', error.message);
    try {
      if (interaction.deferred || interaction.replied) await interaction.editReply({ content: '❌ Có lỗi khi lấy dữ liệu level, vui lòng thử lại sau.' });
    } catch (_) {
      /* bỏ qua */
    }
  }
});

// ---------------------------------------------------------------- /levelsync (Bông): đồng bộ role theo cấp
let syncRunning = false;

function isBong(member) {
  return Boolean(member && member.roles && member.roles.cache && member.roles.cache.has(BONG_ROLE_ID));
}

// Nạp lại mốc role từ sheet + cấp mới nhất rồi gắn/gỡ role cho mọi người. Trả về chuỗi kết quả để báo.
async function runRoleSync() {
  await refreshConfig().catch(() => {});
  if (!hasMilestones()) {
    return '⚠️ Chưa có mốc nào hợp lệ. Mở tab **"Role Cấp Độ"** trên sheet Level, điền **Role ID** (cột B) cho các mốc cấp rồi chạy lại.';
  }
  await flush({ force: true });
  if (!loaded) return NOT_LOADED_TEXT;
  const rows = [...membersCache.values()].map((m) => ({ id: m.id, level: levelFromExp(m.exp) }));
  const st = await syncAllRoles(rows);
  return (
    `✅ Đồng bộ role cấp độ xong: kiểm tra **${st.checked}** người — đổi role cho **${st.changedMembers}** người ` +
    `(gắn ${st.added}, gỡ ${st.removed})` +
    (st.missing ? `, ${st.missing} người không còn trong server` : '') +
    '.'
  );
}

async function guardedRoleSync() {
  if (syncRunning) return '⏳ Đang đồng bộ role rồi, đợi xong lượt này nhé.';
  syncRunning = true;
  try {
    return await runRoleSync();
  } catch (error) {
    console.error('[level] Lỗi /levelsync:', error.message);
    return '❌ Có lỗi khi đồng bộ role, xem log bot.';
  } finally {
    syncRunning = false;
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'levelsync') return;
    if (!LEVEL_ENABLED) {
      await interaction.reply({ content: 'Hệ thống level đang tắt.', ephemeral: true });
      return;
    }
    if (!interaction.guildId || !isBong(interaction.member)) {
      await interaction.reply({ content: '❌ Bạn không có quyền sử dụng lệnh này. Cần role Bông.', ephemeral: true });
      return;
    }
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply({ content: await guardedRoleSync() });
  } catch (error) {
    console.error('[level] Lỗi slash /levelsync:', error.message);
  }
});

client.on(Events.MessageCreate, async (message) => {
  try {
    if (message.author.bot || !message.guildId || !/^mon!levelsync(\s|$)/i.test(String(message.content || '').trim())) return;
    if (!LEVEL_ENABLED) return;
    if (!isBong(message.member)) {
      await message.reply({ content: '❌ Bạn không có quyền sử dụng lệnh này. Cần role Bông.', allowedMentions: { repliedUser: false } });
      return;
    }
    await message.reply({ content: await guardedRoleSync(), allowedMentions: { parse: [], repliedUser: false } });
  } catch (error) {
    console.error('[level] Lỗi lệnh mon!levelsync:', error.message);
  }
});

// ---------------------------------------------------------------- /expadd /expset (CHỈ admin): chỉnh EXP thủ công
// Chỉnh tay chỉ đổi EXP TỔNG (không vào EXP tuần, không tính chuỗi, không nhân hệ số sự kiện). Mọi lần chỉnh đều ghi vào kênh ACTIVITY_LOG.
// CHỈ admin (ADMIN_USER_ID) — không role nào khác (kể cả Bông) được can thiệp EXP của người khác.
function canAdjustExp(member, userId) {
  return Boolean(member?.roles?.cache?.has(BONG_ROLE_ID));
}

function adjustExp(userId, delta, name, alsoPoints = false) {
  const p = pending.get(userId) || { name: '', exp: 0, weekExp: 0, counts: {} };
  p.exp += delta;
  if (alsoPoints) p.points = (p.points || 0) + delta; // chỉ khi admin chọn: đổi luôn Điểm HĐ
  if (name) p.name = name;
  pending.set(userId, p);
  let m = membersCache.get(userId);
  if (!m) {
    m = newCacheMember(userId, name || cachedName(userId));
    membersCache.set(userId, m);
  }
  m.exp += delta;
  m.level = levelFromExp(m.exp);
  if (name) m.name = name;
  return m;
}

// ADMIN chỉnh Điểm HĐ THUẦN (không đổi EXP/cấp). Ghi vào hàng đợi `pending` -> flush ghi tab Level (tạo dòng mới nếu người đó chưa có).
function adjustPointsOnly(userId, delta, name) {
  const p = pending.get(userId) || { name: '', exp: 0, weekExp: 0, counts: {} };
  p.points = (p.points || 0) + delta;
  if (name) p.name = name;
  pending.set(userId, p);
}

// EXP THƯỞNG ngoài hệ thống hoạt động (dùng cho Đốt hương của congDuc/). Khác awardExp: chỉ cộng EXP TỔNG —
// KHÔNG cộng Điểm HĐ (tránh vòng lặp điểm vô hạn), KHÔNG vào weekExp (Top tuần), KHÔNG tính chuỗi ngày, KHÔNG nhân hệ số sự kiện.
// Lên cấp thì gọi onLevelUp như awardExp. Trả về EXP đã cộng (0 nếu Level tắt / chưa nạp xong / số không hợp lệ). Không ném lỗi.
// opts: { name, channelId }
function grantBonusExp(userId, exp, opts = {}) {
  try {
    if (!LEVEL_ENABLED || !loaded || !userId) return 0;
    let gained = Math.round(Number(exp) * 100) / 100;
    if (!(gained > 0)) return 0;
    gained = expHooks.adjustGain(userId, gained); // còn điểm sám hối -> EXP thưởng giảm (samHoi/)
    if (!(gained > 0)) return 0;
    const known = membersCache.get(userId);
    const before = levelFromExp(known ? known.exp : 0);
    const m = adjustExp(userId, gained, opts.name, false);
    if (m.level > before) onLevelUp(userId, m.level, opts.channelId || lastTextChannel.get(userId));
    expHooks.emitGain(userId, gained, opts.name);
    return gained;
  } catch (error) {
    console.error('[level] Lỗi grantBonusExp:', error.message);
    return 0;
  }
}

// TRỪ EXP TỔNG (phạt, dùng cho samHoi/ khi chửi tục). Chỉ đổi EXP tổng: KHÔNG đụng Điểm HĐ, EXP tuần, chuỗi ngày; KHÔNG phát expHooks (tránh sám hối tự tăng vì bị phạt).
// Không để EXP xuống dưới 0. Có thể làm tụt cấp (m.level tính lại). Trả về EXP thực sự bị trừ (0 nếu Level tắt / chưa nạp / số không hợp lệ). Không ném lỗi.
// opts: { name }
function penalizeExp(userId, amount, opts = {}) {
  try {
    if (!LEVEL_ENABLED || !loaded || !userId) return 0;
    const want = Math.round(Number(amount) * 100) / 100;
    if (!(want > 0)) return 0;
    const known = membersCache.get(userId);
    const take = Math.round(Math.min(want, Math.max(0, known ? known.exp : 0)) * 100) / 100;
    if (!(take > 0)) return 0;
    adjustExp(userId, -take, opts.name, false);
    return take;
  } catch (error) {
    console.error('[level] Lỗi penalizeExp:', error.message);
    return 0;
  }
}
const isLevelReady = () => Boolean(LEVEL_ENABLED && loaded);

// mode: 'add' (cộng/trừ) | 'set' (đặt tổng). Trả về chuỗi kết quả để báo cho người dùng lệnh.
async function runExpAdjust({ mode, targetUser, guild, value, reason, actor, alsoPoints = false }) {
  if (!Number.isFinite(value)) return '❌ Số EXP không hợp lệ.';
  if (targetUser.bot) return '❌ Không chỉnh EXP cho bot.';
  const why = String(reason || '').trim();
  if (!why) return '❌ Cần nhập lý do.';
  await flush({ force: true }).catch(() => {}); // lấy số mới nhất (có thể vừa sửa tay trên sheet)
  if (!loaded) return NOT_LOADED_TEXT;

  const member = guild ? await guild.members.fetch(targetUser.id).catch(() => null) : null;
  const rec = membersCache.get(targetUser.id);
  const oldExp = rec ? rec.exp : 0;
  const oldLevel = levelFromExp(oldExp);
  const newExp = Math.max(0, mode === 'set' ? value : oldExp + value);
  const delta = Math.round((newExp - oldExp) * 100) / 100;
  adjustExp(targetUser.id, delta, nameOf(member, targetUser), alsoPoints);
  const newLevel = levelFromExp(newExp);
  await applyLevelRoles(targetUser.id, newLevel, member ? { guild, member } : {}).catch(() => {}); // lên/xuống cấp -> chỉnh role theo mốc

  try {
    const { logActivity } = require('../activityLog');
    logActivity(
      `🛠️ EXP ${mode === 'set' ? 'đặt' : 'cộng/trừ'}: ${actor.username} (${actor.id}) → ${nameOf(member, targetUser)} (${targetUser.id}): ` +
        `${NUMF(oldExp)} → ${NUMF(newExp)} EXP (${delta >= 0 ? '+' : ''}${NUMF(delta)}), cấp ${oldLevel} → ${newLevel}${alsoPoints ? ', ĐỔI CẢ Điểm HĐ' : ', Điểm HĐ giữ nguyên'}. Lý do: ${why}`
    );
  } catch (error) {
    console.error('[level] Không ghi được log chỉnh EXP:', error.message);
  }
  return (
    `✅ Đã ${mode === 'set' ? 'đặt' : 'chỉnh'} EXP của <@${targetUser.id}>: **${NUMF(oldExp)} → ${NUMF(newExp)}** ` +
    `(${delta >= 0 ? '+' : ''}${NUMF(delta)}), cấp ${oldLevel} → **${newLevel}**. ${alsoPoints ? '**Điểm HĐ cũng đổi theo.**' : 'Điểm HĐ (điểm mua shop) giữ nguyên.'}\nLý do: ${why}`
  );
}

const NUMF = (n) => Number(n).toLocaleString('vi-VN');

// /addpoint (CHỈ admin): cộng/trừ Điểm HĐ (shop /profile) hoặc Công Đức (shop Công Đức), mặc định cho chính admin.
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'addpoint') return;
    if (!canAdjustExp(interaction.member, interaction.user.id)) {
      return void (await interaction.reply({ content: '❌ Chỉ admin mới dùng được lệnh này.', ephemeral: true }));
    }
    await interaction.deferReply({ ephemeral: true });
    const kind = interaction.options.getString('loai', true);
    const amount = interaction.options.getInteger('so', true);
    const target = interaction.options.getUser('nguoi') || interaction.user;
    if (target.bot) return void (await interaction.editReply({ content: '❌ Không chỉnh điểm cho bot.' }));
    const member = interaction.guild ? await interaction.guild.members.fetch(target.id).catch(() => null) : null;
    const name = nameOf(member, target);
    let text;
    if (kind === 'diem_hd') {
      if (!loaded) return void (await interaction.editReply({ content: NOT_LOADED_TEXT }));
      adjustPointsOnly(target.id, amount, name);
      await flush({ force: true }).catch(() => {});
      text = `✅ Điểm Hoạt Động của <@${target.id}>: **${amount >= 0 ? '+' : ''}${NUMF(amount)}** (EXP/cấp không đổi). Mở \`/shopkhung\` để xem. Nếu tab "Điểm Hoạt Động" chưa hiện số thì đợi vài giây cho Sheet tính lại công thức.`;
    } else {
      const cd = require('../congDuc/core');
      if (!cd.isLoaded()) return void (await interaction.editReply({ content: '⏳ Công Đức chưa nạp xong, thử lại sau ít phút.' }));
      const rec = cd.getRecord(target.id, name);
      const before = rec.total || 0;
      const done = cd.adjustMeritRaw(rec, amount);
      text = `✅ Công Đức của <@${target.id}>: **${NUMF(before)} → ${NUMF(rec.total)}** (${done >= 0 ? '+' : ''}${NUMF(done)}), cảnh giới **${rec.realm}**. Điểm Lòng Thành còn lại: **${NUMF(cd.sincerityOf(rec))}**.`;
    }
    try { require('../activityLog').logActivity(`🛠️ /addpoint ${kind}: ${interaction.user.username} (${interaction.user.id}) → ${name} (${target.id}) ${amount >= 0 ? '+' : ''}${amount}`); } catch { /* bỏ qua */ }
    await interaction.editReply({ content: text, allowedMentions: { parse: [] } });
  } catch (error) {
    console.error('[level] Lỗi /addpoint:', error.message);
    try { if (interaction.deferred || interaction.replied) await interaction.editReply({ content: '❌ Có lỗi khi chỉnh điểm, xem log bot.' }); } catch (_) { /* bỏ qua */ }
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.isChatInputCommand() || !['expadd', 'expset'].includes(interaction.commandName)) return;
    if (!LEVEL_ENABLED) {
      await interaction.reply({ content: 'Hệ thống level đang tắt.', ephemeral: true });
      return;
    }
    if (!interaction.guildId || !canAdjustExp(interaction.member, interaction.user.id)) {
      await interaction.reply({ content: '❌ Bạn không có quyền sử dụng lệnh này. Chỉ admin mới dùng được.', ephemeral: true });
      return;
    }
    await interaction.deferReply({ ephemeral: true });
    const text = await runExpAdjust({
      mode: interaction.commandName === 'expset' ? 'set' : 'add',
      targetUser: interaction.options.getUser('nguoi', true),
      guild: interaction.guild,
      value: interaction.options.getInteger('exp', true),
      reason: interaction.options.getString('ly_do', true),
      actor: interaction.user,
      alsoPoints: interaction.options.getBoolean('doi_diem_hd') === true,
    });
    await interaction.editReply({ content: text, allowedMentions: { parse: [] } });
  } catch (error) {
    console.error('[level] Lỗi slash /expadd /expset:', error.message);
    try {
      if (interaction.deferred || interaction.replied) await interaction.editReply({ content: '❌ Có lỗi khi chỉnh EXP, xem log bot.' });
    } catch (_) {
      /* bỏ qua */
    }
  }
});

// mon!expadd <@người|ID> <±EXP> <lý do>  ·  mon!expset <@người|ID> <EXP mới> <lý do>
client.on(Events.MessageCreate, async (message) => {
  try {
    if (message.author.bot || !message.guildId) return;
    const content = String(message.content || '').trim();
    const head = /^mon!(expadd|expset)(\s|$)/i.exec(content);
    if (!head || !LEVEL_ENABLED) return;
    const mode = head[1].toLowerCase() === 'expset' ? 'set' : 'add';
    if (!canAdjustExp(message.member, message.author.id)) {
      await message.reply({ content: '❌ Bạn không có quyền sử dụng lệnh này. Chỉ admin mới dùng được.', allowedMentions: { repliedUser: false } });
      return;
    }
    const m = /^mon!\w+\s+(?:<@!?(\d{17,20})>|(\d{17,20}))\s+(-?\d+)\s+([\s\S]+)$/i.exec(content);
    if (!m) {
      await message.reply({ content: `❌ Cú pháp: \`mon!exp${mode} <@người hoặc ID> <${mode === 'set' ? 'EXP mới' : '±EXP'}> <lý do>\``, allowedMentions: { repliedUser: false } });
      return;
    }
    const targetUser = await client.users.fetch(m[1] || m[2]).catch(() => null);
    if (!targetUser) {
      await message.reply({ content: '❌ Không tìm thấy người này.', allowedMentions: { repliedUser: false } });
      return;
    }
    // Thêm "+diem" vào cuối lý do (mon!expadd ... lý do +diem) để đổi cả Điểm HĐ.
    const alsoPoints = /\s\+diem\s*$/i.test(m[4]);
    const reason = m[4].replace(/\s\+diem\s*$/i, '');
    const text = await runExpAdjust({ mode, targetUser, guild: message.guild, value: Number(m[3]), reason, actor: message.author, alsoPoints });
    await message.reply({ content: text, allowedMentions: { parse: [], repliedUser: false } });
  } catch (error) {
    console.error('[level] Lỗi lệnh mon!expadd/expset:', error.message);
  }
});

// ---------------------------------------------------------------- bảng "Top EXP tuần" cuối tuần
// Chủ Nhật từ LEVEL_WEEKLY_POST_HOUR giờ VN (bot lên muộn hơn vẫn đăng bù trước 00:00 Thứ Hai). Chống đăng trùng (kể cả sau khi
// restart) bằng cách xem vài tin gần nhất của bot trong kênh có dòng footer "Tuần <khoá tuần>" chưa.
let weeklyBusy = false;
let weeklyPostedKey = '';
let weeklyWarned = false;

async function weeklyTick() {
  if (!LEVEL_ENABLED || !LEVEL_WEEKLY_POST_ENABLED || weeklyBusy || !loaded) return;
  const now = Date.now();
  const key = weekKey(now);
  if (weeklyPostedKey === key) return;
  const t = vnParts(now);
  if (t.dow !== 0 || t.hour < LEVEL_WEEKLY_POST_HOUR) return;

  weeklyBusy = true;
  try {
    if (!LEVEL_ANNOUNCE_CHANNEL_ID) {
      if (!weeklyWarned) console.warn('[level] Chưa đặt LEVEL_ANNOUNCE_CHANNEL_ID — không đăng được bảng Top EXP tuần.');
      weeklyWarned = true;
      return;
    }
    const channel = await client.channels.fetch(LEVEL_ANNOUNCE_CHANNEL_ID).catch(() => null);
    if (!channel || !channel.isTextBased() || typeof channel.send !== 'function') {
      if (!weeklyWarned) console.warn('[level] Không mở được kênh LEVEL_ANNOUNCE_CHANNEL_ID để đăng bảng tuần.');
      weeklyWarned = true;
      return;
    }
    const recent = await channel.messages.fetch({ limit: 30 }).catch(() => null);
    const already =
      recent &&
      [...recent.values()].some(
        (msg) => client.user && msg.author.id === client.user.id && msg.embeds.some((e) => e.footer && String(e.footer.text || '').includes(`Tuần ${key} `))
      );
    if (already) {
      weeklyPostedKey = key;
      return;
    }
    await flush({ force: true }); // lấy số mới nhất rồi mới chốt bảng
    const embed = buildWeeklyEmbed([...topMap().values()], { size: LEVEL_WEEKLY_TOP_SIZE, announce: true });
    await channel.send({ embeds: [embed], allowedMentions: { parse: [] } });
    weeklyPostedKey = key;
  } catch (error) {
    console.error('[level] Lỗi đăng bảng Top EXP tuần (sẽ thử lại):', error.message);
  } finally {
    weeklyBusy = false;
  }
}

// ---------------------------------------------------------------- khởi động / tắt
// Gọi 1 lần ở index.js (Giai đoạn 2): tạo tab + nạp cấu hình + nạp dữ liệu, rồi bật vòng ghi theo lô.
async function startLevel() {
  if (!LEVEL_ENABLED || !LEVEL_SPREADSHEET_ID) return;

  await ensureLevelSheets({ defaultCosts: getDefaultCosts() });
  sheetsReady = true;
  await ensureEventPointSheets().catch((error) => console.error('[level] Không tạo được tab Điểm Hoạt Động / Lịch Sử Dùng Điểm:', error.message));
  await ensureOptionsTab().catch((error) => console.error('[level] Không tạo được tab Tuỳ Chọn:', error.message));
  streakRemind.init({ getMembers: () => membersCache, isLoaded: () => loaded, streakMap });
  await streakRemind.start().catch((error) => console.error('[level] Không khởi động được nhắc streak (tính năng tạm tắt):', error.message));
  await refreshConfig().catch((error) => console.error('[level] Không nạp được cấu hình từ sheet (dùng mặc định):', error.message));
  await flush({ force: true });

  if (started) return;
  started = true;

  // Tuỳ chọn: đồng bộ role cho mọi thành viên lúc bot lên (ENV LEVEL_ROLE_SYNC_ON_START=true), chạy nền không chặn khởi động.
  if (LEVEL_ROLE_SYNC_ON_START) guardedRoleSync().then((msg) => console.log(`[level] ${msg}`)).catch(() => {});

  // Người đang ngồi voice lúc bot vừa lên: tính từ bây giờ.
  try {
    const guild = client.guilds.cache.get(DISCORD_GUILD_ID);
    if (guild) {
      guild.voiceStates.cache.forEach((vs) => {
        if (!vs.channelId || vs.channelId === guild.afkChannelId || !vs.member || vs.member.user.bot) return;
        if (!voiceSessions.has(vs.id)) voiceSessions.set(vs.id, { name: nameOf(vs.member, vs.member.user), carry: 0 });
      });
    }
  } catch (error) {
    console.error('[level] Không quét được voice lúc khởi động:', error.message);
  }

  setInterval(() => flush().catch((error) => console.error('[level] Lỗi flush:', error.message)), LEVEL_FLUSH_SECONDS * 1000);
  setInterval(() => topRole.tick(() => [...topMap().values()], () => loaded).catch(() => {}), 60 * 1000); // role Top tuần + Top tháng
  setInterval(tickVoice, 60 * 1000); // EXP voice tính từng phút
  setInterval(() => weeklyTick().catch(() => {}), 60 * 1000); // bảng Top EXP tuần (Chủ Nhật)
  setInterval(() => checkScrimVoice(scrimDeps), 60 * 1000); // chốt "có mặt voice đúng giờ scrim"
  monthly.init({ getMembers: topMap, flush, isLoaded: () => loaded });
  weekSnapshot.init({ getMembers: topMap, flush, isLoaded: () => loaded });
  setInterval(() => weekSnapshot.tick().catch(() => {}), 60 * 1000); // chụp mốc đầu tuần (cho role Top tuần)
  dormant.init({ getMembers: () => membersCache, isLoaded: () => loaded }); // người ngủ đông: field Tổng kết tháng + /nguodong
  setInterval(() => streakRemind.tick().catch((error) => console.error('[level] Lỗi nhắc streak:', error.message)), 60 * 1000); // DM nhắc streak sắp đứt (chỉ người tự bật)
  setInterval(() => monthly.tick().catch(() => {}), 60 * 1000); // chụp mốc đầu tháng + đăng báo cáo tháng
  setInterval(
    () => refreshConfig().catch((error) => console.error('[level] Lỗi nạp lại cấu hình:', error.message)),
    LEVEL_CONFIG_REFRESH_MINUTES * 60 * 1000
  );
  profile.start().catch((error) => console.error('[level] Lỗi khởi động hồ sơ:', error.message));
  notices.checkPermissions().then(() => notices.sweepStale()).catch(() => {});
  console.log(`Started Level/EXP system (ghi Sheet mỗi ${LEVEL_FLUSH_SECONDS}s).`);
}

// Khi bot bị tắt (deploy/restart): ghi nốt EXP còn trong bộ nhớ (voice đã được cộng từng phút nên không cần chốt thêm) (cố gắng hết sức —
// các handler SIGTERM khác của bot có thể thoát tiến trình sớm hơn, tối đa mất EXP của ~LEVEL_FLUSH_SECONDS giây).
process.on('SIGTERM', async () => {
  await notices.shutdown(); // xoá nốt thông báo tạm đang chờ xoá, gửi nốt tin mốc đang chờ
  try {
    await Promise.race([flush(), new Promise((resolve) => setTimeout(resolve, 5000))]);
  } catch (error) {
    console.error('[level] Lỗi khi ghi EXP lúc tắt bot:', error.message);
  }
  // Thêm handler SIGTERM làm mất cách tắt mặc định của Node — nếu không còn handler nào khác sẽ tự thoát thì mình thoát.
  if (process.listenerCount('SIGTERM') <= 1) process.exit(0);
});


// ---------------------------------------------------------------- /levelnotify (tự bật/tắt thông báo của mình, phản hồi ephemeral)
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'levelnotify') return;
    if (!LEVEL_ENABLED) {
      await interaction.reply({ content: 'Hệ thống level đang tắt.', ephemeral: true });
      return;
    }
    await interaction.deferReply({ ephemeral: true });
    const mode = interaction.options.getString('che_do');
    const off = mode === 'tat' ? true : mode === 'bat' ? false : !notices.isOptedOut(interaction.user.id);
    notices.setOptOut(interaction.user.id, off); // có hiệu lực ngay, ghi sheet sau
    let saved = true;
    try {
      const member = interaction.member;
      await setNoticeOptOut(interaction.user.id, (member && member.displayName) || interaction.user.globalName || interaction.user.username, off);
    } catch (error) {
      saved = false;
      console.error('[level] Không lưu được tuỳ chọn thông báo:', error.message);
    }
    const text = off
      ? '🔕 Đã **tắt** thông báo lên cấp & chuỗi ngày của bạn trong kênh. EXP và role vẫn tính bình thường.'
      : '🔔 Đã **bật** thông báo lên cấp & chuỗi ngày của bạn.';
    await interaction.editReply({ content: saved ? text : `${text}
⚠️ Chưa lưu được vào sheet — có thể bị đặt lại khi bot khởi động lại.` });
  } catch (error) {
    console.error('[level] Lỗi /levelnotify:', error.message);
    try {
      if (interaction.deferred || interaction.replied) await interaction.editReply({ content: '❌ Có lỗi, thử lại sau nhé.' });
      else await interaction.reply({ content: '❌ Có lỗi, thử lại sau nhé.', ephemeral: true });
    } catch (_) {
      /* bỏ qua */
    }
  }
});

profile.init({
  getLevel: (userId) => (membersCache.get(userId) || {}).level || 0,
  isLoaded: () => loaded,
  // /profile xem trước bằng thẻ /hoso (tuỳ chỉnh ảnh nền / màu chữ / thành tựu chỉ lộ đủ ở đó); lỗi thì quay về thẻ /level.
  buildPreview: async (guild, user, opts) => {
    try {
      return await require('../hoso').buildHosoReply(guild, user, undefined, opts); // require trễ: hoso kéo theo level/profile
    } catch (error) {
      console.error('[profile] Không xem trước bằng thẻ hồ sơ, dùng thẻ level:', error.message);
      return buildLevelReply(guild, user);
    }
  },
  buildLevelPreview: (guild, user) => buildLevelReply(guild, user), // xem trước thẻ /level cho trang web
  isBong: (member) => isBong(member),
});

// Dữ liệu cấp độ của 1 người cho /hoso: { exp, level, rank, totalMembers, weekExp, progressPercent, expInto, expNeed, maxed, counts, streak, streakDay, bestStreak } (null = chưa nạp xong / chưa có EXP).
// streak = chuỗi HIỆN TẠI (0 nếu ngày hoạt động cuối không phải hôm nay/hôm qua, tức chuỗi đã đứt); counts = bản sao số lần hoạt động (voice tính bằng phút).
function getLevelSnapshot(userId) {
  if (!loaded) return null;
  const rec = membersCache.get(userId);
  if (!rec) return null;
  const wk = weekKey();
  let rank = 1;
  for (const m of topMap().values()) if (m.exp > rec.exp) rank += 1;
  const info = progressInfo(rec.exp);
  return {
    exp: rec.exp,
    level: levelFromExp(rec.exp),
    rank,
    totalMembers: topMap().size,
    weekExp: effectiveWeekExp(rec, wk),
    progressPercent: info.maxed ? 100 : info.percent,
    expInto: info.maxed ? 0 : info.into, // EXP đã có trong cấp hiện tại
    expNeed: info.maxed ? 0 : info.need, // EXP cần để lên cấp kế (0 = đã tối đa)
    maxed: Boolean(info.maxed),
    counts: { ...(rec.counts || {}) },
    streak: liveStreak(rec),
    streakDay: rec.streakDay || '',
    bestStreak: bestStreakOf(rec),
  };
}

// Cho /status: số người đang theo dõi, số bản ghi chờ ghi Sheet, lần ghi thành công gần nhất.
function getLevelStatus() {
  return { loaded, members: membersCache.size, pending: pending.size, lastFlushAt: levelFlushAt };
}

module.exports = { awardScrimFullWeek, awardExp, grantBonusExp, penalizeExp, isLevelReady, onScrimVote, startLevel, getLevelSnapshot, getLevelStatus, LEVEL_SLASH_COMMANDS };
