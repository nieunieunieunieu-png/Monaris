// ===== hoso/frame/choice.js — lựa chọn khung của từng thành viên: đọc/ghi chuỗi lưu Sheet + dữ liệu cho hộp thoại / web =====
// Chuỗi lưu (cột H tab Hồ Sơ Cá Nhân): "colors=congnghe,crest=tutien,side=tudong" — chỉ lưu phần KHÁC mặc định; trống = khung mặc định.
// Giá trị `tudong` = "Tự động theo cấp" (levelRules.js): chỉ được GIẢI ra phong cách thật lúc vẽ thẻ (resolve), không lưu phong cách đã giải.
// Đọc: bỏ mọi phần có id không còn tồn tại / phong cách thiếu thành phần đó (không bao giờ ném lỗi) -> compose.js tự dùng mặc định.
const { DEFAULT_ID, PART_EXPORT, hasPart, listParts, getStyle } = require('./registry');
const rules = require('./levelRules');
const { TIERS: THEME_TIERS } = require('../../level/theme');
const { SHOP_GROUPS, CUULONG_IDS, CUULONG_SOLD_ID } = require('../../config/shop');

const { AUTO_ID } = rules;
const PARTS = Object.keys(PART_EXPORT); // colors, crest, border, side, bottom, accents
const PART_LABEL = { colors: 'Màu', crest: 'Đỉnh', border: 'Viền & góc', side: 'Cạnh bên', bottom: 'Cạnh dưới', accents: 'Phụ kiện góc', avatar: 'Khung avatar' };

// Chọn theo BỘ: 1 ô "Bộ khung thẻ" (màu + đỉnh + viền & góc + cạnh bên + cạnh dưới + phụ kiện góc cùng một phong cách) và 1 ô "Bộ khung avatar".
// Chỉ liệt kê phong cách có ĐỦ mọi thành phần của bộ. Bên dưới vẫn lưu từng thành phần (chuỗi cột H không đổi) nên dữ liệu cũ đọc được bình thường.
const MODALS = {
  main: { key: 'main', button: '🧩 Khung thẻ', title: 'Khung thẻ /hoso' },
};
// LƯU Ý: label của hộp thoại (LabelBuilder) tối đa 45 ký tự — dài hơn là builders ném lỗi, nút 🧩 Khung thẻ báo "Có lỗi khi xử lý hồ sơ".
const GROUPS = [
  { key: 'frame', label: 'Bộ khung thẻ (màu, đỉnh, viền, cạnh, góc)', parts: ['colors', 'crest', 'border', 'side', 'bottom', 'accents'], modal: 'main' },
  { key: 'avatar', label: 'Bộ khung avatar', parts: ['avatar'], modal: 'main' },
];
// Thêm 2 ô chọn BẬC (11 mục: ĐỒNG I → HUYỀN THOẠI, đổi mỗi 5 cấp) cho khung thẻ và khung avatar: lưu `tier=i<n>` / `atier=i<n>` (n = 0..10) cùng chuỗi cột H; vắng = tự động theo cấp.
// Discord chỉ nhận ≤ 25 mục/ô: 'Tự động' + 11 bậc = 12 mục (khi lên 21 bậc vẫn 22 ≤ 25).
// Chỉ chọn được bậc đã đạt (cấp >= min của bậc). Nhãn hộp thoại tối đa 45 ký tự.
const TIER_KEYS = ['tier', 'atier'];
GROUPS.push(
  { key: 'tier', tierKey: 'tier', label: 'Bậc khung thẻ (màu theo cấp)', parts: [], modal: 'main' },
  { key: 'atier', tierKey: 'atier', label: 'Bậc khung avatar', parts: [], modal: 'main' },
);
const TIER_LABEL = { tier: 'Bậc khung thẻ', atier: 'Bậc khung avatar' };
const TIER_AUTO = 'auto';
const validTier = (n) => Number.isInteger(n) && n >= 0 && n < THEME_TIERS.length;
const tierLocked = (n, level) => level !== null && level !== undefined && THEME_TIERS[n].min > Math.max(0, Math.floor(Number(level) || 0));
const tierName = (n) => (validTier(n) ? THEME_TIERS[n].label || THEME_TIERS[n].name : ''); // nhãn hiển thị ('ĐỒNG II'), không phải tên bậc chính
// Chỉ số bậc: dạng MỚI (11 bậc, đổi mỗi 5 cấp) được lưu là `i<n>` (vd tier=i3). Số trần `n` trong CHUỖI LƯU CŨ (cột H, 6 bậc cũ: 0..5)
// quy đổi sang bậc chính tương ứng: n -> 2n (riêng 5 -> 10). legacy=true chỉ dùng khi đọc chuỗi lưu; số từ ô chọn Discord/web là chỉ số MỚI.
const parseTier = (v, legacy = false) => {
  const t = String(v === null || v === undefined ? '' : v).trim().toLowerCase();
  if (!t || t === TIER_AUTO || t === 'tudong') return { auto: true };
  let n;
  if (/^i\d+$/.test(t)) n = Number(t.slice(1));
  else if (/^\d+$/.test(t)) n = legacy ? (Number(t) >= 5 ? 10 : Number(t) * 2) : Number(t);
  else n = THEME_TIERS.findIndex((x) => x.name.toLowerCase() === t); // tên bậc chính -> bậc chính (step 0) đầu tiên cùng tên
  return validTier(n) ? { value: n } : { error: true };
};
// ===== SHOP-2: CHỦ ĐỀ khung — Discord chỉ nhận ≤ 25 mục/ô chọn, nên ô chọn được chia theo chủ đề.
// Nên ô chọn khung được chia theo chủ đề: người dùng chọn chủ đề trước (profile.js), rồi mở hộp thoại chỉ gồm khung của chủ đề đó.
// Chủ đề của 1 id: nhóm shop chứa nó (thành viên hoặc bộ thưởng) · `cuulong` (9 rồng + Chí Tôn) · còn lại `coban` (khung mặc định, khung mở theo cấp, booster).
const KEEP_ID = '__keep__'; // mục "Giữ nguyên" trong ô chọn khung của 1 chủ đề: không đổi phần này
const THEME_BASIC = 'coban';
const THEME_DEFS = () => [
  { key: THEME_BASIC, label: '🎖️ Cơ bản & theo cấp', description: 'Khung mặc định, mở theo cấp, booster' },
  ...SHOP_GROUPS.filter((g) => g.key !== 'cuulong').map((g) => ({ key: g.key, label: `${g.emoji} ${g.name}`, description: 'Khung mua ở /shopkhung' })),
  { key: 'cuulong', label: '🐲 Cửu Long Quy Nhất', description: '9 bộ rồng + Cửu Long Chí Tôn' },
];
function themeOf(id) {
  const sid = String(id || '');
  if (sid === DEFAULT_ID || sid === AUTO_ID) return THEME_BASIC;
  if (CUULONG_IDS.includes(sid) || sid === CUULONG_SOLD_ID) return 'cuulong';
  const g = SHOP_GROUPS.find((x) => x.key !== 'cuulong' && (x.members.includes(sid) || x.bonus === sid));
  if (g) return g.key;
  return THEME_BASIC;
}
// Các chủ đề CÓ khung dùng được (đủ mọi thành phần của nhóm `group`); luôn có ít nhất 1 chủ đề (cơ bản). Mỗi chủ đề ≤ 23 khung (+ mặc định + tự động ≤ 25).
function listThemes(group) {
  const lists = listParts();
  const g = group || GROUPS[0];
  const ids = Object.keys(lists).length ? lists[g.parts[0]].filter((id) => g.parts.every((p) => lists[p].includes(id))) : [];
  const count = {};
  for (const id of ids) if (id !== DEFAULT_ID) count[themeOf(id)] = (count[themeOf(id)] || 0) + 1;
  return THEME_DEFS().filter((t) => t.key === THEME_BASIC || count[t.key]).map((t) => ({ ...t, count: count[t.key] || 0 }));
}
const isTheme = (key) => THEME_DEFS().some((t) => t.key === key);
// Chủ đề đang dùng của lựa chọn hiện tại (để chọn sẵn trong ô chọn chủ đề): ưu tiên bộ khung thẻ, rồi avatar.
function currentTheme(choice) {
  const id = choice && (choice.colors || choice.avatar);
  return id ? themeOf(id) : THEME_BASIC;
}
const groupsOf = (modalKey) => GROUPS.filter((g) => g.modal === modalKey);

// id lưu được cho 1 thành phần: phong cách thật có thành phần đó, hoặc `tudong` khi thang tự động đang bật.
const storable = (id, part) => Boolean(id) && id !== DEFAULT_ID && (id === AUTO_ID ? rules.autoEnabled() : hasPart(id, part));

function serialize(choice) {
  const out = [];
  for (const part of PARTS) {
    const id = choice && choice[part];
    if (storable(id, part)) out.push(`${part}=${id}`);
  }
  for (const k of TIER_KEYS) if (choice && validTier(choice[k])) out.push(`${k}=i${choice[k]}`);
  return out.join(',');
}

// Chuỗi -> { part: id } (id có thể là `tudong`) hoặc null (không có phần nào hợp lệ khác mặc định).
function deserialize(str) {
  const choice = {};
  for (const piece of String(str || '').split(',')) {
    const [part, id] = piece.split('=').map((x) => (x || '').trim());
    if (TIER_KEYS.includes(part)) {
      const t = parseTier(id, true);
      if (t.value !== undefined) choice[part] = t.value;
      continue;
    }
    if (PARTS.includes(part) && storable(id, part)) choice[part] = id;
  }
  return Object.keys(choice).length ? choice : null;
}

// Lựa chọn đã lưu -> lựa chọn DÙNG ĐỂ VẼ ở cấp `level`: `tudong` giải ra phong cách theo thang cấp; phong cách đang bị khoá thì bỏ (về mặc định).
// Trả { part: id } hoặc null. Truyền vào compose/hoso card như trước (card.js không cần biết `tudong`).
function resolve(choice, level, userId) {
  if (!choice) return null;
  const out = {};
  for (const part of PARTS) {
    const id = choice[part];
    if (!id) continue;
    if (id === AUTO_ID) {
      const s = rules.autoStyleFor(part, level);
      if (s !== DEFAULT_ID) out[part] = s;
    } else if (!rules.isLocked(id, level, userId)) out[part] = id;
  }
  for (const k of TIER_KEYS) if (validTier(choice[k]) && !tierLocked(choice[k], level)) out[k] = choice[k]; // bậc đã chọn nhưng chưa đạt (tụt cấp) -> về tự động
  return Object.keys(out).length ? out : null;
}

const styleName = (id) => {
  if (id === AUTO_ID) return 'Tự động theo cấp';
  const s = getStyle(id);
  return s ? s.name || s.id : id;
};

// Bỏ các phần đang dùng phong cách còn khoá ở cấp `level` (giữ nguyên `tudong`). Dùng làm nền khi gộp hộp thoại/web để một phần khoá cũ
// (người dùng tụt cấp) không làm cả lần lưu bị từ chối vì lỗi ở phần họ không đụng tới.
function dropLocked(choice, level, userId) {
  const out = {};
  for (const [part, id] of Object.entries(choice || {})) {
    if (TIER_KEYS.includes(part)) { if (validTier(id) && !tierLocked(id, level)) out[part] = id; continue; }
    if (id === AUTO_ID || !rules.isLocked(id, level, userId)) out[part] = id;
  }
  return out;
}

// Lỗi tiếng Việt nếu lựa chọn chứa phong cách còn khoá ở cấp `level`; null nếu ổn. Mỗi phong cách báo 1 lần.
function lockError(choice, level, userId) {
  if (!choice) return null;
  const seen = new Set();
  const lines = [];
  for (const part of PARTS) {
    const id = choice[part];
    if (!id || id === AUTO_ID || seen.has(id) || !rules.isLocked(id, level, userId)) continue;
    seen.add(id);
    if (rules.boosterLocked(id, userId)) {
      lines.push(`💎 Khung **${styleName(id)}** chỉ dành cho thành viên đang **boost server**.`);
      continue;
    }
    if (rules.shopLocked(id, userId)) {
      lines.push(`🛒 Khung **${styleName(id)}** bạn chưa sở hữu — mua ở \`/shopkhung\` (bộ thưởng 🎁 mở khi mua đủ 3 bộ cùng chủ đề).`);
      continue;
    }
    lines.push(`🔒 Khung **${styleName(id)}** mở ở **cấp ${rules.unlockLevel(id)}** (bạn đang ở cấp ${Math.max(0, Math.floor(Number(level) || 0))}).`);
  }
  for (const k of TIER_KEYS) {
    const n = choice[k];
    if (validTier(n) && tierLocked(n, level)) lines.push(`🔒 ${TIER_LABEL[k]} **${tierName(n)}** mở ở **cấp ${THEME_TIERS[n].min}** (bạn đang ở cấp ${Math.max(0, Math.floor(Number(level) || 0))}).`);
  }
  return lines.length ? lines.join('\n') : null;
}

// Dòng mô tả cho màn hình /profile: "Màu: Công nghệ hiện đại · Đỉnh: Tu tiên" hoặc null khi mặc định.
// Có `level` thì mục tự động ghi kèm phong cách đang áp dụng: "Tự động theo cấp (đang là Tu tiên)".
function describe(choice, level) {
  if (!choice) return null;
  const nameOf = (p) => {
    let name = styleName(choice[p]);
    if (choice[p] === AUTO_ID && level !== undefined && level !== null) name += ` (đang là ${styleName(rules.autoStyleFor(p, level))})`;
    return name;
  };
  const out = [];
  for (const g of GROUPS) {
    const have = g.parts.filter((p) => choice[p]);
    if (!have.length) continue;
    const same = have.length === g.parts.length && have.every((p) => choice[p] === choice[have[0]]);
    if (same) out.push(`${g.key === 'avatar' ? 'Khung avatar' : 'Bộ khung'}: **${nameOf(have[0])}**`);
    else for (const p of have) out.push(`${PART_LABEL[p]}: **${nameOf(p)}**`);
  }
  for (const k of TIER_KEYS) if (validTier(choice[k])) out.push(`${TIER_LABEL[k]}: **${tierName(choice[k])}**`);
  return out.join(' · ');
}

// Thang tự động dạng chữ ngắn cho mô tả ô chọn: "cấp 0 Mặc định · 10 Tu tiên · …" (tối đa 100 ký tự theo giới hạn Discord).
function ladderText() {
  const txt = rules.ladder().map((s) => `${s.min} ${styleName(s.id)}`).join(' · ');
  const full = `Đổi theo cấp: ${txt}`;
  return full.length > 100 ? `${full.slice(0, 99).trimEnd()}…` : full;
}

// Tuỳ chọn cho 1 ô chọn của hộp thoại (group = 1 phần tử GROUPS): phong cách nào có ĐỦ mọi thành phần của nhóm.
// Phong cách đang khoá ở cấp `level` vẫn hiện (🔒 + cấp mở khoá) để người dùng biết cần lên cấp nào; chọn thì bị từ chối lúc lưu (lockError).
function optionsFor(group, choice, level, userId, themeKey) {
  if (group.tierKey) {
    const cur = choice && validTier(choice[group.tierKey]) ? choice[group.tierKey] : null;
    const opts = [{ label: '🎚️ Tự động theo cấp', value: TIER_AUTO, description: 'Bậc đổi theo cấp của bạn', default: cur === null }];
    THEME_TIERS.forEach((t, i) => {
      const locked = tierLocked(i, level);
      opts.push({ label: `${locked ? '🔒 ' : ''}${t.label || t.name}`.slice(0, 100), value: String(i), description: locked ? `Mở ở cấp ${t.min}` : `Đã mở (từ cấp ${t.min})`, default: cur === i });
    });
    return opts;
  }
  const lists = listParts();
  const ids = Object.keys(lists).length ? lists[group.parts[0]].filter((id) => group.parts.every((p) => lists[p].includes(id))) : [];
  const cur = (choice && choice[group.parts[0]]) || DEFAULT_ID;
  const themed = isTheme(themeKey); // có chủ đề: chỉ khung thuộc chủ đề đó (mặc định + tự động luôn có mặt)
  // Thứ tự: theo thang tự động (đồng bộ thứ tự mở khoá), còn lại theo thứ tự quét thư mục.
  const rank = (id) => { const i = rules.ladder().findIndex((s) => s.id === id); return i < 0 ? 99 : i; };
  const real = ids.filter((id) => id !== DEFAULT_ID && (!themed || themeOf(id) === themeKey)).sort((a, b) => rank(a) - rank(b));
  const opts = [{ label: styleName(DEFAULT_ID).slice(0, 100), value: DEFAULT_ID, default: cur === DEFAULT_ID }];
  if (!ids.includes(DEFAULT_ID)) opts.length = 0; // phòng hờ: thiếu khung mặc định thì không ép hiện mục mặc định
  if (rules.autoEnabled()) opts.push({ label: '🎚️ Theo level (tự đổi khi lên cấp)', value: AUTO_ID, description: ladderText(), default: cur === AUTO_ID });
  for (const id of real) {
    const locked = rules.isLocked(id, level, userId);
    const o = { label: `${locked ? '🔒 ' : ''}${styleName(id)}`.slice(0, 100), value: id, default: id === cur };
    if (rules.isBoosterOnly(id)) { o.description = locked ? 'Chỉ dành cho người boost server' : 'Đặc quyền Nitro Booster'; opts.push(o); continue; }
    if (rules.isShopFrame(id)) { o.shop = true; o.locked = locked; o.description = locked ? 'Chưa sở hữu — mua ở /shopkhung' : 'Đã sở hữu (cửa hàng)'; opts.push(o); continue; }
    if (rules.unlockLevel(id) > 0) o.description = locked ? `Mở khoá ở cấp ${rules.unlockLevel(id)}` : `Đã mở khoá (từ cấp ${rules.unlockLevel(id)})`;
    opts.push(o);
  }
  // Discord chỉ nhận tối đa 25 mục. Khi đã chia theo chủ đề thì không bao giờ dư; đường cũ (không chủ đề) vẫn bỏ bớt khung shop chưa sở hữu:
  // nếu dư, bỏ bớt các khung shop CHƯA sở hữu (chọn cũng bị từ chối) từ cuối lên; người dùng xem đủ ở /shopkhung.
  for (let i = opts.length - 1; i >= 0 && opts.length > 25; i -= 1) if (opts[i].shop && opts[i].locked) opts.splice(i, 1);
  return opts.slice(0, 25).map(({ shop, locked, ...o }) => o);
}

// Giá trị đã chọn trong 1 hộp thoại { colors:'x', crest:'y', ... } -> choice { part: id }, GỘP vào `base` (lựa chọn hiện có)
// để hộp này không làm mất phần của hộp kia. Chọn "mặc định" = xoá phần đó (serialize bỏ qua DEFAULT_ID).
function choiceFromPicks(picks, base) {
  const choice = { ...(base || {}) };
  for (const g of GROUPS) {
    const id = picks && picks[g.key];
    if (!id || id === KEEP_ID) continue;
    if (g.tierKey) {
      const t = parseTier(id);
      if (t.auto) delete choice[g.tierKey];
      else if (t.value !== undefined) choice[g.tierKey] = t.value;
      continue;
    }
    for (const part of g.parts) choice[part] = id;
  }
  return choice;
}

const rankOf = (id) => (id === DEFAULT_ID ? -1 : (() => { const i = rules.ladder().findIndex((s) => s.id === id); return i < 0 ? 99 : i; })());

// Dữ liệu cho trang web: từng thành phần + danh sách lựa chọn (kèm trạng thái khoá) + thang tự động.
function webOptions(level, userId) {
  const lists = listParts();
  return {
    defaultId: DEFAULT_ID,
    autoId: AUTO_ID,
    themes: listThemes().map((t) => ({ key: t.key, label: t.label, count: t.count })), // gom khung theo chủ đề cho web; mỗi option có `theme`
    tiers: THEME_TIERS.map((t, i) => ({ index: i, name: t.name, label: t.label || t.name, step: t.step || 0, minLevel: t.min, color: t.main, locked: tierLocked(i, level) })), // chọn bậc: body.frame = { tier: 0..10|'auto', avatarTier: 0..10|'auto' } (`label` = tên hiển thị, `name` = tên bậc chính)
    auto: { enabled: rules.autoEnabled(), ladder: rules.ladder().map((s) => ({ min: s.min, id: s.id, name: styleName(s.id) })) },
    parts: PARTS.map((part) => ({
      key: part,
      label: PART_LABEL[part],
      options: (lists[part] || []).slice().sort((a, b) => rankOf(a) - rankOf(b)).map((id) => ({
        id,
        name: styleName(id),
        theme: themeOf(id),
        unlockLevel: rules.unlockLevel(id),
        locked: rules.isLocked(id, level, userId),
        boosterOnly: rules.isBoosterOnly(id),
        shop: rules.isShopFrame(id), // true = khung bán ở /shopkhung: `locked` nghĩa là CHƯA SỞ HỮU (unlockLevel luôn 0)
      })),
    })),
  };
}

// Dữ liệu web gửi lên -> chuỗi lưu. Nhận: chuỗi đã serialize | '' / null (về mặc định) | object { colors?, crest?, border?, side?, bottom?, accents? }
// (object chỉ ghi đè các phần có mặt, phần vắng giữ nguyên `base`; id '' hoặc 'macdinh' = mặc định; 'tudong' = tự động theo cấp).
// Trả { value } hoặc { error } (tiếng Việt).
function parseWebFrame(input, base) {
  if (input === null || input === '') return { value: '' };
  if (typeof input === 'string') return { value: serialize(deserialize(input)) };
  if (typeof input !== 'object' || Array.isArray(input)) return { error: 'Khung thẻ gửi lên không hợp lệ.' };
  const choice = { ...(base || {}) };
  for (const [part, idRaw] of Object.entries(input)) {
    if (part === 'tier' || part === 'avatarTier') {
      const key = part === 'tier' ? 'tier' : 'atier';
      const t = parseTier(idRaw);
      if (t.error) return { error: `${TIER_LABEL[key]} không hợp lệ (0-${THEME_TIERS.length - 1} hoặc "auto").` };
      if (t.auto) delete choice[key]; else choice[key] = t.value;
      continue;
    }
    if (!PARTS.includes(part)) return { error: `Thành phần khung không hợp lệ: ${part}.` };
    const id = String(idRaw === null || idRaw === undefined ? '' : idRaw).trim();
    if (!id || id === DEFAULT_ID) {
      delete choice[part];
      continue;
    }
    if (!storable(id, part)) return { error: `Phong cách "${id}" không dùng được cho ${PART_LABEL[part]}.` };
    choice[part] = id;
  }
  return { value: serialize(choice) };
}

module.exports = { KEEP_ID, THEME_BASIC, themeOf, listThemes, isTheme, currentTheme, TIER_KEYS, validTier, PARTS, PART_LABEL, MODALS, GROUPS, AUTO_ID, groupsOf, serialize, deserialize, resolve, dropLocked, lockError, describe, optionsFor, choiceFromPicks, styleName, webOptions, parseWebFrame };
