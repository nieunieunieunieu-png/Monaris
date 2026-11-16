// ===== hoso/frame/compose.js — ghép khung từ các thành phần của nhiều phong cách =====
// choice = { colors, crest, border, side, bottom, accents } — id phong cách cho từng phần (vd { crest: 'tutien', border: 'kiemhiep' }).
// Phần thiếu / id sai / hàm ném lỗi -> dùng khung mặc định, không bao giờ ném lỗi ra ngoài.
const { DEFAULT_ID, getStyle, hasPart } = require('./registry');

// Lề quanh thẻ (px) và các hằng số bố cục (khung hiện tại).
// Đây là lề TỐI THIỂU (bậc ĐỒNG I, i=0 trở xuống cấp 35/i=7) — dùng làm giá trị mặc định
// cho nơi không có `tier` (vd avatar) và làm mốc "0" của marginsFor().
const TOP_M = 76;
const BOT_M = 34;
const LEFT_M = 40;
const RIGHT_M = 40;
const CREST_SCALE = 2;
const BOTTOM_SCALE = 1.5;
const SIDE_UNIT = 100;

// K-9: lề đổi theo bậc để đỉnh/cánh nhô ra nhiều hơn ở bậc cao, mà KHÔNG đổi hợp đồng hình học
// của từng phần (crest/border/side/bottom vẫn vẽ y hệt, chỉ có thêm khoảng trống quanh thẻ).
// Giữ NGUYÊN lề cũ (TOP_M/BOT_M/LEFT_M/RIGHT_M ở trên) cho i=0..7 (ĐỒNG I → BẠCH KIM II, cấp 0..35)
// để các thẻ đã có không đổi kích thước. Từ i=8 (KIM CƯƠNG I, cấp 40) trở đi, lề tăng dần tới i=20
// (TỐI THƯỢNG, cấp 100) theo đúng tinh thần mục 5D ("cấp 40/50 nổi bật hơn") + 5C (bậc sao cộng dồn).
function marginsFor(tier) {
  const i = tier && Number.isInteger(tier.i) ? tier.i : 0;
  const extra = Math.max(0, i - 7); // 0 cho tới BẠCH KIM II; 1..13 từ KIM CƯƠNG I tới TỐI THƯỢNG
  return {
    TOP_M: TOP_M + extra * 4,
    BOT_M: BOT_M + extra * 2,
    LEFT_M: LEFT_M + extra * 2,
    RIGHT_M: RIGHT_M + extra * 2,
  };
}

// ENG-2: style có thể export frameMargins(ctx) -> { TOP_M, BOT_M, LEFT_M, RIGHT_M, CREST_SCALE?, BOTTOM_SCALE? } (khung Cửu Long: lề đổi theo số rồng).
// Không có / lỗi / số liệu sai -> marginsFor(tier) như cũ. CREST_SCALE/BOTTOM_SCALE thiếu -> hằng số mặc định.
function resolveMargins(c, tier, ctx) {
  const id = [c.border, c.colors, c.crest].find((i) => getStyle(i) && typeof getStyle(i).frameMargins === 'function');
  if (id) {
    try {
      const m = getStyle(id).frameMargins(ctx);
      const ok = (v, lo, hi) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
      if (m && ok(m.TOP_M, 0, 400) && ok(m.BOT_M, 0, 300) && ok(m.LEFT_M, 0, 300) && ok(m.RIGHT_M, 0, 300)) {
        return {
          TOP_M: m.TOP_M, BOT_M: m.BOT_M, LEFT_M: m.LEFT_M, RIGHT_M: m.RIGHT_M,
          CREST_SCALE: ok(m.CREST_SCALE, 0.5, 3) ? m.CREST_SCALE : CREST_SCALE,
          BOTTOM_SCALE: ok(m.BOTTOM_SCALE, 0.5, 3) ? m.BOTTOM_SCALE : BOTTOM_SCALE,
        };
      }
    } catch (e) {
      console.error('[hoso/frame] frameMargins lỗi:', e.message);
    }
  }
  return { ...marginsFor(tier), CREST_SCALE, BOTTOM_SCALE };
}

const FN = { colors: 'TIERS', crest: 'crestTop', border: 'frameBorder', side: 'sideUnit', bottom: 'decorBottom', accents: 'accent', avatar: 'avatarFrame' };

// Lấy hàm/dữ liệu của 1 thành phần: ưu tiên phong cách được chọn, không có thì mặc định.
function part(choice, name) {
  const id = choice && choice[name];
  return hasPart(id, name) ? getStyle(id)[FN[name]] : getStyle(DEFAULT_ID)[FN[name]];
}

// Chạy 1 thành phần; lỗi -> thử bản mặc định; lỗi nữa -> chuỗi rỗng.
// `ctx` (tuỳ chọn, ENG-1) = trạng thái thức tỉnh của khung Cửu Long; chỉ nối vào CUỐI danh sách đối số khi có, nên bộ khung cũ
// (không khai báo tham số đó) chạy y hệt trước.
function run(choice, name, args, ctx) {
  if (ctx !== undefined) args = [...args, ctx];
  try {
    return part(choice, name)(...args) || '';
  } catch (e) {
    console.error(`[hoso/frame] thành phần "${name}" lỗi:`, e.message);
    try {
      return getStyle(DEFAULT_ID)[FN[name]](...args) || '';
    } catch (_) {
      return '';
    }
  }
}

// Bậc theo cấp, lấy bảng màu của phong cách đã chọn cho colors.
// `key` = 'tier' (khung thẻ) hoặc 'atier' (khung avatar): người dùng đã CHỌN bậc (số 0..5, đã kiểm tra cấp ở choice.resolve) thì dùng bậc đó, không thì theo cấp.
function tierByKey(choice, level, key) {
  const tiers = part(choice, 'colors');
  const picked = choice && choice[key];
  if (Number.isInteger(picked) && picked >= 0) return tiers[Math.min(picked, tiers.length - 1)];
  const lv = Math.max(0, Number(level) || 0);
  let tier = tiers[0];
  for (const t of tiers) if (lv >= t.min) tier = t;
  return tier;
}
const tierFor = (choice, level) => tierByKey(choice, level, 'tier');
const avatarTierFor = (choice, level) => tierByKey(choice, level, 'atier');

// Trả { border, outer, margins }:
//  border  = viền + ngọc, vẽ TRONG nhóm đã translate(margins.LEFT_M, margins.TOP_M) của thẻ (toạ độ 0..W, 0..H);
//  outer   = đỉnh + cạnh dưới + 2 cạnh bên + phụ kiện, vẽ ở toạ độ ảnh tổng (sau khi đóng nhóm thẻ);
//  margins = lề theo bậc (K-9, marginsFor) — bên gọi (hoso/card.js) dùng để tính kích thước ảnh tổng.
function composeFrame(choice, tier, W, H, ctx) {
  const c = choice || {};
  const M = resolveMargins(c, tier, ctx);
  const border = run(c, 'border', [tier, W, H], ctx);

  const crest = run(c, 'crest', [tier, W, H], ctx);
  const ty = M.TOP_M + 8 - 36 * M.CREST_SCALE; // chân đỉnh (y=36) chạm mép trên khung, thân nhô lên
  const top = crest ? `<g transform="translate(${M.LEFT_M + W / 2} ${ty}) scale(${M.CREST_SCALE})">${crest}</g>` : '';

  const bottomSvg = run(c, 'bottom', [tier, W, H], ctx);
  const bottom = bottomSvg ? `<g transform="translate(${M.LEFT_M + W / 2} ${M.TOP_M + H + 6}) scale(${M.BOTTOM_SCALE})">${bottomSvg}</g>` : '';

  // Cạnh bên: lặp đơn vị dọc theo H, mỗi lần đặt 1 chuỗi; id defs trùng lặp trong 1 style là an toàn vì cùng nội dung.
  const unit = run(c, 'side', [tier, W, H], ctx);
  let strip = '';
  if (unit) for (let i = 0; i < Math.max(1, Math.ceil(H / SIDE_UNIT)); i++) strip += `<g transform="translate(0 ${i * SIDE_UNIT})">${unit}</g>`;
  // CLCT-7: style opt-in `sideClip: true` → cắt dải cạnh bên đúng y 0..H (đơn vị cuối không tràn quá đáy thẻ). Style khác không đổi.
  const clipOn = [c.side, c.border, c.colors, c.crest].some((i) => getStyle(i) && getStyle(i).sideClip === true);
  if (strip && clipOn) strip = `<clipPath id="hsclip"><rect x="-200" y="0" width="400" height="${H}"/></clipPath><g clip-path="url(#hsclip)">${strip}</g>`;
  const left = strip ? `<g transform="translate(${M.LEFT_M / 2} ${M.TOP_M})">${strip}</g>` : '';
  const right = strip ? `<g transform="translate(${M.LEFT_M + W + M.RIGHT_M / 2} ${M.TOP_M}) scale(-1 1)">${strip}</g>` : '';

  // Phụ kiện: toạ độ thẻ, dời vào ảnh tổng.
  const acc = run(c, 'accents', [tier, W, H], ctx);
  const accents = acc ? `<g transform="translate(${M.LEFT_M} ${M.TOP_M})">${acc}</g>` : '';

  return { border, outer: `${top}${bottom}${left}${right}${accents}`, margins: M };
}

// Khung quanh ảnh đại diện: SVG gốc ở TÂM ảnh (R = bán kính ảnh: 70 cho /hoso, 88 cho /level). Vẽ SAU ảnh; lỗi/thiếu -> khung avatar mặc định (vòng cũ).
function composeAvatar(choice, tier, R, ctx) {
  return run(choice || {}, 'avatar', [tier, R], ctx);
}

// ---- Màu 4 ô thông tin theo khung: colors.js của phong cách có export PANEL_TINT = { rank, bc, act, ach } (mã #RRGGBB).
// Trả { rank, bc, act, ach } đã dựng thành bảng màu { line:[3], bg:[3], pat } (cùng dạng PAL trong hoso/card.js);
// phong cách không có PANEL_TINT (hoặc mã màu hỏng) -> khoá đó vắng mặt, card.js giữ màu ô cũ.
const HEX = /^#[0-9a-f]{6}$/i;
function mixHex(a, b, t) {
  const ch = (h, i) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  return `#${[0, 1, 2].map((i) => Math.round(ch(a, i) * (1 - t) + ch(b, i) * t).toString(16).padStart(2, '0')).join('')}`;
}
function palFromTint(base) {
  return {
    line: [mixHex(base, '#ffffff', 0.55), base, mixHex(base, '#000000', 0.2)],
    bg: [mixHex('#12141f', base, 0.17), mixHex('#12141f', base, 0.11), mixHex('#12141f', base, 0.14)],
    pat: base,
  };
}
function panelPalettes(choice) {
  try {
    const id = choice && choice.colors;
    const style = getStyle(hasPart(id, 'colors') ? id : DEFAULT_ID);
    const tint = style && style.PANEL_TINT;
    if (!tint) return {};
    const out = {};
    for (const k of ['rank', 'bc', 'act', 'ach']) if (HEX.test(String(tint[k] || ''))) out[k] = palFromTint(tint[k]);
    return out;
  } catch (_) {
    return {};
  }
}

// ---- ENG-2: viền riêng cho 6 ô chỉ số. Style export panelFrame(key, x, y, w, h, opts, ctx) -> chuỗi SVG (lớp viền + nền trang trí;
// tiêu đề/đường kẻ/số liệu vẫn do card.js vẽ TRÊN lớp này). Không style nào có / lỗi / không trả chuỗi -> null (card.js dùng framePanel cũ).
// Không bao giờ ném lỗi, KHÔNG rơi về khung mặc định (khung mặc định không có panelFrame).
function composePanelFrame(choice, tier, key, x, y, w, h, opts, ctx) {
  try {
    const c = choice || {};
    const id = [c.border, c.colors, c.crest].find((i) => getStyle(i) && typeof getStyle(i).panelFrame === 'function');
    if (!id) return null;
    const out = getStyle(id).panelFrame(key, x, y, w, h, opts || {}, ctx);
    return typeof out === 'string' && out ? out : null;
  } catch (e) {
    console.error('[hoso/frame] viền ô lỗi:', e.message);
    return null;
  }
}

// ---- Bảng tên: dải hoa văn cố định dưới tên + biểu tượng nhỏ cạnh dòng "HỒ SƠ THÀNH VIÊN".
// Phong cách có file plate.js (export namePlate(tier, x, y, w)) thì dùng của nó; không có -> dùng của khung mặc định (tô theo màu bậc của khung đang chọn).
// x = lề trái chữ tên, y = baseline dòng tên, w = bề rộng dải. Gốc toạ độ: thẻ (đã translate LEFT_M, TOP_M). Lỗi -> chuỗi rỗng (không làm hỏng thẻ).
function composePlate(choice, tier, x, y, w, ctx) {
  const c = choice || {};
  const id = [c.border, c.colors, c.crest].find((i) => getStyle(i) && getStyle(i).namePlate);
  for (const sid of [id, DEFAULT_ID]) {
    const style = sid && getStyle(sid);
    if (!style || !style.namePlate) continue;
    try {
      return (ctx !== undefined ? style.namePlate(tier, x, y, w, ctx) : style.namePlate(tier, x, y, w)) || '';
    } catch (e) {
      console.error('[hoso/frame] bảng tên lỗi:', e.message);
    }
  }
  return '';
}

// ---- Trang trí đầu thẻ: hai đầu thanh EXP + ornament đường chia bìa | thân thẻ (thay cho viên ngọc chung cũ).
// Phong cách có plate.js/headTrim.js export headTrim(tier, W, headH, bar) (bar = { x, y, w, h } của thanh EXP) thì dùng; không có -> của khung mặc định.
// Gốc toạ độ: thẻ. Lỗi -> chuỗi rỗng (card.js tự vẽ lại viên ngọc cũ).
function composeHeadTrim(choice, tier, W, headH, bar, ctx) {
  const c = choice || {};
  const id = [c.border, c.colors, c.crest].find((i) => getStyle(i) && getStyle(i).headTrim);
  for (const sid of [id, DEFAULT_ID]) {
    const style = sid && getStyle(sid);
    if (!style || !style.headTrim) continue;
    try {
      return (ctx !== undefined ? style.headTrim(tier, W, headH, bar, ctx) : style.headTrim(tier, W, headH, bar)) || '';
    } catch (e) {
      console.error('[hoso/frame] trang trí đầu thẻ lỗi:', e.message);
    }
  }
  return '';
}

// ---- CLCT-6: màu tên mặc định riêng của khung (vd Chí Tôn 9/9 = ánh kim). Style export nameColors(tier, ctx) -> mảng 2..5 màu #RRGGBB;
// không có / lỗi / sai định dạng -> null (card.js dùng màu theo bậc như cũ). Chỉ dùng khi người dùng CHƯA tự chọn màu chữ.
function composeNameColors(choice, tier, ctx) {
  try {
    const c = choice || {};
    const id = [c.border, c.colors, c.crest].find((i) => getStyle(i) && typeof getStyle(i).nameColors === 'function');
    if (!id) return null;
    const out = getStyle(id).nameColors(tier, ctx);
    return Array.isArray(out) && out.length >= 2 && out.length <= 5 && out.every((x) => HEX.test(String(x))) ? out : null;
  } catch (e) {
    console.error('[hoso/frame] màu tên lỗi:', e.message);
    return null;
  }
}

module.exports = { composeNameColors, composePanelFrame, composeFrame, composeAvatar, composePlate, composeHeadTrim, panelPalettes, tierFor, avatarTierFor, marginsFor, TOP_M, BOT_M, LEFT_M, RIGHT_M };
