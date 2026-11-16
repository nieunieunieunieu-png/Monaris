// ===== level/monthly.js — Báo cáo tháng của hệ thống Level =====
// Mỗi đầu tháng (giờ VN) bot chụp tổng EXP / số tin / phút voice / chuỗi của mọi người vào tab "Mốc Tháng"
// (googleSheets/levelMonthSheet.js). Từ ngày 1 hàng tháng, đến LEVEL_MONTHLY_POST_HOUR giờ (mặc định 9 — dùng ENV LEVEL_MONTHLY_POST_HOUR,
// đọc ở đây) bot đăng "Tổng kết tháng" = chênh lệch 2 ảnh chụp liên tiếp vào LEVEL_ANNOUNCE_CHANNEL_ID (chỉ trong 3 ngày đầu tháng,
// chống đăng trùng bằng cách xem footer "Tháng YYYY-MM" ở vài tin gần nhất của bot — an toàn khi restart). Lần đầu deploy giữa tháng:
// ảnh chụp đầu tiên là lúc deploy nên báo cáo tháng đó tính từ thời điểm ấy.
// Lệnh /baocaothang (Bông): xem báo cáo tháng này tính đến hiện tại (đăng công khai tại kênh gõ lệnh).
const { Events, EmbedBuilder } = require('discord.js');
const client = require('../client');
const { LEVEL_ENABLED, LEVEL_ANNOUNCE_CHANNEL_ID, LEVEL_MONTHLY_POST_ENABLED, LEVEL_MONTHLY_TOP_SIZE, BONG_ROLE_ID, ADMIN_USER_ID } = require('../config');
const sheet = require('../googleSheets/levelMonthSheet');
const { fmtVan } = require('../utils/numberFormat');
const dormant = require('./dormant');
const expExclude = require('./expExclude'); // loại EXP thưởng đốt hương (congDuc/) khỏi mốc tháng

const POST_HOUR = Number.isInteger(Number(process.env.LEVEL_MONTHLY_POST_HOUR)) && String(process.env.LEVEL_MONTHLY_POST_HOUR || '').trim() !== '' && Number(process.env.LEVEL_MONTHLY_POST_HOUR) >= 0 && Number(process.env.LEVEL_MONTHLY_POST_HOUR) <= 23
  ? Number(process.env.LEVEL_MONTHLY_POST_HOUR)
  : 9;
const NUM = (n) => Number(n).toLocaleString('vi-VN');
const MSG_KEYS = ['chat', 'chat_thao_luan'];

let deps = null; // { getMembers: () => Map, flush: (opts) => Promise, isLoaded: () => boolean }
let snapshotKey = ''; // tháng đã chắc chắn có ảnh chụp
let postedKey = '';
let busy = false;
let warned = false;

function vnDate(ms = Date.now()) {
  const d = new Date(ms + 7 * 60 * 60 * 1000);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour: d.getUTCHours() };
}

function monthKey(ms = Date.now()) {
  const d = vnDate(ms);
  return `${d.year}-${String(d.month).padStart(2, '0')}`;
}

function prevMonthKey(key) {
  const [y, m] = key.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
}

function liveRows() {
  const out = [];
  for (const m of deps.getMembers().values()) {
    const counts = m.counts || {};
    out.push({
      id: m.id,
      name: m.name || '',
      exp: expExclude.adjust(m.exp, m.id),
      msgs: MSG_KEYS.reduce((n, k) => n + (Number(counts[k]) || 0), 0),
      voice: Number(counts.voice) || 0,
      streak: Number(m.streak) || 0,
    });
  }
  return out;
}

// Chênh lệch end - start (start thiếu người nào thì coi baseline 0). endRows: [{id,name,exp,msgs,voice,streak}].
function diffRows(startMembers, endRows) {
  return endRows.map((r) => {
    const s = startMembers.get(r.id) || { exp: 0, msgs: 0, voice: 0 };
    return {
      id: r.id,
      name: r.name,
      dExp: Math.max(0, Math.round((r.exp - s.exp) * 100) / 100),
      dMsgs: Math.max(0, r.msgs - s.msgs),
      dVoice: Math.max(0, r.voice - s.voice),
      streak: r.streak,
    };
  });
}

function topLines(rows, field, unit, size, fmt = NUM) {
  const top = rows.filter((r) => r[field] > 0).sort((a, b) => b[field] - a[field]).slice(0, size);
  if (!top.length) return 'Chưa có dữ liệu.';
  const medals = ['🥇', '🥈', '🥉'];
  return top.map((r, i) => `${medals[i] || `**${i + 1}.**`} <@${r.id}> — ${fmt(r[field])} ${unit}`).join('\n');
}

function buildMonthlyEmbed(title, rows, size, footer) {
  const active = rows.filter((r) => r.dExp > 0 || r.dMsgs > 0 || r.dVoice > 0).length;
  const totalExp = rows.reduce((n, r) => n + r.dExp, 0);
  const totalVoiceHours = rows.reduce((n, r) => n + r.dVoice, 0) / 60;
  const embed = new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle(title)
    .setDescription(`👥 **${NUM(active)}** người hoạt động · ✨ **${fmtVan(totalExp)}** EXP · 🎙️ **${NUM(Math.round(totalVoiceHours))}** giờ voice`)
    .addFields(
      { name: '🏆 Top EXP', value: topLines(rows, 'dExp', 'EXP', size, fmtVan) },
      { name: '💬 Top chat', value: topLines(rows, 'dMsgs', 'tin', size) },
      { name: '🎙️ Top voice', value: topLines(rows, 'dVoice', 'phút', size) }
    );
  const best = [...rows].sort((a, b) => b.streak - a.streak)[0];
  if (best && best.streak > 1) embed.addFields({ name: '🔥 Chuỗi ngày hoạt động cao nhất', value: `<@${best.id}> — **${best.streak}** ngày liên tiếp` });
  return embed.setFooter({ text: footer });
}

// ---- Chụp ảnh đầu tháng + đăng báo cáo ----
async function tick() {
  if (!LEVEL_ENABLED || !deps || !deps.isLoaded() || busy) return;
  if (!expExclude.isReady()) return; // chờ Công Đức nạp xong để mốc không chứa EXP hương
  busy = true;
  try {
    const cur = monthKey();
    const t = vnDate();
    const needSnap = snapshotKey !== cur;
    const needPost = LEVEL_MONTHLY_POST_ENABLED && postedKey !== cur && t.day <= 3 && t.hour >= POST_HOUR;
    if (!needSnap && !needPost) return; // tránh đọc Sheet mỗi phút
    const snaps = await sheet.readSnapshots();
    if (needSnap) {
      if (!snaps[cur]) {
        await deps.flush({ force: true });
        const rows = liveRows();
        await sheet.appendSnapshot(cur, rows);
        snaps[cur] = { takenAt: '', members: new Map(rows.map((r) => [r.id, r])) };
        console.log(`[level] Đã chụp mốc tháng ${cur} (${rows.length} người).`);
      }
      snapshotKey = cur;
    }
    await maybePost(cur, snaps);
  } catch (error) {
    console.error('[level] Lỗi báo cáo tháng (sẽ thử lại):', error.message);
  } finally {
    busy = false;
  }
}

async function maybePost(cur, snaps) {
  if (!LEVEL_MONTHLY_POST_ENABLED || postedKey === cur) return;
  const t = vnDate();
  if (t.day > 3 || t.hour < POST_HOUR) return;
  const prev = prevMonthKey(cur);
  if (!snaps[prev] || !snaps[cur]) {
    postedKey = cur; // không có mốc tháng trước (mới deploy) -> bỏ qua báo cáo tháng này
    return;
  }
  if (!LEVEL_ANNOUNCE_CHANNEL_ID) {
    if (!warned) console.warn('[level] Chưa đặt LEVEL_ANNOUNCE_CHANNEL_ID — không đăng được báo cáo tháng.');
    warned = true;
    return;
  }
  const channel = await client.channels.fetch(LEVEL_ANNOUNCE_CHANNEL_ID).catch(() => null);
  if (!channel || !channel.isTextBased() || typeof channel.send !== 'function') {
    if (!warned) console.warn('[level] Không mở được kênh LEVEL_ANNOUNCE_CHANNEL_ID để đăng báo cáo tháng.');
    warned = true;
    return;
  }
  const recent = await channel.messages.fetch({ limit: 30 }).catch(() => null);
  const footerTag = `Tháng ${prev} `;
  const already = recent && [...recent.values()].some((m) => client.user && m.author.id === client.user.id && m.embeds.some((e) => e.footer && String(e.footer.text || '').includes(footerTag)));
  if (already) {
    postedKey = cur;
    return;
  }
  const endRows = [...snaps[cur].members.entries()].map(([id, v]) => ({ id, ...v }));
  const rows = diffRows(snaps[prev].members, endRows);
  const embed = buildMonthlyEmbed(
    `📅 Tổng kết tháng ${prev.slice(5)}/${prev.slice(0, 4)}`,
    rows,
    LEVEL_MONTHLY_TOP_SIZE,
    `${footerTag}· tính từ ${snaps[prev].takenAt || 'đầu tháng'}`
  );
  const dormantField = await dormant.monthlyField(channel.guild).catch((error) => (console.error('[level] Ngủ đông (báo cáo tháng):', error.message), null));
  if (dormantField) embed.addFields(dormantField);
  await channel.send({ embeds: [embed], allowedMentions: { parse: [] } });
  postedKey = cur;
}

// ---- Bảng xếp hạng tháng VỪA KẾT THÚC (dùng cho role Top tháng, level/topRole.js) ----
// Chốt 1 lần mỗi tháng: = chênh lệch ảnh chụp đầu tháng trước và đầu tháng này (tab "Mốc Tháng"), nên xác định được lại sau khi restart.
// Trả về mảng Discord ID xếp theo EXP tháng trước giảm dần (tối đa 30; [] nếu chưa có mốc tháng trước, VD mới deploy giữa tháng);
// null = chưa chụp xong mốc tháng này / đọc Sheet lỗi (chưa biết, bên gọi nên giữ nguyên hiện trạng).
let rankCache = { key: '', ids: null };
async function lastMonthRanking() {
  try {
    const cur = monthKey();
    if (rankCache.key === cur) return rankCache.ids;
    if (!LEVEL_ENABLED || !deps || !deps.isLoaded() || snapshotKey !== cur) return null;
    const snaps = await sheet.readSnapshots();
    const prev = prevMonthKey(cur);
    let ids = [];
    if (snaps[prev] && snaps[cur]) {
      const endRows = [...snaps[cur].members.entries()].map(([id, v]) => ({ id, ...v }));
      ids = diffRows(snaps[prev].members, endRows)
        .filter((r) => r.dExp > 0)
        .sort((a, b) => b.dExp - a.dExp || b.dMsgs - a.dMsgs || b.dVoice - a.dVoice)
        .slice(0, 30)
        .map((r) => r.id);
    }
    rankCache = { key: cur, ids };
    return ids;
  } catch (error) {
    console.error('[level] Không tính được bảng xếp hạng tháng trước (sẽ thử lại):', error.message);
    return null;
  }
}

// ---- /baocaothang (Bông) ----
function isBong(interaction) {
  
  const roles = interaction.member && interaction.member.roles && interaction.member.roles.cache;
  return Boolean(roles && roles.has(BONG_ROLE_ID));
}

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'baocaothang') return;
    if (!LEVEL_ENABLED || !deps) {
      await interaction.reply({ content: 'Hệ thống level đang tắt.', ephemeral: true });
      return;
    }
    if (!interaction.guildId || !isBong(interaction)) {
      await interaction.reply({ content: '❌ Bạn không có quyền sử dụng lệnh này. Cần role Bông.', ephemeral: true });
      return;
    }
    await interaction.deferReply();
    if (!deps.isLoaded()) {
      await interaction.editReply({ content: 'Dữ liệu level chưa nạp xong, thử lại sau ít giây.' });
      return;
    }
    await deps.flush({ force: true }).catch(() => {});
    const cur = monthKey();
    const snaps = await sheet.readSnapshots();
    if (!snaps[cur]) {
      await interaction.editReply({ content: 'Chưa có mốc đầu tháng này (bot sẽ tự chụp trong vòng 1 phút), thử lại sau.' });
      return;
    }
    const rows = diffRows(snaps[cur].members, liveRows());
    const embed = buildMonthlyEmbed(
      `📅 Tháng ${cur.slice(5)}/${cur.slice(0, 4)} — tính đến hiện tại`,
      rows,
      LEVEL_MONTHLY_TOP_SIZE,
      `Tháng ${cur} (tạm tính) · từ ${snaps[cur].takenAt || 'đầu tháng'}`
    );
    const dormantField = await dormant.monthlyField(interaction.guild).catch((error) => (console.error('[level] Ngủ đông (/baocaothang):', error.message), null));
    if (dormantField) embed.addFields(dormantField);
    await interaction.editReply({ embeds: [embed], allowedMentions: { parse: [] } });
  } catch (error) {
    console.error('[level] Lỗi /baocaothang:', error.message);
    try {
      if (interaction.deferred || interaction.replied) await interaction.editReply({ content: '❌ Có lỗi khi tạo báo cáo, xem log bot.' });
    } catch (_) {
      /* bỏ qua */
    }
  }
});

module.exports = {
  init(d) {
    deps = d;
  },
  tick,
  lastMonthRanking,
  monthKey,
  prevMonthKey,
  diffRows,
  buildMonthlyEmbed,
};
