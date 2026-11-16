// ===== level/profile.js — Hồ Sơ Cá Nhân: biệt danh + ảnh bìa + avatar cho thẻ /level =====
// /profile (không kèm tuỳ chọn): hiện thẻ hồ sơ của bạn + nút bấm — ✏️ Biệt danh / 🖼️ Ảnh bìa / 👤 Avatar (mở hộp thoại, ảnh chọn ngay trong hộp thoại,
// không lộ ra kênh) / 🏅 Thành tựu (tự chọn 1 thành tựu tên kiếm hiệp để đeo trên thẻ /hoso) / 💞 Quan hệ (đặt Sư Phụ / Tri Kỷ / Kim Lan cho CHÍNH MÌNH, dùng chung applySetMqh với /setmqh; không cần đạt cấp) + menu 🗑️ Gỡ. Cần đạt cấp PROFILE_MIN_LEVEL (mặc định 5). /profilexoa (Bông): gỡ hồ sơ 1 người. Mọi thứ chỉ hiện cho chính người dùng.
// Mỗi người 1 bìa + 1 avatar + 1 ảnh nền hồ sơ (🌄, nền toàn thẻ /hoso). Ảnh được xử lý ĐÚNG 1 LẦN lúc đặt (bìa cắt 934x315 JPG, avatar 256x256 PNG, nền 934x844 JPG) rồi lưu lên Cloudinary
// (riêng tư) + ghi tham chiếu vào tab "Hồ Sơ Cá Nhân" — /level chỉ tải lại ảnh nhỏ đã xử lý (có cache RAM), khung thẻ cố định.
// Bot KHÔNG gọi AI tạo ảnh ở đây: người dùng tự mang ảnh (kể cả ảnh AI tự tạo) lên, nên không có chuyện spam gọi AI.
// 🎨 Màu chữ: mỗi người chọn 1 dải gradient (mẫu có sẵn hoặc tự nhập 2-3 mã #RRGGBB) cho Nickname / Ingame / Danh Hiệu — lưu cột G tab Hồ Sơ Cá Nhân, dùng ở cả /hoso và /level (level/nameStyle.js).
// 🧩 Khung thẻ: mỗi người chọn khung /hoso ghép từ nhiều phong cách (màu / đỉnh / viền / hoạ tiết cạnh / phụ kiện) — lưu cột H tab Hồ Sơ Cá Nhân (hoso/frame/choice.js), thẻ /hoso đọc qua getFrame. 6 thành phần chia 2 nút/2 hộp thoại (🧩 Khung thẻ: màu/đỉnh/viền/cạnh bên/cạnh dưới · ✨ Phụ kiện góc); khoá khung và tự chọn khung theo cấp xem config/profile.js (PROFILE_FRAME_UNLOCK, PROFILE_FRAME_AUTO).
// Tên hiển thị trên thẻ: biệt danh > tên ingame (tab Bang / ChatGlobal) > tên Discord.
const {
  Events,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  UserSelectMenuBuilder,
  ModalBuilder,
  LabelBuilder,
  TextInputBuilder,
  TextInputStyle,
  FileUploadBuilder,
  MessageFlags,
} = require('discord.js');
const sharp = require('sharp');
const { AsyncLocalStorage } = require('async_hooks');
const client = require('../client');
const { isBotReady, replyNotReadyToInteraction, replyNotReadyToMessage } = require('../utils/readyGate');
const {
  LEVEL_ENABLED,
  PROFILE_ENABLED,
  PROFILE_MIN_LEVEL,
  PROFILE_IMAGE_COOLDOWN_SECONDS,
  PROFILE_MAX_UPLOAD_MB,
  PROFILE_NICKNAME_MAX,
  PROFILE_KIMLAN_NAME_MAX,
} = require('../config');
const { ensureProfileSheet, loadAllProfiles, upsertProfile } = require('../googleSheets/profileSheet');
const { uploadImageToCloudinary, getSignedDownloadUrl, deleteImageFromCloudinary } = require('../nmImage/cloudinary');
const { getMemberInfoByDiscordId } = require('../googleSheets/memberSheet');
const { getChatGlobalMemberByDiscordId } = require('../googleSheets/chatGlobalSheet');
const { getSelectedAchievement, getDisplayedTitle, listAchievementChoices, setSelfAchievement } = require('../hoso/manualAchievements');
const { GRADIENT_PRESETS, parseColorInput, serializeColors, deserializeColors, presetColors } = require('./nameStyle');
const frameChoice = require('../hoso/frame/choice');

const COVER_W = 934;
const COVER_H = 315;
const AVATAR_SIZE = 256;
const BG_W = 934; // nền hồ sơ phủ PHẦN THÂN thẻ /hoso, nằm DƯỚI ảnh bìa (thân thẻ cao ~614-770px tuỳ có ô Thành tựu; hoso/card.js tự cắt slice)
const BG_H = 700;
const REFRESH_MS = 10 * 60 * 1000;
const IMG_CACHE_MAX = 150;
const FOLDER = 'nm_profile';

let profiles = new Map(); // userId -> { id, nickname, coverId, avatarId, bgId, gradient, frame }
let deps = { getLevel: () => 0, isLoaded: () => false, buildPreview: null, isBong: () => false };
const imgCache = new Map(); // `c:<id>` | `a:<id>` | `b:<id>` -> Buffer (cắt tỉa cũ nhất khi quá IMG_CACHE_MAX)
const lastImageChange = new Map(); // userId -> timestamp
const busy = new Set(); // userId đang xử lý /profile (chặn bấm song song)

function init(d) {
  deps = { ...deps, ...d };
}

function cachePut(key, buf) {
  imgCache.delete(key);
  imgCache.set(key, buf);
  while (imgCache.size > IMG_CACHE_MAX) imgCache.delete(imgCache.keys().next().value);
}

// ---------------------------------------------------------------- khởi động / nạp lại
async function start() {
  if (!PROFILE_ENABLED) return;
  try {
    await ensureProfileSheet();
    const map = await loadAllProfiles();
    if (map) profiles = map;
  } catch (error) {
    console.error('[profile] Không khởi tạo được tab Hồ Sơ Cá Nhân:', error.message);
  }
  setInterval(async () => {
    const map = await loadAllProfiles();
    if (map) profiles = map;
  }, REFRESH_MS).unref?.();
}

// ---------------------------------------------------------------- dữ liệu cho thẻ
async function downloadProcessed(publicId, format) {
  const url = await getSignedDownloadUrl(publicId, format);
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function cachedImage(prefix, publicId, format) {
  if (!publicId) return null;
  const key = `${prefix}:${publicId}`;
  const hit = imgCache.get(key);
  if (hit) return hit;
  try {
    const buf = await downloadProcessed(publicId, format);
    cachePut(key, buf);
    return buf;
  } catch (error) {
    console.error(`[profile] Không tải được ảnh ${prefix} ${publicId}:`, error.message);
    return null; // thiếu ảnh thì thẻ vẽ mặc định, không lỗi
  }
}

// { coverBuf, avatarBuf, bgBuf } (null = dùng mặc định). bgBuf (ảnh nền hồ sơ) chỉ tải khi opts.withBg — thẻ /level không dùng nên khỏi tốn lượt tải.
async function getCardAssets(userId, opts = {}) {
  const empty = { coverBuf: null, avatarBuf: null, bgBuf: null };
  if (!PROFILE_ENABLED) return empty;
  const p = profiles.get(userId);
  let base = empty;
  if (p) {
    const [coverBuf, avatarBuf, bgBuf] = await Promise.all([
      cachedImage('c', p.coverId, 'jpg'),
      cachedImage('a', p.avatarId, 'png'),
      opts.withBg ? cachedImage('b', p.bgId, 'jpg') : null,
    ]);
    base = { coverBuf, avatarBuf, bgBuf };
  }
  // XEM THỬ (web): ảnh nháp đè lên ảnh đã lưu, CHỈ trong lần vẽ đang chạy (AsyncLocalStorage) — không lưu gì cả.
  const draft = draftStore.getStore();
  if (draft && draft.userId === userId) {
    return {
      coverBuf: draft.coverBuf || base.coverBuf,
      avatarBuf: draft.avatarBuf || base.avatarBuf,
      bgBuf: opts.withBg ? draft.bgBuf || base.bgBuf : base.bgBuf,
    };
  }
  return base;
}

// ---- Xem thử thẻ với ảnh NHÁP (chưa lưu): xử lý sharp y như lúc lưu thật rồi chạy fn() trong "ngữ cảnh nháp" ----
// draft: { cover?: Buffer, avatar?: Buffer, background?: Buffer } (ảnh gốc từ web). Không ghi Sheet/Cloudinary, không đụng cooldown.
const draftStore = new AsyncLocalStorage();
async function withDraft(userId, draft, fn) {
  const [coverBuf, avatarBuf, bgBuf] = await Promise.all([
    draft.cover ? processCover(draft.cover) : null,
    draft.avatar ? processAvatar(draft.avatar) : null,
    draft.background ? processBackground(draft.background) : null,
  ]);
  return draftStore.run({ userId, coverBuf, avatarBuf, bgBuf }, fn);
}

// Bộ màu gradient chữ (Nickname / Ingame / Danh Hiệu) người này đã chọn: mảng '#rrggbb' hoặc null (= mặc định theo bậc cấp).
function getNameStyle(userId) {
  const p = PROFILE_ENABLED ? profiles.get(userId) : null;
  return p && p.gradient ? deserializeColors(p.gradient) : null;
}

// Khung thẻ /hoso người này đã chọn, ĐÃ GIẢI theo cấp hiện tại: { colors?, crest?, border?, side?, bottom?, accents? } (id phong cách thật) hoặc null (= khung mặc định).
// 'Tự động theo cấp' đổi ra phong cách theo thang cấp; phong cách đang bị khoá (tụt dưới cấp mở khoá) tự về mặc định. Chưa nạp xong level -> không khoá, tự động = mặc định.
function getFrame(userId) {
  const p = PROFILE_ENABLED ? profiles.get(userId) : null;
  if (!p || !p.frame) return null;
  const level = deps.isLoaded() ? deps.getLevel(userId) : null;
  return frameChoice.resolve(frameChoice.deserialize(p.frame), level, userId);
}

// Biệt danh > ingame > tên Discord. Tra ingame từ cache của tab Bang / ChatGlobal (không tốn thêm lượt đọc sheet khi cache còn hạn).
async function resolveName(userId, discordName) {
  const p = PROFILE_ENABLED ? profiles.get(userId) : null;
  if (p && p.nickname) return p.nickname;
  try {
    const bang = await getMemberInfoByDiscordId(userId);
    if (bang && bang.ingame) return bang.ingame;
    const global = await getChatGlobalMemberByDiscordId(userId);
    if (global && global.ingame) return global.ingame;
  } catch (_) {
    /* dùng tên Discord */
  }
  return discordName;
}

// Tên ingame (tab Bang > ChatGlobal) — để thẻ /level vẽ dòng "Ingame: …" giống thẻ /hoso. Không có -> ''.
async function resolveIngame(userId) {
  try {
    const bang = await getMemberInfoByDiscordId(userId);
    if (bang && bang.ingame) return bang.ingame;
    const global = await getChatGlobalMemberByDiscordId(userId);
    if (global && global.ingame) return global.ingame;
  } catch (_) {
    /* không hiện ingame */
  }
  return '';
}

// Hệ phái (class) để vẽ huy hiệu: tab Bang > ChatGlobal. Không có -> '' (thẻ không hiện huy hiệu).
async function resolveClass(userId) {
  try {
    const bang = await getMemberInfoByDiscordId(userId);
    if (bang && bang.className) return bang.className;
    const global = await getChatGlobalMemberByDiscordId(userId);
    if (global && global.className) return global.className;
  } catch (_) {
    /* không có huy hiệu */
  }
  return '';
}

// ---------------------------------------------------------------- xử lý ảnh (1 lần lúc đặt)
function sanitizeNickname(raw) {
  return String(raw || '')
    .replace(/[\u0000-\u001f\u007f​-‏‪-‮]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchAttachment(attachment) {
  const mime = String(attachment.contentType || '');
  if (!mime.startsWith('image/')) throw new Error('not_image');
  const maxBytes = PROFILE_MAX_UPLOAD_MB * 1024 * 1024;
  if (attachment.size && attachment.size > maxBytes) throw new Error('too_big');
  const res = await fetch(attachment.url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error('download');
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > maxBytes) throw new Error('too_big');
  return buf;
}

async function processCover(buf) {
  return sharp(buf, { limitInputPixels: 60e6, failOn: 'none' })
    .rotate()
    .resize(COVER_W, COVER_H, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}

async function processBackground(buf) {
  return sharp(buf, { limitInputPixels: 60e6, failOn: 'none' })
    .rotate()
    .resize(BG_W, BG_H, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
}

async function processAvatar(buf) {
  return sharp(buf, { limitInputPixels: 60e6, failOn: 'none' })
    .rotate()
    .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover', position: 'attention' })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

const ERROR_TEXT = {
  not_image: 'File đính kèm không phải ảnh (nhận png/jpg/webp/gif).',
  too_big: `Ảnh quá lớn (tối đa ${PROFILE_MAX_UPLOAD_MB}MB).`,
  download: 'Không tải được ảnh đính kèm, thử gửi lại.',
};

// src: attachment Discord (bot tự tải) HOẶC { buffer } (web đã gửi sẵn ảnh) — cùng 1 đường xử lý sharp + giới hạn dung lượng.
async function loadRawImage(src) {
  if (src && Buffer.isBuffer(src.buffer)) {
    if (src.buffer.length > PROFILE_MAX_UPLOAD_MB * 1024 * 1024) throw new Error('too_big');
    return src.buffer; // không phải ảnh -> sharp ném lỗi, prepareImage báo "không đọc được ảnh"
  }
  return fetchAttachment(src);
}

async function prepareImage(attachment, label, processor) {
  try {
    const raw = await loadRawImage(attachment);
    return { buf: await processor(raw) };
  } catch (error) {
    if (ERROR_TEXT[error.message]) return { error: `❌ ${label}: ${ERROR_TEXT[error.message]}` };
    console.error(`[profile] Lỗi xử lý ảnh ${label}:`, error.message);
    return { error: `❌ ${label}: không đọc được ảnh này (file hỏng hoặc định dạng lạ). Thử ảnh khác nhé.` };
  }
}

// ---------------------------------------------------------------- giao diện /profile
const ID = {
  nick: 'profile:nick',
  cover: 'profile:cover',
  avatar: 'profile:avatar',
  bg: 'profile:bg',
  mqh: 'profile:mqh',
  ach: 'profile:ach',
  grad: 'profile:grad',
  frame: 'profile:frame',
  frame2: 'profile:frame2',
  frameTheme: 'profile:frame_t',
  triky: 'profile:triky',
  allow: 'profile:allow',
  toprole: 'profile:toprole',
  shop: 'profile:shop',
  clear: 'profile:clear',
  nickModal: 'profile:nick_m',
  coverModal: 'profile:cover_m',
  avatarModal: 'profile:avatar_m',
  bgModal: 'profile:bg_m',
  mqhModal: 'profile:mqh_m',
  achModal: 'profile:ach_m',
  gradModal: 'profile:grad_m',
  frameModal: 'profile:frame_m',
  frame2Modal: 'profile:frame2_m',
};
const ACH_NONE = '__none__'; // giá trị của lựa chọn "Không đeo thành tựu" trong dropdown
const GRAD_DEFAULT = '__default__'; // giá trị của lựa chọn "Theo bậc cấp (mặc định)" trong dropdown màu chữ

function statusText(userId) {
  const p = profiles.get(userId) || {};
  const achNow = getSelectedAchievement(userId);
  const shown = getDisplayedTitle(userId); // danh hiệu thật sự hiện trên thẻ (thành tựu riêng thắng thành tựu tự chọn)
  const gradNow = p.gradient ? deserializeColors(p.gradient) : null;
  return [
    `• Biệt danh: ${p.nickname ? `**${p.nickname}**` : '_chưa đặt — dùng tên ingame hoặc tên Discord_'}`,
    `• Ảnh bìa: ${p.coverId ? 'đã đặt' : 'mặc định'}`,
    `• Avatar riêng: ${p.avatarId ? 'đã đặt' : 'dùng avatar Discord'}`,
    `• Ảnh nền hồ sơ: ${p.bgId ? 'đã đặt' : 'mặc định'}`,
    `• Thành tựu: ${achNow ? `**${achNow.label}**` : '_chưa chọn_'}${shown && shown.custom ? `\n• Danh hiệu đang hiện: 🏆 **${shown.label}** _(thành tựu riêng — thắng thành tựu tự chọn, thẻ chỉ hiện 1)_` : ''}`,
    `• Màu chữ gradient: ${gradNow ? gradNow.map((c) => `\`${c}\``).join(' → ') : '_theo bậc cấp (mặc định)_'}`,
    `• Hiện Quan hệ (Tri Kỷ · Sư Đồ) trên thẻ /hoso: ${p.showTriKy ? '**bật**' : '_tắt_'}`,
    `• Cho người khác xem /hoso của bạn: ${p.allowView === false ? '**không** (chỉ mình bạn và Bông)' : '**có**'}`,
    `• Role Top tuần/tháng trên Discord: ${p.hideTopRole ? '**tắt** _(bot không gắn role Top cho bạn, giữ màu role bạn chọn)_' : '_bật (nhận role khi đứng Top)_'}`,
    `• Khung thẻ /hoso: ${frameChoice.describe(frameChoice.deserialize(p.frame), deps.getLevel(userId)) || '_mặc định_'}`,
  ].join('\n');
}

function buildComponents(disabled, userId) {
  const pr = userId ? getProfileRecord(userId) : {};
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(ID.nick).setLabel('✏️ Biệt danh').setStyle(ButtonStyle.Primary).setDisabled(disabled),
      new ButtonBuilder().setCustomId(ID.cover).setLabel('🖼️ Ảnh bìa').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
      new ButtonBuilder().setCustomId(ID.avatar).setLabel('👤 Avatar').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
      new ButtonBuilder().setCustomId(ID.bg).setLabel('🌄 Ảnh nền hồ sơ').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
      // Quan hệ không phụ thuộc cấp (giống /setmqh vốn mở cho mọi người) nên không bị khoá theo `disabled`.
      new ButtonBuilder().setCustomId(ID.mqh).setLabel('💞 Quan hệ').setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      // 🏅 Thành tựu: người dùng TỰ chọn 1 thành tựu (tên kiếm hiệp) để đeo trên thẻ /hoso — cùng cổng cấp với các nút tuỳ chỉnh khác.
      new ButtonBuilder().setCustomId(ID.ach).setLabel('🏅 Thành tựu').setStyle(ButtonStyle.Success).setDisabled(disabled),
      // 🎨 Màu chữ: chọn dải màu gradient cho Nickname / Ingame / Danh Hiệu trên thẻ /hoso và /level.
      new ButtonBuilder().setCustomId(ID.grad).setLabel('🎨 Màu chữ').setStyle(ButtonStyle.Success).setDisabled(disabled),
      // 🧩 Khung thẻ: chọn 1 BỘ khung /hoso + 1 BỘ khung avatar từ các phong cách có sẵn (1 hộp, 2 ô).
      new ButtonBuilder().setCustomId(ID.frame).setLabel(frameChoice.MODALS.main.button).setStyle(ButtonStyle.Success).setDisabled(disabled),
      // 🛒 Shop khung: xem trước (vẽ ra) từng bộ khung + bộ thưởng, mua bằng Điểm Hoạt Động. Không khoá theo cấp.
      new ButtonBuilder().setCustomId(ID.shop).setLabel('🛒 Shop khung').setStyle(ButtonStyle.Primary)
    ),
    new ActionRowBuilder().addComponents(
      // Riêng tư: không khoá theo cấp. 💞 Hiện Tri Kỷ = thêm ô Tri Kỷ lên thẻ /hoso; 🔓/🔒 = cho/không cho người khác xem /hoso của mình.
      new ButtonBuilder().setCustomId(ID.triky).setLabel(pr.showTriKy ? '🤝 Quan hệ trên thẻ: BẬT' : '🤝 Quan hệ trên thẻ: TẮT').setStyle(pr.showTriKy ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(ID.allow).setLabel(pr.allowView === false ? '🔒 Người khác xem hồ sơ: KHÔNG' : '🔓 Người khác xem hồ sơ: CÓ').setStyle(pr.allowView === false ? ButtonStyle.Danger : ButtonStyle.Success),
      // 🏅 Role Top: TẮT = bot không gắn (và gỡ) role Top tuần/tháng của người này, để role màu họ chọn không bị đè. Không khoá theo cấp.
      new ButtonBuilder().setCustomId(ID.toprole).setLabel(pr.hideTopRole ? '🏅 Role Top: TẮT' : '🏅 Role Top: BẬT').setStyle(pr.hideTopRole ? ButtonStyle.Secondary : ButtonStyle.Success)
    ),
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(ID.clear)
        .setPlaceholder('🗑️ Gỡ phần đã đặt…')
        .setDisabled(disabled)
        .addOptions(
          { label: 'Gỡ biệt danh', value: 'nickname' },
          { label: 'Gỡ ảnh bìa', value: 'bia' },
          { label: 'Gỡ avatar riêng', value: 'avatar' },
          { label: 'Gỡ ảnh nền hồ sơ', value: 'nen' },
          { label: 'Gỡ màu chữ gradient', value: 'mau' },
          { label: 'Gỡ khung thẻ (về mặc định)', value: 'khung' },
          { label: 'Gỡ tất cả', value: 'all' }
        )
    ),
  ];
}

// Thẻ hiện tại + trạng thái + nút bấm. note: dòng thông báo kết quả thao tác vừa rồi (nếu có).
async function buildView(guild, user, note) {
  const level = deps.getLevel(user.id);
  const unlocked = level >= PROFILE_MIN_LEVEL;
  let preview = {};
  try {
    if (deps.buildPreview) preview = (await deps.buildPreview(guild, user)) || {};
  } catch (_) {
    preview = {};
  }
  const lines = [];
  if (note) lines.push(note, '');
  lines.push(
    unlocked
      ? '🎨 **Hồ sơ của bạn** — bấm nút bên dưới để tuỳ chỉnh thẻ `/level` và `/hoso`.'
      : `🔒 Cần đạt **cấp ${PROFILE_MIN_LEVEL}** để tuỳ chỉnh hồ sơ (bạn đang ở cấp ${level}).`,
    statusText(user.id)
  );
  if (preview.content) lines.push('', preview.content);
  return {
    content: lines.join('\n'),
    files: preview.files || [],
    embeds: preview.embeds || [],
    attachments: [], // thay hẳn ảnh cũ khi làm mới thẻ
    components: buildComponents(!unlocked, user.id),
    allowedMentions: { parse: [] },
  };
}

// Kiểm tra chung cho mọi tương tác của người dùng thường. Trả chuỗi lỗi hoặc null.
function gateError(userId) {
  if (!deps.isLoaded()) return '⏳ Dữ liệu level đang được nạp, thử lại sau ít phút.';
  const level = deps.getLevel(userId);
  if (level < PROFILE_MIN_LEVEL) return `🔒 Cần đạt **cấp ${PROFILE_MIN_LEVEL}** để tuỳ chỉnh hồ sơ. Bạn đang ở cấp ${level}.`;
  return null;
}

// ---------------------------------------------------------------- áp dụng thay đổi (dùng chung cho mọi nút)
// change: { nickname?: string ('' = gỡ), cover?: Attachment, avatar?: Attachment, background?: Attachment, gradient?: string[] | '' ('' = về mặc định), clear?: 'nickname'|'bia'|'avatar'|'nen'|'mau'|'khung'|'all', frame?: string ('' = khung mặc định) }
// Trả { error } hoặc { messages: [...] }. Không ném lỗi.
async function applyChange(userId, change) {
  const changingImage = Boolean(change.cover || change.avatar || change.background);
  if (changingImage && PROFILE_IMAGE_COOLDOWN_SECONDS > 0) {
    const wait = PROFILE_IMAGE_COOLDOWN_SECONDS * 1000 - (Date.now() - (lastImageChange.get(userId) || 0));
    if (wait > 0) return { error: `⏳ Bạn vừa đổi ảnh xong, đợi thêm ${Math.ceil(wait / 1000)} giây rồi đổi tiếp nhé.` };
  }
  if (busy.has(userId)) return { error: '⏳ Yêu cầu trước của bạn vẫn đang xử lý, đợi chút nhé.' };
  busy.add(userId);
  try {
    const old = profiles.get(userId) || { id: userId, nickname: '', coverId: '', avatarId: '', bgId: '', gradient: '', frame: '', showTriKy: false, allowView: true, hideTopRole: false };
    // Khung có phong cách còn khoá theo cấp -> từ chối cả lần lưu (chưa đổi gì, chưa upload gì).
    if (change.frame !== undefined) {
      const locked = frameChoice.lockError(frameChoice.deserialize(change.frame), deps.getLevel(userId), userId);
      if (locked) return { error: locked };
    }
    const patch = {};
    const toDelete = [];
    const messages = [];
    let coverBuf = null;
    let avatarBuf = null;
    let bgBuf = null;

    // 1) Xử lý ảnh trước (lỗi thì dừng, chưa đổi gì)
    if (change.cover) {
      const r = await prepareImage(change.cover, 'Ảnh bìa', processCover);
      if (r.error) return { error: r.error };
      coverBuf = r.buf;
    }
    if (change.avatar) {
      const r = await prepareImage(change.avatar, 'Avatar', processAvatar);
      if (r.error) return { error: r.error };
      avatarBuf = r.buf;
    }
    if (change.background) {
      const r = await prepareImage(change.background, 'Ảnh nền hồ sơ', processBackground);
      if (r.error) return { error: r.error };
      bgBuf = r.buf;
    }

    // 2) Upload bản đã xử lý
    let newCover = null;
    let newAvatar = null;
    let newBg = null;
    try {
      if (coverBuf) newCover = await uploadImageToCloudinary(coverBuf, `cover_${userId}.jpg`, 'image/jpeg', FOLDER);
      if (avatarBuf) newAvatar = await uploadImageToCloudinary(avatarBuf, `avatar_${userId}.png`, 'image/png', FOLDER);
      if (bgBuf) newBg = await uploadImageToCloudinary(bgBuf, `bg_${userId}.jpg`, 'image/jpeg', FOLDER);
    } catch (error) {
      console.error('[profile] Upload Cloudinary lỗi:', error.message);
      if (newCover) deleteImageFromCloudinary(newCover.id);
      if (newAvatar) deleteImageFromCloudinary(newAvatar.id);
      return { error: '❌ Không lưu được ảnh lên kho, thử lại sau.' };
    }

    // 3) Gom thay đổi
    if (change.nickname !== undefined) {
      patch.nickname = change.nickname;
      messages.push(change.nickname ? `✅ Biệt danh: **${change.nickname}**` : '🗑️ Đã gỡ biệt danh');
    }
    if (change.gradient !== undefined) {
      patch.gradient = Array.isArray(change.gradient) ? serializeColors(change.gradient) : '';
      messages.push(patch.gradient ? `✅ Đã đặt màu chữ gradient: ${change.gradient.map((c) => `\`${c}\``).join(' → ')}` : '🗑️ Màu chữ về mặc định (theo bậc cấp)');
    }
    if (change.frame !== undefined) {
      patch.frame = change.frame;
      const shown = frameChoice.describe(frameChoice.deserialize(change.frame), deps.getLevel(userId));
      messages.push(shown ? `✅ Đã đặt khung thẻ — ${shown}` : '🗑️ Khung thẻ về mặc định');
    }
    if (change.showTriKy !== undefined) {
      patch.showTriKy = Boolean(change.showTriKy);
      messages.push(patch.showTriKy ? '✅ Đã BẬT hiện Quan hệ (Tri Kỷ, Sư Đồ) trên thẻ /hoso' : '🙈 Đã TẮT hiện Quan hệ trên thẻ /hoso');
    }
    if (change.allowView !== undefined) {
      patch.allowView = Boolean(change.allowView);
      messages.push(patch.allowView ? '🔓 Người khác đã có thể xem /hoso của bạn' : '🔒 Người khác không còn xem được /hoso của bạn (chỉ bạn và Bông)');
    }
    if (change.hideTopRole !== undefined) {
      patch.hideTopRole = Boolean(change.hideTopRole);
      messages.push(patch.hideTopRole ? '🙈 Đã TẮT role Top — bot gỡ role Top tuần/tháng khỏi bạn và không gắn lại nữa (thẻ vẫn hiện nhãn Top)' : '🏅 Đã BẬT role Top — khi đứng Top tuần/tháng bạn sẽ nhận role trên Discord');
    }
    if (newCover) {
      patch.coverId = newCover.id;
      if (old.coverId) toDelete.push(old.coverId);
      messages.push('✅ Đã đặt ảnh bìa');
    }
    if (newAvatar) {
      patch.avatarId = newAvatar.id;
      if (old.avatarId) toDelete.push(old.avatarId);
      messages.push('✅ Đã đặt avatar');
    }
    if (newBg) {
      patch.bgId = newBg.id;
      if (old.bgId) toDelete.push(old.bgId);
      messages.push('✅ Đã đặt ảnh nền hồ sơ');
    }
    const clear = change.clear;
    if (clear) {
      if (clear === 'nickname' || clear === 'all') {
        patch.nickname = '';
        messages.push('🗑️ Đã gỡ biệt danh');
      }
      if (clear === 'bia' || clear === 'all') {
        patch.coverId = '';
        if (old.coverId) toDelete.push(old.coverId);
        messages.push('🗑️ Đã gỡ ảnh bìa');
      }
      if (clear === 'avatar' || clear === 'all') {
        patch.avatarId = '';
        if (old.avatarId) toDelete.push(old.avatarId);
        messages.push('🗑️ Đã gỡ avatar riêng');
      }
      if (clear === 'nen' || clear === 'all') {
        patch.bgId = '';
        if (old.bgId) toDelete.push(old.bgId);
        messages.push('🗑️ Đã gỡ ảnh nền hồ sơ');
      }
      if (clear === 'mau' || clear === 'all') {
        patch.gradient = '';
        messages.push('🗑️ Đã gỡ màu chữ gradient (về mặc định theo bậc cấp)');
      }
      if (clear === 'khung' || clear === 'all') {
        patch.frame = '';
        messages.push('🗑️ Đã gỡ khung thẻ (về khung mặc định)');
      }
    }

    // 4) Ghi sheet; lỗi thì dọn ảnh vừa upload để không bỏ mồ côi
    let saved;
    try {
      saved = await upsertProfile(userId, patch);
    } catch (error) {
      console.error('[profile] Không ghi được tab Hồ Sơ Cá Nhân:', error.message);
      if (newCover) deleteImageFromCloudinary(newCover.id);
      if (newAvatar) deleteImageFromCloudinary(newAvatar.id);
      if (newBg) deleteImageFromCloudinary(newBg.id);
      return { error: '❌ Không lưu được hồ sơ vào sheet, thử lại sau (báo Bông nếu lỗi lặp lại).' };
    }
    profiles.set(userId, saved);
    if (change.hideTopRole !== undefined) await require('./topRole').refreshMember(userId); // gắn/gỡ role Top ngay (require trễ tránh vòng phụ thuộc)
    if (newCover) cachePut(`c:${newCover.id}`, coverBuf);
    if (newAvatar) cachePut(`a:${newAvatar.id}`, avatarBuf);
    if (newBg) cachePut(`b:${newBg.id}`, bgBuf);
    if (changingImage) lastImageChange.set(userId, Date.now());
    for (const id of toDelete) deleteImageFromCloudinary(id); // nền, không chờ
    return { messages };
  } finally {
    busy.delete(userId);
  }
}

// ---------------------------------------------------------------- hộp thoại
function nickModal(userId) {
  const p = profiles.get(userId) || {};
  const input = new TextInputBuilder()
    .setCustomId('nick')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(PROFILE_NICKNAME_MAX)
    .setPlaceholder('Để trống = gỡ biệt danh (dùng tên ingame / tên Discord)');
  if (p.nickname) input.setValue(p.nickname);
  return new ModalBuilder()
    .setCustomId(ID.nickModal)
    .setTitle('Đặt biệt danh')
    .addLabelComponents(new LabelBuilder().setLabel('Biệt danh hiển thị trên thẻ').setTextInputComponent(input));
}

function imageModal(customId, title, label, description) {
  return new ModalBuilder()
    .setCustomId(customId)
    .setTitle(title)
    .addLabelComponents(
      new LabelBuilder()
        .setLabel(label)
        .setDescription(description)
        .setFileUploadComponent(new FileUploadBuilder().setCustomId('file').setMinValues(1).setMaxValues(1).setRequired(true))
    );
}

function mqhModal() {
  const loai = new StringSelectMenuBuilder()
    .setCustomId('loai')
    .setPlaceholder('Chọn loại quan hệ')
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(
      { label: 'Sư Phụ', value: 'suphu', description: 'Bạn nhận người được chọn làm Sư Phụ của bạn' },
      { label: 'Tri Kỷ', value: 'triky', description: 'Liên kết 2 chiều giữa bạn và người được chọn' },
      { label: 'Kim Lan', value: 'kimlan', description: 'Chỉ nhập TÊN Kim Lan ở ô bên dưới (không chọn người)' }
    );
  const nguoi = new UserSelectMenuBuilder()
    .setCustomId('nguoi')
    .setPlaceholder('Chọn người kia (Sư Phụ / Tri Kỷ)')
    .setMinValues(0)
    .setMaxValues(1)
    .setRequired(false);
  const ten = new TextInputBuilder()
    .setCustomId('kimlan')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(PROFILE_KIMLAN_NAME_MAX)
    .setPlaceholder('Chỉ dùng khi chọn Kim Lan');
  return new ModalBuilder()
    .setCustomId(ID.mqhModal)
    .setTitle('Đặt mối quan hệ')
    .addLabelComponents(
      new LabelBuilder().setLabel('Loại quan hệ').setStringSelectMenuComponent(loai),
      new LabelBuilder().setLabel('Người kia').setDescription('Bắt buộc với Sư Phụ / Tri Kỷ').setUserSelectMenuComponent(nguoi),
      new LabelBuilder().setLabel('Tên Kim Lan').setDescription('Bắt buộc với Kim Lan').setTextInputComponent(ten)
    );
}

// Hộp thoại 🏅 Thành tựu: 1 dropdown gồm các thành tựu (tên kiếm hiệp + câu đùa) + "Không đeo"; thành tựu đang đeo được đánh dấu sẵn.
function achModal(userId) {
  const now = getSelectedAchievement(userId);
  const options = listAchievementChoices().map((a) => ({
    label: a.label,
    value: a.key,
    description: [...a.quip].slice(0, 100).join(''),
    default: Boolean(now && now.key === a.key),
  }));
  options.push({ label: '🚫 Không đeo thành tựu', value: ACH_NONE, description: 'Gỡ thành tựu đang đeo (nếu có)', default: false });
  const menu = new StringSelectMenuBuilder().setCustomId('ach').setPlaceholder('Chọn thành tựu muốn đeo').setMinValues(1).setMaxValues(1).addOptions(options);
  return new ModalBuilder()
    .setCustomId(ID.achModal)
    .setTitle('Chọn thành tựu')
    .addLabelComponents(new LabelBuilder().setLabel('Thành tựu đeo trên thẻ /hoso').setDescription(getDisplayedTitle(userId) && getDisplayedTitle(userId).custom ? 'Bạn đang có thành tựu riêng nên thẻ chỉ hiện nó; chọn ở đây sẽ hiện khi thành tựu riêng được gỡ.' : 'Mỗi người đeo 1 thành tựu, chọn cái mới sẽ thay cái cũ.').setStringSelectMenuComponent(menu));
}

// Hộp thoại 🎨 Màu chữ: dropdown mẫu có sẵn (kèm "Theo bậc cấp") + ô nhập 2-3 mã màu #RRGGBB (nếu nhập thì ưu tiên hơn dropdown).
function gradModal(userId) {
  const p = profiles.get(userId) || {};
  const cur = p.gradient ? deserializeColors(p.gradient) : null;
  const curStr = cur ? cur.join(',') : '';
  const options = [{ label: '🎖️ Theo bậc cấp (mặc định)', value: GRAD_DEFAULT, description: 'Dải màu sáng → chính của bậc hiện tại', default: !cur }];
  for (const g of GRADIENT_PRESETS.slice(0, 24)) {
    options.push({ label: g.label, value: g.key, description: g.colors.join(' → '), default: Boolean(cur && g.colors.join(',') === curStr) });
  }
  const menu = new StringSelectMenuBuilder().setCustomId('preset').setPlaceholder('Chọn mẫu màu').setMinValues(1).setMaxValues(1).addOptions(options);
  const custom = new TextInputBuilder()
    .setCustomId('custom')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(40)
    .setPlaceholder('Ví dụ: #ff6b6b #6bb8ff  (để trống = dùng mẫu ở trên)');
  return new ModalBuilder()
    .setCustomId(ID.gradModal)
    .setTitle('Màu chữ gradient')
    .addLabelComponents(
      new LabelBuilder().setLabel('Mẫu màu có sẵn').setDescription('Áp dụng cho Nickname, Ingame và Danh Hiệu trên thẻ /hoso và /level.').setStringSelectMenuComponent(menu),
      new LabelBuilder().setLabel('Hoặc tự nhập 2-3 mã màu').setDescription('Mã dạng #RRGGBB, cách nhau bằng dấu cách. Nhập vào đây sẽ thay cho mẫu bên trên.').setTextInputComponent(custom)
    );
}

// Hộp thoại khung thẻ: 2 ô (Bộ khung thẻ / Bộ khung avatar).
// Mỗi ô liệt kê các phong cách có sẵn trong hoso/frame (tự quét thư mục) + "Tự động theo cấp"; phong cách đang khoá hiện 🔒 kèm cấp mở khoá.
function frameModal(userId, modalKey, themeKey) {
  const cur = frameChoice.deserialize((profiles.get(userId) || {}).frame);
  const level = deps.getLevel(userId);
  const def = frameChoice.MODALS[modalKey] || frameChoice.MODALS.main;
  const theme = frameChoice.isTheme(themeKey) ? themeKey : null; // SHOP-2: có chủ đề -> ô khung chỉ gồm khung của chủ đề (≤ 25 mục)
  const modal = new ModalBuilder().setCustomId(theme ? `${ID.frameModal}:${theme}` : ID.frameModal).setTitle(def.title);
  for (const g of frameChoice.groupsOf(def.key)) {
    const opts = frameChoice.optionsFor(g, cur, level, userId, theme);
    // Khung đang dùng thuộc chủ đề khác -> không mục nào được chọn sẵn: thêm mục "Giữ nguyên" (chọn sẵn) để ô vẫn hợp lệ, không cần required=false.
    if (theme && !g.tierKey && !opts.some((o) => o.default)) opts.unshift({ label: '↩️ Giữ nguyên khung đang dùng', value: frameChoice.KEEP_ID, description: 'Khung hiện tại thuộc chủ đề khác', default: true });
    const menu = new StringSelectMenuBuilder().setCustomId(g.key).setPlaceholder('Chọn phong cách').setMinValues(1).setMaxValues(1).addOptions(opts);
    modal.addLabelComponents(new LabelBuilder().setLabel(g.label).setStringSelectMenuComponent(menu));
  }
  return modal;
}

// Bước 1 của 🧩 Khung thẻ: tin ẩn có ô chọn CHỦ ĐỀ (Cơ bản, 6 chủ đề shop, Cửu Long, Công Đức); chọn xong mới mở hộp thoại của chủ đề đó.
function frameThemeReply(userId) {
  const cur = frameChoice.deserialize((profiles.get(userId) || {}).frame);
  const now = frameChoice.currentTheme(cur);
  const themes = frameChoice.listThemes();
  const menu = new StringSelectMenuBuilder()
    .setCustomId(ID.frameTheme)
    .setPlaceholder('Chọn chủ đề khung…')
    .addOptions(themes.map((t) => ({ label: t.label.slice(0, 100), value: t.key, description: t.description.slice(0, 100), default: t.key === now })));
  return {
    content: '🧩 **Khung thẻ** — chọn chủ đề, rồi chọn bộ khung thẻ + khung avatar trong chủ đề đó.\nKhông đổi khung thì bỏ trống ô khung.',
    components: [new ActionRowBuilder().addComponents(menu)],
    ephemeral: true,
  };
}

async function respondWithView(interaction, note) {
  await interaction.editReply(await buildView(interaction.guild, interaction.user, note));
}

async function handleProfileCommand(interaction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: '❌ Lệnh này chỉ dùng được trong server.', ephemeral: true });
    return;
  }
  await interaction.deferReply({ ephemeral: true });
  if (!deps.isLoaded()) {
    await interaction.editReply('⏳ Dữ liệu level đang được nạp, thử lại sau ít phút.');
    return;
  }
  await respondWithView(interaction, null);
}

async function handleButton(interaction) {
  const id = interaction.customId;
  if (id === ID.mqh) return void (await interaction.showModal(mqhModal()));
  if (id === ID.shop) {
    // Mở cửa hàng khung thành tin riêng (ephemeral); mọi thao tác trong shop do shop/index.js xử lý (customId bắt đầu "shop:").
    const shop = require('../shop');
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply(await shop.homeView(interaction.user.id));
    return;
  }
  if (id === ID.triky || id === ID.allow || id === ID.toprole) {
    // Bật/tắt quyền riêng tư / role Top: không cần đạt cấp tối thiểu.
    await interaction.deferUpdate();
    const cur = getProfileRecord(interaction.user.id);
    const change = id === ID.triky ? { showTriKy: !cur.showTriKy } : id === ID.allow ? { allowView: cur.allowView === false } : { hideTopRole: !cur.hideTopRole };
    const result = await applyChange(interaction.user.id, change);
    await respondWithView(interaction, result.error || result.messages.join('\n'));
    return;
  }
  const err = gateError(interaction.user.id);
  if (err) {
    await interaction.reply({ content: err, ephemeral: true });
    return;
  }
  if (id === ID.nick) return void (await interaction.showModal(nickModal(interaction.user.id)));
  if (id === ID.ach) return void (await interaction.showModal(achModal(interaction.user.id)));
  if (id === ID.grad) return void (await interaction.showModal(gradModal(interaction.user.id)));
  if (id === ID.frame || id === ID.frame2) return void (await interaction.reply(frameThemeReply(interaction.user.id)));
  if (id === ID.cover)
    return void (await interaction.showModal(imageModal(ID.coverModal, 'Đặt ảnh bìa', 'Chọn ảnh bìa', `Bot tự cắt cho vừa khung thẻ (${COVER_W}×${COVER_H}). Tối đa ${PROFILE_MAX_UPLOAD_MB}MB.`)));
  if (id === ID.avatar)
    return void (await interaction.showModal(imageModal(ID.avatarModal, 'Đặt avatar', 'Chọn ảnh avatar', `Bot tự cắt vuông. Tối đa ${PROFILE_MAX_UPLOAD_MB}MB.`)));
  if (id === ID.bg)
    return void (await interaction.showModal(imageModal(ID.bgModal, 'Đặt ảnh nền hồ sơ', 'Chọn ảnh nền hồ sơ', `Làm nền cho cả thẻ /hoso (các ô thông tin hơi trong suốt), bot tự cắt ${BG_W}×${BG_H}. Tối đa ${PROFILE_MAX_UPLOAD_MB}MB.`)));
}

async function handleSelect(interaction) {
  const err = gateError(interaction.user.id);
  if (err) {
    await interaction.reply({ content: err, ephemeral: true });
    return;
  }
  if (interaction.customId === ID.frameTheme) {
    const theme = interaction.values[0];
    if (!frameChoice.isTheme(theme)) return void (await interaction.reply({ content: '❌ Chủ đề không hợp lệ.', ephemeral: true }));
    return void (await interaction.showModal(frameModal(interaction.user.id, 'main', theme)));
  }
  await interaction.deferUpdate();
  const result = await applyChange(interaction.user.id, { clear: interaction.values[0] });
  await respondWithView(interaction, result.error || result.messages.join('\n'));
}

// Nút 💞 Quan hệ: người bấm LUÔN là bên A (chỉ set cho chính mình), người kia lấy từ ô chọn người. Dùng chung applySetMqh với /setmqh.
async function handleMqhModal(interaction) {
  const userId = interaction.user.id;
  const loai = (interaction.fields.getStringSelectValues('loai') || [])[0];
  const picked = interaction.fields.getSelectedUsers('nguoi', false);
  const target = picked && picked.first ? picked.first() : null;
  const kimLanName = sanitizeNickname(interaction.fields.getTextInputValue('kimlan'));

  let idB = '';
  let problem = null;
  if (!loai) problem = '❌ Chưa chọn loại quan hệ.';
  else if (loai === 'kimlan') {
    if (!kimLanName) problem = '❌ Với Kim Lan, cần nhập TÊN Kim Lan.';
    else if ([...kimLanName].length > PROFILE_KIMLAN_NAME_MAX) problem = `❌ Tên Kim Lan quá dài (tối đa ${PROFILE_KIMLAN_NAME_MAX} ký tự).`;
    else idB = kimLanName;
  } else if (!target) problem = '❌ Với Sư Phụ / Tri Kỷ, cần chọn người kia.';
  else if (target.bot) problem = '❌ Không thể chọn bot làm quan hệ.';
  else if (target.id === userId) problem = '❌ Không thể tự chọn chính mình.';
  else idB = target.id;

  if (problem) {
    await interaction.reply({ content: problem, ephemeral: true });
    return;
  }
  if (busy.has(userId)) {
    await interaction.reply({ content: '⏳ Yêu cầu trước của bạn vẫn đang xử lý, đợi chút nhé.', ephemeral: true });
    return;
  }
  await interaction.deferUpdate(); // modal mở từ nút trên tin nhắn -> cập nhật chính tin đó
  busy.add(userId);
  let note;
  try {
    // require trễ để tránh vòng phụ thuộc lúc nạp module (commands/* kéo theo nhiều module khác)
    const { applySetMqh } = require('../commands/slashProfile');
    const result = await applySetMqh(userId, loai, idB, { callerId: userId, isBong: false });
    note = result.message;
  } catch (error) {
    console.error('[profile] Lỗi đặt quan hệ:', error.message);
    note = '❌ Lỗi khi ghi vào Google Sheet, thử lại sau.';
  } finally {
    busy.delete(userId);
  }
  await respondWithView(interaction, note);
}

async function handleModal(interaction) {
  if (interaction.customId === ID.mqhModal) return handleMqhModal(interaction);
  const err = gateError(interaction.user.id);
  if (err) {
    await interaction.reply({ content: err, ephemeral: true });
    return;
  }
  const id = interaction.customId;
  if (id === ID.achModal) return handleAchModal(interaction);
  if (id === ID.gradModal) return handleGradModal(interaction);
  if (id === ID.frameModal || id.startsWith(`${ID.frameModal}:`)) return handleFrameModal(interaction, 'main', id.slice(ID.frameModal.length + 1));
  if (id === ID.frame2Modal) return handleFrameModal(interaction, 'main');
  let change;
  if (id === ID.nickModal) {
    const nickname = sanitizeNickname(interaction.fields.getTextInputValue('nick'));
    if ([...nickname].length > PROFILE_NICKNAME_MAX) {
      await interaction.reply({ content: `❌ Biệt danh quá dài (tối đa ${PROFILE_NICKNAME_MAX} ký tự).`, ephemeral: true });
      return;
    }
    change = { nickname };
  } else {
    const files = interaction.fields.getUploadedFiles('file');
    const attachment = files && files.first ? files.first() : null;
    if (!attachment) {
      await interaction.reply({ content: '❌ Chưa chọn ảnh nào.', ephemeral: true });
      return;
    }
    if (id === ID.coverModal) change = { cover: attachment };
    else if (id === ID.bgModal) change = { background: attachment };
    else change = { avatar: attachment };
  }
  await interaction.deferUpdate(); // modal mở từ nút trên tin nhắn -> cập nhật chính tin đó
  const result = await applyChange(interaction.user.id, change);
  await respondWithView(interaction, result.error || result.messages.join('\n'));
}

// Nút 🏅 Thành tựu: người bấm tự chọn thành tựu cho CHÍNH MÌNH (hoso/manualAchievements.js ghi Sheet + cập nhật cache).
async function handleAchModal(interaction) {
  const userId = interaction.user.id;
  const picked = (interaction.fields.getStringSelectValues('ach') || [])[0];
  if (!picked) {
    await interaction.reply({ content: '❌ Chưa chọn thành tựu nào.', ephemeral: true });
    return;
  }
  if (busy.has(userId)) {
    await interaction.reply({ content: '⏳ Yêu cầu trước của bạn vẫn đang xử lý, đợi chút nhé.', ephemeral: true });
    return;
  }
  await interaction.deferUpdate(); // modal mở từ nút trên tin nhắn -> cập nhật chính tin đó
  busy.add(userId);
  let note;
  try {
    const result = await setSelfAchievement(userId, picked === ACH_NONE ? null : picked);
    note = result.error || result.message;
  } catch (error) {
    console.error('[profile] Lỗi chọn thành tựu:', error.message);
    note = '❌ Lỗi khi ghi vào Google Sheet, thử lại sau.';
  } finally {
    busy.delete(userId);
  }
  await respondWithView(interaction, note);
}

// Nút 🎨 Màu chữ: ô nhập mã màu (nếu có) ưu tiên hơn mẫu trong dropdown; "Theo bậc cấp" = xoá lựa chọn.
async function handleGradModal(interaction) {
  const raw = String(interaction.fields.getTextInputValue('custom') || '').trim();
  const picked = (interaction.fields.getStringSelectValues('preset') || [])[0];
  let gradient;
  if (raw) {
    const r = parseColorInput(raw);
    if (r.error) {
      await interaction.reply({ content: `❌ ${r.error}`, ephemeral: true });
      return;
    }
    gradient = r.colors;
  } else if (!picked || picked === GRAD_DEFAULT) {
    gradient = '';
  } else {
    gradient = presetColors(picked);
    if (!gradient) {
      await interaction.reply({ content: '❌ Mẫu màu không hợp lệ, thử chọn lại.', ephemeral: true });
      return;
    }
  }
  await interaction.deferUpdate(); // modal mở từ nút trên tin nhắn -> cập nhật chính tin đó
  const result = await applyChange(interaction.user.id, { gradient });
  await respondWithView(interaction, result.error || result.messages.join('\n'));
}

// Nút 🧩 Khung thẻ: mỗi ô là 1 bộ -> ghi đè mọi thành phần của bộ đó (bộ khung = 6 thành phần, bộ avatar = 1), giữ phần khác;
// chọn "mặc định" cho bộ nào = xoá cả bộ đó. Khoá theo cấp kiểm tra trong applyChange (dùng chung với web).
async function handleFrameModal(interaction, modalKey, themeKey) {
  const picks = {};
  for (const g of frameChoice.groupsOf(modalKey)) picks[g.key] = (interaction.fields.getStringSelectValues(g.key) || [])[0];
  const base = frameChoice.dropLocked(frameChoice.deserialize((profiles.get(interaction.user.id) || {}).frame), deps.getLevel(interaction.user.id), interaction.user.id);
  const frame = frameChoice.serialize(frameChoice.choiceFromPicks(picks, base));
  await interaction.deferUpdate(); // modal mở từ nút trên tin nhắn -> cập nhật chính tin đó
  const result = await applyChange(interaction.user.id, { frame });
  await respondWithView(interaction, result.error || result.messages.join('\n'));
}

// ---------------------------------------------------------------- /profilexoa (Bông)
// Lõi dùng chung cho /profilexoa và mon!profilexoa. Trả chuỗi kết quả (không ném lỗi).
async function clearProfileFor(target) {
  const old = profiles.get(target.id);
  if (!old || (!old.nickname && !old.coverId && !old.avatarId && !old.bgId && !old.gradient && !old.frame)) {
    return 'Người này chưa có hồ sơ tuỳ chỉnh nào.';
  }
  try {
    const saved = await upsertProfile(target.id, { nickname: '', coverId: '', avatarId: '', bgId: '', gradient: '', frame: '' });
    profiles.set(target.id, saved);
  } catch (error) {
    console.error('[profile] xoá hồ sơ lỗi ghi sheet:', error.message);
    return '❌ Không ghi được sheet, thử lại sau.';
  }
  for (const id of [old.coverId, old.avatarId, old.bgId]) if (id) deleteImageFromCloudinary(id);
  return `🗑️ Đã gỡ toàn bộ hồ sơ tuỳ chỉnh (biệt danh, bìa, avatar, ảnh nền hồ sơ, màu chữ) của **${target.username}**. Họ có thể đặt lại bằng \`/profile\` hoặc \`mon!profile\`.`;
}

async function handleProfileAdminClear(interaction) {
  if (!interaction.guildId || !deps.isBong(interaction.member)) {
    await interaction.reply({ content: '❌ Bạn không có quyền sử dụng lệnh này. Cần role Bông.', ephemeral: true });
    return;
  }
  await interaction.deferReply({ ephemeral: true });
  await interaction.editReply(await clearProfileFor(interaction.options.getUser('nguoi')));
}

// ---------------------------------------------------------------- mon!profile / mon!profilexoa (bản prefix)
// mon!profile trả tin nhắn CÔNG KHAI (không ẩn được như slash) kèm nút; chỉ người gõ lệnh được bấm — ghi nhớ chủ tin theo messageId
// (RAM, hết hạn sau PREFIX_VIEW_TTL_MS thì gỡ nút). Sau khi bot khởi động lại, tin cũ không còn chủ -> từ chối, bảo gõ lại.
const PREFIX_VIEW_TTL_MS = 15 * 60 * 1000;
const prefixViewOwner = new Map(); // messageId -> { ownerId, timer }
const prefixCooldown = new Map(); // userId -> timestamp

function onPrefixCooldown(userId) {
  const now = Date.now();
  if (now - (prefixCooldown.get(userId) || 0) < 5000) return true;
  prefixCooldown.set(userId, now);
  if (prefixCooldown.size > 500) for (const [k, t] of prefixCooldown) if (now - t > 60000) prefixCooldown.delete(k);
  return false;
}

function trackPrefixView(sent, ownerId) {
  const timer = setTimeout(() => {
    prefixViewOwner.delete(sent.id);
    sent.edit({ components: [] }).catch(() => {});
  }, PREFIX_VIEW_TTL_MS);
  if (timer.unref) timer.unref();
  prefixViewOwner.set(sent.id, { ownerId, timer });
}

// Chặn người lạ bấm nút trên tin mon!profile của người khác. Trả true nếu đã chặn (đã phản hồi).
async function rejectIfNotOwner(interaction) {
  const msg = interaction.message;
  if (!msg || (msg.flags && msg.flags.has(MessageFlags.Ephemeral))) return false; // tin slash (ẩn) -> chỉ chủ thấy
  const rec = prefixViewOwner.get(msg.id);
  if (!rec) {
    await interaction.reply({ content: '⌛ Bảng hồ sơ này đã hết hạn, gõ lại `mon!profile` nhé.', ephemeral: true });
    return true;
  }
  if (rec.ownerId !== interaction.user.id) {
    await interaction.reply({ content: '❌ Đây không phải bảng hồ sơ của bạn — gõ `mon!profile` để mở bảng của riêng bạn.', ephemeral: true });
    return true;
  }
  return false;
}

async function handleProfileMessage(message) {
  try {
    if (message.author.bot) return;
    const content = String(message.content || '').trim();
    const m = /^mon!(profile|profilexoa)(\s|$)/i.exec(content);
    if (!m) return;
    if (!LEVEL_ENABLED || !PROFILE_ENABLED || !require('../features').isEnabled('hoso')) return void (await message.reply('Tính năng hồ sơ đang tắt.'));
    if (!message.guildId) return void (await message.reply('❌ Lệnh này chỉ dùng được trong server.'));
    if (!isBotReady()) return void (await replyNotReadyToMessage(message));
    if (onPrefixCooldown(message.author.id)) return;
    const quiet = { parse: [], repliedUser: false };

    if (m[1].toLowerCase() === 'profilexoa') {
      if (!deps.isBong(message.member)) return void (await message.reply({ content: '❌ Bạn không có quyền sử dụng lệnh này. Cần role Bông.', allowedMentions: quiet }));
      let target = message.mentions.users.first() || null;
      if (!target) {
        const idMatch = content.slice(m[0].length).match(/\b(\d{17,20})\b/);
        if (idMatch) target = await client.users.fetch(idMatch[1]).catch(() => null);
      }
      if (!target) return void (await message.reply({ content: 'Cú pháp: `mon!profilexoa <@người hoặc ID>`', allowedMentions: quiet }));
      return void (await message.reply({ content: await clearProfileFor(target), allowedMentions: quiet }));
    }

    if (!deps.isLoaded()) return void (await message.reply('⏳ Dữ liệu level đang được nạp, thử lại sau ít phút.'));
    const { attachments, ...view } = await buildView(message.guild, message.author, null); // tin mới không có `attachments`
    const sent = await message.reply({ ...view, allowedMentions: quiet });
    trackPrefixView(sent, message.author.id);
  } catch (error) {
    console.error('[profile] Lỗi lệnh mon!profile:', error.message);
  }
}
client.on(Events.MessageCreate, handleProfileMessage);

function isProfileInteraction(interaction) {
  if (interaction.isChatInputCommand()) return ['profile', 'profilexoa'].includes(interaction.commandName);
  if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) return String(interaction.customId || '').startsWith('profile:');
  return false;
}

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!isProfileInteraction(interaction)) return;
    if (!LEVEL_ENABLED || !PROFILE_ENABLED) {
      await interaction.reply({ content: 'Tính năng hồ sơ đang tắt.', ephemeral: true });
      return;
    }
    if (!isBotReady()) {
      await replyNotReadyToInteraction(interaction);
      return;
    }
    if (!interaction.isChatInputCommand() && (interaction.isButton() || interaction.isStringSelectMenu()) && (await rejectIfNotOwner(interaction))) return;
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'profile') await handleProfileCommand(interaction);
      else await handleProfileAdminClear(interaction);
    } else if (interaction.isButton()) await handleButton(interaction);
    else if (interaction.isStringSelectMenu()) await handleSelect(interaction);
    else if (interaction.isModalSubmit()) await handleModal(interaction);
  } catch (error) {
    console.error('[profile] Lỗi tương tác:', error.message);
    try {
      const msg = '❌ Có lỗi khi xử lý hồ sơ, thử lại sau nhé.';
      if (interaction.deferred || interaction.replied) await interaction.followUp({ content: msg, ephemeral: true });
      else await interaction.reply({ content: msg, ephemeral: true });
    } catch (_) {
      /* bỏ qua */
    }
  }
});

// ---------------------------------------------------------------- dùng chung cho web (level/profileApi.js)
// Web KHÔNG ghi thẳng Sheet/Cloudinary: mọi thay đổi đi qua applyChange ở trên để cache RAM `profiles`, cooldown và `busy` luôn khớp với bot.
function getProfileRecord(userId) {
  return profiles.get(userId) || { id: userId, nickname: '', coverId: '', avatarId: '', bgId: '', gradient: '', frame: '', showTriKy: false, allowView: true, hideTopRole: false };
}

function imageCooldownLeftSeconds(userId) {
  if (PROFILE_IMAGE_COOLDOWN_SECONDS <= 0) return 0;
  return Math.max(0, Math.ceil((PROFILE_IMAGE_COOLDOWN_SECONDS * 1000 - (Date.now() - (lastImageChange.get(userId) || 0))) / 1000));
}

function getLevelOf(userId) {
  return deps.getLevel(userId);
}

// Chạy fn khi người này không có thao tác hồ sơ nào đang chạy (dùng chung Set `busy` với nút trong Discord). Trả { error } nếu đang bận.
async function runExclusive(userId, fn) {
  if (busy.has(userId)) return { error: '⏳ Yêu cầu trước của bạn vẫn đang xử lý, đợi chút nhé.' };
  busy.add(userId);
  try {
    return await fn();
  } finally {
    busy.delete(userId);
  }
}

// Ảnh xem trước: buildPreview (thẻ /hoso) hoặc buildLevelPreview (thẻ /level) -> { png: Buffer | null, content }.
async function buildCardPreview(guild, user, kind, draft, opts = {}) {
  const fn = kind === 'level' ? deps.buildLevelPreview : deps.buildPreview;
  const run = () => (fn ? fn(guild, user, opts) : null);
  const out = (draft && (draft.cover || draft.avatar || draft.background) ? await withDraft(user.id, draft, run) : await run()) || {};
  const file = (out.files || [])[0];
  return { png: file && Buffer.isBuffer(file.attachment) ? file.attachment : null, content: out.content || '' };
}

module.exports = {
  init, start, getCardAssets, getNameStyle, getFrame, resolveName, resolveIngame, resolveClass,
  isBongMember: (m) => deps.isBong(m), applyChange, gateError, sanitizeNickname, getProfileRecord, imageCooldownLeftSeconds, getLevelOf, runExclusive, buildCardPreview,
};
