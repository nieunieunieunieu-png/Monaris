// ===== Admin API routes: Kho kiến thức bot (tab Sheet "Kiến thức bang") =====
// Cho trang "Kiến Thức Bot" (web Monaris Admin) — gọi qua proxy /api/bot/kienthuc/...
// Sửa/xoá/bật-tắt phải gửi kèm expectedTopic (chủ đề lúc admin mở trang) để chống ghi nhầm khi 2 người cùng sửa.
const { sendJson } = require('../httpUtils');
const { KNOWLEDGE_LIMITS, KNOWLEDGE_BULK_MAX } = require('../../config');
const {
  listAllRows,
  addRows,
  updateRow,
  deleteRow,
  setEnabled,
  reloadKnowledge,
} = require('../../googleSheets/knowledgeSheet');
const { findMatchedEntries } = require('../../AutoReply/knowledgeBlock');
// Ảnh gắn vào mục kiến thức nằm ở kho RIÊNG (tab "Ảnh Kiến Thức" + folder Cloudinary riêng), KHÔNG chung với /saveimg.
const { getAllKnowledgeImageEntries } = require('../../googleSheets/knowledgeImageSheet');
const { storeKnowledgeImageBuffer, loadKnowledgeImageFilesByIds } = require('../../nmImage');

const IMAGE_NAME_MAX = 100;
const IMAGE_MAX_BYTES = 8 * 1024 * 1024;

// Nhận diện định dạng ảnh bằng chữ ký file (không tin mimeType do web gửi lên).
function sniffImageMime(buffer) {
  if (buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length > 6 && buffer.subarray(0, 3).toString('latin1') === 'GIF') return 'image/gif';
  if (buffer.length > 12 && buffer.subarray(0, 4).toString('latin1') === 'RIFF' && buffer.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
  return null;
}

function queryOf(req) {
  return new URL(req.url, 'http://localhost').searchParams;
}

function parseKeywords(raw) {
  const list = Array.isArray(raw) ? raw : String(raw || '').split(/[,;|\n]/);
  const seen = new Set();
  const result = [];
  for (const item of list) {
    const keyword = String(item || '').trim();
    if (!keyword || seen.has(keyword.toLowerCase())) continue;
    seen.add(keyword.toLowerCase());
    result.push(keyword);
  }
  return result;
}

// Trả { value } hoặc { error } (tiếng Việt). label dùng khi nhập hàng loạt: "Mục 3: ...".
function validateItem(raw, label = '') {
  const data = raw || {};
  const topic = String(data.topic || '').trim();
  const content = String(data.content || '').trim();
  const version = String(data.version || '').trim();
  const keywords = parseKeywords(data.keywords);
  const keywordsText = keywords.join(', ');
  const prefix = label ? `${label}: ` : '';
  if (!topic) return { error: `${prefix}Chưa nhập chủ đề.` };
  if (!content) return { error: `${prefix}Chưa nhập nội dung.` };
  if (topic.length > KNOWLEDGE_LIMITS.topic) return { error: `${prefix}Chủ đề quá dài (${topic.length}/${KNOWLEDGE_LIMITS.topic} ký tự).` };
  if (keywordsText.length > KNOWLEDGE_LIMITS.keywords) return { error: `${prefix}Từ khoá quá dài (${keywordsText.length}/${KNOWLEDGE_LIMITS.keywords} ký tự).` };
  if (content.length > KNOWLEDGE_LIMITS.content) return { error: `${prefix}Nội dung quá dài (${content.length}/${KNOWLEDGE_LIMITS.content} ký tự).` };
  if (version.length > KNOWLEDGE_LIMITS.version) return { error: `${prefix}Phiên bản quá dài (tối đa ${KNOWLEDGE_LIMITS.version} ký tự).` };
  const value = { topic, keywords, content, version };
  // group: tên nhóm liên kết (các mục cùng nhóm gợi ý nhau). KHÔNG gửi trường này = giữ nguyên nhóm cũ khi sửa; gửi "" = bỏ khỏi nhóm.
  if (data.group !== undefined && data.group !== null) {
    const group = String(data.group).replace(/\s+/g, ' ').trim();
    if (group.length > KNOWLEDGE_LIMITS.group) return { error: `${prefix}Tên nhóm quá dài (${group.length}/${KNOWLEDGE_LIMITS.group} ký tự).` };
    value.group = group;
  }
  // images: mảng (hoặc chuỗi) ID ảnh trong kho ảnh kiến thức (tab "Ảnh Kiến Thức"). KHÔNG gửi trường này = giữ nguyên ảnh cũ khi sửa.
  if (data.images !== undefined && data.images !== null) {
    const images = parseKeywords(data.images);
    if (images.length > KNOWLEDGE_LIMITS.images) return { error: `${prefix}Mỗi mục tối đa ${KNOWLEDGE_LIMITS.images} ảnh.` };
    value.images = images;
  }
  if (typeof data.enabled === 'boolean') value.enabled = data.enabled;
  return { value };
}

// Kiểm tra mọi ID ảnh có thật trong kho ảnh kiến thức. Trả chuỗi lỗi (tiếng Việt) hoặc null nếu ổn.
async function checkImagesExist(values) {
  const wanted = [...new Set(values.flatMap((value) => value.images || []))];
  if (!wanted.length) return null;
  const known = new Set((await getAllKnowledgeImageEntries()).map((entry) => entry.fileId));
  const missing = wanted.filter((id) => !known.has(id));
  return missing.length ? `Không có ảnh nào trong kho ảnh kiến thức với ID: ${missing.join(', ')}. Hãy chọn lại ảnh hoặc tải ảnh lên trước.` : null;
}

function fail(res, err) {
  const status = err.code === 'CONFLICT' ? 409 : err.code === 'NOT_CONFIGURED' ? 503 : ['DUPLICATE', 'BAD_ROW'].includes(err.code) ? 400 : 500;
  sendJson(res, status, { error: err.message || 'Lỗi không xác định.', code: err.code || undefined });
}

function needTarget(body, res) {
  if (!body || !Number.isInteger(Number(body.row)) || Number(body.row) < 2) {
    sendJson(res, 400, { error: 'Thiếu số dòng của mục cần thao tác.' });
    return false;
  }
  if (!String(body.expectedTopic || '').trim()) {
    sendJson(res, 400, { error: 'Thiếu chủ đề hiện tại (expectedTopic) để kiểm tra trước khi ghi.' });
    return false;
  }
  return true;
}

const knowledgeRoutes = {
  // -> { items: [{row, topic, keywords[], content, version, group, enabled}], warnings: {duplicateKeywords, noKeywords, singleGroups}, loadedAt }
  'GET /admin/kienthuc/list': async (req, res) => {
    try {
      const result = await listAllRows();
      // Gắn tên ảnh để web hiển thị (imageInfo[i] ứng với images[i]; missing = ID không còn trong kho ảnh kiến thức).
      if (result.items.some((item) => item.images && item.images.length)) {
        try {
          const byId = new Map((await getAllKnowledgeImageEntries()).map((entry) => [entry.fileId, entry]));
          for (const item of result.items) {
            item.imageInfo = (item.images || []).map((id) => ({ id, name: byId.has(id) ? byId.get(id).name : null, missing: !byId.has(id) }));
          }
        } catch (error) {
          console.error('[kienthuc] Không đọc được kho ảnh để gắn tên:', error.message);
        }
      }
      sendJson(res, 200, result);
    } catch (err) {
      fail(res, err);
    }
  },

  // body: { topic, keywords, content, version?, group?, enabled? }  HOẶC  { items: [ ... ] } (nhập hàng loạt, tối đa KNOWLEDGE_BULK_MAX)
  'POST /admin/kienthuc/add': async (req, res, body) => {
    const list = Array.isArray(body && body.items) ? body.items : [body];
    if (!list.length) return sendJson(res, 400, { error: 'Không có mục nào để thêm.' });
    if (list.length > KNOWLEDGE_BULK_MAX) return sendJson(res, 400, { error: `Mỗi lần nhập tối đa ${KNOWLEDGE_BULK_MAX} mục.` });
    const values = [];
    const topics = new Set();
    for (let i = 0; i < list.length; i += 1) {
      const result = validateItem(list[i], list.length > 1 ? `Mục ${i + 1}` : '');
      if (result.error) return sendJson(res, 400, { error: result.error });
      const key = result.value.topic.toLowerCase();
      if (topics.has(key)) return sendJson(res, 400, { error: `Chủ đề "${result.value.topic}" bị lặp trong danh sách nhập.` });
      topics.add(key);
      values.push(result.value);
    }
    try {
      const imageError = await checkImagesExist(values);
      if (imageError) return sendJson(res, 400, { error: imageError });
      const { rows } = await addRows(values);
      sendJson(res, 200, { ok: true, added: values.length, rows });
    } catch (err) {
      fail(res, err);
    }
  },

  // body: { row, expectedTopic, topic, keywords, content, version?, group?, enabled? }
  'POST /admin/kienthuc/update': async (req, res, body) => {
    if (!needTarget(body, res)) return;
    const result = validateItem(body);
    if (result.error) return sendJson(res, 400, { error: result.error });
    try {
      const imageError = await checkImagesExist([result.value]);
      if (imageError) return sendJson(res, 400, { error: imageError });
      sendJson(res, 200, { ok: true, ...(await updateRow(body.row, body.expectedTopic, result.value)) });
    } catch (err) {
      fail(res, err);
    }
  },

  // body: { row, expectedTopic }
  'POST /admin/kienthuc/delete': async (req, res, body) => {
    if (!needTarget(body, res)) return;
    try {
      sendJson(res, 200, { ok: true, ...(await deleteRow(body.row, body.expectedTopic)) });
    } catch (err) {
      fail(res, err);
    }
  },

  // body: { row, expectedTopic, enabled: true|false }
  'POST /admin/kienthuc/toggle': async (req, res, body) => {
    if (!needTarget(body, res)) return;
    if (typeof body.enabled !== 'boolean') return sendJson(res, 400, { error: 'Thiếu trạng thái bật/tắt (enabled: true/false).' });
    try {
      sendJson(res, 200, { ok: true, ...(await setEnabled(body.row, body.expectedTopic, body.enabled)) });
    } catch (err) {
      fail(res, err);
    }
  },

  // Danh sách ảnh trong kho ảnh kiến thức (tab "Ảnh Kiến Thức", không phải /viewlistimg) để web cho chọn -> { images: [{ id, name, savedAt }] }
  'GET /admin/kienthuc/images': async (req, res) => {
    try {
      const entries = await getAllKnowledgeImageEntries();
      sendJson(res, 200, { images: entries.map((entry) => ({ id: entry.fileId, name: entry.name, savedAt: entry.savedAt })) });
    } catch (err) {
      fail(res, err);
    }
  },

  // Xem trước 1 ảnh: ?id=<ID ảnh> -> { id, name, mimeType, imageBase64 }
  'GET /admin/kienthuc/image': async (req, res) => {
    const id = String(queryOf(req).get('id') || '').trim();
    if (!id) return sendJson(res, 400, { error: 'Thiếu ID ảnh.' });
    try {
      const [image] = await loadKnowledgeImageFilesByIds([id]);
      if (!image) return sendJson(res, 404, { error: 'Không tìm thấy ảnh này trong kho ảnh kiến thức.' });
      sendJson(res, 200, { id, name: image.name, mimeType: image.mimeType, imageBase64: image.buffer.toString('base64') });
    } catch (err) {
      fail(res, err);
    }
  },

  // Tải ảnh MỚI lên kho ảnh kiến thức (tab riêng; đặt tên, tên không được trùng trong tab này) để gắn vào mục kiến thức.
  // body: { name, imageBase64 (không cần tiền tố data:), mimeType? } -> { ok, id, name }
  'POST /admin/kienthuc/image/upload': async (req, res, body) => {
    const name = String((body && body.name) || '').trim();
    if (!name) return sendJson(res, 400, { error: 'Chưa đặt tên cho ảnh.' });
    if (name.length > IMAGE_NAME_MAX) return sendJson(res, 400, { error: `Tên ảnh quá dài (tối đa ${IMAGE_NAME_MAX} ký tự).` });
    const raw = String((body && body.imageBase64) || '').replace(/^data:[^,]*,/, '').trim();
    if (!raw) return sendJson(res, 400, { error: 'Chưa có dữ liệu ảnh.' });
    const buffer = Buffer.from(raw, 'base64');
    if (buffer.length > IMAGE_MAX_BYTES) return sendJson(res, 400, { error: 'Ảnh quá lớn (tối đa 8MB).' });
    const mimeType = sniffImageMime(buffer);
    if (!mimeType) return sendJson(res, 400, { error: 'File không phải ảnh hợp lệ (chỉ nhận png/jpg/webp/gif).' });
    const extension = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp' }[mimeType];
    try {
      const result = await storeKnowledgeImageBuffer({ name, buffer, mimeType, filename: `${name}${extension}`, discordId: 'web-kienthuc' });
      if (!result.ok) return sendJson(res, result.code === 'NAME_TAKEN' ? 400 : 500, { error: result.text.replace(/\*\*/g, ''), code: result.code });
      sendJson(res, 200, { ok: true, id: result.id, name: result.name });
    } catch (err) {
      fail(res, err);
    }
  },

  // Ép bot đọc lại Sheet ngay -> { ok, count, loadedAt }
  'POST /admin/kienthuc/reload': async (req, res) => {
    try {
      sendJson(res, 200, await reloadKnowledge());
    } catch (err) {
      fail(res, err);
    }
  },

  // ?q=câu hỏi -> { query, matches: [{ row, topic, score, keywords, version }] } (chỉ xét mục đang bật, giống lúc bot trả lời)
  'GET /admin/kienthuc/test': async (req, res) => {
    const q = String(queryOf(req).get('q') || '').trim();
    if (!q) return sendJson(res, 400, { error: 'Hãy nhập câu hỏi cần thử.' });
    if (q.length > 300) return sendJson(res, 400, { error: 'Câu hỏi quá dài (tối đa 300 ký tự).' });
    try {
      const matched = await findMatchedEntries(q);
      sendJson(res, 200, {
        query: q,
        matches: matched.map(({ entry, score }) => ({
          row: entry.row,
          topic: entry.topic,
          score,
          keywords: entry.keywords,
          version: entry.version,
          images: entry.images || [],
          group: entry.group || '',
        })),
      });
    } catch (err) {
      fail(res, err);
    }
  },
};

module.exports = { knowledgeRoutes };
