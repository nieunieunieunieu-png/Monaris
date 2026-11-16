// ===== Admin API routes: Hồ Sơ Cá Nhân cho WEB (trang /profile của Monaris Admin) =====
// Web chỉnh hồ sơ thay cho /profile trong Discord (bot giữ nguyên /profile). Mọi route nhận { discordId } do SERVER WEB gắn từ phiên đăng nhập
// Discord (không tin client) — ở đây bot kiểm tra thêm người đó thật sự đang ở trong guild (guild.members.fetch, không cache) và không phải bot.
// Lõi xử lý nằm ở level/profileApi.js (dùng chung applyChange với /profile). Lỗi người dùng trả 400 { error } để web hiện thẳng cho người dùng.
//   POST /admin/profile/get          { discordId }                              -> trạng thái hiện tại + danh sách lựa chọn
//   POST /admin/profile/update       { discordId, nickname?, gradient?, frame?, cover?, avatar?, background?, clear? }  (ảnh: base64; clear thêm 'khung')
//        frame (khung thẻ /hoso): object { colors?, crest?, border?, side?, bottom?, accents? } với id phong cách ('macdinh' = mặc định, 'tudong' = tự động theo cấp);
//        chỉ các thành phần CÓ MẶT bị ghi đè, phần vắng giữ nguyên. Chuỗi lưu ('colors=tutien,crest=tudong') hoặc ''/null = về khung mặc định. Phong cách còn khoá theo cấp -> 400 { error }.
//        get trả profile.frame { current, effective } và choices.frame (danh sách phong cách từng thành phần kèm unlockLevel/locked + thang tự động) để dựng giao diện chọn khung.
//   POST /admin/profile/achievement  { discordId, key }                         (key rỗng/null = không đeo)
//   POST /admin/profile/relationship { discordId, loai: suphu|triky|kimlan, idB }
//   POST /admin/profile/preview      { discordId, kind: 'hoso'|'level', frame?, cover?, avatar?, background? }  -> { png: base64 | null } (ảnh base64 / frame kèm theo = XEM THỬ nháp, không lưu; frame cùng định dạng như update, chỉ áp dụng cho kind 'hoso')
// (get dùng POST cho đồng bộ với member/check: web gọi callBotAdmin với body JSON.)

const { DISCORD_GUILD_ID } = require('../../config');
const client = require('../../client');
const { sendJson } = require('../httpUtils');
const api = require('../../level/profileApi');
const profile = require('../../level/profile');
const { isBotReady } = require('../../utils/readyGate');

// Trả { guild, member } nếu discordId là thành viên (không phải bot) của guild; ngược lại gửi lỗi và trả null.
async function requireGuildMember(res, body) {
  const discordId = String(body.discordId || '').trim();
  if (!/^\d{15,25}$/.test(discordId)) {
    sendJson(res, 400, { error: 'discordId không hợp lệ.' });
    return null;
  }
  if (!isBotReady()) {
    sendJson(res, 503, { error: '⏳ Bot đang khởi động, thử lại sau ít phút.' });
    return null;
  }
  try {
    const guild = await client.guilds.fetch(DISCORD_GUILD_ID);
    const member = await guild.members.fetch({ user: discordId, force: true });
    if (member.user.bot) throw new Error('bot');
    return { guild, member, discordId };
  } catch (err) {
    sendJson(res, 403, { error: 'Bạn không phải thành viên của server nên không dùng được trang hồ sơ.' });
    return null;
  }
}

// ok -> 200, lỗi người dùng -> 400 (web đọc data.error).
function reply(res, result) {
  if (result && result.ok === false) return sendJson(res, 400, { error: result.error });
  return sendJson(res, 200, result);
}

const profileRoutes = {
  'POST /admin/profile/get': async (req, res, body) => {
    const ctx = await requireGuildMember(res, body);
    if (!ctx) return;
    const resolveName = (id) => profile.resolveName(id, '');
    reply(res, await api.getState(ctx.discordId, { resolveName }));
  },

  'POST /admin/profile/update': async (req, res, body) => {
    const ctx = await requireGuildMember(res, body);
    if (!ctx) return;
    reply(res, await api.updateProfile(ctx.discordId, body));
  },

  'POST /admin/profile/achievement': async (req, res, body) => {
    const ctx = await requireGuildMember(res, body);
    if (!ctx) return;
    reply(res, await api.chooseAchievement(ctx.discordId, body.key));
  },

  'POST /admin/profile/relationship': async (req, res, body) => {
    const ctx = await requireGuildMember(res, body);
    if (!ctx) return;
    // Người kia (Sư Phụ / Tri Kỷ) cũng phải đang ở trong server và không phải bot — giống ô chọn người trong hộp thoại Discord.
    const isValidTarget = async (id) => {
      try {
        const m = await ctx.guild.members.fetch({ user: id });
        return m.user.bot ? '❌ Không thể chọn bot làm quan hệ.' : null;
      } catch (_) {
        return '❌ Người này không ở trong server.';
      }
    };
    reply(res, await api.setRelationship(ctx.discordId, body.loai, body.idB, { isValidTarget }));
  },

  'POST /admin/profile/preview': async (req, res, body) => {
    const ctx = await requireGuildMember(res, body);
    if (!ctx) return;
    reply(res, await api.preview(ctx.guild, ctx.member.user, body.kind, body));
  },
};

module.exports = { profileRoutes };
