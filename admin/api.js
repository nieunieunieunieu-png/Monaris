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
const { knowledgeRoutes } = require('./routes/routesKnowledge');
const { featuresRoutes } = require('./routes/routesFeatures');
const { controlRoutes } = require('./control/routes');
const { isConfigured: bangConfigured, proxyToBang } = require('./bangProxy');

const ROUTES = {
  ...systemRoutes,
  ...contentRoutes,
  ...knowledgeRoutes,
  ...featuresRoutes,
  ...controlRoutes,
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

  try {
    const body = req.method === 'POST' ? await readJsonBody(req) : {};
    await handler(req, res, body);
  } catch (err) {
    console.error(`[admin/api] Lỗi ở ${key}:`, err.message);
    if (!res.headersSent) sendJson(res, 500, { error: err.message || 'Lỗi không xác định.' });
  }
  return true;
}

module.exports = { handleAdminRequest };
