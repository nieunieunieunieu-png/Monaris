// ===== shop/index.js — CỬA HÀNG KHUNG HỒ SƠ: /shopkhung (xem · mua bằng Điểm Hoạt Động) + /shopcap (admin tặng/thu hồi) + mở BỘ THƯỞNG =====
// Luật: 16 bộ khung bán bằng điểm, chia 5 chủ đề (config/shop.js SHOP_GROUPS). Sở hữu đủ SHOP_BUNDLE_REQUIRED (mặc định 3) bộ trong CÙNG 1 chủ đề
// -> tự mở thêm 1 BỘ THƯỞNG của chủ đề đó (đẹp hơn bộ thường, không bán). Khung chỉ chọn được ở /profile (🧩 Khung thẻ) khi đã sở hữu (hoso/frame/levelRules.js).
// Điểm = "Điểm còn lại" tab Điểm Hoạt Động; mua xong ghi sổ "Lịch Sử Dùng Điểm" (không trừ EXP/Cấp). Khung đã có lưu tab "Shop Khung".
const { Events, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const client = require('../client');
const { ADMIN_USER_ID } = require('../config');
const { SHOP_ENABLED, SHOP_BUNDLE_REQUIRED, CUULONG_SOLD_ID, CUULONG_IDS, CUULONG_ANNOUNCE_CHANNEL_ID, CUULONG_RANK_MARK } = require('../config/shop');
const { isBotReady, replyNotReadyToInteraction } = require('../utils/readyGate');
const catalog = require('./catalog');
const ownership = require('./ownership');
const sheet = require('../googleSheets/shopSheet');
const { renderPreview } = require('./preview');
const dragonKit = require('../hoso/dragonKit');

const fmt = (n) => Number(n).toLocaleString('vi-VN');
const PREFIX = 'shop:';
const STALE_MS = 60 * 1000;
let lastLoad = 0;
let pending = []; // dòng "Shop Khung" chưa ghi được lên Sheet (thử lại mỗi phút)
const busy = new Set(); // userId đang mua -> chống bấm đúp
let ranks = new Map(); // userId -> { rank, at } — thứ tự Chí Tôn 9/9 (dòng đánh dấu trong tab Shop Khung)
let rankQueue = Promise.resolve(); // xếp hàng cấp số thứ tự để 2 người cùng đủ 9/9 không trùng số

const SHOP_SLASH_COMMANDS = [
  new SlashCommandBuilder().setName('shopkhung').setDescription('Cửa hàng khung hồ sơ: mua bằng Điểm Hoạt Động, mua đủ 3 bộ cùng chủ đề để mở bộ thưởng'),
  new SlashCommandBuilder()
    .setName('shopcap')
    .setDescription('(Chỉ admin) Tặng 1 bộ khung cho thành viên (không trừ điểm; thu hồi = xoá dòng ở tab Shop Khung)')
    .addUserOption((o) => o.setName('nguoi').setDescription('Thành viên').setRequired(true))
    // 35 mục > giới hạn 25 lựa chọn của Discord -> dùng gợi ý tự động (autocomplete) theo tên/mã.
    .addStringOption((o) => o.setName('khung').setDescription('Bộ khung (gõ tên hoặc mã để tìm)').setRequired(true).setAutocomplete(true))
];

// ---------------------------------------------------------------- dữ liệu
async function reload(force = false) {
  if (!force && Date.now() - lastLoad < STALE_MS) return;
  const map = await sheet.loadOwned();
  if (!map) return; // đọc lỗi: giữ bản cũ
  for (const r of pending) {
    if (!map.has(r.userId)) map.set(r.userId, new Set());
    map.get(r.userId).add(r.frameId);
  }
  ownership.replaceAll(map);
  const rk = await sheet.loadRanks();
  if (rk) { for (const [k, v] of ranks) if (!rk.has(k)) rk.set(k, v); ranks = rk; }
  ownership.setRanks(ranks); // giữ số vừa cấp mà Sheet chưa kịp có
  lastLoad = Date.now();
}

async function flushPending() {
  if (!pending.length) return;
  const batch = pending.slice();
  try {
    await sheet.appendOwned(batch);
    pending = pending.filter((r) => !batch.includes(r));
  } catch (error) {
    console.error('[shop] Ghi Shop Khung thất bại, thử lại sau:', error.message);
  }
}

async function startShop() {
  if (!SHOP_ENABLED) return;
  await sheet.ensureShopTab();
  await reload(true);
  setInterval(() => flushPending().catch(() => {}), 60 * 1000).unref();
  setInterval(() => { if (!pending.length) reload(true).catch(() => {}); }, 10 * 60 * 1000).unref();
  console.log(`[shop] Sẵn sàng (${catalog.listItems().length} mục).`);
}

const countInGroup = (userId, group) => group.members.filter((id) => ownership.has(userId, id)).length;

// Cấp bộ thưởng cho mọi chủ đề đã đủ điều kiện mà chưa có. Trả danh sách item vừa mở.
async function grantEarnedBonuses(userId, name) {
  const unlocked = [];
  for (const g of catalog.SHOP_GROUPS) {
    if (!catalog.hasBonus(g)) continue; // chủ đề Cửu Long: không có bộ thưởng tự mở (Chí Tôn mua thẳng)
    if (countInGroup(userId, g) >= SHOP_BUNDLE_REQUIRED && ownership.has(userId, g.bonus) === false) {
      ownership.add(userId, g.bonus);
      pending.push({ userId, name, frameId: g.bonus, source: 'thưởng', price: 0 });
      unlocked.push(catalog.getItem(g.bonus));
    }
  }
  if (unlocked.length) await flushPending();
  return unlocked;
}

// Đủ 9/9 (có Chí Tôn + cả 9 rồng) mà chưa có số thứ tự -> cấp số kế tiếp, ghi dòng đánh dấu, đăng thông báo kênh (nếu cấu hình). Trả { rank, isNew } hoặc null.
// An toàn gọi nhiều lần (idempotent); lỗi ghi Sheet -> null, lần gọi sau (mua/tặng/xem Chí Tôn) tự thử lại. Mọi lỗi chỉ log, không làm hỏng việc mua.
async function ensureChiTonRank(userId, name) {
  const done = () => ranks.get(String(userId));
  if (done()) return { rank: done().rank, isNew: false };
  if (ownership.has(userId, CUULONG_SOLD_ID) !== true || dragonCount(userId) < ((CUULONG_IDS || []).length || 9)) return null;
  const job = rankQueue.then(async () => {
    if (done()) return { rank: done().rank, isNew: false };
    const fresh = await sheet.loadRanks();
    if (!fresh) throw new Error('không đọc được thứ tự hiện có');
    for (const [k, v] of fresh) if (!ranks.has(k)) ranks.set(k, v);
    if (done()) return { rank: done().rank, isNew: false };
    const rank = Math.max(0, ...[...ranks.values()].map((v) => v.rank)) + 1;
    await sheet.appendOwned([{ userId: String(userId), name, frameId: CUULONG_RANK_MARK, source: 'thức tỉnh 9/9', price: rank }]);
    ranks.set(String(userId), { rank, at: '' });
    ownership.setRanks(ranks);
    return { rank, isNew: true };
  });
  rankQueue = job.catch(() => {});
  let res = null;
  try { res = await job; } catch (error) { console.error('[shop] Không cấp được số thứ tự Chí Tôn:', error.message); return null; }
  if (res && res.isNew) announceChiTon(userId, name, res.rank).catch((e) => console.error('[shop] Không đăng thông báo Chí Tôn:', e.message));
  return res;
}

async function announceChiTon(userId, name, rank) {
  if (!CUULONG_ANNOUNCE_CHANNEL_ID) return;
  const channel = await client.channels.fetch(CUULONG_ANNOUNCE_CHANNEL_ID).catch(() => null);
  if (!channel || typeof channel.send !== 'function') return;
  const embed = new EmbedBuilder().setColor(0xf5b400).setTitle('🐲 CỬU LONG CHÍ TÔN THỨC TỈNH!')
    .setDescription(`<@${userId}> (**${name}**) vừa tập hợp đủ **9/9 rồng** — trở thành **Cửu Long Chí Tôn thứ ${rank}** của bang!\nThẻ \`/hoso\` của họ giờ là bức tranh Cửu Long vây quanh.`);
  await channel.send({ embeds: [embed], allowedMentions: { parse: [] } }); // chỉ tag im lặng, không ping
}

// Mua 1 bộ. Trả { ok:true, item, left, unlocked } hoặc { ok:false, msg }.
async function buy(userId, name, id) {
  const item = catalog.getItem(id);
  if (!item || item.bonus) return { ok: false, msg: '❌ Bộ khung này không bán — bộ thưởng sẽ tự mở khi bạn mua đủ bộ trong chủ đề.' };
  if (!item.available) return { ok: false, msg: '❌ Bộ khung này chưa có trong bot.' };
  if (!ownership.isLoaded()) return { ok: false, msg: '⏳ Cửa hàng đang nạp dữ liệu, thử lại sau ít phút.' };
  if (busy.has(userId)) return { ok: false, msg: '⏳ Bạn đang có một lần mua chưa xong, đợi chút nhé.' };
  busy.add(userId);
  try {
    await reload(); // thấy cả khung admin vừa tặng thẳng trên Sheet
    if (ownership.has(userId, id)) return { ok: false, msg: `✅ Bạn đã sở hữu **${item.name}** rồi.` };
    // Chống trừ điểm 2 lần: sổ đã có dòng trừ cho khung này mà chưa có trong "Shop Khung" -> chỉ khôi phục khung, KHÔNG trừ thêm.
    if (await sheet.hasLedgerEntry(userId, id)) {
      ownership.add(userId, id);
      pending.push({ userId, name, frameId: id, source: 'mua', price: item.price });
      await flushPending();
      const unlocked = await grantEarnedBonuses(userId, name);
      const left = await sheet.readPoints(userId).catch(() => null);
      const awakened = await ensureChiTonRank(userId, name);
      return { ok: true, item, left: left === null ? 0 : left, unlocked, restored: true, awakened };
    }
    const points = await sheet.readPoints(userId);
    if (points === null) return { ok: false, msg: '❌ Chưa thấy điểm của bạn trong sổ **Điểm Hoạt Động** (có thể bạn chưa có hoạt động nào). Thử lại sau khi hoạt động.' };
    if (points < item.price) return { ok: false, msg: `❌ Không đủ điểm: cần **${fmt(item.price)}**, bạn có **${fmt(Math.floor(points))}**.` };
    await sheet.appendLedger({ userId, event: `Shop khung: ${item.name}`, points: item.price, note: item.id });
    ownership.add(userId, id);
    pending.push({ userId, name, frameId: id, source: 'mua', price: item.price });
    await flushPending();
    const unlocked = await grantEarnedBonuses(userId, name);
    const awakened = await ensureChiTonRank(userId, name);
    return { ok: true, item, left: points - item.price, unlocked, awakened };
  } catch (error) {
    console.error('[shop] Lỗi mua khung:', error.message);
    return { ok: false, msg: '❌ Có lỗi khi mua, chưa trừ điểm nếu bạn không thấy thông báo thành công. Thử lại sau nhé.' };
  } finally {
    busy.delete(userId);
  }
}

// ---------------------------------------------------------------- giao diện
const bar = (have, need) => `${'■'.repeat(Math.min(have, need))}${'□'.repeat(Math.max(0, need - have))}`;

async function homeView(userId) {
  await reload().catch(() => {});
  let readErr = null;
  const points = await sheet.readPoints(userId).catch((e) => { readErr = e; console.error('[shop] Không đọc được Điểm Hoạt Động:', e && e.message ? e.message : e); return null; });
  const pointsText = points !== null ? `**${fmt(Math.floor(points))}**` : readErr ? '**—** ⚠️ _lỗi đọc sổ điểm, thử lại sau_' : '**—** _(chưa có dòng của bạn trong tab Điểm Hoạt Động)_';
  const embed = new EmbedBuilder()
    .setColor(0xf5b400)
    .setTitle('🛒 Cửa Hàng Khung Hồ Sơ')
    .setDescription([
      `💰 Điểm của bạn: ${pointsText} (Điểm Hoạt Động — EXP/cấp của bạn không bị trừ)`,
      `🎁 Mua đủ **${SHOP_BUNDLE_REQUIRED} bộ trong cùng 1 chủ đề** → tự mở **bộ thưởng** của chủ đề đó (đẹp hơn bộ thường, không bán).`,
      `🐲 **Cửu Long Quy Nhất**: mua khung **Cửu Long Chí Tôn** (${fmt(catalog.getItem(CUULONG_SOLD_ID).price)} điểm, không cần có rồng nào), rồi mua dần 9 bộ rồng — mỗi bộ **thức tỉnh** 1 con rồng trên Chí Tôn.`,
      'Chọn một bộ ở menu bên dưới để xem ảnh và mua. Mua xong vào `/profile` → 🧩 **Khung thẻ** để dùng.',
    ].join('\n'));
  for (const g of catalog.SHOP_GROUPS) {
    const have = countInGroup(userId, g);
    const lines = g.members.map((id) => {
      const it = catalog.getItem(id);
      return `${ownership.has(userId, id) ? '✅' : '▫️'} ${catalog.RARITY_ICON[it.rarity]} ${it.name}${ownership.has(userId, id) ? '' : ` — ${fmt(it.price)}`}`;
    });
    if (catalog.hasBonus(g)) {
      const bonus = catalog.getItem(g.bonus);
      lines.push(`${ownership.has(userId, g.bonus) ? '🎁✅' : '🎁🔒'} **${bonus.name}**`);
      embed.addFields({ name: `${g.emoji} ${g.name} · ${bar(have, SHOP_BUNDLE_REQUIRED)} ${Math.min(have, g.members.length)}/${SHOP_BUNDLE_REQUIRED}`, value: lines.join('\n') });
    } else {
      // Cửu Long: Chí Tôn bán thẳng; số rồng đã có = số rồng "thức tỉnh" trên khung Chí Tôn.
      const top = catalog.getItem(g.sold);
      lines.unshift(`${ownership.has(userId, g.sold) ? '🐲✅' : '🐲'} **${top.name}**${ownership.has(userId, g.sold) ? '' : ` — ${fmt(top.price)}`}`);
      embed.addFields({ name: `${g.emoji} ${g.name} · ${bar(have, g.members.length)} ${have}/${g.members.length} rồng thức tỉnh`, value: lines.join('\n') });
    }
  }
  const optionOf = (it) => ({
    label: `${ownership.has(userId, it.id) ? '✅ ' : it.bonus ? '🎁 ' : it.sold ? '🐲 ' : ''}${it.name}`.slice(0, 100),
    value: it.id,
    description: (ownership.has(userId, it.id) ? 'Đã sở hữu' : it.bonus ? `Mở khi đủ ${SHOP_BUNDLE_REQUIRED} bộ chủ đề ${it.group.name}` : `${fmt(it.price)} điểm · ${catalog.RARITY_LABEL[it.rarity]}`).slice(0, 100),
  });
  // Discord: tối đa 25 mục/menu -> 6 chủ đề cũ (25 mục) ở menu 1, chủ đề Cửu Long (10 mục) ở menu 2.
  const all = catalog.listItems();
  const cuulong = all.filter((it) => !catalog.hasBonus(it.group));
  const rest = all.filter((it) => catalog.hasBonus(it.group));
  const rows = [new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`${PREFIX}sel`).setPlaceholder('Chọn bộ khung để xem / mua').addOptions(rest.map(optionOf)))];
  if (cuulong.length) rows.push(new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`${PREFIX}sel2`).setPlaceholder('🐲 Cửu Long Quy Nhất — Chí Tôn + 9 rồng').addOptions(cuulong.map(optionOf))));
  return { embeds: [embed], components: rows, files: [], attachments: [] };
}

// SHOP-3: số rồng đã thức tỉnh + ctx của người xem (lỗi -> 0 rồng, không bao giờ ném).
const dragonCount = (userId) => (CUULONG_IDS || []).filter((id) => ownership.has(userId, id) === true).length;
function viewerCtx(userId) {
  try { return dragonKit.makeCtx(ownership.list(userId), false); } catch (_) { return undefined; }
}
const MILESTONE_TEXT = {
  3: 'Viền **6 ô chỉ số** đổi sang viền rồng (vảy + vuốt góc), lề thẻ nhô thêm.',
  6: '**Pháp trận** hiện sau đỉnh thẻ, vòng nguyên tố quanh ảnh đại diện, dải màu chạy dọc viền.',
  9: '**THỨC TỈNH HOÀN TOÀN** — Cửu Long Châu sáng rực, bảng tên vàng kim, tên ánh kim, thanh EXP 9 nguyên tố khi đạt cấp tối đa!',
};
// Dòng thông báo thức tỉnh sau khi mua `item` (Chí Tôn hoặc 1 bộ rồng). Chỉ nói về khung Chí Tôn; bộ khác trả [].
function awakeningLines(userId, item, awakened) {
  const isDragon = (CUULONG_IDS || []).includes(item.id);
  if (!isDragon && item.id !== CUULONG_SOLD_ID) return [];
  const ownsTop = ownership.has(userId, CUULONG_SOLD_ID) === true;
  const n = dragonCount(userId);
  const total = (CUULONG_IDS || []).length || 9;
  const before = isDragon ? n - 1 : n;
  const lines = [];
  if (item.id === CUULONG_SOLD_ID) {
    lines.push(n ? `🐲 **Chí Tôn đã mở!** Bạn đang có sẵn **${n}/${total}** rồng thức tỉnh trên khung.` : `🐲 **Chí Tôn đã mở!** Khung vàng kim đã dùng được; **${total}** chỗ rồng còn là bóng mờ — mua bộ rồng để thức tỉnh từng con.`);
  } else if (ownsTop) {
    lines.push(`🐲 **${item.name}** vừa **thức tỉnh** trên Cửu Long Chí Tôn của bạn! Còn **${total - n}** rồng nữa (${n}/${total}).`);
  } else {
    lines.push(`🐲 **${item.name}** sẽ **thức tỉnh** trên Cửu Long Chí Tôn khi bạn sở hữu khung này (đang ${n}/${total} rồng).`);
  }
  if (ownsTop) for (const m of [3, 6, 9]) if (n >= m && before < m) lines.push(`✨ **Mốc ${m} rồng!** ${MILESTONE_TEXT[m]}`);
  if (awakened && awakened.isNew) lines.push(`🏆 **ĐỦ 9/9!** Bạn là **Cửu Long Chí Tôn thứ ${awakened.rank}** của bang${CUULONG_ANNOUNCE_CHANNEL_ID ? ' — bot đã đăng thông báo ở kênh' : ''}!`);
  return lines;
}

async function itemView(userId, id, notice) {
  await reload().catch(() => {});
  const it = catalog.getItem(id);
  const owned = ownership.has(userId, id) === true;
  const g = it.group;
  const have = countInGroup(userId, g);
  const points = it.bonus ? null : await sheet.readPoints(userId).catch(() => null);
  const cl = !catalog.hasBonus(g); // chủ đề Cửu Long: không có bộ thưởng
  const status = owned ? (it.sold ? `✅ Đã sở hữu · 🐲 **${have}/${g.members.length}** rồng thức tỉnh${ranks.has(String(userId)) ? ` · 🏆 **Chí Tôn thứ ${ranks.get(String(userId)).rank}** của bang` : ''}` : '✅ Đã sở hữu') : it.bonus ? `🔒 Còn thiếu **${Math.max(0, SHOP_BUNDLE_REQUIRED - have)}** bộ trong chủ đề ${g.emoji} ${g.name} (${have}/${SHOP_BUNDLE_REQUIRED})` : `💰 Giá **${fmt(it.price)}** điểm${points === null ? '' : ` · bạn có **${fmt(Math.floor(points))}**`}`;
  const desc = [notice, `Độ hiếm: ${catalog.RARITY_ICON[it.rarity]} ${catalog.RARITY_LABEL[it.rarity]}`, `Chủ đề: ${g.emoji} ${g.name}`, status];
  if (cl && !it.sold) {
    const top = catalog.getItem(g.sold);
    desc.push(ownership.has(userId, g.sold) ? `🐲 Bộ này **thức tỉnh** 1 con rồng trên **${top.name}** của bạn (đang ${have}/${g.members.length}).` : `🐲 Bộ này dùng được riêng, và sẽ **thức tỉnh** 1 con rồng trên **${top.name}** (${fmt(top.price)} điểm, mua thẳng không cần có rồng).`);
  } else if (cl && it.sold && !owned) {
    desc.push(`🐲 Mua thẳng, không cần có rồng nào. Mỗi bộ rồng bạn có (${have}/${g.members.length}) sẽ thức tỉnh 1 con rồng trên khung này; đủ mốc 3 / 6 / 9 rồng khung thêm chi tiết lớn.`);
  } else if (!it.bonus && !owned) {
    const more = SHOP_BUNDLE_REQUIRED - have - 1;
    const bn = catalog.getItem(g.bonus).name;
    desc.push(ownership.has(userId, g.bonus) ? '' : more <= 0 ? `🎁 Mua bộ này sẽ **mở ngay** bộ thưởng **${bn}**!` : `🎁 Cần thêm **${more}** bộ nữa cùng chủ đề (sau bộ này) để mở **${bn}**.`);
  }
  const embed = new EmbedBuilder().setColor(0xf5b400).setTitle(`${it.bonus ? '🎁 ' : it.sold ? '🐲 ' : ''}${it.name}`).setDescription(desc.filter(Boolean).join('\n'));
  const png = await renderPreview(id, viewerCtx(userId)); // ctx chỉ có tác dụng với Chí Tôn (hiện đúng số rồng đã thức tỉnh)
  const files = [];
  if (png) { files.push(new AttachmentBuilder(png, { name: 'preview.png' })); embed.setImage('attachment://preview.png'); }
  const canBuy = !it.bonus && !owned && it.available;
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`${PREFIX}buy:${id}`).setLabel(owned ? 'Đã sở hữu' : it.bonus ? 'Không bán' : `Mua · ${fmt(it.price)} điểm`).setEmoji('🛒').setStyle(ButtonStyle.Success).setDisabled(!canBuy || (points !== null && points < it.price)),
    new ButtonBuilder().setCustomId(`${PREFIX}home`).setLabel('Quay lại').setStyle(ButtonStyle.Secondary),
  );
  // Bộ thường -> thêm nút xem trước BỘ THƯỞNG của chủ đề (vẽ ra luôn, kể cả khi chưa mở khoá) để người chơi biết mua đủ sẽ được gì.
  if (!it.bonus && !it.sold) row.addComponents(new ButtonBuilder().setCustomId(`${PREFIX}see:${g.bonus || g.sold}`).setLabel(cl ? 'Xem Chí Tôn' : 'Xem bộ thưởng').setEmoji(cl ? '🐲' : '🎁').setStyle(ButtonStyle.Primary));
  return { embeds: [embed], components: [row], files, attachments: [] };
}

// ---------------------------------------------------------------- tương tác
const isShopInteraction = (i) => (i.isChatInputCommand() ? ['shopkhung', 'shopcap'].includes(i.commandName) : (i.isAutocomplete && i.isAutocomplete()) ? i.commandName === 'shopcap' : (i.isButton() || i.isStringSelectMenu()) && String(i.customId || '').startsWith(PREFIX));

// Gợi ý cho /shopcap: lọc 35 mục theo tên hoặc mã (không dấu cũng được), tối đa 25.
const fold = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
async function handleAutocomplete(interaction) {
  const q = fold(interaction.options.getFocused());
  const list = catalog.listItems().filter((it) => !q || fold(it.name).includes(q) || it.id.includes(q)).slice(0, 25);
  await interaction.respond(list.map((it) => ({ name: `${it.bonus ? '🎁 ' : it.sold ? '🐲 ' : ''}${it.name} (${it.id})`.slice(0, 100), value: it.id })));
}

async function handleAdminGrant(interaction) {
  if (!interaction.member?.roles?.cache?.has('1566691821806026862')) return void (await interaction.reply({ content: '❌ Chỉ admin dùng được lệnh này.', ephemeral: true }));
  const target = interaction.options.getUser('nguoi');
  const id = interaction.options.getString('khung');
  const item = catalog.getItem(id);
  if (!item) return void (await interaction.reply({ content: '❌ Không tìm thấy bộ khung này — hãy chọn từ danh sách gợi ý khi gõ.', ephemeral: true }));
  await interaction.deferReply({ ephemeral: true });
  await reload(true);
  if (ownership.has(target.id, id)) return void (await interaction.editReply(`ℹ️ ${target} đã có **${item.name}**.`));
  ownership.add(target.id, id);
  pending.push({ userId: target.id, name: target.username, frameId: id, source: 'admin', price: 0 });
  await flushPending();
  const unlocked = await grantEarnedBonuses(target.id, target.username);
  const awakened = await ensureChiTonRank(target.id, target.username);
  await interaction.editReply(`✅ Đã tặng **${item.name}** cho ${target}.${unlocked.length ? `\n🎁 Tự mở thêm: ${unlocked.map((u) => `**${u.name}**`).join(', ')}` : ''}${awakened && awakened.isNew ? `\n🐲 ${target} đủ 9/9 — **Cửu Long Chí Tôn thứ ${awakened.rank}**.` : ''}`);
}

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!isShopInteraction(interaction)) return;
    if (interaction.isAutocomplete && interaction.isAutocomplete()) return void (await handleAutocomplete(interaction));
    if (!SHOP_ENABLED) return void (await interaction.reply({ content: 'Cửa hàng khung đang tắt.', ephemeral: true }));
    if (!isBotReady()) return void (await replyNotReadyToInteraction(interaction));
    const userId = interaction.user.id;
    const name = (interaction.member && interaction.member.displayName) || interaction.user.globalName || interaction.user.username;

    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'shopcap') return void (await handleAdminGrant(interaction));
      await interaction.deferReply({ ephemeral: true });
      const view = await homeView(userId);
      await interaction.editReply(view);
      return;
    }
    const cid = interaction.customId;
    if (cid === `${PREFIX}home`) return void (await interaction.update(await homeView(userId)));
    if (cid === `${PREFIX}sel` || cid === `${PREFIX}sel2`) {
      await interaction.deferUpdate();
      const id = interaction.values[0];
      if (!catalog.isShopId(id)) return;
      return void (await interaction.editReply(await itemView(userId, id)));
    }
    if (cid.startsWith(`${PREFIX}see:`)) {
      await interaction.deferUpdate();
      const id = cid.slice(`${PREFIX}see:`.length);
      if (!catalog.isShopId(id)) return;
      return void (await interaction.editReply(await itemView(userId, id)));
    }
    if (cid.startsWith(`${PREFIX}buy:`)) {
      await interaction.deferUpdate();
      const id = cid.slice(`${PREFIX}buy:`.length);
      const res = await buy(userId, name, id);
      if (!res.ok) return void (await interaction.editReply(await itemView(userId, id, res.msg)));
      const lines = [res.restored
        ? `✅ Lần mua trước **${res.item.name}** đã trừ điểm rồi nhưng chưa kịp ghi khung — đã khôi phục khung, **không trừ thêm điểm**. Vào \`/profile\` → 🧩 Khung thẻ để dùng.`
        : `🎉 Đã mua **${res.item.name}** (−${fmt(res.item.price)} điểm hoạt động, còn **${fmt(Math.floor(res.left))}**). Vào \`/profile\` → 🧩 Khung thẻ để dùng.`];
      for (const u of res.unlocked) lines.push(`🎁 **Mở khoá bộ thưởng: ${u.name}!** (đủ ${SHOP_BUNDLE_REQUIRED} bộ chủ đề ${u.group.emoji} ${u.group.name})`);
      lines.push(...awakeningLines(userId, res.item, res.awakened));
      return void (await interaction.editReply(await itemView(userId, id, lines.join('\n'))));
    }
  } catch (error) {
    console.error('[shop] Lỗi tương tác:', error.message);
    try {
      const msg = '❌ Có lỗi khi xử lý cửa hàng, thử lại sau nhé.';
      if (interaction.deferred || interaction.replied) await interaction.followUp({ content: msg, ephemeral: true });
      else await interaction.reply({ content: msg, ephemeral: true });
    } catch (_) {
      /* bỏ qua */
    }
  }
});

module.exports = { SHOP_SLASH_COMMANDS, startShop, buy, ensureChiTonRank, grantEarnedBonuses, homeView, itemView, awakeningLines };
