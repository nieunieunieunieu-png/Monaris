// ===== Duyệt tin "Bảng Tin Monaris" gửi bởi người KHÔNG có role Bông =====
// Luồng: /addnotice (xem commands/slashCommands.js) -> nếu người gõ lệnh
// KHÔNG có role Bông, tin KHÔNG được lưu thẳng vào sheet mà tạo 1 mục "chờ
// duyệt" ở đây, đồng thời DM cho BOT_CREATOR_DISCORD_ID (config.js) kèm nội
// dung + 2 nút Đồng Ý/Từ Chối. Khi được Đồng Ý, tin mới thật sự được ghi
// vào sheet qua addNoticeBoardNotice() (googleSheets/noticeBoardSheet.js).
//
// Trang quản lý bot (Monaris Admin, mục "Tin chờ duyệt") cũng thao tác được y hệt
// qua HTTP (xem admin/api.js -> GET/POST /admin/notice/pending*), dùng
// CHUNG state + logic duyệt/từ chối với 2 nút Discord ở đây — bấm ở bên nào
// (web hay Discord) cũng đồng bộ, không xử lý trùng 2 lần vì mục chờ duyệt
// bị xoá khỏi Map ngay khi được xử lý xong (dù qua đường nào).
//
// LƯU Ý: hàng đợi chờ duyệt CHỈ lưu trong RAM (không lưu sheet) — nếu bot
// restart giữa lúc đang chờ, tin đó coi như mất (nút Discord cũ sẽ báo
// "không tìm thấy" nếu bấm lại), người gửi phải /addnotice lại từ đầu.
// Chấp nhận được vì đây chỉ là hàng đợi tạm thời trước khi lưu chính thức.
const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const client = require('../client');
const { BOT_CREATOR_DISCORD_ID } = require('../config');
const { addNoticeBoardNotice } = require('../googleSheets/noticeBoardSheet');

const NOTICE_APPROVE_BUTTON_PREFIX = 'noticeapprove_';
const NOTICE_REJECT_BUTTON_PREFIX = 'noticereject_';

// id (string, tự tăng) -> { id, content, submitterId, submitterTag,
//   createdAt (ms), dmChannelId, dmMessageId }
// dmChannelId/dmMessageId trỏ tới đúng tin DM kèm 2 nút đã gửi cho
// BOT_CREATOR_DISCORD_ID, để sửa/khoá lại nút sau khi xử lý xong (dù xử lý
// từ web hay từ chính nút đó).
const pendingNoticeApprovals = new Map();
let nextPendingId = 1;

function buildApprovalButtons(id, disabled = false) {
  const approveBtn = new ButtonBuilder()
    .setCustomId(`${NOTICE_APPROVE_BUTTON_PREFIX}${id}`)
    .setLabel('Đồng Ý')
    .setEmoji('✅')
    .setStyle(ButtonStyle.Success)
    .setDisabled(disabled);
  const rejectBtn = new ButtonBuilder()
    .setCustomId(`${NOTICE_REJECT_BUTTON_PREFIX}${id}`)
    .setLabel('Từ Chối')
    .setEmoji('❌')
    .setStyle(ButtonStyle.Danger)
    .setDisabled(disabled);
  return new ActionRowBuilder().addComponents(approveBtn, rejectBtn);
}

function buildApprovalContent(pending, statusLine) {
  let text =
    `📨 **Tin chờ duyệt cho Bảng Tin Monaris** (#${pending.id})\n` +
    `Người gửi: <@${pending.submitterId}> (${pending.submitterTag})\n` +
    `Nội dung:\n> ${pending.content}`;
  if (statusLine) text += `\n\n${statusLine}`;
  return text;
}

// Sửa lại tin DM đã gửi cho BOT_CREATOR_DISCORD_ID (nội dung mới nhất +
// trạng thái, khoá 2 nút nếu đã xử lý xong). Lỗi (DM bị xoá tay, bot mất
// quyền...) chỉ log lại, KHÔNG throw ra ngoài vì tin đã lưu/xử lý xong ở
// phía sheet rồi, không nên báo lỗi ngược chỉ vì sửa DM thất bại.
async function updateDmMessage(pending, statusLine, disabled = false) {
  if (!pending.dmChannelId || !pending.dmMessageId) return;
  try {
    const channel = await client.channels.fetch(pending.dmChannelId);
    const message = await channel.messages.fetch(pending.dmMessageId);
    await message.edit({
      content: buildApprovalContent(pending, statusLine),
      components: [buildApprovalButtons(pending.id, disabled)],
    });
  } catch (error) {
    console.error(`Không cập nhật được DM tin chờ duyệt #${pending.id}:`, error.message);
  }
}

// Báo lại cho người gửi gốc biết tin của họ đã được duyệt/từ chối — lỗi gửi
// DM (chặn DM, chưa từng chat với bot...) chỉ log lại, không throw ra ngoài.
async function notifySubmitterResolved(pending, approved) {
  if (!pending.submitterId) return;
  try {
    const user = await client.users.fetch(pending.submitterId);
    await user.send({
      content: approved
        ? `✅ Tin của bạn đã được duyệt và đã đăng vào Bảng Tin Monaris:\n> ${pending.content}`
        : `❌ Tin của bạn đã bị từ chối, không được đăng vào Bảng Tin Monaris:\n> ${pending.content}`,
      allowedMentions: { parse: [] },
    });
  } catch (error) {
    console.error(`Không gửi được DM báo kết quả duyệt tin cho người gửi (#${pending.id}):`, error.message);
  }
}

// Tạo 1 mục chờ duyệt mới + DM ngay cho BOT_CREATOR_DISCORD_ID kèm 2 nút.
// Dùng cho nhánh KHÔNG có role Bông trong /addnotice (xem slashCommands.js).
async function requestNoticeApproval({ content, submitterId, submitterTag }) {
  const trimmed = (content || '').trim();
  if (!trimmed) {
    throw new Error('Nội dung tin không được để trống.');
  }
  if (!BOT_CREATOR_DISCORD_ID) {
    throw new Error('Chưa cấu hình BOT_CREATOR_DISCORD_ID để nhận tin chờ duyệt.');
  }

  const id = String(nextPendingId++);
  const pending = {
    id,
    content: trimmed,
    submitterId,
    submitterTag: submitterTag || submitterId,
    createdAt: Date.now(),
    dmChannelId: null,
    dmMessageId: null,
  };
  pendingNoticeApprovals.set(id, pending);

  try {
    const creator = await client.users.fetch(BOT_CREATOR_DISCORD_ID);
    const dm = await creator.send({
      content: buildApprovalContent(pending),
      components: [buildApprovalButtons(id)],
      allowedMentions: { parse: [] },
    });
    pending.dmChannelId = dm.channelId;
    pending.dmMessageId = dm.id;
  } catch (error) {
    pendingNoticeApprovals.delete(id);
    throw new Error(`Không gửi được DM duyệt tin cho quản lý: ${error.message}`);
  }

  return pending;
}

// Dùng cho GET /admin/notice/pending (trang quản lý bot) — trả về mảng, tin
// gửi trước hiện trước.
function listPendingNoticeApprovals() {
  return Array.from(pendingNoticeApprovals.values()).sort((a, b) => a.createdAt - b.createdAt);
}

// Sửa nội dung 1 tin đang chờ (vd chỉnh chính tả, chèn emote server) trước
// khi Đồng Ý/Từ Chối — KHÔNG đổi người gửi gốc. Trả về null nếu không tìm
// thấy (đã xử lý xong hoặc bot đã restart).
function updatePendingNoticeApproval(id, content) {
  const pending = pendingNoticeApprovals.get(String(id));
  if (!pending) return null;
  pending.content = content;
  // Sửa lại DM tương ứng để đồng bộ — không chờ (fire-and-forget), lỗi đã
  // được log lại bên trong updateDmMessage().
  updateDmMessage(pending);
  return pending;
}

// Duyệt (approve=true) hoặc từ chối (approve=false) 1 tin đang chờ — dùng
// CHUNG cho cả nút Discord (handleNoticeApprovalButton) lẫn web
// (admin/api.js). Xoá khỏi hàng đợi ngay để tránh xử lý trùng 2 lần dù bấm
// từ đâu. Trả về { notice } khi approve=true (notice vừa lưu vào sheet).
async function resolvePendingNoticeApproval(id, approve) {
  const key = String(id);
  const pending = pendingNoticeApprovals.get(key);
  if (!pending) {
    throw new Error(`Không tìm thấy tin chờ duyệt #${key} (có thể đã được xử lý hoặc bot đã restart).`);
  }
  pendingNoticeApprovals.delete(key);

  if (approve) {
    const notice = await addNoticeBoardNotice(pending.content, pending.submitterId);
    await updateDmMessage(pending, `✅ Đã được duyệt — đã đăng vào Bảng Tin Monaris (#${notice.id}).`, true);
    await notifySubmitterResolved(pending, true);
    return { notice, pending };
  }

  await updateDmMessage(pending, '❌ Đã bị từ chối.', true);
  await notifySubmitterResolved(pending, false);
  return { notice: null, pending };
}

// Xử lý khi BOT_CREATOR_DISCORD_ID bấm 1 trong 2 nút Đồng Ý/Từ Chối trên DM
// (xem commands/slashCommands.js -> InteractionCreate).
async function handleNoticeApprovalButton(interaction) {
  const approve = interaction.customId.startsWith(NOTICE_APPROVE_BUTTON_PREFIX);
  const id = interaction.customId.slice(
    (approve ? NOTICE_APPROVE_BUTTON_PREFIX : NOTICE_REJECT_BUTTON_PREFIX).length
  );

  if (interaction.user.id !== BOT_CREATOR_DISCORD_ID) {
    await interaction.reply({ content: '❌ Bạn không có quyền duyệt tin này.', ephemeral: true });
    return;
  }

  if (!pendingNoticeApprovals.has(id)) {
    await interaction.reply({
      content: `⚠️ Tin #${id} đã được xử lý trước đó (có thể qua trang quản lý) hoặc bot đã restart.`,
      ephemeral: true,
    });
    return;
  }

  // deferUpdate() ack ngay interaction (tránh Discord báo "tương tác thất
  // bại" nếu resolvePendingNoticeApproval mất >3s) — nội dung/nút thật sự
  // được cập nhật ngay sau đó qua updateDmMessage() bên trong hàm đó.
  await interaction.deferUpdate();
  try {
    await resolvePendingNoticeApproval(id, approve);
  } catch (error) {
    console.error('Lỗi khi xử lý duyệt tin qua nút Discord:', error.message);
    await interaction.followUp({ content: `❌ ${error.message}`, ephemeral: true }).catch(() => {});
  }
}

module.exports = {
  requestNoticeApproval,
  handleNoticeApprovalButton,
  NOTICE_APPROVE_BUTTON_PREFIX,
  NOTICE_REJECT_BUTTON_PREFIX,
  listPendingNoticeApprovals,
  updatePendingNoticeApproval,
  resolvePendingNoticeApproval,
};
