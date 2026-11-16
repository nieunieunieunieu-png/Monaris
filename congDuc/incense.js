// ===== congDuc/incense.js — Thắp hương (miễn phí) + Đốt hương (tốn Điểm Hoạt Động -> EXP Level + Công Đức) =====
// Chỉ LOGIC, trả về object kết quả (UI nút/embed ở phần Sảnh). Thứ tự đốt hương (mục 3.2 của prompt):
//   (1) khoá userId -> (2) đọc ĐIỂM TƯƠI, đủ mới đi tiếp -> (3) ghi sổ "Lịch Sử Dùng Điểm" (idempotent theo note) ->
//   (4) ghi nhận lần đốt + Công Đức và LƯU NGAY -> (5) cộng EXP Level bằng grantBonusExp (KHÔNG awardExp, KHÔNG cộng Điểm HĐ).
// Lỗi ở (3): không cộng gì. Lỗi sau (3): log lớn kèm userId để admin bù, thử lại KHÔNG trừ điểm lần 2 (sổ đã có note).
// Lưu số lần đốt TRƯỚC khi cộng EXP: nếu bot chết giữa chừng thì mất EXP (có log để bù) chứ không để người chơi đốt lại lần đó nhận thưởng 2 lần.
const cfg = require('../config/congDuc');
const core = require('./core');

const BALANCE_TTL_MS = 60_000;
const balanceCache = new Map(); // userId -> { value, at }  (chỉ để HIỂN THỊ giá/nút; lúc đốt luôn đọc điểm tươi)

// Phụ thuộc ngoài, nạp lười để test thuần không cần Discord/Google. Test gọi setDeps() để thay.
const realDeps = {
  readPoints: (...a) => require('../googleSheets/shopSheet').readPoints(...a),
  appendLedger: (...a) => require('../googleSheets/shopSheet').appendLedger(...a),
  hasLedgerNote: (...a) => require('../googleSheets/shopSheet').hasLedgerNote(...a),
  grantBonusExp: (...a) => require('../level').grantBonusExp(...a),
  isLevelReady: () => { const { LEVEL_ENABLED } = require('../config'); return LEVEL_ENABLED && require('../level').getLevelStatus().loaded; },
  logActivity: (t) => { try { require('../activityLog').logActivity(t, 600); } catch { /* bỏ qua */ } },
};
let deps = realDeps;
function setDeps(over) { deps = over ? { ...realDeps, ...over } : realDeps; balanceCache.clear(); }

// Số dư Điểm HĐ (cache ≤ 60s) — CHỈ để hiển thị. Lỗi đọc -> null.
async function cachedBalance(userId, now = Date.now()) {
  const c = balanceCache.get(userId);
  if (c && now - c.at < BALANCE_TTL_MS) return c.value;
  try {
    const v = await deps.readPoints(userId);
    const value = v === null || v === undefined ? 0 : Number(v);
    balanceCache.set(userId, { value, at: now });
    return value;
  } catch { return null; }
}

// Thông tin báo giá cho 1 người (dùng ở phản hồi ephemeral): lượt đã đốt, lần kế + giá, đủ điểm không.
async function quote(userId, name, { now = Date.now() } = {}) {
  const rec = core.rollDay(core.getRecord(userId, name), core.vnDay(now));
  const next = core.nextBurn(rec, now);
  const balance = next ? await cachedBalance(userId, now) : null;
  return { rec, done: core.burnsToday(rec, now), max: core.MAX_BURNS_PER_DAY, next, balance, canAfford: Boolean(next) && balance !== null && balance >= next.cost, paidEnabled: cfg.CONG_DUC_INCENSE_PAID_ENABLED };
}

// ---------- Thắp hương miễn phí ----------
async function freeIncense(userId, name, { now = Date.now() } = {}) {
  const out = await core.withUserLock(userId, async () => core.doFreeIncense(userId, name, { now }));
  if (out.busy) return { status: 'busy' };
  return out.ok ? { status: 'ok', ...out } : { status: 'already', rec: out.rec };
}

// ---------- Đốt hương ----------
// expectN: số lần mà nút bấm dựa vào (nếu lệch số lần thật -> 'mismatch', không trừ gì).
async function burnIncense(userId, name, { expectN = 0, channelId = '', now = Date.now(), rng = Math.random } = {}) {
  if (!cfg.CONG_DUC_INCENSE_PAID_ENABLED) return { status: 'disabled' };
  if (!deps.isLevelReady()) return { status: 'level_loading' };
  const locked = await core.withUserLock(userId, async () => {
    const day = core.vnDay(now);
    const rec = core.rollDay(core.getRecord(userId, name), day);
    const nb = core.nextBurn(rec, now);
    if (!nb) return { status: 'done_all', rec };
    if (expectN && expectN !== nb.n) return { status: 'mismatch', next: nb, rec };

    // (2) điểm tươi từ Sheet
    let have;
    try { const v = await deps.readPoints(userId); have = v === null || v === undefined ? 0 : Number(v); }
    catch (error) { console.error('[công đức] Không đọc được Điểm HĐ:', error.message); return { status: 'error', stage: 'read' }; }
    if (!(have >= nb.cost)) return { status: 'no_points', need: nb.cost, have, next: nb, rec };

    // (3) ghi sổ — idempotent theo note: đã có dòng thì LẦN TRƯỚC đã trừ rồi, không trừ nữa
    const note = `huong|${day}|${nb.n}`;
    let charged = false;
    try {
      const had = await deps.hasLedgerNote(userId, note);
      if (!had) { await deps.appendLedger({ userId, event: `Đốt hương lần ${nb.n}`, points: nb.cost, note }); charged = true; }
    } catch (error) {
      console.error('[công đức] Không ghi được sổ trừ điểm đốt hương (không cộng gì):', error.message);
      return { status: 'error', stage: 'ledger' };
    }
    balanceCache.set(userId, { value: charged ? have - nb.cost : have, at: now });

    // (4) thưởng: ghi nhận lần đốt + Công Đức, lưu ngay
    const roll = core.rollBurn(nb.n, rng);
    let realmUp = null;
    try {
      realmUp = core.applyBurn(userId, name, nb.n, roll.cd, { now }).realmUp;
      await core.flush();
    } catch (error) {
      deps.logActivity(`❗ [công đức] ĐỐT HƯƠNG LỖI SAU KHI TRỪ ĐIỂM — userId ${userId}, lần ${nb.n}, trừ ${nb.cost} điểm (${note}), thưởng ${roll.cd} Công Đức + ${roll.exp} EXP: ${error.message}. Admin kiểm tra/bù.`);
    }
    // (5) EXP Level (chỉ EXP tổng)
    const gained = deps.grantBonusExp(userId, roll.exp, { name, channelId });
    if (gained > 0) { rec.bonusExp = Math.round(((rec.bonusExp || 0) + gained) * 100) / 100; core.markDirty(rec); } // để level/expExclude.js loại EXP hương khỏi Top tháng
    if (!(gained > 0)) deps.logActivity(`❗ [công đức] Đốt hương đã trừ ${nb.cost} điểm nhưng chưa cộng được ${roll.exp} EXP — userId ${userId}, lần ${nb.n} (${note}). Admin bù EXP.`);

    return { status: 'ok', n: nb.n, cost: nb.cost, roll, expGranted: gained, charged, next: core.nextBurn(rec, now), realmUp, rec };
  });
  return locked.busy ? { status: 'busy' } : locked;
}

module.exports = { setDeps, quote, freeIncense, burnIncense, cachedBalance };
