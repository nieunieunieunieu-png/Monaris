// ===== BcStat: Điểm (hệ số) theo class =====
// Điểm của MỘT người trong MỘT trận, tính từ số liệu thô của đúng trận đó (chết = Trọng thương):
//   DPS (mọi class TRỪ Thiết Y và Tố Vấn, kể cả chưa có class):
//     St. người chơi + St. trụ * 0.5 + Giết * 10 + Hỗ trợ * 2 - Trọng thương * 5
//   Thiết Y:
//     Chống chịu + St. người chơi * 2 + St. trụ * 2 + Trị liệu + Hỗ trợ * 2 - Trọng thương * 5
//   Tố Vấn:
//     Trị liệu + Chống chịu * 0.5 + St. trụ * 2 + Hồi sinh * 10 + Hỗ trợ * 2 - Trọng thương * 5
// ĐƠN VỊ: 4 hạng mục số lớn (St. người chơi, St. trụ, Trị liệu, Chống chịu) tính theo đơn vị VẠN (W) — tức lấy "phần số"
// như hiển thị trên web (496W -> 496, 20288W -> 20288), W chỉ là đơn vị. Số liệu lưu trên Sheet vẫn là số đầy đủ
// (496W = 4.960.000), bot CHIA 10.000 khi tính Điểm; số nhỏ hơn 1W (web hiện nguyên số, vd 6709) tính đúng là 0.6709.
// 5 hạng mục còn lại (Giết, Hỗ trợ, Trọng thương, Hồi sinh...) là số đếm, giữ nguyên. Điểm / Điểm TB vì vậy cũng ở đơn vị vạn.
// Hạng mục chưa thu thập trong trận đó (ô trống) tính như 0; trận không có hạng mục nào -> null (không có điểm).
// "Điểm TB" = trung bình cộng Điểm của các trận người đó CÓ số liệu trong chu kỳ đang tích luỹ (Cumulative).
// Điểm được ghi vào Sheet: cột "Điểm" ở tab Cumulative (từng trận) + cột "Điểm TB" ở tab Summary — xem syncCumulativeScores.

const { BCSTAT_SPREADSHEET_ID, BCSTAT_CUMULATIVE_SHEET_NAME } = require('../config');
const { CATEGORIES, CUMULATIVE_HEADER, colLetter, normalizeName } = require('./bcStatShared');
const { toNumberOrNull, isTankClass, isHealClass } = require('./bcStatKdHd');

const round2 = (n) => Math.round(n * 100) / 100;
const WAN = 10000; // 1 vạn (W) = 10.000
const WAN_KEYS = new Set(['stNguoiChoi', 'stTru', 'triLieu', 'chongChiu']);

// Hệ số từng hạng mục theo class (khớp công thức ở đầu file). Dùng chung cho computeScore và computeScoreParts.
const WEIGHTS = {
  tank: { chongChiu: 1, stNguoiChoi: 2, stTru: 2, triLieu: 1, hoTro: 2, trongThuong: -5 },
  heal: { triLieu: 1, chongChiu: 0.5, stTru: 2, hoiSinh: 10, hoTro: 2, trongThuong: -5 },
  dps: { stNguoiChoi: 1, stTru: 0.5, giet: 10, hoTro: 2, trongThuong: -5 },
};
const LABELS = Object.fromEntries(CATEGORIES.map((c) => [c.key, c.label]));

// Thành phần điểm của 1 người trong 1 trận: mỗi hạng mục có hệ số = { key, label, raw (số hiển thị: đã chia vạn nếu là W),
// weight (hệ số), points (= raw * weight) }. Tổng points = Điểm. Trận không có số liệu -> null.
function computeScoreParts(className, values) {
  if (!values) return null;
  const hasAny = CATEGORIES.some((cat) => toNumberOrNull(values[cat.key]) !== null);
  if (!hasAny) return null;
  const group = isTankClass(className) ? 'tank' : (isHealClass(className) ? 'heal' : 'dps');
  const weights = WEIGHTS[group];
  const parts = Object.keys(weights).map((key) => {
    const n = toNumberOrNull(values[key]);
    const raw = n === null ? 0 : (WAN_KEYS.has(key) ? n / WAN : n);
    return { key, label: LABELS[key] || key, raw: round2(raw), weight: weights[key], points: raw * weights[key] };
  });
  return { group, parts, total: parts.reduce((a, p) => a + p.points, 0) };
}

// values: { catKey: number|''|undefined }.
function computeScore(className, values) {
  const r = computeScoreParts(className, values);
  return r ? round2(r.total) : null;
}

// Bản gọn gửi cho web: { group, parts: [{ key, label, raw, weight, points(2 số lẻ) }] } hoặc null.
function computeScoreBreakdown(className, values) {
  const r = computeScoreParts(className, values);
  if (!r) return null;
  return { group: r.group, parts: r.parts.map((p) => ({ ...p, points: round2(p.points) })) };
}

// Trung bình các điểm hợp lệ (bỏ null); không có điểm nào -> null.
function averageScores(scores) {
  const list = (scores || []).filter((s) => s !== null && s !== undefined && Number.isFinite(s));
  if (!list.length) return null;
  return round2(list.reduce((a, b) => a + b, 0) / list.length);
}

// Tính Điểm cho TỪNG dòng (người, trận) của tab Cumulative rồi ghi vào cột "Điểm" (cột cuối của tab), ghi luôn tiêu đề cột;
// trả về Map(tên chuẩn hoá -> Điểm TB) để tab Summary ghi cột "Điểm TB". classByKey: Map(tên chuẩn hoá -> class từ tab Bang).
// Chỉ ghi ĐÚNG cột Điểm (không đụng các cột số liệu). Được gọi trong computeAndWriteSummary — mọi luồng lưu/gộp/sửa
// đều kết thúc bằng computeAndWriteSummary nên cột Điểm luôn được làm mới.
async function syncCumulativeScores(sheets, classByKey) {
  const scoreCol = CUMULATIVE_HEADER.length - 1;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: BCSTAT_SPREADSHEET_ID,
    range: `'${BCSTAT_CUMULATIVE_SHEET_NAME}'!A2:${colLetter(scoreCol)}`,
  });
  const rows = response.data.values || [];
  const perPlayer = new Map();
  const scoreCells = rows.map((row) => {
    const name = (row[0] || '').trim();
    const label = (row[1] || '').trim();
    if (!name || !label) return [''];
    const values = {};
    CATEGORIES.forEach((cat, idx) => {
      const raw = row[2 + idx];
      if (raw !== undefined && raw !== '') values[cat.key] = Number(raw);
    });
    const key = normalizeName(name);
    const score = computeScore(classByKey.get(key) || '', values);
    if (score !== null) {
      if (!perPlayer.has(key)) perPlayer.set(key, []);
      perPlayer.get(key).push(score);
    }
    return [score === null ? '' : score];
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId: BCSTAT_SPREADSHEET_ID,
    range: `'${BCSTAT_CUMULATIVE_SHEET_NAME}'!${colLetter(scoreCol)}1`,
    valueInputOption: 'RAW',
    resource: { values: [[CUMULATIVE_HEADER[scoreCol]]] },
  });
  if (scoreCells.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: BCSTAT_SPREADSHEET_ID,
      range: `'${BCSTAT_CUMULATIVE_SHEET_NAME}'!${colLetter(scoreCol)}2`,
      valueInputOption: 'RAW',
      resource: { values: scoreCells },
    });
  }
  const averages = new Map();
  perPlayer.forEach((list, key) => averages.set(key, averageScores(list)));
  return averages;
}

module.exports = { computeScore, computeScoreParts, computeScoreBreakdown, averageScores, syncCumulativeScores };
