// ===== Slash: hồ sơ / quan hệ =====
// /setpf, /setmqh, role Bông + applySetMqh (dùng chung với mon!setmqh trong messageProfile.js).

const client = require('../client');
const { accessIds } = require('../state');
const { BONG_ROLE_ID, ADMIN_USER_ID } = require('../config');
const { hasChatFeatureAccess } = require('../utils/permissions');
const { addAccessIdRow } = require('../googleSheets/accessIdSheet');
const { upsertChatGlobalMember, setSuPhu, setTriKy, setKimLan } = require('../googleSheets/chatGlobalSheet');
const { getMemberInfoAnySource } = require('../AutoReply');

// Xử lý /setpf — cho phép BẤT KỲ AI cũng set (hoặc set THAY người khác
// qua option `user`, hoặc qua `user_id` cho người quen KHÔNG có trong
// server) Ingame/Class/Biệt Danh vào tab "ChatGlobal"
// (googleSheets/chatGlobalSheet.js) — không giới hạn theo server/role, vì
// tính năng này chủ đích phục vụ cả người dùng KHÔNG thuộc server chính.
async function setProfileSlash(interaction) {
  const ingame = interaction.options.getString('ingame');
  const className = interaction.options.getString('class');
  const nickname = interaction.options.getString('biet_danh');
  const targetUser = interaction.options.getUser('user');
  const targetUserId = interaction.options.getString('user_id');

  if (ingame === null && className === null && nickname === null) {
    await interaction.reply({
      content: '⚠️ Cần nhập ít nhất 1 trong 3: `ingame`, `class`, hoặc `biet_danh`.',
      ephemeral: true,
    });
    return;
  }

  if (targetUser && targetUserId) {
    await interaction.reply({
      content: '❌ Chỉ chọn MỘT trong hai: `user` (tag) hoặc `user_id` (Discord ID), không dùng cả hai cùng lúc.',
      ephemeral: true,
    });
    return;
  }

  const trimmedUserId = targetUserId ? targetUserId.trim() : null;
  if (trimmedUserId && !/^\d{15,25}$/.test(trimmedUserId)) {
    await interaction.reply({
      content: '❌ `user_id` không hợp lệ — phải là Discord ID dạng số (VD: 123456789012345678).',
      ephemeral: true,
    });
    return;
  }

  const resolvedUserId = targetUser ? targetUser.id : trimmedUserId || interaction.user.id;

  // Set profile của CHÍNH MÌNH vẫn mở cho tất cả như trước giờ — chỉ set
  // THAY người khác (qua user/user_id) mới cần quyền Bông/AccessID.
  if (resolvedUserId !== interaction.user.id && !hasChatFeatureAccess(interaction.user.id, interaction.member)) {
    await interaction.reply({
      content: '❌ Bạn không có quyền set profile thay người khác. Cần role Bông hoặc được cấp quyền qua role Bông.',
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    // undefined (KHÔNG phải null) cho field không nhập -> upsertChatGlobalMember
    // hiểu là "giữ nguyên giá trị cũ", không phải "xoá trắng field đó".
    const result = await upsertChatGlobalMember({
      discordId: resolvedUserId,
      ingame: ingame !== null ? ingame : undefined,
      className: className !== null ? className : undefined,
      nickname: nickname !== null ? nickname : undefined,
    });

    const targetLabel =
      resolvedUserId === interaction.user.id ? 'bạn' : targetUser ? `<@${targetUser.id}>` : `\`${resolvedUserId}\``;
    const summaryLines = [
      `✅ Đã cập nhật profile cho ${targetLabel}:`,
      `- Ingame: ${result.ingame || '(chưa có)'}`,
      `- Class: ${result.className || '(chưa có)'}`,
      `- Biệt Danh: ${result.nickname || '(chưa có)'}`,
    ];

    await interaction.editReply(summaryLines.join('\n'));
  } catch (error) {
    console.error('Failed to upsert ChatGlobal profile via slash command:', error.message);
    await interaction.editReply('❌ Lỗi khi ghi vào Google Sheet.');
  }
}

// Xử lý CHUNG cho /setmqh và mon!setmqh (commands/messageCommands.js) — nhận
// idA/loai/idB đã parse sẵn, gọi đúng hàm set*() tương ứng ở
// googleSheets/chatGlobalSheet.js, rồi trả về { ok, message } để lệnh gọi
// (slash hoặc text) tự reply theo đúng format của mình (interaction.editReply
// vs message.reply) — tránh lặp code parse/validate 2 lần cho 2 kiểu lệnh.
const DISCORD_ID_REGEX = /^\d{15,25}$/;

// Gửi DM riêng báo cho PHÍA BÊN KIA (idB) biết vừa có người set quan hệ với
// họ (Sư Phụ nhận đệ tử / kết Tri Kỷ) — KHÔNG cần họ xác nhận gì, chỉ để họ
// biết, gọi ĐÚNG TÊN INGAME của idA (thay vì trần trụi Discord ID) cho dễ
// nhận ra là ai. isBong = true (Bông set THAY người khác, không phải tự
// idA khai báo) -> KHÔNG gửi thông báo, vì đây là admin chỉnh/dọn dữ liệu
// chứ không phải bản thân idA thực sự xác nhận mối quan hệ này.
// Best-effort: lỗi gì (họ chặn DM, chưa từng chat với bot...) chỉ log lại,
// không làm gián đoạn kết quả set quan hệ chính (đã ghi vào Sheet thành
// công rồi, DM chỉ là thông báo thêm).
async function notifyRelationshipTarget(idA, idB, isBong, buildContent) {
  if (isBong) return;

  try {
    const aInfo = await getMemberInfoAnySource(idA);
    const aDisplayName = (aInfo && (aInfo.ingame || aInfo.nickname)) || `ID \`${idA}\``;

    const targetUser = await client.users.fetch(idB);
    await targetUser.send({ content: buildContent(aDisplayName), allowedMentions: { parse: [] } });
  } catch (error) {
    console.error('Không thể gửi DM thông báo mối quan hệ:', error.message);
  }
}

// Cho phép gõ tắt: sp = suphu, tk = triky, kl = kimlan (song song với viết
// đầy đủ) — normalize về đúng 3 giá trị gốc trước khi xử lý, để chỉ cần
// sửa alias ở 1 chỗ DUY NHẤT này, không phải sửa từng nơi gọi applySetMqh.
function normalizeLoai(rawLoai) {
  const v = (rawLoai || '').toLowerCase();
  if (v === 'suphu' || v === 'sp') return 'suphu';
  if (v === 'triky' || v === 'tk') return 'triky';
  if (v === 'kimlan' || v === 'kl') return 'kimlan';
  return v;
}

async function applySetMqh(idA, rawLoai, idB, { callerId, isBong } = {}) {
  const loai = normalizeLoai(rawLoai);

  if (!DISCORD_ID_REGEX.test(idA)) {
    return { ok: false, message: '❌ `id_a` không hợp lệ — phải là Discord ID dạng số (VD: 123456789012345678).' };
  }

  // Chỉ được set quan hệ cho CHÍNH MÌNH (id_a phải trùng ID người gõ lệnh)
  // — trừ khi có role Bông (Bông vẫn được set/sửa thay người khác, dùng cho
  // trường hợp cần chỉnh sửa/dọn dữ liệu hộ). Không có ngoại lệ này thì bất
  // kỳ ai cũng có thể tự ý gán sư phụ/tri kỷ/kim lan cho người khác mà
  // không cần người đó đồng ý.
  if (callerId && idA !== callerId && !isBong) {
    return {
      ok: false,
      message: '❌ Bạn chỉ có thể set mối quan hệ cho CHÍNH MÌNH (`id_a` phải là Discord ID của bạn). Cần role Bông mới set được thay người khác.',
    };
  }

  if (loai === 'suphu') {
    if (!DISCORD_ID_REGEX.test(idB)) {
      return { ok: false, message: '❌ `id_b` không hợp lệ — với loại Sư Phụ, phải là Discord ID dạng số.' };
    }
    try {
      await setSuPhu(idA, idB);
      await notifyRelationshipTarget(
        idA,
        idB,
        isBong,
        (aName) => `🔔 ${aName} vừa cập nhật bạn là Sư Phụ của ${aName} (qua lệnh /setmqh).`
      );
      return { ok: true, message: `✅ Đã set Sư Phụ của \`${idA}\` là \`${idB}\`.` };
    } catch (error) {
      return { ok: false, message: `❌ ${error.message}` };
    }
  }

  if (loai === 'triky') {
    if (!DISCORD_ID_REGEX.test(idB)) {
      return { ok: false, message: '❌ `id_b` không hợp lệ — với loại Tri Kỷ, phải là Discord ID dạng số.' };
    }
    try {
      await setTriKy(idA, idB);
      await notifyRelationshipTarget(
        idA,
        idB,
        isBong,
        (aName) => `🔔 ${aName} vừa cập nhật quan hệ Tri Kỷ với bạn (qua lệnh /setmqh).`
      );
      return { ok: true, message: `✅ Đã liên kết Tri Kỷ 2 chiều giữa \`${idA}\` và \`${idB}\`.` };
    } catch (error) {
      return { ok: false, message: `❌ ${error.message}` };
    }
  }

  if (loai === 'kimlan') {
    if (!idB || !idB.trim()) {
      return { ok: false, message: '❌ `id_b` không hợp lệ — với loại Kim Lan, cần nhập TÊN kim lan (không để trống).' };
    }
    try {
      const result = await setKimLan(idA, idB);
      return { ok: true, message: `✅ Đã set Kim Lan của \`${idA}\` là "${result.kimLan}".` };
    } catch (error) {
      return { ok: false, message: `❌ ${error.message}` };
    }
  }

  return { ok: false, message: '❌ `loai` không hợp lệ — chỉ nhận `suphu`/`sp`, `triky`/`tk`, hoặc `kimlan`/`kl`.' };
}

async function setMqhSlash(interaction) {
  const loai = interaction.options.getString('loai');
  const normalizedLoai = normalizeLoai(loai);

  // Ưu tiên nguoi_a/nguoi_b (option kiểu User, tag trực tiếp được) nếu có
  // — chỉ dùng id_a/id_b (String, gõ tay ID số) khi KHÔNG tag được (vd
  // người đó rời server / chưa từng ở chung server nào với bot).
  const userA = interaction.options.getUser('nguoi_a');
  const idAString = interaction.options.getString('id_a');
  const idA = userA ? userA.id : (idAString || '').trim();

  if (!idA) {
    await interaction.reply({
      content: '❌ Cần chọn `nguoi_a` (tag thành viên) HOẶC nhập `id_a` (Discord ID dạng số).',
      ephemeral: true,
    });
    return;
  }

  // Kim Lan: id_b luôn là TÊN kim lan (text) — nguoi_b không áp dụng, dù
  // interaction có lỡ truyền cũng bỏ qua, chỉ dùng id_b.
  const userB = normalizedLoai === 'kimlan' ? null : interaction.options.getUser('nguoi_b');
  const idBString = interaction.options.getString('id_b');
  const idB = userB ? userB.id : (idBString || '').trim();

  if (!idB) {
    const hint = normalizedLoai === 'kimlan' ? '`id_b` (TÊN kim lan)' : '`nguoi_b` (tag thành viên) HOẶC `id_b` (Discord ID dạng số)';
    await interaction.reply({ content: `❌ Cần nhập ${hint}.`, ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const result = await applySetMqh(idA, loai, idB, {
      callerId: interaction.user.id,
      isBong: Boolean(interaction.member && interaction.member.roles.cache.has(BONG_ROLE_ID)),
    });
    await interaction.editReply(result.message);
  } catch (error) {
    console.error('Failed to set relationship via /setmqh:', error.message);
    await interaction.editReply('❌ Lỗi khi ghi vào Google Sheet.');
  }
}
// Trả về true nếu interaction đã được xử lý ở nhóm lệnh này (tương ứng `return;` trong listener gốc).
async function handleProfileSlashCommands(interaction, commandName) {
    if (commandName === 'setpf') {
      await setProfileSlash(interaction);
      return true;
    }

    if (commandName === 'setmqh') {
      await setMqhSlash(interaction);
      return true;
    }
  return false;
}

module.exports = {
  applySetMqh,
  handleProfileSlashCommands,
};
