const { google } = require('./googleClient');
const { SRC_IMAGE_SPREADSHEET_ID, BANG_SHEET_NAME, UPDATE_PROFILE_SHEET_NAME } = require('../config');
async function ensureCommunitySheets(auth) {
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = SRC_IMAGE_SPREADSHEET_ID;
  const result = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties' });
  const existing = new Set((result.data.sheets || []).map(s => s.properties.title));
  const definitions = [
    [BANG_SHEET_NAME, ['Discord ID', 'Tên Discord', 'Ingame', 'Hệ phái', '', '', '', '', '', '', '', '', '', '', 'Không trong bang']],
    [UPDATE_PROFILE_SHEET_NAME, ['Discord ID', 'Tên người dùng', 'Cập nhật lúc', 'Tên nhân vật', 'Hệ phái']]
  ].filter(([title]) => !existing.has(title));
  if (!definitions.length) return;
  await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: {
    requests: definitions.map(([title]) => ({ addSheet: { properties: { title } } }))
  } });
  await sheets.spreadsheets.values.batchUpdate({ spreadsheetId, requestBody: {
    valueInputOption: 'RAW', data: definitions.map(([title, header]) => ({ range: `'${title.replace(/'/g, "''")}'!A1`, values: [header] }))
  } });
}
module.exports = { ensureCommunitySheets };
