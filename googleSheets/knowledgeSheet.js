// Đọc tab "Kiến thức bang" (KNOWLEDGE_SPREADSHEET_ID) — kho kiến thức game do admin/Bông tự soạn,
// AI chỉ được trả lời kiến thức game dựa trên đây (xem AutoReply/knowledgeBlock.js).
//
// Cấu trúc cột (dòng 1 là header, dòng 2 trở đi là data) — bot CHỈ ĐỌC tab này, người dùng tự sửa trên Sheet:
//   A = Chủ đề      (tên mục, vd "Cửu Linh - build PvP", "Sự kiện Giải Cứu Mỹ Nhân")
//   B = Từ khoá     (các từ/cụm từ để bot nhận ra câu hỏi liên quan, cách nhau bằng dấu phẩy hoặc xuống dòng;
//                    không phân biệt hoa/thường/dấu. Chủ đề cũng tự được tính là từ khoá)
//   C = Nội dung    (kiến thức, viết gọn, đúng sự thật ở phiên bản hiện tại)
//   D = Phiên bản   (tuỳ chọn, vd "1.3.2" — hiện kèm trong prompt để AI biết mốc thời điểm)
//   E = Trạng thái  (tuỳ chọn; để trống = đang bật; ghi "Tắt"/"Off"/"x"/"0" để tạm ẩn mục đó khỏi AI)
//   F = Ảnh         (tuỳ chọn; ID ảnh trong tab RIÊNG "Ảnh Kiến Thức" (không phải "Cây Thư Mục" của /saveimg), cách nhau
//                    bằng dấu phẩy, vd "3, 7". Bot gửi kèm các ảnh này khi trả lời mục đó. Lưu ID chứ không lưu tên để
//                    đổi tên ảnh bằng /renameimg không làm mất liên kết)
//   G = Nhóm        (tuỳ chọn; "nhóm liên kết". Các mục CÙNG nhóm (không phân biệt hoa/thường/dấu) là các phần của 1 chủ đề lớn,
//                    vd A1, A2, A3 cùng ghi nhóm "A". Khi người dùng xem 1 phần, bot gợi ý luôn các phần còn lại theo thứ tự dòng)
//
// Cache trong RAM, tự đọc lại sau KNOWLEDGE_CACHE_TTL_MS (mặc định 5 phút) hoặc khi gọi force — mỗi lần chỉ
// tốn 1 request đọc. Lỗi đọc thì dùng tiếp bản cache cũ (không làm AI hỏng).

const { google } = require('./googleClient');
const { getGoogleAuthClient } = require('./auth');
const status = require('../monitoring/status');
const {
  KNOWLEDGE_SPREADSHEET_ID,
  KNOWLEDGE_SHEET_NAME,
  KNOWLEDGE_CACHE_TTL_MS,
} = require('../config');

const HEADER_ROW = ['Chủ đề', 'Từ khoá', 'Nội dung', 'Phiên bản', 'Trạng thái', 'Ảnh', 'Nhóm'];
const DATA_RANGE = `'${KNOWLEDGE_SHEET_NAME}'!A2:G`;
const DISABLED_PATTERN = /^(tắt|tat|off|no|không|khong|ẩn|an|x|0|false)$/i;

let cache = { entries: [], loadedAt: 0, ok: false };
let pendingLoad = null;

async function getSheetsClient() {
  const authClient = await getGoogleAuthClient();
  if (!authClient) throw new Error('Chưa cấu hình Google Sheets credentials cho bot.');
  return google.sheets({ version: 'v4', auth: authClient });
}

// Tạo tab + header nếu CHƯA có (kèm 1 dòng ví dụ ở trạng thái "Tắt" để admin biết cách điền). Không đụng
// vào dữ liệu đã có.
async function ensureKnowledgeSheetExists() {
  if (!KNOWLEDGE_SPREADSHEET_ID) return;
  const sheets = await getSheetsClient();

  const meta = await sheets.spreadsheets.get({
    spreadsheetId: KNOWLEDGE_SPREADSHEET_ID,
    fields: 'sheets.properties.title',
  });
  const exists = (meta.data.sheets || []).some((sheet) => sheet.properties.title === KNOWLEDGE_SHEET_NAME);

  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: KNOWLEDGE_SPREADSHEET_ID,
      resource: { requests: [{ addSheet: { properties: { title: KNOWLEDGE_SHEET_NAME } } }] },
    });
  }

  const existing = await sheets.spreadsheets.values
    .get({ spreadsheetId: KNOWLEDGE_SPREADSHEET_ID, range: `'${KNOWLEDGE_SHEET_NAME}'!A1:G2` })
    .catch(() => ({ data: {} }));
  const rows = existing.data.values || [];

  if (!rows.length || !rows[0] || !rows[0].length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: KNOWLEDGE_SPREADSHEET_ID,
      range: `'${KNOWLEDGE_SHEET_NAME}'!A1:G2`,
      valueInputOption: 'RAW',
      resource: {
        values: [
          HEADER_ROW,
          [
            'Ví dụ: Tên mục (xoá hoặc sửa dòng này)',
            'từ khoá 1, từ khoá 2, cách gọi khác',
            'Nội dung kiến thức, viết gọn và đúng ở phiên bản hiện tại.',
            '1.0.0',
            'Tắt',
            '',
            '',
          ],
        ],
      },
    });
  } else if (!rows[0][5] || !rows[0][6]) {
    // Tab tạo từ trước khi có cột Ảnh / Nhóm: chỉ bổ sung tiêu đề F1:G1 còn thiếu, không đụng dữ liệu.
    await sheets.spreadsheets.values.update({
      spreadsheetId: KNOWLEDGE_SPREADSHEET_ID,
      range: `'${KNOWLEDGE_SHEET_NAME}'!F1:G1`,
      valueInputOption: 'RAW',
      resource: { values: [[rows[0][5] || HEADER_ROW[5], rows[0][6] || HEADER_ROW[6]]] },
    });
  }
}

function splitKeywords(raw) {
  return String(raw || '')
    .split(/[,;|\n]/)
    .map((k) => k.trim())
    .filter(Boolean);
}

async function fetchEntriesFromSheet() {
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: KNOWLEDGE_SPREADSHEET_ID,
    range: DATA_RANGE,
  });
  const rows = response.data.values || [];
  const entries = [];

  rows.forEach((row, index) => {
    const topic = String(row[0] || '').trim();
    const content = String(row[2] || '').trim();
    if (!content) return; // không có nội dung thì bỏ qua
    if (DISABLED_PATTERN.test(String(row[4] || '').trim())) return;
    entries.push({
      row: index + 2,
      topic: topic || `Mục dòng ${index + 2}`,
      keywords: splitKeywords(row[1]),
      content,
      version: String(row[3] || '').trim(),
      images: splitKeywords(row[5]),
      group: String(row[6] || '').trim(),
    });
  });

  return entries;
}

// Trả về danh sách mục đang bật: [{ row, topic, keywords[], content, version }]. Luôn trả mảng (rỗng nếu
// chưa có gì / chưa cấu hình / lỗi mà chưa từng đọc được).
async function getKnowledgeEntries({ force = false } = {}) {
  if (!KNOWLEDGE_SPREADSHEET_ID) return [];

  const fresh = cache.loadedAt && Date.now() - cache.loadedAt < KNOWLEDGE_CACHE_TTL_MS;
  if (!force && fresh) return cache.entries;

  if (!pendingLoad) {
    pendingLoad = fetchEntriesFromSheet()
      .then((entries) => {
        cache = { entries, loadedAt: Date.now(), ok: true };
        status.recordSheetOk('Kiến thức bang');
      })
      .catch((error) => {
        // Giữ bản cache cũ; vẫn đặt loadedAt để không gọi lại dồn dập khi Sheet đang lỗi/quota.
        cache = { ...cache, loadedAt: Date.now(), ok: false };
        status.recordSheetError('Kiến thức bang', error);
        console.error('[kiến thức] Không đọc được tab "Kiến thức bang":', error.message);
      })
      .finally(() => {
        pendingLoad = null;
      });
  }
  await pendingLoad;
  return cache.entries;
}

function getKnowledgeCacheInfo() {
  return { count: cache.entries.length, loadedAt: cache.loadedAt, ok: cache.ok };
}

// ===== Phần dành cho admin (web Monaris Admin) =====
// Quy ước an toàn: KHÔNG xoá hẳn dòng (sẽ làm lệch số dòng của người đang mở trang khác) mà chỉ xoá nội dung
// 7 ô A:G của dòng đó — dòng trống bị bỏ qua khi đọc. Mọi thao tác sửa/xoá/bật-tắt phải kèm expectedTopic: nếu
// dòng đó giờ là chủ đề khác (có người vừa sửa) thì từ chối bằng lỗi code 'CONFLICT' (route trả 409).

function adminError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeKeyword(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Khoá so sánh nhóm: bỏ dấu/hoa thường ("Cửu Linh" = "cuu linh"). Rỗng = mục không thuộc nhóm nào.
function groupKey(group) {
  return normalizeKeyword(group);
}

// Các phần CÙNG nhóm với `entry` (không gồm chính nó), theo thứ tự dòng trên Sheet (A1, A2, A3...).
// `entries` mặc định là cache hiện tại (chỉ gồm mục đang bật). Mục không có nhóm -> mảng rỗng.
function getSiblingEntries(entry, entries = cache.entries) {
  const key = entry ? groupKey(entry.group) : '';
  if (!key) return [];
  return entries.filter((item) => item.row !== entry.row && groupKey(item.group) === key).sort((a, b) => a.row - b.row);
}

function invalidateKnowledgeCache() {
  cache = { ...cache, loadedAt: 0 };
}

function rowToAdminItem(row, index) {
  const disabledRaw = String(row[4] || '').trim();
  return {
    row: index + 2,
    topic: String(row[0] || '').trim(),
    keywords: splitKeywords(row[1]),
    content: String(row[2] || '').trim(),
    version: String(row[3] || '').trim(),
    images: splitKeywords(row[5]),
    group: String(row[6] || '').trim(),
    enabled: !DISABLED_PATTERN.test(disabledRaw),
  };
}

async function readAllRawRows(sheets) {
  const response = await sheets.spreadsheets.values.get({ spreadsheetId: KNOWLEDGE_SPREADSHEET_ID, range: DATA_RANGE });
  return response.data.values || [];
}

function requireConfigured() {
  if (!KNOWLEDGE_SPREADSHEET_ID) throw adminError('Bot chưa cấu hình spreadsheet cho kho kiến thức.', 'NOT_CONFIGURED');
}

// Cảnh báo cho admin: từ khoá trùng giữa các mục đang bật, mục đang bật mà không có từ khoá.
function buildWarnings(items) {
  const byKeyword = new Map();
  const noKeywords = [];
  for (const item of items) {
    if (!item.enabled) continue;
    if (!item.keywords.length) noKeywords.push({ row: item.row, topic: item.topic });
    const seen = new Set();
    for (const keyword of item.keywords) {
      const key = normalizeKeyword(keyword);
      if (key.length < 2 || seen.has(key)) continue;
      seen.add(key);
      if (!byKeyword.has(key)) byKeyword.set(key, { keyword, rows: [] });
      byKeyword.get(key).rows.push({ row: item.row, topic: item.topic });
    }
  }
  const duplicateKeywords = [...byKeyword.values()].filter((entry) => entry.rows.length > 1);
  // Nhóm chỉ có 1 mục đang bật -> không có phần nào để gợi ý (thường do gõ sai tên nhóm).
  const byGroup = new Map();
  for (const item of items) {
    if (!item.enabled) continue;
    const key = groupKey(item.group);
    if (!key) continue;
    if (!byGroup.has(key)) byGroup.set(key, { group: item.group, rows: [] });
    byGroup.get(key).rows.push({ row: item.row, topic: item.topic });
  }
  const singleGroups = [...byGroup.values()].filter((entry) => entry.rows.length === 1);
  return { duplicateKeywords, noKeywords, singleGroups };
}

// Đọc toàn bộ kho (gồm mục Tắt) kèm số dòng thật trên Sheet. 1 request đọc.
async function listAllRows() {
  requireConfigured();
  const sheets = await getSheetsClient();
  const rows = await readAllRawRows(sheets);
  const items = [];
  rows.forEach((row, index) => {
    const item = rowToAdminItem(row, index);
    if (!item.topic && !item.content && !item.keywords.length) return; // dòng trống / đã xoá
    items.push(item);
  });
  return { items, warnings: buildWarnings(items), loadedAt: Date.now() };
}

function itemToValues(data, enabled, images = data.images, group = data.group) {
  const keywords = Array.isArray(data.keywords) ? data.keywords.join(', ') : String(data.keywords || '');
  const imageIds = Array.isArray(images) ? images.join(', ') : String(images || '');
  return [data.topic, keywords, data.content, data.version || '', enabled ? '' : 'Tắt', imageIds, String(group || '').trim()];
}

// items: [{topic, keywords, content, version?, enabled?}] đã được validate ở route. Ghi 1 lệnh append duy nhất.
// Trả { rows: [số dòng vừa thêm] }.
async function addRows(items) {
  requireConfigured();
  const sheets = await getSheetsClient();
  const existing = (await readAllRawRows(sheets)).map((row) => normalizeKeyword(row[0]));
  const taken = new Set(existing.filter(Boolean));
  for (const item of items) {
    const key = normalizeKeyword(item.topic);
    if (taken.has(key)) throw adminError(`Chủ đề "${item.topic}" đã có trong kho. Hãy sửa mục cũ hoặc đổi tên chủ đề.`, 'DUPLICATE');
    taken.add(key);
  }
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: KNOWLEDGE_SPREADSHEET_ID,
    range: `'${KNOWLEDGE_SHEET_NAME}'!A:G`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: { values: items.map((item) => itemToValues(item, item.enabled !== false)) },
  });
  invalidateKnowledgeCache();
  // updatedRange dạng 'Kiến thức bang'!A12:G14 -> suy ra số dòng.
  const match = /!A(\d+):[A-G](\d+)/.exec((response.data.updates && response.data.updates.updatedRange) || '');
  const rows = match ? Array.from({ length: Number(match[2]) - Number(match[1]) + 1 }, (_, i) => Number(match[1]) + i) : [];
  return { rows };
}

// Đọc đúng 1 dòng và kiểm tra còn đúng chủ đề cũ (chống ghi nhầm khi 2 người cùng sửa).
async function readAndCheckRow(sheets, row, expectedTopic) {
  const rowNumber = Number(row);
  if (!Number.isInteger(rowNumber) || rowNumber < 2) throw adminError('Số dòng không hợp lệ.', 'BAD_ROW');
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: KNOWLEDGE_SPREADSHEET_ID,
    range: `'${KNOWLEDGE_SHEET_NAME}'!A${rowNumber}:G${rowNumber}`,
  });
  const current = (response.data.values || [[]])[0] || [];
  const currentTopic = String(current[0] || '').trim();
  if (currentTopic !== String(expectedTopic || '').trim() || (!currentTopic && !String(current[2] || '').trim())) {
    throw adminError('Mục này vừa bị người khác đổi hoặc xoá. Hãy tải lại danh sách rồi thử lại.', 'CONFLICT');
  }
  return { rowNumber, current };
}

async function updateRow(row, expectedTopic, data) {
  requireConfigured();
  const sheets = await getSheetsClient();
  const { rowNumber, current } = await readAndCheckRow(sheets, row, expectedTopic);
  const enabled = typeof data.enabled === 'boolean' ? data.enabled : !DISABLED_PATTERN.test(String(current[4] || '').trim());
  await sheets.spreadsheets.values.update({
    spreadsheetId: KNOWLEDGE_SPREADSHEET_ID,
    range: `'${KNOWLEDGE_SHEET_NAME}'!A${rowNumber}:G${rowNumber}`,
    valueInputOption: 'RAW',
    // Web cũ không gửi `images` / `group` thì giữ nguyên ảnh (cột F) và nhóm (cột G) đang có (không xoá nhầm).
    resource: {
      values: [
        itemToValues(
          data,
          enabled,
          Array.isArray(data.images) ? data.images : splitKeywords(current[5]),
          typeof data.group === 'string' ? data.group : String(current[6] || '')
        ),
      ],
    },
  });
  invalidateKnowledgeCache();
  return { row: rowNumber };
}

async function deleteRow(row, expectedTopic) {
  requireConfigured();
  const sheets = await getSheetsClient();
  const { rowNumber } = await readAndCheckRow(sheets, row, expectedTopic);
  await sheets.spreadsheets.values.clear({
    spreadsheetId: KNOWLEDGE_SPREADSHEET_ID,
    range: `'${KNOWLEDGE_SHEET_NAME}'!A${rowNumber}:G${rowNumber}`,
  });
  invalidateKnowledgeCache();
  return { row: rowNumber };
}

async function setEnabled(row, expectedTopic, enabled) {
  requireConfigured();
  const sheets = await getSheetsClient();
  const { rowNumber } = await readAndCheckRow(sheets, row, expectedTopic);
  await sheets.spreadsheets.values.update({
    spreadsheetId: KNOWLEDGE_SPREADSHEET_ID,
    range: `'${KNOWLEDGE_SHEET_NAME}'!E${rowNumber}`,
    valueInputOption: 'RAW',
    resource: { values: [[enabled ? '' : 'Tắt']] },
  });
  invalidateKnowledgeCache();
  return { row: rowNumber, enabled };
}

// Ép đọc lại Sheet ngay (bot áp dụng ngay). Trả số mục đang bật.
async function reloadKnowledge() {
  const entries = await getKnowledgeEntries({ force: true });
  return { count: entries.length, ok: cache.ok, loadedAt: cache.loadedAt };
}

module.exports = {
  ensureKnowledgeSheetExists,
  getKnowledgeEntries,
  getKnowledgeCacheInfo,
  getSiblingEntries,
  groupKey,
  listAllRows,
  addRows,
  updateRow,
  deleteRow,
  setEnabled,
  reloadKnowledge,
};
