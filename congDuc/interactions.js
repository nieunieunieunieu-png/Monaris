// ===== congDuc/interactions.js — nút ở Sảnh + slash /congduc /topcongduc /cuahangcongduc (đều ephemeral, chỉ dùng ở kênh Sảnh); NGOẠI LỆ: /hosocd dùng ở mọi kênh, hiện công khai =====
// Luồng nút 3.3: 🪔 Thắp Hương -> thắp miễn phí (nếu chưa) + báo giá + nút "Đốt thêm hương · X điểm" -> bấm nút sửa chính tin ephemeral đó.
// customId nút đốt mang userId + ngày VN + số lần kế (N); máy chủ luôn tính lại từ dữ liệu thật, lệch thì không trừ, chỉ làm mới.
const { Events } = require('discord.js');
const client = require('../client');
const { isBotReady, replyNotReadyToInteraction } = require('../utils/readyGate');
const cfg = require('../config/congDuc');
const core = require('./core');
const incense = require('./incense');
const queXam = require('./queXam');
const shop = require('./shop');
const upgrade = require('./upgrade');
const week = require('./week');
const month = require('./month');
const view = require('./view');
const { silentReply } = require('./send');
const { renderRealmCard } = require('./card');
const { renderCongDucCard } = require('../hoso/congDucCard');
const { AttachmentBuilder } = require('discord.js');

const SLASH = new Set(['congduc', 'topcongduc', 'cuahangcongduc', 'canhgioi', 'hosocd']);
const ephemeral = (p) => silentReply(view.ephemeral(p));
const nameOf = (i) => (i.member && i.member.displayName) || i.user.globalName || i.user.username;
const topList = (kind) => (kind === 'ngay' ? core.topToday(10) : kind === 'tuan' ? week.topWeek(10) : kind === 'thang' ? month.topMonth(10) : core.topTotal(10));
function shopHome(userId, note = '') {
  const d = shop.homeData(userId);
  return view.shopHomeView({ items: d.items, balance: d.balance, ready: d.ready, note });
}
let hallRefresh = () => {};
function setHallRefresh(fn) { hallRefresh = fn; }

async function mineFor(interaction, target) {
  const self = target.id === interaction.user.id;
  const name = self ? nameOf(interaction) : ((interaction.options.getMember && interaction.options.getMember('nguoi') && interaction.options.getMember('nguoi').displayName) || target.globalName || target.username);
  const rec = self ? core.getRecord(target.id, name) : core.getRecord(target.id, name, { create: false });
  const q = self ? await incense.quote(target.id, name) : null;
  const que = self ? queXam.todayResult(target.id) : null;
  const buffMinutes = self ? queXam.buffMinutesLeft(target.id) : 0;
  return view.mineView({ name, rec, q, que, buffMinutes, self });
}

// /canhgioi: thẻ ảnh Cảnh Giới; vẽ lỗi thì quay về embed /congduc (không để người dùng thấy lỗi trống).
async function realmCardFor(interaction, target) {
  const self = target.id === interaction.user.id;
  const member = self ? interaction.member : (interaction.options.getMember && interaction.options.getMember('nguoi'));
  const name = (member && member.displayName) || target.globalName || target.username;
  const rec = self ? core.getRecord(target.id, name) : core.getRecord(target.id, name, { create: false });
  try {
    const { rank, count } = core.rankOf(target.id);
    const png = await renderRealmCard({
      displayName: name,
      avatarUrl: target.displayAvatarURL({ extension: 'png', size: 256 }),
      total: rec ? rec.total : 0,
      streak: rec ? core.currentStreak(rec) : 0,
      bestStreak: rec ? rec.bestStreak : 0,
      sincerity: core.sincerityOf(rec),
      repent: rec ? rec.repent || 0 : 0,
      rank,
      totalMembers: count,
    });
    return { files: [new AttachmentBuilder(png, { name: 'canhgioi.png' })] };
  } catch (error) {
    console.error('[công đức] Không vẽ được thẻ cảnh giới, dùng embed:', error && error.message ? error.message : error);
    return mineFor(interaction, target);
  }
}

// /hosocd: thẻ hồ sơ Công Đức dùng khung cd_lienhoa (bậc theo Tổng Công Đức hiện tại); vẽ lỗi thì quay về embed /congduc. Chưa có hồ sơ -> hiện 0 (không tạo hồ sơ khi xem người khác).
async function cdProfileFor(interaction, target) {
  const self = target.id === interaction.user.id;
  const member = self ? interaction.member : (interaction.options.getMember && interaction.options.getMember('nguoi'));
  const name = (member && member.displayName) || target.globalName || target.username;
  const rec = self ? core.getRecord(target.id, name) : core.getRecord(target.id, name, { create: false });
  let ingame = '';
  try { ingame = await require('../level/profile').resolveIngame(target.id); } catch (_) { /* không có ingame -> thẻ dùng tên hiển thị */ }
  try {
    const png = await renderCongDucCard({
      displayName: name,
      ingame,
      avatarUrl: target.displayAvatarURL({ extension: 'png', size: 256 }),
      total: rec ? rec.total : 0,
      sincerity: core.sincerityOf(rec),
      repent: rec ? rec.repent || 0 : 0,
      totalMin: rec ? rec.totalMin || 0 : 0, // Giờ Tịnh Tâm (tổng phút ngồi voice)
      streak: rec ? core.currentStreak(rec) : 0, // Chuỗi Kính Lễ Phật = chuỗi thắp hương còn hiệu lực
      bestStreak: rec ? rec.bestStreak || 0 : 0,
      frameTier: upgrade.tierOf(target.id, 'khung'),
      avatarTier: upgrade.tierOf(target.id, 'avatar'),
      titleTier: upgrade.tierOf(target.id, 'danhhieu'),
      title: upgrade.titleOf(upgrade.tierOf(target.id, 'danhhieu')),
    });
    return { files: [new AttachmentBuilder(png, { name: 'hosocd.png' })] };
  } catch (error) {
    console.error('[công đức] Không vẽ được thẻ /hosocd, dùng embed:', error && error.message ? error.message : error);
    return mineFor(interaction, target);
  }
}

async function showHuong(interaction, { free = null, burn = null, que = null, note = '' }) {
  const userId = interaction.user.id;
  const q = await incense.quote(userId, nameOf(interaction));
  return view.huongView({ userId, free, burn, que, q, note });
}

async function onSlash(interaction) {
  await interaction.deferReply(interaction.commandName === 'hosocd' ? {} : view.ephemeral({})); // /hosocd: công khai
  if (interaction.commandName === 'congduc') {
    const target = interaction.options.getUser('nguoi') || interaction.user;
    if (target.bot) return void (await interaction.editReply(silentReply({ content: 'Bot không tu hành.' })));
    return void (await interaction.editReply(silentReply(await mineFor(interaction, target))));
  }
  if (interaction.commandName === 'canhgioi') {
    const target = interaction.options.getUser('nguoi') || interaction.user;
    if (target.bot) return void (await interaction.editReply(silentReply({ content: 'Bot không tu hành.' })));
    return void (await interaction.editReply(silentReply(await realmCardFor(interaction, target))));
  }
  if (interaction.commandName === 'hosocd') {
    const target = interaction.options.getUser('nguoi') || interaction.user;
    if (target.bot) return void (await interaction.editReply(silentReply({ content: 'Bot không tu hành.' })));
    return void (await interaction.editReply(silentReply(await cdProfileFor(interaction, target))));
  }
  if (interaction.commandName === 'topcongduc') {
    const kind = interaction.options.getString('loai') || 'tong';
    return void (await interaction.editReply(silentReply(view.topView(kind, topList(kind)))));
  }
  return void (await interaction.editReply(silentReply(shopHome(interaction.user.id)))); // cuahangcongduc
}

async function onButton(interaction) {
  const cid = interaction.customId;
  const userId = interaction.user.id;
  const name = nameOf(interaction);

  if (cid === view.IDS.THAP) {
    await interaction.deferReply(view.ephemeral({}));
    const free = await incense.freeIncense(userId, name);
    let que = null;
    if (free && free.status === 'ok') {
      try { que = await queXam.draw(userId, name); } catch (error) { console.error('[công đức] Rút quẻ xăm lỗi:', error && error.message ? error.message : error); }
    }
    await interaction.editReply(silentReply(await showHuong(interaction, { free, que })));
    hallRefresh();
    return;
  }
  if (cid === view.IDS.ME) {
    await interaction.deferReply(view.ephemeral({}));
    return void (await interaction.editReply(silentReply(await mineFor(interaction, interaction.user))));
  }
  if (cid === view.IDS.TOP) {
    await interaction.deferReply(view.ephemeral({}));
    return void (await interaction.editReply(silentReply(view.topView('tong', core.topTotal(10)))));
  }
  const topKind = /^cd:top:(ngay|tuan|thang|tong)$/.exec(cid);
  if (topKind) {
    await interaction.deferUpdate();
    return void (await interaction.editReply(silentReply(view.topView(topKind[1], topList(topKind[1])))));
  }
  if (cid === view.IDS.SHOP) {
    await interaction.deferReply(view.ephemeral({}));
    return void (await interaction.editReply(silentReply(shopHome(userId))));
  }
  if (cid === view.IDS.SHOP_BACK) {
    await interaction.deferUpdate();
    return void (await interaction.editReply(silentReply(shopHome(userId))));
  }
  if (cid === view.IDS.NANGCAP) {
    await interaction.deferReply(view.ephemeral({}));
    return void (await interaction.editReply(silentReply(view.nangCapView({ overview: upgrade.overview(userId) }))));
  }
  const upKind = view.parseUpgradeId(cid);
  if (upKind) {
    await interaction.deferUpdate();
    const res = await upgrade.upgrade(userId, name, upKind);
    const note = res.ok
      ? `🪷 A Di Đà Phật, thí chủ đã dâng **${view.fmt(res.cost)}** Lòng Thành, **${res.label}** lên bậc **${res.to}/${upgrade.MAX_TIER}**${upKind === 'danhhieu' ? ` — **${res.title}**` : ''}.`
      : res.msg;
    return void (await interaction.editReply(silentReply(view.nangCapView({ overview: upgrade.overview(userId), note }))));
  }
  const buyItem = view.parseBuyId(cid);
  if (buyItem) {
    await interaction.deferUpdate();
    const res = await shop.buy(userId, name, buyItem);
    const d = shop.itemData(userId, buyItem);
    if (!d) return void (await interaction.editReply(silentReply(shopHome(userId, res.msg || ''))));
    const note = res.ok ? (res.restored ? `🪷 Đã khôi phục **${d.item.name}** (không trừ thêm Lòng Thành).` : `🪷 A Di Đà Phật, thí chủ đã thỉnh **${d.item.name}** · −${view.fmt(d.item.price)} Lòng Thành.`) : res.msg;
    return void (await interaction.editReply(silentReply(view.shopItemView({ ...d, note }))));
  }
  const burn = view.parseBurnId(cid);
  if (burn) {
    if (burn.userId !== userId) return void (await interaction.reply(ephemeral({ content: 'Nút này của người khác, bạn hãy bấm 🪔 Thắp Hương ở Sảnh nhé.' })));
    await interaction.deferUpdate();
    if (burn.day !== core.vnDay()) { // nút của hôm qua: không trừ, chỉ làm mới giá
      return void (await interaction.editReply(silentReply(await showHuong(interaction, { note: 'Sang ngày mới rồi — giá đã được làm mới.' }))));
    }
    const res = await incense.burnIncense(userId, name, { expectN: burn.n, channelId: interaction.channelId });
    await interaction.editReply(silentReply(await showHuong(interaction, { burn: res })));
    hallRefresh();
  }
}

async function onSelect(interaction) {
  if (interaction.customId !== view.IDS.PICK) return;
  await interaction.deferUpdate();
  const d = shop.itemData(interaction.user.id, interaction.values[0]);
  if (!d) return void (await interaction.editReply(silentReply(shopHome(interaction.user.id, 'Bộ khung này không còn bán.'))));
  await interaction.editReply(silentReply(view.shopItemView(d)));
}

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    const ours = (interaction.isChatInputCommand() && SLASH.has(interaction.commandName)) || ((interaction.isButton() || interaction.isStringSelectMenu()) && interaction.customId.startsWith('cd:'));
    if (!ours) return;
    if (!require('../features').isEnabled('congduc')) return void (await interaction.reply(ephemeral({ content: 'Tính năng Công Đức đang tắt.' })));
    if (!isBotReady()) return void (await replyNotReadyToInteraction(interaction));
    const anyChannel = interaction.isChatInputCommand() && interaction.commandName === 'hosocd'; // /hosocd dùng được ở MỌI kênh (thẻ hồ sơ, hiện công khai)
    if (!anyChannel && interaction.channelId !== cfg.CONG_DUC_CHANNEL_ID) return void (await interaction.reply(ephemeral({ content: `Tính năng này chỉ dùng ở <#${cfg.CONG_DUC_CHANNEL_ID}>.` })));
    if (!core.isLoaded()) return void (await interaction.reply(ephemeral({ content: 'Đang nạp dữ liệu Công Đức, thí chủ thử lại sau ít giây.' })));
    if (interaction.isChatInputCommand()) await onSlash(interaction);
    else if (interaction.isStringSelectMenu()) await onSelect(interaction);
    else await onButton(interaction);
  } catch (error) {
    console.error('[công đức] Lỗi xử lý tương tác:', error && error.message ? error.message : error);
    try {
      const msg = { content: 'Có lỗi xảy ra, thí chủ thử lại sau nhé.' };
      if (interaction.deferred || interaction.replied) await interaction.followUp(ephemeral(msg));
      else await interaction.reply(ephemeral(msg));
    } catch { /* bỏ qua */ }
  }
});

module.exports = { setHallRefresh };
