// ===== BcStat sheet: tab Record (Kỷ lục) =====
// Kỷ lục riêng 1 chỗ, sống sót kể cả khi Cumulative bị dọn theo chu kỳ:
// đọc/ghi trạng thái, upsert theo phiên, seed từ Cumulative lần đầu, gộp alias.
//
// QUY TẮC KỶ LỤC (xem bcStatKdHd.js — nơi duy nhất định nghĩa hướng so sánh):
//   - "Trọng thương" (trongThuong): CÀNG NHỎ CÀNG TỐT -> kỷ lục = giá trị NHỎ NHẤT.
//   - 8 hạng mục còn lại: kỷ lục = giá trị LỚN NHẤT.
//   - Ô rỗng/undefined/null = không có dữ liệu -> bỏ qua (KHÔNG coi là 0). Số 0 là giá trị hợp lệ
//     (với Trọng thương, 0 là kỷ lục tốt nhất).
//   - Kỷ lục KD / HD THÔ (lớn nhất qua mọi trận, chưa xét class) lưu ở 4 cột cuối của tab này
//     để không mất khi Cumulative bị dọn; class được áp dụng lúc ghi Summary (bcStatSummary.js).

const {
  BCSTAT_SPREADSHEET_ID,
  BCSTAT_CUMULATIVE_SHEET_NAME,
  BCSTAT_RECORD_SHEET_NAME,
} = require('../config');
const {
  CATEGORIES,
  CUMULATIVE_HEADER,
  RECORD_HEADER,
  RECORD_KDHD_COL,
  getSheetsClient,
  colLetter,
  normalizeName,
} = require('./bcStatShared');
const { assertValidMatchLabel } = require('./bcStatMatchLabel');
const { toNumberOrNull, isBetterRecord, calcMatchKd, calcMatchHd, calcMatchTd } = require('./bcStatKdHd');

// Entry rỗng cho 1 người: records (9 hạng mục) + kdhd (kỷ lục KD/HD thô).
function newRecordEntry(displayName) {
  const records = {};
  CATEGORIES.forEach((cat) => {
    records[cat.key] = { value: '', matchLabel: '' };
  });
  return {
    displayName,
    records,
    kdhd: { kd: { value: '', matchLabel: '' }, hd: { value: '', matchLabel: '' }, td: { value: '', matchLabel: '' } },
  };
}

// Áp 1 trận (values thô của người đó ở trận có nhãn matchLabel) vào entry:
//  - 9 hạng mục: so theo hướng riêng từng hạng mục (isBetterRecord: Trọng thương nhỏ hơn mới phá kỷ lục,
//    còn lại lớn hơn mới phá). Hạng mục rỗng/không có trong trận -> bỏ qua.
//  - KD = giet / trongThuong, HD = triLieu / trongThuong, TD = chongChiu / trongThuong TÍNH TỪ CÙNG 1 TRẬN (trongThuong = 0 -> chia 1;
//    trận thiếu giet/triLieu hoặc thiếu trongThuong -> bỏ qua); kỷ lục = lớn nhất.
function applyMatchToEntry(entry, values, matchLabel) {
  const v = values || {};
  CATEGORIES.forEach((cat) => {
    const score = toNumberOrNull(v[cat.key]);
    if (score === null) return;
    if (isBetterRecord(cat.key, score, entry.records[cat.key].value)) {
      entry.records[cat.key] = { value: score, matchLabel };
    }
  });
  const kd = calcMatchKd(v);
  if (kd !== null && (entry.kdhd.kd.value === '' || kd > entry.kdhd.kd.value)) {
    entry.kdhd.kd = { value: kd, matchLabel };
  }
  const hd = calcMatchHd(v);
  if (hd !== null && (entry.kdhd.hd.value === '' || hd > entry.kdhd.hd.value)) {
    entry.kdhd.hd = { value: hd, matchLabel };
  }
  const td = calcMatchTd(v);
  if (td !== null && (entry.kdhd.td.value === '' || td > entry.kdhd.td.value)) {
    entry.kdhd.td = { value: td, matchLabel };
  }
}

// Đọc toàn bộ tab Record hiện có -> Map(normalizedName -> {displayName,
// records: {catKey: {value, matchLabel}}, kdhd: {kd, hd}}) — dùng chung bởi updateRecords(),
// mergeRecordsAlias() bên dưới. UNFORMATTED_VALUE: số thập phân (KD/HD) không bị Sheets trả
// về dạng chuỗi theo locale ("12,5") làm Number() ra NaN.
async function readRecordState(sheets) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: BCSTAT_SPREADSHEET_ID,
    range: `'${BCSTAT_RECORD_SHEET_NAME}'!A2:${colLetter(RECORD_HEADER.length - 1)}`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });
  const rows = response.data.values || [];
  const state = new Map();
  rows.forEach((row) => {
    const name = String(row[0] === undefined || row[0] === null ? '' : row[0]).trim();
    if (!name) return;
    const entry = newRecordEntry(name);
    CATEGORIES.forEach((cat, idx) => {
      const valCol = 1 + idx * 2;
      const n = toNumberOrNull(row[valCol]);
      entry.records[cat.key] = {
        value: n === null ? '' : n,
        matchLabel: row[valCol + 1] || '',
      };
    });
    const kd = toNumberOrNull(row[RECORD_KDHD_COL]);
    const hd = toNumberOrNull(row[RECORD_KDHD_COL + 2]);
    const td = toNumberOrNull(row[RECORD_KDHD_COL + 4]);
    entry.kdhd = {
      kd: { value: kd === null ? '' : kd, matchLabel: row[RECORD_KDHD_COL + 1] || '' },
      hd: { value: hd === null ? '' : hd, matchLabel: row[RECORD_KDHD_COL + 3] || '' },
      td: { value: td === null ? '' : td, matchLabel: row[RECORD_KDHD_COL + 5] || '' },
    };
    state.set(normalizeName(name), entry);
  });
  return state;
}

// Ghi đè (clear + rewrite) toàn bộ tab Record từ 1 Map state (normalizedName
// -> {displayName, records, kdhd}). Luôn ghi lại header (nên header cũ tự được nâng lên 4 cột KD/HD).
async function writeRecordState(sheets, state) {
  const cellOf = (r) => (!r || r.value === '' || r.value === undefined || r.value === null ? '' : r.value);
  const outRows = [...state.values()].map((entry) => {
    const cells = [];
    CATEGORIES.forEach((cat) => {
      const r = entry.records[cat.key] || { value: '', matchLabel: '' };
      cells.push(cellOf(r), r.matchLabel || '');
    });
    const kdhd = entry.kdhd || {};
    cells.push(
      cellOf(kdhd.kd), (kdhd.kd && kdhd.kd.matchLabel) || '',
      cellOf(kdhd.hd), (kdhd.hd && kdhd.hd.matchLabel) || '',
      cellOf(kdhd.td), (kdhd.td && kdhd.td.matchLabel) || ''
    );
    return [entry.displayName, ...cells];
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: BCSTAT_SPREADSHEET_ID,
    range: `'${BCSTAT_RECORD_SHEET_NAME}'!A1`,
    valueInputOption: 'RAW',
    resource: { values: [RECORD_HEADER] },
  });

  await sheets.spreadsheets.values.clear({
    spreadsheetId: BCSTAT_SPREADSHEET_ID,
    range: `'${BCSTAT_RECORD_SHEET_NAME}'!A2:${colLetter(RECORD_HEADER.length - 1)}`,
  });
  if (outRows.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: BCSTAT_SPREADSHEET_ID,
      range: `'${BCSTAT_RECORD_SHEET_NAME}'!A2`,
      valueInputOption: 'RAW',
      resource: { values: outRows },
    });
  }
}

// Đọc các dòng Cumulative (1 dòng/(người, trận)) -> [{ name, matchLabel, values: {catKey: number|''} }].
async function readCumulativeRows(sheets) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: BCSTAT_SPREADSHEET_ID,
    range: `'${BCSTAT_CUMULATIVE_SHEET_NAME}'!A2:${colLetter(CUMULATIVE_HEADER.length - 1)}`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });
  const out = [];
  (response.data.values || []).forEach((row) => {
    const name = String(row[0] === undefined || row[0] === null ? '' : row[0]).trim();
    const matchLabel = String(row[1] === undefined || row[1] === null ? '' : row[1]).trim();
    if (!name || !matchLabel) return;
    const values = {};
    CATEGORIES.forEach((cat, idx) => {
      const n = toNumberOrNull(row[2 + idx]); // ô rỗng -> null -> KHÔNG phải 0
      values[cat.key] = n === null ? '' : n;
    });
    out.push({ name, matchLabel, values });
  });
  return out;
}

// combined: Map(normalizedName -> {displayName, values: {catKey: number}}) —
// CÙNG dữ liệu 1 phiên vừa ghi (đã áp alias). Với MỖI người/hạng mục CÓ giá
// trị trong phiên này: so giá trị THÔ với Kỷ lục đang lưu — TỐT HƠN mới ghi
// đè (kèm nhãn trận vừa lưu): Trọng thương NHỎ hơn là tốt hơn, hạng mục khác
// LỚN hơn là tốt hơn (xem applyMatchToEntry). Kỷ lục = số liệu tốt nhất từng
// đạt được, KHÔNG cộng/trừ gì thêm. renameFromLabel (tuỳ chọn, từ nút "✏️ Sửa
// trận đã lưu"): đổi lại nhãn trận đã lưu trong cột "Trận đạt" cho MỌI kỷ lục
// đang trỏ tới nhãn cũ đó, để không bị lệch tên trận sau khi sửa.
// KD/HD: 1 trận có thể được lưu qua NHIỀU phiên (mỗi phiên vài tab) nên KD/HD
// phải tính từ số liệu ĐÃ GỘP của trận đó trong Cumulative (updateCumulative đã
// chạy ngay trước), không chỉ từ phiên này — lỗi đọc Cumulative thì dùng riêng phiên này.
async function updateRecords(combined, matchLabel, renameFromLabel) {
  if (!combined || !combined.size) return;
  const label = assertValidMatchLabel(matchLabel);
  const labelKey = normalizeName(label);
  const sheets = await getSheetsClient();
  const state = await readRecordState(sheets);

  if (renameFromLabel) {
    const renameFromKey = normalizeName(renameFromLabel);
    state.forEach((entry) => {
      const refs = [
        ...CATEGORIES.map((cat) => entry.records[cat.key]),
        entry.kdhd && entry.kdhd.kd,
        entry.kdhd && entry.kdhd.hd,
        entry.kdhd && entry.kdhd.td,
      ];
      refs.forEach((r) => {
        if (r && r.matchLabel && normalizeName(r.matchLabel) === renameFromKey) {
          r.matchLabel = label;
        }
      });
    });
  }

  // Số liệu đã gộp của đúng trận này trong Cumulative: playerKey -> values.
  const mergedByPlayer = new Map();
  try {
    const cumRows = await readCumulativeRows(sheets);
    cumRows.forEach((r) => {
      if (normalizeName(r.matchLabel) === labelKey) mergedByPlayer.set(normalizeName(r.name), r.values);
    });
  } catch (error) {
    console.error('Không đọc được Cumulative để tính KD/HD (dùng riêng số liệu phiên này):', error.message);
  }

  combined.forEach((entry, key) => {
    let existing = state.get(key);
    if (!existing) {
      existing = newRecordEntry(entry.displayName);
      state.set(key, existing);
    }
    existing.displayName = entry.displayName;
    // Số liệu trận = bản đã gộp trong Cumulative, phiên vừa lưu (mới nhất) ghi đè lên.
    const matchValues = { ...(mergedByPlayer.get(key) || {}) };
    CATEGORIES.forEach((cat) => {
      if (toNumberOrNull(entry.values[cat.key]) !== null) matchValues[cat.key] = entry.values[cat.key];
    });
    applyMatchToEntry(existing, matchValues, label);
  });

  await writeRecordState(sheets, state);
}

// Gộp các dòng Cumulative (mỗi dòng = 1 trận của 1 người) vào state sẵn có.
function mergeCumulativeRowsIntoState(state, cumRows) {
  cumRows.forEach((r) => {
    const key = normalizeName(r.name);
    if (!state.has(key)) state.set(key, newRecordEntry(r.name));
    applyMatchToEntry(state.get(key), r.values, r.matchLabel);
  });
}

// Chạy 1 LẦN DUY NHẤT khi tab Record vừa được tạo (chưa từng có) — quét lại
// TOÀN BỘ Cumulative hiện có để tính Kỷ lục ban đầu (gồm cả KD/HD, Trọng thương = nhỏ nhất),
// tránh Summary hiển thị trống trơn ngay sau khi nâng cấp lên hệ thống Record tách riêng.
async function seedRecordsFromCumulative(sheets) {
  const state = new Map();
  mergeCumulativeRowsIntoState(state, await readCumulativeRows(sheets));
  await writeRecordState(sheets, state);
}

// Nâng cấp tab Record ĐÃ CÓ từ định dạng cũ (chưa có đủ 6 cột KD/HD/TD, Trọng thương lưu kiểu "lớn nhất")
// sang định dạng mới — chạy 1 LẦN (nhận biết bằng header; sau lần ghi đầu tiên header đã đủ cột nên
// lần khởi động sau bỏ qua). Gộp Cumulative HIỆN CÓ vào Record: điền KD/HD và hạ Trọng thương xuống
// giá trị nhỏ nhất nếu Cumulative có giá trị nhỏ hơn. Dữ liệu của các chu kỳ ĐÃ XUẤT (không còn trong
// Sheet) thì không khôi phục được ở đây.
async function ensureRecordKdHdColumns(sheets) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: BCSTAT_SPREADSHEET_ID,
    range: `'${BCSTAT_RECORD_SHEET_NAME}'!A1:${colLetter(RECORD_HEADER.length - 1)}1`,
  });
  const header = (response.data.values && response.data.values[0]) || [];
  if (header[RECORD_HEADER.length - 1] === RECORD_HEADER[RECORD_HEADER.length - 1]) return false; // đã đủ cột KD/HD/TD (so cột CUỐI)
  const state = await readRecordState(sheets);
  mergeCumulativeRowsIntoState(state, await readCumulativeRows(sheets));
  await writeRecordState(sheets, state);
  return true;
}

// Nút "🧮 Tính lại kỷ lục" trên web: dùng sau khi Bông đã SỬA số liệu từng trận (trang chi tiết / ✏️ Sửa trận đã lưu)
// mà Kỷ lục vẫn giữ số sai cũ (kỷ lục chỉ nhận số tốt hơn, không tự hạ xuống). KHÔNG xoá số liệu trận nào:
//  1. Ô Kỷ lục (9 hạng mục + KD/HD/TD) nào đang ghi "Trận đạt" = 1 trận CÒN trong Cumulative -> xoá trắng ô đó
//     (vì số của trận đó có thể đã sai/đã sửa).
//  2. Gộp lại TOÀN BỘ Cumulative (đã là số đúng sau khi sửa) -> ô vừa xoá được điền lại bằng số tốt nhất thật sự.
// Ô có "Trận đạt" là trận KHÔNG còn trong Cumulative (chu kỳ đã xuất) thì giữ nguyên, không đụng tới.
// Trả về { matchRows, playerCount, clearedRecords } — chưa ghi Summary (route gọi computeAndWriteSummary sau).
async function recalcKdHdRecords() {
  const sheets = await getSheetsClient();
  const state = await readRecordState(sheets);
  const cumRows = await readCumulativeRows(sheets);
  const liveLabelKeys = new Set(cumRows.map((r) => normalizeName(r.matchLabel)));
  let clearedRecords = 0;
  state.forEach((entry) => {
    const refs = [
      ...CATEGORIES.map((cat) => entry.records[cat.key]),
      entry.kdhd && entry.kdhd.kd,
      entry.kdhd && entry.kdhd.hd,
      entry.kdhd && entry.kdhd.td,
    ];
    refs.forEach((r) => {
      if (r && r.matchLabel && liveLabelKeys.has(normalizeName(r.matchLabel))) {
        r.value = '';
        r.matchLabel = '';
        clearedRecords += 1;
      }
    });
  });
  mergeCumulativeRowsIntoState(state, cumRows);
  await writeRecordState(sheets, state);
  return { matchRows: cumRows.length, playerCount: state.size, clearedRecords };
}

// Gộp Kỷ lục của "rawKey" (tên gõ sai) vào "canonicalKey" (tên chuẩn) khi
// Bông xác nhận gộp tên (mergeUnmatchedAlias bên dưới) — giữ giá trị Kỷ lục
// TỐT HƠN giữa 2 bên cho từng hạng mục (Trọng thương: nhỏ hơn; còn lại: lớn hơn; KD/HD: lớn hơn),
// rồi xoá hẳn dòng rawKey.
async function mergeRecordsAlias(sheets, rawKey, canonicalKey, canonicalName) {
  const state = await readRecordState(sheets);
  const rawEntry = state.get(rawKey);
  if (!rawEntry) return; // không có Kỷ lục nào của tên gõ sai — không có gì để gộp

  let canonicalEntry = state.get(canonicalKey);
  if (!canonicalEntry) {
    canonicalEntry = newRecordEntry(canonicalName);
    state.set(canonicalKey, canonicalEntry);
  }
  CATEGORIES.forEach((cat) => {
    const rawRec = rawEntry.records[cat.key];
    const canRec = canonicalEntry.records[cat.key];
    if (isBetterRecord(cat.key, rawRec.value, canRec.value)) {
      canonicalEntry.records[cat.key] = { value: rawRec.value, matchLabel: rawRec.matchLabel };
    }
  });
  ['kd', 'hd', 'td'].forEach((k) => {
    const rawRec = rawEntry.kdhd[k];
    const canRec = canonicalEntry.kdhd[k];
    if (rawRec.value !== '' && (canRec.value === '' || rawRec.value > canRec.value)) {
      canonicalEntry.kdhd[k] = { value: rawRec.value, matchLabel: rawRec.matchLabel };
    }
  });
  canonicalEntry.displayName = canonicalName;
  state.delete(rawKey);

  await writeRecordState(sheets, state);
}

module.exports = {
  readRecordState,
  updateRecords,
  seedRecordsFromCumulative,
  ensureRecordKdHdColumns,
  mergeRecordsAlias,
  recalcKdHdRecords,
};
