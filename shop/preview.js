// ===== shop/preview.js — ảnh xem thử 1 bộ khung (thẻ giả 934×640 thu nhỏ còn 560 rộng, có khung avatar) cho cửa hàng =====
// Vẽ từ chính các phần của bộ khung (không cần dữ liệu thành viên), nhớ kết quả trong RAM. Lỗi -> trả null (cửa hàng vẫn chạy, chỉ không có ảnh).
const sharp = require('sharp');
const { getStyle } = require('../hoso/frame/registry');
const { CUULONG_SOLD_ID } = require('../config/shop');

const W = 934;
const H = 640;
const cache = new Map();

function buildSvg(s) {
  const t = (s.TIERS && s.TIERS[0]) || {};
  let body = `<rect width="${W}" height="${H}" fill="#12131a"/><rect x="22" y="22" width="${W - 44}" height="${H - 44}" rx="10" fill="#1b1d28"/>`;
  body += `<rect x="60" y="110" width="${W - 120}" height="34" rx="8" fill="#ffffff" fill-opacity="0.06"/><rect x="60" y="170" width="${W - 120}" height="150" rx="10" fill="#ffffff" fill-opacity="0.045"/><rect x="60" y="350" width="${(W - 150) / 2}" height="120" rx="10" fill="#ffffff" fill-opacity="0.045"/><rect x="${60 + (W - 150) / 2 + 30}" y="350" width="${(W - 150) / 2}" height="120" rx="10" fill="#ffffff" fill-opacity="0.045"/>`;
  if (s.frameBorder) body += s.frameBorder(t, W, H);
  if (s.accent) body += s.accent(t, W, H);
  if (s.sideUnit) {
    for (let y = 0; y + 100 <= H; y += 100) {
      body += `<g transform="translate(11 ${y})">${s.sideUnit(t, W, H)}</g><g transform="translate(${W - 11} ${y}) scale(-1 1)">${s.sideUnit(t, W, H)}</g>`;
    }
  }
  if (s.crestTop) body += `<g transform="translate(${W / 2} 0) scale(2)">${s.crestTop(t, W, H)}</g>`;
  if (s.decorBottom) body += `<g transform="translate(${W / 2} ${H}) scale(1.5)">${s.decorBottom(t, W, H)}</g>`;
  if (s.avatarFrame) body += `<circle cx="170" cy="245" r="70" fill="#4a4d63"/><g transform="translate(170 245)">${s.avatarFrame(t, 70)}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}</svg>`;
}

// Thẻ giả có đủ lề như thẻ thật (frameMargins theo ctx) để đỉnh/đáy/cạnh bên của Chí Tôn không bị cắt.
function buildAwakeSvg(s, ctx) {
  const t = (s.TIERS && s.TIERS[0]) || {};
  const M = s.frameMargins(ctx);
  const TW = W + M.LEFT_M + M.RIGHT_M;
  const TH = H + M.TOP_M + M.BOT_M;
  const call = (fn, ...a) => { try { return typeof fn === 'function' ? fn(...a, ctx) || '' : ''; } catch (e) { console.error('[shop] preview', e.message); return ''; } };
  let card = `<rect x="22" y="22" width="${W - 44}" height="${H - 44}" rx="10" fill="#1b1d28"/>`;
  card += `<rect x="60" y="110" width="${W - 120}" height="34" rx="8" fill="#ffffff" fill-opacity="0.06"/><rect x="60" y="170" width="${W - 120}" height="150" rx="10" fill="#ffffff" fill-opacity="0.045"/><rect x="60" y="350" width="${(W - 150) / 2}" height="120" rx="10" fill="#ffffff" fill-opacity="0.045"/><rect x="${60 + (W - 150) / 2 + 30}" y="350" width="${(W - 150) / 2}" height="120" rx="10" fill="#ffffff" fill-opacity="0.045"/>`;
  card += call(s.frameBorder, t, W, H);
  card += call(s.accent, t, W, H);
  card += `<circle cx="170" cy="245" r="70" fill="#4a4d63"/><g transform="translate(170 245)">${call(s.avatarFrame, t, 70)}</g>`;
  const unit = call(s.sideUnit, t, W, H);
  let strip = '';
  if (unit) for (let i = 0; i < Math.ceil(H / 100); i++) strip += `<g transform="translate(0 ${i * 100})">${unit}</g>`;
  if (strip && s.sideClip === true) strip = `<clipPath id="hsclip"><rect x="-200" y="0" width="400" height="${H}"/></clipPath><g clip-path="url(#hsclip)">${strip}</g>`;
  const crest = call(s.crestTop, t, W, H);
  const bottom = call(s.decorBottom, t, W, H);
  const cs = M.CREST_SCALE || 2; const bs = M.BOTTOM_SCALE || 1.5;
  let out = `<rect width="${TW}" height="${TH}" fill="#2b2d31"/><g transform="translate(${M.LEFT_M} ${M.TOP_M})"><rect width="${W}" height="${H}" fill="#12131a"/>${card}</g>`;
  if (strip) out += `<g transform="translate(${M.LEFT_M / 2} ${M.TOP_M})">${strip}</g><g transform="translate(${M.LEFT_M + W + M.RIGHT_M / 2} ${M.TOP_M}) scale(-1 1)">${strip}</g>`;
  if (crest) out += `<g transform="translate(${M.LEFT_M + W / 2} ${M.TOP_M + 8 - 36 * cs}) scale(${cs})">${crest}</g>`;
  if (bottom) out += `<g transform="translate(${M.LEFT_M + W / 2} ${M.TOP_M + H + 6}) scale(${bs})">${bottom}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${TW}" height="${TH}" viewBox="0 0 ${TW} ${TH}">${out}</svg>`;
}

// SHOP-3: `ctx` (dragonKit.makeCtx) chỉ có tác dụng với khung có `frameMargins` (Chí Tôn): ảnh hiện đúng số rồng người xem đã thức tỉnh, bóng rồng cho phần chưa có.
// Khung khác bỏ qua ctx → ảnh và khoá nhớ y hệt trước.
async function renderPreview(id, ctx) {
  const s = getStyle(id);
  if (!s) return null;
  const hasMargins = typeof s.frameMargins === 'function';
  const awake = hasMargins && id === CUULONG_SOLD_ID && ctx && Number.isInteger(ctx.mask); // chỉ Chí Tôn đổi theo số rồng
  const withMargins = awake || (hasMargins && id !== CUULONG_SOLD_ID); // 9 bộ rồng bán lẻ: vẽ đủ lề (không ctx) để đầu rồng không bị cắt
  const key = awake ? `${id}|${ctx.mask}` : id;
  if (cache.has(key)) return cache.get(key);
  try {
    const png = withMargins
      ? await sharp(Buffer.from(buildAwakeSvg(s, awake ? ctx : undefined))).resize({ width: 640 }).png({ compressionLevel: 9 }).toBuffer()
      : await sharp(Buffer.from(buildSvg(s))).resize({ width: 560 }).png({ compressionLevel: 9 }).toBuffer();
    if (cache.size >= 600) cache.delete(cache.keys().next().value);
    cache.set(key, png);
    return png;
  } catch (error) {
    console.error(`[shop] Không vẽ được ảnh xem thử ${id}:`, error.message);
    return null;
  }
}

module.exports = { renderPreview };
