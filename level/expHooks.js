// ===== level/expHooks.js — móc nhỏ cho module khác biết "người này vừa NHẬN EXP" (VD samHoi: điểm sám hối tăng = ½ EXP nhận được) =====
// File nhẹ, KHÔNG require discord/sheet (cùng kiểu level/expExclude.js). Không có listener = không đổi gì.
// CHỈ phát khi EXP TĂNG qua awardExp / grantBonusExp. Trừ EXP (penalizeExp) và chỉnh tay admin (/expadd, /expset) KHÔNG phát.
const listeners = [];
function onGain(fn) { if (typeof fn === 'function') listeners.push(fn); }
// Bộ chỉnh EXP TRƯỚC khi cộng (VD samHoi: còn điểm sám hối thì EXP nhận được ×0.5). Mỗi bộ chỉnh nhận (userId, gained) trả EXP mới; lỗi/giá trị lạ -> giữ nguyên.
const adjusters = [];
function onBeforeGain(fn) { if (typeof fn === 'function') adjusters.push(fn); }
function adjustGain(userId, gained) {
  let g = Number(gained);
  if (!(g > 0)) return gained;
  for (const fn of adjusters) {
    try {
      const out = Number(fn(String(userId), g));
      if (Number.isFinite(out) && out >= 0) g = out;
    } catch (e) { console.error('[level] bộ chỉnh EXP lỗi:', e && e.message); }
  }
  return Math.round(g * 100) / 100;
}
function emitGain(userId, gained, name) {
  if (!(gained > 0)) return;
  for (const fn of listeners) {
    try { fn(String(userId), gained, name || ''); } catch (e) { console.error('[level] listener nhận EXP lỗi:', e && e.message); }
  }
}
module.exports = { onGain, emitGain, onBeforeGain, adjustGain };
