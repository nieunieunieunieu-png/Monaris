// ===== googleSheets/shopSheet.js — tab "Shop Khung" (khung đã sở hữu) + đọc điểm + ghi sổ trừ điểm, spreadsheet Level =====
// Tab "Shop Khung" (bot tự tạo, đọc 1 lần lúc khởi động):  A Discord ID | B Tên | C Khung ID | D Nguồn (mua / thưởng / admin) | E Giá (điểm) | F Thời gian (giờ VN)
// Điểm: đọc cột E "Điểm còn lại" của tab "Điểm Hoạt Động" (= Điểm HĐ tích riêng − đã dùng). Mua xong ghi 1 dòng vào "Lịch Sử Dùng Điểm" (cột A ngày, B ID, D "Shop khung: <id>", E điểm trừ, F ghi chú);
// KHÔNG ghi cột C vì đó là ARRAYFORMULA của sổ. Mọi lần ghi sổ đi qua 1 hàng đợi để 2 người mua cùng lúc không đè dòng nhau.
const { google } = require('./googleClient');
const { getGoogleAuthClient } = require('./auth');
const { LEVEL_SPREADSHEET_ID, LEVEL_EVENT_POINTS_SHEET_NAME: POINTS_TAB, LEVEL_EVENT_LOG_SHEET_NAME: LOG_TAB } = require('../config');
const { SHOP_SHEET_NAME: TAB, CUULONG_RANK_MARK } = require('../config/shop');
const { retryOnQuotaExceeded } = require('../utils/retry');

const HEADER = ['Discord ID', 'Tên', 'Khung ID', 'Nguồn', 'Giá (điểm)', 'Thời gian'];
const q = (name) => `'${name}'`;

async function getSheetsClient() {
  const auth = await getGoogleAuthClient();
  if (!auth) throw new Error('Chưa cấu hình Google Sheets credentials cho bot.');
  return google.sheets({ version: 'v4', auth });
}

function vnParts(ms = Date.now()) {
  const d = new Date(ms + 7 * 60 * 60 * 1000);
  const p = (n) => String(n).padStart(2, '0');
  return { date: `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`, full: `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}` };
}

async function ensureShopTab() {
  if (!LEVEL_SPREADSHEET_ID) return;
  const sheets = await getSheetsClient();
  await retryOnQuotaExceeded(
    async () => {
      const meta = await sheets.spreadsheets.get({ spreadsheetId: LEVEL_SPREADSHEET_ID });
      if ((meta.data.sheets || []).some((s) => s.properties.title === TAB)) return;
      const res = await sheets.spreadsheets.batchUpdate({ spreadsheetId: LEVEL_SPREADSHEET_ID, resource: { requests: [{ addSheet: { properties: { title: TAB, gridProperties: { frozenRowCount: 1 } } } }] } });
      const sheetId = res.data.replies[0].addSheet.properties.sheetId;
      await sheets.spreadsheets.values.update({ spreadsheetId: LEVEL_SPREADSHEET_ID, range: `${q(TAB)}!A1:F1`, valueInputOption: 'RAW', resource: { values: [HEADER] } });
      // Discord ID là VĂN BẢN (ID 18-19 số, để dạng số Sheets làm tròn mất chữ số cuối).
      await sheets.spreadsheets.batchUpdate({ spreadsheetId: LEVEL_SPREADSHEET_ID, resource: { requests: [{ repeatCell: { range: { sheetId, startRowIndex: 1, endRowIndex: 5000, startColumnIndex: 0, endColumnIndex: 1 }, cell: { userEnteredFormat: { numberFormat: { type: 'TEXT' } } }, fields: 'userEnteredFormat.numberFormat' } }] } });
    },
    { label: 'Shop Khung (tạo tab)' },
  );
}

// -> Map(userId -> Set(frameId)); null nếu đọc lỗi (phía gọi giữ bản cũ).
async function loadOwned() {
  if (!LEVEL_SPREADSHEET_ID) return new Map();
  try {
    const sheets = await getSheetsClient();
    const res = await retryOnQuotaExceeded(() => sheets.spreadsheets.values.get({ spreadsheetId: LEVEL_SPREADSHEET_ID, range: `${q(TAB)}!A2:F`, valueRenderOption: 'FORMATTED_VALUE' }), { label: 'Shop Khung (đọc)' });
    const out = new Map();
    for (const row of res.data.values || []) {
      const id = String(row[0] || '').trim();
      const frame = String(row[2] || '').trim();
      if (!/^\d{17,20}$/.test(id) || !frame || frame === CUULONG_RANK_MARK) continue; // dòng đánh dấu thứ tự Chí Tôn không phải khung
      if (!out.has(id)) out.set(id, new Set());
      out.get(id).add(frame);
    }
    return out;
  } catch (error) {
    console.error('[shop] Không đọc được tab Shop Khung:', error.message);
    return null;
  }
}

// Số thứ tự Chí Tôn 9/9: các dòng có Khung ID = CUULONG_RANK_MARK, cột E = N. -> Map(userId -> { rank, at }); null nếu đọc lỗi.
async function loadRanks() {
  if (!LEVEL_SPREADSHEET_ID) return new Map();
  try {
    const sheets = await getSheetsClient();
    const res = await retryOnQuotaExceeded(() => sheets.spreadsheets.values.get({ spreadsheetId: LEVEL_SPREADSHEET_ID, range: `${q(TAB)}!A2:F`, valueRenderOption: 'UNFORMATTED_VALUE' }), { label: 'Shop Khung (đọc thứ tự)' });
    const out = new Map();
    for (const row of res.data.values || []) {
      if (String(row[2] || '').trim() !== CUULONG_RANK_MARK) continue;
      const id = String(row[0] === undefined ? '' : row[0]).trim();
      const rank = Number(row[4]);
      if (/^\d{17,20}$/.test(id) && Number.isFinite(rank) && rank > 0 && !out.has(id)) out.set(id, { rank, at: String(row[5] || '') });
    }
    return out;
  } catch (error) {
    console.error('[shop] Không đọc được thứ tự Chí Tôn:', error.message);
    return null;
  }
}

// rows: [{ userId, name, frameId, source, price }] — thêm cuối tab (ném lỗi nếu ghi không được để phía gọi thử lại).
async function appendOwned(rows) {
  if (!rows.length || !LEVEL_SPREADSHEET_ID) return;
  const sheets = await getSheetsClient();
  const at = vnParts().full;
  await retryOnQuotaExceeded(
    () => sheets.spreadsheets.values.append({ spreadsheetId: LEVEL_SPREADSHEET_ID, range: `${q(TAB)}!A:F`, valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS', resource: { values: rows.map((r) => [r.userId, r.name || '', r.frameId, r.source, r.price || 0, at]) } }),
    { label: 'Shop Khung (ghi)' },
  );
}

// Điểm còn lại của 1 người (số) hoặc null nếu chưa có dòng của người đó. Đọc cột E "Điểm còn lại" của tab "Điểm Hoạt Động";
// nếu tab đó đang LỖI công thức (#ERROR!/#REF!, ô không phải số) hoặc chưa có dòng của người này thì TỰ TÍNH thẳng từ tab Level
// (cột "Điểm HĐ", trống = EXP) trừ tổng cột "Điểm trừ" của người này trong "Lịch Sử Dùng Điểm" — cùng công thức của sổ nên cho cùng kết quả.
// Ném lỗi chỉ khi cả 2 cách đều không đọc được.
async function readPointsFromSheet(sheets, userId) {
  const res = await retryOnQuotaExceeded(() => sheets.spreadsheets.values.get({ spreadsheetId: LEVEL_SPREADSHEET_ID, range: `${q(POINTS_TAB)}!A2:E`, valueRenderOption: 'UNFORMATTED_VALUE' }), { label: 'Điểm Hoạt Động (đọc)' });
  for (const row of res.data.values || []) {
    if (String(row[0] === undefined ? '' : row[0]).trim() === String(userId)) {
      const v = typeof row[4] === 'number' ? row[4] : NaN; // chuỗi lỗi như "#ERROR!" -> NaN (Number('') = 0 sẽ đọc nhầm thành 0 điểm)
      return Number.isFinite(v) ? v : undefined;
    }
  }
  return undefined;
}

async function computePointsFromLevel(sheets, userId) {
  const { loadMembers } = require('./levelSheet');
  const members = await loadMembers();
  const m = members.find((x) => x.id === String(userId));
  if (!m) return null;
  const res = await retryOnQuotaExceeded(() => sheets.spreadsheets.values.get({ spreadsheetId: LEVEL_SPREADSHEET_ID, range: `${q(LOG_TAB)}!B2:E`, valueRenderOption: 'UNFORMATTED_VALUE' }), { label: 'Lịch Sử Dùng Điểm (đọc)' });
  let used = 0;
  for (const r of res.data.values || []) {
    if (String(r[0] === undefined ? '' : r[0]).trim() === String(userId)) { const n = Number(r[3]); if (Number.isFinite(n)) used += n; }
  }
  return Math.round(((Number(m.points) || 0) - used) * 100) / 100;
}

let warnedFallback = false;
async function readPoints(userId) {
  const sheets = await getSheetsClient();
  let fromTab;
  let tabError = null;
  try { fromTab = await readPointsFromSheet(sheets, userId); } catch (e) { tabError = e; }
  if (fromTab !== undefined) return fromTab;
  try {
    const v = await computePointsFromLevel(sheets, userId);
    if (!warnedFallback) { warnedFallback = true; console.warn('[shop] Tab "Điểm Hoạt Động" lỗi/thiếu dòng -> đang tự tính điểm từ tab Level + Lịch Sử Dùng Điểm.'); }
    return v;
  } catch (e) {
    throw tabError || e;
  }
}

// Sổ đã có dòng trừ điểm của khung này cho người này chưa (ghi chú cột F = id khung, cột D bắt đầu "Shop khung:").
// Dùng để KHÔNG trừ điểm lần 2 nếu lần mua trước đã trừ nhưng chưa kịp ghi "Shop Khung" (bot khởi động lại / lỗi ghi).
async function hasLedgerEntry(userId, frameId) {
  const sheets = await getSheetsClient();
  const res = await retryOnQuotaExceeded(() => sheets.spreadsheets.values.get({ spreadsheetId: LEVEL_SPREADSHEET_ID, range: `${q(LOG_TAB)}!B2:F`, valueRenderOption: 'UNFORMATTED_VALUE' }), { label: 'Lịch Sử Dùng Điểm (đọc)' });
  return (res.data.values || []).some((r) => String(r[0] === undefined ? '' : r[0]).trim() === String(userId) && String(r[2] || '').startsWith('Shop khung:') && String(r[4] || '').trim() === frameId);
}

let ledgerQueue = Promise.resolve();
// Ghi 1 dòng trừ điểm vào "Lịch Sử Dùng Điểm" ở dòng trống đầu tiên của cột B (không đụng cột C là công thức mảng). Có hàng đợi toàn cục.
function appendLedger({ userId, event, points, note }) {
  const job = ledgerQueue.then(async () => {
    if (!LEVEL_SPREADSHEET_ID) throw new Error('Thiếu LEVEL_SPREADSHEET_ID.');
    const sheets = await getSheetsClient();
    await retryOnQuotaExceeded(
      async () => {
        const res = await sheets.spreadsheets.values.get({ spreadsheetId: LEVEL_SPREADSHEET_ID, range: `${q(LOG_TAB)}!B2:B`, valueRenderOption: 'FORMATTED_VALUE' });
        const col = res.data.values || [];
        let idx = col.findIndex((r) => !String(r && r[0] !== undefined ? r[0] : '').trim());
        if (idx < 0) idx = col.length;
        const row = idx + 2;
        // Ngày: USER_ENTERED để thành ô ngày; ID/Event/Điểm/Ghi chú: RAW để ID luôn là chữ (không bị làm tròn) và điểm là số.
        await sheets.spreadsheets.values.update({ spreadsheetId: LEVEL_SPREADSHEET_ID, range: `${q(LOG_TAB)}!A${row}`, valueInputOption: 'USER_ENTERED', resource: { values: [[vnParts().date]] } });
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: LEVEL_SPREADSHEET_ID,
          resource: {
            valueInputOption: 'RAW',
            data: [
              { range: `${q(LOG_TAB)}!B${row}`, values: [[String(userId)]] },
              { range: `${q(LOG_TAB)}!D${row}:F${row}`, values: [[event, points, note || '']] },
            ],
          },
        });
      },
      { label: 'Lịch Sử Dùng Điểm (ghi)' },
    );
  });
  ledgerQueue = job.catch(() => {});
  return job;
}

module.exports = { ensureShopTab, loadOwned, loadRanks, appendOwned, readPoints, appendLedger, hasLedgerEntry };
