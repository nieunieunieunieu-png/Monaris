// ===== level/topRole.js — Role Top TUẦN (10 người) + Top THÁNG (5 người) — THƯỞNG CÓ HẠN =====
// Tới tuần/tháng MỚI mới tính top của tuần/tháng VỪA RỒI rồi gắn role, giữ suốt cả tuần/tháng mới; qua kỳ kế tiếp thì gỡ và cấp lại cho top mới.
//   TOP TUẦN : top LEVEL_TOP_ROLE_COUNT (mặc định 10) EXP tuần vừa rồi (level/weekSnapshot.js lastWeekRanking, chốt 00:00 Thứ Hai) -> role LEVEL_TOP_ROLE_ID.
//   TOP THÁNG: top LEVEL_MONTH_ROLE_COUNT (mặc định 5) EXP tháng vừa rồi (level/monthly.js lastMonthRanking, chốt ngày 1) -> role LEVEL_MONTH_ROLE_ID.
// THIẾU DỮ LIỆU THÁNG (mới deploy / không đủ người / người đã rời server): bù bằng top tuần vừa rồi cho đủ số lượng, bảng tuần đôn người kế tiếp lên.
// ƯU TIÊN THÁNG: người có role tháng KHÔNG được role tuần. Không ai giữ cả 2 role.
// Mỗi phút đối chiếu lại (nhanh chóng áp dụng khi sang tuần/tháng mới); mỗi 10 phút quét lại cả server để gỡ role ở người không nằm trong danh sách (kể cả ai bị gắn tay).
// NGƯỜI TẮT ROLE TOP: ai bấm "🏅 Role Top: TẮT" trong /profile (cột K tab Hồ Sơ Cá Nhân) thì KHÔNG bị gắn role Top tuần/tháng trên Discord (role đè màu role họ muốn); họ vẫn nằm trong danh sách Top (nhãn Top trên thẻ /level, /hoso vẫn hiện) và không chiếm suất của người khác.
// Người đã rời server / bot không được tính. Không bao giờ ném lỗi.
const { PermissionFlagsBits } = require('discord.js');
const client = require('../client');
const {
  DISCORD_GUILD_ID,
  LEVEL_TOP_ROLE_ID,
  LEVEL_TOP_ROLE_COUNT,
  LEVEL_MONTH_ROLE_ID,
  LEVEL_MONTH_ROLE_COUNT,
} = require('../config');
const { weekKey } = require('./week');
const monthly = require('./monthly');
const weekly = require('./weekSnapshot');

const VERIFY_EVERY_MS = 10 * 60 * 1000;
let lastWeek = new Set();
let lastMonth = new Set();
let weekList = []; // thứ tự đã gắn (để /toprole hiện đúng hạng)
let monthList = [];
let lastVerify = 0;
let busy = false;
const warned = new Set();

// Người này đã tắt role Top trong /profile? (require trễ để tránh vòng phụ thuộc lúc nạp module)
function isHidden(userId) {
  try {
    const rec = require('./profile').getProfileRecord(userId);
    return Boolean(rec && rec.hideTopRole);
  } catch (_) {
    return false;
  }
}

function warnOnce(key, message) {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[level] ${message}`);
}

// Role có gắn/gỡ được không (tồn tại, không phải role tích hợp, thấp hơn role cao nhất của bot, bot có Manage Roles).
function usableRole(guild, roleId, label) {
  const role = guild.roles.cache.get(roleId);
  if (!role) return warnOnce(`missing${roleId}`, `Role ${label} (${roleId}) không tồn tại trong server.`), null;
  if (role.managed) return warnOnce(`managed${roleId}`, `Role ${label} là role tích hợp, không gắn được.`), null;
  const me = guild.members.me;
  if (!me || !me.permissions.has(PermissionFlagsBits.ManageRoles)) return warnOnce('perm', `Bot thiếu quyền Manage Roles — không gắn được role ${label}.`), null;
  if (role.position >= me.roles.highest.position) return warnOnce(`pos${roleId}`, `Role "${role.name}" (${label}) cao hơn/bằng role cao nhất của bot — kéo role của bot lên trên role này.`), null;
  return role;
}

async function memberOf(guild, id) {
  const member = guild.members.cache.get(id) || (await guild.members.fetch(id).catch(() => null));
  return member && !member.user.bot ? member : null;
}

// Lấy tối đa `count` người đầu danh sách ID (đã xếp hạng) còn ở trong server, bỏ qua ID trong `skip`; người rời server thì lấy người kế tiếp bù.
async function pickFromIds(guild, ids, count, skip = new Set()) {
  const result = [];
  for (const id of ids) {
    if (result.length >= count) break;
    if (skip.has(id)) continue;
    const member = await memberOf(guild, id);
    if (member) result.push(member);
  }
  return result;
}

// Gắn role cho người có trong `wanted`, gỡ ở người đang giữ mà không có trong `wanted`.
async function syncRole(role, wanted, label) {
  const wantedIds = new Set(wanted.map((m) => m.id));
  for (const holder of [...role.members.values()]) {
    if (wantedIds.has(holder.id)) continue;
    await holder.roles.remove(role, `Không còn trong ${label}`).catch((error) => console.error(`[level] Không gỡ được role ${label} của ${holder.id}:`, error.message));
    console.log(`[level] Gỡ role ${label} của ${holder.displayName} (${holder.id}).`);
  }
  for (const member of wanted) {
    if (member.roles.cache.has(role.id)) continue;
    await member.roles.add(role, `Đứng ${label}`).catch((error) => console.error(`[level] Không gắn được role ${label} cho ${member.id}:`, error.message));
    console.log(`[level] Gắn role ${label} cho ${member.displayName} (${member.id}).`);
  }
  return wantedIds;
}

const sameSet = (a, b) => a.size === b.size && [...a].every((id) => b.has(id));

// isLoaded: () => bool (getRecords giữ cho tương thích, không còn dùng).
async function tick(getRecords, isLoaded) {
  if ((!LEVEL_TOP_ROLE_ID && !LEVEL_MONTH_ROLE_ID) || busy || !isLoaded()) return;
  busy = true;
  try {
    const guild = client.guilds.cache.get(DISCORD_GUILD_ID);
    if (!guild) return;
    const weekRole = LEVEL_TOP_ROLE_ID ? usableRole(guild, LEVEL_TOP_ROLE_ID, 'Top tuần') : null;
    const monthRole = LEVEL_MONTH_ROLE_ID ? usableRole(guild, LEVEL_MONTH_ROLE_ID, 'Top tháng') : null;
    if (!weekRole && !monthRole) return;

    const now = Date.now();
    const fullVerify = now - lastVerify > VERIFY_EVERY_MS;
    if (fullVerify) {
      await guild.members.fetch().catch((error) => console.error('[level] Không nạp được danh sách thành viên (role Top):', error.message));
      lastVerify = now;
    }

    // Bảng xếp hạng đã chốt. null = chưa chốt được (vừa khởi động / đọc Sheet lỗi) -> giữ nguyên role hiện có, không đảo.
    const weekRanking = weekRole || monthRole ? await weekly.lastWeekRanking() : [];
    const monthRanking = monthRole ? await monthly.lastMonthRanking() : [];

    // 1) Top tháng (ưu tiên), thiếu thì bù từ top tuần vừa rồi.
    let monthIds = lastMonth;
    let monthMembers = null;
    if (monthRole && monthRanking && weekRanking) {
      monthMembers = await pickFromIds(guild, monthRanking, LEVEL_MONTH_ROLE_COUNT);
      if (monthMembers.length < LEVEL_MONTH_ROLE_COUNT) {
        const have = new Set(monthMembers.map((m) => m.id));
        monthMembers = [...monthMembers, ...(await pickFromIds(guild, weekRanking, LEVEL_MONTH_ROLE_COUNT - monthMembers.length, have))];
      }
      monthIds = new Set(monthMembers.map((m) => m.id));
    } else if (!monthRole) {
      monthIds = new Set(); // không có role tháng thì không ai được ưu tiên
    }

    // 2) Top tuần: bỏ người thuộc top tháng, lấy người kế tiếp bù cho đủ.
    let weekMembers = null;
    if (weekRole && weekRanking) weekMembers = await pickFromIds(guild, weekRanking, LEVEL_TOP_ROLE_COUNT, monthIds);
    const weekIds = weekMembers ? new Set(weekMembers.map((m) => m.id)) : lastWeek;

    const changed = !sameSet(weekIds, lastWeek) || !sameSet(monthIds, lastMonth);
    if (!fullVerify && !changed) return;

    // Gỡ role tuần ở người vừa vào top tháng TRƯỚC khi gắn role tháng (không ai giữ cả 2 role dù chỉ trong chốc lát).
    // Người đã tắt role Top: coi như không cần role (nếu đang giữ thì syncRole gỡ), nhưng vẫn nằm trong weekIds/monthIds để thẻ hiện nhãn Top.
    if (weekRole && weekMembers) await syncRole(weekRole, weekMembers.filter((m) => !isHidden(m.id)), 'Top tuần');
    if (monthRole && monthMembers) await syncRole(monthRole, monthMembers.filter((m) => !isHidden(m.id)), 'Top tháng');
    lastWeek = weekIds;
    lastMonth = monthIds;
    if (weekMembers) weekList = weekMembers.map((m) => m.id);
    if (monthMembers) monthList = monthMembers.map((m) => m.id);
  } catch (error) {
    console.error('[level] Lỗi cập nhật role Top tuần/tháng:', error.message);
  } finally {
    busy = false;
  }
}

// Áp dụng NGAY cho 1 người khi họ bật/tắt role Top trong /profile (khỏi chờ vòng đối chiếu 1 phút / 10 phút). Không ném lỗi.
async function refreshMember(userId) {
  try {
    const guild = client.guilds.cache.get(DISCORD_GUILD_ID);
    if (!guild) return;
    const member = await memberOf(guild, userId);
    if (!member) return;
    const hidden = isHidden(userId);
    for (const [roleId, set, label] of [[LEVEL_MONTH_ROLE_ID, lastMonth, 'Top tháng'], [LEVEL_TOP_ROLE_ID, lastWeek, 'Top tuần']]) {
      if (!roleId) continue;
      const role = usableRole(guild, roleId, label);
      if (!role) continue;
      const should = set.has(userId) && !hidden;
      const has = member.roles.cache.has(roleId);
      if (should && !has) {
        await member.roles.add(role, `Đứng ${label} (đã bật lại role Top)`).catch((error) => console.error(`[level] Không gắn được role ${label} cho ${userId}:`, error.message));
      } else if (!should && has) {
        await member.roles.remove(role, `Tắt role ${label} theo hồ sơ`).catch((error) => console.error(`[level] Không gỡ được role ${label} của ${userId}:`, error.message));
      }
    }
  } catch (error) {
    console.error('[level] Lỗi áp dụng bật/tắt role Top:', error.message);
  }
}

// ---- Hạn role + trạng thái (dùng cho nhãn trên thẻ /level, /hoso và lệnh /toprole) ----
const VN_MS = 7 * 60 * 60 * 1000;

// Mốc hết hạn (ms, UTC): 00:00 Thứ Hai kế tiếp / 00:00 ngày 1 tháng kế tiếp theo giờ VN.
function weekEndsAt(now = Date.now()) {
  const [y, m, d] = weekKey(now).split('-').map(Number);
  return Date.UTC(y, m - 1, d + 7) - VN_MS;
}
function monthEndsAt(now = Date.now()) {
  const vn = new Date(now + VN_MS);
  return Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth() + 1, 1) - VN_MS;
}

function remainText(endsAt, now = Date.now()) {
  const ms = Math.max(0, endsAt - now);
  if (ms >= 24 * 3600 * 1000) return `còn ${Math.ceil(ms / (24 * 3600 * 1000))} ngày`;
  if (ms >= 3600 * 1000) return `còn ${Math.ceil(ms / (3600 * 1000))} giờ`;
  return `còn ${Math.max(1, Math.ceil(ms / 60000))} phút`;
}

// Người này đang giữ role nào? -> { kind: 'month'|'week', label, remain, color } hoặc null. (Ưu tiên tháng; không ai giữ cả 2.)
function statusOf(userId) {
  if (LEVEL_MONTH_ROLE_ID && lastMonth.has(userId)) return { kind: 'month', label: 'Top tháng', remain: remainText(monthEndsAt()), color: '#ffd166' };
  if (LEVEL_TOP_ROLE_ID && lastWeek.has(userId)) return { kind: 'week', label: 'Top tuần', remain: remainText(weekEndsAt()), color: '#6bd68f' };
  return null;
}

// Đối chiếu danh sách bot định gắn với người đang thực sự giữ role trên Discord (cho /toprole).
function describe(guild) {
  const out = [];
  for (const [kind, roleId, list, endsAt, title] of [
    ['month', LEVEL_MONTH_ROLE_ID, monthList, monthEndsAt(), 'Top tháng'],
    ['week', LEVEL_TOP_ROLE_ID, weekList, weekEndsAt(), 'Top tuần'],
  ]) {
    if (!roleId) continue;
    const role = guild.roles.cache.get(roleId);
    const holders = role ? [...role.members.keys()] : [];
    out.push({
      kind,
      title,
      roleId,
      roleMissing: !role,
      list,
      endsAt,
      remain: remainText(endsAt),
      extra: holders.filter((id) => !list.includes(id)), // đang giữ role nhưng không nằm trong danh sách
      missing: list.filter((id) => !holders.includes(id) && !isHidden(id)), // trong danh sách nhưng chưa có role (không tính người đã tắt role)
      hidden: list.filter((id) => isHidden(id)), // người đã tắt role Top trong /profile (cố ý không gắn)
    });
  }
  return out;
}

module.exports = { tick, statusOf, describe, refreshMember };
