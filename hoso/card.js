// ===== hoso/card.js — vẽ thẻ "Hồ Sơ Thành Viên" (PNG, sharp raster hoá SVG, cùng cách với level/card.js) =====
// Khung + màu bậc theo cấp (level/theme.js), huy hiệu hệ phái (màu như web + emote, level/classBadge.js), 4 ô: Độ tương tác · Thí Kiếm (khung gradient + hoạ tiết) · Bang Chiến (kỷ lục) · Hoạt động.
// Chỉ số Bang Chiến + EXP + số hoạt động ≥ 10.000 hiện theo vạn (utils/numberFormat.js).
// Mục thiếu dữ liệu hiện "Chưa có dữ liệu" (không làm hỏng thẻ). Lỗi bất kỳ -> ném ra, phía gọi quay về embed.
const sharp = require('sharp');
const { fxConfigFor, applyFrameFx } = require('./frameFx');
const { LEVEL_CARD_AVATAR_TIMEOUT_MS } = require('../config');
const { ACHIEVEMENT_TIERS: TIERS, classBadgeColors } = require('../level/theme'); // TIERS ở đây = 6 màu THÀNH TỰU (tách khỏi 11 bậc khung)
const { classArt, CLASS_ART_W } = require('./classDecor');
const { buildAchievementItems } = require('./achievements');
const { renderClassBadge } = require('../level/classBadge');
const { NUM, fmtVan, formatMinutes } = require('./format');
const { formatKd, formatHd, formatTd } = require('../googleSheets/bcStatKdHd');
const { defaultColors, nameGradientDefs, gradientText } = require('../level/nameStyle');
const { composeFrame, composeAvatar, composePanelFrame, composeNameColors, composePlate, composeHeadTrim, panelPalettes, tierFor, avatarTierFor } = require('./frame/compose');

const FONT = "'Noto Sans CJK SC', 'DejaVu Sans', 'Noto Sans', Arial, sans-serif";
const W = 934;
const PAD = 28;
const GAP = 16;
const COL_W = (W - PAD * 2 - GAP) / 2;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));

// Cắt theo độ rộng (chữ Hán/emoji = 2, Latin = 1).
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

async function avatarDataUri(avatarBuf, avatarUrl) {
  try {
    let buf = avatarBuf;
    if (!buf && avatarUrl) {
      const res = await fetch(avatarUrl, { signal: AbortSignal.timeout(LEVEL_CARD_AVATAR_TIMEOUT_MS) });
      if (!res.ok) return null;
      buf = Buffer.from(await res.arrayBuffer());
    }
    if (!buf) return null;
    const png = await sharp(buf).resize(256, 256, { fit: 'cover' }).png().toBuffer();
    return `data:image/png;base64,${png.toString('base64')}`;
  } catch (_) {
    return null;
  }
}

const empty = (x, y) => `<text x="${x + 18}" y="${y}" font-family="${FONT}" font-size="20" fill="#e2e5f1">Chưa có dữ liệu</text>`;

function kv(x, y, w, k, v, vColor = '#ffffff') {
  return (
    `<text x="${x + 18}" y="${y}" font-family="${FONT}" font-size="20" fill="#ffffff">${esc(k)}</text>` +
    `<text x="${x + w - 18}" y="${y}" font-family="${FONT}" font-size="21" font-weight="bold" fill="${vColor}" text-anchor="end">${esc(v)}</text>`
  );
}

// Khung chung cho MỌI ô (kiểu ô Thí Kiếm): nền + viền gradient, lưới thoi mờ, ngoặc góc + hạt thoi, vòng tròn chìm, đường kẻ dưới tiêu đề.
// pal: { line: [màu...], bg: [3 màu], pat } — mỗi ô 1 bảng màu. Có ảnh nền hồ sơ thì nền ô trong suốt hơn (BG_ALPHA) để ảnh lộ ra.
// Trộn 2 màu #RRGGBB (t = 0 -> a, 1 -> b): dùng để nền ô Tương tác ngả theo màu bậc cấp.
function mix(a, b, t) {
  const ch = (h, i) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  return `#${[0, 1, 2].map((i) => Math.round(ch(a, i) * (1 - t) + ch(b, i) * t).toString(16).padStart(2, '0')).join('')}`;
}

const BG_ALPHA = 0.8;
const PLAIN_ALPHA = 0.94;

function stopsOf(colors, alpha) {
  const last = Math.max(1, colors.length - 1);
  return colors.map((c, i) => `<stop offset="${(i / last).toFixed(3)}" stop-color="${c}"${alpha === undefined ? '' : ` stop-opacity="${alpha}"`}/>`).join('');
}

// <defs> riêng của 1 ô: ${key}Bg (nền), ${key}Line (viền/chữ), ${key}Pat (lưới thoi), ${key}Clip (cắt trang trí theo góc bo).
function frameDefs(key, pal, x, y, w, h, hasBg) {
  const alpha = hasBg ? BG_ALPHA : PLAIN_ALPHA;
  return (
    `<linearGradient id="${key}Bg" x1="0" y1="0" x2="1" y2="1">${stopsOf(pal.bg, alpha)}</linearGradient>` +
    `<linearGradient id="${key}Line" x1="0" y1="0" x2="1" y2="1">${stopsOf(pal.line)}</linearGradient>` +
    `<pattern id="${key}Pat" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M14 2 L26 14 L14 26 L2 14 Z" fill="none" stroke="${pal.pat}" stroke-opacity="0.09" stroke-width="1"/><circle cx="14" cy="14" r="1.6" fill="${pal.pat}" fill-opacity="0.16"/></pattern>` +
    `<clipPath id="${key}Clip"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16"/></clipPath>` +
    (pal.hero
      ? `<linearGradient id="${key}Title" x1="0" y1="0" x2="1" y2="0">${stopsOf(pal.title)}</linearGradient>` +
        `<filter id="${key}Glow" x="-15%" y="-15%" width="130%" height="130%"><feGaussianBlur stdDeviation="6"/></filter>` +
        `<linearGradient id="${key}Shine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.2"/><stop offset="0.4" stop-color="#ffffff" stop-opacity="0.04"/><stop offset="0.7" stop-color="#ffffff" stop-opacity="0"/></linearGradient>`
      : '')
  );
}

function baseFramePanel(key, x, y, w, h, title, body, opts = {}) {
  const hero = Boolean(opts.hero); // ô nổi bật: viền dày + viền trong + quầng sáng + vệt sáng, ngoặc góc lớn
  const line = `url(#${key}Line)`;
  const arm = hero ? 32 : 24;
  const corner = (cx, cy, sx, sy) => {
    return (
      `<path d="M${cx} ${cy + sy * arm} V${cy} H${cx + sx * arm}" fill="none" stroke="${line}" stroke-width="${hero ? 3 : 2}" stroke-linecap="round"/>`
    );
  };
  // ENG-2: khung có panelFrame (opts.deco = chuỗi SVG) -> nền gradient (không viền) + lớp viền riêng của khung; tiêu đề/đường kẻ/số liệu vẽ như cũ phía trên.
  if (typeof opts.deco === 'string' && opts.deco) {
    return (
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="url(#${key}Bg)"/>` +
      opts.deco +
      `<text x="${x + 36}" y="${y + 32}" font-family="${FONT}" font-size="18" font-weight="bold" letter-spacing="1" fill="${hero ? `url(#${key}Title)` : line}">${esc(title)}</text>` +
      `<rect x="${x + 18}" y="${y + 43}" width="${w - 36}" height="1" fill="${line}" fill-opacity="0.55"/>` +
      body
    );
  }
  const s = Math.min(1, h / 200); // ô thấp thì vòng tròn chìm nhỏ lại
  const ccx = x + w - 34;
  const ccy = y + h - 26 * s;
  return (
    (hero ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="none" stroke="${opts.glow}" stroke-width="7" stroke-opacity="0.6" filter="url(#${key}Glow)"/>` : '') +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="url(#${key}Bg)" stroke="${line}" stroke-width="${hero ? 4.5 : 2.5}"/>` +
    (hero ? `<rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h - 12}" rx="11" fill="none" stroke="${line}" stroke-opacity="0.55" stroke-width="1.2"/>` : '') +
    `<g clip-path="url(#${key}Clip)">` +
    (hero ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${key}Shine)"/>` : '') +
    `<circle cx="${ccx}" cy="${ccy}" r="${78 * s}" fill="none" stroke="${line}" stroke-opacity="0.16" stroke-width="2"/>` +
    `<circle cx="${ccx}" cy="${ccy}" r="${54 * s}" fill="none" stroke="${line}" stroke-opacity="0.14" stroke-width="2"/>` +
    `<circle cx="${ccx}" cy="${ccy}" r="${30 * s}" fill="${line}" fill-opacity="0.07"/>` +
    `</g>` +
    corner(x + 9, y + 9, 1, 1) +
    corner(x + w - 9, y + 9, -1, 1) +
    corner(x + 9, y + h - 9, 1, -1) +
    corner(x + w - 9, y + h - 9, -1, -1) +
    `<text x="${x + 36}" y="${y + 32}" font-family="${FONT}" font-size="18" font-weight="bold" letter-spacing="1" fill="${hero ? `url(#${key}Title)` : line}">${esc(title)}</text>` +
    // đường kẻ dưới tiêu đề: dùng rect mỏng (path ngang có bbox cao 0 thì gradient không tô được)
    `<rect x="${x + 18}" y="${y + 43}" width="${w - 36}" height="1" fill="${line}" fill-opacity="0.55"/>` +
    body
  );
}

// d: kết quả collectHoso(); extra: { displayName, avatarUrl, avatarBuf, coverBuf, bgBuf, danhHieu, nameColors, hideInfo }
// Bố cục ảnh: BÌA (coverBuf) chỉ nằm ở đầu thẻ (0..HEAD_H); NỀN (bgBuf) chỉ nằm ở thân thẻ (HEAD_H..H) — 2 lớp không chồng nhau.
// hideInfo = true: không vẽ 5 ô hạng mục (chỉ dùng cho xem thử trên web).
// Đầu thẻ (từ trên xuống): Nickname chữ to · Danh Hiệu (chữ nhỏ, chỉ vẽ khi có) · Ingame (chữ nhỏ, chỉ vẽ khi khác Nickname) · Lv + thanh EXP.
// Cả 3 dòng chữ là gradient ĐẬM theo extra.nameColors (người dùng chọn ở nút 🎨 Màu chữ của /profile); chưa chọn = dải sáng -> chính của bậc cấp.
// Thiếu dòng nào thì đầu thẻ ngắn đi 1 nấc (HEAD_H 230 -> 214 -> 200) để không chừa khoảng trống.
async function renderHosoCard(d, extra) {
  const level = d.level;
  // Khung ghép từng phần theo extra.frame (vd { crest:'tutien', border:'macdinh' }); thiếu/sai -> khung mặc định.
  const frameChoice = extra.frame || {};
  const tier = tierFor(frameChoice, level ? level.level : 0);
  const avatarTier = avatarTierFor(frameChoice, level ? level.level : 0); // bậc khung avatar chọn riêng (không chọn = theo cấp)
  const cls = String(d.className || '').trim();
  const avatar = await avatarDataUri(extra.avatarBuf, extra.avatarUrl);
  const hasBg = Boolean(extra.bgBuf);
  const bgImg = extra.bgBuf ? `data:image/jpeg;base64,${extra.bgBuf.toString('base64')}` : null;
  const cover = extra.coverBuf ? `data:image/jpeg;base64,${extra.coverBuf.toString('base64')}` : null;
  const frameCtx0 = extra.frameCtx ? { ...extra.frameCtx, maxed: Boolean(level && level.maxed) } : undefined; // CLCT-6: cần sớm để khung chọn màu tên mặc định
  const nameColors = Array.isArray(extra.nameColors) && extra.nameColors.length >= 2 ? extra.nameColors : composeNameColors(frameChoice, tier, frameCtx0) || defaultColors(tier);
  const danhHieu = String(extra.danhHieu || '').trim();
  const showIngame = Boolean(d.ingame && d.ingame !== extra.displayName);

  // Thành tựu: "có sẵn" (tự tính mốc, ẩn/hiện theo SHOW_ACHIEVEMENTS) + "đặt tay" (luôn hiện nếu có) gộp chung,
  // 6 mục / hàng; thêm hàng thì ô Thành tựu cao thêm ACH_ROW_H. Panel tự ẩn/hiện theo việc có mục nào không.
  const ACH_COLS = 6;
  const ACH_ROW_H = 78;
  const allAch = buildAchievementItems(level, d.manualAchievements, d.customAchievements) || [];
  // Thành tựu tự chọn (Kinh Hồng Kiếm...) KHÔNG chiếm ô riêng nữa: đưa lên đầu thẻ ở dòng "Ingame - Danh Hiệu".
  const manualTitle = allAch.filter((a) => a.manual).map((a) => a.label).filter(Boolean).join(' · ');
  const headLines = (danhHieu ? 1 : 0) + ((showIngame || manualTitle) ? 1 : 0); // Ingame + Danh Hiệu tự chọn gộp chung 1 dòng
  const achList = allAch.filter((a) => !a.manual);
  const hasAch = Boolean(achList && achList.length);
  const achRows = hasAch ? Math.ceil(achList.length / ACH_COLS) : 1;

  const HEAD_H = [200, 226, 262, 262][headLines]; // đầu thẻ: tên (y104) · Danh Hiệu (y136) · Ingame (y166 / y136 nếu không có Danh Hiệu) · Lv + thanh EXP ở đáy
  const ROW1_Y = HEAD_H + 16;
  const topInfo = extra.topRole && extra.topRole.label ? extra.topRole : null; // đang giữ role Top tuần/tháng -> thêm 1 dòng ở ô Độ tương tác
  const ROW1_H = 230 + (topInfo ? 30 : 0);
  const ROW2_Y = ROW1_Y + ROW1_H + GAP;
  // Ô Bang Chiến: có dữ liệu thì thêm hàng thứ 4 ("Kỷ lục K/D" · "Kỷ lục H/D") -> cao thêm 36 (đúng 1 hàng); không có dữ liệu giữ 168 như cũ.
  const bcHas = Boolean(d.bcstat && (d.bcstat.items.some((i) => i.value !== '' && !Number.isNaN(i.value)) || d.bcstat.kd !== '' || d.bcstat.hd !== '' || d.bcstat.td !== ''));
  const ROW2_H = bcHas ? 168 + 36 : 168;
  const ROW3_Y = ROW2_Y + ROW2_H + GAP;
  const ROW3_H = 140;
  // ô Quan hệ (chỉ khi người đó bật hiện Quan hệ và có ít nhất 1 mối quan hệ): Tri Kỷ · Sư Phụ · Đệ Tử, mỗi mối 1 dòng
  const qh = extra.hideInfo ? null : d.quanHe || null;
  const person = (p) => (p ? `${p.name}${p.className ? `  ·  ${p.className}` : ''}` : '');
  const qhLines = qh
    ? [
        qh.triKy ? { label: 'Tri Kỷ', text: person(qh.triKy), heart: true } : null,
        qh.suPhu ? { label: 'Sư Phụ', text: person(qh.suPhu) } : null,
      ].filter(Boolean)
    : [];
  // Đệ Tử: nhiều người -> tự xuống dòng (mỗi dòng vừa ~46 ký tự), dòng đầu có nhãn, các dòng sau để trống nhãn
  if (qh && qh.deTu && qh.deTu.length) {
    const wlen = (t) => [...t].reduce((n, ch) => n + (ch.charCodeAt(0) > 0x2e7f ? 2 : 1), 0);
    const chunks = [];
    let cur = '';
    qh.deTu.forEach((p, i) => {
      const piece = `${clip(p.name, 18)}${i < qh.deTu.length - 1 ? ',' : ''}`;
      if (cur && wlen(`${cur} ${piece}`) > 46) { chunks.push(cur); cur = piece; } else cur = cur ? `${cur} ${piece}` : piece;
    });
    if (cur) chunks.push(cur);
    chunks.forEach((t, i) => qhLines.push({ label: i === 0 ? `Đệ Tử (${qh.deTu.length})` : '', text: t, noDot: i > 0 }));
  }
  const tkRow = qhLines.length ? qhLines : null;
  const ROWTK_Y = ROW3_Y + ROW3_H + GAP;
  const ROWTK_H = tkRow ? 64 + qhLines.length * 38 : 0;
  const ROW4_Y = tkRow ? ROWTK_Y + ROWTK_H + GAP : ROWTK_Y;
  const ROW4_H = hasAch ? 140 + (achRows - 1) * ACH_ROW_H : 0;
  const H = hasAch ? ROW4_Y + ROW4_H + PAD : (tkRow ? ROWTK_Y + ROWTK_H : ROW3_Y + ROW3_H) + PAD; // không có thành tựu nào -> thẻ ngắn lại
  // ENG-1: trạng thái thức tỉnh khung Cửu Long (extra.frameCtx = hoso/dragonKit.makeCtx) + cờ đã tối đa cấp; không truyền = undefined (khung cũ không đổi)
  const frameCtx = extra.frameCtx ? { ...extra.frameCtx, maxed: Boolean(level && level.maxed) } : undefined;
  const frame = composeFrame(frameChoice, tier, W, H, frameCtx);
  // ENG-2: bọc framePanel để khung có panelFrame vẽ viền riêng cho từng ô (không có -> null -> khung ô cũ).
  const framePanel = (key, x, y, w, h, title, body, opts = {}) => baseFramePanel(key, x, y, w, h, title, body, { ...opts, deco: composePanelFrame(frameChoice, tier, key, x, y, w, h, { ...opts, hasBg }, frameCtx) }); // { border, outer, margins } — hoso/frame/compose.js
  // K-9: lề quanh thẻ đổi theo bậc (marginsFor trong compose.js) để đỉnh/cánh nhô ra nhiều hơn ở bậc cao;
  // bậc ĐỒNG I..BẠCH KIM II (i=0..7) giữ đúng lề cũ 76/34/40/40 nên kích thước ảnh không đổi.
  const { TOP_M, BOT_M, LEFT_M, RIGHT_M } = frame.margins;
  const xL = PAD;
  const xR = PAD + COL_W + GAP;
  const fullW = W - PAD * 2;

  // Bảng màu từng ô (khung chung, khác màu). Ô tương tác theo màu bậc cấp.
  const PAL = {
    tt: {
      line: tier.rainbow ? ['#ff6b6b', '#ffd93d', '#6bffb8', '#6bb8ff', '#d96bff'] : [tier.light, tier.main, tier.dark],
      bg: ['#232846', '#1b1e36', '#262341'],
      pat: tier.main,
    },
    rank: { line: ['#ffe08a', '#ffb347', '#ff7ad9'], bg: ['#3d2c16', '#241f33', '#2e1d36'], pat: '#ffd166' },
    bc: { line: ['#bfeaff', '#57c7ff', '#8a7bff'], bg: ['#14283a', '#18203a', '#1f1f3d'], pat: '#57c7ff' },
    act: { line: ['#c9ffd9', '#6bd68f', '#3fb6a8'], bg: ['#15301f', '#162630', '#1a2a2c'], pat: '#6bd68f' },
    tk: { line: ['#ffc2e6', '#ff7ad9', '#c77dff'], bg: ['#3a1830', '#2a1b38', '#2f1d3a'], pat: '#ff7ad9' },
    ach: { line: ['#ffe1a8', '#ffb347', '#ff8a5c'], bg: ['#3a2615', '#2a2024', '#33201f'], pat: '#ffb347' },
  };
  // Khung có PANEL_TINT (hoso/frame/<phong cách>/colors.js) thì 4 ô Thí Kiếm / Bang Chiến / Hoạt động / Thành tựu đổi sang màu hợp tông khung; không có thì giữ màu cũ ở trên.
  Object.assign(PAL, panelPalettes(frameChoice));

  // --- ô Độ tương tác (cấp)
  let lv = empty(xL, ROW1_Y + 78);
  if (level) {
    lv =
      kv(xL, ROW1_Y + 70, COL_W, 'Độ tương tác', `Lv.${level.level}`, tier.light) +
      kv(xL, ROW1_Y + 100, COL_W, 'Hạng server', `#${NUM(level.rank)} / ${NUM(level.totalMembers)}`) +
      kv(xL, ROW1_Y + 130, COL_W, 'EXP tổng', fmtVan(level.exp)) +
      kv(xL, ROW1_Y + 160, COL_W, 'EXP tuần này kiếm được', `${fmtVan(Math.round(level.weekExp * 10) / 10)} exp`) +
      (topInfo ? kv(xL, ROW1_Y + 220, COL_W, `Role ${topInfo.label}`, topInfo.remain, topInfo.color) : '') +
      kv(xL, ROW1_Y + 190, COL_W, 'Chuỗi ngày', `${NUM(Number(level.streak) || 0)} ngày${Number(level.bestStreak) > 0 ? ` · kỷ lục ${NUM(Number(level.bestStreak))}` : ''}`, Number(level.streak) > 0 ? '#ff9f43' : '#ffffff');
  }

  // --- ô Thí Kiếm: hạng bang a/b, hạng hệ phái x/y
  let tk = empty(xR, ROW1_Y + 78);
  if (d.thiKiem) {
    const t = d.thiKiem;
    const record = t.soTran && t.soTranThang ? `${t.soTranThang}/${t.soTran} thắng` : '';
    tk =
      kv(xR, ROW1_Y + 70, COL_W, 'Điểm rank', `${NUM(t.diem)}`, '#ffd166') +
      kv(xR, ROW1_Y + 100, COL_W, 'Hạng bang', `${t.hang ?? '?'}/${t.hangTotal}`) +
      kv(xR, ROW1_Y + 130, COL_W, 'Hạng hệ phái', `${t.classRank ?? '?'}/${t.classTotal}`) +
      kv(xR, ROW1_Y + 160, COL_W, 'Mùa giải', record || '—') +
      (Number(t.hang) > 0 && Number(t.hangTotal) > 0
        ? kv(xR, ROW1_Y + 190, COL_W, 'Vị trí trong bang', `Top ${Math.max(1, Math.ceil((t.hang / t.hangTotal) * 100))}%`, '#ffd166')
        : '');
  }

  // --- ô Bang Chiến (kỷ lục) 3 cột x 3 hàng, full width
  let bc = empty(xL, ROW2_Y + 96);
  if (bcHas) {
    const cw = (fullW - 36) / 3;
    // 9 hạng mục (Trọng thương = kỷ lục NHỎ NHẤT, còn lại LỚN NHẤT — đã tính sẵn ở bcStatSummary.js) + 3 dòng KD/HD/TD ở hàng thứ 4,
    // cùng font/màu/căn lề với các dòng trên. KD/HD/TD không áp dụng cho class hoặc chưa có dữ liệu -> "—" (luôn hiện đủ 3 dòng).
    const bcRows = [
      ...d.bcstat.items.slice(0, 9).map((it) => ({ label: it.label, val: it.value === '' || Number.isNaN(it.value) ? '—' : fmtVan(it.value) })),
      { label: 'Kỷ lục K/D', val: formatKd(d.bcstat.kd) },
      { label: 'Kỷ lục H/D', val: formatHd(d.bcstat.hd) },
      { label: 'Kỷ lục T/D', val: formatTd(d.bcstat.td) }, // TD = chống chịu / trọng thương (Thiết Y)
    ];
    bc = bcRows
      .map((it, idx) => {
        const cx = xL + 18 + (idx % 3) * cw;
        const cy = ROW2_Y + 70 + Math.floor(idx / 3) * 36;
        return (
          `<text x="${cx}" y="${cy}" font-family="${FONT}" font-size="18" fill="#ffffff">${esc(it.label)}</text>` +
          `<text x="${cx + cw - 18}" y="${cy}" font-family="${FONT}" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="end">${esc(it.val)}</text>`
        );
      })
      .join('');
  }

  // --- ô Hoạt động (full width, 4 cột): tin nhắn · ảnh · bài thảo luận · voice. Số ≥ 10.000 hiện theo vạn.
  let act = empty(xL, ROW3_Y + 84);
  const c = level && level.counts;
  if (c) {
    const msgs = (Number(c.chat) || 0) + (Number(c.chat_thao_luan) || 0);
    const disc = Number(c.chat_thao_luan) || 0;
    const items = [
      { label: 'Tin nhắn', value: fmtVan(msgs), note: disc > 0 ? `trong đó ${fmtVan(disc)} ở thảo luận` : '' },
      { label: 'Ảnh', value: fmtVan(Number(c.anh) || 0), note: '' },
      { label: 'Bài thảo luận', value: fmtVan(Number(c.bai_thao_luan) || 0), note: '' },
      { label: 'Thời gian voice', value: formatMinutes(Number(c.voice) || 0), note: '' },
    ];
    const cw4 = (fullW - 36) / 4;
    act = items
      .map((it, idx) => {
        const cx = xL + 18 + idx * cw4;
        return (
          `<text x="${cx}" y="${ROW3_Y + 70}" font-family="${FONT}" font-size="18" fill="#ffffff">${esc(it.label)}</text>` +
          `<text x="${cx}" y="${ROW3_Y + 97}" font-family="${FONT}" font-size="${it.value.length > 12 ? 20 : 26}" font-weight="bold" fill="#ffffff">${esc(it.value)}</text>` +
          (it.note ? `<text x="${cx}" y="${ROW3_Y + 119}" font-family="${FONT}" font-size="14" fill="#f1f3fb">${esc(it.note)}</text>` : '')
        );
      })
      .join('');
  }

  // --- ô Quan hệ (full width): mỗi mối quan hệ 1 dòng (nhãn hồng bên trái, tên + hệ phái bên phải)
  const heart = (cx, cy, r) => `<path d="M${cx} ${cy + r} C${cx - r * 1.6} ${cy - r * 0.2} ${cx - r * 0.8} ${cy - r * 1.3} ${cx} ${cy - r * 0.35} C${cx + r * 0.8} ${cy - r * 1.3} ${cx + r * 1.6} ${cy - r * 0.2} ${cx} ${cy + r} Z" fill="url(#tkLine)"/>`;
  const tkPanel = tkRow
    ? qhLines
        .map((ln, i) => {
          const y = ROWTK_Y + 78 + i * 38;
          return (
            (ln.noDot ? '' : ln.heart ? heart(xL + 48, y - 8, 9) : `<circle cx="${xL + 48}" cy="${y - 8}" r="5" fill="url(#tkLine)"/>`) +
            `<text x="${xL + 70}" y="${y}" font-family="${FONT}" font-size="18" fill="#ffd6f0">${esc(ln.label)}</text>` +
            `<text x="${xL + 200}" y="${y}" font-family="${FONT}" font-size="24" font-weight="bold" fill="#ffffff">${esc(clip(ln.text, 46))}</text>`
          );
        })
        .join('')
    : '';

  // --- ô Thành tựu (full width): "có sẵn" = bậc cao nhất đã đạt (Đồng -> Kim Cương, màu theo level/theme.js) + mốc kế
  // tiếp (icon viên kim cương); "tự chọn" (a.manual) = icon ngôi sao vàng + TÊN KIẾM HIỆP to + câu đùa/ghi chú thay mốc kế.
  const MANUAL_COLOR = '#ffd166';
  const star = (cx, cy, r, color) => {
    const pts = [];
    for (let i = 0; i < 5; i += 1) {
      const aOuter = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      const aInner = aOuter + Math.PI / 5;
      pts.push(`${cx + r * Math.cos(aOuter)},${cy + r * Math.sin(aOuter)}`);
      pts.push(`${cx + r * 0.42 * Math.cos(aInner)},${cy + r * 0.42 * Math.sin(aInner)}`);
    }
    return `<polygon points="${pts.join(' ')}" fill="${color}"/>`;
  };
  let ach = empty(xL, ROW4_Y + 84);
  if (hasAch) {
    const cwA = (fullW - 36) / Math.min(ACH_COLS, achList.length);
    const small = achList.length > 5; // 6 mục / hàng: ô hẹp nên thu nhỏ chữ để không đè sang mục bên cạnh
    ach = achList
      .map((a, idx) => {
        const cx = xL + 18 + (idx % ACH_COLS) * cwA;
        const by = ROW4_Y + Math.floor(idx / ACH_COLS) * ACH_ROW_H;
        const color = a.manual ? MANUAL_COLOR : a.tier >= 0 ? TIERS[Math.min(a.tier, TIERS.length - 1)].main : '#e2e5f1';
        const icon = a.manual
          ? star(cx + 9, by + 83, 11, color)
          : (() => {
              const dia = `M${cx + 9} ${by + 83} l8 10 l-8 10 l-8 -10 Z`;
              return a.tier >= 0 ? `<path d="${dia}" fill="${color}"/>` : `<path d="${dia}" fill="none" stroke="#4a4e66" stroke-width="2"/>`;
            })();
        // Thành tựu tự chọn: nhãn nhỏ "Đang đeo", tên kiếm hiệp là chữ to màu vàng, câu đùa/ghi chú ở dòng dưới (ô rộng nên cho dài hơn).
        const topText = a.manual ? 'Đang đeo' : a.label;
        const valueText = a.manual ? a.label : a.tier >= 0 ? a.tierName : '—';
        const subText = a.manual ? a.note || '' : a.nextText ? `Mốc kế: ${a.nextText}` : 'Mốc cao nhất';
        const valueClip = a.manual ? (small ? 16 : 40) : 40;
        const subClip = a.manual ? (small ? 18 : 90) : small ? 16 : 20;
        return (
          `<text x="${cx}" y="${by + 70}" font-family="${FONT}" font-size="${small ? 16 : 18}" fill="#ffffff">${esc(clip(topText, small ? 13 : 15))}</text>` +
          icon +
          `<text x="${cx + 26}" y="${by + 100}" font-family="${FONT}" font-size="${small ? (a.manual ? 14 : 17) : 20}" font-weight="bold" fill="${color}">${esc(clip(valueText, valueClip))}</text>` +
          `<text x="${cx}" y="${by + 114}" font-family="${FONT}" font-size="14" fill="#f1f3fb">${esc(clip(subText, subClip))}</text>`
        );
      })
      .join('');
  }

  // --- đầu thẻ
  const nameX = 270;
  const badgeSvg = await renderClassBadge({ className: cls, right: W - PAD, y: 28, font: FONT, dark: true });
  const expBar = { x: nameX + 128, y: HEAD_H - 42, w: W - PAD - nameX - 126, h: 18 }; // viền ngoài thanh EXP (đầu thẻ), để frame/<phong cách>/headTrim.js vẽ hai đầu
  // Tranh hệ phái (hoso/classDecor.js): nét vẽ mờ phía sau huy hiệu + tên, theo đặc điểm từng phái; phái chưa có tranh -> không vẽ gì.
  const artMain = cls ? classBadgeColors(cls).fill : '#ffffff';
  const art = cls ? classArt(cls, { main: artMain, light: mix(artMain, '#ffffff', 0.35) }) : '';
  const artX = W - PAD - CLASS_ART_W + 6;
  // mặt nạ mờ dần về bên trái: phần tranh nằm dưới chữ (Ingame, EXP) gần như tan hết, phần sát huy hiệu giữ rõ
  const classDecor = art
    ? `<defs><linearGradient id="clsFadeG" gradientUnits="userSpaceOnUse" x1="${artX - 20}" y1="0" x2="${artX + CLASS_ART_W}" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.55"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></linearGradient>` +
      `<mask id="clsFade" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${HEAD_H}"><rect x="0" y="0" width="${W}" height="${HEAD_H}" fill="url(#clsFadeG)"/></mask></defs>` +
      `<g clip-path="url(#head)"><g mask="url(#clsFade)" opacity="0.62"><g transform="translate(${artX} ${Math.round((HEAD_H - 160) / 2) + 6})">${art}</g></g></g>`
    : '';
  const pct = level ? Math.max(0, Math.min(100, Math.round(level.progressPercent || 0))) : 0;

  // Ngọc trang trí trên khung: 4 góc (to) + giữa cạnh trên/dưới (nhỏ). Bậc cầu vồng: mỗi ngọc 1 màu.
  const gem = (cx, cy, r, color) =>
    `<path d="M${cx} ${cy - r} L${cx + r} ${cy} L${cx} ${cy + r} L${cx - r} ${cy} Z" fill="${color}" stroke="${tier.dark}" stroke-width="1.6"/>` +
    `<path d="M${cx} ${cy - r * 0.45} L${cx + r * 0.45} ${cy} L${cx} ${cy + r * 0.45} L${cx - r * 0.45} ${cy} Z" fill="#ffffff" fill-opacity="0.75"/>`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W + LEFT_M + RIGHT_M}" height="${H + TOP_M + BOT_M}" viewBox="0 0 ${W + LEFT_M + RIGHT_M} ${H + TOP_M + BOT_M}">` +
    `<g transform="translate(${LEFT_M} ${TOP_M})">` +
    `<defs>` +
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#23263a"/><stop offset="1" stop-color="#15172a"/></linearGradient>` +
    `<linearGradient id="frame" x1="0" y1="0" x2="1" y2="1">` +
    (tier.rainbow
      ? `<stop offset="0" stop-color="#ff6b6b"/><stop offset="0.25" stop-color="#ffd93d"/><stop offset="0.5" stop-color="#6bffb8"/><stop offset="0.75" stop-color="#6bb8ff"/><stop offset="1" stop-color="#d96bff"/>`
      : `<stop offset="0" stop-color="${tier.light}"/><stop offset="0.5" stop-color="${tier.main}"/><stop offset="1" stop-color="${tier.dark}"/>`) +
    `</linearGradient>` +
    nameGradientDefs('nameGrad', nameColors) +
    frameDefs('tt', PAL.tt, xL, ROW1_Y, COL_W, ROW1_H, hasBg) +
    frameDefs('rank', PAL.rank, xR, ROW1_Y, COL_W, ROW1_H, hasBg) +
    frameDefs('bc', PAL.bc, xL, ROW2_Y, fullW, ROW2_H, hasBg) +
    frameDefs('act', PAL.act, xL, ROW3_Y, fullW, ROW3_H, hasBg) +
    (tkRow ? frameDefs('tk', PAL.tk, xL, ROWTK_Y, fullW, ROWTK_H, hasBg) : '') +
    (hasAch ? frameDefs('ach', PAL.ach, xL, ROW4_Y, fullW, ROW4_H, hasBg) : '') +
    `<linearGradient id="outer" x1="0" y1="0" x2="1" y2="1">` +
    (tier.rainbow
      ? `<stop offset="0" stop-color="#ff6b6b"/><stop offset="0.2" stop-color="#ffd93d"/><stop offset="0.4" stop-color="#6bffb8"/><stop offset="0.6" stop-color="#6bb8ff"/><stop offset="0.8" stop-color="#d96bff"/><stop offset="1" stop-color="#ff6b6b"/>`
      : stopsOf([tier.light, tier.main, mix(tier.main, tier.dark, 0.35), tier.main, tier.light, tier.main])) +
    `</linearGradient>` +
    // Đường chia ảnh bìa | nền hồ sơ (divLine) + viền thanh EXP (expLine): gradient NGANG theo màu bậc (bậc cầu vồng: 5 màu).
    `<linearGradient id="divLine" x1="0" y1="0" x2="1" y2="0">` +
    (tier.rainbow ? stopsOf(['#ff6b6b', '#ffd93d', '#6bffb8', '#6bb8ff', '#d96bff']) : stopsOf([tier.dark, tier.main, tier.light, tier.main, tier.dark])) +
    `</linearGradient>` +
    `<linearGradient id="expLine" x1="0" y1="0" x2="1" y2="0">` +
    (tier.rainbow ? stopsOf(['#ff6b6b', '#ffd93d', '#6bffb8', '#6bb8ff', '#d96bff']) : stopsOf([tier.light, tier.main, tier.dark, tier.main, tier.light])) +
    `</linearGradient>` +
    `<linearGradient id="divShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05060d" stop-opacity="0.5"/><stop offset="1" stop-color="#05060d" stop-opacity="0"/></linearGradient>` +
    `<filter id="outerGlow" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="7"/></filter>` +
    `<clipPath id="card"><rect x="0" y="0" width="${W}" height="${H}" rx="26"/></clipPath>` +
    `<clipPath id="head"><rect x="0" y="0" width="${W}" height="${HEAD_H}"/></clipPath>` +
    `<clipPath id="body"><rect x="0" y="${HEAD_H}" width="${W}" height="${H - HEAD_H}"/></clipPath>` +
    `<clipPath id="av"><circle cx="${PAD + 70 + 12}" cy="${HEAD_H / 2}" r="70"/></clipPath>` +
    `</defs>` +
    `<rect x="0" y="0" width="${W}" height="${H}" rx="26" fill="url(#bg)"/>` +
    (bgImg
      ? // Ảnh nền CHỈ phủ phần thân thẻ (dưới ảnh bìa, từ y=HEAD_H xuống đáy): bìa và nền là 2 vùng riêng, bìa không còn đè lên ảnh nền.
        `<g clip-path="url(#card)"><g clip-path="url(#body)"><image xlink:href="${bgImg}" x="0" y="${HEAD_H}" width="${W}" height="${H - HEAD_H}" preserveAspectRatio="xMidYMid slice"/></g>` +
        `<rect x="0" y="${HEAD_H}" width="${W}" height="${H - HEAD_H}" fill="#0b0c18" fill-opacity="0.35"/></g>`
      : '') +
    (cover
      ? `<g clip-path="url(#card)"><g clip-path="url(#head)"><image xlink:href="${cover}" x="0" y="0" width="${W}" height="${HEAD_H}" preserveAspectRatio="xMidYMid slice"/></g></g>` +
        `<rect x="0" y="0" width="${W}" height="${HEAD_H}" fill="#0b0c18" fill-opacity="0.55" clip-path="url(#card)"/>`
      : `<rect x="0" y="0" width="${W}" height="${HEAD_H}" fill="#101226" fill-opacity="0.55" clip-path="url(#card)"/>`) +
    classDecor +
    `<circle cx="${PAD + 82}" cy="${HEAD_H / 2}" r="72" fill="#2b2e45"/>` +
    (avatar ? `<image xlink:href="${avatar}" x="${PAD + 12}" y="${HEAD_H / 2 - 70}" width="140" height="140" clip-path="url(#av)"/>` : '') +
    // khung avatar theo phong cách đã chọn (hoso/frame/<id>/avatar.js), vẽ sau ảnh; gốc ở tâm ảnh, R=70
    `<g transform="translate(${PAD + 82} ${HEAD_H / 2})">${composeAvatar(frameChoice, avatarTier, 70, frameCtx)}</g>` +
    // Bảng tên: dải hoa văn cố định dưới tên (y 120) + biểu tượng nhỏ cạnh dòng tiêu đề (x 252, y 44) — hoso/frame/<phong cách>/plate.js, thiếu thì dùng của khung mặc định.
    composePlate(frameChoice, tier, nameX, 104, W - PAD - nameX, frameCtx) +
    `<text x="${nameX}" y="50" font-family="${FONT}" font-size="18" font-weight="bold" letter-spacing="2" fill="${tier.main}">HỒ SƠ THÀNH VIÊN - BẬC ${tier.label || tier.name}</text>` +
    badgeSvg +
    gradientText({ x: nameX, y: 104, size: 40, gradId: 'nameGrad', text: clip(extra.displayName, 24), weight: 1.2, font: FONT }) +
    (danhHieu ? gradientText({ x: nameX, y: 150, size: 24, gradId: 'nameGrad', text: clip(danhHieu, 30), weight: 0.8, font: FONT }) : '') +
    ((showIngame || manualTitle) ? gradientText({ x: nameX, y: danhHieu ? 188 : 152, size: 27, gradId: 'nameGrad', text: clip([showIngame ? `Ingame: ${d.ingame}` : '', manualTitle].filter(Boolean).join(' - '), 54), weight: 0.7, font: FONT }) : '') +
    `<text x="${nameX}" y="${HEAD_H - 23}" font-family="${FONT}" font-size="26" font-weight="bold" fill="${tier.light}">${esc(level ? `Lv.${level.level}` : 'CHƯA CÓ LV')}</text>` +
    (level
      ? `<text x="${W - PAD}" y="${HEAD_H - 47}" font-family="${FONT}" font-size="18" font-weight="bold" fill="#dcddde" text-anchor="end">${esc(level.maxed ? `${fmtVan(level.exp)} EXP · TỐI ĐA` : `${fmtVan(level.expInto)} / ${fmtVan(level.expNeed)} EXP`)}</text>`
      : '') +
    (level ? `<rect x="${nameX + 128}" y="${HEAD_H - 42}" width="${W - PAD - nameX - 126}" height="18" rx="9" fill="#15172a" fill-opacity="0.8" stroke="url(#expLine)" stroke-width="2.2"/><rect x="${nameX + 130}" y="${HEAD_H - 40}" width="${W - PAD - nameX - 130}" height="14" rx="7" fill="#3a3d55"/><rect x="${nameX + 130}" y="${HEAD_H - 40}" width="${Math.max(14, ((W - PAD - nameX - 130) * pct) / 100)}" height="14" rx="7" fill="${tier.main}"/>` : '') +
    // Đường chia ảnh bìa và nền hồ sơ: bóng đổ nhẹ phía dưới + vạch gradient dày + vạch sáng mảnh + ngọc ở giữa, để ranh giới bìa rõ ràng.
    `<g clip-path="url(#card)">` +
    `<rect x="0" y="${HEAD_H}" width="${W}" height="14" fill="url(#divShade)"/>` +
    `<rect x="0" y="${HEAD_H - 2}" width="${W}" height="4" fill="url(#divLine)"/>` +
    `<rect x="0" y="${HEAD_H - 3}" width="${W}" height="1" fill="#ffffff" fill-opacity="0.35"/>` +
    `</g>` +
    // ornament đường chia + hai đầu thanh EXP theo khung (headTrim); không có/lỗi -> viên ngọc chung như cũ
    (composeHeadTrim(frameChoice, tier, W, HEAD_H, level ? expBar : null, frameCtx) || gem(W / 2, HEAD_H, 7, tier.rainbow ? '#ffd93d' : tier.light)) +
    // extra.hideInfo (web: nút "Ẩn hạng mục"): bỏ các ô thông tin để người chỉnh ảnh nhìn rõ ảnh bìa + ảnh nền. Kích thước thẻ giữ nguyên.
    (extra.hideInfo ? '' :
    framePanel('tt', xL, ROW1_Y, COL_W, ROW1_H, 'TƯƠNG TÁC', lv) +
    framePanel('rank', xR, ROW1_Y, COL_W, ROW1_H, 'THÍ KIẾM THIÊN HẠ', tk) +
    framePanel('bc', xL, ROW2_Y, fullW, ROW2_H, 'BANG CHIẾN · KỶ LỤC CÁ NHÂN', bc) +
    framePanel('act', xL, ROW3_Y, fullW, ROW3_H, 'HOẠT ĐỘNG', act) +
    (tkRow ? framePanel('tk', xL, ROWTK_Y, fullW, ROWTK_H, 'QUAN HỆ', tkPanel) : '') +
    (hasAch ? framePanel('ach', xL, ROW4_Y, fullW, ROW4_H, 'THÀNH TỰU', ach) : '')) +
    // ---- khung bao cả thẻ: viền + ngọc do hoso/frame/<phong cách>/border.js vẽ
    frame.border +
    `</g>` +
    frame.outer + // đỉnh + cạnh dưới + 2 cạnh bên + phụ kiện, vẽ ở lề ngoài khung (hoso/frame/compose.js)
    `</svg>`;

  // FX hậu kỳ chỉ cho khung (opt-in: style export `fx`) — raster riêng lớp khung làm mặt nạ để không đụng chữ/ô số liệu.
  const fxCfg = fxConfigFor(frameChoice);
  // Khung opt-in: raster ở 1.5× rồi thu về đúng kích thước cũ (siêu lấy mẫu) -> viền/nét rồng mịn hơn, kích thước ảnh không đổi.
  const outW = Math.round((W + LEFT_M + RIGHT_M) * 2); const outH = Math.round((H + TOP_M + BOT_M) * 2);
  const cardPng = fxCfg
    ? await sharp(Buffer.from(svg), { density: 216 }).resize(outW, outH, { fit: 'fill', kernel: 'lanczos3' }).png().toBuffer()
    : await sharp(Buffer.from(svg), { density: 144 }).png().toBuffer();
  if (!fxCfg) return cardPng;
  const fxDefs = (svg.match(/<defs>[\s\S]*?<\/defs>/g) || []).join('');
  const frameSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W + LEFT_M + RIGHT_M}" height="${H + TOP_M + BOT_M}" viewBox="0 0 ${W + LEFT_M + RIGHT_M} ${H + TOP_M + BOT_M}">${fxDefs}<g transform="translate(${LEFT_M} ${TOP_M})">${frame.border}</g>${frame.outer}</svg>`;
  return applyFrameFx(cardPng, frameSvg, fxCfg);
}

module.exports = { renderHosoCard };
