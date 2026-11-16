// ===== level/scrimActivity.js — hoạt động đặc thù team: vote đủ cả tuần scrim + có mặt voice đúng giờ scrim =====
// Cả hai chỉ thưởng 1 lần / (tuần hoặc buổi): dedupe bằng cột "Mốc Tuần" trên sheet (qua claim() của level/index.js) nên restart bot không thưởng lặp.
// deps: { claim(userId, flag) -> bool (true = vừa nhận lần đầu), has(userId, flag) -> bool, award(userId, key, opts) }
const client = require('../client');
const { DISCORD_GUILD_ID, DAY_REACTIONS, LEVEL_SCRIM_VOICE_GRACE_MINUTES, LEVEL_SCRIM_VOICE_CHANNEL_IDS } = require('../config');
const { scrimData } = require('../state');
const { parseVnWeekday, parseScrimTime, parseVnDayMonth } = require('../utils/time');
const { weekKey } = require('./week');

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const CHECK_WINDOW_MINUTES = 3; // bot lên muộn / tick lệch vài phút vẫn chốt được, nhưng không "chờ" người vào trễ

// ---------------------------------------------------------------- vote đủ cả tuần
// Gọi sau khi 1 vote tay được ghi. "Đủ" = người này đã tự tích TẤT CẢ ngày scrim (4️⃣/5️⃣/6️⃣) đang có trên tin vote tuần này
// (không tính 0️⃣ "Không đánh", không tính vote hộ của role auto-vote vì đó không phải reaction của họ).
async function checkVoteFullWeek(message, user, deps) {
  try {
    if (!message || !user || user.bot) return;
    if (deps.has(user.id, 'vote_full')) return; // tuần này đã nhận -> khỏi gọi API
    const dayReactions = [...message.reactions.cache.values()].filter((r) => {
      const day = DAY_REACTIONS[r.emoji.name];
      return day !== undefined && day !== 0;
    });
    if (!dayReactions.length) return;
    for (const reaction of dayReactions) {
      const users = await reaction.users.fetch();
      if (!users.has(user.id)) return;
    }
    if (!deps.claim(user.id, 'vote_full')) return;
    deps.award(user.id, 'vote_du_tuan', { skipCooldown: true, channelId: message.channelId });
  } catch (error) {
    console.error('[level] Lỗi kiểm tra vote đủ tuần:', error.message);
  }
}

// ---------------------------------------------------------------- có mặt voice đúng giờ scrim
const doneSessions = new Set(); // `${khoá tuần}|${buổi}` đã chốt trong phiên chạy này

function vnNowParts(ms) {
  const d = new Date(ms + VN_OFFSET_MS);
  return { dow: d.getUTCDay(), day: d.getUTCDate(), month: d.getUTCMonth() + 1, minutes: d.getUTCHours() * 60 + d.getUTCMinutes() };
}

// Các buổi (1/2) đang tới giờ chốt: đúng thứ (và đúng ngày/tháng nếu lịch có điền) + đã qua giờ buổi + GRACE phút.
function sessionsDueNow(ms = Date.now()) {
  const now = vnNowParts(ms);
  const due = [];
  for (const n of [1, 2]) {
    const weekday = parseVnWeekday(scrimData[`session${n}Day`]);
    const time = parseScrimTime(scrimData[`session${n}Time`]);
    if (weekday === null || !time || weekday !== now.dow) continue;
    const dm = parseVnDayMonth(scrimData[`session${n}Date`]);
    if (dm && (dm.day !== now.day || dm.month !== now.month)) continue;
    const target = time.hour * 60 + time.minute + LEVEL_SCRIM_VOICE_GRACE_MINUTES;
    if (now.minutes >= target && now.minutes < target + CHECK_WINDOW_MINUTES) due.push(n);
  }
  return due;
}

// Gọi mỗi phút. Chốt 1 lần / buổi: ai đang ngồi voice (không phải kênh AFK, nếu có đặt LEVEL_SCRIM_VOICE_CHANNEL_IDS thì chỉ các kênh đó) được thưởng.
function checkScrimVoice(deps) {
  try {
    const due = sessionsDueNow();
    if (!due.length) return;
    const guild = client.guilds.cache.get(DISCORD_GUILD_ID);
    if (!guild) return;
    const wk = weekKey();
    for (const n of due) {
      const mark = `${wk}|${n}`;
      if (doneSessions.has(mark)) continue;
      doneSessions.add(mark);
      let rewarded = 0;
      guild.voiceStates.cache.forEach((vs) => {
        if (!vs.channelId || vs.channelId === guild.afkChannelId || !vs.member || vs.member.user.bot) return;
        if (LEVEL_SCRIM_VOICE_CHANNEL_IDS.size && !LEVEL_SCRIM_VOICE_CHANNEL_IDS.has(vs.channelId)) return;
        if (!deps.claim(vs.id, `voice${n}`)) return;
        deps.award(vs.id, 'voice_dung_gio', { name: vs.member.displayName, skipCooldown: true });
        rewarded += 1;
      });
      console.log(`[level] Chốt voice đúng giờ scrim buổi ${n}: ${rewarded} người được thưởng.`);
    }
    if (doneSessions.size > 50) doneSessions.clear();
  } catch (error) {
    console.error('[level] Lỗi chốt voice đúng giờ scrim:', error.message);
  }
}

module.exports = { checkVoteFullWeek, checkScrimVoice, sessionsDueNow };
