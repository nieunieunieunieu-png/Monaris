// ===== hoso/congDucCard.js — thẻ hồ sơ CÔNG ĐỨC cho lệnh /hosocd (PNG, sharp raster hoá SVG) =====
// Dùng bộ khung `cd_lienhoa` (10 bậc). KHÔNG còn Cảnh Giới: bậc khung (Pháp Khung) và bậc viền avatar (Pháp Diện) do người chơi dâng Lòng Thành nâng (congDuc/upgrade.js), truyền vào qua frameTier/avatarTier.
// Nền thẻ: XANH LAM độ đục 85% (docs/KHUNG_CONGDUC_PROMPT.md mục 3.1) -> ảnh PNG có kênh alpha, lộ nền Discord phía sau.
// Chỉ hiện: ảnh đại diện, tiêu đề "HỒ SƠ CÔNG ĐỨC", hàng "Pháp Danh: <tên ingame> · Danh Hiệu: <bậc người chơi đã nâng>", bậc Pháp Khung / Pháp Diện, Tổng Công Đức, Điểm Lòng Thành, Điểm Sám Hối (đỏ + cảnh báo −50% EXP khi > 0), THÔNG TIN THÊM: Giờ Tịnh Tâm (tổng thời gian ngồi voice treo) và Chuỗi Kính Lễ Phật (chuỗi thắp hương). Không hiện tên cảnh giới, không có thanh tiến độ.
// librsvg không hỗ trợ dominant-baseline/hsl() -> canh chữ bằng y (baseline), màu hex. Lỗi bất kỳ -> ném ra, phía gọi tự quay về embed.
const sharp = require('sharp');
const cfg = require('../config/congDuc');
const { LEVEL_CARD_AVATAR_TIMEOUT_MS } = require('../config');
const { composeFrame, composeAvatar } = require('./frame/compose');
const { byRealm } = require('./frame/cd_lienhoa');
const { backdrop } = require('./frame/cd_lienhoa/backdrop');

const FONT = "'Noto Sans CJK SC', 'DejaVu Sans', 'Noto Sans', Arial, sans-serif";
const STYLE = 'cd_lienhoa';
const CHOICE = { colors: STYLE, crest: STYLE, border: STYLE, side: STYLE, bottom: STYLE, accents: STYLE, avatar: STYLE };
const W = 934;
const H = 400;
const AV_R = 70;
const AV_X = 170;
const AV_Y = H / 2;
const TX = 340; // lề trái cột thông tin
const BG_OPACITY = 0.85; // nền xanh lam độ đục 85% (người dùng chỉnh từ 75% -> 85% ngày 2026-10-31, mục 3.1)
const NUM = (n) => Number(n || 0).toLocaleString('vi-VN');
// Giờ Tịnh Tâm: dưới 1 giờ ghi phút; từ 1 giờ ghi giờ, tối đa 1 số lẻ (12,5 giờ · 120 giờ).
function fmtTinhTam(minutes) {
  const m = Math.max(0, Math.floor(Number(minutes) || 0));
  if (m < 60) return `${NUM(m)} phút`;
  return `${(Math.round((m / 60) * 10) / 10).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} giờ`;
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));

// Cắt tên theo "độ rộng" (chữ Hán/emoji tính 2, Latin tính 1) để không tràn thẻ.
function clipName(name, maxWeight = 28) {
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

async function avatarDataUri({ avatarBuf, avatarUrl }) {
  try {
    let buf = avatarBuf || null;
    if (!buf && avatarUrl) {
      const res = await fetch(avatarUrl, { signal: AbortSignal.timeout(LEVEL_CARD_AVATAR_TIMEOUT_MS) });
      if (!res.ok) return null;
      buf = Buffer.from(await res.arrayBuffer());
    }
    if (!buf) return null;
    const png = await sharp(buf).resize(256, 256, { fit: 'cover' }).png().toBuffer();
    return `data:image/png;base64,${png.toString('base64')}`;
  } catch (_) {
    return null; // không có avatar vẫn vẽ thẻ bình thường
  }
}

// Hoa sen mờ làm hoa văn nền: 5 cánh trắng xoay quanh (cx, cy).
function lotusMark(cx, cy, s, opacity) {
  const petal = (deg) => `<path transform="rotate(${deg} ${cx} ${cy})" d="M${cx} ${cy} C${cx - 0.42 * s} ${cy - 0.35 * s} ${cx - 0.3 * s} ${cy - 0.85 * s} ${cx} ${cy - s} C${cx + 0.3 * s} ${cy - 0.85 * s} ${cx + 0.42 * s} ${cy - 0.35 * s} ${cx} ${cy} Z"/>`;
  return `<g fill="#ffffff" fill-opacity="${opacity}">${[-72, -36, 0, 36, 72].map(petal).join('')}</g>`;
}

// ingame: tên ingame -> "Pháp Danh" (rỗng -> dùng displayName) · total: Tổng Công Đức · sincerity: Điểm Lòng Thành còn lại · repent: Điểm Sám Hối · totalMin: tổng PHÚT ngồi voice (-> Giờ Tịnh Tâm) · streak/bestStreak: chuỗi thắp hương hiện tại / dài nhất (-> Chuỗi Kính Lễ Phật) · frameTier/avatarTier/titleTier: bậc 1..10 (mặc định 1) · title: tên Danh Hiệu.
async function renderCongDucCard({ displayName, ingame = '', avatarUrl, avatarBuf, total = 0, sincerity = 0, repent = 0, totalMin = 0, streak = 0, bestStreak = 0, frameTier = 1, avatarTier = 1, titleTier = 1, title = 'Phàm Phu' } = {}) {
  total = Math.max(0, Number(total) || 0);
  repent = Math.max(0, Number(repent) || 0);
  streak = Math.max(0, Math.floor(Number(streak) || 0));
  bestStreak = Math.max(streak, Math.floor(Number(bestStreak) || 0)); // dài nhất không bao giờ nhỏ hơn chuỗi hiện tại
  const clampTier = (t) => Math.max(1, Math.min(10, Math.floor(Number(t)) || 1));
  frameTier = clampTier(frameTier); avatarTier = clampTier(avatarTier); titleTier = clampTier(titleTier);
  const tier = byRealm(frameTier - 1); // khung + hoạ tiết nền theo Pháp Khung
  const avTier = byRealm(avatarTier - 1); // viền avatar theo Pháp Diện
  const avatar = await avatarDataUri({ avatarBuf, avatarUrl });
  const phapDanh = esc(clipName(ingame || displayName, 13)); // Pháp Danh = tên ingame; chưa có thì dùng tên hiển thị

  const frame = composeFrame(CHOICE, tier, W, H); // { border, outer, margins }
  const { TOP_M, BOT_M, LEFT_M, RIGHT_M } = frame.margins;
  const TW = W + LEFT_M + RIGHT_M;
  const TH = H + TOP_M + BOT_M;

  // Điểm Sám Hối: luôn hiện; > 0 thì đổi màu đỏ nhạt + nhắc EXP đang bị giảm.
  const repentNum = Number(repent).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
  const repentLine = repent > 0
    ? `<tspan fill="#cfe6ff">Điểm Sám Hối</tspan><tspan font-weight="800" fill="#ffb4b4" dx="8">${repentNum}</tspan><tspan fill="#ffd0d0" dx="8">· EXP nhận được −${Math.round((1 - cfg.SAM_HOI_EXP_MULT) * 100)}% (ngồi thiền để giảm)</tspan>`
    : `<tspan fill="#cfe6ff">Điểm Sám Hối</tspan><tspan font-weight="800" fill="#ffe9a8" dx="8">0</tspan>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${TW}" height="${TH}" viewBox="0 0 ${TW} ${TH}">
  <defs>
    <linearGradient id="cdc-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2f86e0" stop-opacity="${BG_OPACITY}"/><stop offset="1" stop-color="#1a56a8" stop-opacity="${BG_OPACITY}"/></linearGradient>
      <clipPath id="cdc-av"><circle cx="${AV_X}" cy="${AV_Y}" r="${AV_R}"/></clipPath>
    <clipPath id="cdc-card"><rect width="${W}" height="${H}" rx="22"/></clipPath>
  </defs>
  <g transform="translate(${LEFT_M} ${TOP_M})">
    <rect width="${W}" height="${H}" rx="22" fill="url(#cdc-bg)"/>
    <g clip-path="url(#cdc-card)">${lotusMark(W - 170, H / 2 + 40, 250, 0.07)}${lotusMark(AV_X, AV_Y + 20, 170, 0.05)}${backdrop(tier, W, H)}</g>
    <circle cx="${AV_X}" cy="${AV_Y}" r="${AV_R}" fill="#0a2a5c" fill-opacity="0.6"/>
    ${avatar ? `<image href="${avatar}" xlink:href="${avatar}" x="${AV_X - AV_R}" y="${AV_Y - AV_R}" width="${AV_R * 2}" height="${AV_R * 2}" clip-path="url(#cdc-av)" preserveAspectRatio="xMidYMid slice"/>` : ''}
    <g transform="translate(${AV_X} ${AV_Y})">${composeAvatar(CHOICE, avTier, AV_R)}</g>
    <text x="${TX}" y="100" font-family="${FONT}" font-size="38" font-weight="800" letter-spacing="2" fill="#ffffff">HỒ SƠ CÔNG ĐỨC</text>
    <text x="${TX}" y="148" font-family="${FONT}" font-size="16" fill="#cfe6ff">Pháp Danh:<tspan font-size="22" font-weight="800" fill="#ffffff" dx="8">${phapDanh}</tspan></text>
    <text x="${TX + 320}" y="148" font-family="${FONT}" font-size="16" fill="#cfe6ff">Danh Hiệu:<tspan font-size="22" font-weight="800" fill="#ffe9a8" dx="8">${esc(title)}</tspan></text>
    <text x="${TX}" y="178" font-family="${FONT}" font-size="15" fill="#d8ebff" fill-opacity="0.85">Pháp Khung ${frameTier}/10 · Pháp Diện ${avatarTier}/10</text>
    <text x="${TX}" y="214" font-family="${FONT}" font-size="15" fill="#cfe6ff">Tổng Công Đức</text>
    <text x="${TX}" y="246" font-family="${FONT}" font-size="32" font-weight="800" fill="#ffe9a8">${NUM(total)}</text>
    <text x="${TX + 270}" y="214" font-family="${FONT}" font-size="15" fill="#cfe6ff">Điểm Lòng Thành</text>
    <text x="${TX + 270}" y="246" font-family="${FONT}" font-size="32" font-weight="800" fill="#ffe9a8">${NUM(sincerity)}</text>
    <text x="${TX}" y="292" font-family="${FONT}" font-size="16">${repentLine}</text>
    <text x="${TX}" y="334" font-family="${FONT}" font-size="15" fill="#cfe6ff">Giờ Tịnh Tâm</text>
    <text x="${TX}" y="362" font-family="${FONT}" font-size="24" font-weight="800" fill="#ffe9a8">${fmtTinhTam(totalMin)}</text>
    <text x="${TX + 270}" y="334" font-family="${FONT}" font-size="15" fill="#cfe6ff">Chuỗi Kính Lễ Phật</text>
    <text x="${TX + 270}" y="362" font-family="${FONT}" font-size="24" font-weight="800" fill="#ffe9a8">${NUM(streak)} ngày<tspan font-size="15" font-weight="400" fill="#cfe6ff" dx="8">· dài nhất ${NUM(bestStreak)}</tspan></text>
    ${frame.border}
  </g>
  ${frame.outer}
</svg>`;
  return sharp(Buffer.from(svg), { density: 144 }).png().toBuffer();
}

module.exports = { renderCongDucCard, clipName, fmtTinhTam, W, H };
