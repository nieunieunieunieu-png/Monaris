// ===== features/gate.js — chặn TẬP TRUNG slash command / nút / menu / modal của tính năng đang tắt =====
// Bọc client.emit cho sự kiện interactionCreate: nếu tương tác thuộc 1 tính năng đang TẮT (registry.slash / registry.prefixes)
// thì trả lời riêng tư "đang tắt" và KHÔNG chuyển tương tác cho các listener của tính năng đó nữa.
// Nhờ vậy không phải sửa từng file lệnh. Tin nhắn (mon!…) và sự kiện (voice, member) thì từng tính năng tự gọi isEnabled().
// Require 1 lần ở index.js (sau client), TRƯỚC các module đăng ký listener không bắt buộc nhưng nên để ngay đầu.

const client = require('../client');
const { FEATURES, isEnabled, disabledNotice } = require('./index');

const slashToFeature = new Map();
const prefixToFeature = [];
for (const f of FEATURES) {
  for (const name of f.slash || []) slashToFeature.set(name, f.id);
  for (const prefix of f.prefixes || []) prefixToFeature.push([prefix, f.id]);
}

function featureOfInteraction(interaction) {
  try {
    if (typeof interaction.isChatInputCommand === 'function' && (interaction.isChatInputCommand() || (interaction.isAutocomplete && interaction.isAutocomplete()))) {
      return slashToFeature.get(interaction.commandName) || null;
    }
    const customId = interaction.customId;
    if (typeof customId === 'string') {
      for (const [prefix, id] of prefixToFeature) if (customId.startsWith(prefix)) return id;
    }
  } catch (_) {
    /* tương tác lạ: để các listener xử lý như cũ */
  }
  return null;
}

async function replyDisabled(interaction, featureId) {
  try {
    if (interaction.isAutocomplete && interaction.isAutocomplete()) return void (await interaction.respond([]));
    if (interaction.deferred || interaction.replied) return;
    await interaction.reply({ content: disabledNotice(featureId), ephemeral: true });
  } catch (error) {
    console.error('[features] Không trả lời được tương tác của tính năng đang tắt:', error && error.message ? error.message : error);
  }
}

if (!client.__featureGateInstalled) {
  client.__featureGateInstalled = true;
  const originalEmit = client.emit;
  client.emit = function gatedEmit(event, ...args) {
    if (event === 'interactionCreate' && args[0]) {
      const id = featureOfInteraction(args[0]);
      if (id && !isEnabled(id)) {
        replyDisabled(args[0], id);
        return true;
      }
    }
    return originalEmit.call(this, event, ...args);
  };
}

module.exports = { featureOfInteraction };
