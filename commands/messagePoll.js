// ===== Lệnh mon!: đọc poll (khảo sát gốc của Discord) =====
// mon!poll <ID tin nhắn | link tin nhắn>  — lấy ID + Ingame + Hệ phái người đã bình chọn theo TỪNG đáp án.
//   - Gõ trong kênh có poll thì chỉ cần ID tin; poll ở kênh khác thì dán link tin nhắn.
//   - Hoặc reply thẳng vào tin poll rồi gõ `mon!poll`.
// Ingame/Hệ phái tra như mon!ai, rồi LƯU vào Google Sheet (mỗi poll 1 tab, tên tab = tiêu đề poll, xem config/poll.js) để lọc/tìm.
// Trong chat chỉ báo "đã lấy xong", không in danh sách.
// Chỉ role Bông dùng được. Không ping ai.

const { BONG_ROLE_ID } = require('../config');
const { getMemberIngameInfo } = require('../googleSheets/updateProfileSheet');
const { savePollRows } = require('../googleSheets/pollSheet');

function canUse(message) {
  return Boolean(message.member && message.member.roles && message.member.roles.cache.has(BONG_ROLE_ID));
}

const NO_PING = { parse: [], repliedUser: false };
const USAGE = 'Cú pháp: `mon!poll <ID tin nhắn>` (poll ở kênh khác: dán link tin nhắn) — hoặc reply vào tin poll rồi gõ `mon!poll`.';

// Lấy tất cả người bình chọn của 1 đáp án (Discord trả tối đa 100/lần -> phân trang bằng `after`).
async function fetchAllVoters(answer) {
  const ids = [];
  let after;
  for (let i = 0; i < 200; i++) {
    const batch = await answer.fetchVoters({ limit: 100, after });
    if (!batch.size) break;
    for (const user of batch.values()) ids.push(user.id);
    if (batch.size < 100) break;
    after = batch.last().id;
  }
  return ids;
}

async function resolveTargetMessage(message, arg) {
  // 1) link tin nhắn: https://discord.com/channels/<guild>/<channel>/<message>
  const link = /channels\/(\d+)\/(\d+)\/(\d+)/.exec(arg || '');
  if (link) {
    if (message.guild && link[1] !== message.guild.id) return { error: 'Link này thuộc server khác.' };
    const channel = await message.client.channels.fetch(link[2]).catch(() => null);
    if (!channel || !channel.messages) return { error: 'Không thấy kênh trong link (bot thiếu quyền xem kênh?).' };
    const found = await channel.messages.fetch(link[3]).catch(() => null);
    return found ? { msg: found } : { error: 'Không tìm thấy tin nhắn trong link.' };
  }
  // 2) ID thuần: tìm ở kênh đang gõ lệnh
  if (/^\d{15,22}$/.test(arg || '')) {
    const found = await message.channel.messages.fetch(arg).catch(() => null);
    return found ? { msg: found } : { error: 'Không tìm thấy tin nhắn ở kênh này. Poll ở kênh khác thì dán **link** tin nhắn.' };
  }
  // 3) reply vào tin poll
  if (!arg && message.reference?.messageId) {
    const found = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
    return found ? { msg: found } : { error: 'Không đọc được tin bạn đang reply.' };
  }
  return { error: USAGE };
}

async function handlePollMessageCommands(message, content) {
  const m = /^mon!poll(?:\s+(\S+))?\s*$/i.exec(content);
  if (!m) return false;

  try {
    if (!canUse(message)) {
      await message.reply({ content: 'Lệnh này chỉ dành cho Bông.', allowedMentions: NO_PING });
      return true;
    }

    const { msg, error } = await resolveTargetMessage(message, m[1]);
    if (error) {
      await message.reply({ content: error, allowedMentions: NO_PING });
      return true;
    }
    if (!msg.poll) {
      await message.reply({ content: 'Tin nhắn này không có poll.', allowedMentions: NO_PING });
      return true;
    }

    const poll = msg.poll;
    const question = (poll.question?.text || '').trim() || `Poll ${msg.id}`;
    const answers = [...poll.answers.values()];

    const sheetRows = [];
    const infoCache = new Map();
    const lookup = async (id) => {
      if (infoCache.has(id)) return infoCache.get(id);
      const info = { displayName: '', ingame: '', className: '' };
      try {
        const member = message.guild ? await message.guild.members.fetch(id).catch(() => null) : null;
        info.displayName = member?.displayName || member?.user?.username || '';
        const ig = await getMemberIngameInfo(id);
        if (ig) { info.ingame = ig.ingame || ''; info.className = ig.className || ''; }
      } catch (_) { /* thiếu thông tin thì để trống */ }
      infoCache.set(id, info);
      return info;
    };

    for (const answer of answers) {
      const ids = await fetchAllVoters(answer);
      const label = answer.text || `Đáp án ${answer.id}`;
      for (const id of ids) {
        sheetRows.push({ answer: label, discordId: id, ...(await lookup(id)) });
      }
    }

    let text;
    try {
      await savePollRows({ pollMessageId: msg.id, question, rows: sheetRows });
      text = `✅ Đã lấy xong danh sách poll **${question}** (${sheetRows.length} lượt chọn) và lưu vào Google Sheet.`;
    } catch (e) {
      console.error('[poll] Lỗi lưu Sheet:', e.message);
      text = `⚠️ Đã đọc poll nhưng chưa lưu được vào Google Sheet: ${e.message}`.slice(0, 400);
    }

    await message.reply({ content: text, allowedMentions: NO_PING });
  } catch (error) {
    console.error('[poll] Lỗi mon!poll:', error.message);
    try {
      await message.reply({ content: `Lỗi khi đọc poll: ${error.message}`.slice(0, 500), allowedMentions: NO_PING });
    } catch (_) { /* bỏ qua */ }
  }
  return true;
}

module.exports = { handlePollMessageCommands };
