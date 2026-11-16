// ===== level/classBadge.js — huy hiệu hệ phái dùng chung cho thẻ /level và /hoso (màu theo web + emote hệ phái) =====
// renderClassBadge trả chuỗi SVG ('' nếu chưa có hệ phái). Emote tải từ CDN Discord, resize nhỏ, cache trong RAM;
// tải lỗi thì vẽ huy hiệu không có emote (không làm hỏng thẻ). classEmojiTag trả <:tên:id> cho embed dự phòng.
const sharp = require('sharp');
const { LEVEL_CARD_AVATAR_TIMEOUT_MS, LEVEL_CLASS_EMOJIS } = require('../config');
const { classBadgeColors } = require('./theme');

const OK_MS = 6 * 60 * 60 * 1000;
const FAIL_MS = 5 * 60 * 1000;
const cache = new Map(); // tên hệ phái -> { at, ttl, uri }

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));

function emojiFor(className) {
  const key = String(className || '').trim().normalize('NFC');
  if (!key) return null;
  for (const [name, e] of Object.entries(LEVEL_CLASS_EMOJIS || {})) if (name.normalize('NFC') === key && /^\d{17,20}$/.test(e?.id || '')) return e;
  return null;
}

function classEmojiTag(className) {
  const e = emojiFor(className);
  return e ? `<:${e.name}:${e.id}>` : '';
}

async function classEmojiDataUri(className) {
  const e = emojiFor(className);
  if (!e) return null;
  const hit = cache.get(e.id);
  if (hit && Date.now() - hit.at < hit.ttl) return hit.uri;
  let uri = null;
  try {
    const res = await fetch(`https://cdn.discordapp.com/emojis/${e.id}.png?size=64&quality=lossless`, { signal: AbortSignal.timeout(LEVEL_CARD_AVATAR_TIMEOUT_MS) });
    if (res.ok) {
      const png = await sharp(Buffer.from(await res.arrayBuffer())).resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
      uri = `data:image/png;base64,${png.toString('base64')}`;
    }
  } catch (_) {
    uri = null;
  }
  cache.set(e.id, { at: Date.now(), ttl: uri ? OK_MS : FAIL_MS, uri });
  return uri;
}

function clip(text, maxWeight) {
  let w = 0;
  let out = '';
  for (const ch of String(text || '').trim()) {
    const cw = ch.charCodeAt(0) > 0x2e7f ? 2 : 1;
    if (w + cw > maxWeight) return `${out}…`;
    w += cw;
    out += ch;
  }
  return out;
}

// Trộn 2 màu hex (t = 0 -> a, 1 -> b).
function mixHex(a, b, t) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}

let badgeSeq = 0;

// right: toạ độ x mép phải của huy hiệu; y: mép trên (cao 34).
// dark = true (thẻ /hoso): màu hệ phái chỉ dùng cho VIỀN gradient + ánh sáng nhẹ, nền huy hiệu tối (pha chút màu phái) để emote
// (đã xoá nền) và tên hệ phái nổi bật. dark = false: kiểu cũ (nền = màu hệ phái) — thẻ /level vẫn dùng.
async function renderClassBadge({ className, right, y, font, dark = false }) {
  const cls = String(className || '').trim();
  if (!cls) return '';
  const colors = classBadgeColors(cls);
  const text = clip(cls, 16);
  const emote = await classEmojiDataUri(cls);
  const textW = [...text].reduce((w, ch) => w + (ch.charCodeAt(0) > 0x2e7f ? 24 : 13), 0);
  const w = Math.min(330, 56 + textW + (emote ? 30 : 0));
  const x = right - w;
  const left = emote ? 34 : 0; // vùng dành cho emote bên trái
  const cx = x + left + (w - left) / 2;

  if (!dark) {
    return (
      `<rect x="${x}" y="${y}" width="${w}" height="34" rx="17" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="2"/>` +
      (emote ? `<image xlink:href="${emote}" x="${x + 10}" y="${y + 5}" width="24" height="24"/>` : '') +
      `<text x="${cx}" y="${y + 24}" font-family="${font}" font-size="20" font-weight="bold" fill="${colors.text}" text-anchor="middle">${esc(text)}</text>`
    );
  }

  badgeSeq = (badgeSeq + 1) % 100000;
  const gid = `cbg${badgeSeq}`;
  const c = colors.fill;
  const light = mixHex(c, '#ffffff', 0.6);
  const bgTop = mixHex(c, '#0f0a18', 0.86);
  const bgBot = mixHex(c, '#07050c', 0.93);
  return (
    `<defs>` +
    `<linearGradient id="${gid}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${light}"/><stop offset="0.45" stop-color="${c}"/><stop offset="1" stop-color="${mixHex(c, '#ffffff', 0.35)}"/></linearGradient>` +
    `<linearGradient id="${gid}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bgTop}"/><stop offset="1" stop-color="${bgBot}"/></linearGradient>` +
    `<filter id="${gid}b" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="3.5"/></filter>` +
    `</defs>` +
    `<rect x="${x}" y="${y}" width="${w}" height="34" rx="17" fill="${c}" fill-opacity="0.45" filter="url(#${gid}b)"/>` + // ánh sáng màu phái quanh viền
    `<rect x="${x + 1.5}" y="${y + 1.5}" width="${w - 3}" height="31" rx="15.5" fill="url(#${gid}f)" stroke="url(#${gid}s)" stroke-width="3"/>` +
    (emote
      ? `<circle cx="${x + 22}" cy="${y + 17}" r="13.5" fill="${c}" fill-opacity="0.22"/>` +
        `<image xlink:href="${emote}" x="${x + 10}" y="${y + 5}" width="24" height="24"/>`
      : '') +
    `<text x="${cx}" y="${y + 24}" font-family="${font}" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">${esc(text)}</text>`
  );
}

module.exports = { renderClassBadge, classEmojiTag };
