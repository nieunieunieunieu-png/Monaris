// ===== level/format.js — slash command + embed hiển thị của hệ thống Level =====
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {
  LEVEL_ACTIVITIES,
  LEVEL_VOICE_BLOCK_MINUTES,
  LEVEL_VOICE_EXTRA_PER_PERSON,
  LEVEL_VOICE_MAX_MULTIPLIER,
  LEVEL_VOICE_DAILY_MAX_MINUTES,
} = require('../config');
const { progressInfo, getCosts, getCumulative, MAX_LEVEL } = require('./curve');
const { getMilestones } = require('./roles');
const { weekKey, effectiveWeekExp } = require('./week');
const { NUM, fmtVan, formatMinutes } = require('../utils/numberFormat');

const LEVEL_SLASH_COMMANDS = [
  new SlashCommandBuilder()
    .setName('level')
    .setDescription('Xem cấp độ, EXP và số lần hoạt động của bạn (hoặc của người khác)')
    .addUserOption((opt) => opt.setName('nguoi').setDescription('Người cần xem (bỏ trống = bạn)').setRequired(false)),
  new SlashCommandBuilder()
    .setName('toplevel')
    .setDescription('Bảng xếp hạng cấp độ / EXP của thành viên')
    .addStringOption((opt) =>
      opt
        .setName('loai')
        .setDescription('Xếp theo EXP tổng hay EXP tuần này (bỏ trống = tổng)')
        .setRequired(false)
        .addChoices({ name: 'Tổng', value: 'tong' }, { name: 'Tuần này', value: 'tuan' })
    ),
  new SlashCommandBuilder().setName('topstreak').setDescription('Bảng xếp hạng chuỗi ngày hoạt động liên tiếp đang có (Top 10)'),
  new SlashCommandBuilder()
    .setName('levelnotify')
    .setDescription('Bật/tắt thông báo lên cấp & chuỗi ngày của bạn trong kênh (chỉ hiện cho bạn)')
    .addStringOption((opt) =>
      opt
        .setName('che_do')
        .setDescription('Bỏ trống = đảo trạng thái hiện tại')
        .setRequired(false)
        .addChoices({ name: 'Bật thông báo', value: 'bat' }, { name: 'Tắt thông báo', value: 'tat' })
    ),
  new SlashCommandBuilder()
    .setName('nhacstreak')
    .setDescription('Nhắc giữ chuỗi qua DM: bật/tắt/xem (mặc định tắt)')
    .addStringOption((opt) =>
      opt
        .setName('che_do')
        .setDescription('Bỏ trống = xem trạng thái')
        .setRequired(false)
        .addChoices({ name: 'Bật nhắc', value: 'bat' }, { name: 'Tắt nhắc', value: 'tat' }, { name: 'Xem trạng thái', value: 'xem' })
    ),
  new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Xem & tuỳ chỉnh hồ sơ trên thẻ /level: biệt danh, ảnh bìa, avatar (cần cấp 5, chỉ hiện cho bạn)'),
  new SlashCommandBuilder()
    .setName('profilexoa')
    .setDescription('(Bông) Gỡ toàn bộ hồ sơ tuỳ chỉnh (biệt danh, bìa, avatar) của một thành viên')
    .addUserOption((opt) => opt.setName('nguoi').setDescription('Thành viên cần gỡ hồ sơ').setRequired(true)),
  new SlashCommandBuilder().setName('expinfo').setDescription('Xem cách tích EXP và EXP cần để lên từng cấp'),
  new SlashCommandBuilder().setName('levelsync').setDescription('(Bông) Đồng bộ lại role theo cấp độ cho toàn bộ thành viên'),
  new SlashCommandBuilder()
    .setName('expadd')
    .setDescription('(Chỉ admin) Cộng / trừ EXP cho một thành viên (có ghi log)')
    .addUserOption((opt) => opt.setName('nguoi').setDescription('Thành viên cần chỉnh EXP').setRequired(true))
    .addIntegerOption((opt) => opt.setName('exp').setDescription('Số EXP cộng thêm (số âm = trừ)').setRequired(true).setMinValue(-1000000).setMaxValue(1000000))
    .addStringOption((opt) => opt.setName('ly_do').setDescription('Lý do (bắt buộc, được ghi vào log)').setRequired(true).setMaxLength(200))
    .addBooleanOption((opt) => opt.setName('doi_diem_hd').setDescription('Đổi luôn Điểm HĐ (điểm mua shop)? Bỏ trống = KHÔNG đổi')),
  new SlashCommandBuilder()
    .setName('addpoint')
    .setDescription('(Chỉ admin) Cộng/trừ Điểm Hoạt Động hoặc Công Đức (mặc định cho chính bạn)')
    .addStringOption((opt) => opt.setName('loai').setDescription('Loại điểm').setRequired(true).addChoices({ name: 'Điểm Hoạt Động (shop khung /profile)', value: 'diem_hd' }, { name: 'Công Đức (Lòng Thành, shop Công Đức)', value: 'cong_duc' }))
    .addIntegerOption((opt) => opt.setName('so').setDescription('Số điểm cộng thêm (số âm = trừ)').setRequired(true).setMinValue(-100000000).setMaxValue(100000000))
    .addUserOption((opt) => opt.setName('nguoi').setDescription('Thành viên (bỏ trống = chính bạn)')),
  new SlashCommandBuilder()
    .setName('expset')
    .setDescription('(Chỉ admin) Đặt TỔNG EXP của một thành viên về đúng số này (có ghi log)')
    .addUserOption((opt) => opt.setName('nguoi').setDescription('Thành viên cần chỉnh EXP').setRequired(true))
    .addIntegerOption((opt) => opt.setName('exp').setDescription('Tổng EXP mới').setRequired(true).setMinValue(0).setMaxValue(10000000))
    .addStringOption((opt) => opt.setName('ly_do').setDescription('Lý do (bắt buộc, được ghi vào log)').setRequired(true).setMaxLength(200))
    .addBooleanOption((opt) => opt.setName('doi_diem_hd').setDescription('Đổi luôn Điểm HĐ (điểm mua shop)? Bỏ trống = KHÔNG đổi')),
  new SlashCommandBuilder().setName('nguodong').setDescription('(Bông) Xem danh sách thành viên "ngủ đông" (còn trong bang nhưng lâu không có EXP, chỉ hiện cho bạn)'),
  new SlashCommandBuilder().setName('toprole').setDescription('(Bông) Xem ai đang giữ role Top tuần / Top tháng, hạn tới khi nào, và kiểm tra bot gắn đúng chưa'),
  new SlashCommandBuilder().setName('baocaothang').setDescription('(Bông) Xem báo cáo tháng này (top EXP / chat / voice) tính đến hiện tại'),
].map((cmd) => cmd.toJSON());

function progressBar(percent, size = 12) {
  const filled = Math.max(0, Math.min(size, Math.round((percent / 100) * size)));
  return '█'.repeat(filled) + '░'.repeat(size - filled);
}

function countLine(activity, count) {
  const shown = activity.key === 'voice' ? formatMinutes(count) : NUM(count);
  return `${activity.label}: **${shown}**`;
}

function totalActions(member) {
  return LEVEL_ACTIVITIES.reduce((sum, a) => (a.key === 'voice' || a.bonus ? sum : sum + (member.counts[a.key] || 0)), 0);
}

// member có thể null (chưa có hoạt động nào). rank/totalMembers: hạng theo EXP.
// streak: chuỗi ngày HIỆN TẠI (level/index.js liveStreak, 0 nếu đã đứt). Không truyền thì không hiện.
function buildLevelEmbed({ user, displayName, member, rank, totalMembers, streak = 0 }) {
  const exp = member ? member.exp : 0;
  const info = progressInfo(exp);
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`📈 Cấp độ — ${displayName}`)
    .setThumbnail(user.displayAvatarURL());

  const lines = [`**Cấp ${info.level}** · ${fmtVan(exp)} EXP`];
  if (info.maxed) {
    lines.push(`${progressBar(100)} 100%`, '🏆 Đã đạt cấp tối đa!');
  } else {
    lines.push(
      `${progressBar(info.percent)} ${info.percent}%`,
      `${fmtVan(info.into)} / ${fmtVan(info.need)} EXP — còn **${fmtVan(info.toNext)}** EXP để lên cấp ${info.level + 1}`
    );
  }
  embed.setDescription(lines.join('\n'));

  if (member && rank) embed.addFields({ name: 'Hạng', value: `#${rank} / ${totalMembers} thành viên`, inline: true });
  if (member) embed.addFields({ name: 'Tổng lượt hoạt động', value: NUM(totalActions(member)), inline: true });
  if (member && streak > 0) embed.addFields({ name: '🔥 Chuỗi ngày', value: `${NUM(streak)} ngày liên tiếp`, inline: true });

  const activityLines = member
    ? LEVEL_ACTIVITIES.filter((a) => (member.counts[a.key] || 0) > 0).map((a) => countLine(a, member.counts[a.key]))
    : [];
  embed.addFields({
    name: 'Hoạt động',
    value: activityLines.length ? activityLines.join('\n') : 'Chưa có hoạt động nào được ghi nhận.',
  });
  if (member && member.lastAt) embed.setFooter({ text: `Hoạt động gần nhất: ${member.lastAt}` });
  return embed;
}

// Bảng EXP tuần (T2 00:00 -> CN, giờ VN). Dùng cho /toplevel loai:tuần và bài đăng cuối tuần (opts.announce).
function buildWeeklyEmbed(members, { size = 10, announce = false } = {}) {
  const key = weekKey();
  const ranked = members
    .map((m) => ({ m, w: effectiveWeekExp(m, key) }))
    .filter((x) => x.w > 0)
    .sort((a, b) => b.w - a.w)
    .slice(0, size);
  const medals = ['🥇', '🥈', '🥉'];
  const lines = ranked.length
    ? ranked.map((x, i) => `${medals[i] || `**${i + 1}.**`} <@${x.m.id}> — **${fmtVan(Math.round(x.w))}** EXP tuần · Cấp ${progressInfo(x.m.exp).level}`)
    : ['Tuần này chưa có ai có EXP.'];
  return new EmbedBuilder()
    .setColor(0xe67e22)
    .setTitle(announce ? '📅 Top EXP tuần' : '📅 Bảng xếp hạng EXP tuần này')
    .setDescription(lines.join('\n'))
    .setFooter({ text: `Tuần ${key} (T2–CN, giờ VN) · reset 00:00 Thứ Hai` });
}

function buildTopEmbed(members, mode = 'tong') {
  if (mode === 'tuan') return buildWeeklyEmbed(members);
  const byExp = [...members].sort((a, b) => b.exp - a.exp).slice(0, 10);
  const medals = ['🥇', '🥈', '🥉'];
  const topLines = byExp.length
    ? byExp.map((m, i) => `${medals[i] || `**${i + 1}.**`} <@${m.id}> — Cấp **${progressInfo(m.exp).level}** · ${fmtVan(m.exp)} EXP`)
    : ['Chưa có ai có EXP.'];

  const embed = new EmbedBuilder().setColor(0xf1c40f).setTitle('🏆 Bảng xếp hạng cấp độ').setDescription(topLines.join('\n'));

  const lively = [...members]
    .map((m) => ({ m, total: totalActions(m) }))
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  if (lively.length) {
    embed.addFields({
      name: '🔥 Sôi nổi nhất (tổng lượt hoạt động)',
      value: lively.map((x, i) => `${i + 1}. <@${x.m.id}> — ${NUM(x.total)} lượt`).join('\n'),
    });
  }
  return embed;
}

// Bảng xếp hạng chuỗi ngày ĐANG SỐNG (/topstreak). rows: [{ id, streak, exp, emoji }] — streak đã là chuỗi hiện tại (liveStreak), emoji = <:tên:id> hệ phái hoặc ''.
// records (tuỳ chọn): [{ id, best, emoji }] đã sắp xếp — Top kỷ lục chuỗi ngày mọi thời đại (cột "Chuỗi Dài Nhất").
function buildStreakEmbed(rows, records = []) {
  const ranked = rows
    .filter((r) => r.streak > 0)
    .sort((a, b) => b.streak - a.streak || b.exp - a.exp)
    .slice(0, 10);
  const medals = ['🥇', '🥈', '🥉'];
  const lines = ranked.length
    ? ranked.map((r, i) => `${medals[i] || `**${i + 1}.**`} ${r.emoji ? `${r.emoji} ` : ''}<@${r.id}> — 🔥 **${NUM(r.streak)}** ngày · Cấp ${progressInfo(r.exp).level}`)
    : ['Chưa có ai đang có chuỗi ngày.'];
  const embed = new EmbedBuilder()
    .setColor(0xff9f43)
    .setTitle('🔥 Bảng xếp hạng chuỗi ngày')
    .setDescription(lines.join('\n'))
    .setFooter({ text: 'Chỉ tính chuỗi đang sống (hôm nay hoặc hôm qua có hoạt động, giờ VN). Bằng chuỗi thì xếp theo EXP.' });
  if (records.length) {
    embed.addFields({
      name: '👑 Kỷ lục mọi thời đại',
      value: records.map((r, i) => `${medals[i] || `**${i + 1}.**`} ${r.emoji ? `${r.emoji} ` : ''}<@${r.id}> — **${NUM(r.best)}** ngày`).join('\n'),
    });
  }
  return embed;
}

// extras: { streaks: [{ days, exp }], events: [{ label, factor, keys }] } (đang hiệu lực)
function buildInfoEmbed(activityCfg, extras = {}) {
  const lines = LEVEL_ACTIVITIES.filter((a) => !a.bonus).map((a) => {
    const cfg = activityCfg(a.key);
    const cd = cfg.cooldown > 0 ? ` _(cách nhau ${cfg.cooldown >= 60 ? `${Math.round(cfg.cooldown / 60)} phút` : `${cfg.cooldown}s`})_` : '';
    if (a.key === 'voice') {
      return (
        `• ${a.label}: **+${cfg.exp} EXP** / ${LEVEL_VOICE_BLOCK_MINUTES} phút — ngồi **1 mình = 0 EXP**, từ **2 người = x1**, ` +
        `mỗi người thêm **+${LEVEL_VOICE_EXTRA_PER_PERSON}** hệ số (tối đa x${LEVEL_VOICE_MAX_MULTIPLIER}); tắt tiếng loa (deaf) không được EXP; ` +
        `EXP gốc tính tối đa ${LEVEL_VOICE_DAILY_MAX_MINUTES} phút / ngày — phần EXP thêm nhờ ngồi từ 3 người trở lên **không giới hạn**`
      );
    }
    return `• ${a.label}: **+${cfg.exp} EXP**${cd}`;
  });

  const costs = getCosts();
  const cum = getCumulative();
  const marks = [1, 2, 3, 5, 10, 20, 30, 40, 50, 75, MAX_LEVEL].filter((n, i, arr) => n <= MAX_LEVEL && arr.indexOf(n) === i);
  const levelLines = marks.map((n) => `Cấp ${n}: +${NUM(costs[n])} (tổng ${NUM(cum[n])})`);

  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle('📖 Cách tích EXP')
    .setDescription(lines.join('\n'))
    .addFields({ name: `EXP cần để lên cấp (tối đa cấp ${MAX_LEVEL})`, value: levelLines.join('\n') });

  if (extras.streaks && extras.streaks.length) {
    embed.addFields({
      name: '🔥 Thưởng chuỗi ngày hoạt động',
      value: extras.streaks.map((s) => `${s.days} ngày liên tiếp: **+${NUM(s.exp)} EXP** (1 lần)`).join('\n').slice(0, 1024),
    });
  }
  if (extras.events && extras.events.length) {
    embed.addFields({
      name: '🎉 Sự kiện đang diễn ra',
      value: extras.events.map((e) => `${e.label}: **x${e.factor}** EXP${e.keys ? ` (${e.keys.join(', ')})` : ''}`).join('\n').slice(0, 1024),
    });
  }

  const roleMarks = getMilestones();
  if (roleMarks.length) {
    embed.addFields({ name: '🏅 Role theo cấp', value: roleMarks.map((m) => `Cấp ${m.level} → <@&${m.roleId}>`).join('\n').slice(0, 1024) });
  }

  return embed
    .setFooter({ text: 'Mỗi lần hoạt động đều được đếm; EXP chỉ cộng khi hết thời gian chờ để chống spam.' });
}

module.exports = { LEVEL_SLASH_COMMANDS, buildLevelEmbed, buildTopEmbed, buildWeeklyEmbed, buildStreakEmbed, buildInfoEmbed };
