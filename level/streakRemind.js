// ===== level/streakRemind.js — nhắc streak sắp đứt qua DM (CHỈ người tự bật, mặc định TẮT) =====
// Lệnh: /nhacstreak [che_do: bat|tat|xem] (mon!nhacstreak [bat|tat|xem]). Trạng thái ở tab "Nhắc Streak" (googleSheets/levelRemindSheet.js),
// đọc 1 lần lúc khởi động rồi cache trong RAM (làm mới mỗi 30 phút khi không có gì chờ ghi); thay đổi ghi theo lô.
// Điều kiện nhắc (kiểm tra mỗi phút): đã bật · giờ VN >= LEVEL_STREAK_REMIND_HOUR · chuỗi hiện tại >= LEVEL_STREAK_REMIND_MIN · HÔM NAY chưa có EXP thật
// (streakDay = hôm qua, tức chuỗi còn sống) · chưa nhắc hôm nay (cột "Ngày Nhắc Gần Nhất" -> không nhắc trùng sau restart). Bot lên muộn trước 24:00 vẫn nhắc bù.
// DM bị chặn/đóng (50007) hoặc không tìm thấy user (10013): log 1 lần và tự TẮT nhắc cho người đó. Lỗi tạm thời: thử lại sau 10 phút, tối đa 3 lần/ngày.
const { Events } = require('discord.js');
const client = require('../client');
const { LEVEL_ENABLED, LEVEL_STREAK_REMIND_MIN, LEVEL_STREAK_REMIND_HOUR, LEVEL_STREAK_REMIND_DM_DELAY_MS } = require('../config');
const sheet = require('../googleSheets/levelRemindSheet');
const status = require('../monitoring/status');
const { isBotReady, replyNotReadyToInteraction, replyNotReadyToMessage } = require('../utils/readyGate');

const DAY_MS = 24 * 60 * 60 * 1000;
const REFRESH_MS = 30 * 60 * 1000;
const RETRY_MS = 10 * 60 * 1000;
const MAX_TRIES = 3;
const FLUSH_EVERY = 10; // ghi sheet sau mỗi N DM trong 1 lượt

let deps = null; // { getMembers: () => Map, isLoaded: () => boolean, streakMap: () => { [days]: exp } }
let started = false;
let running = false;
let flushing = false;
let lastRefresh = 0;
const state = new Map(); // id -> { id, name, on, lastDay, v }
const dirty = new Set(); // id chờ ghi sheet
const retries = new Map(); // id -> { n, at }
const cooldown = new Map();

const vnDay = (ms = Date.now()) => new Date(ms + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
const vnHour = (ms = Date.now()) => new Date(ms + 7 * 60 * 60 * 1000).getUTCHours();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function entryOf(id, name = '') {
  let e = state.get(id);
  if (!e) {
    e = { id, name, on: false, lastDay: '', v: 0 };
    state.set(id, e);
  }
  return e;
}

function touch(e) {
  e.v += 1;
  dirty.add(e.id);
}

// Ghi các dòng đang chờ lên sheet. Lỗi thì giữ lại để lần sau ghi tiếp. Trả true nếu không còn gì chờ.
async function flushDirty() {
  if (flushing) return false;
  if (!dirty.size) return true;
  flushing = true;
  try {
    const snap = [...dirty].map((id) => state.get(id)).filter(Boolean).map((e) => ({ id: e.id, name: e.name, on: e.on, lastDay: e.lastDay, v: e.v }));
    await sheet.upsertRemindRows(snap);
    for (const s of snap) {
      const cur = state.get(s.id);
      if (!cur || cur.v === s.v) dirty.delete(s.id); // đã đổi tiếp trong lúc ghi thì giữ lại ghi lượt sau
    }
    status.recordSheetOk('Nhắc Streak');
    return dirty.size === 0;
  } catch (error) {
    status.recordSheetError('Nhắc Streak', error);
    console.error('[level] Không ghi được tab Nhắc Streak (sẽ thử lại):', error.message);
    return false;
  } finally {
    flushing = false;
  }
}

async function reload() {
  const rows = await sheet.loadRemindRows();
  if (!rows) return false; // đọc lỗi -> giữ bản cũ
  state.clear();
  for (const [id, r] of rows) state.set(id, { id, name: r.name, on: r.on, lastDay: r.lastDay, v: 0 });
  lastRefresh = Date.now();
  return true;
}

// Tạo tab nếu chưa có + nạp trạng thái. Gọi 1 lần ở startLevel().
async function start() {
  await sheet.ensureRemindTab();
  await reload();
  started = true;
  console.log(`[level] Nhắc streak: ${[...state.values()].filter((e) => e.on).length} người đang bật.`);
}

function aliveStreak(rec, now = Date.now()) {
  if (!rec) return 0;
  return rec.streakDay === vnDay(now) || rec.streakDay === vnDay(now - DAY_MS) ? Number(rec.streak) || 0 : 0;
}

function remindText(streak) {
  const map = deps.streakMap();
  const next = Object.keys(map).map(Number).filter((d) => d > streak).sort((a, b) => a - b)[0];
  const lines = [`🔥 Chuỗi hoạt động của bạn đang là **${streak} ngày**, nhưng hôm nay bạn chưa có EXP nào. Hoạt động trước 24:00 (giờ VN) để giữ chuỗi nhé!`];
  if (next) lines.push(`🎁 Mốc thưởng kế tiếp: **${next} ngày** (+${map[next]} EXP), còn ${next - streak} ngày nữa (tính cả hôm nay).`);
  lines.push('Tắt nhắc: gõ `/nhacstreak` rồi chọn **Tắt**.');
  return lines.join('\n');
}

// 'ok' | 'closed' (DM bị chặn/đóng -> tự tắt) | 'retry'
async function sendDm(userId, content) {
  try {
    const user = await client.users.fetch(userId);
    await user.send({ content, allowedMentions: { parse: [] } });
    return 'ok';
  } catch (error) {
    if (error && (error.code === 50007 || error.code === 10013)) {
      console.warn(`[level] Nhắc streak: không DM được cho ${userId} (DM đóng/chặn) — tự tắt nhắc cho người này.`);
      return 'closed';
    }
    console.error(`[level] Nhắc streak: lỗi gửi DM cho ${userId}:`, error && error.message);
    return 'retry';
  }
}

async function tick() {
  if (!LEVEL_ENABLED || !require('../features').isEnabled('level') || !started || !deps || !deps.isLoaded() || running) return;
  running = true;
  try {
    const now = Date.now();
    if (now - lastRefresh > REFRESH_MS && !dirty.size) await reload();
    else if (dirty.size) await flushDirty(); // thử ghi lại phần lỗi lần trước
    if (vnHour(now) < LEVEL_STREAK_REMIND_HOUR) return;
    const today = vnDay(now);
    const yesterday = vnDay(now - DAY_MS);
    const members = deps.getMembers();
    let sent = 0;
    for (const e of [...state.values()]) {
      if (!e.on || e.lastDay === today) continue;
      if (vnDay() !== today) break; // qua nửa đêm giữa chừng: dừng, hôm sau tính lại
      const retry = retries.get(e.id);
      if (retry && retry.at > Date.now()) continue;
      const rec = members.get(e.id);
      const streak = rec ? Number(rec.streak) || 0 : 0;
      if (!rec || rec.streakDay !== yesterday || streak < LEVEL_STREAK_REMIND_MIN) continue; // đã có EXP hôm nay / chuỗi đã đứt / chuỗi quá ngắn
      const result = await sendDm(e.id, remindText(streak));
      if (result === 'ok') {
        e.lastDay = today;
        retries.delete(e.id);
        touch(e);
        sent += 1;
        if (sent % FLUSH_EVERY === 0) await flushDirty();
      } else if (result === 'closed') {
        e.on = false;
        retries.delete(e.id);
        touch(e);
      } else {
        const n = (retry ? retry.n : 0) + 1;
        if (n >= MAX_TRIES) {
          e.lastDay = today; // bỏ cuộc cho hôm nay, tránh thử mãi
          retries.delete(e.id);
          touch(e);
        } else {
          retries.set(e.id, { n, at: Date.now() + RETRY_MS });
        }
      }
      await sleep(LEVEL_STREAK_REMIND_DM_DELAY_MS);
    }
    await flushDirty();
  } finally {
    running = false;
  }
}

// ---------------------------------------------------------------- lệnh /nhacstreak, mon!nhacstreak
function onCooldown(userId) {
  const now = Date.now();
  if (now - (cooldown.get(userId) || 0) < 3000) return true;
  cooldown.set(userId, now);
  if (cooldown.size > 500) for (const [k, t] of cooldown) if (now - t > 60000) cooldown.delete(k);
  return false;
}

function statusText(userId) {
  const e = state.get(userId);
  const on = Boolean(e && e.on);
  const rec = deps && deps.getMembers().get(userId);
  const streak = aliveStreak(rec);
  const doneToday = Boolean(rec && rec.streakDay === vnDay());
  const lines = [on ? '🔔 Nhắc giữ chuỗi, đang: **Bật**.' : '🔕 Nhắc giữ chuỗi, đang: **Tắt** (mặc định là tắt). Bật bằng `/nhacstreak` → **Bật**.'];
  lines.push(streak > 0 ? `🔥 Chuỗi hiện tại: **${streak} ngày**${doneToday ? ' (hôm nay bạn đã có EXP ✅)' : ' (hôm nay chưa có EXP)'}.` : '🔥 Chuỗi hiện tại: chưa có chuỗi.');
  lines.push(`Bot chỉ DM khi chuỗi từ **${LEVEL_STREAK_REMIND_MIN} ngày** trở lên, hôm nay chưa có EXP, từ **${LEVEL_STREAK_REMIND_HOUR}:00** (giờ VN), tối đa 1 lần/ngày.`);
  return lines.join('\n');
}

// mode: 'bat' | 'tat' | 'xem'. Trả chuỗi phản hồi.
async function applyMode(userId, name, mode) {
  if (!started) return '⏳ Tính năng đang khởi động, thử lại sau ít giây.';
  if (mode === 'xem') return statusText(userId);
  const existing = state.get(userId);
  if (mode === 'tat' && !(existing && existing.on)) return `${statusText(userId)}`;
  const e = entryOf(userId, name);
  e.name = name || e.name;
  e.on = mode === 'bat';
  touch(e);
  const saved = await flushDirty();
  const head = e.on
    ? `🔔 Đã **bật** nhắc streak. Bot sẽ DM bạn khi chuỗi từ ${LEVEL_STREAK_REMIND_MIN} ngày trở lên sắp đứt (từ ${LEVEL_STREAK_REMIND_HOUR}:00 giờ VN, hôm nay chưa có EXP). Hãy cho phép nhận tin nhắn riêng từ thành viên server; nếu bot không DM được thì sẽ tự tắt nhắc.`
    : '🔕 Đã **tắt** nhắc streak. Bạn sẽ không nhận DM nhắc nữa.';
  return saved ? head : `${head}\n⚠️ Chưa lưu được vào sheet — bot sẽ thử lại, có thể bị đặt lại nếu khởi động lại sớm.`;
}

const MODE_ALIASES = { bat: 'bat', bật: 'bat', on: 'bat', tat: 'tat', tắt: 'tat', off: 'tat', xem: 'xem', status: 'xem', trangthai: 'xem' };

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'nhacstreak') return;
    if (!isBotReady()) return void (await replyNotReadyToInteraction(interaction));
    if (!LEVEL_ENABLED) return void (await interaction.reply({ content: 'Hệ thống level đang tắt.', ephemeral: true }));
    if (!interaction.guildId) return void (await interaction.reply({ content: '❌ Lệnh này chỉ dùng được trong server.', ephemeral: true }));
    if (onCooldown(interaction.user.id)) return void (await interaction.reply({ content: '⏳ Bạn thao tác nhanh quá, đợi vài giây rồi thử lại.', ephemeral: true }));
    await interaction.deferReply({ ephemeral: true });
    const mode = interaction.options.getString('che_do') || 'xem';
    const name = (interaction.member && interaction.member.displayName) || interaction.user.globalName || interaction.user.username;
    await interaction.editReply({ content: await applyMode(interaction.user.id, name, mode) });
  } catch (error) {
    console.error('[level] Lỗi /nhacstreak:', error.message);
    try {
      if (interaction.deferred || interaction.replied) await interaction.editReply({ content: '❌ Có lỗi, thử lại sau nhé.' });
    } catch (_) {
      /* bỏ qua */
    }
  }
});

client.on(Events.MessageCreate, async (message) => {
  try {
    if (message.author.bot || !message.guildId) return;
    const m = /^mon!nhacstreak(\s+(\S+))?\s*$/i.exec(String(message.content || '').trim());
    if (!m) return;
    if (!LEVEL_ENABLED) return;
    if (!require('../features').isEnabled('level')) return void (await message.reply({ content: require('../features').disabledNotice('level'), allowedMentions: { parse: [], repliedUser: false } }));
    if (!isBotReady()) return void (await replyNotReadyToMessage(message));
    if (onCooldown(message.author.id)) return;
    const mode = m[2] ? MODE_ALIASES[m[2].toLowerCase()] : 'xem';
    if (!mode) return void (await message.reply({ content: 'Cú pháp: `mon!nhacstreak [bat|tat|xem]`', allowedMentions: { parse: [], repliedUser: false } }));
    const name = (message.member && message.member.displayName) || message.author.globalName || message.author.username;
    await message.reply({ content: await applyMode(message.author.id, name, mode), allowedMentions: { parse: [], repliedUser: false } });
  } catch (error) {
    console.error('[level] Lỗi lệnh mon!nhacstreak:', error.message);
  }
});

module.exports = {
  init(d) {
    deps = d;
  },
  start,
  tick,
};
