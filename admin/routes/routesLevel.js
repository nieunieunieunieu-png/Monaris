// ===== Admin API routes: cầu nối EXP cho bot BANG =====
// Bot Bang (NMB-Bang) báo hoạt động để bot gốc cộng EXP (Level nằm ở bot gốc). Xem NMB-Bang/integrations/levelBridge.js.
//   POST /admin/level/award           { userId, key, opts }   key thuộc ALLOWED_KEYS
//   POST /admin/level/vote-full-week  { userId, channelId }
const { sendJson } = require('../httpUtils');

const ALLOWED_KEYS = new Set(['vote_scrim', 'check_gear', 'thi_kiem', 'highlight']);
// Chỉ nhận vài tuỳ chọn an toàn từ bên ngoài (không cho đặt exp tuỳ ý).
const ALLOWED_OPTS = ['name', 'channelId', 'count', 'skipCooldown', 'noExp'];

const levelRoutes = {
  'POST /admin/level/award': async (req, res, body) => {
    const userId = String(body.userId || '').trim();
    const key = String(body.key || '').trim();
    if (!/^\d{15,25}$/.test(userId)) return sendJson(res, 400, { error: 'userId không hợp lệ.' });
    if (!ALLOWED_KEYS.has(key)) return sendJson(res, 400, { error: 'key không được phép.' });
    const opts = {};
    for (const k of ALLOWED_OPTS) if (body.opts && body.opts[k] !== undefined) opts[k] = body.opts[k];
    const gained = require('../../level').awardExp(userId, key, opts);
    sendJson(res, 200, { ok: true, gained });
  },

  'POST /admin/level/vote-full-week': async (req, res, body) => {
    const userId = String(body.userId || '').trim();
    if (!/^\d{15,25}$/.test(userId)) return sendJson(res, 400, { error: 'userId không hợp lệ.' });
    const awarded = require('../../level').awardScrimFullWeek(userId, body.channelId ? String(body.channelId) : undefined);
    sendJson(res, 200, { ok: true, awarded });
  },
};

module.exports = { levelRoutes };
