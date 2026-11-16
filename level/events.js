// ===== level/events.js — hệ số EXP theo sự kiện (VD cuối tuần x2), đặt ở tab "Cấu Hình EXP" =====
// Mỗi dòng có Mã bắt đầu bằng "event_" là 1 sự kiện: F Hệ số · G Thứ áp dụng · H Từ ngày · I Đến ngày · J Mã hoạt động áp dụng.
// Điều kiện nào để trống = không giới hạn. Thời gian tính theo giờ VN. Nhiều sự kiện cùng lúc: lấy hệ số CAO NHẤT.
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const MAX_FACTOR = 10;

let events = []; // [{ code, label, factor, days:Set|null, from:'YYYY-MM-DD'|null, to, keys:Set|null }]

function pad(n) {
  return String(n).padStart(2, '0');
}

// Ô ngày: số serial của Google Sheets (khi ô được nhận là ngày), "YYYY-MM-DD" hoặc "dd/mm[/yyyy]". Trả "YYYY-MM-DD" hoặc null.
function toDateKey(value, defaultYear) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number') {
    if (!(value > 20000)) return null;
    return new Date(Math.round((value - 25569) * 86400000)).toISOString().slice(0, 10);
  }
  const s = String(value).trim();
  let m = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(s);
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  m = /^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?$/.exec(s);
  if (m) {
    let year = m[3] ? Number(m[3]) : defaultYear;
    if (year < 100) year += 2000;
    return `${year}-${pad(m[2])}-${pad(m[1])}`;
  }
  return null;
}

// "T7,CN" / "7 8" / "t2;t3" -> Set getDay() (0 = CN ... 6 = T7). Rỗng/không hiểu = null (mọi ngày).
function parseDays(value) {
  const set = new Set();
  for (const raw of String(value === undefined || value === null ? '' : value).toUpperCase().split(/[,;\s]+/)) {
    if (!raw) continue;
    if (raw === 'CN') {
      set.add(0);
      continue;
    }
    const m = /^T?([2-8])$/.exec(raw);
    if (m) set.add(Number(m[1]) === 8 ? 0 : Number(m[1]) - 1);
  }
  return set.size ? set : null;
}

// rows: các dòng THÔ (cột A..J) của tab Cấu Hình EXP có Mã bắt đầu bằng "event_".
function setEventRows(rows) {
  const year = new Date(Date.now() + VN_OFFSET_MS).getUTCFullYear();
  const next = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    const code = String(row[0] || '').trim();
    const factor = row[5] === '' || row[5] === undefined ? 1 : Number(row[5]);
    if (!/^event_/i.test(code) || !Number.isFinite(factor) || factor <= 0) continue;
    const keys = String(row[9] || '').split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);
    next.push({
      code,
      label: String(row[1] || code).trim(),
      factor: Math.min(MAX_FACTOR, factor),
      days: parseDays(row[6]),
      from: toDateKey(row[7], year),
      to: toDateKey(row[8], year),
      keys: keys.length ? new Set(keys) : null,
    });
  }
  events = next;
}

function isActive(ev, ms) {
  const vn = new Date(ms + VN_OFFSET_MS);
  const day = vn.toISOString().slice(0, 10);
  if (ev.days && !ev.days.has(vn.getUTCDay())) return false;
  if (ev.from && day < ev.from) return false;
  if (ev.to && day > ev.to) return false;
  return true;
}

// Hệ số áp cho hoạt động `key` ngay lúc `ms` (1 = không có sự kiện).
function multiplierFor(key, ms = Date.now()) {
  let best = 1;
  let found = false;
  for (const ev of events) {
    if (ev.factor === 1 || (ev.keys && !ev.keys.has(key)) || !isActive(ev, ms)) continue;
    if (!found || ev.factor > best) best = ev.factor;
    found = true;
  }
  return best;
}

// Các sự kiện đang hiệu lực (để hiển thị ở /expinfo): [{ label, factor }].
function activeEvents(ms = Date.now()) {
  return events.filter((ev) => ev.factor !== 1 && isActive(ev, ms)).map((ev) => ({ label: ev.label, factor: ev.factor, keys: ev.keys ? [...ev.keys] : null }));
}

module.exports = { setEventRows, multiplierFor, activeEvents, parseDays, toDateKey };
