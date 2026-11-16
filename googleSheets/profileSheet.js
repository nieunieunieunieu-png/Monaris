// ===== googleSheets/profileSheet.js — tab "Hồ Sơ Cá Nhân" (cùng spreadsheet với kho ảnh NM_IMAGE) =====
// 1 dòng / 1 người, cột A-F:
//   A Discord ID | B Biệt Danh | C Ảnh Bìa (Cloudinary ID, đã xử lý 934x315 JPG) | D Avatar (Cloudinary ID, đã xử lý 256x256 PNG) | E Cập Nhật (giờ VN)
//   F Ảnh Nền Hồ Sơ (Cloudinary ID, đã xử lý 934x700 JPG — nền phần thân thẻ /hoso, dưới ảnh bìa)
//   G Màu Chữ Gradient ("#rrggbb,#rrggbb[,#rrggbb]" — màu Nickname / Ingame / Danh Hiệu; trống = theo bậc cấp)
//   I Hiện Tri Kỷ trên thẻ /hoso ("1" = hiện; trống/0 = ẩn)
//   J Cho Người Khác Xem Hồ Sơ ("0" = chỉ mình xem; trống/1 = cho xem)
//   K Ẩn Role Top ("1" = người này TẮT role Top tuần/tháng trên Discord để giữ màu role mình chọn; trống/0 = nhận role bình thường)
//   H Khung Thẻ ("colors=congnghe,crest=tutien" — id phong cách cho từng phần khung /hoso; trống = khung mặc định; xem hoso/frame/choice.js)
// Chỉ lưu ID tham chiếu; ảnh thật nằm ở Cloudinary (riêng tư, xem nmImage/cloudinary.js).
const { google } = require('./googleClient');
const { getGoogleAuthClient } = require('./auth');
const { NM_IMAGE_SPREADSHEET_ID, PROFILE_SHEET_NAME } = require('../config');

const HEADER = ['Discord ID', 'Biệt Danh', 'Ảnh Bìa (Cloudinary ID)', 'Avatar (Cloudinary ID)', 'Cập Nhật', 'Ảnh Nền Hồ Sơ (Cloudinary ID)', 'Màu Chữ Gradient', 'Khung Thẻ', 'Hiện Tri Kỷ', 'Cho Người Khác Xem', 'Ẩn Role Top'];

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

async function ensureProfileSheet() {
  if (!NM_IMAGE_SPREADSHEET_ID) return;
  const sheets = await getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: NM_IMAGE_SPREADSHEET_ID });
  const exists = (meta.data.sheets || []).some((s) => s.properties.title === PROFILE_SHEET_NAME);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: NM_IMAGE_SPREADSHEET_ID,
      resource: { requests: [{ addSheet: { properties: { title: PROFILE_SHEET_NAME } } }] },
    });
  }
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: NM_IMAGE_SPREADSHEET_ID, range: `'${PROFILE_SHEET_NAME}'!A1:K1` });
  const current = (res.data.values || [])[0] || [];
  if (HEADER.length !== current.length || HEADER.some((h, i) => String(current[i] || '') !== h)) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: NM_IMAGE_SPREADSHEET_ID,
      range: `'${PROFILE_SHEET_NAME}'!A1:K1`,
      valueInputOption: 'RAW',
      resource: { values: [HEADER] },
    });
  }
}

// Map<discordId, { id, nickname, coverId, avatarId, bgId, gradient, frame, showTriKy, allowView, hideTopRole }>; null nếu đọc lỗi (phía gọi giữ bản cũ).
async function loadAllProfiles() {
  if (!NM_IMAGE_SPREADSHEET_ID) return new Map();
  try {
    const sheets = await getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: NM_IMAGE_SPREADSHEET_ID,
      range: `'${PROFILE_SHEET_NAME}'!A2:K`,
      valueRenderOption: 'FORMATTED_VALUE', // giữ Discord ID dạng chuỗi
    });
    const map = new Map();
    for (const row of res.data.values || []) {
      const id = String(row[0] || '').trim();
      if (!/^\d{17,20}$/.test(id)) continue;
      map.set(id, {
        id,
        nickname: String(row[1] || '').trim(),
        coverId: String(row[2] || '').trim(),
        avatarId: String(row[3] || '').trim(),
        bgId: String(row[5] || '').trim(),
        gradient: String(row[6] || '').trim(),
        frame: String(row[7] || '').trim(),
        showTriKy: String(row[8] || '').trim() === '1',
        allowView: String(row[9] || '').trim() !== '0',
        hideTopRole: String(row[10] || '').trim() === '1',
      });
    }
    return map;
  } catch (error) {
    console.error('[profile] Không đọc được tab Hồ Sơ Cá Nhân:', error.message);
    return null;
  }
}

// patch: { nickname?, coverId?, avatarId?, bgId?, gradient?, frame? } — field nào undefined thì giữ nguyên, '' = xoá. Ném lỗi nếu ghi không được.
async function upsertProfile(userId, patch) {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: NM_IMAGE_SPREADSHEET_ID,
    range: `'${PROFILE_SHEET_NAME}'!A2:K`,
    valueRenderOption: 'FORMATTED_VALUE',
  });
  const rows = res.data.values || [];
  const idx = rows.findIndex((r) => String(r[0] || '').trim() === userId);
  const old = idx >= 0 ? rows[idx] : [];
  const pick = (v, i) => (v === undefined ? String(old[i] || '') : v);
  // Cờ bật/tắt: lưu '1'/'0'; không đổi thì giữ ô cũ (ô trống = mặc định def).
  const flag = (v, i, def) => (v === undefined ? (String(old[i] || '').trim() === '' ? (def ? '1' : '0') : String(old[i]).trim()) : v ? '1' : '0');
  const row = [userId, pick(patch.nickname, 1), pick(patch.coverId, 2), pick(patch.avatarId, 3), vnTimeString(), pick(patch.bgId, 5), pick(patch.gradient, 6), pick(patch.frame, 7), flag(patch.showTriKy, 8, false), flag(patch.allowView, 9, true), flag(patch.hideTopRole, 10, false)];
  if (idx >= 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: NM_IMAGE_SPREADSHEET_ID,
      range: `'${PROFILE_SHEET_NAME}'!A${idx + 2}:K${idx + 2}`,
      valueInputOption: 'RAW',
      resource: { values: [row] },
    });
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId: NM_IMAGE_SPREADSHEET_ID,
      range: `'${PROFILE_SHEET_NAME}'!A:K`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: { values: [row] },
    });
  }
  return { id: userId, nickname: row[1], coverId: row[2], avatarId: row[3], bgId: row[5], gradient: row[6], frame: row[7], showTriKy: row[8] === '1', allowView: row[9] !== '0', hideTopRole: row[10] === '1' };
}

module.exports = { ensureProfileSheet, loadAllProfiles, upsertProfile };
