// ===== hoso/frame/registry.js — danh sách phong cách khung có sẵn =====
// Tự quét các thư mục con của hoso/frame/ có index.js: thêm 1 thư mục phong cách mới là tự có mặt, không cần sửa file này.
// Thư mục hỏng (require lỗi) bị bỏ qua, không làm hỏng cả hệ thống.
const fs = require('fs');
const path = require('path');

const DEFAULT_ID = 'macdinh';
// thành phần -> tên export bắt buộc trong index.js của phong cách
const PART_EXPORT = { colors: 'TIERS', crest: 'crestTop', border: 'frameBorder', side: 'sideUnit', bottom: 'decorBottom', accents: 'accent', avatar: 'avatarFrame' };

const styles = {};
for (const ent of fs.readdirSync(__dirname, { withFileTypes: true })) {
  if (!ent.isDirectory()) continue;
  try {
    const s = require(path.join(__dirname, ent.name));
    if (s && s.id) styles[s.id] = s;
  } catch (e) {
    console.error(`[hoso/frame] bỏ qua phong cách "${ent.name}":`, e.message);
  }
}

const getStyle = (id) => styles[id] || null;
const hasPart = (id, part) => Boolean(styles[id] && styles[id][PART_EXPORT[part]]);

// { colors:[ids], crest:[ids], border:[ids], side:[ids], bottom:[ids], accents:[ids] } — dùng làm menu chọn từng phần.
function listParts() {
  const out = {};
  // Khung `auto: true` (cd_lienhoa: tự đổi bậc theo cảnh giới, chỉ dùng cho /hosocd) không hiện trong menu chọn khung.
  for (const part of Object.keys(PART_EXPORT)) out[part] = Object.keys(styles).filter((id) => !styles[id].auto && hasPart(id, part));
  return out;
}

// [{ id, name }] — danh sách phong cách để hiển thị.
const listStyles = () => Object.values(styles).map((s) => ({ id: s.id, name: s.name || s.id }));

module.exports = { DEFAULT_ID, PART_EXPORT, getStyle, hasPart, listParts, listStyles };
