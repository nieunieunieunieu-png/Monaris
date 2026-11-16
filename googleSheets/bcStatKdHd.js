// ===== BcStat: KD / HD + quy tắc "kỷ lục" dùng chung =====
// File util thuần (không gọi Google Sheets) — mọi nơi tính/hiển thị kỷ lục đều dùng chung ở đây
// (bcStatRecords.js, bcStatSummary.js).
//
// 1) Hướng kỷ lục: hạng mục "trongThuong" (Trọng thương) CÀNG NHỎ CÀNG TỐT -> kỷ lục = giá trị NHỎ NHẤT;
//    8 hạng mục còn lại kỷ lục = giá trị LỚN NHẤT.
// 2) KD / HD / TD tính RIÊNG TỪNG TRẬN từ số liệu thô của trận đó:
//      KD = giet / trongThuong
//      HD = triLieu / trongThuong
//      TD = chongChiu / trongThuong   [chống chịu trên mỗi mạng]
//    Cả 3 chỉ số tính cho TẤT CẢ hệ phái (không chia theo class).
//    trongThuong = 0 thì chia cho 1; trận thiếu giet/triLieu hoặc thiếu trongThuong (rỗng) thì BỎ QUA trận đó.
//    Kỷ lục KD / HD / TD = giá trị LỚN NHẤT trên mọi trận của người đó.

const LOWER_IS_BETTER_KEYS = new Set(['trongThuong']); // càng nhỏ càng tốt

const TANK_CLASS = 'thiết y';
const HEAL_CLASS = 'tố vấn';

// Rỗng / undefined / null / NaN = "không có dữ liệu". Số 0 là GIÁ TRỊ HỢP LỆ (không bao giờ coi rỗng là 0).
function toNumberOrNull(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === 'string') {
    const s = v.trim().replace(',', '.'); // phòng Sheets trả "12,5" theo locale VN
    if (s === '') return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function isLowerBetter(catKey) {
  return LOWER_IS_BETTER_KEYS.has(catKey);
}

// candidate có TỐT HƠN current không? current rỗng (chưa có kỷ lục) -> candidate hợp lệ nào cũng tốt hơn.
// Trọng thương: nhỏ hơn mới là phá kỷ lục; hạng mục khác: lớn hơn mới là phá kỷ lục.
function isBetterRecord(catKey, candidate, current) {
  const c = toNumberOrNull(candidate);
  if (c === null) return false;
  const cur = toNumberOrNull(current);
  if (cur === null) return true;
  return isLowerBetter(catKey) ? c < cur : c > cur;
}

// Chọn giá trị tốt nhất trong danh sách (bỏ qua ô rỗng) theo hướng của hạng mục; không có giá trị hợp lệ -> ''.
function bestOf(catKey, list) {
  let best = '';
  (list || []).forEach((v) => {
    if (isBetterRecord(catKey, v, best)) best = toNumberOrNull(v);
  });
  return best;
}

function normalizeClass(className) {
  return String(className || '').normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
}

// Class DPS = mọi class có tên TRỪ Thiết Y và Tố Vấn. Chưa biết class (rỗng) -> KHÔNG áp dụng (tránh gán nhầm cho tank/heal).
function isDpsClass(className) {
  const c = normalizeClass(className);
  return Boolean(c) && c !== TANK_CLASS && c !== HEAL_CLASS;
}
function isHealClass(className) {
  return normalizeClass(className) === HEAL_CLASS;
}
function isTankClass(className) {
  return normalizeClass(className) === TANK_CLASS;
}

// Chia an toàn: trongThuong = 0 -> chia cho 1. Thiếu tử số hoặc trongThuong -> null (bỏ qua trận).
function ratioPerMatch(numerator, trongThuong) {
  const n = toNumberOrNull(numerator);
  const t = toNumberOrNull(trongThuong);
  if (n === null || t === null) return null;
  return n / (t === 0 ? 1 : t);
}

// values: số liệu thô 1 trận { giet, triLieu, trongThuong, ... } -> số hoặc null.
function calcMatchKd(values) {
  const v = values || {};
  return ratioPerMatch(v.giet, v.trongThuong);
}
function calcMatchHd(values) {
  const v = values || {};
  return ratioPerMatch(v.triLieu, v.trongThuong);
}
// TD = chống chịu / trọng thương của 1 trận (tank).
function calcMatchTd(values) {
  const v = values || {};
  return ratioPerMatch(v.chongChiu, v.trongThuong);
}

// Kỷ lục KD / HD THÔ (chưa xét class) trên danh sách trận: [{ giet, triLieu, trongThuong, ... }, ...]
// -> { kd, hd, td } (number|'') (lớn nhất; không trận nào hợp lệ -> '').
function computeKdHdRecord(matchValuesList) {
  const kds = [];
  const hds = [];
  const tds = [];
  (matchValuesList || []).forEach((values) => {
    kds.push(calcMatchKd(values));
    hds.push(calcMatchHd(values));
    tds.push(calcMatchTd(values));
  });
  const maxOf = (arr) => {
    let best = '';
    arr.forEach((x) => {
      if (x !== null && (best === '' || x > best)) best = x;
    });
    return best;
  };
  return { kd: maxOf(kds), hd: maxOf(hds), td: maxOf(tds) };
}

// KD / HD / TD tính cho MỌI hệ phái — className giữ trong chữ ký hàm để khỏi sửa chỗ gọi, không còn dùng để lọc. Chưa có dữ liệu -> ''.
function applyClassToKdHd(className, raw) {
  const r = raw || {};
  const kd = toNumberOrNull(r.kd);
  const hd = toNumberOrNull(r.hd);
  const td = toNumberOrNull(r.td);
  return { kd: kd === null ? '' : kd, hd: hd === null ? '' : hd, td: td === null ? '' : td };
}

// ---- Hiển thị ----
// Làm tròn 2 chữ số thập phân, bỏ số 0 thừa (12.5 -> "12.5", 3 -> "3", 1.234 -> "1.23").
function round2(n) {
  return String(Math.round(n * 100) / 100);
}
function formatKd(v) {
  const n = toNumberOrNull(v);
  return n === null ? '—' : round2(n);
}
// HD >= 10.000 hiện theo đơn vị W (12345678 -> "1234.57W"); nhỏ hơn thì làm tròn 2 chữ số thập phân.
function formatHd(v) {
  const n = toNumberOrNull(v);
  if (n === null) return '—';
  return n >= 10000 ? `${round2(n / 10000)}W` : round2(n);
}
// TD (chống chịu / mạng) cùng kiểu hiển thị với HD (>= 10.000 -> W).
const formatTd = formatHd;

module.exports = {
  LOWER_IS_BETTER_KEYS,
  toNumberOrNull,
  isLowerBetter,
  isBetterRecord,
  bestOf,
  normalizeClass,
  isDpsClass,
  isHealClass,
  isTankClass,
  calcMatchKd,
  calcMatchHd,
  calcMatchTd,
  computeKdHdRecord,
  applyClassToKdHd,
  formatKd,
  formatHd,
  formatTd,
};
