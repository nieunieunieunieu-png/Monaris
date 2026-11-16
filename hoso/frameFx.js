// ===== hoso/frameFx.js — hậu kỳ CHỈ trên lớp khung (vân kim loại xước + quầng sáng + vệt sáng), opt-in theo từng phong cách =====
// Phong cách bật bằng cách export `fx` (vd trong colors.js): { grain: 0..1, glow: 0..1, sheen: 0..1, glowSigma?: number }.
// Không có `fx` -> thẻ giữ nguyên. Mọi lỗi -> trả lại PNG gốc (không bao giờ ném lỗi ra ngoài, như compose.js).
// Cách làm: raster riêng lớp khung (nền trong suốt) -> dùng alpha của nó làm mặt nạ nên chữ/ô số liệu không bị đụng tới.
const crypto = require('crypto');
const sharp = require('sharp');
const { getStyle } = require('./frame/registry');

const PARTS = ['border', 'crest', 'side', 'bottom', 'accents', 'colors'];
const clamp01 = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0);

// Cấu hình fx của khung đang chọn (phần nào có `fx` đầu tiên), hoặc null.
function fxConfigFor(choice) {
  const c = choice || {};
  for (const p of PARTS) {
    const s = c[p] && getStyle(c[p]);
    if (s && s.fx && typeof s.fx === 'object') {
      const cfg = { grain: clamp01(s.fx.grain), glow: clamp01(s.fx.glow), sheen: clamp01(s.fx.sheen), glowSigma: Number(s.fx.glowSigma) > 0 ? Number(s.fx.glowSigma) : 12 };
      return cfg.grain || cfg.glow || cfg.sheen ? cfg : null;
    }
  }
  return null;
}

// Tile nhiễu 256×256 dựng 1 lần, seed cố định (cùng khung -> cùng vân, không nhấp nháy giữa các lần vẽ).
let TILE = null;
function grainTile() {
  if (TILE) return TILE;
  let a = 0x9e3779b9;
  const rnd = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const N = 256; const raw = Buffer.alloc(N * N * 3);
  const rowBias = new Float32Array(N).map(() => (rnd() - 0.5) * 36); // vệt xước ngang
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const v = 128 + (rnd() - 0.5) * 70 + rowBias[y]; const i = (y * N + x) * 3; raw[i] = raw[i + 1] = raw[i + 2] = Math.max(0, Math.min(255, v)); }
  TILE = sharp(raw, { raw: { width: N, height: N, channels: 3 } }).blur(0.6).png().toBuffer();
  return TILE;
}

// Cache lớp FX theo (svg khung + cấu hình): cùng khung/bậc/ctx giữa nhiều người dùng chỉ tính 1 lần.
const CACHE = new Map(); const CACHE_MAX = 12;
const keyOf = (svg, cfg, w, h) => crypto.createHash('md5').update(svg).update(JSON.stringify(cfg)).update(`${w}x${h}`).digest('hex');

async function buildLayers(frameSvg, cfg, w, h) {
  const frame = await sharp(Buffer.from(frameSvg), { density: 144 }).resize(w, h, { fit: 'fill' }).ensureAlpha().png().toBuffer();
  const layers = [];
  if (cfg.grain) {
    const noise = await sharp({ create: { width: w, height: h, channels: 3, background: '#808080' } }).composite([{ input: await grainTile(), tile: true }]).png().toBuffer();
    const masked = await sharp(noise).ensureAlpha().composite([{ input: frame, blend: 'dest-in' }]).linear([1, 1, 1, cfg.grain], [0, 0, 0, 0]).png().toBuffer();
    layers.push({ input: masked, blend: 'soft-light' });
  }
  if (cfg.glow) {
    const glow = await sharp(frame).blur(cfg.glowSigma).modulate({ brightness: 1.15, saturation: 1.2 }).linear([1, 1, 1, cfg.glow], [0, 0, 0, 0]).png().toBuffer();
    layers.push({ input: glow, blend: 'screen' });
  }
  if (cfg.sheen) {
    const band = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="s" x1="0" y1="0" x2="1" y2="1"><stop offset="0.38" stop-color="#fff" stop-opacity="0"/><stop offset="0.47" stop-color="#fff5cc" stop-opacity="0.9"/><stop offset="0.5" stop-color="#fff" stop-opacity="1"/><stop offset="0.53" stop-color="#fff5cc" stop-opacity="0.9"/><stop offset="0.62" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#s)"/></svg>`);
    const sheen = await sharp(band).ensureAlpha().composite([{ input: frame, blend: 'dest-in' }]).linear([1, 1, 1, cfg.sheen], [0, 0, 0, 0]).png().toBuffer();
    layers.push({ input: sheen, blend: 'over' });
  }
  return layers;
}

// cardPng: PNG thẻ đã vẽ · frameSvg: SVG chỉ có lớp khung (cùng kích thước thẻ) · cfg: từ fxConfigFor.
async function applyFrameFx(cardPng, frameSvg, cfg) {
  try {
    if (!cfg) return cardPng;
    const { width: w, height: h } = await sharp(cardPng).metadata();
    const key = keyOf(frameSvg, cfg, w, h);
    let layers = CACHE.get(key);
    if (!layers) {
      layers = await buildLayers(frameSvg, cfg, w, h);
      CACHE.set(key, layers);
      if (CACHE.size > CACHE_MAX) CACHE.delete(CACHE.keys().next().value);
    }
    return await sharp(cardPng).composite(layers).png().toBuffer();
  } catch (e) {
    console.error('[hoso/frameFx] lỗi hậu kỳ, dùng thẻ gốc:', e.message);
    return cardPng;
  }
}

module.exports = { fxConfigFor, applyFrameFx };
