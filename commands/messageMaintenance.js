// ===== Lệnh mon!: bảo trì dữ liệu =====
// mon!backup            — chạy sao lưu Sheet sang Drive ngay (xem backup/index.js)
// mon!backup info       — xem cấu hình + kết quả lượt gần nhất
// mon!kienthuc          — xem số mục + danh sách chủ đề của kho kiến thức AI (tab "Kiến thức bang")
// mon!kienthuc reload   — đọc lại tab ngay (khỏi chờ cache 5 phút)
// mon!kienthuc test <câu hỏi> — xem câu hỏi đó khớp mục nào (để chỉnh từ khoá)
// mon!spam [7|30]      — tổng kết người spam tin giống nhau (mặc định hôm nay; tab "Spam Chat")
// Chỉ role Bông hoặc ADMIN_USER_ID dùng được.

const { BONG_ROLE_ID, ADMIN_USER_ID, KNOWLEDGE_ENABLED, KNOWLEDGE_SHEET_NAME } = require('../config');
const { runBackup, getBackupInfo } = require('../backup');
const { getKnowledgeEntries, getKnowledgeCacheInfo } = require('../googleSheets/knowledgeSheet');
const { findMatchedEntries } = require('../AutoReply/knowledgeBlock');
const { buildSummary: buildSpamSummary } = require('../antiSpam');

function canUse(message) {
  
  return Boolean(message.member && message.member.roles && message.member.roles.cache.has(BONG_ROLE_ID));
}

function formatAgo(ms) {
  if (!ms) return 'chưa lần nào';
  const seconds = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (seconds < 90) return `${seconds} giây trước`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 90) return `${minutes} phút trước`;
  return `${Math.round(minutes / 60)} giờ trước`;
}

function formatBackupResult(result) {
  if (result.error && !result.results.length) return `❌ ${result.error}`;
  const ok = result.results.filter((r) => r.state === 'ok');
  const skipped = result.results.filter((r) => r.state === 'skipped');
  const errors = result.results.filter((r) => r.state === 'error');
  const lines = [
    `${errors.length ? '⚠️' : '✅'} Sao lưu ${result.date}: **${ok.length}** bản mới, ${skipped.length} đã có từ trước, **${errors.length}** lỗi` +
      `${result.deleted ? `, đã xoá ${result.deleted} bản quá hạn` : ''}.`,
  ];
  if (ok.length) lines.push(`Mới: ${ok.map((r) => r.name).join(', ')}`);
  errors.slice(0, 5).forEach((r) => lines.push(`❌ \`${r.id.slice(0, 8)}…\`: ${r.error}`));
  if (result.error) lines.push(`❌ ${result.error}`);
  return lines.join('\n').slice(0, 1900);
}

async function handleBackupCommand(message, args) {
  if (args[0] && args[0].toLowerCase() === 'info') {
    const info = getBackupInfo();
    const last = info.lastResult;
    await message.reply(
      [
        `💾 **Sao lưu Sheet → Drive**: ${info.enabled ? 'đang bật' : info.hasFolder ? 'đang tắt' : 'CHƯA cấu hình (thiếu BACKUP_DRIVE_FOLDER_ID)'}`,
        `Chạy hằng ngày lúc ${info.hourVn}h (giờ VN), giữ ${info.keepDays} ngày, ${info.spreadsheetCount} spreadsheet.`,
        last
          ? `Lượt gần nhất (${last.reason}, ${formatAgo(last.at)}): ${last.results.filter((r) => r.state === 'ok').length} bản mới, ${last.results.filter((r) => r.state === 'error').length} lỗi.`
          : 'Chưa có lượt nào kể từ lần khởi động này.',
      ].join('\n')
    );
    return;
  }

  const notice = await message.reply('⏳ Đang sao lưu các Sheet sang Drive, có thể mất vài phút...');
  const result = await runBackup({ reason: `mon!backup bởi ${message.author.username}` });
  await notice.edit(formatBackupResult(result)).catch(() => message.reply(formatBackupResult(result)));
}

async function handleKnowledgeCommand(message, args) {
  if (!KNOWLEDGE_ENABLED) {
    await message.reply('Kho kiến thức đang tắt (KNOWLEDGE_ENABLED=false).');
    return;
  }

  const sub = (args[0] || '').toLowerCase();

  if (sub === 'test') {
    const question = args.slice(1).join(' ').trim();
    if (!question) {
      await message.reply('Format: `mon!kienthuc test <câu hỏi>`');
      return;
    }
    const matched = await findMatchedEntries(question);
    if (!matched.length) {
      await message.reply('Không mục nào khớp từ khoá → AI sẽ trả lời "chưa có thông tin" (hoặc nhận hết kho nếu kho nhỏ). Thêm từ khoá ở cột B.');
      return;
    }
    const lines = matched.slice(0, 10).map((m) => `• **${m.entry.topic}** (dòng ${m.entry.row}, điểm ${m.score})`);
    await message.reply(`Câu hỏi khớp ${matched.length} mục:\n${lines.join('\n')}`.slice(0, 1900));
    return;
  }

  const entries = await getKnowledgeEntries({ force: sub === 'reload' });
  const info = getKnowledgeCacheInfo();
  const header =
    `📚 **Kho kiến thức** (tab "${KNOWLEDGE_SHEET_NAME}"): **${entries.length}** mục đang bật` +
    `${sub === 'reload' ? ' — đã đọc lại từ Sheet' : ''}, cập nhật ${formatAgo(info.loadedAt)}` +
    `${info.ok ? '' : ' ⚠️ lần đọc gần nhất bị lỗi, đang dùng bản cũ'}.`;

  if (!entries.length) {
    await message.reply(`${header}\nChưa có mục nào — điền vào tab, cột A chủ đề, B từ khoá, C nội dung.`);
    return;
  }

  const list = entries.map((e) => `${e.topic}${e.version ? ` (${e.version})` : ''}`).join(' • ');
  await message.reply(`${header}\n${list}`.slice(0, 1900));
}

// Trả về true nếu tin nhắn đã được xử lý ở nhóm lệnh này.
async function handleMaintenanceMessageCommands(message, content) {
  const parts = content.trim().split(/\s+/);
  const command = (parts[0] || '').toLowerCase();
  if (command !== 'mon!backup' && command !== 'mon!kienthuc' && command !== 'mon!spam') return false;

  if (!canUse(message)) {
    await message.reply('❌ Bạn không có quyền sử dụng lệnh này. Cần role Bông.');
    return true;
  }

  try {
    if (command === 'mon!backup') await handleBackupCommand(message, parts.slice(1));
    else if (command === 'mon!spam') {
      const days = Math.min(90, Math.max(1, parseInt(parts[1], 10) || 1));
      await message.reply({ content: await buildSpamSummary(days), allowedMentions: { parse: [] } });
    }
    else await handleKnowledgeCommand(message, parts.slice(1));
  } catch (error) {
    console.error(`[${command}] Lỗi:`, error.message);
    await message.reply('Có lỗi xảy ra, xem log để biết chi tiết.').catch(() => {});
  }
  return true;
}

module.exports = { handleMaintenanceMessageCommands };
