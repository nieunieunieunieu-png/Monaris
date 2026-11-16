// ===== googleSheets/congDucSheet.js — lưu Công Đức (spreadsheet CONG_DUC_SPREADSHEET_ID, mặc định = spreadsheet Level) =====
// Tab "Công Đức" (A:Q; P = Điểm sám hối, số thập phân, xem samHoi/; Q = Tổng phút thiền từ trước đến nay): A Discord ID | B Tên | C Tổng Công Đức | D Công Đức hôm nay | E Phút đã tích hôm nay | F Ngày của D/E (YYYY-MM-DD giờ VN)
//   | G Chuỗi hiện tại | H Chuỗi dài nhất | I Ngày thắp miễn phí gần nhất | J Tổng ngày đã thắp | K Số lần đốt hương hôm nay | L Ngày của K | M Tổng lần đốt | N Cảnh giới | O EXP hương đã nhận (số thập phân; loại khỏi Top tháng Level, xem level/expExclude.js)
// Tab "Cấu Hình Công Đức" (A Khoá | B Giá trị): sanh_message_id, id các thông báo cảnh giới cần giữ lại...
// Không đụng bất kỳ tab Level nào. Bot tự tạo tab + tiêu đề. Phải share sheet cho Service Account (Editor).
const { google } = require('./googleClient');
const { getGoogleAuthClient } = require('./auth');
const cfg = require('../config/congDuc');
const { retryOnQuotaExceeded } = require('../utils/retry');
const { recordSheetOk, recordSheetError } = require('../monitoring/status');

const HEADER = ['Discord ID', 'Tên', 'Tổng Công Đức', 'Công Đức hôm nay', 'Phút hôm nay', 'Ngày (hôm nay)', 'Chuỗi hiện tại', 'Chuỗi dài nhất', 'Ngày thắp gần nhất', 'Tổng ngày thắp', 'Đốt hương hôm nay', 'Ngày (đốt)', 'Tổng lần đốt', 'Cảnh giới', 'EXP hương (loại khỏi tháng)', 'Điểm sám hối', 'Tổng phút thiền'];
const CONFIG_HEADER = ['Khoá', 'Giá trị'];
const LEDGER_HEADER = ['Ngày', 'Discord ID', 'Tên', 'Mục', 'Lòng Thành trừ', 'Ghi chú / mã khung'];
const WEEK_HEADER = ['Discord ID', 'Mốc Công Đức đầu tuần'];
const LAST_COL = 'Q';
const STATUS_SOURCE = 'Công Đức';
const q = (name) => `'${name}'`;

async function getSheetsClient() {
  const auth = await getGoogleAuthClient();
  if (!auth) throw new Error('Chưa cấu hình Google Sheets credentials cho bot.');
  return google.sheets({ version: 'v4', auth });
}

// Chạy fn(sheets) có retry quota + ghi trạng thái monitoring.
async function run(label, fn) {
  try {
    const sheets = await getSheetsClient();
    const out = await retryOnQuotaExceeded(() => fn(sheets), { label: `Công Đức: ${label}` });
    recordSheetOk(STATUS_SOURCE);
    return out;
  } catch (error) {
    recordSheetError(STATUS_SOURCE, error);
    throw error;
  }
}

let tabsReady = false;
async function ensureTabs() {
  if (tabsReady) return;
  await run('ensureTabs', async (sheets) => {
    const id = cfg.CONG_DUC_SPREADSHEET_ID;
    const meta = await sheets.spreadsheets.get({ spreadsheetId: id });
    const have = new Set((meta.data.sheets || []).map((s) => s.properties.title));
    const want = [
      [cfg.CONG_DUC_SHEET_NAME, HEADER],
      [cfg.CONG_DUC_CONFIG_SHEET_NAME, CONFIG_HEADER],
      [cfg.CONG_DUC_LEDGER_SHEET_NAME, LEDGER_HEADER],
      [cfg.CONG_DUC_WEEK_SHEET_NAME, WEEK_HEADER],
      [cfg.CONG_DUC_MONTH_SHEET_NAME, WEEK_HEADER],
    ];
    const add = want.filter(([name]) => !have.has(name)).map(([name]) => ({ addSheet: { properties: { title: name } } }));
    if (add.length) await sheets.spreadsheets.batchUpdate({ spreadsheetId: id, resource: { requests: add } });
    for (const [name, header] of want) {
      const col = String.fromCharCode(64 + header.length);
      const head = await sheets.spreadsheets.values.get({ spreadsheetId: id, range: `${q(name)}!A1:${col}1` });
      if (!(head.data.values && head.data.values[0] && head.data.values[0].length >= header.length)) {
        await sheets.spreadsheets.values.update({ spreadsheetId: id, range: `${q(name)}!A1:${col}1`, valueInputOption: 'RAW', resource: { values: [header] } });
      }
    }
  });
  tabsReady = true;
}

// Đọc số nguyên từ ô Sheet. KHÔNG được xoá dấu '.' của số thập phân (lỗi cũ: 8187.95 -> 818795, nhân 100 mỗi lần bot khởi động lại).
// Số (UNFORMATTED_VALUE) -> làm tròn xuống. Chuỗi dạng nghìn kiểu VN/US ("1.234", "1,234.5"...) -> bỏ dấu phân cách nghìn; còn lại coi ',' là dấu thập phân.
const toInt = (v) => {
  let n;
  if (typeof v === 'number') n = v;
  else {
    const s = String(v === undefined || v === null ? '' : v).replace(/\s/g, '');
    if (/^\d{1,3}([.,]\d{3})+$/.test(s)) n = Number(s.replace(/[.,]/g, ''));
    else n = Number(s.replace(',', '.'));
  }
  n = Math.floor(n);
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const toNum2 = (v) => { const n = Math.round(Number(String(v === undefined || v === null ? '' : v).replace(',', '.')) * 100) / 100; return Number.isFinite(n) && n > 0 ? n : 0; };
const toStr = (v) => String(v === undefined || v === null ? '' : v).trim();

function rowToRecord(r, rowNumber) {
  return {
    userId: toStr(r[0]), name: toStr(r[1]), total: toInt(r[2]), todayCd: toInt(r[3]), todayMin: toInt(r[4]), dayKey: toStr(r[5]),
    streak: toInt(r[6]), bestStreak: toInt(r[7]), lastIncenseDay: toStr(r[8]), incenseDays: toInt(r[9]),
    burnToday: toInt(r[10]), burnDay: toStr(r[11]), burnTotal: toInt(r[12]), realm: toStr(r[13]), bonusExp: toNum2(r[14]), repent: toNum2(r[15]), totalMin: toInt(r[16]), row: rowNumber,
  };
}
const recordToRow = (r) => [r.userId, r.name || '', r.total, r.todayCd, r.todayMin, r.dayKey || '', r.streak, r.bestStreak, r.lastIncenseDay || '', r.incenseDays, r.burnToday, r.burnDay || '', r.burnTotal, r.realm || '', r.bonusExp || 0, r.repent || 0, r.totalMin || 0];

// Đọc cả tab -> mảng record (có `row` = số dòng trên Sheet).
async function loadAll() {
  await ensureTabs();
  return run('loadAll', async (sheets) => {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: cfg.CONG_DUC_SPREADSHEET_ID, range: `${q(cfg.CONG_DUC_SHEET_NAME)}!A:${LAST_COL}`, valueRenderOption: 'UNFORMATTED_VALUE' });
    const rows = res.data.values || [];
    const out = [];
    for (let i = 1; i < rows.length; i += 1) {
      const r = rows[i] || [];
      if (!toStr(r[0])) continue;
      out.push(rowToRecord(r, i + 1));
    }
    return out;
  });
}

// Ghi theo lô: record đã có `row` -> 1 lệnh values.batchUpdate; record mới -> 1 lệnh append (gán `row` về lại record).
async function saveBatch(records) {
  if (!records.length) return;
  await ensureTabs();
  await run('saveBatch', async (sheets) => {
    const id = cfg.CONG_DUC_SPREADSHEET_ID;
    const tab = q(cfg.CONG_DUC_SHEET_NAME);
    const existing = records.filter((r) => r.row);
    const fresh = records.filter((r) => !r.row);
    if (existing.length) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: id,
        resource: { valueInputOption: 'RAW', data: existing.map((r) => ({ range: `${tab}!A${r.row}:${LAST_COL}${r.row}`, values: [recordToRow(r)] })) },
      });
    }
    if (fresh.length) {
      const res = await sheets.spreadsheets.values.append({
        spreadsheetId: id, range: `${tab}!A:${LAST_COL}`, valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS',
        resource: { values: fresh.map(recordToRow) },
      });
      const m = String((res.data.updates && res.data.updates.updatedRange) || '').match(/!A(\d+)/);
      if (m) fresh.forEach((r, i) => { r.row = Number(m[1]) + i; });
    }
  });
}

// ----- Tab cấu hình (khoá/giá trị) -----
async function loadConfig() {
  await ensureTabs();
  return run('loadConfig', async (sheets) => {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: cfg.CONG_DUC_SPREADSHEET_ID, range: `${q(cfg.CONG_DUC_CONFIG_SHEET_NAME)}!A:B` });
    const out = {};
    for (const r of (res.data.values || []).slice(1)) if (toStr(r[0])) out[toStr(r[0])] = toStr(r[1]);
    return out;
  });
}

async function setConfig(key, value) {
  await ensureTabs();
  await run('setConfig', async (sheets) => {
    const id = cfg.CONG_DUC_SPREADSHEET_ID;
    const tab = q(cfg.CONG_DUC_CONFIG_SHEET_NAME);
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: id, range: `${tab}!A:A` });
    const idx = (res.data.values || []).findIndex((r, i) => i > 0 && toStr(r[0]) === key);
    if (idx >= 0) {
      await sheets.spreadsheets.values.update({ spreadsheetId: id, range: `${tab}!B${idx + 1}`, valueInputOption: 'RAW', resource: { values: [[String(value)]] } });
    } else {
      await sheets.spreadsheets.values.append({ spreadsheetId: id, range: `${tab}!A:B`, valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS', resource: { values: [[key, String(value)]] } });
    }
  });
}

// ----- Sổ chi Lòng Thành (tab "Lịch Sử Lòng Thành": A Ngày · B Discord ID · C Tên · D Mục · E Lòng Thành trừ · F Ghi chú/mã khung) -----
// -> [{ userId, cost, note }]. Ném lỗi nếu đọc không được (phía gọi giữ cửa hàng khoá để khỏi tiêu quá số dư).
async function loadLedger() {
  await ensureTabs();
  return run('loadLedger', async (sheets) => {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: cfg.CONG_DUC_SPREADSHEET_ID, range: `${q(cfg.CONG_DUC_LEDGER_SHEET_NAME)}!A2:F`, valueRenderOption: 'UNFORMATTED_VALUE' });
    const out = [];
    for (const r of res.data.values || []) {
      const userId = toStr(r[1]);
      const cost = toInt(r[4]);
      if (userId && cost > 0) out.push({ userId, cost, note: toStr(r[5]) });
    }
    return out;
  });
}

let ledgerQueue = Promise.resolve(); // ghi tuần tự, 2 người mua cùng lúc không đè nhau
// row: { day, userId, name, item, cost, note } — thêm 1 dòng cuối tab (RAW để Discord ID luôn là chữ). Ném lỗi nếu ghi không được.
function appendLedgerRow(row) {
  const job = ledgerQueue.then(async () => {
    await ensureTabs();
    await run('appendLedgerRow', async (sheets) => {
      await sheets.spreadsheets.values.append({
        spreadsheetId: cfg.CONG_DUC_SPREADSHEET_ID, range: `${q(cfg.CONG_DUC_LEDGER_SHEET_NAME)}!A:F`, valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS',
        resource: { values: [[row.day, String(row.userId), row.name || '', row.item, row.cost, row.note || '']] },
      });
    });
  });
  ledgerQueue = job.catch(() => {});
  return job;
}

// ----- Mốc đầu kỳ tuần/tháng (tab "Mốc Công Đức Tuần" / "Mốc Công Đức Tháng": A Discord ID · B Mốc Công Đức đầu kỳ) -----
async function loadPeriod(tab) {
  await ensureTabs();
  return run('loadPeriod', async (sheets) => {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: cfg.CONG_DUC_SPREADSHEET_ID, range: `${q(tab)}!A2:B`, valueRenderOption: 'UNFORMATTED_VALUE' });
    const out = new Map();
    for (const r of res.data.values || []) if (toStr(r[0])) out.set(toStr(r[0]), toInt(r[1]));
    return out;
  });
}
// Thay cả tab bằng mốc mới (xoá dòng cũ rồi ghi 1 lệnh).
async function savePeriod(tab, map) {
  await ensureTabs();
  await run('savePeriod', async (sheets) => {
    const id = cfg.CONG_DUC_SPREADSHEET_ID;
    tab = q(tab);
    await sheets.spreadsheets.values.clear({ spreadsheetId: id, range: `${tab}!A2:B` });
    const values = [...map].map(([userId, total]) => [String(userId), total]);
    if (values.length) await sheets.spreadsheets.values.update({ spreadsheetId: id, range: `${tab}!A2:B${values.length + 1}`, valueInputOption: 'RAW', resource: { values } });
  });
}

module.exports = { ensureTabs, loadAll, saveBatch, loadConfig, setConfig, loadLedger, appendLedgerRow, loadPeriod, savePeriod, rowToRecord, recordToRow, HEADER, LEDGER_HEADER, WEEK_HEADER };
