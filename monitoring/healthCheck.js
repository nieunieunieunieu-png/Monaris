// ===== monitoring/healthCheck.js — Kiểm tra sức khỏe tự động hằng ngày =====
// Mỗi ngày (giờ ở config/healthCheck.js) bot: (1) thử đọc các tab Google Sheet quan trọng, (2) hỏi Cloudinary còn dung lượng/credit,
// (3) gọi thử Gemini từng model xem còn quota/key còn sống, rồi gửi 1 embed vào kênh admin. Có lỗi thì ping ADMIN_USER_ID.
// Mục tiêu: phát hiện lỗi TRƯỚC khi thành viên gặp. Mỗi kiểm tra có timeout riêng, 1 mục hỏng không làm các mục khác dừng.
const { EmbedBuilder, SlashCommandBuilder, Events } = require('discord.js');
const client = require('../client');
const { google } = require('../googleSheets/googleClient');
const { getGoogleAuthClient } = require('../googleSheets/auth');
const { getVnNow, getDateKey } = require('../utils/time');
const { recordSheetOk, recordSheetError } = require('./status');
const cfg = require('../config');

const {
  ADMIN_USER_ID, BONG_ROLE_ID, GEMINI_API_KEY, GEMINI_MODELS,
  CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET,
  HEALTH_CHECK_CHANNEL_ID, HEALTH_CHECK_AUTO, HEALTH_CHECK_HOUR, HEALTH_CHECK_MINUTE, HEALTH_CHECK_ONLY_PROBLEMS,
  CLOUDINARY_WARN_PERCENT, CLOUDINARY_FAIL_PERCENT,
} = cfg;

const OK = '🟢';
const WARN = '🟡';
const FAIL = '🔴';
const RANK = { [OK]: 0, [WARN]: 1, [FAIL]: 2 };
const worst = (items) => items.reduce((w, i) => (RANK[i.level] > RANK[w] ? i.level : w), OK);
const errMsg = (e) => String((e && e.message) || e || 'lỗi không rõ').replace(/\s+/g, ' ').slice(0, 140);

function withTimeout(promise, ms, label) {
  let t;
  const timeout = new Promise((_, rej) => { t = setTimeout(() => rej(new Error(`${label}: quá ${ms / 1000}s không phản hồi`)), ms); });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

// Các spreadsheet + tab quan trọng. Tên lấy từ config; mục nào chưa có ID/tên (ENV thiếu) sẽ bị bỏ qua khỏi danh sách.
function buildSheetTargets() {
  const t = [
    { label: 'Sheet chính (vote/state)', id: cfg.SPREADSHEET_ID, tabs: [cfg.SHEET_NAME, cfg.RESULT_SHEET_NAME, cfg.BC_SHEET_NAME, cfg.STATE_SHEET_NAME] },
    // Tab "Hồ Sơ Cá Nhân" nằm trong spreadsheet Kho ảnh (googleSheets/profileSheet.js), không phải sheet chính.
    { label: 'Sheet nguồn (Bang)', id: cfg.SRC_IMAGE_SPREADSHEET_ID, tabs: [cfg.BANG_SHEET_NAME, cfg.UPDATE_PROFILE_SHEET_NAME] },
    { label: 'Sheet chat/ChatGlobal', id: cfg.BOT_CHAT_HISTORY_SPREADSHEET_ID, tabs: [cfg.CHAT_GLOBAL_SHEET_NAME, cfg.ACCESS_ID_SHEET_NAME, cfg.KNOWLEDGE_SHEET_NAME] },
    { label: 'Sheet Level', id: cfg.LEVEL_SPREADSHEET_ID, tabs: [cfg.LEVEL_SHEET_NAME, cfg.LEVEL_CONFIG_SHEET_NAME, cfg.LEVEL_TABLE_SHEET_NAME] },
    { label: 'Sheet Thí Kiếm', id: cfg.THIKIEM_SPREADSHEET_ID, tabs: [cfg.THIKIEM_RANK_SHEET_NAME, cfg.THIKIEM_CONFIG_SHEET_NAME] },
    { label: 'Sheet Check Gear', id: cfg.CHECK_GEAR_SPREADSHEET_ID, tabs: [] }, // tab cũ "NTH _ Check Gear" đã được đổi tên "(cũ - đã chuyển)"; tab theo phiên bản tạo động -> chỉ kiểm tra mở được file
    { label: 'Sheet Bang Chiến Stat', id: cfg.BCSTAT_SPREADSHEET_ID, tabs: [cfg.BCSTAT_SUMMARY_SHEET_NAME] },
    { label: 'Sheet Kho ảnh', id: cfg.NM_IMAGE_SPREADSHEET_ID, tabs: [cfg.NM_IMAGE_SHEET_NAME, cfg.PROFILE_SHEET_NAME] },
  ];
  // Gộp các mục trùng spreadsheet ID (nhiều cấu hình trỏ cùng 1 file) để chỉ gọi API 1 lần.
  const merged = new Map();
  for (const x of t) {
    if (!x.id) continue;
    const tabs = x.tabs.filter(Boolean);
    if (!merged.has(x.id)) merged.set(x.id, { label: x.label, id: x.id, tabs: new Set(tabs) });
    else tabs.forEach((n) => merged.get(x.id).tabs.add(n));
  }
  return [...merged.values()].map((m) => ({ ...m, tabs: [...m.tabs] }));
}

// Với mỗi spreadsheet: lấy danh sách tab (xác nhận file còn truy cập được + tab chưa bị đổi tên/xoá) rồi đọc thử ô A1:A2 từng tab.
async function checkSheets() {
  const items = [];
  const auth = await getGoogleAuthClient().catch(() => null);
  if (!auth) return [{ level: FAIL, text: 'Không đăng nhập được Google (kiểm tra GOOGLE_SERVICE_ACCOUNT_BASE64).' }];
  const sheets = google.sheets({ version: 'v4', auth });
  const targets = buildSheetTargets();
  if (!process.env.GOOGLE_SHEET_ID) items.push({ level: WARN, text: 'Chưa đặt GOOGLE_SHEET_ID — bỏ qua Sheet chính.' });

  await Promise.all(targets.map(async (tg) => {
    try {
      const meta = await withTimeout(sheets.spreadsheets.get({ spreadsheetId: tg.id, fields: 'sheets.properties.title' }), 20000, tg.label);
      const have = new Set((meta.data.sheets || []).map((s) => s.properties.title));
      const missing = tg.tabs.filter((n) => !have.has(n));
      const present = tg.tabs.filter((n) => have.has(n));
      let unreadable = [];
      if (present.length) {
        try {
          await withTimeout(sheets.spreadsheets.values.batchGet({ spreadsheetId: tg.id, ranges: present.map((n) => `'${n.replace(/'/g, "''")}'!A1:A2`) }), 20000, tg.label);
        } catch (e) {
          unreadable = present; // batchGet lỗi cả lô -> báo chung (kèm lý do)
          items.push({ level: FAIL, text: `**${tg.label}**: có tab nhưng đọc lỗi — ${errMsg(e)}` });
        }
      }
      if (missing.length) {
        items.push({ level: FAIL, text: `**${tg.label}**: thiếu tab ${missing.map((n) => `\`${n}\``).join(', ')}` });
        recordSheetError(`healthcheck:${tg.label}`, `thiếu tab ${missing.join(', ')}`);
      } else if (!unreadable.length) {
        items.push({ level: OK, text: tg.tabs.length ? `**${tg.label}**: đọc được ${present.length}/${tg.tabs.length} tab` : `**${tg.label}**: mở được file` });
        recordSheetOk(`healthcheck:${tg.label}`);
      }
    } catch (e) {
      items.push({ level: FAIL, text: `**${tg.label}**: không mở được file — ${errMsg(e)}` });
      recordSheetError(`healthcheck:${tg.label}`, e);
    }
  }));
  if (!targets.length) items.push({ level: WARN, text: 'Không có Sheet nào được cấu hình để kiểm tra.' });
  return items.sort((a, b) => RANK[b.level] - RANK[a.level]);
}

// Cloudinary: GET /usage (Admin API, Basic auth). Trả về credit/storage đã dùng %; field khác nhau tuỳ loại gói nên đọc dè dặt.
async function checkCloudinary() {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return [{ level: WARN, text: 'Chưa cấu hình Cloudinary (CLOUDINARY_* ) — ảnh hồ sơ/kho ảnh sẽ không tải lên được.' }];
  }
  try {
    const basic = Buffer.from(`${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}`).toString('base64');
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/usage`, { headers: { Authorization: `Basic ${basic}` }, signal: AbortSignal.timeout(20000) });
    if (res.status === 401 || res.status === 403) return [{ level: FAIL, text: `Cloudinary từ chối khoá API (HTTP ${res.status}) — kiểm tra CLOUDINARY_API_KEY/SECRET.` }];
    if (!res.ok) return [{ level: FAIL, text: `Cloudinary trả lỗi HTTP ${res.status}.` }];
    const d = await res.json();
    const items = [];
    const pct = (o) => {
      if (!o) return null;
      if (Number.isFinite(Number(o.used_percent))) return Number(o.used_percent);
      if (Number.isFinite(Number(o.usage)) && Number(o.limit) > 0) return (Number(o.usage) / Number(o.limit)) * 100;
      return null;
    };
    const rows = [['Credit', pct(d.credits)], ['Lưu trữ', pct(d.storage)], ['Băng thông', pct(d.bandwidth)], ['Biến đổi ảnh', pct(d.transformations)]].filter(([, p]) => p !== null);
    if (!rows.length) return [{ level: OK, text: `Cloudinary kết nối được (gói ${d.plan || '?'}), không có số liệu % để so ngưỡng.` }];
    const level = (p) => (p >= CLOUDINARY_FAIL_PERCENT ? FAIL : p >= CLOUDINARY_WARN_PERCENT ? WARN : OK);
    const lines = rows.map(([n, p]) => `${level(p)} ${n} **${p.toFixed(1)}%**`).join(' · ');
    items.push({ level: worst(rows.map(([, p]) => ({ level: level(p) }))), text: `Gói **${d.plan || '?'}** — ${lines}` });
    return items;
  } catch (e) {
    return [{ level: FAIL, text: `Không gọi được Cloudinary — ${errMsg(e)}` }];
  }
}

// Gemini không có API "xem quota còn lại", nên gọi thử 1 request siêu nhỏ cho từng model: 429 = hết quota, 400/403 = key hỏng.
async function checkGemini() {
  if (!GEMINI_API_KEY) return [{ level: FAIL, text: 'Chưa đặt GEMINI_API_KEY — AI không trả lời được.' }];
  const models = GEMINI_MODELS || [];
  if (!models.length) return [{ level: WARN, text: 'GEMINI_MODELS rỗng.' }];
  const results = await Promise.all(models.map(async (model) => {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'ping' }] }], generationConfig: { maxOutputTokens: 8 } }),
        signal: AbortSignal.timeout(25000),
      });
      if (res.ok) return { model, level: OK, text: `\`${model}\`: còn quota, phản hồi bình thường` };
      if (res.status === 429) return { model, level: FAIL, text: `\`${model}\`: **HẾT QUOTA** (429)` };
      if (res.status === 400 || res.status === 401 || res.status === 403) return { model, level: FAIL, text: `\`${model}\`: key/model bị từ chối (HTTP ${res.status})` };
      if (res.status === 404) return { model, level: FAIL, text: `\`${model}\`: model không tồn tại (404) — kiểm tra GEMINI_MODEL` };
      return { model, level: WARN, text: `\`${model}\`: Google lỗi tạm (HTTP ${res.status})` };
    } catch (e) {
      return { model, level: WARN, text: `\`${model}\`: không gọi được — ${errMsg(e)}` };
    }
  }));
  // Nếu TẤT CẢ model đều hết quota thì bot AI tê liệt hoàn toàn; còn dự phòng thì chỉ cảnh báo vàng cho model hết quota.
  const allDead = results.every((r) => r.level === FAIL);
  return results.map((r) => ({ ...r, level: r.level === FAIL && !allDead && r.text.includes('429') ? WARN : r.level }));
}

async function runHealthCheck() {
  const startedAt = Date.now();
  const [sheetsRes, cloudRes, geminiRes] = await Promise.all([
    checkSheets().catch((e) => [{ level: FAIL, text: `Lỗi khi kiểm tra Sheet — ${errMsg(e)}` }]),
    checkCloudinary(),
    checkGemini(),
  ]);
  const sections = [
    { name: '📑 Google Sheet', items: sheetsRes },
    { name: '☁️ Cloudinary', items: cloudRes },
    { name: '🤖 Gemini AI', items: geminiRes },
  ];
  const overall = worst(sections.flatMap((s) => s.items));
  return { sections, overall, tookMs: Date.now() - startedAt };
}

function buildEmbed(report) {
  const color = report.overall === FAIL ? 0xed4245 : report.overall === WARN ? 0xfee75c : 0x57f287;
  const title = report.overall === FAIL ? '🔴 Kiểm tra sức khỏe: CÓ LỖI' : report.overall === WARN ? '🟡 Kiểm tra sức khỏe: cần chú ý' : '🟢 Kiểm tra sức khỏe: mọi thứ ổn';
  const e = new EmbedBuilder().setTitle(title).setColor(color).setTimestamp(new Date())
    .setFooter({ text: `Mất ${(report.tookMs / 1000).toFixed(1)}s · ${client.ws ? Math.round(client.ws.ping) : '?'}ms ping Discord` });
  for (const s of report.sections) {
    const lines = s.items.map((i) => `${i.level} ${i.text}`);
    let value = lines.join('\n');
    if (value.length > 1024) value = `${value.slice(0, 1000)}\n…(còn nữa)`;
    e.addFields({ name: `${worst(s.items)} ${s.name}`, value: value || 'Không có dữ liệu' });
  }
  return e;
}

async function sendDailyReport({ force = false } = {}) {
  if (!HEALTH_CHECK_CHANNEL_ID) return null;
  try {
    const report = await runHealthCheck();
    if (report.overall === OK && HEALTH_CHECK_ONLY_PROBLEMS && !force) {
      console.log('[healthcheck] Mọi thứ ổn, không gửi báo cáo (HEALTH_CHECK_ONLY_PROBLEMS=on).');
      return report;
    }
    const channel = await client.channels.fetch(HEALTH_CHECK_CHANNEL_ID);
    const ping = report.overall === FAIL && ADMIN_USER_ID ? `<@${ADMIN_USER_ID}> phát hiện lỗi:` : undefined;
    await channel.send({ content: ping, embeds: [buildEmbed(report)], allowedMentions: { users: ping ? [ADMIN_USER_ID] : [] } });
    console.log(`[healthcheck] Đã gửi báo cáo (${report.overall}).`);
    return report;
  } catch (e) {
    console.error('[healthcheck] Không gửi được báo cáo:', e.message);
    return null;
  }
}

let lastRunKey = null;
function checkHealthSchedule() {
  if (!HEALTH_CHECK_AUTO || !HEALTH_CHECK_CHANNEL_ID) return;
  const now = getVnNow();
  const key = getDateKey(now);
  if (now.getHours() === HEALTH_CHECK_HOUR && now.getMinutes() === HEALTH_CHECK_MINUTE && lastRunKey !== key) {
    lastRunKey = key;
    sendDailyReport().catch((e) => console.error('[healthcheck]', e.message));
  }
}

function startHealthCheck() {
  if (!HEALTH_CHECK_CHANNEL_ID) {
    console.warn('[healthcheck] Chưa đặt HEALTH_CHECK_CHANNEL_ID — tắt kiểm tra sức khỏe tự động.');
    return;
  }
  setInterval(checkHealthSchedule, 60 * 1000);
  console.log(`[healthcheck] Bật: mỗi ngày ${String(HEALTH_CHECK_HOUR).padStart(2, '0')}:${String(HEALTH_CHECK_MINUTE).padStart(2, '0')} (giờ VN) -> kênh ${HEALTH_CHECK_CHANNEL_ID}.`);
}

// /healthcheck — Bông/admin chạy thử ngay (kết quả chỉ mình người gọi thấy, KHÔNG gửi vào kênh admin).
const HEALTH_SLASH_COMMANDS = [new SlashCommandBuilder().setName('healthcheck').setDescription('(Bông) Chạy kiểm tra sức khỏe ngay: Sheet, Cloudinary, Gemini')];

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'healthcheck') return;
    const allowed = (interaction.member && interaction.member.roles && interaction.member.roles.cache.has(BONG_ROLE_ID));
    if (!allowed) return void (await interaction.reply({ content: '❌ Chỉ Bông mới dùng được lệnh này.', ephemeral: true }));
    await interaction.deferReply({ ephemeral: true });
    const report = await runHealthCheck();
    await interaction.editReply({ embeds: [buildEmbed(report)] });
  } catch (error) {
    console.error('[healthcheck] Lỗi /healthcheck:', error.message);
    if (interaction.deferred || interaction.replied) interaction.editReply({ content: `❌ Lỗi: ${errMsg(error)}` }).catch(() => {});
  }
});

module.exports = { startHealthCheck, runHealthCheck, sendDailyReport, HEALTH_SLASH_COMMANDS };
