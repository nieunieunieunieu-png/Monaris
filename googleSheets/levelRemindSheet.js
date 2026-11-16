// ===== googleSheets/levelRemindSheet.js — tab "Nhắc Streak" của spreadsheet Level (LEVEL_SPREADSHEET_ID) =====
// Ai tự bật nhắc streak (/nhacstreak). Bot tự tạo tab + tự ghi, cột:
//   A Discord ID | B Tên | C Bật (TRUE/FALSE) | D Ngày Nhắc Gần Nhất (YYYY-MM-DD, giờ VN — chống nhắc trùng sau khi restart) | E Cập Nhật (giờ VN)
// Đọc 1 lần lúc khởi động (cache ở level/streakRemind.js); ghi theo lô (cập nhật dòng có sẵn bằng 1 batchUpdate, người mới append 1 lần).
const { google } = require('./googleClient');
const { getGoogleAuthClient } = require('./auth');
const { LEVEL_SPREADSHEET_ID, LEVEL_STREAK_REMIND_SHEET_NAME: TAB } = require('../config');
const { retryOnQuotaExceeded } = require('../utils/retry');

const HEADER = ['Discord ID', 'Tên', 'Bật', 'Ngày Nhắc Gần Nhất', 'Cập Nhật'];
const TRUTHY = /^(true|1|x|yes|có|co|bật|bat|on)$/i;

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

// Tạo tab (kèm tiêu đề) nếu chưa có.
async function ensureRemindTab() {
  if (!LEVEL_SPREADSHEET_ID) return;
  const sheets = await getSheetsClient();
  await retryOnQuotaExceeded(
    async () => {
      const meta = await sheets.spreadsheets.get({ spreadsheetId: LEVEL_SPREADSHEET_ID });
      if ((meta.data.sheets || []).some((s) => s.properties.title === TAB)) return;
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: LEVEL_SPREADSHEET_ID,
        resource: { requests: [{ addSheet: { properties: { title: TAB, gridProperties: { frozenRowCount: 1 } } } }] },
      });
      await sheets.spreadsheets.values.update({
        spreadsheetId: LEVEL_SPREADSHEET_ID,
        range: `'${TAB}'!A1:E1`,
        valueInputOption: 'RAW',
        resource: { values: [HEADER] },
      });
    },
    { label: 'Nhắc Streak (tạo tab)' }
  );
}

// -> Map(id -> { name, on, lastDay }); null nếu đọc lỗi (phía gọi giữ bản cũ).
async function loadRemindRows() {
  if (!LEVEL_SPREADSHEET_ID) return new Map();
  try {
    const sheets = await getSheetsClient();
    const res = await retryOnQuotaExceeded(
      () => sheets.spreadsheets.values.get({ spreadsheetId: LEVEL_SPREADSHEET_ID, range: `'${TAB}'!A2:E`, valueRenderOption: 'FORMATTED_VALUE' }),
      { label: 'Nhắc Streak (đọc)' }
    );
    const out = new Map();
    for (const row of res.data.values || []) {
      const id = String(row[0] || '').trim();
      if (!/^\d{17,20}$/.test(id)) continue;
      const lastDay = String(row[3] || '').trim();
      out.set(id, { name: String(row[1] || ''), on: TRUTHY.test(String(row[2] || '').trim()), lastDay: /^\d{4}-\d{2}-\d{2}$/.test(lastDay) ? lastDay : '' });
    }
    return out;
  } catch (error) {
    console.error('[level] Không đọc được tab Nhắc Streak:', error.message);
    return null;
  }
}

// entries: [{ id, name, on, lastDay }] — dòng có sẵn thì cập nhật, chưa có thì thêm cuối. Ném lỗi nếu ghi không được (phía gọi giữ lại để ghi sau).
async function upsertRemindRows(entries) {
  if (!entries.length || !LEVEL_SPREADSHEET_ID) return;
  const sheets = await getSheetsClient();
  await retryOnQuotaExceeded(
    async () => {
      // Đọc lại cột A mỗi lần thử: nếu lần trước đã append được một phần thì lần này tìm thấy dòng, không bị thêm trùng.
      const res = await sheets.spreadsheets.values.get({ spreadsheetId: LEVEL_SPREADSHEET_ID, range: `'${TAB}'!A2:A`, valueRenderOption: 'FORMATTED_VALUE' });
      const rowOf = new Map();
      (res.data.values || []).forEach((r, i) => {
        const id = String(r[0] || '').trim();
        if (id && !rowOf.has(id)) rowOf.set(id, i + 2);
      });
      const at = vnTimeString();
      const updates = [];
      const fresh = [];
      for (const e of entries) {
        const row = [e.id, e.name || '', e.on ? 'TRUE' : 'FALSE', e.lastDay || '', at];
        if (rowOf.has(e.id)) updates.push({ range: `'${TAB}'!A${rowOf.get(e.id)}:E${rowOf.get(e.id)}`, values: [row] });
        else fresh.push(row);
      }
      if (updates.length) {
        await sheets.spreadsheets.values.batchUpdate({ spreadsheetId: LEVEL_SPREADSHEET_ID, resource: { valueInputOption: 'RAW', data: updates } });
      }
      if (fresh.length) {
        await sheets.spreadsheets.values.append({
          spreadsheetId: LEVEL_SPREADSHEET_ID,
          range: `'${TAB}'!A:E`,
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          resource: { values: fresh },
        });
      }
    },
    { label: 'Nhắc Streak (ghi)' }
  );
}

module.exports = { ensureRemindTab, loadRemindRows, upsertRemindRows };
