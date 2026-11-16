// ===== congDuc/card.js — thẻ ảnh CẢNH GIỚI (PNG, sharp raster hoá SVG, cùng cách với level/card.js, hoso/card.js) =====
// Thẻ RIÊNG cho lệnh /canhgioi (thẻ /hoso không vẽ Cảnh Giới). Viền đơn giản, KHÔNG dùng bộ khung cd_* (bộ khung Công Đức làm riêng sau).
// librsvg không hỗ trợ dominant-baseline/hsl() -> canh chữ bằng y (baseline), màu hex. Lỗi bất kỳ -> ném ra, phía gọi tự quay về embed.
const sharp = require('sharp');
const cfg = require('../config/congDuc');
const { LEVEL_CARD_AVATAR_TIMEOUT_MS } = require('../config');
const core = require('./core');

const FONT = "'Noto Sans CJK SC', 'DejaVu Sans', 'Noto Sans', Arial, sans-serif";
const W = 934;
const H = 315;
const GOLD = '#e6b422';
const GOLD_LIGHT = '#f6d97a';
const BAR_X = 270;
const BAR_W = 614;
const BAR_H = 26;
const BAR_Y = 168;
const NUM = (n) => Number(n || 0).toLocaleString('vi-VN');

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
}

// Cắt tên theo "độ rộng" (chữ Hán/emoji tính 2, Latin tính 1) để không tràn thẻ.
function clipName(name, maxWeight = 24) {
  let w = 0;
  let out = '';
  for (const ch of String(name || '').trim()) {
    const cw = ch.charCodeAt(0) > 0x2e7f ? 2 : 1;
    if (w + cw > maxWeight) return `${out}…`;
    w += cw;
    out += ch;
  }
  return out || 'Thí chủ';
}

async function fetchAvatarDataUri(url) {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(LEVEL_CARD_AVATAR_TIMEOUT_MS) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const png = await sharp(buf).resize(256, 256, { fit: 'cover' }).png().toBuffer();
    return `data:image/png;base64,${png.toString('base64')}`;
  } catch (_) {
    return null; // không có avatar vẫn vẽ thẻ bình thường
  }
}

// Hoa sen mờ làm hình nền: 5 cánh xoay quanh (cx, cy).
function lotus(cx, cy, s, opacity) {
  const petal = (deg) => `<path transform="rotate(${deg} ${cx} ${cy})" d="M${cx} ${cy} C${cx - 0.42 * s} ${cy - 0.35 * s} ${cx - 0.3 * s} ${cy - 0.85 * s} ${cx} ${cy - s} C${cx + 0.3 * s} ${cy - 0.85 * s} ${cx + 0.42 * s} ${cy - 0.35 * s} ${cx} ${cy} Z"/>`;
  return `<g fill="${GOLD}" fill-opacity="${opacity}">${[-72, -36, 0, 36, 72].map(petal).join('')}</g>`;
}

// Thang 10 cảnh giới: chấm đã đạt sáng, cảnh giới hiện tại có vòng.
function realmDots(index, count) {
  const x0 = BAR_X;
  const step = BAR_W / (count - 1);
  let out = `<line x1="${x0}" y1="262" x2="${x0 + BAR_W}" y2="262" stroke="#4a3b22" stroke-width="2"/>`;
  out += `<line x1="${x0}" y1="262" x2="${x0 + step * index}" y2="262" stroke="${GOLD}" stroke-width="2"/>`;
  for (let i = 0; i < count; i += 1) {
    const x = x0 + step * i;
    const reached = i <= index;
    out += `<circle cx="${x}" cy="262" r="${i === index ? 8 : 5}" fill="${reached ? GOLD : '#2a2216'}" stroke="${reached ? GOLD_LIGHT : '#5a4a2c'}" stroke-width="1.5"/>`;
    if (i === index) out += `<circle cx="${x}" cy="262" r="13" fill="none" stroke="${GOLD_LIGHT}" stroke-opacity="0.6" stroke-width="1.5"/>`;
  }
  return out;
}

// total: Tổng Công Đức · streak: chuỗi thắp hương hiện tại · bestStreak · sincerity: Điểm Lòng Thành còn lại
async function renderRealmCard({ displayName, avatarUrl, avatarBuf, total = 0, streak = 0, bestStreak = 0, sincerity = 0, repent = 0, rank = 0, totalMembers = 0 }) {
  const info = core.realmInfo(total);
  const count = cfg.CONG_DUC_REALMS.length;
  const avatar = avatarBuf ? `data:image/png;base64,${avatarBuf.toString('base64')}` : await fetchAvatarDataUri(avatarUrl);
  const name = esc(clipName(displayName));
  const pct = Math.max(0, Math.min(100, info.pct));
  const fillW = Math.round((BAR_W * pct) / 100);
  const nextLine = info.next ? `${pct}% → ${info.next.name} · còn ${NUM(info.toNext)}` : 'Đã viên mãn';
  const rankText = rank > 0 ? `Hạng ${NUM(rank)}${totalMembers > 0 ? `/${NUM(totalMembers)}` : ''}` : 'Chưa có hạng';
  const cx = 135;
  const cy = 157;
  const R = 70;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b1510"/><stop offset="1" stop-color="#2b2013"/></linearGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b8860b"/><stop offset="1" stop-color="${GOLD_LIGHT}"/></linearGradient>
    <clipPath id="av"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath>
  </defs>
  <rect width="${W}" height="${H}" rx="22" fill="url(#bg)"/>
  ${lotus(780, 150, 210, 0.07)}
  ${lotus(135, 157, 150, 0.06)}
  <rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="18" fill="none" stroke="${GOLD}" stroke-opacity="0.85" stroke-width="2"/>
  <rect x="13" y="13" width="${W - 26}" height="${H - 26}" rx="13" fill="none" stroke="${GOLD}" stroke-opacity="0.3" stroke-width="1"/>
  <circle cx="${cx}" cy="${cy}" r="${R + 8}" fill="none" stroke="${GOLD}" stroke-width="3"/>
  <circle cx="${cx}" cy="${cy}" r="${R + 14}" fill="none" stroke="${GOLD}" stroke-opacity="0.35" stroke-width="1.5"/>
  <circle cx="${cx}" cy="${cy}" r="${R}" fill="#0f0b07"/>
  ${avatar ? `<image href="${avatar}" xlink:href="${avatar}" x="${cx - R}" y="${cy - R}" width="${R * 2}" height="${R * 2}" clip-path="url(#av)" preserveAspectRatio="xMidYMid slice"/>` : ''}
  <text x="${BAR_X}" y="58" font-family="${FONT}" font-size="15" font-weight="700" letter-spacing="4" fill="${GOLD}" fill-opacity="0.85">CẢNH GIỚI · CÔNG ĐỨC</text>
  <text x="${BAR_X}" y="112" font-family="${FONT}" font-size="48" font-weight="800" fill="${GOLD_LIGHT}">${esc(info.name)}</text>
  <text x="${BAR_X}" y="142" font-family="${FONT}" font-size="21" fill="#e8dcc0">${name}</text>
  <text x="${W - 50}" y="112" text-anchor="end" font-family="${FONT}" font-size="17" fill="#cdbb8e">${esc(rankText)}</text>
  <rect x="${BAR_X}" y="${BAR_Y}" width="${BAR_W}" height="${BAR_H}" rx="13" fill="#0f0b07" stroke="#5a4a2c" stroke-width="1.5"/>
  ${fillW > 0 ? `<rect x="${BAR_X}" y="${BAR_Y}" width="${Math.max(fillW, 26)}" height="${BAR_H}" rx="13" fill="url(#bar)"/>` : ''}
  <text x="${BAR_X + BAR_W / 2}" y="${BAR_Y + 18}" text-anchor="middle" font-family="${FONT}" font-size="14" font-weight="700" fill="#fff6dc">${esc(nextLine)}</text>
  <text x="${BAR_X}" y="226" font-family="${FONT}" font-size="18" fill="#e8dcc0">Tổng Công Đức <tspan font-weight="800" fill="${GOLD_LIGHT}">${NUM(total)}</tspan></text>
  <text x="${W - 50}" y="226" text-anchor="end" font-family="${FONT}" font-size="18" fill="#e8dcc0">Lòng Thành <tspan font-weight="800" fill="${GOLD_LIGHT}">${NUM(sincerity)}</tspan></text>
  <text x="${BAR_X}" y="248" font-family="${FONT}" font-size="14" fill="#a99a73">Chuỗi thắp hương ${NUM(streak)} ngày · dài nhất ${NUM(bestStreak)}${repent > 0 ? ` · sám hối ${NUM(Math.round(repent))}` : ''}</text>
  ${realmDots(info.index, count)}
  <text x="${BAR_X}" y="292" font-family="${FONT}" font-size="12" fill="#8a7c58">${esc(cfg.CONG_DUC_REALMS[0].name)}</text>
  <text x="${BAR_X + BAR_W}" y="292" text-anchor="end" font-family="${FONT}" font-size="12" fill="#8a7c58">${esc(cfg.CONG_DUC_REALMS[count - 1].name)}</text>
</svg>`;
  return sharp(Buffer.from(svg), { density: 144 }).png().toBuffer();
}

module.exports = { renderRealmCard, clipName };
