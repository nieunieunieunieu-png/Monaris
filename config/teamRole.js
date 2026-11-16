// ===== config/teamRole.js — Role team cho bảng xếp đội hình (Bang Chiến / Scrim 1 / Scrim 2) =====
// CHỈ 1 bộ 5 role (Trụ, Mid, Flex, Cánh Trên, Cánh Dưới) dùng chung cho cả 3 đội hình (web Monaris Admin gọi qua /admin/team-roles/*).
// Bot chỉ gắn/tháo đúng 5 role này, không đụng role nào khác. Ảnh chụp lần đồng bộ cuối lưu ở tab
// TEAM_ROLE_SHEET_NAME (cùng spreadsheet BOT_CHAT_HISTORY_SPREADSHEET_ID, giống tab "Pick Role").
// ENV: TEAM_ROLE_ENABLED (mặc định bật; "0"/"false"/"off" để tắt), TEAM_ROLE_GUILD_ID,
//      TEAM_ROLE_REMOVE_GUARD_PERCENT (mặc định 50), TEAM_ROLE_CONCURRENCY (mặc định 5).
// Chỉ chứa giá trị, không chứa logic.

const TEAM_ROLE_ENABLED = !/^(0|false|off)$/i.test(String(process.env.TEAM_ROLE_ENABLED || '1').trim());
const TEAM_ROLE_GUILD_ID = process.env.TEAM_ROLE_GUILD_ID || '';
const TEAM_ROLE_SHEET_NAME = 'Team Role';

// Chốt an toàn: số người bị tháo > ngần này % số người đang giữ role team thì từ chối (trừ khi force).
const TEAM_ROLE_REMOVE_GUARD_PERCENT = Number(process.env.TEAM_ROLE_REMOVE_GUARD_PERCENT) || 50;
// Số lệnh gắn/tháo role chạy song song (tốc độ; discord.js tự xử lý 429).
const TEAM_ROLE_CONCURRENCY = Math.max(1, Number(process.env.TEAM_ROLE_CONCURRENCY) || 5);

// Thứ tự khai báo = thứ tự hiển thị. roleKey KHÔNG đổi (web lưu theo khoá này).
// expectedName: tên role trên Discord, dạng rút gọn (tên thật có thể còn tiền tố "BC - "; check.js so khớp theo phần đuôi để bắt ghép sai ID).
const TEAM_ROLE_DEFS = [
  { roleKey: 'tru', roleId: '', expectedName: 'Trụ' },
  { roleKey: 'mid', roleId: '', expectedName: 'Mid' },
  { roleKey: 'flex', roleId: '', expectedName: 'Flex' },
  { roleKey: 'canhtren', roleId: '', expectedName: 'Cánh Trên' },
  { roleKey: 'canhduoi', roleId: '', expectedName: 'Cánh Dưới' },
];

const TEAM_ROLE_KEYS = TEAM_ROLE_DEFS.map((d) => d.roleKey);
const TEAM_ROLE_ID_BY_KEY = Object.fromEntries(TEAM_ROLE_DEFS.map((d) => [d.roleKey, d.roleId]));
const TEAM_ROLE_KEY_BY_ID = Object.fromEntries(TEAM_ROLE_DEFS.map((d) => [d.roleId, d.roleKey]));
const TEAM_ROLE_NAME_BY_KEY = Object.fromEntries(TEAM_ROLE_DEFS.map((d) => [d.roleKey, d.expectedName]));

module.exports = {
  TEAM_ROLE_ENABLED,
  TEAM_ROLE_GUILD_ID,
  TEAM_ROLE_SHEET_NAME,
  TEAM_ROLE_REMOVE_GUARD_PERCENT,
  TEAM_ROLE_CONCURRENCY,
  TEAM_ROLE_DEFS,
  TEAM_ROLE_KEYS,
  TEAM_ROLE_ID_BY_KEY,
  TEAM_ROLE_KEY_BY_ID,
  TEAM_ROLE_NAME_BY_KEY,
};
