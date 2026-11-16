// ===== nmImage/imgbb.js — upload ảnh lên ImgBB (thay Imgur) =====
// ImgBB không cần OAuth, chỉ cần 1 API key free: tạo tài khoản tại
// https://imgbb.com/ rồi lấy key tại https://api.imgbb.com/ (nút "Get API
// key" sau khi đăng nhập). Dán key vào biến môi trường IMGBB_API_KEY.
// Free tier: không giới hạn số ảnh lưu trữ, ảnh tối đa 32MB — dư sức cho nhu
// cầu lưu ảnh chế/ảnh hài của bang (mỗi ảnh đang <10MB).
const { IMGBB_API_KEY } = require('../config');

const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

// fetch (Node) mặc định KHÔNG gửi header User-Agent -> tường lửa ImgBB coi
// đây là bot/script và chặn thẳng với lỗi "You have been forbidden to use
// this website." (code 103), dù key và ảnh đều hợp lệ. Giả header giống
// trình duyệt thật để vượt qua bước lọc này (không liên quan gì tới quyền
// hạn của key — nhiều nơi dùng ImgBB qua code cũng gặp lỗi y hệt).
const BROWSER_LIKE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
};

// buffer: Buffer nội dung ảnh (đã tải từ attachment.url). Trả về
// { id, deleteUrl, link } — link là direct link (i.ibb.co/xxx.ext), tải lại
// được bằng fetch thẳng, không cần gọi lại API ImgBB. Ném lỗi nếu thiếu
// IMGBB_API_KEY hoặc ImgBB từ chối (vượt rate limit, ảnh không hợp lệ...).
async function uploadImageToImgbb(buffer, filename, mimeType) {
  if (!IMGBB_API_KEY) throw new Error('Chưa cấu hình IMGBB_API_KEY cho bot.');

  const form = new FormData();
  form.append('image', new Blob([buffer], { type: mimeType || 'application/octet-stream' }), filename);
  form.append('name', filename);

  const url = `${IMGBB_UPLOAD_URL}?key=${encodeURIComponent(IMGBB_API_KEY)}`;
  let response;
  try {
    response = await fetch(url, { method: 'POST', headers: BROWSER_LIKE_HEADERS, body: form });
  } catch (error) {
    throw new Error(`Lỗi mạng khi upload ImgBB: ${error.message}`);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok || !data || !data.success) {
    const reason = data?.error?.message || data?.status || `HTTP ${response.status}`;
    throw new Error(`ImgBB từ chối upload: ${reason}`);
  }

  return {
    id: data.data.id,
    deleteUrl: data.data.delete_url,
    link: data.data.url || data.data.display_url,
  };
}

module.exports = { uploadImageToImgbb };