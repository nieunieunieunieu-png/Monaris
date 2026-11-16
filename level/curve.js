// ===== level/curve.js — tính Cấp từ EXP =====
// Bảng cấp độ: costs[n] = EXP cần để lên cấp n (từ cấp n-1), n = 1..MAX. Mặc định lấy công thức ở
// config/level.js, bị ghi đè bởi tab "Bảng Cấp Độ" trên Sheet (nạp ở level/index.js).
const { LEVEL_MAX_LEVEL, defaultExpToReachLevel } = require('../config');

let costs = buildDefaultCosts();
let cumulative = buildCumulative(costs);

function buildDefaultCosts() {
  const arr = [0];
  for (let n = 1; n <= LEVEL_MAX_LEVEL; n += 1) arr.push(defaultExpToReachLevel(n));
  return arr;
}

// cumulative[n] = TỔNG EXP để đạt cấp n (cumulative[0] = 0).
function buildCumulative(list) {
  const cum = [0];
  for (let n = 1; n < list.length; n += 1) cum.push(cum[n - 1] + list[n]);
  return cum;
}

function getDefaultCosts() {
  return buildDefaultCosts();
}

// Nhận mảng chi phí từ Sheet (index 1..N); cấp thiếu/không hợp lệ dùng công thức mặc định.
function setCosts(fromSheet) {
  const next = [0];
  for (let n = 1; n <= LEVEL_MAX_LEVEL; n += 1) {
    const v = Number(fromSheet && fromSheet[n]);
    next.push(Number.isFinite(v) && v > 0 ? Math.round(v) : defaultExpToReachLevel(n));
  }
  costs = next;
  cumulative = buildCumulative(costs);
}

function levelFromExp(exp) {
  const total = Math.max(0, Number(exp) || 0);
  let level = 0;
  while (level < LEVEL_MAX_LEVEL && total >= cumulative[level + 1]) level += 1;
  return level;
}

// Thông tin tiến độ để hiển thị: đã có bao nhiêu EXP trong cấp hiện tại / cần bao nhiêu để lên cấp kế.
function progressInfo(exp) {
  const total = Math.max(0, Number(exp) || 0);
  const level = levelFromExp(total);
  const maxed = level >= LEVEL_MAX_LEVEL;
  const floor = cumulative[level];
  const need = maxed ? 0 : costs[level + 1];
  const into = total - floor;
  return { level, total, maxed, floor, need, into, toNext: maxed ? 0 : need - into, percent: maxed ? 100 : Math.min(100, Math.floor((into / need) * 100)) };
}

function getCosts() {
  return costs.slice();
}

function getCumulative() {
  return cumulative.slice();
}

module.exports = { levelFromExp, progressInfo, setCosts, getCosts, getCumulative, getDefaultCosts, MAX_LEVEL: LEVEL_MAX_LEVEL };
