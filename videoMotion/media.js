// Fetch video only from Discord's attachment CDN. Never fetch arbitrary URLs
// from guild messages: the bot may run inside a private office network.
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const run = promisify(execFile);

const MAX_BYTES = 9 * 1024 * 1024; // Gemini inline request stays under 20 MB.
const MIME_TYPES = {
  '.mp4': 'video/mp4',
  '.mov': 'video/mov',
  '.webm': 'video/webm',
  '.mpeg': 'video/mpeg',
  '.mpg': 'video/mpeg'
};

function sanitizeUrl(raw) {
  try {
    const value = String(raw || '').replace(/[)>.,!?]+$/g, '');
    const url = new URL(value);
    return url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

function isYouTube(url) {
  const host = url.hostname.toLowerCase();
  if (host === 'youtu.be') return /^\/[A-Za-z0-9_-]{6,}/.test(url.pathname);
  return ['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host) &&
    ((url.pathname === '/watch' && !!url.searchParams.get('v')) || /^\/shorts\/[A-Za-z0-9_-]+/.test(url.pathname));
}

function isDiscordCdn(url) {
  return ['cdn.discordapp.com', 'media.discordapp.net'].includes(url.hostname.toLowerCase()) &&
    url.pathname.startsWith('/attachments/');
}

function videoMime(url, contentType) {
  const ext = path.extname(url.pathname).toLowerCase();
  const byExt = MIME_TYPES[ext];
  return byExt || (String(contentType || '').startsWith('video/') ? String(contentType).split(';')[0] : null);
}

function getSource(message) {
  for (const attachment of message.attachments?.values() || []) {
    const url = sanitizeUrl(attachment.url);
    if (url && isDiscordCdn(url) && videoMime(url, attachment.contentType)) {
      return { kind: 'discord', url: url.href, mimeType: videoMime(url, attachment.contentType), size: attachment.size };
    }
  }
  const candidates = String(message.content || '').match(/https:\/\/[^\s<>]+/gi) || [];
  for (const text of candidates) {
    const url = sanitizeUrl(text);
    if (!url) continue;
    if (isYouTube(url)) return { kind: 'youtube', url: url.href };
    if (isDiscordCdn(url) && videoMime(url)) {
      return { kind: 'discord', url: url.href, mimeType: videoMime(url) };
    }
  }
  return null;
}

function hasUrlOrVideo(message) {
  return /https:\/\/[^\s<>]+/i.test(String(message.content || '')) ||
    [...(message.attachments?.values() || [])].some((a) => String(a.contentType || '').startsWith('video/'));
}

async function downloadDiscordVideo(source, directory) {
  if (source.kind !== 'discord' || !isDiscordCdn(new URL(source.url))) {
    throw new Error('Chỉ tải trực tiếp video từ Discord CDN.');
  }
  if (source.size && source.size > MAX_BYTES) {
    throw new Error('Video lớn hơn 9 MB. Bé gửi bản video ngắn/nén hơn nhé.');
  }
  const response = await fetch(source.url, { redirect: 'error', signal: AbortSignal.timeout(60000) });
  if (!response.ok || !response.body) throw new Error('Không tải được video Discord (' + response.status + ').');
  const length = Number(response.headers.get('content-length'));
  if (length > MAX_BYTES) throw new Error('Video lớn hơn 9 MB.');
  const chunks = [];
  let bytes = 0;
  for await (const chunk of response.body) {
    bytes += chunk.length;
    if (bytes > MAX_BYTES) {
      await response.body.cancel().catch(() => {});
      throw new Error('Video vượt giới hạn 9 MB.');
    }
    chunks.push(Buffer.from(chunk));
  }
  if (!bytes) throw new Error('Video rỗng.');
  const ext = Object.entries(MIME_TYPES).find(([, mime]) => mime === source.mimeType)?.[0] || '.mp4';
  const target = path.join(directory, 'input' + ext);
  const data = Buffer.concat(chunks);
  await fs.writeFile(target, data);
  return { path: target, base64: data.toString('base64'), mimeType: source.mimeType };
}

async function captureFrame(videoPath, seconds, outputPath) {
  const position = Math.max(0, Math.min(900, Number(seconds) || 0));
  const executable = process.env.MONARIS_FFMPEG_PATH || 'ffmpeg';
  await run(executable, [
    '-hide_banner', '-loglevel', 'error', '-ss', String(position),
    '-i', videoPath, '-frames:v', '1', '-vf', 'scale=960:-2',
    '-q:v', '3', '-y', outputPath
  ], { timeout: 25000, maxBuffer: 1024 * 1024, windowsHide: true });
  const stat = await fs.stat(outputPath);
  if (!stat.size) throw new Error('Ảnh rỗng.');
}

async function newWorkingDirectory() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'monaris-video-'));
}

module.exports = {
  MAX_BYTES, getSource, hasUrlOrVideo, isYouTube, isDiscordCdn, sanitizeUrl,
  downloadDiscordVideo, captureFrame, newWorkingDirectory
};
