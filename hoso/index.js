// ===== hoso/index.js — /hoso (mon!hoso, mon!hồ sơ, mon!hồsơ, mon!ho so): thẻ Hồ Sơ Thành Viên gom Độ tương tác (cấp) + Thí Kiếm + Bang Chiến + Hệ phái =====
// Khác /profile (người dùng TỰ đặt biệt danh/ảnh bìa/avatar): /hoso chỉ XEM, dữ liệu lấy sẵn từ các Sheet của từng tính năng.
// Ảnh bìa + avatar + ảnh nền hồ sơ + biệt danh riêng (nếu người đó đã đặt qua /profile) được dùng lại cho thẻ này. Vẽ lỗi -> quay về embed.
const { Events, AttachmentBuilder, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const client = require('../client');
const profile = require('../level/profile');
const { isBotReady, replyNotReadyToInteraction, replyNotReadyToMessage } = require('../utils/readyGate');
const { collectHoso, loadQuanHe } = require('./data');
const { renderHosoCard } = require('./card');
const { runRenderQueue } = require('../utils/renderQueue');
const { buildAchievementItems } = require('./achievements');
const { startManualAchievements } = require('./manualAchievements');
const { NUM, fmtVan, formatMinutes } = require('./format');
const { formatKd, formatHd, formatTd } = require('../googleSheets/bcStatKdHd');
const { classEmojiTag } = require('../level/classBadge');

const HOSO_SLASH_COMMANDS = [
  new SlashCommandBuilder()
    .setName('hoso')
    .setDescription('Xem hồ sơ tổng hợp: độ tương tác, Thí Kiếm, Bang Chiến, hệ phái')
    .addUserOption((opt) => opt.setName('nguoi').setDescription('Người cần xem (bỏ trống = bạn)').setRequired(false)),
];

const cooldown = new Map();
function onCooldown(userId) {
  const now = Date.now();
  if (now - (cooldown.get(userId) || 0) < 8000) return true;
  cooldown.set(userId, now);
  if (cooldown.size > 500) for (const [k, t] of cooldown) if (now - t > 60000) cooldown.delete(k);
  return false;
}

function buildEmbed(d, displayName, user) {
  const e = new EmbedBuilder().setTitle(`📇 Hồ sơ — ${displayName}`).setColor(0x5865f2).setThumbnail(user.displayAvatarURL());
  const head = [d.ingame && `Ingame: **${d.ingame}**`, d.className && `Hệ phái: ${classEmojiTag(d.className) ? `${classEmojiTag(d.className)} ` : ''}**${d.className}**`].filter(Boolean).join(' · ');
  if (head) e.setDescription(head);
  const tk = d.thiKiem;
  const c = d.level && d.level.counts;
  const activity = c
    ? [
        `Tin nhắn: **${fmtVan((Number(c.chat) || 0) + (Number(c.chat_thao_luan) || 0))}**${Number(c.chat_thao_luan) > 0 ? ` (trong đó ${fmtVan(Number(c.chat_thao_luan))} ở thảo luận)` : ''}`,
        `Ảnh: **${fmtVan(Number(c.anh) || 0)}**`,
        `Bài thảo luận: **${fmtVan(Number(c.bai_thao_luan) || 0)}**`,
        `Voice: **${formatMinutes(Number(c.voice) || 0)}**`,
      ].join(' · ')
    : 'Chưa có dữ liệu';
  const achList = buildAchievementItems(d.level, d.manualAchievements, d.customAchievements, d.congDuc);
  const achievementText = achList
    ? achList
        .map((a) =>
          a.manual
            ? `${a.custom ? '🏆' : '⭐'} ${a.label}${a.custom ? ' _(Độc quyền)_' : ''}${a.note ? ` (${a.note})` : ''}`
            : `${a.label}: **${a.tier >= 0 ? a.tierName : '—'}**`
        )
        .join(' · ')
    : 'Chưa có dữ liệu';
  e.addFields(
    { name: '⭐ Độ tương tác', value: d.level ? `Lv.**${d.level.level}** · Hạng **#${NUM(d.level.rank)}/${NUM(d.level.totalMembers)}** · **${fmtVan(d.level.exp)}** EXP\nEXP tuần này kiếm được: **${fmtVan(Math.round(d.level.weekExp * 10) / 10)}** exp\n🔥 Chuỗi ngày: **${NUM(Number(d.level.streak) || 0)}** ngày${Number(d.level.bestStreak) > 0 ? ` (kỷ lục **${NUM(Number(d.level.bestStreak))}**)` : ''}` : 'Chưa có dữ liệu', inline: false },
    { name: '🏆 Thí Kiếm', value: tk ? `**${NUM(tk.diem)}** điểm · Hạng bang **${tk.hang ?? '?'}/${tk.hangTotal}** · Hạng hệ phái **${tk.classRank ?? '?'}/${tk.classTotal}**` : 'Chưa có dữ liệu', inline: false },
    { name: '⚔️ Bang Chiến (kỷ lục)', value: d.bcstat ? [...d.bcstat.items.map((i) => `${i.label}: **${i.value === '' || Number.isNaN(i.value) ? '—' : fmtVan(i.value)}**`), `Kỷ lục K/D: **${formatKd(d.bcstat.kd)}**`, `Kỷ lục H/D: **${formatHd(d.bcstat.hd)}**`, `Kỷ lục T/D: **${formatTd(d.bcstat.td)}**`].join(' · ') : 'Chưa có dữ liệu', inline: false },
    { name: '📊 Hoạt động', value: activity, inline: false }
  );
  if (d.congDuc) e.addFields({ name: '🪷 Công Đức', value: `Cảnh Giới **${d.congDuc.realm}** · **${Number(d.congDuc.total).toLocaleString('vi-VN')}** Công Đức`, inline: false });
  if (d.quanHe) {
    const q = d.quanHe;
    const pp = (p) => `**${p.name}**${p.className ? ` · ${p.className}` : ''}`;
    const lines = [q.triKy ? `💞 Tri Kỷ: ${pp(q.triKy)}` : '', q.suPhu ? `🎓 Sư Phụ: ${pp(q.suPhu)}` : '', q.deTu && q.deTu.length ? `🧑‍🎓 Đệ Tử (${q.deTu.length}): ${q.deTu.map((p) => `**${p.name}**`).join(', ')}` : ''].filter(Boolean);
    if (lines.length) e.addFields({ name: '🤝 Quan hệ', value: lines.join('\n'), inline: false });
  }
  if (achList) e.addFields({ name: '🏅 Thành tựu', value: achievementText, inline: false });
  return e;
}

// onWait(ahead): (tuỳ chọn) gọi 1 lần nếu phải xếp hàng chờ vẽ thẻ — để báo "đang vẽ cho người trước".
// opts.hideInfo: ẩn các ô hạng mục (xem thử trên web).
// Trạng thái thức tỉnh Cửu Long của 1 người: lấy từ bộ nhớ sở hữu khung (chưa nạp/lỗi -> 0 rồng, không bao giờ ném lỗi).
// CLCT-8: danh hiệu mặc định cho người đã đủ 9/9 Cửu Long (chưa có tính năng Danh Hiệu nên hiện luôn; sau này danh hiệu tự đặt sẽ được ưu tiên).
function defaultDanhHieu(userId, custom = '') {
  if (custom) return custom;
  try { const n = require('../shop/ownership').rankOf(userId); return n ? `Cửu Long Chí Tôn #${n}` : ''; } catch (e) { return ''; }
}

function loadFrameCtx(userId) {
  try {
    return require('./dragonKit').makeCtx(require('../shop/ownership').list(userId));
  } catch (e) {
    return undefined;
  }
}

async function buildHosoReply(guild, targetUser, onWait, opts = {}) {
  const member = guild ? await guild.members.fetch(targetUser.id).catch(() => null) : null;
  // Quyền riêng tư: người đó tắt "cho người khác xem" -> chỉ chính họ và Bông xem được. opts.viewer = người gõ lệnh (không truyền = xem thử của chính chủ).
  const prof = profile.getProfileRecord(targetUser.id);
  if (opts.viewer && opts.viewer.id !== targetUser.id && prof.allowView === false) {
    const viewerMember = guild ? await guild.members.fetch(opts.viewer.id).catch(() => null) : null;
    if (!(viewerMember && profile.isBongMember(viewerMember))) {
      return { content: '🔒 Người này đã tắt cho phép người khác xem hồ sơ của mình.', allowedMentions: { parse: [] }, denied: true };
    }
  }
  const d = await collectHoso(targetUser.id);
  if (prof.showTriKy) d.quanHe = await loadQuanHe(targetUser.id).catch((e) => { console.error('[hoso] Không đọc được quan hệ:', e.message); return null; });
  const discordName = (member && member.displayName) || targetUser.globalName || targetUser.username;
  const displayName = await profile.resolveName(targetUser.id, discordName);
  const embed = buildEmbed(d, displayName, member || targetUser);
  try {
    const { coverBuf, avatarBuf, bgBuf } = await profile.getCardAssets(targetUser.id, { withBg: true });
    const png = await runRenderQueue(() => renderHosoCard(d, {
      displayName,
      coverBuf,
      avatarBuf,
      bgBuf,
      hideInfo: Boolean(opts && opts.hideInfo),
      topRole: require('../level/topRole').statusOf(targetUser.id), // nhãn hạn role Top tuần/tháng (null = không giữ)
      nameColors: profile.getNameStyle(targetUser.id), // gradient người dùng chọn ở /profile (null = theo bậc cấp)
      // khung ghép người dùng chọn ở /profile 🧩 Khung thẻ (đã giải theo cấp; undefined = khung mặc định). opts.frame (chỉ xem thử trên web): khung NHÁP thay cho khung đã lưu, null = khung mặc định.
      frame: (opts && opts.frame !== undefined ? opts.frame : profile.getFrame(targetUser.id)) || undefined,
      frameCtx: loadFrameCtx(targetUser.id), // ENG-1: số/bộ rồng Cửu Long đã sở hữu (khung Chí Tôn dùng; khung khác bỏ qua)
      danhHieu: defaultDanhHieu(targetUser.id, ''), // TODO: tính năng Danh Hiệu — điền chuỗi danh hiệu của người này ở đây (trống = ẩn hẳn dòng Danh Hiệu)
      avatarUrl: (member || targetUser).displayAvatarURL({ extension: 'png', size: 256, forceStatic: true }),
    }), onWait);
    return { files: [new AttachmentBuilder(png, { name: 'hoso.png' })], allowedMentions: { parse: [] } };
  } catch (error) {
    console.error('[hoso] Không vẽ được thẻ hồ sơ, dùng embed:', error.message);
    return { embeds: [embed], allowedMentions: { parse: [] } };
  }
}

client.on(Events.MessageCreate, async (message) => {
  try {
    if (message.author.bot) return;
    const m = /^mon!(?:hoso|hồ\s?sơ|ho\s?so)(\s|$)/i.exec(String(message.content || '').trim());
    if (!m) return;
    if (!message.guildId) return void (await message.reply('❌ Lệnh này chỉ dùng được trong server.'));
    if (!require('../features').isEnabled('hoso')) return void (await message.reply({ content: require('../features').disabledNotice('hoso'), allowedMentions: { parse: [], repliedUser: false } }));
    if (!isBotReady()) return void (await replyNotReadyToMessage(message));
    if (onCooldown(message.author.id)) return;
    const rest = String(message.content).trim().slice(m[0].length);
    let target = message.mentions.users.first() || null;
    if (!target) {
      const idMatch = rest.match(/\b(\d{17,20})\b/);
      if (idMatch) target = await client.users.fetch(idMatch[1]).catch(() => null);
    }
    let noticeP = null; // tin báo chờ (nếu có) — xoá khi thẻ đã xong
    const reply = await buildHosoReply(message.guild, target || message.author, (ahead) => {
      noticeP = message.reply({ content: `⏳ Đang vẽ thẻ cho ${ahead} người trước, bạn chờ một chút nhé…`, allowedMentions: { parse: [], repliedUser: false } }).catch(() => null);
      return noticeP;
    }, { viewer: message.author });
    await message.reply({ ...reply, allowedMentions: { parse: [], repliedUser: false } });
    if (noticeP) noticeP.then((m) => m && m.delete().catch(() => {}));
  } catch (error) {
    console.error('[hoso] Lỗi mon!hoso:', error.message);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'hoso') return;
    if (!isBotReady()) return void (await replyNotReadyToInteraction(interaction));
    if (!interaction.guildId) return void (await interaction.reply({ content: '❌ Lệnh này chỉ dùng được trong server.', ephemeral: true }));
    if (onCooldown(interaction.user.id)) return void (await interaction.reply({ content: '⏳ Bạn thao tác nhanh quá, đợi vài giây rồi thử lại.', ephemeral: true }));
    await interaction.deferReply();
    const reply = await buildHosoReply(interaction.guild, interaction.options.getUser('nguoi') || interaction.user, (ahead) =>
      interaction.editReply({ content: `⏳ Đang vẽ thẻ cho ${ahead} người trước, bạn chờ một chút nhé…` }).catch(() => {}),
    { viewer: interaction.user });
    await interaction.editReply({ ...reply, content: reply.content ?? null }); // content: null để xoá dòng báo chờ (nếu có)
  } catch (error) {
    console.error('[hoso] Lỗi /hoso:', error.message);
    try {
      if (interaction.deferred || interaction.replied) await interaction.editReply({ content: '❌ Có lỗi khi lấy hồ sơ, vui lòng thử lại sau.' });
    } catch (_) {
      /* bỏ qua */
    }
  }
});

module.exports = { HOSO_SLASH_COMMANDS, startManualAchievements, buildHosoReply };
