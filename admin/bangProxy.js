// ===== admin/bangProxy.js — nối bot gốc với bot BANG =====
// Web Monaris Admin chỉ biết 1 địa chỉ bot (bot gốc). Route /admin/* nào bot gốc không có (scrim, bcstat, thí kiếm, role team,
// chọn số, pick role, broadcast, ảnh đội hình, voice/lịch…) được CHUYỂN TIẾP nguyên văn (method, header Authorization, body)
// sang bot BANG (ENV BANG_BOT_URL). Không cần sửa web.
const http = require('http');
const https = require('https');
const { BANG_BOT_URL, BOT_ADMIN_TOKEN } = require('../config');
const { sendJson } = require('./httpUtils');

function isConfigured() {
  return Boolean(BANG_BOT_URL);
}

// Pipe nguyên request -> bot Bang -> response. Body chưa bị đọc ở bot gốc nên pipe được thẳng (kể cả upload ảnh lớn).
function proxyToBang(req, res) {
  let target;
  try {
    target = new URL(req.url, BANG_BOT_URL.endsWith('/') ? BANG_BOT_URL : `${BANG_BOT_URL}/`);
  } catch (_) {
    return sendJson(res, 502, { error: 'BANG_BOT_URL không hợp lệ.' });
  }
  const lib = target.protocol === 'https:' ? https : http;
  const headers = { ...req.headers, host: target.host };
  const upstream = lib.request(
    { protocol: target.protocol, hostname: target.hostname, port: target.port || undefined, path: target.pathname + target.search, method: req.method, headers, timeout: 5 * 60 * 1000 },
    (upRes) => {
      res.writeHead(upRes.statusCode || 502, upRes.headers);
      upRes.pipe(res);
    }
  );
  upstream.on('timeout', () => upstream.destroy(new Error('timeout')));
  upstream.on('error', (error) => {
    console.error(`[bangProxy] ${req.method} ${req.url} lỗi:`, error.message);
    if (!res.headersSent) sendJson(res, 502, { error: 'Không kết nối được bot Bang (kiểm tra BANG_BOT_URL / bot Bang đang chạy).' });
    else res.destroy();
  });
  req.on('aborted', () => upstream.destroy());
  req.pipe(upstream);
}

// Gọi bot Bang từ chính bot gốc (không qua request của web). Trả JSON hoặc null nếu lỗi/không cấu hình.
async function bangFetchJson(method, path, body) {
  if (!isConfigured()) return null;
  try {
    const res = await fetch(`${BANG_BOT_URL.replace(/\/+$/, '')}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${BOT_ADMIN_TOKEN}` },
      body: method === 'POST' ? JSON.stringify(body || {}) : undefined,
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(`[bangProxy] Gọi bot Bang ${path} lỗi:`, error.message);
    return null;
  }
}

module.exports = { isConfigured, proxyToBang, bangFetchJson };
