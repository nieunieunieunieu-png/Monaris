// ===== googleSheets/eventPointSheet.js — sổ điểm đổi event, 2 tab trong spreadsheet Level (LEVEL_SPREADSHEET_ID) =====
// Bot chỉ TẠO TAB + tiêu đề + công thức 1 lần lúc khởi động (không ghi dữ liệu thành viên, không đụng tab Level):
//  "Điểm Hoạt Động"      — A Discord ID | B Tên | C Điểm HĐ tổng | D Đã dùng | E Điểm còn lại   (cả 5 cột là ARRAYFORMULA ở dòng 2, tự theo tab Level)
//                          (tab cũ tên "Điểm Event" được bot tự đổi tên, dữ liệu giữ nguyên)
//  "Lịch Sử Dùng Điểm"   — A Ngày | B Discord ID | C Tên (công thức) | D Event | E Điểm trừ | F Ghi chú   (admin nhập tay mỗi lần ai đó dùng điểm)
// Điểm còn lại = Điểm HĐ tổng (cột cuối tab Level; ô trống = lấy EXP) − Đã dùng. KHÔNG trừ vào EXP trong tab Level nên Cấp/hạng/role không bị tụt.
// Ô công thức đã có thì giữ nguyên (sửa tay trên sheet không bị bot ghi đè).
const { google } = require('./googleClient');
const { getGoogleAuthClient } = require('./auth');
const {
  LEVEL_SPREADSHEET_ID,
  LEVEL_SHEET_NAME,
  LEVEL_EVENT_POINTS_SHEET_NAME: POINTS_TAB,
  LEVEL_EVENT_POINTS_LEGACY_NAME: LEGACY_POINTS_TAB,
  LEVEL_EVENT_LOG_SHEET_NAME: LOG_TAB,
} = require('../config');
const { retryOnQuotaExceeded } = require('../utils/retry');
const { POINTS_COL_LETTER } = require('./levelSheet');

const POINTS_HEADER = ['Discord ID', 'Tên', 'Điểm HĐ tổng', 'Đã dùng', 'Điểm còn lại'];
const LOG_HEADER = ['Ngày', 'Discord ID', 'Tên', 'Event', 'Điểm trừ', 'Ghi chú'];
const FORMAT_ROWS = 5000; // định dạng sẵn cho 5000 dòng đầu

const q = (name) => `'${name}'`;

async function getSheetsClient() {
  const auth = await getGoogleAuthClient();
  if (!auth) throw new Error('Chưa cấu hình Google Sheets credentials cho bot.');
  return google.sheets({ version: 'v4', auth });
}

// Trả về Map tên tab -> sheetId, tạo tab còn thiếu.
async function ensureTabs(sheets, titles) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: LEVEL_SPREADSHEET_ID });
  const have = new Map((meta.data.sheets || []).map((s) => [s.properties.title, s.properties.sheetId]));
  const missing = titles.filter((t) => !have.has(t));
  if (!missing.length) return { ids: have, created: new Set() };
  const res = await sheets.spreadsheets.batchUpdate({
    spreadsheetId: LEVEL_SPREADSHEET_ID,
    resource: { requests: missing.map((title) => ({ addSheet: { properties: { title } } })) },
  });
  (res.data.replies || []).forEach((r, i) => {
    if (r.addSheet) have.set(missing[i], r.addSheet.properties.sheetId);
  });
  return { ids: have, created: new Set(missing) };
}

// Tab cũ "Điểm Event" còn mà tab mới chưa có -> đổi tên tại chỗ (giữ dữ liệu + công thức).
async function renameLegacyTab(sheets) {
  if (!LEGACY_POINTS_TAB || LEGACY_POINTS_TAB === POINTS_TAB) return;
  const meta = await sheets.spreadsheets.get({ spreadsheetId: LEVEL_SPREADSHEET_ID });
  const list = meta.data.sheets || [];
  const old = list.find((s) => s.properties.title === LEGACY_POINTS_TAB);
  if (!old || list.some((s) => s.properties.title === POINTS_TAB)) return;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: LEVEL_SPREADSHEET_ID,
    resource: { requests: [{ updateSheetProperties: { properties: { sheetId: old.properties.sheetId, title: POINTS_TAB }, fields: 'title' } }] },
  });
  console.log(`[level] Đã đổi tên tab "${LEGACY_POINTS_TAB}" → "${POINTS_TAB}".`);
}

async function cellIsEmpty(sheets, range) {
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: LEVEL_SPREADSHEET_ID, range });
  return !(res.data.values || []).some((row) => row.some((c) => String(c || '').trim()));
}

async function writeHeaderIfDifferent(sheets, title, header) {
  const endCol = String.fromCharCode(64 + header.length);
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: LEVEL_SPREADSHEET_ID, range: `${q(title)}!A1:${endCol}1` });
  const cur = (res.data.values || [])[0] || [];
  if (header.length === cur.length && header.every((h, i) => String(cur[i] || '') === h)) return;
  await sheets.spreadsheets.values.update({
    spreadsheetId: LEVEL_SPREADSHEET_ID,
    range: `${q(title)}!A1:${endCol}1`,
    valueInputOption: 'RAW',
    resource: { values: [header] },
  });
}

function fmtRequest(sheetId, col, numberFormat) {
  return {
    repeatCell: {
      range: { sheetId, startRowIndex: 1, endRowIndex: FORMAT_ROWS, startColumnIndex: col, endColumnIndex: col + 1 },
      cell: { userEnteredFormat: { numberFormat } },
      fields: 'userEnteredFormat.numberFormat',
    },
  };
}


// Sheet đặt ngôn ngữ/khu vực dùng dấu ";" làm ngăn cách tham số (vd. Việt Nam) thì công thức viết dấu "," bị #ERROR! (lỗi cú pháp).
// toSemicolon: đổi mọi dấu "," NGOÀI chuỗi "..." và tên tab '...' thành ";".
function toSemicolon(f) {
  let out = '';
  let quote = '';
  for (const ch of String(f)) {
    if (quote) { if (ch === quote) quote = ''; out += ch; continue; }
    if (ch === '"' || ch === "'") { quote = ch; out += ch; continue; }
    out += ch === ',' ? ';' : ch;
  }
  return out;
}
const ERR_RE = /^#(ERROR|REF|NAME|VALUE|N\/A|DIV\/0|NUM|NULL)/i;
const hasErr = (vals) => (vals || []).some((c) => ERR_RE.test(String(c === undefined || c === null ? '' : c).trim()));

// Ghi 1 dòng công thức (USER_ENTERED) vào `range`; ghi xong đọc lại, nếu ô báo lỗi cú pháp thì xoá và ghi lại bằng kiểu dấu còn lại.
// order: ['comma', 'semi'] hoặc ['semi', 'comma'] (kiểu thử trước). Trả về kiểu đã ghi thành công, hoặc null nếu cả hai đều lỗi.
async function writeFormulasRobust(sheets, range, row, order) {
  for (const kind of order) {
    const values = [kind === 'semi' ? row.map(toSemicolon) : row];
    await sheets.spreadsheets.values.update({ spreadsheetId: LEVEL_SPREADSHEET_ID, range, valueInputOption: 'USER_ENTERED', resource: { values } });
    await new Promise((r) => setTimeout(r, 1500)); // chờ Sheet tính xong
    const chk = await sheets.spreadsheets.values.get({ spreadsheetId: LEVEL_SPREADSHEET_ID, range, valueRenderOption: 'FORMATTED_VALUE' });
    if (!hasErr((chk.data.values || [])[0])) return kind;
    await sheets.spreadsheets.values.clear({ spreadsheetId: LEVEL_SPREADSHEET_ID, range });
  }
  return null;
}

async function ensureEventPointSheets() {
  if (!LEVEL_SPREADSHEET_ID) return;
  await retryOnQuotaExceeded(
    async () => {
      const sheets = await getSheetsClient();
      await renameLegacyTab(sheets);
      const { ids, created } = await ensureTabs(sheets, [POINTS_TAB, LOG_TAB]);
      await writeHeaderIfDifferent(sheets, POINTS_TAB, POINTS_HEADER);
      await writeHeaderIfDifferent(sheets, LOG_TAB, LOG_HEADER);

      // Công thức chỉ điền khi ô còn trống.
      const lvl = q(LEVEL_SHEET_NAME);
      const POINTS_FORMULA = `=ARRAYFORMULA(IF(${lvl}!A2:A="","",IF(${lvl}!${POINTS_COL_LETTER}2:${POINTS_COL_LETTER}="",${lvl}!C2:C,${lvl}!${POINTS_COL_LETTER}2:${POINTS_COL_LETTER})))`;
      // Sheet đang chạy: C2 còn công thức cũ (lấy thẳng cột EXP) -> chuyển sang Điểm HĐ (đúng 1 lần, chỉ khi C2 đúng là công thức cũ).
      {
        const cur = await sheets.spreadsheets.values.get({ spreadsheetId: LEVEL_SPREADSHEET_ID, range: `${q(POINTS_TAB)}!C2`, valueRenderOption: 'FORMULA' });
        const f = String(((cur.data.values || [])[0] || [])[0] || '');
        if (f === `=ARRAYFORMULA(IF(${lvl}!A2:A="","",${lvl}!C2:C))`) {
          await sheets.spreadsheets.values.update({ spreadsheetId: LEVEL_SPREADSHEET_ID, range: `${q(POINTS_TAB)}!C2`, valueInputOption: 'USER_ENTERED', resource: { values: [[POINTS_FORMULA.replace(/^=/, '=')]] } });
        }
      }
      const log = q(LOG_TAB);
      const pts = q(POINTS_TAB);
      const ROW2 = [[
        `=ARRAYFORMULA(IF(${lvl}!A2:A="","",${lvl}!A2:A))`,
        `=ARRAYFORMULA(IF(${lvl}!A2:A="","",${lvl}!B2:B))`,
        POINTS_FORMULA,
        `=ARRAYFORMULA(IF(A2:A="","",SUMIF(${log}!B:B,A2:A,${log}!E:E)))`,
        `=ARRAYFORMULA(IF(A2:A="","",C2:C-D2:D))`,
      ]];
      const writeRow2 = async (order) => {
        const kind = await writeFormulasRobust(sheets, `${pts}!A2:E2`, ROW2[0], order);
        if (kind) console.log(`[level] Tab "${POINTS_TAB}": đã ghi công thức dòng 2 (kiểu dấu ${kind === 'semi' ? ';' : ','}).`);
        else console.error(`[level] Tab "${POINTS_TAB}": ghi công thức dòng 2 vẫn lỗi với cả dấu "," và ";" — mở ô A2 xem thông báo lỗi.`);
        return kind;
      };
      // Tự sửa: nếu dòng 2 của "Điểm Hoạt Động" đang báo lỗi (#ERROR!/#REF!...) thì xoá rồi ghi lại đúng 5 công thức chuẩn (chỉ khi thật sự lỗi; ô bình thường không đụng).
      // Cột A đang định dạng VĂN BẢN nên phải đưa A2:E2 về định dạng tự động trước khi ghi (nếu không công thức bị coi là chữ), ghi xong đặt lại cột A = văn bản.
      {
        const chk = await sheets.spreadsheets.values.get({ spreadsheetId: LEVEL_SPREADSHEET_ID, range: `${pts}!A2:E2`, valueRenderOption: 'FORMATTED_VALUE' });
        const vals = ((chk.data.values || [])[0] || []).map((c) => String(c || ''));
        if (hasErr(vals)) {
          console.warn(`[level] Tab "${POINTS_TAB}" dòng 2 đang lỗi (${vals.join(' | ')}) -> ghi lại công thức.`);
          const sid = ids.get(POINTS_TAB);
          await sheets.spreadsheets.values.clear({ spreadsheetId: LEVEL_SPREADSHEET_ID, range: `${pts}!A2:E2` });
          await sheets.spreadsheets.batchUpdate({ spreadsheetId: LEVEL_SPREADSHEET_ID, resource: { requests: [{ repeatCell: { range: { sheetId: sid, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 5 }, cell: {}, fields: 'userEnteredFormat.numberFormat' } }] } });
          await writeRow2(['semi', 'comma']); // dấu "," đang lỗi (đã thấy #ERROR!) -> thử ";" trước
          await sheets.spreadsheets.batchUpdate({ spreadsheetId: LEVEL_SPREADSHEET_ID, resource: { requests: [fmtRequest(sid, 0, { type: 'TEXT' })] } });
        }
      }
      if (await cellIsEmpty(sheets, `${pts}!A2:E2`)) await writeRow2(['comma', 'semi']);
      if (await cellIsEmpty(sheets, `${log}!C2`)) {
        await writeFormulasRobust(sheets, `${log}!C2`, [`=ARRAYFORMULA(IF(B2:B="","",IFERROR(VLOOKUP(B2:B,${lvl}!A:B,2,FALSE),"Không thấy ID")))`], ['comma', 'semi']);
      }
      // "Lịch Sử Dùng Điểm" C2 đang lỗi cú pháp (cùng nguyên nhân dấu ,/;) -> sửa.
      {
        const c2 = await sheets.spreadsheets.values.get({ spreadsheetId: LEVEL_SPREADSHEET_ID, range: `${log}!C2`, valueRenderOption: 'FORMATTED_VALUE' });
        if (hasErr((c2.data.values || [])[0])) {
          await sheets.spreadsheets.values.clear({ spreadsheetId: LEVEL_SPREADSHEET_ID, range: `${log}!C2` });
          await writeFormulasRobust(sheets, `${log}!C2`, [`=ARRAYFORMULA(IF(B2:B="","",IFERROR(VLOOKUP(B2:B,${lvl}!A:B,2,FALSE),"Không thấy ID")))`], ['semi', 'comma']);
        }
      }

      // Định dạng: Discord ID là VĂN BẢN (ID 18-19 số, để dạng số Sheets làm tròn mất chữ số cuối); chỉ làm khi vừa tạo tab.
      if (created.size) {
        const requests = [];
        if (created.has(POINTS_TAB)) {
          const id = ids.get(POINTS_TAB);
          requests.push(fmtRequest(id, 0, { type: 'TEXT' }));
          [2, 3, 4].forEach((c) => requests.push(fmtRequest(id, c, { type: 'NUMBER', pattern: '#,##0.0' })));
          requests.push({ updateSheetProperties: { properties: { sheetId: id, gridProperties: { frozenRowCount: 1 } }, fields: 'gridProperties.frozenRowCount' } });
        }
        if (created.has(LOG_TAB)) {
          const id = ids.get(LOG_TAB);
          requests.push(fmtRequest(id, 0, { type: 'DATE', pattern: 'dd/mm/yyyy' }));
          requests.push(fmtRequest(id, 1, { type: 'TEXT' }));
          requests.push(fmtRequest(id, 4, { type: 'NUMBER', pattern: '#,##0.0' }));
          requests.push({ updateSheetProperties: { properties: { sheetId: id, gridProperties: { frozenRowCount: 1 } }, fields: 'gridProperties.frozenRowCount' } });
        }
        await sheets.spreadsheets.batchUpdate({ spreadsheetId: LEVEL_SPREADSHEET_ID, resource: { requests } });
      }
    },
    { label: 'Tạo tab Điểm Hoạt Động / Lịch Sử Dùng Điểm' },
  );
}

module.exports = { ensureEventPointSheets, _toSemicolon: toSemicolon };
