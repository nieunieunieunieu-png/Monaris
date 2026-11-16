// Monaris welcome/card.js - card chao mung / tam biet, nen cung dien phao hoa.
// Dat welcome-background.png trong cung thu muc welcome/ voi file nay.
const sharp = require('sharp');
const path = require('path');
const { WELCOME_AVATAR_TIMEOUT_MS } = require('../config');

const W = 1200;
const H = 500;
const BACKGROUND = path.join(__dirname, 'welcome-background.png');
const FONT = "'Noto Sans CJK SC', 'DejaVu Sans', 'Noto Sans', Arial, sans-serif";
const QUIPS = [
  'Giang ho lam neo, chung ta mot nha!',
  'Chuc ban co nhung giay phut vui ve!',
  'Cung nhau chinh phuc moi thu thach!',
];
const FAREWELL_QUIPS = [
  'Giang hồ lắm nẻo, hẹn ngày tái ngộ!',
  'Núi cao sông dài, hẹn gặp lại huynh đệ!',
  'Đường xa gió bụi, bảo trọng nhé!',
  'Hẹn gặp lại vào một ngày không xa!',
];

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  })[c]);
}

function cleanName(name, fallback = 'Huynh đệ mới') {
  const cleaned = String(name ?? '')
    .replace(/[\u{1F000}-\u{1FFFF}\u{FE00}-\u{FE0F}\u{200B}-\u{200F}]/gu, '')
    .replace(/\s+/g, ' ').trim();
  return cleaned || fallback;
}

function clipName(name, maxWeight = 30, fallback = 'Huynh đệ mới') {
  let weight = 0;
  let text = '';
  for (const char of cleanName(name, fallback)) {
    const size = char.codePointAt(0) > 0x2e7f ? 2 : 1;
    if (weight + size > maxWeight) return { text: text.trimEnd() + '…', weight };
    text += char;
    weight += size;
  }
  return { text, weight };
}

async function avatarData(url) {
  if (!url) return null;
  try {
    const timeout = Number(WELCOME_AVATAR_TIMEOUT_MS) || 8000;
    const response = await fetch(url, { signal: AbortSignal.timeout(timeout) });
    if (!response.ok) return null;
    const raw = Buffer.from(await response.arrayBuffer());
    const png = await sharp(raw).resize(220, 220, { fit: 'cover' }).png().toBuffer();
    return 'data:image/png;base64,' + png.toString('base64');
  } catch (err) {
    console.warn('[welcome] Khong tai duoc avatar:', err.message);
    return null;
  }
}

function textFit(text, maxChars, baseSize, minSize) {
  const weight = [...text].reduce((sum, ch) => sum + (ch.codePointAt(0) > 0x2e7f ? 1.7 : 1), 0);
  return Math.max(minSize, Math.min(baseSize, Math.floor(baseSize * maxChars / Math.max(weight, 1))));
}

async function renderWelcomeCard({ displayName, avatarUrl, mode = 'welcome', serverName = 'Monaris', quip } = {}) {
  const farewell = mode === 'farewell';
  const name = clipName(displayName, 32, farewell ? 'Một huynh đệ' : 'Huynh đệ mới').text;
  const guild = clipName(serverName, 40, 'Monaris').text;
  const avatar = await avatarData(avatarUrl);
  const title = farewell ? 'TẠM BIỆT' : 'CHÀO MỪNG';
  const subtitle = farewell ? 'đã rời' : 'đến với';
  const footer = quip || (farewell ? FAREWELL_QUIPS : QUIPS)[Math.floor(Math.random() * (farewell ? FAREWELL_QUIPS : QUIPS).length)];
  const nameSize = textFit(name, 23, 54, 27);
  const guildSize = textFit(guild, 25, 37, 21);

  // Anh nen goc khong bi ve lai. Resize cover, giu phan duoi co cung dien.
  const background = await sharp(BACKGROUND)
    .resize(W, H, { fit: 'cover', position: sharp.strategy.attention })
    .png().toBuffer();

  // Khung chu ben phai, avatar ben trai; giu canh phao hoa va cung dien.
  const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#06162c" stop-opacity=".72"/>
      <stop offset=".52" stop-color="#06162c" stop-opacity=".55"/>
      <stop offset="1" stop-color="#06162c" stop-opacity=".43"/>
    </linearGradient>
    <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#07162e" stop-opacity=".84"/>
      <stop offset="1" stop-color="#152a4b" stop-opacity=".69"/>
    </linearGradient>
    <filter id="shadow"><feGaussianBlur stdDeviation="8"/></filter>
    <clipPath id="avatarClip"><circle cx="205" cy="245" r="96"/></clipPath>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#shade)"/>
  <rect x="350" y="85" width="790" height="330" rx="26" fill="#020a19" opacity=".5" filter="url(#shadow)"/>
  <rect x="350" y="85" width="790" height="330" rx="26" fill="url(#panel)" stroke="#e9ca86" stroke-opacity=".65" stroke-width="2"/>
  <rect x="367" y="102" width="756" height="296" rx="18" fill="none" stroke="#f4dfb4" stroke-opacity=".22"/>
  <circle cx="205" cy="245" r="116" fill="#eecb79" opacity=".24" filter="url(#shadow)"/>
  <circle cx="205" cy="245" r="107" fill="#0a1730" stroke="#ffdc8d" stroke-width="9"/>
  ${avatar ? `<image href="${avatar}" x="109" y="149" width="192" height="192" clip-path="url(#avatarClip)" preserveAspectRatio="xMidYMid slice"/>` : `<circle cx="205" cy="245" r="96" fill="#2b3854"/><text x="205" y="264" text-anchor="middle" fill="#ffe4a6" font-size="68" font-family="${FONT}">✦</text>`}
  <circle cx="205" cy="245" r="96" fill="none" stroke="#fff1bb" stroke-width="3"/>
  <text x="745" y="157" text-anchor="middle" font-family="${FONT}" font-size="26" letter-spacing="6" font-weight="bold" fill="#f4d79b">${title}</text>
  <text x="745" y="235" text-anchor="middle" font-family="${FONT}" font-size="${nameSize}" font-weight="bold" fill="#ffffff">${esc(name)}</text>
  <path d="M545 260 H945" stroke="#e7c77e" stroke-width="2" opacity=".7"/>
  <text x="745" y="302" text-anchor="middle" font-family="${FONT}" font-size="27" fill="#f4e6ce">${subtitle}</text>
  <text x="745" y="357" text-anchor="middle" font-family="${FONT}" font-size="${guildSize}" font-weight="bold" fill="#ffd889">${esc(guild)}</text>
  <rect x="0" y="449" width="1200" height="51" fill="#031022" opacity=".65"/>
  <text x="600" y="483" text-anchor="middle" font-family="${FONT}" font-size="20" fill="#fff0d1">${esc(footer)}</text>
  </svg>`;
  return sharp(background).composite([{ input: Buffer.from(overlay) }]).png({ compressionLevel: 8 }).toBuffer();
}

module.exports = { renderWelcomeCard, clipName, cleanName, FAREWELL_QUIPS };
