// ===== level/roles.js — Role theo mốc cấp độ =====
// Mốc nằm ở tab "Role Cấp Độ" của sheet Level (xem googleSheets/levelSheet.js): Cấp -> Role ID.
// Đạt cấp N thì người đó được gắn role của mốc CAO NHẤT <= N. Mặc định gỡ role các mốc thấp hơn
// (LEVEL_ROLE_STACK=true để giữ cộng dồn). Module này không bao giờ ném lỗi ra ngoài: thiếu quyền /
// role cao hơn bot / role không tồn tại chỉ ghi log (mỗi lỗi 1 lần) và bỏ qua, không ảnh hưởng EXP.
const { PermissionFlagsBits } = require('discord.js');
const client = require('../client');
const { DISCORD_GUILD_ID, LEVEL_ROLE_STACK, LEVEL_ROLE_SYNC_DELAY_MS } = require('../config');

let milestones = []; // [{ level, roleId }] tăng dần theo level
const warned = new Set();

function warnOnce(key, message) {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[level] ${message}`);
}

function setMilestones(list) {
  milestones = (Array.isArray(list) ? list : []).slice().sort((a, b) => a.level - b.level);
}

function getMilestones() {
  return milestones.slice();
}

function hasMilestones() {
  return milestones.length > 0;
}

// Từ tập role người đó đang có + cấp -> danh sách role cần gắn / gỡ (chưa xét quyền của bot).
function planFor(heldRoleIds, level) {
  const eligible = milestones.filter((m) => m.level <= level);
  const target = eligible.length ? eligible[eligible.length - 1].roleId : null;
  const add = [];
  const remove = [];
  if (LEVEL_ROLE_STACK) {
    for (const m of eligible) if (!heldRoleIds.has(m.roleId) && !add.includes(m.roleId)) add.push(m.roleId);
  } else {
    if (target && !heldRoleIds.has(target)) add.push(target);
    for (const m of milestones) if (m.roleId !== target && heldRoleIds.has(m.roleId) && !remove.includes(m.roleId)) remove.push(m.roleId);
  }
  return { add, remove };
}

// Bot có quản lý được role này không (tồn tại, không phải role tích hợp, thấp hơn role cao nhất của bot, có quyền Manage Roles).
function manageable(guild, roleId) {
  const role = guild.roles.cache.get(roleId);
  if (!role) {
    warnOnce(`missing:${roleId}`, `Role ${roleId} ở tab "Role Cấp Độ" không tồn tại trong server — bỏ qua.`);
    return false;
  }
  if (role.managed) {
    warnOnce(`managed:${roleId}`, `Role "${role.name}" là role tích hợp (bot/booster), không gắn được — bỏ qua.`);
    return false;
  }
  const me = guild.members.me;
  if (!me || !me.permissions.has(PermissionFlagsBits.ManageRoles)) {
    warnOnce('perm', 'Bot thiếu quyền Manage Roles — không gắn được role theo cấp.');
    return false;
  }
  if (role.position >= me.roles.highest.position) {
    warnOnce(`pos:${roleId}`, `Role "${role.name}" cao hơn/bằng role cao nhất của bot — kéo role của bot lên trên role này trong Cài đặt server.`);
    return false;
  }
  return true;
}

function getGuild() {
  return client.guilds.cache.get(DISCORD_GUILD_ID) || null;
}

// Gắn/gỡ role theo cấp cho 1 người. opts: { guild, member } (có sẵn thì không cần fetch lại).
// Trả về { added: [roleId], removed: [roleId] } (rỗng nếu không có gì thay đổi / không làm được).
async function applyLevelRoles(userId, level, opts = {}) {
  const result = { added: [], removed: [] };
  try {
    if (!milestones.length) return result;
    const guild = opts.guild || getGuild();
    if (!guild) return result;
    const member = opts.member || (await guild.members.fetch(userId).catch(() => null));
    if (!member || member.user.bot) return result;

    const plan = planFor(new Set(member.roles.cache.keys()), level);
    const remove = plan.remove.filter((id) => manageable(guild, id));
    const add = plan.add.filter((id) => manageable(guild, id));

    if (remove.length) {
      await member.roles.remove(remove, `Level ${level}: đổi role theo mốc cấp`);
      result.removed = remove;
    }
    if (add.length) {
      await member.roles.add(add, `Level ${level}: đạt mốc role`);
      result.added = add;
    }
  } catch (error) {
    console.error(`[level] Không cập nhật được role cho ${userId}:`, error.message);
  }
  return result;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Đồng bộ role cho nhiều người: rows = [{ id, level }]. Chạy tuần tự, nghỉ giữa các lần đổi role (rate limit).
async function syncAllRoles(rows) {
  const stats = { checked: 0, changedMembers: 0, added: 0, removed: 0, missing: 0 };
  const guild = getGuild();
  if (!guild || !milestones.length) return stats;
  try {
    await guild.members.fetch(); // nạp cả danh sách thành viên 1 lần (cần intent GuildMembers — bot đã bật)
  } catch (error) {
    console.error('[level] Không nạp được danh sách thành viên (sẽ tra từng người):', error.message);
  }
  for (const row of rows) {
    stats.checked += 1;
    const member = guild.members.cache.get(row.id) || (await guild.members.fetch(row.id).catch(() => null));
    if (!member) {
      stats.missing += 1;
      continue;
    }
    const r = await applyLevelRoles(row.id, row.level, { guild, member });
    if (r.added.length || r.removed.length) {
      stats.changedMembers += 1;
      stats.added += r.added.length;
      stats.removed += r.removed.length;
      await sleep(LEVEL_ROLE_SYNC_DELAY_MS);
    }
  }
  return stats;
}

module.exports = { setMilestones, getMilestones, hasMilestones, applyLevelRoles, syncAllRoles, planFor };
