// ===== level/profileApi.js — lõi "chỉnh hồ sơ" dành cho WEB (Monaris Admin), gọi qua admin/routes/routesProfile.js =====
// Làm đúng những gì /profile trong Discord làm (biệt danh, ảnh bìa/avatar/nền, màu chữ, thành tựu, quan hệ, gỡ, xem trước) nhưng
// nhận dữ liệu từ web. KHÔNG viết lại logic: ghi hồ sơ đi qua level/profile.js -> applyChange (cùng cổng cấp, cooldown ảnh, sharp,
// Cloudinary, Sheet, cache RAM), thành tựu qua setSelfAchievement, quan hệ qua applySetMqh (isBong: false, chỉ cho CHÍNH MÌNH).
// Mọi hàm nhận `userId` đã được web xác thực (session Discord) — route phải kiểm tra người đó là thành viên guild TRƯỚC khi gọi vào đây.
// Mỗi hàm trả { ok: true, ... } hoặc { ok: false, error } (lỗi người dùng, tiếng Việt); lỗi hệ thống thì ném ra.
const {
  PROFILE_ENABLED,
  PROFILE_MIN_LEVEL,
  PROFILE_IMAGE_COOLDOWN_SECONDS,
  PROFILE_MAX_UPLOAD_MB,
  PROFILE_NICKNAME_MAX,
  PROFILE_KIMLAN_NAME_MAX,
  LEVEL_ACHIEVEMENTS,
} = require('../config');
const profile = require('./profile');
const frameChoice = require('../hoso/frame/choice');
const { TIERS: THEME_TIERS } = require('./theme');
const { DEFAULT_ID: FRAME_DEFAULT_ID } = require('../hoso/frame/registry');
const { GRADIENT_PRESETS, parseColorInput, presetColors, deserializeColors } = require('./nameStyle');
const { getSelectedAchievement, getDisplayedTitle, setSelfAchievement } = require('../hoso/manualAchievements');
const { getCustomAchievements } = require('../hoso/customAchievement');
const { getAllChatGlobalMembers } = require('../googleSheets/chatGlobalSheet');

const CLEAR_KEYS = new Set(['nickname', 'bia', 'avatar', 'nen', 'mau', 'khung', 'all']); // khớp menu 🗑️ Gỡ trong /profile
const DISCORD_ID_RE = /^\d{15,25}$/;

const fail = (error) => ({ ok: false, error });

// ---- Trạng thái hiện tại (cho trang web dựng giao diện) ----
// Lựa chọn khung của 1 người dạng { colors, crest, border, side, bottom, accents } đủ 6 khoá cho web (thiếu = 'macdinh').
function frameState(p, level, userId) {
  const raw = frameChoice.deserialize(p.frame) || {};
  const eff = frameChoice.resolve(raw, level, userId) || {};
  const full = (c) => Object.fromEntries(frameChoice.PARTS.map((part) => [part, c[part] || FRAME_DEFAULT_ID]));
  // Bậc: current = 'auto' hoặc chỉ số 0..5 đã chọn; effective = chỉ số bậc THẬT đang vẽ (bậc đã chọn nếu còn đạt, không thì theo cấp).
  const lv = Math.max(0, Number(level) || 0);
  const byLevel = THEME_TIERS.reduce((acc, t, i) => (lv >= t.min ? i : acc), 0);
  const tierOut = (key, c) => (frameChoice.validTier(c[key]) ? c[key] : 'auto');
  const tierEff = (key) => (frameChoice.validTier(eff[key]) ? eff[key] : byLevel);
  return {
    current: { ...full(raw), tier: tierOut('tier', raw), avatarTier: tierOut('atier', raw) },
    effective: { ...full(eff), tier: tierEff('tier'), avatarTier: tierEff('atier') },
  };
}

async function relationshipsOf(userId, resolveName) {
  const all = await getAllChatGlobalMembers().catch(() => []);
  const me = all.find((m) => m.discordId === String(userId)) || {};
  const nameOf = async (id) => (id ? (await resolveName(id).catch(() => '')) || '' : '');
  return {
    suPhu: me.suPhuId ? { id: me.suPhuId, name: await nameOf(me.suPhuId) } : null,
    triKy: me.triKyId ? { id: me.triKyId, name: await nameOf(me.triKyId) } : null,
    kimLan: me.kimLan || null,
  };
}

async function getState(userId, { resolveName }) {
  if (!PROFILE_ENABLED || !require('../features').isEnabled('hoso')) return fail('Tính năng hồ sơ đang tắt.');
  const p = profile.getProfileRecord(userId);
  const level = profile.getLevelOf(userId);
  const gradient = p.gradient ? deserializeColors(p.gradient) : null;
  const selected = getSelectedAchievement(userId);
  const custom = getCustomAchievements(userId)[0] || null;
  const shown = getDisplayedTitle(userId);
  return {
    ok: true,
    unlocked: level >= PROFILE_MIN_LEVEL,
    level,
    minLevel: PROFILE_MIN_LEVEL,
    imageCooldownLeft: profile.imageCooldownLeftSeconds(userId),
    limits: {
      nicknameMax: PROFILE_NICKNAME_MAX,
      kimLanMax: PROFILE_KIMLAN_NAME_MAX,
      uploadMaxMb: PROFILE_MAX_UPLOAD_MB,
      imageCooldownSeconds: PROFILE_IMAGE_COOLDOWN_SECONDS,
      cover: { w: 934, h: 315 },
      avatar: { w: 256, h: 256 },
      background: { w: 934, h: 700 },
    },
    profile: {
      nickname: p.nickname || '',
      hasCover: Boolean(p.coverId),
      hasAvatar: Boolean(p.avatarId),
      hasBackground: Boolean(p.bgId),
      showTriKy: Boolean(p.showTriKy),
      allowView: p.allowView !== false,
      hideTopRole: Boolean(p.hideTopRole), // true = đã TẮT role Top tuần/tháng trên Discord
      topRole: require('./topRole').statusOf(userId), // { kind, label, remain } nếu đang đứng Top, không thì null (để web biết có nên hiện nút)
      gradient, // mảng '#rrggbb' hoặc null (= theo bậc cấp)
      // Khung thẻ /hoso: current = lựa chọn đã lưu cho từng thành phần ('macdinh' = mặc định, 'tudong' = tự động theo cấp);
      // effective = phong cách THẬT đang dùng để vẽ ở cấp hiện tại (đã giải 'tudong' và bỏ phần bị khoá).
      frame: frameState(p, level, userId),
    },
    // Danh hiệu trên thẻ chỉ dùng 1 thành tựu: thành tựu riêng (custom) thắng thành tựu tự chọn (selected).
    achievement: {
      selected: selected ? { key: selected.key, label: selected.label, quip: selected.quip } : null,
      custom: custom ? { label: custom.tenThanhTuu, note: custom.ghiChu || '' } : null,
      displayed: shown ? { label: shown.label, custom: shown.custom, note: shown.note } : null,
    },
    relationships: await relationshipsOf(userId, resolveName),
    choices: {
      // Giống dropdown trong Discord: tối đa 24 thành tựu / 24 mẫu màu (parity với bot).
      achievements: LEVEL_ACHIEVEMENTS.slice(0, 24).map((a) => ({ key: a.key, label: a.label, quip: a.quip || '' })),
      gradients: GRADIENT_PRESETS.slice(0, 24).map((g) => ({ key: g.key, label: g.label, colors: g.colors })),
      // Khung thẻ: từng thành phần (colors, crest, border, side, bottom, accents) kèm danh sách phong cách, cấp mở khoá + cờ locked theo cấp người này; auto = thang tự động theo cấp.
      frame: frameChoice.webOptions(level, userId),
    },
  };
}

// ---- Cập nhật (nickname / gradient / 3 ảnh / gỡ) — 1 lần có thể đổi nhiều thứ, giống applyChange ----
function decodeImage(field, label) {
  if (field === undefined || field === null) return { skip: true };
  const raw = typeof field === 'string' ? field : field.data;
  if (typeof raw !== 'string' || !raw) return { error: `❌ ${label}: thiếu dữ liệu ảnh.` };
  const b64 = raw.replace(/^data:[^;]+;base64,/, '');
  const maxBytes = PROFILE_MAX_UPLOAD_MB * 1024 * 1024;
  if (b64.length > Math.ceil((maxBytes * 4) / 3) + 8) return { error: `❌ ${label}: ảnh quá lớn (tối đa ${PROFILE_MAX_UPLOAD_MB}MB).` };
  const buffer = Buffer.from(b64, 'base64');
  if (!buffer.length) return { error: `❌ ${label}: dữ liệu ảnh không hợp lệ.` };
  return { buffer };
}

// gradient: null/'' -> về mặc định theo bậc | { preset: 'key' } | { colors: ['#rrggbb', ...] } | string ('#a #b' như ô nhập trong Discord)
function parseGradient(g) {
  if (g === '' || g === null) return { value: '' };
  if (g && typeof g === 'object' && !Array.isArray(g) && g.preset) {
    const colors = presetColors(String(g.preset));
    return colors ? { value: colors } : { error: 'Mẫu màu không hợp lệ, thử chọn lại.' };
  }
  const raw = Array.isArray(g) ? g.join(' ') : g && typeof g === 'object' && g.colors ? [].concat(g.colors).join(' ') : String(g);
  const r = parseColorInput(raw);
  return r.error ? { error: r.error } : { value: r.colors };
}

// body.frame (web) -> chuỗi lưu. Nền = lựa chọn đang lưu đã bỏ phần bị khoá (người tụt cấp không bị lỗi ở phần họ không đổi).
function parseFrameInput(userId, input) {
  const level = profile.getLevelOf(userId);
  const base = frameChoice.dropLocked(frameChoice.deserialize(profile.getProfileRecord(userId).frame), level, userId);
  return frameChoice.parseWebFrame(input, base);
}

async function updateProfile(userId, body) {
  if (!PROFILE_ENABLED || !require('../features').isEnabled('hoso')) return fail('Tính năng hồ sơ đang tắt.');
  // Quyền riêng tư (hiện Tri Kỷ / cho người khác xem) không bị khoá theo cấp; các thay đổi khác vẫn cần đủ cấp.
  const privacyKeys = ['showTriKy', 'allowView', 'hideTopRole'];
  const onlyPrivacy = Object.keys(body).filter((k) => !['discordId'].includes(k) && body[k] !== undefined).every((k) => privacyKeys.includes(k));
  const gate = onlyPrivacy ? null : profile.gateError(userId);
  if (gate) return fail(gate);

  const change = {};
  if (body.showTriKy !== undefined) change.showTriKy = Boolean(body.showTriKy);
  if (body.allowView !== undefined) change.allowView = Boolean(body.allowView);
  if (body.hideTopRole !== undefined) change.hideTopRole = Boolean(body.hideTopRole);
  if (body.nickname !== undefined) {
    const nickname = profile.sanitizeNickname(body.nickname);
    if ([...nickname].length > PROFILE_NICKNAME_MAX) return fail(`❌ Biệt danh quá dài (tối đa ${PROFILE_NICKNAME_MAX} ký tự).`);
    change.nickname = nickname;
  }
  if (body.gradient !== undefined) {
    const g = parseGradient(body.gradient);
    if (g.error) return fail(`❌ ${g.error}`);
    change.gradient = g.value;
  }
  for (const [field, label, key] of [['cover', 'Ảnh bìa', 'cover'], ['avatar', 'Avatar', 'avatar'], ['background', 'Ảnh nền hồ sơ', 'background']]) {
    const img = decodeImage(body[field], label);
    if (img.error) return fail(img.error);
    if (!img.skip) change[key] = { buffer: img.buffer };
  }
  if (body.frame !== undefined) {
    // object chỉ ghi đè các thành phần có mặt (phần vắng giữ nguyên); chuỗi/''/null = ghi cả khung. Phong cách còn khoá bị applyChange từ chối.
    const f = parseFrameInput(userId, body.frame);
    if (f.error) return fail(`❌ ${f.error}`);
    change.frame = f.value;
  }
  if (body.clear !== undefined) {
    if (!CLEAR_KEYS.has(body.clear)) return fail('❌ Mục cần gỡ không hợp lệ.');
    change.clear = body.clear;
  }
  if (!Object.keys(change).length) return fail('❌ Không có thay đổi nào để lưu.');

  const result = await profile.applyChange(userId, change);
  if (result.error) return fail(result.error);
  return { ok: true, messages: result.messages };
}

// ---- Thành tựu tự chọn (key rỗng/null = không đeo) ----
async function chooseAchievement(userId, key) {
  if (!PROFILE_ENABLED || !require('../features').isEnabled('hoso')) return fail('Tính năng hồ sơ đang tắt.');
  const gate = profile.gateError(userId);
  if (gate) return fail(gate);
  const result = await profile.runExclusive(userId, () => setSelfAchievement(userId, key ? String(key) : null));
  return result.error ? fail(result.error) : { ok: true, message: result.message };
}

// ---- Quan hệ: luôn là CHÍNH MÌNH (bên A), không bị khoá theo cấp (giống nút 💞 trong /profile) ----
// idB: Sư Phụ / Tri Kỷ = Discord ID người kia (route đã kiểm tra là thành viên guild, không phải bot); Kim Lan = tên.
async function setRelationship(userId, loai, idBRaw, { isValidTarget }) {
  if (!PROFILE_ENABLED || !require('../features').isEnabled('hoso')) return fail('Tính năng hồ sơ đang tắt.');
  const kind = String(loai || '').toLowerCase();
  if (!['suphu', 'triky', 'kimlan'].includes(kind)) return fail('❌ Chưa chọn loại quan hệ.');
  let idB = '';
  if (kind === 'kimlan') {
    idB = profile.sanitizeNickname(idBRaw);
    if (!idB) return fail('❌ Với Kim Lan, cần nhập TÊN Kim Lan.');
    if ([...idB].length > PROFILE_KIMLAN_NAME_MAX) return fail(`❌ Tên Kim Lan quá dài (tối đa ${PROFILE_KIMLAN_NAME_MAX} ký tự).`);
  } else {
    idB = String(idBRaw || '').trim();
    if (!DISCORD_ID_RE.test(idB)) return fail('❌ Với Sư Phụ / Tri Kỷ, cần chọn người kia.');
    if (idB === userId) return fail('❌ Không thể tự chọn chính mình.');
    const check = await isValidTarget(idB);
    if (check) return fail(check);
  }
  const { applySetMqh } = require('../commands/slashProfile'); // require trễ (tránh vòng phụ thuộc lúc nạp module, như nút 💞 trong /profile)
  const result = await profile.runExclusive(userId, () => applySetMqh(userId, kind, idB, { callerId: userId, isBong: false }));
  if (result.error) return fail(result.error);
  return result.ok ? { ok: true, message: result.message } : fail(result.message);
}

// ---- Xem trước thẻ: { ok, png (base64) } hoặc { ok, png: null } nếu thẻ vẽ lỗi (bot quay về embed) ----
// body (tuỳ chọn): { hideInfo?, frame?, cover?, avatar?, background? } base64 (hideInfo = ẩn các ô hạng mục trên thẻ /hoso) — ẢNH NHÁP để xem thử thẻ TRƯỚC khi lưu thật (không ghi gì cả).
async function preview(guild, user, kind, body = {}) {
  if (!PROFILE_ENABLED || !require('../features').isEnabled('hoso')) return fail('Tính năng hồ sơ đang tắt.');
  const draft = {};
  for (const [field, label] of [['cover', 'Ảnh bìa'], ['avatar', 'Avatar'], ['background', 'Ảnh nền hồ sơ']]) {
    const img = decodeImage(body[field], label);
    if (img.error) return fail(img.error);
    if (!img.skip) draft[field] = img.buffer;
  }
  if (Object.keys(draft).length) {
    const gate = profile.gateError(user.id); // xem thử ảnh cũng cần đạt cấp như lúc lưu
    if (gate) return fail(gate);
  }
  const opts = { hideInfo: Boolean(body.hideInfo) };
  if (body.frame !== undefined && kind !== 'level') {
    // Khung NHÁP để xem thử trước khi lưu: cùng định dạng body.frame của update; khoá theo cấp vẫn áp dụng (không xem thử được khung chưa mở).
    const f = parseFrameInput(user.id, body.frame);
    if (f.error) return fail(`❌ ${f.error}`);
    const raw = frameChoice.deserialize(f.value);
    const level = profile.getLevelOf(user.id);
    const locked = frameChoice.lockError(raw, level, user.id);
    if (locked) return fail(locked);
    opts.frame = frameChoice.resolve(raw, level, user.id) || null; // null = khung mặc định
  }
  const out = await profile.buildCardPreview(guild, user, kind === 'level' ? 'level' : 'hoso', draft, opts);
  return { ok: true, kind: kind === 'level' ? 'level' : 'hoso', png: out.png ? out.png.toString('base64') : null, note: out.content || '' };
}

module.exports = { getState, updateProfile, chooseAchievement, setRelationship, preview };
