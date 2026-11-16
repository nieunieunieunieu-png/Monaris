// ===== hoso/data.js — gom dữ liệu 1 người từ các Sheet/module có sẵn cho thẻ /hoso (Cấp độ · Thí Kiếm · Bang Chiến) =====
// Không ghi gì, chỉ ĐỌC. Mỗi nguồn lấy độc lập (Promise.allSettled): nguồn nào lỗi thì mục đó hiện "chưa có dữ liệu",
// các mục còn lại vẫn hiện. Danh sách lớn (Thí Kiếm / bcstat / ChatGlobal) có cache ngắn để nhiều người gõ /hoso liên tiếp không dồn quota Sheets.
const status = require('../monitoring/status');
const { getLevelSnapshot } = require('../level');
const { getMemberInfoByDiscordId } = require('../googleSheets/memberSheet');
const { getAllChatGlobalMembers, getAllChatGlobalRelations } = require('../googleSheets/chatGlobalSheet');
const { getAllRankEntries, getBangRankEntries } = require('../googleSheets/thiKiemSheet');
const { getSummaryRows } = require('../googleSheets/bcStatSummary');
const { getManualAchievements } = require('./manualAchievements');
const { getCustomAchievements } = require('./customAchievement');

const CACHE_MS = 60 * 1000;
const cache = new Map(); // key -> { at, value, pending }

// Cache theo khoá; nhiều lời gọi đồng thời dùng chung 1 lượt tải.
function cached(key, loader) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
  const value = Promise.resolve()
    .then(loader)
    .catch((error) => {
      cache.delete(key);
      throw error;
    });
  cache.set(key, { at: Date.now(), value });
  return value;
}

function norm(s) {
  return String(s || '').trim().toLowerCase();
}

async function loadThiKiem(userId, className) {
  if (!require('../config/branding').BANG_INTEGRATION_ENABLED) return null;
  const all = await cached('thikiem', () => getAllRankEntries());
  const entries = await cached('thikiem-bang', () => getBangRankEntries());
  const me = all.find((e) => e.discordId === String(userId));
  if (!me || me.diem === null || me.diem === undefined) return null;
  // Chỉ đếm người đã có điểm: hangTotal = tổng cả bang (b trong a/b), classTotal = tổng hệ phái (y trong x/y).
  const scored = entries.filter((e) => e.diem !== null && e.diem !== undefined);
  let classRank = null;
  let classTotal = 0;
  const cls = className || me.className;
  if (cls) {
    const same = scored.filter((e) => norm(e.className) === norm(cls)).sort((a, b) => b.diem - a.diem);
    classTotal = same.length;
    const idx = same.findIndex((e) => e.discordId === String(userId));
    if (idx >= 0) classRank = idx + 1;
  }
  return { diem: me.diem, hang: me.hang, hangTotal: scored.length, classRank, classTotal, soTran: me.soTran, soTranThang: me.soTranThang, haGuc: me.haGuc, capNhatLuc: me.capNhatLuc };
}

async function loadBcStat(userId, ingame) {
  if (!require('../config/branding').BANG_INTEGRATION_ENABLED) return null;
  const summary = await cached('bcstat', () => getSummaryRows());
  if (!summary) return null;
  const me = summary.players.find((p) => p.discordId === String(userId)) || (ingame ? summary.players.find((p) => norm(p.name) === norm(ingame)) : null);
  if (!me) return null;
  return {
    items: summary.categories.map((c) => ({ key: c.key, label: c.label, value: me.values[c.key] ? me.values[c.key].record : '' })),
    // Kỷ lục KD (class DPS) / HD (Tố Vấn) / TD (Thiết Y) — number | '' (không áp dụng class hoặc chưa có dữ liệu = ''), tính sẵn ở bcStatSummary.js.
    kd: me.recordKd === undefined ? '' : me.recordKd,
    hd: me.recordHd === undefined ? '' : me.recordHd,
    td: me.recordTd === undefined ? '' : me.recordTd, // chống chịu / trọng thương (Thiết Y)
  };
}

// Chỉ lấy Ingame/Hệ phái dự phòng từ ChatGlobal (khi tab Bang chưa có); thẻ không còn hiện Quan hệ.
async function loadIdentity(userId) {
  const all = await cached('chatglobal', () => getAllChatGlobalMembers());
  const me = all.find((m) => m.discordId === String(userId));
  if (!me) return null;
  return { ingame: me.ingame || '', className: me.className || '' };
}

// Quan hệ của người này (chỉ gọi khi họ bật "hiện Quan hệ"): { triKy, suPhu, deTu[] } — mỗi người = { name, ingame, className }.
// Đọc cột E/F/G của ChatGlobal KHÔNG lọc theo Ingame (người mới chỉ có hàng trống tên vẫn thấy), tên/hệ phái người kia lấy từ tab "Bang" rồi mới tới ChatGlobal.
async function describePerson(id, chatAll) {
  const profile = require('../level/profile');
  const bang = await getMemberInfoByDiscordId(id).catch(() => null);
  const cg = chatAll.find((m) => m.discordId === String(id));
  const ingame = (bang && bang.ingame) || (cg && cg.ingame) || '';
  const className = (bang && bang.className) || (cg && cg.className) || '';
  const name = await profile.resolveName(String(id), ingame || (cg && cg.nickname) || 'Thành viên');
  return { name, ingame, className };
}

async function loadQuanHe(userId) {
  const rels = await cached('chatglobal-rel', () => getAllChatGlobalRelations());
  const me = rels.find((r) => r.discordId === String(userId));
  const deTuIds = rels.filter((r) => r.suPhuId === String(userId) && r.discordId !== String(userId)).map((r) => r.discordId);
  if ((!me || (!me.triKyId && !me.suPhuId)) && !deTuIds.length) return null;
  const chatAll = await cached('chatglobal', () => getAllChatGlobalMembers()).catch(() => []);
  const one = (id) => describePerson(id, chatAll).catch(() => null);
  const [triKy, suPhu, ...deTu] = await Promise.all([me && me.triKyId ? one(me.triKyId) : null, me && me.suPhuId ? one(me.suPhuId) : null, ...deTuIds.map(one)]);
  return { triKy: triKy || null, suPhu: suPhu || null, deTu: deTu.filter(Boolean) };
}

// Trả { ingame, className, level, thiKiem, bcstat } — mục nào không có = null.
async function collectHoso(userId) {
  const bang = await getMemberInfoByDiscordId(userId).catch(() => null);
  let ingame = (bang && bang.ingame) || '';
  let className = (bang && bang.className) || '';

  if (!ingame || !className) {
    const identity = await loadIdentity(userId).catch((e) => {
      status.recordSheetError('Hồ sơ: ChatGlobal', e);
      return null;
    });
    if (identity) {
      ingame = ingame || identity.ingame;
      className = className || identity.className;
    }
  }

  const wrap = (label, p) =>
    p.then(
      (v) => {
        status.recordSheetOk(label);
        return v;
      },
      (e) => {
        status.recordSheetError(label, e);
        return null;
      }
    );

  const [thiKiem, bcstat] = await Promise.all([
    wrap('Hồ sơ: Thí Kiếm', loadThiKiem(userId, className)),
    wrap('Hồ sơ: bcstat', loadBcStat(userId, ingame)),
  ]);

  return {
    ingame,
    className,
    level: getLevelSnapshot(String(userId)),
    thiKiem,
    bcstat,
    manualAchievements: getManualAchievements(userId),
    customAchievements: getCustomAchievements(userId),
  };
}

module.exports = { collectHoso, loadQuanHe };
