// Ghi nhật ký cho tính năng hỏi kiến thức vào 2 tab của KNOWLEDGE_SPREADSHEET_ID (tự tạo tab + header khi chưa có):
//
//   Tab "Câu hỏi chưa có"  — các câu hỏi bot KHÔNG khớp mục nào trong kho, để Bông biết cần bổ sung chủ đề nào.
//     A = Câu hỏi (dạng người hỏi gõ lần đầu)  B = Số lần hỏi  C = Lần hỏi cuối (ISO)
//     D = Người hỏi gần nhất (Discord ID)       E = Đã xử lý (Bông ghi "x" sau khi đã bổ sung; bot không đụng tới cột này)
//     Câu giống nhau (không phân biệt hoa/thường/dấu/dấu câu) gộp chung 1 dòng và tăng số lần hỏi.
//     Ghi GOM: bot cộng dồn trong RAM rồi ghi 1 lần mỗi MISS_FLUSH_MS để không dồn quota Google Sheets.
//     Restart bot khi chưa kịp ghi thì mất tối đa ~1 phút dữ liệu (không ảnh hưởng gì khác).
//
//   Tab "Góp ý kiến thức"  — góp ý của thành viên khi bấm 👎 ở câu trả lời (ghi ngay, hiếm nên không cần gom).
//     A = Thời gian (ISO)  B = Người góp ý (Discord ID)  C = Chủ đề  D = Phiên bản  E = Câu hỏi  F = Góp ý
//
// Mọi lỗi Sheet chỉ ghi log, không làm hỏng việc trả lời.

const { google } = require('./googleClient');
const { getGoogleAuthClient } = require('./auth');
const status = require('../monitoring/status');
const { KNOWLEDGE_SPREADSHEET_ID } = require('../config');

const MISS_SHEET_NAME = process.env.KNOWLEDGE_MISS_SHEET_NAME || 'Câu hỏi chưa có';
const FEEDBACK_SHEET_NAME = process.env.KNOWLEDGE_FEEDBACK_SHEET_NAME || 'Góp ý kiến thức';
const MISS_HEADER = ['Câu hỏi', 'Số lần hỏi', 'Lần hỏi cuối', 'Người hỏi gần nhất', 'Đã xử lý'];
const FEEDBACK_HEADER = ['Thời gian', 'Người góp ý', 'Chủ đề', 'Phiên bản', 'Câu hỏi', 'Góp ý'];

const MISS_FLUSH_MS = 60 * 1000;
const MISS_MAX_PENDING = 200; // quá mức này thì ghi ngay, không chờ hết giờ
const MISS_MAX_QUESTION_CHARS = 200;
const FEEDBACK_MAX_CHARS = 1000;

const readyTabs = new Set();
let pending = new Map(); // key -> { question, count, userId }
let flushTimer = null;
let flushing = false;

async function getSheetsClient() {
  const authClient = await getGoogleAuthClient();
  if (!authClient) throw new Error('Chưa cấu hình Google Sheets credentials cho bot.');
  return google.sheets({ version: 'v4', auth: authClient });
}

function clip(text, max) {
  const value = String(text || '').trim();
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function normalizeKey(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Tạo tab + header nếu chưa có (chỉ kiểm 1 lần mỗi tab trong 1 lần chạy bot). Không đụng dữ liệu đã có.
async function ensureTab(sheets, title, header) {
  if (readyTabs.has(title)) return;
  const meta = await sheets.spreadsheets.get({ spreadsheetId: KNOWLEDGE_SPREADSHEET_ID, fields: 'sheets.properties.title' });
  const exists = (meta.data.sheets || []).some((sheet) => sheet.properties.title === title);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: KNOWLEDGE_SPREADSHEET_ID,
      resource: { requests: [{ addSheet: { properties: { title } } }] },
    });
  }
  const lastColumn = String.fromCharCode(64 + header.length);
  const current = await sheets.spreadsheets.values
    .get({ spreadsheetId: KNOWLEDGE_SPREADSHEET_ID, range: `'${title}'!A1:${lastColumn}1` })
    .catch(() => ({ data: {} }));
  const firstRow = (current.data.values || [])[0] || [];
  if (!firstRow.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: KNOWLEDGE_SPREADSHEET_ID,
      range: `'${title}'!A1:${lastColumn}1`,
      valueInputOption: 'RAW',
      resource: { values: [header] },
    });
  }
  readyTabs.add(title);
}

// ===== Câu hỏi chưa có =====

async function flushMissedQuestions() {
  if (flushing || !pending.size || !KNOWLEDGE_SPREADSHEET_ID) return;
  flushing = true;
  const batch = pending;
  pending = new Map();
  try {
    const sheets = await getSheetsClient();
    await ensureTab(sheets, MISS_SHEET_NAME, MISS_HEADER);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: KNOWLEDGE_SPREADSHEET_ID,
      range: `'${MISS_SHEET_NAME}'!A2:D`,
    });
    const rows = response.data.values || [];
    const rowByKey = new Map();
    rows.forEach((row, index) => {
      const key = normalizeKey(row[0]);
      if (key && !rowByKey.has(key)) rowByKey.set(key, { row: index + 2, count: Number(row[1]) || 0 });
    });

    const now = new Date().toISOString();
    const updates = [];
    const appends = [];
    for (const [key, item] of batch) {
      const found = rowByKey.get(key);
      if (found) {
        updates.push({
          range: `'${MISS_SHEET_NAME}'!B${found.row}:D${found.row}`,
          values: [[found.count + item.count, now, item.userId]],
        });
      } else {
        appends.push([item.question, item.count, now, item.userId, '']);
      }
    }

    if (updates.length) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: KNOWLEDGE_SPREADSHEET_ID,
        resource: { valueInputOption: 'RAW', data: updates },
      });
    }
    if (appends.length) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: KNOWLEDGE_SPREADSHEET_ID,
        range: `'${MISS_SHEET_NAME}'!A:E`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: { values: appends },
      });
    }
    status.recordSheetOk('Nhật ký kiến thức');
  } catch (error) {
    status.recordSheetError('Nhật ký kiến thức', error);
    console.error('[kiến thức] Không ghi được "Câu hỏi chưa có":', error.message);
    // Trả lại để lần sau thử lại (cộng dồn với dữ liệu mới), nhưng không để phình vô hạn.
    for (const [key, item] of batch) {
      const existing = pending.get(key);
      if (existing) existing.count += item.count;
      else if (pending.size < MISS_MAX_PENDING) pending.set(key, item);
    }
  } finally {
    flushing = false;
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushMissedQuestions().catch(() => {});
  }, MISS_FLUSH_MS);
  if (flushTimer.unref) flushTimer.unref();
}

// Gọi mỗi khi bot không khớp mục nào cho 1 câu hỏi. Không chờ, không ném lỗi.
function logMissedQuestion(question, userId) {
  try {
    if (!KNOWLEDGE_SPREADSHEET_ID) return;
    const key = normalizeKey(question);
    if (key.length < 2) return;
    const existing = pending.get(key);
    if (existing) {
      existing.count += 1;
      existing.userId = String(userId || '');
    } else {
      pending.set(key, { question: clip(question, MISS_MAX_QUESTION_CHARS), count: 1, userId: String(userId || '') });
    }
    if (pending.size >= MISS_MAX_PENDING) flushMissedQuestions().catch(() => {});
    else scheduleFlush();
  } catch (error) {
    console.error('[kiến thức] Lỗi gom câu hỏi chưa có:', error.message);
  }
}

// ===== Góp ý khi bấm 👎 =====

// Trả true nếu ghi được, false nếu lỗi (để bot báo lại cho người góp ý).
async function logKnowledgeFeedback({ userId, topic, version, question, comment }) {
  if (!KNOWLEDGE_SPREADSHEET_ID) return false;
  try {
    const sheets = await getSheetsClient();
    await ensureTab(sheets, FEEDBACK_SHEET_NAME, FEEDBACK_HEADER);
    await sheets.spreadsheets.values.append({
      spreadsheetId: KNOWLEDGE_SPREADSHEET_ID,
      range: `'${FEEDBACK_SHEET_NAME}'!A:F`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [
          [
            new Date().toISOString(),
            String(userId || ''),
            clip(topic, 200),
            clip(version, 30),
            clip(question, MISS_MAX_QUESTION_CHARS),
            clip(comment, FEEDBACK_MAX_CHARS),
          ],
        ],
      },
    });
    status.recordSheetOk('Nhật ký kiến thức');
    return true;
  } catch (error) {
    status.recordSheetError('Nhật ký kiến thức', error);
    console.error('[kiến thức] Không ghi được góp ý:', error.message);
    return false;
  }
}

module.exports = { logMissedQuestion, logKnowledgeFeedback, flushMissedQuestions, FEEDBACK_MAX_CHARS };
