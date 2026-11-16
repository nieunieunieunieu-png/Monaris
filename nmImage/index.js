// ===== nmImage — Kho ảnh chung ("NM_image") =====
// /saveimg (+ mon!saveimg <tên>, kèm 1 ảnh đính kèm) tải ảnh lên Cloudinary ở
// chế độ RIÊNG TƯ ("authenticated" — không có link công khai) rồi ghi tên/ID
// ảnh vào sheet "Cây Thư Mục" (config.NM_IMAGE_SPREADSHEET_ID) để tra cứu.
// /send_img (+ mon!send_img) <tên hoặc ID ảnh> tải lại đúng ảnh đó (bot tự ký
// 1 link tải riêng từ Cloudinary — xem nmImage/cloudinary.js — hoặc từ Drive
// nếu là entry cũ lưu trước khi chuyển sang Cloudinary/Catbox/ImgBB, xem
// downloadNmImageEntry bên dưới) và gửi thẳng vào kênh đang gõ lệnh. ID ảnh
// (xem trong /viewlistimg) là 1 số thứ tự đơn giản dễ gõ (1, 2, 3...) chứ
// KHÔNG phải ID thật trên Cloudinary — ID thật nằm riêng trong sheet, bot tự
// dùng nội bộ, không cần quan tâm.
// /send_img còn hỗ trợ 3 việc thêm (đều không bắt buộc, kết hợp được):
//   - Tag kèm 1 người khác: option "nguoi_nhan" (slash) hoặc gõ @người đó
//     trong lệnh gõ tay (mon!send_img <tên> @ai đó) — ảnh vẫn gửi công khai
//     trong kênh, chỉ thêm dòng mention người đó phía trên ảnh. ĐÂY LÀ TAG
//     THẬT (mention thường, KHÔNG giới hạn allowedMentions) — người được tag
//     sẽ nhận thông báo/ping bình thường như bị tag trong chat.
//   - Gửi kèm 1 dòng chữ cùng ảnh: option "noi_dung" (slash) hoặc gõ
//     "| nội dung" sau tên/ID ảnh trong lệnh gõ tay (vd
//     mon!send_img logo | đây là logo mới nhé).
//   - Rep thẳng vào 1 tin nhắn cụ thể: option "reply_id" (slash) hoặc gõ
//     kèm ID tin nhắn trong lệnh gõ tay, HOẶC (chỉ với mon!send_img) tự động
//     rep lại đúng tin nhắn mà người dùng đang reply khi gõ lệnh — không
//     cần gõ tay ID trong trường hợp này. Rep cũng là REP THẬT (mặc định
//     Discord tự ping người được rep, không tắt mentionRepliedUser).
// /renameimg (+ mon!renameimg <tên cũ> -> <tên mới>) đổi tên 1 ảnh đã lưu
// (chỉ đổi tên tra cứu, không đụng tới ảnh/ID thật trên Cloudinary).
// /viewlistimg (+ mon!viewlistimg) liệt kê toàn bộ tên đã lưu. Dùng được ở
// MỌI kênh, không giới hạn role Bông (giống tinh thần mon!moe — tiện ích chung
// cho cả bang).
//
// RIÊNG TƯ: cả 4 slash command (/saveimg /send_img /renameimg /viewlistimg)
// đều ẩn việc "ai đã dùng lệnh" (deferReply ephemeral) — người khác trong
// kênh không biết bạn vừa dùng lệnh gì. Riêng /send_img: bản thân ẢNH gửi ra
// vẫn CÔNG KHAI cho cả kênh xem (gửi qua channel.send riêng, tách khỏi phần
// trả lời ẩn của interaction) — chỉ có việc bạn là người bấm lệnh là ẩn, còn
// ảnh thì ai cũng thấy như bình thường. Bản gõ chữ (mon!saveimg, mon!send_img,
// mon!renameimg, mon!viewlistimg) KHÔNG ẩn được gì cả vì đó là tin nhắn
// thường — ai cũng thấy y như tin nhắn bình thường.
//
// Module tự chứa (giống thiKiem/checkGear/vinhDanh/bcstat/highlight) — có
// listener MessageCreate/InteractionCreate RIÊNG, không đụng tới
// commands/messageCommands.js hay commands/slashCommands.js.
const { Events, AttachmentBuilder } = require('discord.js');
const client = require('../client');
const { isBotReady, replyNotReadyToMessage, replyNotReadyToInteraction } = require('../utils/readyGate');
const {
  ensureNmImageSheetExists,
  findNmImageEntryByName,
  findNmImageEntryById,
  searchNmImageEntriesByPartialName,
  getAllNmImageEntries,
  getNextDisplayId,
  appendNmImageEntry,
  renameNmImageEntry,
} = require('../googleSheets/nmImageSheet');
const { getAllKnowledgeImageEntries } = require('../googleSheets/knowledgeImageSheet');
const { uploadImageToCloudinary, getSignedDownloadUrl } = require('./cloudinary');
// downloadImageFromDrive giữ lại làm fallback — chỉ dùng cho các entry lưu
// TRƯỚC khi chuyển sang Cloudinary/Catbox/ImgBB (Drive File ID cũ vẫn còn
// trong sheet).
const { downloadImageFromDrive } = require('./drive');
const { NMIMAGE_SLASH_COMMANDS, formatImageListChunks } = require('./format');
const { getFormattedDateTime } = require('../utils/time');

const MAX_NAME_LENGTH = 100;

// Map mimeType -> đuôi file — dùng khi không có sẵn tên file gốc để lấy đuôi
// (vd ảnh lưu qua Cloudinary, tên tra cứu do người dùng tự đặt lúc /saveimg
// thường KHÔNG có đuôi, kiểu "logo" chứ không phải "logo.png").
function extensionFromMimeType(mimeType) {
  const map = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif' };
  return map[mimeType] || '';
}

function guessExtension(attachment) {
  const fromName = (attachment.name || '').match(/\.[a-zA-Z0-9]+$/);
  if (fromName) return fromName[0];
  return extensionFromMimeType(attachment.contentType || '');
}

// Logic dùng chung cho mon!saveimg và /saveimg — trả về { ok, text }.
async function saveImageCommon({ rawName, attachment, discordId }) {
  const name = String(rawName || '').trim();
  if (!name) {
    return { ok: false, text: '❌ Thiếu tên ảnh. Dùng: `mon!saveimg <tên>` (kèm 1 ảnh đính kèm) hoặc `/saveimg`.' };
  }
  if (name.length > MAX_NAME_LENGTH) {
    return { ok: false, text: `❌ Tên ảnh quá dài (tối đa ${MAX_NAME_LENGTH} ký tự).` };
  }
  if (!attachment) {
    return { ok: false, text: '❌ Chưa đính kèm ảnh nào. Gửi kèm 1 ảnh cùng lệnh.' };
  }
  const mimeType = attachment.contentType || '';
  if (!mimeType.startsWith('image/')) {
    return { ok: false, text: '❌ File đính kèm không phải ảnh. Chỉ nhận file ảnh (png/jpg/webp/gif...).' };
  }

  const existing = await findNmImageEntryByName(name);
  if (existing) {
    return {
      ok: false,
      text: `❌ Tên **${name}** đã được dùng rồi. Dùng \`/send_img ${name}\` để xem lại ảnh đó, hoặc chọn 1 tên khác.`,
    };
  }

  let buffer;
  try {
    const res = await fetch(attachment.url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    buffer = Buffer.from(await res.arrayBuffer());
  } catch (error) {
    console.error('Lỗi tải ảnh đính kèm về (saveimg):', error.message);
    return { ok: false, text: '❌ Không tải được ảnh đính kèm về, thử gửi lại.' };
  }

  return storeImageBuffer({
    name,
    buffer,
    mimeType,
    filename: `${name}${guessExtension(attachment)}`,
    discordId,
    skipDuplicateCheck: true, // đã kiểm tra tên ở trên, khỏi đọc sheet thêm lần nữa
  });
}

// Lõi LƯU ẢNH dùng chung (đã có buffer): upload Cloudinary riêng tư + ghi 1 dòng vào sheet "Cây Thư Mục". Dùng cho
// /saveimg, mon!saveimg và trang web "Kiến Thức Bot" (upload ảnh gắn vào 1 mục kiến thức) — nên mọi ảnh nằm CHUNG 1
// kho, xem được bằng /viewlistimg + /send_img. Trả { ok, text, id, name } (id = ID hiển thị trong cột B).
async function storeImageBuffer({ name, buffer, mimeType, filename, discordId, skipDuplicateCheck = false }) {
  if (!skipDuplicateCheck) {
    const existing = await findNmImageEntryByName(name);
    if (existing) {
      return { ok: false, code: 'NAME_TAKEN', text: `❌ Tên **${name}** đã được dùng rồi, chọn 1 tên khác.` };
    }
  }

  let uploadResult;
  try {
    uploadResult = await uploadImageToCloudinary(buffer, filename, mimeType);
  } catch (error) {
    console.error('Lỗi upload ảnh lên Cloudinary (saveimg):', error.message);
    return {
      ok: false,
      text: '❌ Không lưu được ảnh lên Cloudinary. Kiểm tra lại CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET đã cấu hình đúng chưa, hoặc thử lại sau.',
    };
  }

  // Cột "Link" không lưu link thật (ảnh authenticated không có link công
  // khai cố định) — đánh dấu bằng "cloudinary:<format>" để downloadNmImageEntry
  // nhận ra và tự ký lại link tải mỗi lần cần. ID hiển thị (cột B) là số thứ
  // tự đơn giản cho dễ gõ vào /send_img — ID thật của Cloudinary (cần để ký
  // link tải) nằm riêng ở cột G, không hiển thị/không cần gõ tay.
  let displayId;
  try {
    displayId = await getNextDisplayId();
  } catch (error) {
    console.error('Lỗi sinh ID hiển thị (saveimg), dùng tạm ID Cloudinary:', error.message);
    displayId = uploadResult.id;
  }

  try {
    await ensureNmImageSheetExists();
    await appendNmImageEntry({
      name,
      fileId: displayId,
      link: `cloudinary:${uploadResult.format || ''}`,
      mimeType,
      discordId,
      savedAt: getFormattedDateTime(),
      cloudinaryId: uploadResult.id,
    });
  } catch (error) {
    console.error('Lỗi ghi sheet "Cây Thư Mục" (saveimg):', error.message);
    return {
      ok: false,
      text: '⚠️ Đã lưu ảnh lên Cloudinary nhưng KHÔNG ghi được vào sheet — báo Bông kiểm tra lại quyền truy cập sheet "Cây Thư Mục".',
    };
  }

  return {
    ok: true,
    id: displayId,
    name,
    text: `✅ Đã lưu ảnh với tên **${name}** (ID: **${displayId}**). Xem lại bằng \`/send_img ${name}\` hoặc \`/send_img ${displayId}\`.`,
  };
}

// Lưu ảnh cho MỤC KIẾN THỨC: đã tách sang ./knowledgeStore.js (nơi lưu giữ nguyên: folder Cloudinary riêng + tab "Ảnh Kiến Thức").
const { storeKnowledgeImageBuffer } = require('./knowledgeStore');

// Logic dùng chung cho mon!renameimg và /renameimg — trả về { ok, text }.
async function renameImageCommon({ oldName, newName }) {
  const from = String(oldName || '').trim();
  const to = String(newName || '').trim();
  if (!from || !to) {
    return {
      ok: false,
      text: '❌ Thiếu tên hoặc sai định dạng. Dùng: `mon!renameimg <tên cũ> -> <tên mới>` hoặc `/renameimg`.',
    };
  }
  if (to.length > MAX_NAME_LENGTH) {
    return { ok: false, text: `❌ Tên mới quá dài (tối đa ${MAX_NAME_LENGTH} ký tự).` };
  }

  let result;
  try {
    result = await renameNmImageEntry(from, to);
  } catch (error) {
    console.error('Lỗi đổi tên ảnh (renameimg):', error.message);
    return { ok: false, text: '❌ Không đổi được tên, thử lại sau hoặc báo Bông kiểm tra lại quyền truy cập sheet.' };
  }

  if (!result.ok) {
    if (result.reason === 'name_taken') {
      return { ok: false, text: `❌ Tên **${to}** đã được dùng rồi, chọn tên khác.` };
    }
    return {
      ok: false,
      text: `❌ Không tìm thấy ảnh nào tên **${from}**. Dùng \`/viewlistimg\` để xem danh sách.`,
    };
  }

  return { ok: true, text: `✅ Đã đổi tên **${from}** thành **${to}**. Xem lại bằng \`/send_img ${to}\`.` };
}

// Tìm 1 entry theo input (tên KHỚP TUYỆT ĐỐI trước, không thấy thì thử theo
// Drive File ID) — trả về { entry, suggestions } (suggestions chỉ có giá trị
// khi entry null, gợi ý các tên gần đúng nếu có).
async function resolveImageQuery(query) {
  const trimmed = String(query || '').trim();
  if (!trimmed) return { entry: null, suggestions: [] };

  const byName = await findNmImageEntryByName(trimmed);
  if (byName) return { entry: byName, suggestions: [] };

  const byId = await findNmImageEntryById(trimmed);
  if (byId) return { entry: byId, suggestions: [] };

  const partial = await searchNmImageEntriesByPartialName(trimmed);
  return { entry: null, suggestions: partial.slice(0, 10) };
}

// Tải lại nội dung ảnh của 1 entry — trả về { buffer, name, mimeType}.
// Ảnh lưu MỚI NHẤT (Cloudinary — entry.link bắt đầu bằng "cloudinary:"):
// không có link cố định, phải tự ký 1 link tải riêng mỗi lần (xem
// getSignedDownloadUrl) rồi fetch link đó. Ảnh lưu thời Catbox/ImgBB:
// entry.link là direct link (files.catbox.moe/xxx hoặc i.ibb.co/xxx) nên
// fetch thẳng được. Ảnh lưu CŨ NHẤT (còn từ thời Drive): entry.link là
// webViewLink của Drive (trang xem HTML, không phải file gốc) nên fetch
// thẳng sẽ không ra ảnh — fallback qua downloadImageFromDrive bằng
// entry.fileId (lúc đó là Drive File ID).
async function downloadNmImageEntry(entry) {
  if (entry.link && entry.link.startsWith('cloudinary:')) {
    const format = entry.link.slice('cloudinary:'.length) || undefined;
    // cloudinaryId là ID THẬT trên Cloudinary (cột G) — fileId ở đây giờ chỉ
    // là số thứ tự hiển thị cho dễ gõ, KHÔNG dùng để ký link được. Dòng nào
    // lỡ thiếu cloudinaryId (vd lưu ngay lúc mới thêm cột G) thì fallback về
    // fileId — chỉ đúng nếu fileId lúc đó vẫn còn là ID Cloudinary gốc.
    const cloudinaryPublicId = entry.cloudinaryId || entry.fileId;
    try {
      const downloadUrl = await getSignedDownloadUrl(cloudinaryPublicId, format);
      const res = await fetch(downloadUrl);
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        const contentType = res.headers.get('content-type') || entry.mimeType || 'application/octet-stream';
        // entry.name (tên tra cứu người dùng tự đặt) thường KHÔNG có đuôi file —
        // phải tự gắn đuôi (ưu tiên `format` Cloudinary đã biết, fallback theo
        // content-type) thì Discord mới nhận ra đây là ảnh và hiện trực tiếp
        // trong khung chat thay vì hiện thành file để tải.
        const ext = format ? `.${format}` : extensionFromMimeType(contentType);
        return { buffer, name: `${entry.name}${ext}`, mimeType: contentType };
      }
    } catch (_) {
      // rơi xuống fallback Drive bên dưới (không nên xảy ra với entry Cloudinary)
    }
  } else if (entry.link) {
    try {
      const res = await fetch(entry.link);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.startsWith('image/')) {
        const buffer = Buffer.from(await res.arrayBuffer());
        // Cùng lý do như nhánh Cloudinary ở trên — gắn đuôi theo content-type
        // để Discord hiện ảnh trực tiếp thay vì thành file tải về.
        return { buffer, name: `${entry.name}${extensionFromMimeType(contentType)}`, mimeType: contentType };
      }
    } catch (_) {
      // rơi xuống fallback Drive bên dưới
    }
  }
  return downloadImageFromDrive(entry.fileId);
}

// Tải nhiều ảnh theo danh sách ID hiển thị (cột B sheet "Cây Thư Mục") — dùng cho ảnh gắn vào mục kiến thức.
// Chỉ đọc sheet 1 lần; ID không còn trong kho hoặc tải lỗi thì bỏ qua (không làm hỏng cả câu trả lời).
// Trả [{ id, name, buffer, filename, mimeType }] theo đúng thứ tự ids.
async function loadImageFilesByIds(ids) {
  const wanted = [...new Set((ids || []).map((id) => String(id || '').trim()).filter(Boolean))];
  if (!wanted.length) return [];
  return loadFilesFromEntries(await getAllNmImageEntries(), wanted);
}

// Như loadImageFilesByIds nhưng lấy từ tab RIÊNG "Ảnh Kiến Thức" (ảnh gắn vào mục kiến thức, không lẫn /saveimg).
async function loadKnowledgeImageFilesByIds(ids) {
  const wanted = [...new Set((ids || []).map((id) => String(id || '').trim()).filter(Boolean))];
  if (!wanted.length) return [];
  return loadFilesFromEntries(await getAllKnowledgeImageEntries(), wanted);
}

async function loadFilesFromEntries(entries, wanted) {
  const result = [];
  for (const id of wanted) {
    const entry = entries.find((item) => item.fileId === id);
    if (!entry) continue;
    try {
      const { buffer, name, mimeType } = await downloadNmImageEntry(entry);
      result.push({ id, name: entry.name, buffer, filename: name || entry.name, mimeType: mimeType || entry.mimeType });
    } catch (error) {
      console.error(`Không tải được ảnh ID ${id} ("${entry.name}"):`, error.message);
    }
  }
  return result;
}

// Logic dùng chung cho mon!send_img và /send_img — trả về { ok, text, file }.
async function sendImageCommon({ query }) {
  const { entry, suggestions } = await resolveImageQuery(query);

  if (!entry) {
    if (suggestions.length) {
      const names = suggestions.map((s) => `**${s.name}**`).join(', ');
      return { ok: false, text: `❌ Không tìm thấy đúng tên/ID đó. Có phải bạn muốn tìm: ${names}?` };
    }
    return { ok: false, text: `❌ Không tìm thấy ảnh nào tên/ID **${query}**. Dùng \`/viewlistimg\` để xem danh sách.` };
  }

  try {
    const { buffer, name } = await downloadNmImageEntry(entry);
    // `name` giờ luôn đã có đuôi file đúng (xem downloadNmImageEntry) — fallback
    // về entry.name chỉ để phòng hờ, không nên xảy ra.
    const filename = name || entry.name;
    const file = new AttachmentBuilder(buffer, { name: filename });
    // Không kèm caption tên ảnh nữa — chỉ gửi ảnh, gọn hơn.
    return { ok: true, file };
  } catch (error) {
    console.error('Lỗi tải ảnh về (send_img):', error.message);
    return {
      ok: false,
      text: '❌ Không tải được ảnh (có thể ảnh đã bị xoá, hoặc file Drive cũ đã bị xoá thủ công). Báo Bông kiểm tra lại.',
    };
  }
}

// Ghép mention (tag người nhận, nếu có) + nội dung thêm (nếu có) thành 1
// chuỗi content duy nhất cho tin nhắn gửi ảnh — dùng CHUNG cho cả slash lẫn
// gõ tay. Cả 2 phần đều optional, trả về undefined nếu không có gì (để khỏi
// gán payload.content = '' thừa).
function buildSendImgContent(mentionedUser, extraContent) {
  const parts = [];
  if (extraContent) parts.push(extraContent);
  if (mentionedUser) parts.push(`${mentionedUser}`);
  return parts.length ? parts.join('\n') : undefined;
}

// ===== mon!... =====
async function handleMessageCommand(message) {
  try {
    if (message.author.bot) return;
    const content = (message.content || '').trim();

    if (/^mon!saveimg(\s|$)/i.test(content)) {
      if (!isBotReady()) return void (await replyNotReadyToMessage(message));
      const rawName = content.replace(/^mon!saveimg/i, '').trim();
      const attachment = message.attachments.first();
      const result = await saveImageCommon({ rawName, attachment, discordId: message.author.id });
      await message.reply(result.text);
      return;
    }

    if (/^mon!send_img(\s|$)/i.test(content)) {
      if (!isBotReady()) return void (await replyNotReadyToMessage(message));
      let rest = content.replace(/^mon!send_img/i, '').trim();

      // Cho phép gõ kèm @ai đó trong lệnh để tag người đó cùng ảnh gửi ra —
      // bỏ phần mention ra khỏi chuỗi để không lẫn vào tên/ID ảnh cần tìm.
      const mentionedUser = message.mentions.users.find((u) => u.id !== client.user.id);
      rest = rest.replace(/<@!?\d+>/g, '').trim();

      // Cho phép gõ kèm 1 ID tin nhắn (chuỗi số dài kiểu Discord snowflake) để
      // rep thẳng vào đúng tin nhắn đó — tách riêng ra khỏi tên/ID ảnh.
      let explicitReplyId = null;
      const idMatch = rest.match(/\b(\d{17,20})\b/);
      if (idMatch) {
        explicitReplyId = idMatch[1];
        rest = (rest.slice(0, idMatch.index) + rest.slice(idMatch.index + idMatch[0].length)).trim();
      }

      // Cho phép gõ kèm "| nội dung thêm" để gửi kèm 1 dòng chữ cùng ảnh —
      // phần TRƯỚC dấu "|" đầu tiên là tên/ID ảnh, phần SAU là nội dung thêm
      // (tuỳ chọn). Không có "|" thì toàn bộ rest là tên/ID ảnh như cũ.
      const pipeIndex = rest.indexOf('|');
      let extraContent = null;
      let query = rest;
      if (pipeIndex !== -1) {
        query = rest.slice(0, pipeIndex).trim();
        extraContent = rest.slice(pipeIndex + 1).trim() || null;
      }

      if (!query) {
        await message.reply(
          '❌ Thiếu tên/ID ảnh. Dùng: `mon!send_img <tên hoặc ID ảnh> [| nội dung thêm] [@ai đó] [ID tin nhắn cần rep]`.'
        );
        return;
      }

      const result = await sendImageCommon({ query });
      if (!result.ok) {
        await message.reply(result.text);
        return;
      }

      const payload = { files: [result.file] };
      const builtContent = buildSendImgContent(mentionedUser, extraContent);
      if (builtContent) payload.content = builtContent;

      // Ưu tiên ID tin nhắn gõ tường minh trong lệnh; nếu không có mà bản
      // thân tin nhắn gõ lệnh đang reply 1 tin nhắn khác thì tự động rep lại
      // đúng tin nhắn đó (failIfNotExists: false — ID sai/tin đã xoá thì vẫn
      // gửi ảnh bình thường, không báo lỗi).
      const replyTargetId = explicitReplyId || message.reference?.messageId;
      if (replyTargetId) {
        payload.reply = { messageReference: replyTargetId, failIfNotExists: false };
      }

      await message.channel.send(payload);
      return;
    }

    if (/^mon!renameimg(\s|$)/i.test(content)) {
      if (!isBotReady()) return void (await replyNotReadyToMessage(message));
      const rest = content.replace(/^mon!renameimg/i, '').trim();
      const [oldNamePart, newNamePart] = rest.split('->');
      const result = await renameImageCommon({ oldName: oldNamePart, newName: newNamePart });
      await message.reply(result.text);
      return;
    }

    if (/^mon!viewlistimg(\s|$)/i.test(content)) {
      if (!isBotReady()) return void (await replyNotReadyToMessage(message));
      const entries = await getAllNmImageEntries();
      const chunks = formatImageListChunks(entries);
      for (const chunk of chunks) {
        await message.channel.send(chunk);
      }
      return;
    }
  } catch (error) {
    console.error('Lỗi xử lý lệnh mon! kho ảnh:', error.message);
  }
}

// ===== /saveimg /send_img /viewlistimg =====
client.on(Events.MessageCreate, handleMessageCommand);

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.isChatInputCommand()) return;
    const isLocalCommand = ['saveimg', 'send_img', 'renameimg', 'viewlistimg'].includes(interaction.commandName);
    if (!isLocalCommand) return;

    if (!isBotReady()) {
      await replyNotReadyToInteraction(interaction);
      return;
    }

    if (interaction.commandName === 'saveimg') {
      await interaction.deferReply({ ephemeral: true });
      const rawName = interaction.options.getString('ten');
      const attachment = interaction.options.getAttachment('anh');
      const result = await saveImageCommon({ rawName, attachment, discordId: interaction.user.id });
      await interaction.editReply(result.text);
      return;
    }

    if (interaction.commandName === 'send_img') {
      await interaction.deferReply({ ephemeral: true });
      const query = interaction.options.getString('ten_hoac_id');
      const targetUser = interaction.options.getUser('nguoi_nhan');
      const replyToId = interaction.options.getString('reply_id');
      const extraContent = interaction.options.getString('noi_dung');
      const result = await sendImageCommon({ query });
      if (result.ok) {
        // Gửi ảnh CÔNG KHAI ra kênh (tin nhắn thường, không gắn với
        // interaction) — chỉ riêng việc "ai đã dùng /send_img" là ẩn nhờ
        // deferReply ephemeral ở trên, còn ảnh thì ai cũng thấy như bình
        // thường. Nếu có chọn "nguoi_nhan" thì tag kèm người đó (tag THẬT —
        // sẽ ping/thông báo cho người đó, KHÔNG giới hạn allowedMentions);
        // nếu có "noi_dung" thì gửi kèm dòng chữ đó cùng ảnh; nếu có
        // "reply_id" thì rep thẳng vào đúng tin nhắn đó (failIfNotExists:
        // false — ID sai/tin đã xoá thì vẫn gửi ảnh bình thường; rep mặc
        // định CŨNG ping người được rep, không tắt mentionRepliedUser).
        const payload = { files: [result.file] };
        const builtContent = buildSendImgContent(targetUser, extraContent);
        if (builtContent) payload.content = builtContent;
        if (replyToId) payload.reply = { messageReference: replyToId, failIfNotExists: false };
        await interaction.channel.send(payload);
        await interaction.editReply('✅ Đã gửi ảnh vào kênh.');
      } else {
        await interaction.editReply(result.text);
      }
      return;
    }

    if (interaction.commandName === 'renameimg') {
      await interaction.deferReply({ ephemeral: true });
      const oldName = interaction.options.getString('ten_cu');
      const newName = interaction.options.getString('ten_moi');
      const result = await renameImageCommon({ oldName, newName });
      await interaction.editReply(result.text);
      return;
    }

    if (interaction.commandName === 'viewlistimg') {
      await interaction.deferReply({ ephemeral: true });
      const entries = await getAllNmImageEntries();
      const chunks = formatImageListChunks(entries);
      await interaction.editReply(chunks[0]);
      for (const chunk of chunks.slice(1)) {
        await interaction.followUp({ content: chunk, ephemeral: true });
      }
      return;
    }
  } catch (error) {
    console.error('Lỗi xử lý tương tác kho ảnh:', error.message);
  }
});

module.exports = {
  ensureNmImageSheetExists,
  NMIMAGE_SLASH_COMMANDS,
  storeImageBuffer,
  loadImageFilesByIds,
  storeKnowledgeImageBuffer,
  loadKnowledgeImageFilesByIds,
};
