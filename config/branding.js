// Monaris identity and optional community settings.
const BOT_NAME = 'Monaris';
const BOT_PREFIX = 'mon!';
const COMMUNITY_NAME = process.env.COMMUNITY_NAME || 'cộng đồng Discord';
const GAME_NAME = process.env.GAME_NAME || 'Nghịch Thủy Hàn';
const VOICE_GREET_USER_IDS = String(process.env.VOICE_GREET_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
const PVP_REMINDERS_ENABLED = process.env.PVP_REMINDERS_ENABLED === 'true';
const BANG_INTEGRATION_ENABLED = process.env.BANG_INTEGRATION_ENABLED === 'true';
const DIGEST_CHANNEL_ID = process.env.DIGEST_CHANNEL_ID || process.env.IDLE_CHAT_CHANNEL_ID || '';
module.exports = { DIGEST_CHANNEL_ID, BANG_INTEGRATION_ENABLED, BOT_NAME, BOT_PREFIX, COMMUNITY_NAME, GAME_NAME, VOICE_GREET_USER_IDS, PVP_REMINDERS_ENABLED };
