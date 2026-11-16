// ===== congDuc/view.js — dựng embed/nút cho Công Đức (THUẦN: trả object JSON thô của Discord API, không cần discord.js) =====
// Giọng văn Phật pháp, thanh tịnh, ngắn. Không dùng từ tu tiên/kiếm hiệp. Mọi phản hồi tương tác đều ephemeral (flags 64) do interactions.js đặt.
const cfg = require('../config/congDuc');
const core = require('./core');

const GOLD = 0xe6b422;
const MARKER = 'Công Đức • thông báo cảnh giới'; // footer nhận diện tin thông báo cần giữ lại (ngoài id đã lưu)
const EPHEMERAL = 64;
const BTN = { PRIMARY: 1, SECONDARY: 2, SUCCESS: 3, DANGER: 4 };
const IDS = { THAP: 'cd:thap', ME: 'cd:me', TOP: 'cd:top', SHOP: 'cd:shop', SHOP_BACK: 'cd:shopback', PICK: 'cd:shoppick', NANGCAP: 'cd:nangcap' };
const RARITY_LABEL = { common: 'Thường', rare: 'Hiếm', epic: 'Sử thi', legendary: 'Huyền thoại' };
const RARITY_ICON = { common: '⚪', rare: '🔵', epic: '🟣', legendary: '🟡' };

const fmt = (n) => Number(n || 0).toLocaleString('vi-VN');
const fmtExp = (n) => Number(n || 0).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
const esc = (s) => String(s || '').replace(/([*_~`|>\\])/g, '\\$1').slice(0, 40);
const bar = (pct, cells = 10) => { const f = Math.max(0, Math.min(cells, Math.round((pct / 100) * cells))); return '▰'.repeat(f) + '▱'.repeat(cells - f); };
const medal = (i) => ['🥇', '🥈', '🥉'][i] || `**${i + 1}.**`;

const button = (customId, label, style = BTN.SECONDARY, disabled = false) => ({ type: 2, style, label, custom_id: customId, disabled });
const row = (...buttons) => ({ type: 1, components: buttons });

const buyId = (id) => `cd:shopbuy:${id}`;
const parseBuyId = (cid) => { const m = /^cd:shopbuy:(cd_[a-z0-9_]{1,60})$/.exec(String(cid || '')); return m ? m[1] : null; };
const upgradeId = (kind) => `cd:up:${kind}`;
const parseUpgradeId = (cid) => { const m = /^cd:up:(khung|avatar|danhhieu)$/.exec(String(cid || '')); return m ? m[1] : null; };
const burnId = (userId, day, n) => `cd:burn:${userId}:${day}:${n}`;
function parseBurnId(cid) {
  const m = /^cd:burn:(\d{5,25}):(\d{4}-\d{2}-\d{2}):(\d)$/.exec(String(cid || ''));
  return m ? { userId: m[1], day: m[2], n: Number(m[3]) } : null;
}

function realmText(total) {
  const info = core.realmInfo(total);
  const next = info.next ? `${bar(info.pct)} ${info.pct}% → ${info.next.name} (còn ${fmt(info.toNext)})` : 'Đã viên mãn';
  return { info, line: `🪷 **${info.name}** · ${fmt(total)} Công Đức\n${next}` };
}

// ---------- Sảnh (tin chung, cố định) ----------
// hoangDaoLine: chuỗi mô tả Giờ Hoàng Đạo hôm nay (congDuc/hoangDao.js describeToday()) hoặc null nếu tắt.
function hallPayload({ sitting = 0, incensed = [], top = [], hoangDaoLine = null } = {}) {
  const shown = incensed.slice(0, 10).map((r) => esc(r.name || 'Ẩn danh'));
  const more = incensed.length - shown.length;
  const incenseText = incensed.length ? `${shown.join(', ')}${more > 0 ? ` và ${more} người khác` : ''}` : 'Chưa có ai — hãy là người thắp nén hương đầu tiên.';
  const topText = top.length ? top.slice(0, 3).map((r, i) => `${medal(i)} ${esc(r.name || 'Ẩn danh')} — ${fmt(r.todayCd)}`).join('\n') : 'Chưa có Công Đức hôm nay.';
  return {
    embeds: [{
      color: GOLD,
      title: '🪷 Sảnh Công Đức',
      description: `A Di Đà Phật. Ngồi nghe tiếng mõ trong phòng voice để tích Công Đức, thắp hương mỗi ngày để giữ chuỗi${require('../features').isEnabled('samhoi') ? ' — ngồi thiền cũng là cách xả sám hối' : ''}.`,
      fields: [
        { name: '🧘 Đang tu hành', value: `${fmt(sitting)} người`, inline: true },
        { name: '🪔 Đã thắp hương hôm nay', value: incenseText },
        { name: '🏆 Top Công Đức hôm nay', value: topText },
        ...(hoangDaoLine ? [{ name: '\u200b', value: hoangDaoLine }] : []),
        ...(require('../features').isEnabled('samhoi') ? [{ name: '🧘 Thiền', value: `Ngồi phòng voice để tụng niệm vừa tích Công Đức, vừa giảm **${fmt(cfg.SAM_HOI_MEDITATE_PER_MIN)} sám hối/phút** nếu có.` }] : []),
      ],
      footer: { text: 'Bấm nút bên dưới — kết quả chỉ hiện riêng cho bạn.' },
    }],
    components: [row(button(IDS.THAP, '🪔 Thắp Hương', BTN.PRIMARY), button(IDS.ME, '📜 Công Đức Của Ta'), button(IDS.TOP, '🏆 Bảng Xếp Hạng'), button(IDS.SHOP, '🛍️ Cửa Hàng'), button(IDS.NANGCAP, '🪷 Dâng Lòng Thành', BTN.SUCCESS))],
  };
}

// ---------- Thông báo lên cảnh giới (công khai, giữ lại) ----------
function realmNoticePayload(userId, up) {
  return { embeds: [{ color: GOLD, description: `🪷 A Di Đà Phật! <@${userId}> đã tu đến cảnh giới **${up.to}**.`, footer: { text: MARKER } }] };
}

// Khối hiển thị 1 quẻ xăm (congDuc/queXam.js draw()/todayResult() trả về) — dùng chung ở huongView + mineView.
function queXamBlock(que) {
  if (!que || !que.tier) return [];
  const lines = [`${que.tier.emoji} **Quẻ ${que.tier.label}**${que.already ? ' _(đã rút hôm nay)_' : ''}`, `_"${que.text}"_`];
  if (!que.already && que.bonus && que.bonus.added > 0) lines.push(`✨ +**${fmt(que.bonus.added)}** Công Đức`);
  if (que.tier.buffMinutes > 0 && que.tier.buffMult > 1) lines.push(`🌟 Công Đức x${que.tier.buffMult} trong ${que.tier.buffMinutes} phút tới!`);
  return lines;
}

// ---------- Thắp hương / Đốt hương (ephemeral) ----------
// free: kết quả freeIncense (hoặc null) · burn: kết quả burnIncense (hoặc null) · que: kết quả queXam.draw() (hoặc null)
// q: kết quả incense.quote · note: dòng lưu ý thêm
function huongView({ userId, free = null, burn = null, que = null, q, note = '', now = Date.now() }) {
  const lines = [];
  if (free && free.status === 'ok') {
    lines.push(`A Di Đà Phật, thí chủ đã thắp hương ngày thứ **${free.streak}** liên tiếp.`, `✨ +**${fmt(free.reward)}** Công Đức${free.streak >= free.best ? ' · 🔥 kỷ lục chuỗi' : ` · chuỗi dài nhất ${free.best}`}`);
    if (free.realmUp) lines.push(`🌸 Thí chủ đã lên cảnh giới **${free.realmUp.to}**!`);
    if (que && que.tier) { lines.push('', '🎋 **Rút quẻ đầu ngày**'); lines.push(...queXamBlock(que)); }
  } else if (free && free.status === 'already') {
    lines.push('Hôm nay thí chủ đã thắp hương rồi, mai quay lại nhé.');
  } else if (free && free.status === 'busy') {
    lines.push('Đang xử lý lần bấm trước, thí chủ chờ một chút.');
  }
  if (burn) {
    if (burn.status === 'ok') {
      lines.push(`A Di Đà Phật, thí chủ đã đốt nén hương thứ **${burn.n}** hôm nay.${burn.roll.premium ? ' 🌟 **Thượng phẩm**' : ''}`,
        `🔥 −${fmt(burn.cost)} điểm · 📈 +**${fmtExp(burn.roll.exp)}** EXP Level · ✨ +**${fmt(burn.roll.cd)}** Công Đức`);
      if (burn.realmUp) lines.push(`🌸 Thí chủ đã lên cảnh giới **${burn.realmUp.to}**!`);
    } else lines.push(burnProblem(burn));
  }
  if (note) lines.push(note);

  const rec = (q && q.rec) || core.getRecord(userId, '', { create: false });
  const total = rec ? rec.total : 0;
  const { line } = realmText(total);
  const streak = rec ? core.currentStreak(rec, now) : 0;
  const parts = [line];
  const components = [];
  if (q) {
    if (!q.paidEnabled) parts.push('Đốt hương đang tạm tắt.');
    else if (!q.next) parts.push(`Hôm nay đã đốt đủ ${q.max}/${q.max} nén hương, mai quay lại nhé.`);
    else {
      const have = q.balance === null ? 'chưa đọc được' : fmt(q.balance);
      parts.push(`Điểm Hoạt Động của bạn: **${have}** (đốt lần ${q.next.n}/${q.max})`);
      const short = q.balance !== null && q.balance < q.next.cost;
      if (short) parts.push(`Cần ${fmt(q.next.cost)}, bạn có ${fmt(q.balance)}.`);
      components.push(row(button(burnId(userId, core.vnDay(now), q.next.n), `🔥 Đốt thêm hương · ${fmt(q.next.cost)} điểm`, BTN.DANGER, short)));
    }
    if (streak > 0) parts.push(`Chuỗi thắp hương hiện tại: **${streak}** ngày`);
  }
  return { embeds: [{ color: GOLD, title: '🪔 Hương Án', description: [...lines, '', ...parts].join('\n').trim() }], components };
}

function burnProblem(b) {
  switch (b.status) {
    case 'no_points': return `Không đủ điểm: cần ${fmt(b.need)}, bạn có ${fmt(b.have)}. Chưa trừ gì cả.`;
    case 'mismatch': return `Giá đã thay đổi — đã làm mới, lần kế tốn ${fmt(b.next.cost)} điểm.`;
    case 'done_all': return 'Hôm nay đã đốt đủ hương, mai quay lại nhé.';
    case 'level_loading': return 'Hệ thống Level đang nạp, thí chủ thử lại sau ít giây.';
    case 'disabled': return 'Đốt hương đang tạm tắt.';
    case 'busy': return 'Đang xử lý lần bấm trước, thí chủ chờ một chút.';
    default: return 'Có lỗi khi ghi điểm — chưa trừ gì cả, thí chủ thử lại sau.';
  }
}

// ---------- Công Đức của ta / của người khác ----------
// que: congDuc/queXam.js todayResult() (quẻ đã rút hôm nay, hoặc null) · buffMinutes: queXam.buffMinutesLeft() (0 = không có)
function mineView({ name, rec, q = null, que = null, buffMinutes = 0, self = true, now = Date.now() }) {
  const total = rec ? rec.total : 0;
  const { line } = realmText(total);
  const day = core.vnDay(now);
  const todayMin = rec && rec.dayKey === day ? rec.todayMin : 0;
  const fields = [
    { name: 'Điểm Lòng Thành còn lại', value: fmt(core.sincerityOf(rec)), inline: true },
    ...(rec && rec.repent > 0 ? [{ name: 'Điểm sám hối', value: `${fmt(Math.round(rec.repent))} — ngồi phòng voice có bot để thiền, −${cfg.SAM_HOI_MEDITATE_PER_MIN}/phút`, inline: true }] : []),
    { name: 'Chuỗi thắp hương', value: `${rec ? core.currentStreak(rec, now) : 0} ngày (dài nhất ${rec ? rec.bestStreak : 0})`, inline: true },
    { name: 'Hôm nay', value: [
      `Ngồi voice: ${todayMin}${cfg.CONG_DUC_DAILY_MAX_MINUTES > 0 ? `/${cfg.CONG_DUC_DAILY_MAX_MINUTES}` : ''} phút`,
      `Thắp hương: ${rec && core.freeIncenseDone(rec, now) ? '✅ đã thắp' : '⬜ chưa thắp'}`,
      `Đốt hương: ${core.burnsToday(rec, now)}/${core.MAX_BURNS_PER_DAY} lần${self && q && q.next ? ` · lần kế ${fmt(q.next.cost)} điểm` : ''}`,
    ].join('\n') },
    ...(que && que.tier ? [{ name: '🎋 Quẻ xăm hôm nay', value: queXamBlock(que).join('\n') }] : []),
    ...(buffMinutes > 0 ? [{ name: '🌟 Buff đang hiệu lực', value: `Công Đức nhân hệ số, còn ${buffMinutes} phút` }] : []),
  ];
  return { embeds: [{ color: GOLD, title: `📜 Công Đức của ${esc(name)}`, description: line, fields }], components: [] };
}

// ---------- Dâng Lòng Thành: nâng Pháp Khung / Pháp Diện / Danh Hiệu (ephemeral) ----------
// overview: congDuc/upgrade.js overview() = { ready, balance, items: [{ kind, label, icon, desc, tier, max, title, next: { tier, cost, title } | null }] } · note: dòng kết quả lần bấm trước
function nangCapView({ overview, note = '' } = {}) {
  const { ready, balance, items } = overview;
  const lines = items.map((it) => {
    const now = it.kind === 'danhhieu' ? `**${it.title}** (bậc ${it.tier}/${it.max})` : `bậc **${it.tier}/${it.max}**`;
    const next = it.next ? `nâng lên bậc ${it.next.tier}${it.kind === 'danhhieu' ? ` — ${it.next.title}` : ''}: **${fmt(it.next.cost)}** Lòng Thành` : '🙏 đã đạt bậc tối cao';
    return `${it.icon} **${it.label}** _(${it.desc})_\n${now} · ${next}`;
  });
  const desc = [note, note ? '' : null, ready ? null : '⏳ Sổ Lòng Thành đang nạp, tạm chưa nâng được.', `Điểm Lòng Thành của thí chủ: **${fmt(balance)}**`, '', ...lines].filter((s) => s !== null && s !== undefined);
  const buttons = items.map((it) => {
    const short = !it.next || balance < it.next.cost;
    const label = it.next ? `${it.icon} Nâng ${it.label} · ${fmt(it.next.cost)}` : `${it.icon} ${it.label} · tối cao`;
    return button(upgradeId(it.kind), label.slice(0, 80), BTN.SUCCESS, !ready || short);
  });
  return { embeds: [{ color: GOLD, title: '🪷 Dâng Lòng Thành', description: desc.join('\n').trim(), footer: { text: 'Mỗi lần dâng nâng 1 bậc. Khung và avatar hiện ở thẻ /hosocd.' } }], components: [row(...buttons)] };
}

// ---------- Bảng xếp hạng ----------
function topView(kind, list, now = Date.now()) {
  const titles = { ngay: '🏆 Top Công Đức hôm nay', tuan: '🏆 Top Công Đức tuần này', thang: '🏆 Top Công Đức tháng này', tong: '🏆 Top Công Đức tổng' };
  const key = kind === 'ngay' ? 'todayCd' : kind === 'tuan' ? 'weekCd' : kind === 'thang' ? 'monthCd' : 'total';
  const body = list.length ? list.map((r, i) => `${medal(i)} ${esc(r.name || 'Ẩn danh')} — ${fmt(r[key])}${kind === 'tong' ? ` · ${core.realmInfo(r.total).name}` : ''}`).join('\n') : 'Chưa có dữ liệu.';
  return {
    embeds: [{ color: GOLD, title: titles[kind] || titles.tong, description: body }],
    components: [row(button('cd:top:ngay', 'Hôm nay', kind === 'ngay' ? BTN.PRIMARY : BTN.SECONDARY), button('cd:top:tuan', 'Tuần này', kind === 'tuan' ? BTN.PRIMARY : BTN.SECONDARY), button('cd:top:thang', 'Tháng này', kind === 'thang' ? BTN.PRIMARY : BTN.SECONDARY), button('cd:top:tong', 'Tổng', kind === 'tong' ? BTN.PRIMARY : BTN.SECONDARY))],
  };
}

const shopSoonView = () => ({ embeds: [{ color: GOLD, title: '🛍️ Cửa Hàng Công Đức', description: 'Sắp mở bán.' }], components: [] });

// ---------- Cửa hàng Công Đức (ephemeral): danh sách + chọn bộ khung -> chi tiết + nút Mua ----------
// items: [{ id, name, rarity, price, owned }] · balance: Điểm Lòng Thành · ready: sổ chi + dữ liệu sở hữu đã nạp xong
function shopHomeView({ items = [], balance = 0, ready = true, note = '' } = {}) {
  if (!items.length) return shopSoonView();
  const lines = items.map((it) => `${it.owned ? '✅' : '▫️'} ${RARITY_ICON[it.rarity] || '⚪'} **${esc(it.name)}** — ${fmt(it.price)} Lòng Thành${it.owned ? ' _(đã có)_' : ''}`);
  const options = items.slice(0, 25).map((it) => ({
    label: `${it.owned ? '✅ ' : ''}${it.name}`.slice(0, 100), value: it.id,
    description: (it.owned ? 'Đã sở hữu' : `${fmt(it.price)} Lòng Thành · ${RARITY_LABEL[it.rarity] || ''}`).slice(0, 100),
  }));
  const desc = [note, ready ? '' : '⏳ Cửa hàng đang nạp dữ liệu, tạm chưa mua được.', `Điểm Lòng Thành của thí chủ: **${fmt(balance)}**`, '', ...lines].filter((s) => s !== null && s !== undefined && s !== false);
  return {
    embeds: [{ color: GOLD, title: '🛍️ Cửa Hàng Công Đức', description: desc.join('\n').trim(), footer: { text: 'Mua xong, vào /profile → 🧩 Khung thẻ để dùng.' } }],
    components: [{ type: 1, components: [{ type: 3, custom_id: IDS.PICK, placeholder: 'Chọn bộ khung để xem / mua', options }] }],
  };
}

function shopItemView({ item, owned = false, balance = 0, note = '' } = {}) {
  const short = !owned && balance < item.price;
  const desc = [note, note ? '' : null, `Độ hiếm: ${RARITY_ICON[item.rarity] || '⚪'} ${RARITY_LABEL[item.rarity] || ''}`, `Giá: **${fmt(item.price)}** Lòng Thành`, `Thí chủ có: **${fmt(balance)}**`,
    owned ? '✅ Thí chủ đã sở hữu bộ này.' : short ? `Còn thiếu ${fmt(item.price - balance)} Lòng Thành.` : null].filter((s) => s !== null && s !== undefined);
  return {
    embeds: [{ color: GOLD, title: `${RARITY_ICON[item.rarity] || '⚪'} ${esc(item.name)}`, description: desc.join('\n').trim() }],
    components: [row(button(buyId(item.id), owned ? '✅ Đã sở hữu' : `🛒 Mua · ${fmt(item.price)}`, BTN.SUCCESS, owned || short), button(IDS.SHOP_BACK, '↩️ Danh sách'))],
  };
}

// ---------- Slash (JSON thô) ----------
const CONG_DUC_SLASH_COMMANDS = [
  { name: 'congduc', description: 'Xem Công Đức, Cảnh Giới, chuỗi thắp hương (chỉ dùng ở Sảnh Công Đức)', options: [{ type: 6, name: 'nguoi', description: 'Xem của người khác', required: false }] },
  { name: 'topcongduc', description: 'Bảng xếp hạng Công Đức (chỉ dùng ở Sảnh Công Đức)', options: [{ type: 3, name: 'loai', description: 'Loại bảng', required: false, choices: [{ name: 'Hôm nay', value: 'ngay' }, { name: 'Tuần này', value: 'tuan' }, { name: 'Tháng này', value: 'thang' }, { name: 'Tổng', value: 'tong' }] }] },
  { name: 'canhgioi', description: 'Thẻ ảnh Cảnh Giới Công Đức của bạn hoặc người khác (chỉ dùng ở Sảnh Công Đức)', options: [{ type: 6, name: 'nguoi', description: 'Xem của người khác', required: false }] },
  { name: 'hosocd', description: 'Thẻ hồ sơ Công Đức, khung Liên Hoa theo cảnh giới (dùng ở mọi kênh)', options: [{ type: 6, name: 'nguoi', description: 'Xem của người khác', required: false }] },
  { name: 'cuahangcongduc', description: 'Cửa hàng Công Đức: khung & viền mua bằng Điểm Lòng Thành (chỉ dùng ở Sảnh Công Đức)' },
];

const ephemeral = (payload) => ({ ...payload, flags: EPHEMERAL });
module.exports = { MARKER, IDS, EPHEMERAL, upgradeId, parseUpgradeId, nangCapView, buyId, parseBuyId, shopHomeView, shopItemView, burnId, parseBurnId, hallPayload, realmNoticePayload, huongView, burnProblem, mineView, topView, shopSoonView, CONG_DUC_SLASH_COMMANDS, ephemeral, esc, fmt };
