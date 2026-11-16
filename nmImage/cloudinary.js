// ===== nmImage/cloudinary.js — upload ảnh RIÊNG TƯ lên Cloudinary =====
// Khác với ImgBB/Catbox (ai có link cũng xem được), ảnh ở đây upload dạng
// "authenticated" — KHÔNG có link công khai cố định nào để xem/tải. Mỗi lần
// /send_img cần lấy lại ảnh, bot tự ký (bằng CLOUDINARY_API_SECRET, chỉ bot
// giữ) 1 link tải riêng, hết hạn gần như ngay sau đó — không ai đoán ra hay
// truy cập lại được link cũ.
//
// Cần đăng ký tài khoản FREE tại https://cloudinary.com/users/register/free
// (tier free: 25GB lưu trữ), vào Dashboard lấy 3 giá trị: "Cloud name",
// "API Key", "API Secret" — dán vào 3 biến môi trường: CLOUDINARY_CLOUD_NAME,
// CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET (KHÔNG hard-code giá trị thật
// vào code).
const crypto = require('crypto');
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = require('../config');

function assertConfigured() {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error(
      'Chưa cấu hình đủ CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET cho bot.'
    );
  }
}

// Ký tham số theo đúng thuật toán Cloudinary: sort key A-Z, nối "key=value"
// bằng "&" (bỏ qua giá trị rỗng/undefined), nối thêm API secret vào cuối rồi
// SHA1 -> hex. Dùng chung cho cả lúc upload lẫn lúc ký link tải.
function signParams(params) {
  const toSign = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return crypto.createHash('sha1').update(toSign + CLOUDINARY_API_SECRET).digest('hex');
}

function guessFormat(filename) {
  const match = (filename || '').match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : undefined;
}

// buffer: Buffer nội dung ảnh (đã tải từ attachment.url). Trả về
// { id, deleteUrl, link, format }:
//   - id     : public_id trên Cloudinary — dùng làm khoá tra theo ID VÀ để
//              ký lại link tải mỗi lần cần (xem getSignedDownloadUrl).
//   - format : đuôi file gốc (png/jpg/...) — cần truyền lại khi ký link tải.
//   - link   : luôn null, vì ảnh "authenticated" không có link xem trực tiếp
//              cố định (đây chính là điểm riêng tư, khác ImgBB/Catbox).
//   - deleteUrl: luôn null (không dùng ở đây).
// Ném lỗi nếu thiếu cấu hình hoặc Cloudinary từ chối upload.
async function uploadImageToCloudinary(buffer, filename, mimeType, folder = 'nm_image') {
  assertConfigured();

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = { folder, timestamp, type: 'authenticated' };
  const signature = signParams(paramsToSign);

  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mimeType || 'application/octet-stream' }), filename);
  form.append('api_key', CLOUDINARY_API_KEY);
  form.append('timestamp', String(timestamp));
  form.append('type', 'authenticated');
  form.append('folder', folder);
  form.append('signature', signature);

  let response;
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(30000), // tránh treo vô hạn nếu Cloudinary không phản hồi
    });
  } catch (error) {
    throw new Error(`Lỗi mạng khi upload Cloudinary: ${error.name === 'TimeoutError' ? 'quá 30 giây không phản hồi' : error.message}`);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok || !data || !data.public_id) {
    const reason = data?.error?.message || `HTTP ${response.status}`;
    throw new Error(`Cloudinary từ chối upload: ${reason}`);
  }

  return { id: data.public_id, deleteUrl: null, link: null, format: data.format || guessFormat(filename) };
}

// Ký 1 link tải RIÊNG cho ảnh "authenticated" theo public_id (+ format gốc,
// bắt buộc phải đúng format lúc upload thì chữ ký mới khớp) — hết hạn gần
// như ngay lập tức, chỉ bot (giữ CLOUDINARY_API_SECRET) mới tạo lại được.
// Trả về URL string, gọi fetch() vào URL này để lấy bytes ảnh thật.
async function getSignedDownloadUrl(publicId, format) {
  assertConfigured();
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = { format, public_id: publicId, timestamp, type: 'authenticated' };
  const signature = signParams(paramsToSign);

  const qs = new URLSearchParams({
    ...(format ? { format } : {}),
    public_id: publicId,
    timestamp: String(timestamp),
    type: 'authenticated',
    signature,
    api_key: CLOUDINARY_API_KEY,
  });
  return `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/download?${qs.toString()}`;
}

// Xoá 1 ảnh "authenticated" theo public_id (dùng khi người dùng đổi/xoá ảnh hồ sơ để khỏi tốn dung lượng).
// Không ném lỗi — trả true/false (xoá hụt chỉ để lại 1 ảnh mồ côi, không ảnh hưởng gì khác).
async function deleteImageFromCloudinary(publicId) {
  try {
    assertConfigured();
    if (!publicId) return false;
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = signParams({ public_id: publicId, timestamp, type: 'authenticated' });
    const form = new URLSearchParams({
      public_id: publicId,
      timestamp: String(timestamp),
      type: 'authenticated',
      signature,
      api_key: CLOUDINARY_API_KEY,
    });
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`, { method: 'POST', body: form });
    const data = await response.json().catch(() => null);
    return Boolean(response.ok && data && (data.result === 'ok' || data.result === 'not found'));
  } catch (_) {
    return false;
  }
}

module.exports = { uploadImageToCloudinary, getSignedDownloadUrl, deleteImageFromCloudinary };
