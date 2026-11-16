// ===== level/card.js — vẽ thẻ level bằng ảnh PNG (sharp raster hoá SVG, cùng cách với googleSheets/screenshotSheet.js) =====
// Cùng phong cách thẻ /hoso (hoso/card.js): khung theo bậc, tiêu đề "… · BẬC X", huy hiệu hệ phái (màu web + emote), "Lv.N", EXP hiện theo vạn.
// Font: Noto Sans CJK bundle ở assets/fonts (nạp qua FONTCONFIG_PATH ở index.js) nên tên tiếng Trung không bị ô vuông.
// librsvg KHÔNG hỗ trợ dominant-baseline nên canh chữ bằng y (baseline) tính tay. Lỗi bất kỳ -> ném ra, phía gọi tự quay về embed.
const sharp = require('sharp');
const { LEVEL_CARD_AVATAR_TIMEOUT_MS } = require('../config');
const { tierForLevel } = require('./theme');
const { composeAvatar, avatarTierFor: frameTierFor } = require('../hoso/frame/compose');
const { renderClassBadge } = require('./classBadge');
const { NUM, fmtVan } = require('../utils/numberFormat');
const { defaultColors, nameGradientDefs, gradientText } = require('./nameStyle');

const FONT = "'Noto Sans CJK SC', 'DejaVu Sans', 'Noto Sans', Arial, sans-serif";
const W = 934;
const H = 315;
const BAR_X = 270;
const BAR_W = 614;
const BAR_H = 34;
const BAR_Y = 162;

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
}

// Cắt tên theo "độ rộng" (chữ Hán/emoji tính 2, chữ Latin tính 1) để không tràn thẻ.
function clipName(name, maxWeight = 26) {
  let w = 0;
  let out = '';
  for (const ch of String(name || '').trim()) {
    const cw = ch.charCodeAt(0) > 0x2e7f ? 2 : 1;
    if (w + cw > maxWeight) return `${out}…`;
    w += cw;
    out += ch;
  }
  return out || 'Thành viên';
}

async function fetchAvatarDataUri(url) {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(LEVEL_CARD_AVATAR_TIMEOUT_MS) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    // Chuẩn hoá về PNG vuông 256 (avatar có thể là webp/gif) để librsvg đọc chắc chắn.
    const png = await sharp(buf).resize(256, 256, { fit: 'cover' }).png().toBuffer();
    return `data:image/png;base64,${png.toString('base64')}`;
  } catch (_) {
    return null; // không có avatar vẫn vẽ thẻ bình thường (vòng tròn trống)
  }
}

// info: kết quả progressInfo(exp). rank/totalMembers: hạng tổng (0 = chưa có). weekExp: EXP kiếm được trong tuần này.
// className (tuỳ chọn): hệ phái -> huy hiệu góc phải trên. Khung + màu bậc tự đổi theo cấp (level/theme.js).
// coverBuf / avatarBuf (tuỳ chọn, từ level/profile.js — đã xử lý sẵn đúng cỡ): ảnh bìa nền + avatar riêng. Khung thẻ cố định, chỉ thay 2 nguồn ảnh.
// streak (tuỳ chọn): chuỗi ngày hiện tại; > 0 thì vẽ "Chuỗi N ngày" + ngọn lửa ở góc phải dòng EXP tổng.
// nameColors (tuỳ chọn): gradient người dùng chọn ở /profile (null = theo bậc cấp) cho Nickname / Danh Hiệu / Ingame — cùng kiểu với thẻ /hoso.
// danhHieu, ingame (tuỳ chọn): có thì vẽ 1 dòng chữ nhỏ dưới tên ("Danh Hiệu · Ingame: …", mỗi phần chỉ hiện khi có; Ingame ẩn khi trùng tên). Không có gì -> bố cục cũ.
async function renderLevelCard({ topRole, displayName, avatarUrl, info, rank, totalMembers, exp, weekExp, coverBuf, avatarBuf, className, streak, nameColors, danhHieu, ingame, frame, frameCtx }) {
  const avatar = avatarBuf ? `data:image/png;base64,${avatarBuf.toString('base64')}` : await fetchAvatarDataUri(avatarUrl);
  const cover = coverBuf ? `data:image/jpeg;base64,${coverBuf.toString('base64')}` : null;
  const percent = info.maxed ? 100 : info.percent;
  const tier = tierForLevel(info.level);
  const colors = Array.isArray(nameColors) && nameColors.length >= 2 ? nameColors : defaultColors(tier);
  const shownName = clipName(displayName);
  const dh = String(danhHieu || '').trim();
  const ig = String(ingame || '').trim();
  const subParts = [dh ? clipName(dh, 22) : '', ig && ig !== String(displayName || '').trim() ? `Ingame: ${clipName(ig, 22)}` : ''].filter(Boolean);
  const sub = subParts.join(' · ');
  const nameY = sub ? 94 : 102;
  const lvY = sub ? 154 : 146;
  const badgeSvg = await renderClassBadge({ className, right: BAR_X + BAR_W, y: 26, font: FONT });
  const fillW = percent <= 0 ? 0 : Math.max(BAR_H, Math.round((BAR_W * percent) / 100));
  const rankText = rank ? `HẠNG #${NUM(rank)} / ${NUM(totalMembers)}` : 'CHƯA CÓ HẠNG';
  const progressText = info.maxed ? `${fmtVan(exp)} EXP` : `${fmtVan(info.into)} / ${fmtVan(info.need)} EXP`;
  const weekText = `${fmtVan(Math.round((Number(weekExp) || 0) * 10) / 10)} exp`;
  // Nhãn role Top (tuần/tháng) + hạn còn lại — pill góc phải dưới, chỉ vẽ khi người này đang giữ role.
  let topSvg = '';
  if (topRole && topRole.label) {
    const text = `${topRole.label} · ${topRole.remain}`;
    const tw = [...text].reduce((n, ch) => n + (ch.charCodeAt(0) > 0x2e7f ? 18 : 9.2), 0);
    const pw = Math.round(tw + 46);
    const px = BAR_X + BAR_W - pw;
    const c = topRole.color || '#ffd166';
    topSvg =
      `<rect x="${px}" y="269" width="${pw}" height="28" rx="14" fill="#15172a" fill-opacity="0.85" stroke="${c}" stroke-width="2"/>` +
      `<path d="M${px + 12} 272 L${px + 19} 272 L${px + 22} 280 L${px + 15} 283 Z" fill="${c}" fill-opacity="0.6"/>` +
      `<circle cx="${px + 21}" cy="287" r="7" fill="${c}"/><circle cx="${px + 21}" cy="287" r="3.2" fill="#15172a" fill-opacity="0.55"/>` +
      `<text x="${px + 34}" y="288" font-family="${FONT}" font-size="17" font-weight="bold" fill="${c}">${esc(text)}</text>`;
  }
  const streakDays = Math.max(0, Math.floor(Number(streak) || 0));
  const flameX = BAR_X + BAR_W - 20;
  const streakSvg =
    streakDays > 0
      ? `<path transform="translate(${flameX} 243)" d="M10 0 C10 6 17 8 17 15 C17 20 13 24 10 24 C6 24 3 20 3 15 C3 11 6 9 6 5 C8 7 9 6 10 0 Z" fill="#ff9f43"/>` +
        `<text x="${flameX - 8}" y="261" font-family="${FONT}" font-size="21" text-anchor="end"><tspan fill="#9aa0b8">Chuỗi:</tspan><tspan dx="8" font-weight="bold" fill="#ff9f43">${esc(`${NUM(streakDays)} ngày`)}</tspan></text>`
      : '';

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<defs>` +
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#23263a"/><stop offset="1" stop-color="#15172a"/></linearGradient>` +
    `<linearGradient id="frame" x1="0" y1="0" x2="1" y2="1">` +
    (tier.rainbow
      ? `<stop offset="0" stop-color="#ff6b6b"/><stop offset="0.25" stop-color="#ffd93d"/><stop offset="0.5" stop-color="#6bffb8"/><stop offset="0.75" stop-color="#6bb8ff"/><stop offset="1" stop-color="#d96bff"/>`
      : `<stop offset="0" stop-color="${tier.light}"/><stop offset="0.5" stop-color="${tier.main}"/><stop offset="1" stop-color="${tier.dark}"/>`) +
    `</linearGradient>` +
    `<linearGradient id="bar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${tier.main}"/><stop offset="1" stop-color="${tier.light}"/></linearGradient>` +
    nameGradientDefs('nameGrad', colors) +
    `<clipPath id="card"><rect x="0" y="0" width="${W}" height="${H}" rx="26"/></clipPath>` +
    `<clipPath id="av"><circle cx="141" cy="157" r="88"/></clipPath>` +
    `<clipPath id="barclip"><rect x="${BAR_X}" y="${BAR_Y}" width="${BAR_W}" height="${BAR_H}" rx="${BAR_H / 2}"/></clipPath>` +
    `</defs>` +
    `<rect x="0" y="0" width="${W}" height="${H}" rx="26" fill="url(#bg)"/>` +
    // Ảnh bìa (nếu có) phủ lên nền + lớp tối mờ để chữ luôn đọc được.
    (cover
      ? `<image xlink:href="${cover}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice" clip-path="url(#card)"/>` +
        `<rect x="0" y="0" width="${W}" height="${H}" rx="26" fill="#0b0c18" fill-opacity="0.55"/>`
      : '') +
    `<circle cx="141" cy="157" r="90" fill="#2b2e45"/>` +
    (avatar ? `<image xlink:href="${avatar}" x="53" y="69" width="176" height="176" clip-path="url(#av)"/>` : '') +
    // khung avatar theo lựa chọn ở /profile (cùng hàm với thẻ /hoso, R=88); bảng màu theo màu khung đã chọn, chưa chọn = bảng màu mặc định
    `<g transform="translate(141 157)">${composeAvatar(frame, frameTierFor(frame, info.level), 88, frameCtx)}</g>` +
    `<text x="${BAR_X}" y="52" font-family="${FONT}" font-size="18" font-weight="bold" letter-spacing="2" fill="${tier.main}">ĐỘ TƯƠNG TÁC · BẬC ${tier.label || tier.name}</text>` +
    badgeSvg +
    gradientText({ x: BAR_X, y: nameY, size: sub ? 36 : 38, gradId: 'nameGrad', text: shownName, weight: 1.1, font: FONT }) +
    (sub ? gradientText({ x: BAR_X, y: 120, size: 19, gradId: 'nameGrad', text: sub, weight: 0.6, font: FONT }) : '') +
    `<text x="${BAR_X}" y="${lvY}" font-family="${FONT}"><tspan font-size="22" fill="#9aa0b8">Độ tương tác:</tspan><tspan dx="10" font-size="32" font-weight="bold" fill="${tier.light}">${esc(`Lv.${info.level}${info.maxed ? ' · TỐI ĐA' : ''}`)}</tspan></text>` +
    `<text x="${BAR_X + BAR_W}" y="${lvY}" font-family="${FONT}" font-size="24" fill="#b9bbbe" text-anchor="end">${esc(rankText)}</text>` +
    `<rect x="${BAR_X}" y="${BAR_Y}" width="${BAR_W}" height="${BAR_H}" rx="${BAR_H / 2}" fill="#3a3d55"/>` +
    (fillW > 0 ? `<rect x="${BAR_X}" y="${BAR_Y}" width="${fillW}" height="${BAR_H}" fill="url(#bar)" clip-path="url(#barclip)"/>` : '') +
    `<text x="${BAR_X}" y="228" font-family="${FONT}" font-size="24" fill="#dcddde">${esc(progressText)}</text>` +
    `<text x="${BAR_X + BAR_W}" y="228" font-family="${FONT}" font-size="24" font-weight="bold" fill="#dcddde" text-anchor="end">${info.maxed ? 'MAX' : `${percent}%`}</text>` +
    `<text x="${BAR_X}" y="261" font-family="${FONT}" font-size="21"><tspan fill="#9aa0b8">EXP tổng:</tspan><tspan dx="8" font-weight="bold" fill="#ffffff">${esc(fmtVan(exp))}</tspan></text>` +
    streakSvg +
    topSvg +
    `<text x="${BAR_X}" y="288" font-family="${FONT}" font-size="21"><tspan fill="#9aa0b8">EXP tuần này kiếm được:</tspan><tspan dx="8" font-weight="bold" fill="#ffffff">${esc(weekText)}</tspan></text>` +
    // Khung ngoài theo bậc (vẽ sau cùng để đè lên ảnh bìa).
    `<rect x="3" y="3" width="${W - 6}" height="${H - 6}" rx="24" fill="none" stroke="url(#frame)" stroke-width="6"/>` +
    (tier.double ? `<rect x="12" y="12" width="${W - 24}" height="${H - 24}" rx="17" fill="none" stroke="url(#frame)" stroke-opacity="0.55" stroke-width="2"/>` : '') +
    `</svg>`;

  return sharp(Buffer.from(svg), { density: 144 }).png().toBuffer();
}

module.exports = { renderLevelCard };
