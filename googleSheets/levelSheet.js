// ===== googleSheets/levelSheet.js — Google Sheet của hệ thống Level/EXP =====
// Spreadsheet LEVEL_SPREADSHEET_ID có 3 tab (xem config/level.js):
//
//  "Level" — 1 dòng / 1 thành viên, cột A..:
//     A Discord ID | B Tên | C EXP | D Cấp | [1 cột đếm / hoạt động, theo thứ tự LEVEL_ACTIVITIES] |
//     Tổng Lượt (tổng số lần hành vi, KHÔNG tính phút voice) | Hoạt Động Cuối (giờ VN) |
//     EXP Tuần (EXP của tuần hiện tại) | Tuần (ngày Thứ Hai đầu tuần, giờ VN — khác tuần hiện tại thì EXP Tuần được reset về 0 lúc flush) |
//     Ngày HĐ Cuối (ngày có EXP gần nhất, giờ VN) | Chuỗi Ngày (số ngày liên tiếp) | Mốc Tuần ("<khoá tuần>|<mã1>,<mã2>" — thưởng 1 lần/tuần đã nhận) |
//     rồi đến cột đếm của các hoạt động mới (activity có appended:true trong config/level.js) — luôn ở CUỐI để không lệch cột cũ |
//     Chuỗi Dài Nhất (kỷ lục chuỗi ngày; cột CUỐI CÙNG — thêm activity appended mới sau này thì phải tính lại vị trí cột này)
//  "Cấu Hình EXP" — A Mã | B Hoạt động | C EXP | D Cooldown (giây) | E Ghi chú
//  "Bảng Cấp Độ"  — A Cấp | B EXP cần để lên cấp này (từ cấp trước) | C Tổng EXP để đạt cấp này
//  "Role Cấp Độ"  — A Cấp (mốc) | B Role ID Discord | C Ghi chú   (đạt mốc -> bot gắn role; B để trống = bỏ qua mốc)
//
// Ghi dữ liệu theo kiểu ĐỌC-CỘNG-GHI (đọc cả tab, cộng phần EXP/lượt mới gom được, ghi lại đúng các dòng
// đổi) nên sửa tay trên sheet không bị bot ghi đè mất. Chỉ bot dùng hàm applyDeltas — gọi tuần tự
// (level/index.js giữ khoá), không gọi song song.
const { google } = require('./googleClient');
const { getGoogleAuthClient } = require('./auth');
const { weekKey } = require('../level/week');
const {
  LEVEL_SPREADSHEET_ID,
  LEVEL_SHEET_NAME,
  LEVEL_CONFIG_SHEET_NAME,
  LEVEL_TABLE_SHEET_NAME,
  LEVEL_ROLE_SHEET_NAME,
  LEVEL_ACTIVITIES,
  LEVEL_EXTRA_CONFIG_ROWS,
  LEVEL_MAX_LEVEL,
} = require('../config');

const FIXED_COLS = 4; // A..D
const COL_EXP = 2;
const COL_LEVEL = 3;
// Hoạt động cũ giữ nguyên vị trí cột; hoạt động mới (appended) xếp sau cùng.
const LEGACY_ACTIVITIES = LEVEL_ACTIVITIES.filter((a) => !a.appended);
const APPENDED_ACTIVITIES = LEVEL_ACTIVITIES.filter((a) => a.appended);
const COL_TOTAL = FIXED_COLS + LEGACY_ACTIVITIES.length;
const COL_LAST = COL_TOTAL + 1;
const COL_WEEK_EXP = COL_LAST + 1; // các cột dưới đây đều THÊM Ở CUỐI (không đụng cột cũ)
const COL_WEEK = COL_WEEK_EXP + 1;
const COL_STREAK_DAY = COL_WEEK + 1;
const COL_STREAK = COL_STREAK_DAY + 1;
const COL_FLAGS = COL_STREAK + 1;
const COL_APPENDED_START = COL_FLAGS + 1;
const COL_BEST_STREAK = COL_APPENDED_START + APPENDED_ACTIVITIES.length; // kỷ lục chuỗi ngày: thêm SAU CÙNG để không lệch cột của sheet đang chạy
const COL_POINTS = COL_BEST_STREAK + 1; // 'Điểm HĐ': điểm hoạt động tích RIÊNG (1-1 với EXP kiếm được; /expadd /expset mặc định không đổi). Cột CUỐI.
const TOTAL_COLS = COL_POINTS + 1;
const ACT_COL = {};
LEGACY_ACTIVITIES.forEach((a, i) => {
  ACT_COL[a.key] = FIXED_COLS + i;
});
APPENDED_ACTIVITIES.forEach((a, i) => {
  ACT_COL[a.key] = COL_APPENDED_START + i;
});
const VOICE_KEY = 'voice';

const MEMBER_HEADER = [
  'Discord ID',
  'Tên',
  'EXP',
  'Cấp',
  ...LEGACY_ACTIVITIES.map((a) => a.column),
  'Tổng Lượt',
  'Hoạt Động Cuối',
  'EXP Tuần',
  'Tuần',
  'Ngày HĐ Cuối',
  'Chuỗi Ngày',
  'Mốc Tuần',
  ...APPENDED_ACTIVITIES.map((a) => a.column),
  'Chuỗi Dài Nhất',
  'Điểm HĐ',
];
// F..J: dùng cho các dòng event_* (hệ số sự kiện) — xem level/events.js
const CONFIG_HEADER = ['Mã', 'Hoạt động', 'EXP', 'Cooldown (giây)', 'Ghi chú', 'Hệ số', 'Thứ áp dụng', 'Từ ngày', 'Đến ngày', 'Áp dụng cho'];
const TABLE_HEADER = ['Cấp', 'EXP cần để lên cấp này (từ cấp trước)', 'Tổng EXP để đạt cấp này'];
const ROLE_HEADER = ['Cấp', 'Role ID', 'Ghi chú'];
// Mốc mẫu điền sẵn khi tab Role Cấp Độ còn trống (Role ID để trống — người dùng tự điền).
const ROLE_SAMPLE_LEVELS = [5, 10, 20, 30, 50];

function colLetter(index) {
  let n = index + 1;
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}
const LAST_COL_LETTER = colLetter(TOTAL_COLS - 1);

async function getSheetsClient() {
  const auth = await getGoogleAuthClient();
  if (!auth) throw new Error('Chưa cấu hình Google Sheets credentials cho bot.');
  return google.sheets({ version: 'v4', auth });
}

function vnTimeString(ms = Date.now()) {
  const d = new Date(ms + 7 * 60 * 60 * 1000);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

// Tạo tab nếu chưa có. Riêng tab "Level": nếu chưa có mà tab đầu tiên (gid=0) của file đang TRỐNG
// hoàn toàn (người dùng mới tạo file) thì đổi tên chính tab đó thành "Level" thay vì thêm tab mới.
async function ensureTab(sheets, title, { reuseEmptyFirstTab = false } = {}) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: LEVEL_SPREADSHEET_ID });
  const tabs = meta.data.sheets || [];
  if (tabs.some((s) => s.properties.title === title)) return;

  if (reuseEmptyFirstTab) {
    const first = tabs.find((s) => s.properties.sheetId === 0) || tabs[0];
    if (first && !Object.values({ LEVEL_CONFIG_SHEET_NAME, LEVEL_TABLE_SHEET_NAME }).includes(first.properties.title)) {
      const probe = await sheets.spreadsheets.values.get({
        spreadsheetId: LEVEL_SPREADSHEET_ID,
        range: `'${first.properties.title}'!A1:C3`,
      });
      const isEmpty = !(probe.data.values || []).some((row) => row.some((cell) => String(cell || '').trim()));
      if (isEmpty) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: LEVEL_SPREADSHEET_ID,
          resource: {
            requests: [{ updateSheetProperties: { properties: { sheetId: first.properties.sheetId, title }, fields: 'title' } }],
          },
        });
        return;
      }
    }
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: LEVEL_SPREADSHEET_ID,
    resource: { requests: [{ addSheet: { properties: { title } } }] },
  });
}

async function writeHeaderIfDifferent(sheets, title, header) {
  const endCol = colLetter(header.length - 1);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: LEVEL_SPREADSHEET_ID,
    range: `'${title}'!A1:${endCol}1`,
  });
  const current = (res.data.values || [])[0] || [];
  const same = header.length === current.length && header.every((h, i) => String(current[i] || '') === h);
  if (same) return;
  await sheets.spreadsheets.values.update({
    spreadsheetId: LEVEL_SPREADSHEET_ID,
    range: `'${title}'!A1:${endCol}1`,
    valueInputOption: 'RAW',
    resource: { values: [header] },
  });
}

// Gọi 1 lần lúc khởi động: tạo đủ 3 tab + tiêu đề, điền sẵn "Cấu Hình EXP" (mã nào thiếu thì thêm
// vào cuối, không đụng dòng đã có) và "Bảng Cấp Độ" (chỉ điền khi tab còn trống).
async function ensureLevelSheets({ defaultCosts }) {
  if (!LEVEL_SPREADSHEET_ID) return;
  const sheets = await getSheetsClient();

  await ensureTab(sheets, LEVEL_SHEET_NAME, { reuseEmptyFirstTab: true });
  await ensureTab(sheets, LEVEL_CONFIG_SHEET_NAME);
  await ensureTab(sheets, LEVEL_TABLE_SHEET_NAME);
  await ensureTab(sheets, LEVEL_ROLE_SHEET_NAME);

  await writeHeaderIfDifferent(sheets, LEVEL_SHEET_NAME, MEMBER_HEADER);
  await writeHeaderIfDifferent(sheets, LEVEL_CONFIG_SHEET_NAME, CONFIG_HEADER);
  await writeHeaderIfDifferent(sheets, LEVEL_TABLE_SHEET_NAME, TABLE_HEADER);
  await writeHeaderIfDifferent(sheets, LEVEL_ROLE_SHEET_NAME, ROLE_HEADER);

  // --- Cấu Hình EXP: thêm mã còn thiếu ---
  const cfg = await sheets.spreadsheets.values.get({
    spreadsheetId: LEVEL_SPREADSHEET_ID,
    range: `'${LEVEL_CONFIG_SHEET_NAME}'!A2:E`,
  });
  const have = new Set((cfg.data.values || []).map((r) => String(r[0] || '').trim()).filter(Boolean));
  const missing = [
    ...LEVEL_ACTIVITIES.filter((a) => !have.has(a.key)).map((a) => [a.key, a.label, a.exp, a.cooldown, a.note]),
    ...LEVEL_EXTRA_CONFIG_ROWS.filter((r) => !have.has(r[0])),
  ];
  if (missing.length) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: LEVEL_SPREADSHEET_ID,
      range: `'${LEVEL_CONFIG_SHEET_NAME}'!A:J`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: { values: missing },
    });
  }

  // --- Bảng Cấp Độ: chỉ điền khi trống ---
  const tbl = await sheets.spreadsheets.values.get({
    spreadsheetId: LEVEL_SPREADSHEET_ID,
    range: `'${LEVEL_TABLE_SHEET_NAME}'!A2:B3`,
  });
  if (!(tbl.data.values || []).length) {
    const rows = [];
    for (let n = 1; n <= LEVEL_MAX_LEVEL; n += 1) {
      // C = tổng EXP tích luỹ, công thức SUM để sửa cột B là tự cập nhật.
      rows.push([n, defaultCosts[n], `=SUM(B$2:B${n + 1})`]);
    }
    await sheets.spreadsheets.values.update({
      spreadsheetId: LEVEL_SPREADSHEET_ID,
      range: `'${LEVEL_TABLE_SHEET_NAME}'!A2:C${rows.length + 1}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: rows },
    });
  }

  await setupRoleTab(sheets);
}

// Tab "Role Cấp Độ": cột B (Role ID) định dạng VĂN BẢN — Role ID dài 18-19 chữ số, để dạng số sẽ bị Sheets làm tròn
// mất chữ số cuối. Điền sẵn vài mốc mẫu (Role ID trống) khi tab còn trống.
async function setupRoleTab(sheets) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: LEVEL_SPREADSHEET_ID });
  const tab = (meta.data.sheets || []).find((t) => t.properties.title === LEVEL_ROLE_SHEET_NAME);
  if (!tab) return;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: LEVEL_SPREADSHEET_ID,
    resource: {
      requests: [
        {
          repeatCell: {
            range: { sheetId: tab.properties.sheetId, startRowIndex: 1, endRowIndex: 1000, startColumnIndex: 1, endColumnIndex: 2 },
            cell: { userEnteredFormat: { numberFormat: { type: 'TEXT' } } },
            fields: 'userEnteredFormat.numberFormat',
          },
        },
      ],
    },
  });
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: LEVEL_SPREADSHEET_ID,
    range: `'${LEVEL_ROLE_SHEET_NAME}'!A2:C3`,
  });
  if ((existing.data.values || []).length) return;
  const rows = ROLE_SAMPLE_LEVELS.map((n) => [n, '', 'Điền Role ID Discord vào cột B (để trống = bỏ qua mốc này). Thêm/bớt dòng thoải mái.']);
  await sheets.spreadsheets.values.update({
    spreadsheetId: LEVEL_SPREADSHEET_ID,
    range: `'${LEVEL_ROLE_SHEET_NAME}'!A2:C${rows.length + 1}`,
    valueInputOption: 'RAW',
    resource: { values: rows },
  });
}

// Đọc mốc role: [{ level, roleId }] tăng dần theo cấp. Trả null nếu đọc lỗi (để phía gọi giữ nguyên mốc cũ).
async function loadRoleMilestones() {
  if (!LEVEL_SPREADSHEET_ID) return [];
  try {
    const sheets = await getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: LEVEL_SPREADSHEET_ID,
      range: `'${LEVEL_ROLE_SHEET_NAME}'!A2:C`,
      valueRenderOption: 'FORMATTED_VALUE', // lấy chuỗi để Role ID không bị làm tròn như số
    });
    const byLevel = new Map();
    for (const row of res.data.values || []) {
      const level = Number(String(row[0] || '').trim());
      const idMatch = /\d{17,20}/.exec(String(row[1] || '')); // chấp nhận cả dạng <@&id> dán từ Discord
      if (!Number.isInteger(level) || level < 1 || level > LEVEL_MAX_LEVEL || !idMatch) continue;
      byLevel.set(level, idMatch[0]);
    }
    return [...byLevel.entries()].sort((a, b) => a[0] - b[0]).map(([level, roleId]) => ({ level, roleId }));
  } catch (error) {
    console.error('[level] Không đọc được tab Role Cấp Độ:', error.message);
    return null;
  }
}

// ---- Tab "Tuỳ Chọn": mỗi người tự tắt/bật thông báo lên cấp của mình (/levelnotify). Cột: A Discord ID | B Tên | C Tắt Thông Báo (TRUE/FALSE) | D Cập nhật.
const OPTIONS_SHEET_NAME = 'Tuỳ Chọn';
const OPTIONS_HEADER = ['Discord ID', 'Tên', 'Tắt Thông Báo', 'Cập Nhật'];
const TRUTHY = /^(true|1|x|yes|có|co|tắt|tat|on)$/i;

async function ensureOptionsTab() {
  if (!LEVEL_SPREADSHEET_ID) return;
  const sheets = await getSheetsClient();
  await ensureTab(sheets, OPTIONS_SHEET_NAME);
  await writeHeaderIfDifferent(sheets, OPTIONS_SHEET_NAME, OPTIONS_HEADER);
}

// Trả Set<userId> những người ĐÃ TẮT thông báo; null nếu đọc lỗi (phía gọi giữ nguyên bản cũ).
async function loadNoticeOptOuts() {
  if (!LEVEL_SPREADSHEET_ID) return new Set();
  try {
    const sheets = await getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: LEVEL_SPREADSHEET_ID,
      range: `'${OPTIONS_SHEET_NAME}'!A2:C`,
      valueRenderOption: 'FORMATTED_VALUE', // giữ ID dạng chuỗi
    });
    const set = new Set();
    for (const row of res.data.values || []) {
      const id = String(row[0] || '').trim();
      if (/^\d{17,20}$/.test(id) && TRUTHY.test(String(row[2] || '').trim())) set.add(id);
    }
    return set;
  } catch (error) {
    console.error('[level] Không đọc được tab Tuỳ Chọn:', error.message);
    return null;
  }
}

// Ghi tuỳ chọn của 1 người (cập nhật dòng có sẵn hoặc thêm dòng mới). Ném lỗi nếu ghi không được.
async function setNoticeOptOut(userId, name, off) {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: LEVEL_SPREADSHEET_ID,
    range: `'${OPTIONS_SHEET_NAME}'!A2:A`,
    valueRenderOption: 'FORMATTED_VALUE',
  });
  const idx = (res.data.values || []).findIndex((r) => String(r[0] || '').trim() === userId);
  const row = [userId, name || '', off ? 'TRUE' : 'FALSE', vnTimeString()];
  if (idx >= 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: LEVEL_SPREADSHEET_ID,
      range: `'${OPTIONS_SHEET_NAME}'!A${idx + 2}:D${idx + 2}`,
      valueInputOption: 'RAW',
      resource: { values: [row] },
    });
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId: LEVEL_SPREADSHEET_ID,
      range: `'${OPTIONS_SHEET_NAME}'!A:D`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: { values: [row] },
    });
  }
}

// Nạp cấu hình đang có trên sheet: { activities: { key: { exp, cooldown } }, costs: [_, c1, c2, ...] }.
async function loadLevelConfig() {
  if (!LEVEL_SPREADSHEET_ID) return { activities: {}, costs: [], roles: [], eventRows: [] };
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: LEVEL_SPREADSHEET_ID,
    ranges: [`'${LEVEL_CONFIG_SHEET_NAME}'!A2:J`, `'${LEVEL_TABLE_SHEET_NAME}'!A2:B`],
    valueRenderOption: 'UNFORMATTED_VALUE',
  });
  const [cfgRange, tblRange] = res.data.valueRanges || [];

  const activities = {};
  const eventRows = [];
  for (const row of (cfgRange && cfgRange.values) || []) {
    const key = String(row[0] || '').trim();
    if (!key) continue;
    if (/^event_/i.test(key)) eventRows.push(row);
    const exp = Number(row[2]);
    const cooldown = Number(row[3]);
    activities[key] = {
      exp: Number.isFinite(exp) && exp >= 0 ? exp : undefined,
      cooldown: Number.isFinite(cooldown) && cooldown >= 0 ? cooldown : undefined,
    };
  }

  const costs = [0];
  for (const row of (tblRange && tblRange.values) || []) {
    const n = Number(row[0]);
    const cost = Number(row[1]);
    if (Number.isInteger(n) && n >= 1 && Number.isFinite(cost) && cost > 0) costs[n] = cost;
  }
  const roles = await loadRoleMilestones();
  return { activities, costs, roles, eventRows };
}

function parseMemberRow(row, rowNumber) {
  const counts = {};
  LEVEL_ACTIVITIES.forEach((a) => {
    counts[a.key] = Number(row[ACT_COL[a.key]]) || 0;
  });
  return {
    rowNumber,
    id: String(row[0] || '').trim(),
    name: String(row[1] || '').trim(),
    exp: Number(row[COL_EXP]) || 0,
    level: Number(row[COL_LEVEL]) || 0,
    counts,
    lastAt: String(row[COL_LAST] || ''),
    weekExp: Number(row[COL_WEEK_EXP]) || 0,
    weekKey: String(row[COL_WEEK] || '').trim(),
    streakDay: String(row[COL_STREAK_DAY] || '').trim(),
    streak: Number(row[COL_STREAK]) || 0,
    // Kỷ lục không bao giờ nhỏ hơn chuỗi đang lưu (dòng cũ chưa có cột này -> lấy luôn chuỗi hiện có làm kỷ lục khởi đầu).
    bestStreak: Math.max(Number(row[COL_BEST_STREAK]) || 0, Number(row[COL_STREAK]) || 0),
    flags: String(row[COL_FLAGS] || '').trim(),
    // Dòng cũ chưa có Điểm HĐ (ô trống) -> khởi đầu = EXP hiện có (đúng 1-1 với lịch sử EXP).
    points: row[COL_POINTS] === undefined || row[COL_POINTS] === '' ? Number(row[COL_EXP]) || 0 : Number(row[COL_POINTS]) || 0,
  };
}

function buildMemberRow({ id, name, exp, level, counts, lastAt, weekExp, weekKey: wk, streakDay, streak, bestStreak, flags, points }) {
  const row = new Array(TOTAL_COLS).fill('');
  row[0] = String(id);
  row[1] = name || '';
  row[COL_EXP] = exp;
  row[COL_LEVEL] = level;
  let total = 0;
  LEVEL_ACTIVITIES.forEach((a) => {
    const v = counts[a.key] || 0;
    row[ACT_COL[a.key]] = v;
    if (a.key !== VOICE_KEY && !a.bonus) total += v;
  });
  row[COL_TOTAL] = total;
  row[COL_LAST] = lastAt || '';
  row[COL_WEEK_EXP] = weekExp || 0;
  row[COL_WEEK] = wk || '';
  row[COL_STREAK_DAY] = streakDay || '';
  row[COL_STREAK] = streak || 0;
  row[COL_FLAGS] = flags || '';
  row[COL_BEST_STREAK] = Math.max(Number(bestStreak) || 0, Number(streak) || 0);
  row[COL_POINTS] = points === undefined || points === null ? exp : points;
  return row;
}

async function readAllMembers(sheets) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: LEVEL_SPREADSHEET_ID,
    range: `'${LEVEL_SHEET_NAME}'!A2:${LAST_COL_LETTER}`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });
  const out = [];
  (res.data.values || []).forEach((row, i) => {
    const m = parseMemberRow(row, i + 2);
    if (m.id) out.push(m);
  });
  return out;
}

// Đọc cả tab Level (không ghi gì) — dùng lúc khởi động + lệnh xem cấp/bảng xếp hạng.
async function loadMembers() {
  if (!LEVEL_SPREADSHEET_ID) return [];
  const sheets = await getSheetsClient();
  return readAllMembers(sheets);
}

// pending: Map<userId, { name, exp, counts: {key: n}, lastAt }>. levelFromExp: hàm tính cấp.
// Trả về { members (toàn bộ tab sau khi ghi), applied: Set<userId> đã ghi xong, error }.
// Lỗi ở bước nào thì các user thuộc bước đó KHÔNG nằm trong `applied` -> phía gọi gộp lại vào pending.
async function applyDeltas(pending, levelFromExp) {
  const sheets = await getSheetsClient();
  const members = await readAllMembers(sheets);
  const byId = new Map(members.map((m) => [m.id, m]));
  const applied = new Set();
  const nowStr = vnTimeString();
  const curWeek = weekKey();
  const round2 = (n) => Math.round(n * 100) / 100;

  const updates = []; // { range, values } cho các dòng đã có
  const updatedIds = [];
  const appends = []; // dòng mới
  const appendIds = [];

  for (const [id, p] of pending) {
    const existing = byId.get(id);
    if (existing) {
      existing.exp = Math.max(0, round2(existing.exp + p.exp));
      existing.points = Math.max(0, round2((existing.points === undefined ? existing.exp - p.exp : existing.points) + (p.points || 0)));
      if (existing.weekKey !== curWeek) {
        // Sang tuần mới (00:00 Thứ Hai giờ VN): reset EXP tuần trước khi cộng.
        existing.weekExp = 0;
        existing.weekKey = curWeek;
      }
      existing.weekExp = round2(existing.weekExp + (p.weekExp || 0));
      if (p.streakDay !== undefined) {
        existing.streakDay = p.streakDay;
        existing.streak = p.streak || 0;
        existing.bestStreak = Math.max(existing.bestStreak || 0, existing.streak, p.bestStreak || 0);
      }
      if (p.flags !== undefined) existing.flags = p.flags;
      for (const a of LEVEL_ACTIVITIES) existing.counts[a.key] += p.counts[a.key] || 0;
      if (p.name) existing.name = p.name;
      existing.level = levelFromExp(existing.exp);
      existing.lastAt = nowStr;
      updates.push({
        range: `'${LEVEL_SHEET_NAME}'!A${existing.rowNumber}:${LAST_COL_LETTER}${existing.rowNumber}`,
        values: [buildMemberRow({ ...existing })],
      });
      updatedIds.push(id);
    } else {
      const fresh = { id, name: p.name || '', exp: p.exp, level: levelFromExp(p.exp), counts: { ...p.counts }, lastAt: nowStr, weekExp: round2(p.weekExp || 0), weekKey: curWeek, streakDay: p.streakDay || '', streak: p.streak || 0, bestStreak: Math.max(p.bestStreak || 0, p.streak || 0), flags: p.flags || '', points: Math.max(0, round2(p.points || 0)) };
      for (const a of LEVEL_ACTIVITIES) fresh.counts[a.key] = fresh.counts[a.key] || 0;
      appends.push(buildMemberRow(fresh));
      appendIds.push(id);
      members.push({ ...fresh, rowNumber: -1 });
      byId.set(id, members[members.length - 1]);
    }
  }

  // Tự sửa cột Cấp nếu ai đó sửa tay EXP / Bảng Cấp Độ (chỉ ghi ô D của dòng bị lệch).
  const pendingIds = new Set(pending.keys());
  for (const m of members) {
    if (m.rowNumber < 0 || pendingIds.has(m.id)) continue;
    // Reset EXP tuần cho người không hoạt động trong flush này (chỉ ghi 2 ô cuối; dòng chưa có EXP tuần thì khỏi ghi).
    if (m.weekKey !== curWeek) {
      if (m.weekExp !== 0) {
        updates.push({
          range: `'${LEVEL_SHEET_NAME}'!${colLetter(COL_WEEK_EXP)}${m.rowNumber}:${colLetter(COL_WEEK)}${m.rowNumber}`,
          values: [[0, curWeek]],
        });
      }
      m.weekExp = 0;
      m.weekKey = curWeek;
    }
    const want = levelFromExp(m.exp);
    if (want !== m.level) {
      m.level = want;
      updates.push({ range: `'${LEVEL_SHEET_NAME}'!D${m.rowNumber}`, values: [[want]] });
    }
  }

  let error = null;
  if (updates.length) {
    try {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: LEVEL_SPREADSHEET_ID,
        resource: { valueInputOption: 'RAW', data: updates },
      });
      updatedIds.forEach((id) => applied.add(id));
    } catch (e) {
      error = e;
    }
  }
  if (appends.length) {
    try {
      const res = await sheets.spreadsheets.values.append({
        spreadsheetId: LEVEL_SPREADSHEET_ID,
        range: `'${LEVEL_SHEET_NAME}'!A:${LAST_COL_LETTER}`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: { values: appends },
      });
      appendIds.forEach((id) => applied.add(id));
      // Gán lại số dòng thật cho các dòng vừa thêm (để lần sau không cần đọc lại mới biết).
      const m = /!A(\d+)/.exec((res.data.updates && res.data.updates.updatedRange) || '');
      if (m) {
        const startRow = Number(m[1]);
        appendIds.forEach((id, i) => {
          const rec = byId.get(id);
          if (rec) rec.rowNumber = startRow + i;
        });
      }
    } catch (e) {
      error = e;
    }
  }
  // Có lỗi ghi -> KHÔNG trả `members` (đã bị cộng thử trong bộ nhớ, chưa chắc đã lưu) để cache không lệch.
  if (error) return { members: null, applied, error };
  return { members, applied, error: null };
}

module.exports = {
  POINTS_COL_LETTER: colLetter(COL_POINTS),
  ensureLevelSheets,
  loadLevelConfig,
  loadMembers,
  applyDeltas,
  ensureOptionsTab,
  loadNoticeOptOuts,
  setNoticeOptOut,
};
