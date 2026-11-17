
'use strict';

const {
  OWNER_ID,
  systemPrompt,
  normalizeReply
} = require('./bongPersona');

const { GEMINI_API_KEY } = require('../config');
const { callGeminiWithFallback } = require('./geminiCore');
const { isBotReady } = require('../utils/readyGate');

const {
  addChatHistoryEntry,
  getRecentChatHistoryForChannel
} = require('../googleSheets/chatHistorySheet');

// Kênh trò chuyện riêng của Bông.
const PRIVATE_CHANNEL_ID = '1566701909270601758';

// Giới hạn thận trọng để tiết kiệm Free Tier.
const DAILY_LIMIT = 50;
const COOLDOWN_MS = 12000;
const MAX_INPUT_LENGTH = 1000;

let usedToday = 0;
let currentDay = '';
let lastUsed = 0;
let busy = false;

function vnDay() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

function updateDailyCounter() {
  const today = vnDay();

  if (today !== currentDay) {
    currentDay = today;
    usedToday = 0;
  }
}

function buildHistory(channelId) {
  return getRecentChatHistoryForChannel(
    channelId, 5
  )
    .filter(entry =>
      String(entry.userId) === OWNER_ID
    )
    .map(entry => (
      `Bông: ${String(entry.userMessage || '').slice(0, 450)}\n` +
      `Monaris: ${String(entry.botReply || '').slice(0, 450)}`
    ))
    .join('\n\n');
}

async function handleBongChat(message) {
  if (message.channelId !== PRIVATE_CHANNEL_ID) {
    return false;
  }

  // Để các module lệnh mon! xử lý riêng.
  if (/^\s*mon!/i.test(message.content || '')) {
    return false;
  }

  // Không trả lời người khác trong kênh riêng.
  if (message.author.id !== OWNER_ID) {
    return true;
  }

  if (message.author.bot || message.webhookId) {
    return true;
  }

  const content = String(message.content || '').trim();

  if (!content) return true;

  if (!isBotReady()) return true;

  // Tôn trọng công tắc AI hiện có.
  if (!require('../features').isEnabled('aichat')) {
    return true;
  }

  if (!GEMINI_API_KEY) {
    await message.reply({
      content: 'Monaris chưa có Gemini API key.',
      allowedMentions: { parse: [] }
    });
    return true;
  }

  updateDailyCounter();

  if (busy) return true;

  if (Date.now() - lastUsed < COOLDOWN_MS) {
    return true;
  }

  if (usedToday >= DAILY_LIMIT) {
    await message.reply({
      content:
        'Hôm nay Monaris dùng hết lượt AI ' +
        'được cài đặt rồi chủ nhân ơi. 💙',
      allowedMentions: { parse: [] }
    });
    return true;
  }

  if (content.length > MAX_INPUT_LENGTH) {
    await message.reply({
      content:
        'Tin dài quá rồi Bông ơi, chia thành vài tin ngắn nhé.',
      allowedMentions: { parse: [] }
    });
    return true;
  }

  busy = true;
  lastUsed = Date.now();
  usedToday++;

  try {
    await message.channel.sendTyping()
      .catch(() => {});

    const history = buildHistory(message.channelId);

    const prompt = [
      'Đây là một cuộc trò chuyện tự nhiên với chủ nhân của Monaris.',
      'Hãy tiếp nối ngữ cảnh nếu có.',
      history ? `HỘI THOẠI TRƯỚC:\n${history}` : '',
      `TIN MỚI CỦA BÔNG:\n${content}`,
      'Luôn tự xưng Monaris, gọi chủ bot là chủ nhân hoặc bé. Trả lời ngắn, thân thiện và không bịa dữ kiện.'
    ].filter(Boolean).join('\n\n');

    const result = await callGeminiWithFallback(
      prompt,
      {
        systemInstruction: systemPrompt(OWNER_ID),
        temperature: 0.85
      }
    );

    if (result === '__QUOTA_EXCEEDED__') {
      await message.reply({
        content:
          'Gemini đang hết lượt miễn phí rồi Bông ơi, ' +
          'Monaris sẽ không tự chuyển sang API trả phí.',
        allowedMentions: { parse: [] }
      });
      return true;
    }

    if (!result) {
      throw new Error('Gemini không trả về nội dung');
    }

    const answer = normalizeReply(result, OWNER_ID)
      .slice(0, 1800);

    await message.reply({
      content: answer,
      allowedMentions: {
        parse: [],
        repliedUser: false
      }
    });

    // Dùng đúng bộ nhớ lịch sử hiện có.
    // Không tạo thêm tab hay kho chat thứ hai.
    await addChatHistoryEntry({
      channelId: message.channelId,
      userId: message.author.id,
      userDisplayName: 'Bông',
      userMessage: content,
      botReply: answer
    });

  } catch (error) {
    console.error(
      '[BongChat] Lỗi Gemini:',
      error.message
    );

    await message.reply({
      content:
        'Monaris đang gặp trục trặc kết nối AI một chút rồi Bông ơi.',
      allowedMentions: { parse: [] }
    }).catch(() => {});
  } finally {
    busy = false;
  }

  return true;
}

module.exports = {
  PRIVATE_CHANNEL_ID,
  handleBongChat
};
