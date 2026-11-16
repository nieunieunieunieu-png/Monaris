// ===== hoso/frame/shop_thuymac/crest.js — ĐỈNH THẺ (nâng cấp): Âm Dương bát quái nét cọ + núi mờ sau lưng + vầng cọ + mặt trời đỏ =====
// Hình học: gốc giữa cạnh trên; x ∈ [-76,76], y ∈ [3,36]; Thái Cực tâm (0,17) r14; 8 quẻ x=±(30..66) y 12.8..21.2; núi mờ y 19..36; bệ cọ chạm y=36; hệ thống phóng ×2.
const T = require('./colors').TIERS[0];
const P = 'shop_thuymac-crest-';
function crestTop(_tier, _W, _H) {
  const cx = 0; const cy = 17; const r = 14;
  const defs = `<defs><linearGradient id="${P}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.wash}" stop-opacity="0.6"/><stop offset="1" stop-color="${T.wash}" stop-opacity="0"/></linearGradient></defs>`;
  const hills = `<path d="M-76 36L-64 28L-56 31L-44 22L-34 29L-24 25L-16 36Z" fill="url(#${P}m)"/><path d="M16 36L24 27L34 31L44 21L54 28L62 25L76 36Z" fill="url(#${P}m)"/><path d="M-60 36L-50 31L-40 33L-30 29L-22 36Z" fill="${T.ink}" fill-opacity="0.35"/><path d="M22 36L32 30L42 33L52 30L60 36Z" fill="${T.ink}" fill-opacity="0.35"/>`;
  const ring = `<path d="M-16.5 22A17 17 0 0 1 8 1.8" fill="none" stroke="${T.ink}" stroke-opacity="0.75" stroke-width="1.4" stroke-linecap="round"/><path d="M12 3.6A17 17 0 0 1 17 21" fill="none" stroke="${T.ink}" stroke-opacity="0.45" stroke-width="2" stroke-linecap="round"/><path d="M-13 28A17 17 0 0 0 5 33.6" fill="none" stroke="${T.wash}" stroke-opacity="0.5" stroke-width="1.2" stroke-linecap="round"/>`;
  const disc = `<circle cx="${cx}" cy="${cy}" r="${r + 1.4}" fill="${T.wash}" fill-opacity="0.3"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="${T.light}"/>`;
  const yin = `<path d="M0 ${cy - r}A${r} ${r} 0 0 0 0 ${cy + r}A${r / 2} ${r / 2} 0 0 0 0 ${cy}A${r / 2} ${r / 2} 0 0 1 0 ${cy - r}Z" fill="${T.ink}"/>`;
  const dots = `<circle cx="0" cy="${cy - r / 2}" r="2.2" fill="${T.ink}"/><circle cx="0" cy="${cy + r / 2}" r="2.2" fill="${T.light}"/>`;
  const rim = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${T.ink}" stroke-width="1.5" stroke-opacity="0.92"/><path d="M-12 7A14.4 14.4 0 0 1 4 3.2" fill="none" stroke="${T.light}" stroke-opacity="0.5" stroke-width="0.7" stroke-linecap="round"/>`;
  const bits = ['111', '110', '101', '100', '011', '010', '001', '000'];
  let tri = '';
  bits.forEach((b, k) => {
    const side = k < 4 ? -1 : 1;
    const x = side * (30 + (k % 4) * 12);
    const op = k % 2 ? 0.7 : 0.92;
    let d = '';
    for (let i = 0; i < 3; i++) {
      const y = 12.8 + i * 3.8;
      if (b[i] === '1') d += `M${x - 4.5} ${y}h9v1.8h-9z`;
      else d += `M${x - 4.5} ${y}h3.8v1.8h-3.8zM${x + 0.7} ${y}h3.8v1.8h-3.8z`;
    }
    tri += `<path d="${d}" fill="${T.ink}" fill-opacity="${op}" stroke="${T.light}" stroke-opacity="0.4" stroke-width="0.4"/>`;
  });
  const base = `<path d="M-26 36Q-14 32.4 0 33.2Q14 32.4 26 36Z" fill="${T.ink}" fill-opacity="0.92"/><path d="M-28 36Q-44 34 -66 35.4Q-45 35.9 -28 36ZM28 36Q44 34 66 35.4Q45 35.9 28 36Z" fill="${T.wash}" fill-opacity="0.6"/><path d="M-20 35.2Q0 33.6 20 35.2" fill="none" stroke="${T.light}" stroke-opacity="0.3" stroke-width="0.5"/>`;
  const sun = `<circle cx="-24" cy="31" r="1.7" fill="${T.accent}" fill-opacity="0.9"/>`;
  const drops = `<circle cx="-34" cy="30" r="1.1" fill="${T.ink}" fill-opacity="0.7"/><circle cx="-40" cy="27" r="0.7" fill="${T.ink}" fill-opacity="0.6"/><circle cx="36" cy="31" r="0.9" fill="${T.ink}" fill-opacity="0.7"/><circle cx="70" cy="30" r="0.8" fill="${T.ink}" fill-opacity="0.55"/><circle cx="-71" cy="31" r="0.7" fill="${T.ink}" fill-opacity="0.55"/>`;
  const seal = `<g transform="translate(23 27) rotate(-6)"><rect x="-3.2" y="-3.2" width="6.4" height="6.4" rx="0.8" fill="${T.accent}"/><path d="M-1.5 -1.6H1.5M0 -1.6V1.6M-1.5 1.2H1.5" stroke="${T.light}" stroke-width="0.6" stroke-opacity="0.85" fill="none"/></g>`;
  return `<g id="${P}t">${defs}${hills}${base}${tri}${ring}${disc}${yin}${dots}${rim}${sun}${drops}${seal}</g>`;
}
module.exports = { crestTop };
