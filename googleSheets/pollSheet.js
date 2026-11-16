// Lưu kết quả mon!poll vào sheet POLL_SPREADSHEET_ID — MỖI POLL 1 TAB, tên tab = tiêu đề poll.
// Cột: A Cập nhật lúc | B ID tin poll | C Câu hỏi | D Đáp án | E Discord ID | F Tên hiển thị | G Ingame | H Hệ phái
// Mỗi dòng = 1 người x 1 đáp án. Chạy lại mon!poll cho CÙNG tin poll = ghi đè tab của poll đó.
// Discord ID / ID tin ghi dạng CHỮ (RAW, kèm dấu ') để Sheets không làm tròn số 18-19 chữ số.

const { google } = require('./googleClient');
const { getGoogleAuthClient } = require('./auth');
const { POLL_SPREADSHEET_ID } = require('../config');
const { recordSheetOk, recordSheetError } = require('../monitoring/status');

const HEADER = ['Cập nhật lúc', 'ID tin poll', 'Câu hỏi', 'Đáp án', 'Discord ID', 'Tên hiển thị', 'Ingame', 'Hệ phái'];
const LAST_COL = 'H';
const STATUS_SOURCE = 'Poll';

async function getSheetsClient() {
  const auth = await getGoogleAuthClient();
  if (!auth) throw new Error('Chưa cấu hình Google Sheets credentials cho bot.');
  return google.sheets({ version: 'v4', auth });
}

// Mỗi poll 1 tab, tên tab = tiêu đề poll (bỏ ký tự Sheets cấm, tối đa 100 ký tự). Trùng tên với poll KHÁC -> thêm 6 số cuối ID tin.
function tabNameFor(question, pollMessageId) {
  const base = String(question || '').replace(/[\[\]*?:/\\]/g, ' ').replace(/\s+/g, ' ').trim().replace(/^'+|'+$/g, '');
  return (base || `Poll ${pollMessageId}`).slice(0, 100);
}

const text = (v) => `'${String(v ?? '')}`; // giữ nguyên số ID dài, không bị Sheets làm tròn

// rows: [{ answer, discordId, displayName, ingame, className }]
async function savePollRows({ pollMessageId, question, rows }) {
  try {
    const sheets = await getSheetsClient();
    const meta = await sheets.spreadsheets.get({ spreadsheetId: POLL_SPREADSHEET_ID, fields: 'sheets.properties(sheetId,title)' });
    const tabs = (meta.data.sheets || []).map((s) => s.properties);

    // Tab của poll này: tìm theo ID tin ở ô B2; chưa có thì tạo mới theo tiêu đề.
    let tab = null;
    for (const t of tabs) {
      const probe = await sheets.spreadsheets.values.get({ spreadsheetId: POLL_SPREADSHEET_ID, range: `'${t.title}'!B2`, valueRenderOption: 'FORMATTED_VALUE' }).catch(() => null);
      if (String(probe?.data?.values?.[0]?.[0] || '').replace(/'/g, '') === String(pollMessageId)) { tab = t; break; }
    }
    let title = tabNameFor(question, pollMessageId);
    if (!tab) {
      if (tabs.some((t) => t.title === title)) title = `${title.slice(0, 92)} ${String(pollMessageId).slice(-6)}`;
      const res = await sheets.spreadsheets.batchUpdate({
        spreadsheetId: POLL_SPREADSHEET_ID,
        resource: { requests: [{ addSheet: { properties: { title, gridProperties: { frozenRowCount: 1 } } } }] },
      });
      tab = res.data.replies[0].addSheet.properties;
    }

    const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });
    const all = [HEADER, ...rows.map((r) => [now, text(pollMessageId), question, r.answer, text(r.discordId), r.displayName || '', r.ingame || '', r.className || ''])];

    await sheets.spreadsheets.values.clear({ spreadsheetId: POLL_SPREADSHEET_ID, range: `'${tab.title}'!A:${LAST_COL}` });
    await sheets.spreadsheets.values.update({
      spreadsheetId: POLL_SPREADSHEET_ID,
      range: `'${tab.title}'!A1:${LAST_COL}${all.length}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: all },
    });
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: POLL_SPREADSHEET_ID,
      resource: { requests: [{ setBasicFilter: { filter: { range: { sheetId: tab.sheetId, startRowIndex: 0, endRowIndex: all.length, startColumnIndex: 0, endColumnIndex: HEADER.length } } } }] },
    });
    recordSheetOk(STATUS_SOURCE);
    return { saved: rows.length, tab: tab.title };
  } catch (error) {
    recordSheetError(STATUS_SOURCE, error);
    throw error;
  }
}

module.exports = { savePollRows };
