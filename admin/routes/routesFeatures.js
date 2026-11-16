// ===== Admin API routes: Công tắc tính năng vui/giải trí =====
// Web Monaris Admin (tab "Công tắc tính năng") bật/tắt các tính năng không liên quan bang. Dùng chung lõi features/index.js.
//   GET  /admin/features            -> { loaded, groups: [...], features: [{ id, group, name, desc, commands, requires,
//                                       enabled, switchOn, defaultOn, customized, locked, lockedReason, parentOff, updatedBy, updatedAt }] }
//        enabled  = trạng thái THỰC TẾ đang chạy (đã tính khoá ENV + tính năng cha); switchOn = vị trí công tắc của riêng mục.
//   POST /admin/features/set        { id, enabled, actorName? }                      -> { ok, feature, features }
//   POST /admin/features/set-many   { changes: [{ id, enabled }], actorName? }       -> { ok, changed, features }
//   POST /admin/features/reset      { id, actorName? }                               -> { ok, feature, features }   (về mặc định theo ENV)
//   POST /admin/features/reload     {}                                               -> { ok, features }            (đọc lại tab Sheet sau khi sửa tay)
// Lỗi nghiệp vụ (sai id, mục bị khoá ENV, lưu Sheet lỗi) là Error tiếng Việt -> 400 để web hiện thẳng cho người dùng.

const features = require('../../features');
const { sendJson } = require('../httpUtils');
const { bangFetchJson } = require('../bangProxy');

function actorOf(body) {
  const name = String((body && body.actorName) || '').trim();
  return name ? `web: ${name}` : 'web';
}

async function run(res, fn) {
  try {
    const data = await fn();
    bangFetchJson('POST', '/admin/features/reload', {}).catch(() => {}); // bot Bang đọc lại công tắc (chonso, vinhdanh)
    sendJson(res, 200, Object.assign({ ok: true, features: features.list() }, data || {}));
  } catch (err) {
    sendJson(res, 400, { error: (err && err.message) || 'Có lỗi xảy ra.' });
  }
}

const featuresRoutes = {
  'GET /admin/features': async (req, res) => {
    sendJson(res, 200, { loaded: features.isLoaded(), groups: features.groups(), features: features.list() });
  },

  'POST /admin/features/set': (req, res, body) => run(res, async () => {
    const [feature] = await features.setMany([{ id: body.id, enabled: body.enabled }], actorOf(body));
    return { feature };
  }),

  'POST /admin/features/set-many': (req, res, body) => run(res, async () => {
    const changed = await features.setMany(body.changes, actorOf(body));
    return { changed };
  }),

  'POST /admin/features/reset': (req, res, body) => run(res, async () => {
    const feature = await features.reset(body.id, actorOf(body));
    return { feature };
  }),

  'POST /admin/features/reload': (req, res) => run(res, async () => {
    await features.load();
    return {};
  }),
};

module.exports = { featuresRoutes };
