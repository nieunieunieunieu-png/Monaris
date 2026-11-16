// ===== congDuc/realm.js — báo lên Cảnh Giới (1 dòng công khai ở CONG_DUC_ANNOUNCE_CHANNEL_ID, im lặng, giữ lại) + role tuỳ chọn =====
// Không phát âm thanh riêng. Trống CONG_DUC_ANNOUNCE_CHANNEL_ID = không báo. Role: CONG_DUC_ROLE_IDS (mặc định TẮT).
const client = require('../client');
const { DISCORD_GUILD_ID } = require('../config');
const cfg = require('../config/congDuc');
const core = require('./core');
const view = require('./view');
const state = require('./state');
const { sendSilent } = require('./send');

async function applyRole(userId, realmName) {
  const map = cfg.CONG_DUC_ROLE_IDS;
  if (!map || !map[realmName]) return; // thiếu ID thì bỏ qua
  const guild = client.guilds.cache.get(DISCORD_GUILD_ID);
  if (!guild) return;
  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member) return;
  await member.roles.add(map[realmName]).catch((e) => console.error('[công đức] Không gắn được role cảnh giới:', e.message));
  for (const [name, id] of Object.entries(map)) if (name !== realmName && member.roles.cache.has(id)) await member.roles.remove(id).catch(() => {});
}

async function announce(rec, up) {
  await applyRole(rec.userId, up.to);
  const channelId = cfg.CONG_DUC_ANNOUNCE_CHANNEL_ID;
  if (!channelId) return;
  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;
  const msg = await sendSilent(channel, view.realmNoticePayload(rec.userId, up));
  await state.addNoticeId(msg.id).catch((e) => console.error('[công đức] Không lưu được id thông báo:', e.message));
  if (cfg.CONG_DUC_NOTICE_TTL_MS > 0) {
    setTimeout(() => {
      msg.delete().catch(() => {});
      state.removeNoticeId(msg.id).catch(() => {});
    }, cfg.CONG_DUC_NOTICE_TTL_MS).unref();
  }
}

let inited = false;
function init() {
  if (inited) return;
  inited = true;
  core.onRealmUp((rec, up) => { announce(rec, up).catch((e) => console.error('[công đức] Lỗi báo lên cảnh giới:', e.message)); });
}
module.exports = { init, announce };
