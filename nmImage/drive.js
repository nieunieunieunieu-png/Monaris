// ===== nmImage/drive.js — upload/tải ảnh từ folder Drive "NM_image" =====
const { google } = require('../googleSheets/googleClient');
const { Readable } = require('stream');
const { getGoogleAuthClient } = require('../googleSheets/auth');
const { NM_IMAGE_DRIVE_FOLDER_ID } = require('../config');

async function getDriveClient() {
  const auth = await getGoogleAuthClient();
  if (!auth) throw new Error('Chưa cấu hình Google credentials cho bot.');
  return google.drive({ version: 'v3', auth });
}

// buffer: Buffer nội dung ảnh (đã tải từ attachment.url). Trả về
// { fileId, link (webViewLink) }. Ném lỗi nếu thiếu quyền ghi vào folder
// (Service Account chưa được share Editor) hoặc lỗi mạng.
async function uploadImageToDrive(buffer, filename, mimeType) {
  if (!NM_IMAGE_DRIVE_FOLDER_ID) throw new Error('Chưa cấu hình NM_IMAGE_DRIVE_FOLDER_ID.');
  const drive = await getDriveClient();

  const response = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [NM_IMAGE_DRIVE_FOLDER_ID],
    },
    media: {
      mimeType: mimeType || 'application/octet-stream',
      body: Readable.from(buffer),
    },
    fields: 'id, webViewLink',
  });

  return { fileId: response.data.id, link: response.data.webViewLink };
}

// Trả về { buffer, name, mimeType }. Ném lỗi nếu fileId không tồn tại/bot
// không có quyền đọc (vd file đã bị xoá thủ công trên Drive).
async function downloadImageFromDrive(fileId) {
  const drive = await getDriveClient();

  const metaResponse = await drive.files.get({ fileId, fields: 'name, mimeType' });
  const contentResponse = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  );

  return {
    buffer: Buffer.from(contentResponse.data),
    name: metaResponse.data.name,
    mimeType: metaResponse.data.mimeType,
  };
}

module.exports = { uploadImageToDrive, downloadImageFromDrive };
