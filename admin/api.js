// ---- API quản trị cho trang web (Monaris Admin) ----
// Dùng http thuần (không thêm dependency Express) để đỡ đụng cấu trúc hiện
// có — chỉ có 1 http.createServer trong index.js làm health-check, tệp này
// mở rộng thêm route /admin/* trên đúng server đó.
//
// Bảo mật: mọi request /admin/* PHẢI có header
//   Authorization: Bearer <BOT_ADMIN_TOKEN>
// BOT_ADMIN_TOKEN đặt qua biến môi trường trên Railway (tab Variables) (KHÔNG lưu trong code
// /Git). Nếu chưa set biến này, toàn bộ route /admin/* trả về 503 (tắt hẳn,
// coi như tính năng chưa bật) thay vì mở public không mật khẩu.
//
// ===== Điều phối chung =====
// Tệp này giờ chỉ giữ handleAdminRequest() (xác thực token + tra bảng ROUTES +
// bắt lỗi). Logic thật đã tách ra:
//   - httpUtils.js            : readJsonBody / sendJson (đọc body, trả JSON)
//   - scrimHelpers.js         : pushScrimMessage / scrimStatusPayload (dùng cho route scrim)
//   - routes/*.js             : bảng route chia theo nhóm chức năng, mỗi file export
//                               1 object { 'METHOD /admin/...': handler } và được
//                               gộp lại thành ROUTES ngay bên dưới.

const { BOT_ADMIN_TOKEN } = require('../config');
const { readJsonBody, sendJson } = require('./httpUtils');
const { systemRoutes } = require('./routes/routesSystem');
const { contentRoutes } = require('./routes/routesContent');
const { profileRoutes } = require('./routes/routesProfile');
const { knowledgeRoutes } = require('./routes/routesKnowledge');
const { featuresRoutes } = require('./routes/routesFeatures');
const { levelRoutes } = require('./routes/routesLevel');
const { controlRoutes } = require('./control/routes');
const { isConfigured: bangConfigured, proxyToBang } = require('./bangProxy');

const ROUTES = {
  ...systemRoutes,
  ...contentRoutes,
  ...profileRoutes,
  ...knowledgeRoutes,
  ...featuresRoutes,
  ...levelRoutes,
  ...controlRoutes,
};

// ===== Hàng chờ cho các route nặng (ảnh) =====
// Các route dưới đây tải/giải mã/vẽ ảnh hoặc gọi Gemini nên tốn RAM. Cho chạy TUẦN TỰ: người đến sau xếp hàng chờ
// người trước xong. Body của request chờ CHƯA được đọc vào RAM (chỉ đọc khi tới lượt), nên nhiều người gửi cùng lúc
// cũng không làm RAM vọt lên. Request chờ quá lâu / hàng đã đầy thì trả 429 kèm thông báo tiếng Việt để web hiển thị.
const QUEUED_ROUTES = new Set([
  'POST /admin/profile/update', // sharp xử lý ảnh bìa/avatar/nền + upload Cloudinary
  'POST /admin/profile/preview', // vẽ thẻ /hoso hoặc /level
]);
const QUEUE_MAX_WAITING = 5; // tối đa 5 request đứng chờ (chưa kể request đang chạy)
const QUEUE_MAX_WAIT_MS = 2 * 60 * 1000; // chờ tối đa 2 phút

let queueBusy = false;
const queueWaiters = [];

// Trả Promise: resolve khi tới lượt, reject nếu quá hạn chờ. cancel() dùng khi client đã ngắt kết nối lúc đang chờ.
function acquireSlot() {
  if (!queueBusy) {
    queueBusy = true;
    return { promise: Promise.resolve(), cancel: () => {} };
  }
  let waiter;
  const promise = new Promise((resolve, reject) => {
    waiter = { resolve, reject, timer: null };
    waiter.timer = setTimeout(() => {
      const i = queueWaiters.indexOf(waiter);
      if (i >= 0) queueWaiters.splice(i, 1);
      reject(new Error('timeout'));
    }, QUEUE_MAX_WAIT_MS);
    queueWaiters.push(waiter);
  });
  const cancel = () => {
    const i = queueWaiters.indexOf(waiter);
    if (i >= 0) {
      queueWaiters.splice(i, 1);
      clearTimeout(waiter.timer);
      waiter.reject(new Error('cancelled'));
    }
  };
  return { promise, cancel };
}

function releaseSlot() {
  const next = queueWaiters.shift();
  if (next) {
    clearTimeout(next.timer);
    next.resolve(); // trao lượt cho người kế tiếp, queueBusy giữ nguyên true
  } else {
    queueBusy = false;
  }
}

// Cho web hỏi trước khi gửi ảnh: { busy, waiting } để hiện "Bot đang xử lý ảnh cho người trước...".
ROUTES['GET /admin/queue/status'] = async (req, res) => {
  sendJson(res, 200, { busy: queueBusy, waiting: queueWaiters.length, maxWaiting: QUEUE_MAX_WAITING });
};

// Trả về true nếu request đã được xử lý ở đây (index.js không cần xử lý
// tiếp nữa cho request này).
async function handleAdminRequest(req, res, pathname) {
  if (!BOT_ADMIN_TOKEN) {
    sendJson(res, 503, { error: 'Tính năng admin API chưa được bật (thiếu BOT_ADMIN_TOKEN trên server).' });
    return true;
  }

  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token || token !== BOT_ADMIN_TOKEN) {
    sendJson(res, 401, { error: 'Sai hoặc thiếu token xác thực.' });
    return true;
  }

  const key = `${req.method} ${pathname}`;
  const handler = ROUTES[key];
  if (!handler) {
    // Route của phần quản lý bang -> chuyển tiếp sang bot BANG (token đã xác thực ở trên, bot Bang xác thực lại).
    if (bangConfigured()) {
      proxyToBang(req, res);
      return true;
    }
    sendJson(res, 404, { error: 'Không tìm thấy route (và chưa đặt BANG_BOT_URL để chuyển tiếp sang bot Bang).' });
    return true;
  }

  let holdingSlot = false;
  try {
    if (QUEUED_ROUTES.has(key)) {
      if (queueWaiters.length >= QUEUE_MAX_WAITING) {
        sendJson(res, 429, { error: 'Bot đang xử lý ảnh cho người trước và hàng chờ đã đầy. Vui lòng thử lại sau ít phút.' });
        return true;
      }
      const ahead = queueWaiters.length + (queueBusy ? 1 : 0);
      if (ahead > 0) {
        console.log(`[admin/api] ${key} xếp hàng, phía trước còn ${ahead} request.`);
        res.setHeader('X-Queue-Ahead', String(ahead)); // web đọc được số người đã xếp trước (gửi kèm phản hồi cuối)
      }
      const slot = acquireSlot();
      res.on('close', () => {
        if (!holdingSlot) slot.cancel(); // client bỏ đi khi đang chờ -> không làm việc cho người không còn đợi
      });
      try {
        await slot.promise;
      } catch (waitError) {
        if (res.destroyed) return true; // client đã ngắt kết nối khi đang chờ
        sendJson(res, 429, { error: 'Bot đang bận xử lý ảnh cho người trước, chờ quá lâu. Vui lòng thử lại sau ít phút.' });
        return true;
      }
      if (res.destroyed || res.writableEnded) {
        releaseSlot(); // client đã đi mất đúng lúc tới lượt -> trả lượt cho người sau
        return true;
      }
      holdingSlot = true;
    }
    const body = req.method === 'POST' ? await readJsonBody(req) : {};
    await handler(req, res, body);
  } catch (err) {
    console.error(`[admin/api] Lỗi ở ${key}:`, err.message);
    if (!res.headersSent) sendJson(res, 500, { error: err.message || 'Lỗi không xác định.' });
  } finally {
    if (holdingSlot) releaseSlot();
  }
  return true;
}

module.exports = { handleAdminRequest };
