// ===== Admin API routes: hệ thống =====
// Kiểm tra quyền (Discord OAuth2 Monaris Admin), trạng thái/health bot, kênh, emote.

const { ChannelType } = require('discord.js');
const { DISCORD_GUILD_ID, BONG_ROLE_ID, TEAM_VIEWER_ROLE_ID } = require('../../config');
const client = require('../../client');
const { noticeBoardNotices, accessIds } = require('../../state');
const { getGuildEmoteList } = require('../../utils/emoji');
const { getGoogleAuthClient } = require('../../googleSheets/auth');
const { getMemoryStatus } = require('../../monitoring/memoryWatcher');
const { sendJson } = require('../httpUtils');
const { bangFetchJson } = require('../bangProxy');

const systemRoutes = {
  // ---- Kiểm tra quyền cho cổng đăng nhập Discord OAuth2 của Monaris Admin ----
  // Body: { discordId }. LUÔN guild.members.fetch({ force: true }) — KHÔNG
  // dùng cache — để phản ánh đúng role hiện tại (vd vừa bị gỡ role là mất
  // quyền ngay), vì tần suất gọi route này thấp (mỗi lần người dùng mở
  // trang/gọi API trên web, không phải theo mỗi tin nhắn Discord).
  // Trả về 2 quyền riêng biệt:
  //   - isNpc:    có role BONG_ROLE_ID       -> được XEM + THÊM/SỬA/XOÁ (CRUD)
  //   - isViewer: có role TEAM_VIEWER_ROLE_ID -> CHỈ ĐƯỢC XEM, không CRUD
  // Không có role nào trong 2 role trên (dù vẫn isMember) -> không được mở
  // trang Team (server.js/team-12-lock.js tự xử lý phần khoá này).
  //
  // + roles: TOÀN BỘ role ID của member — thêm cho trang "Sự Kiện" (/su-kien)
  // bên web, nơi mỗi sự kiện có thể yêu cầu 1 role tham gia KHÁC NHAU (Bông tự
  // đặt lúc tạo/sửa sự kiện, không cố định như BONG_ROLE_ID/TEAM_VIEWER_ROLE_ID
  // ở trên). Nhờ trả hẳn mảng roles, web (lib/auth.js -> checkRoleAccess) tự so
  // khớp với bất kỳ roleId nào nó cần — Bot không cần biết trước roleId đó là
  // gì, nên sau này web có role mới cũng không phải sửa lại route này.
  'POST /admin/member/check': async (req, res, body) => {
    const discordId = String(body.discordId || '').trim();
    if (!/^\d{15,25}$/.test(discordId)) {
      return sendJson(res, 400, { error: 'discordId không hợp lệ.' });
    }
    try {
      const guild = await client.guilds.fetch(DISCORD_GUILD_ID);
      const member = await guild.members.fetch({ user: discordId, force: true });
      sendJson(res, 200, {
        isMember: true,
        isNpc: member.roles.cache.has(BONG_ROLE_ID),
        isBong: member.roles.cache.has(BONG_ROLE_ID),
        isViewer: member.roles.cache.has(TEAM_VIEWER_ROLE_ID),
        roles: member.roles.cache.map((r) => r.id),
        username: member.user.username,
        displayName: member.displayName,
        avatar: member.user.displayAvatarURL({ size: 64 }),
      });
    } catch (err) {
      // guild.members.fetch ném lỗi (thường "Unknown Member") khi người đó
      // không còn ở trong server — coi như không có quyền, không phải lỗi 500.
      sendJson(res, 200, { isMember: false, isNpc: false, isViewer: false, roles: [] });
    }
  },

  // ---- Dashboard tổng quan: gộp scrim + bc + số liệu Bảng Tin/Auto DM,
  // để trang web hiển thị 1 màn hình duy nhất thay vì chỉ có mỗi scrim. ----
  'GET /admin/status/full': async (req, res) => {
    // scrim/bc/autoDm do bot BANG giữ -> hỏi bot Bang rồi ghép với số liệu Bảng Tin của bot gốc.
    const bang = (await bangFetchJson('GET', '/admin/status/full')) || {};
    sendJson(res, 200, {
      ...bang,
      noticeBoard: { totalNotices: noticeBoardNotices.length },
      accessIdCount: accessIds.size,
      bangBotReachable: Boolean(bang.scrim),
    });
  },

  // ---- Health: RAM hiện tại + trạng thái Discord/Google Sheets — để hiển
  // thị badge "Bot: 🟢 online / RAM xx%" trên trang Quản lý Bot. ----
  'GET /admin/health': async (req, res) => {
    const authClient = await getGoogleAuthClient().catch(() => null);
    sendJson(res, 200, {
      discordReady: Boolean(client.readyAt),
      sheetsAuthOk: Boolean(authClient),
      memory: getMemoryStatus(),
    });
  },

  // ---- Chạy kiểm tra sức khỏe NGAY (giống lệnh /healthcheck): Google Sheet + Cloudinary + Gemini.
  // Trả { sections: [{ name, items: [{ level: '🟢'|'🟡'|'🔴', text }] }], overall, tookMs } — đúng dữ liệu của
  // embed báo cáo hằng ngày, web tự vẽ lại cùng màu. Mất vài giây (Gemini gọi thử từng model). ----
  'POST /admin/health/run': async (req, res) => {
    const { runHealthCheck } = require('../../monitoring/healthCheck');
    const report = await runHealthCheck();
    sendJson(res, 200, report);
  },

  // ---- Danh sách role của server — để web (trang Sự Kiện) cho Bông tìm tên
  // role rồi bấm chọn, thay vì phải gõ tay roleId. Bỏ @everyone; xếp theo vị
  // trí role (cao -> thấp) giống danh sách role trong Discord. ----
  'GET /admin/roles/list': async (req, res) => {
    const guild = await client.guilds.fetch(DISCORD_GUILD_ID);
    const roles = await guild.roles.fetch();
    const result = roles
      .filter((r) => r.id !== guild.id)
      .map((r) => ({ id: r.id, name: r.name, color: r.color, position: r.position, managed: r.managed }))
      .sort((a, b) => b.position - a.position);
    sendJson(res, 200, { roles: result });
  },

  // ---- Danh sách kênh text của server — để web hiển thị dropdown chọn
  // kênh (thay vì phải gõ tay channelId) cho phần Gửi thông báo tuỳ ý. ----
  'GET /admin/channels': async (req, res) => {
    const guild = await client.guilds.fetch(DISCORD_GUILD_ID);
    const channels = await guild.channels.fetch(); // đảm bảo cache đầy đủ, không dùng tạm .cache
    const TEXT_TYPES = [ChannelType.GuildText, ChannelType.GuildAnnouncement];
    const result = channels
      .filter((ch) => ch && TEXT_TYPES.includes(ch.type))
      .map((ch) => ({
        id: ch.id,
        name: ch.name,
        parentName: ch.parent ? ch.parent.name : null,
        position: ch.rawPosition ?? 0,
      }))
      .sort((a, b) => {
        const pa = a.parentName || '';
        const pb = b.parentName || '';
        if (pa !== pb) return pa.localeCompare(pb, 'vi');
        return a.position - b.position;
      });
    sendJson(res, 200, { channels: result });
  },

  // ---- Kho emote tuỳ chỉnh của server — cho picker chèn emote vào ô Bảng
  // Tin trên web (Monaris Admin). guild.emojis.cache do discord.js tự cập nhật
  // real-time qua gateway (thêm/sửa/xoá emote trong server là cache đổi
  // ngay), nên /list đọc thẳng cache, không cần gọi Discord API mỗi lần.
  // /sync ép fetch lại từ Discord REST — dùng khi nghi ngờ cache bị lệch
  // (vd bot vừa mất kết nối gateway 1 lúc) chứ bình thường không cần bấm.
  'GET /admin/emotes/list': async (req, res) => {
    const guild = client.guilds.cache.get(DISCORD_GUILD_ID);
    if (!guild) return sendJson(res, 503, { error: 'Bot chưa sẵn sàng hoặc chưa vào được server (kiểm tra DISCORD_GUILD_ID).' });
    sendJson(res, 200, { emotes: getGuildEmoteList(guild), syncedAt: Date.now() });
  },
  'POST /admin/emotes/sync': async (req, res) => {
    const guild = client.guilds.cache.get(DISCORD_GUILD_ID);
    if (!guild) return sendJson(res, 503, { error: 'Bot chưa sẵn sàng hoặc chưa vào được server (kiểm tra DISCORD_GUILD_ID).' });
    try {
      await guild.emojis.fetch(); // ép tải lại từ Discord REST, tự cập nhật guild.emojis.cache
    } catch (err) {
      return sendJson(res, 502, { error: 'Không tải được emote từ Discord: ' + err.message });
    }
    sendJson(res, 200, { emotes: getGuildEmoteList(guild), syncedAt: Date.now() });
  },
};

module.exports = {
  systemRoutes,
};
