'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const { Events } = require('discord.js');
const client = require('../client');
const { getSource, hasUrlOrVideo, downloadDiscordVideo, captureFrame, newWorkingDirectory } = require('./media');
const { analyzeVideo } = require('./gemini');

const PREFIX = /^mon!dongtac(?:\s|$)/i;
const PRIVATE_CHANNEL = '1566701909270601758';
let busy = false;

function ownerId() {
  return process.env.MONARIS_VIDEO_OWNER_ID ||
    process.env.ADMIN_USER_ID ||
    process.env.BOT_CREATOR_DISCORD_ID || '';
}

function analysisChannelId() {
  return process.env.MONARIS_VIDEO_CHANNEL_ID || PRIVATE_CHANNEL;
}

function shouldHandle(message) {
  if (!message || message.author?.bot || !ownerId() || message.author?.id !== ownerId()) return false;
  const explicit = PREFIX.test(message.content || '');
  const automatic = message.channelId === analysisChannelId() && Boolean(getSource(message));
  return explicit || automatic;
}

function formatSeconds(total) {
  const value = Math.floor(total);
  return String(Math.floor(value / 60)).padStart(2, '0') + ':' +
    String(value % 60).padStart(2, '0');
}

function formatSegment(segment, index) {
  return [
    '**' + (index + 1) + '. ' + formatSeconds(segment.atSeconds) + '**' +
      (segment.uncertain ? ' (mốc/nhân vật chưa chắc chắn)' : ''),
    '**Động tác nam:** ' + segment.male,
    '**Động tác nữ:** ' + segment.female
  ].join('\n');
}

async function respond(message, text, files = []) {
  const body = text.length > 1850 ? text.slice(0, 1830) + '\n…' : text;
  return message.reply({ content: body, files, allowedMentions: { parse: [], repliedUser: false } });
}

async function handleMessage(message) {
  if (!shouldHandle(message)) return false;
  const source = getSource(message);
  if (!source) {
    await respond(message, 'Bé gửi link YouTube công khai hoặc đính kèm video MP4/MOV/WebM để Monaris đọc động tác nha.');
    return true;
  }
  if (busy) {
    await respond(message, 'Monaris đang phân tích một video khác. Bé gửi lại khi xong nhé.');
    return true;
  }
  busy = true;
  let directory;
  try {
    await message.channel.sendTyping().catch(() => {});
    directory = await newWorkingDirectory();
    const downloaded = source.kind === 'discord'
      ? await downloadDiscordVideo(source, directory)
      : null;

    const result = await analyzeVideo(source, downloaded);
    await respond(message, [
      '🎬 **MONARIS — GHI CHÚ ĐỘNG TÁC NAM / NỮ**',
      result.summary || 'Đã phân tích video.',
      '_Các mốc thời gian và vai diễn là kết quả nhận diện AI; vui lòng đối chiếu video gốc._'
    ].join('\n'));

    for (let i = 0; i < result.segments.length; i++) {
      const segment = result.segments[i];
      const note = formatSegment(segment, i);
      if (!downloaded) {
        await message.channel.send({
          content: note + '\n_Để có ảnh chụp khung hình, bé tải video của mình lên Discord dưới dạng tệp._',
          allowedMentions: { parse: [] }
        });
        continue;
      }
      const framePath = path.join(directory, 'frame-' + i + '.jpg');
      try {
        await captureFrame(downloaded.path, segment.atSeconds, framePath);
        await message.channel.send({
          content: note,
          files: [{ attachment: framePath, name: 'dongtac-' + formatSeconds(segment.atSeconds).replace(':', '-') + '.jpg' }],
          allowedMentions: { parse: [] }
        });
      } catch (frameError) {
        console.warn('[VideoMotion] Cannot capture/send frame:', frameError.message);
        await message.channel.send({
          content: note + '\n_Ảnh minh họa chưa tạo được. Kiểm tra FFmpeg hoặc quyền gửi tệp._',
          allowedMentions: { parse: [] }
        });
      }
    }
  } catch (error) {
    console.error('[VideoMotion]', error.message);
    await respond(message, 'Monaris chưa phân tích được video: ' + String(error.message).slice(0, 350)).catch(() => {});
  } finally {
    if (directory) await fs.rm(directory, { recursive: true, force: true }).catch(() => {});
    busy = false;
  }
  return true;
}

client.on(Events.MessageCreate, (message) => {
  handleMessage(message).catch((error) => console.error('[VideoMotion] Unhandled:', error.message));
});

module.exports = { shouldHandle, formatSeconds, formatSegment, handleMessage };
