// ===== congDuc/hoangDao.js — Giờ Hoàng Đạo: 1 khung ~2 tiếng/ngày nhân Công Đức =====
// Ý tưởng (mục 7 backlog): thay vì 1 khung CỐ ĐỊNH mỗi ngày (vd 20h–22h), bot tính THẬT 6 giờ hoàng đạo của ngày hôm
// nay theo bảng dân gian (xem HOANG_DAO_TABLE — đã đối chiếu với lịch vạn niên: ngày Mão → Tý,Dần,Mão,Ngọ,Mùi,Dậu;
// ngày Sửu → Dần,Mão,Tỵ,Thân,Tuất,Hợi...) rồi CHỈ bật nhân đôi Công Đức ở 1 trong 6 khung đó — khung gần giờ cao điểm
// (mặc định quanh 20h) nhất để "dồn người" vào phòng voice giờ đông, và khung này ĐỔI MỖI NGÀY nên không đoán
// trước được hôm nay rơi vào mấy giờ -> đúng tinh thần "vui, có yếu tố ngẫu nhiên" dù công thức là xác định (không
// cần đổi lịch âm: ngày Can Chi lặp chu kỳ 12 ngày liên tục, tính thẳng từ số ngày dương lịch).
// KHÔNG phụ thuộc Discord/Sheet — thuần hàm số, dễ test. CONG_DUC_HOANGDAO_ENABLED mặc định TẮT (core.addMerit chỉ
// nhân hệ số khi admin bật), nên tắt thì cả module này là no-op an toàn 100% với hành vi/test cũ.
const cfg = require('../config/congDuc');

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const WINDOW_HOURS = 2;

const CHI_NAMES = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
// Giờ bắt đầu (giờ VN) ứng với mỗi Chi, theo đúng thứ tự CHI_NAMES. Giờ Tý 23h–1h (qua đêm hôm sau).
const CHI_START_HOUR = [23, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21];
// Mốc neo: 2024-01-01 (dương lịch) là ngày Giáp Tý (Chi = Tý, index 0) — đối chiếu nhiều nguồn lịch vạn niên.
// Vì chu kỳ Chi ngày lặp đều mỗi 12 ngày dương lịch liên tục (không phụ thuộc tháng âm/nhuận), chỉ cần đếm số ngày
// cách mốc này là ra Chi của bất kỳ ngày nào, không cần quy đổi âm lịch.
const REF_UTC_MS = Date.UTC(2024, 0, 1);
const REF_CHI_INDEX = 0;

// Bảng dân gian: ngày có Chi ở STT X (0=Tý..11=Hợi) thì 6 Chi GIỜ sau là hoàng đạo (đã đối chiếu lịch vạn niên thực tế).
// Hai ngày cách nhau 6 vị trí (vd Tý & Ngọ, Sửu & Mùi...) dùng chung 1 bộ giờ hoàng đạo.
const HOANG_DAO_TABLE = (() => {
  const base = [
    [0, 1, 3, 6, 8, 9], // ngày Tý: Tý, Sửu, Mão, Ngọ, Thân, Dậu
    [2, 3, 5, 8, 10, 11], // ngày Sửu: Dần, Mão, Tỵ, Thân, Tuất, Hợi
    [0, 1, 4, 5, 7, 10], // ngày Dần: Tý, Sửu, Thìn, Tỵ, Mùi, Tuất
    [0, 2, 3, 6, 7, 9], // ngày Mão: Tý, Dần, Mão, Ngọ, Mùi, Dậu
    [2, 4, 5, 8, 9, 11], // ngày Thìn: Dần, Thìn, Tỵ, Thân, Dậu, Hợi
    [1, 4, 6, 7, 10, 11], // ngày Tỵ: Sửu, Thìn, Ngọ, Mùi, Tuất, Hợi
  ];
  return [...base, ...base]; // ngày Ngọ..Hợi lặp lại đúng bộ của Tý..Tỵ
})();

// ---------- Ngày VN + Chi của ngày (không cần âm lịch) ----------
function vnDateParts(ms) {
  const vn = new Date(ms + VN_OFFSET_MS);
  return { y: vn.getUTCFullYear(), m: vn.getUTCMonth(), d: vn.getUTCDate() };
}
// Mốc 00:00 giờ VN (tính theo mốc thời gian thật, ms UTC) của ngày chứa `ms`.
function vnMidnightMs(ms) {
  const { y, m, d } = vnDateParts(ms);
  return Date.UTC(y, m, d) - VN_OFFSET_MS;
}
function dayChiIndex(ms) {
  const { y, m, d } = vnDateParts(ms);
  const days = Math.round((Date.UTC(y, m, d) - REF_UTC_MS) / 86_400_000);
  return (((REF_CHI_INDEX + days) % 12) + 12) % 12;
}

// ---------- Chọn 1/6 khung hoàng đạo của ngày: ưu tiên khung nằm trong giờ cao điểm, rồi gần IDEAL_HOUR nhất ----------
function pickChiHourIndex(dayChi) {
  const candidates = HOANG_DAO_TABLE[dayChi];
  const { CONG_DUC_HOANGDAO_IDEAL_HOUR: ideal, CONG_DUC_HOANGDAO_PEAK_FROM_HOUR: from, CONG_DUC_HOANGDAO_PEAK_TO_HOUR: to } = cfg;
  const inPeak = candidates.filter((i) => CHI_START_HOUR[i] >= from && CHI_START_HOUR[i] < to);
  const pool = inPeak.length ? inPeak : candidates;
  return pool.reduce((best, i) => (Math.abs(CHI_START_HOUR[i] - ideal) < Math.abs(CHI_START_HOUR[best] - ideal) ? i : best), pool[0]);
}

// Khung hoàng đạo (hoặc khung cố định nếu CONG_DUC_HOANGDAO_FIXED được set) của ngày VN chứa `ms`.
// Trả { startMs, endMs, chiHour, dayChi, fixed }.
function windowForDay(ms) {
  const dayStart = vnMidnightMs(ms);
  const fixedMatch = /^(\d{1,2})\s*-\s*(\d{1,2})$/.exec(cfg.CONG_DUC_HOANGDAO_FIXED);
  if (fixedMatch) {
    const startHour = Math.min(23, Math.max(0, Number(fixedMatch[1])));
    let endHour = Number(fixedMatch[2]);
    if (!(endHour > startHour)) endHour += 24; // kết thúc <= bắt đầu -> hiểu là qua đêm (vd "23-1" = 23h hôm nay đến 1h hôm sau)
    endHour = Math.min(startHour + 23, Math.max(startHour + 1, endHour));
    return { startMs: dayStart + startHour * HOUR_MS, endMs: dayStart + endHour * HOUR_MS, chiHour: null, dayChi: null, fixed: true };
  }
  const dayChi = dayChiIndex(ms);
  const chiHour = pickChiHourIndex(dayChi);
  const startMs = dayStart + CHI_START_HOUR[chiHour] * HOUR_MS;
  return { startMs, endMs: startMs + WINDOW_HOURS * HOUR_MS, chiHour, dayChi, fixed: false };
}

// Khung của "hôm nay" (ngày VN chứa `now`) — dùng để hiển thị ở Sảnh/congduc.
function todayWindow(now = Date.now()) {
  return windowForDay(now);
}

// Đang ở trong giờ hoàng đạo không? Phải xét cả khung của NGÀY HÔM TRƯỚC vì giờ Tý (23h–1h) tràn qua ngày sau.
function isActive(now = Date.now()) {
  if (!require('../features').isEnabled('hoangdao')) return false;
  const win = windowForDay(now);
  if (now >= win.startMs && now < win.endMs) return true;
  const prevWin = windowForDay(now - 24 * 60 * 60 * 1000);
  return now >= prevWin.startMs && now < prevWin.endMs;
}

// Hệ số nhân Công Đức áp dụng tại `now` (1 = không có hiệu lực). Gắn vào congDuc/core.js qua setMeritMultiplierProvider.
function multiplierNow(now = Date.now()) {
  return isActive(now) ? cfg.CONG_DUC_HOANGDAO_FACTOR : 1;
}

const fmtHour = (h) => `${String(((h % 24) + 24) % 24).padStart(2, '0')}:00`;
const fmtMin = (ms) => { const n = Math.max(0, Math.round(ms / 60000)); const h = Math.floor(n / 60); const m = n % 60; return h > 0 ? `${h} giờ ${m} phút` : `${m} phút`; };

// Dòng mô tả cho Sảnh: "🌟 Giờ Hoàng Đạo hôm nay (ngày Mão): 20:00–22:00 — Công Đức x2 · ĐANG DIỄN RA (còn 35 phút)" hoặc null nếu tắt.
function describeToday(now = Date.now()) {
  if (!require('../features').isEnabled('hoangdao')) return null;
  const win = todayWindow(now);
  const startHour = Math.round((win.startMs - vnMidnightMs(win.startMs)) / HOUR_MS);
  const endHour = startHour + (win.endMs - win.startMs) / HOUR_MS;
  const range = `${fmtHour(startHour)}–${fmtHour(endHour)}`;
  const dayChiLabel = win.dayChi === null ? '' : ` (ngày ${CHI_NAMES[win.dayChi]}, giờ ${CHI_NAMES[win.chiHour]})`;
  const active = isActive(now);
  let status;
  if (active) status = `🔥 ĐANG DIỄN RA — còn ${fmtMin(win.endMs - now)} nữa`;
  else if (now < win.startMs) status = `sắp tới, còn ${fmtMin(win.startMs - now)} nữa`;
  else status = 'đã qua hôm nay, mai quay lại';
  return `🌟 Giờ Hoàng Đạo${dayChiLabel}: **${range}** — Công Đức x${cfg.CONG_DUC_HOANGDAO_FACTOR} · ${status}`;
}

module.exports = { multiplierNow, isActive, todayWindow, describeToday, _dayChiIndex: dayChiIndex, _pickChiHourIndex: pickChiHourIndex, CHI_NAMES, HOANG_DAO_TABLE };
