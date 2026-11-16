// ===== booster/crest.js — ĐỈNH THẺ: cụm tinh thể boost (1 viên lớn giữa + 2 viên nhỏ mỗi bên) + tia sáng =====
// Hình học: gốc giữa cạnh trên; x ∈ [-72,72], y ∈ [2,36]; chân viên giữa chạm y=36; hệ thống phóng ×2.
const T = require('./colors').TIERS[0];
const P = 'booster-crest-';
function gem(cx, base, hw, h, id) {
  // viên tinh thể 6 mặt: đỉnh nhọn trên, vai, chân nhọn dưới (base = y chân)
  const top = base - h;
  const sh = top + h * 0.34;
  const L = cx - hw;
  const R = cx + hw;
  return (
    `<path d="M${cx} ${top}L${R} ${sh}L${cx} ${base}L${L} ${sh}Z" fill="url(#${P}${id})" stroke="${T.light}" stroke-opacity="0.85" stroke-width="0.9" stroke-linejoin="round"/>` +
    `<path d="M${cx} ${top}L${cx} ${base}M${L} ${sh}L${R} ${sh}" stroke="${T.light}" stroke-opacity="0.5" stroke-width="0.6" fill="none"/>` +
    `<path d="M${cx} ${top}L${R} ${sh}L${cx} ${sh}Z" fill="#FFFFFF" fill-opacity="0.28"/>`
  );
}
function crestTop(_tier, _W, _H) {
  const defs = `<defs><linearGradient id="${P}a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.5" stop-color="${T.main}"/><stop offset="1" stop-color="${T.violet}"/></linearGradient><linearGradient id="${P}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.ice}"/><stop offset="1" stop-color="${T.accent}"/></linearGradient></defs>`;
  const line = `<path d="M-70 35.5H-20M20 35.5H70" stroke="${T.main}" stroke-opacity="0.7" stroke-width="1.2" stroke-linecap="round"/><path d="M-70 33H-46M46 33H70" stroke="${T.ice}" stroke-opacity="0.6" stroke-width="0.8" stroke-linecap="round"/>`;
  const side = [-1, 1].map((s) => gem(s * 30, 33, 7, 20, 'b') + gem(s * 48, 34, 5, 13, 'a') + `<circle cx="${s * 62}" cy="34.5" r="1.4" fill="${T.light}"/>`).join('');
  const main = gem(0, 36, 12, 32, 'a');
  const spark = (x, y, r) => `<path d="M${x} ${y - r}L${x + r * 0.28} ${y - r * 0.28}L${x + r} ${y}L${x + r * 0.28} ${y + r * 0.28}L${x} ${y + r}L${x - r * 0.28} ${y + r * 0.28}L${x - r} ${y}L${x - r * 0.28} ${y - r * 0.28}Z" fill="#FFFFFF" fill-opacity="0.95"/>`;
  return defs + line + side + main + spark(-6, 12, 4) + spark(18, 20, 2.6) + spark(-40, 18, 2.4);
}
module.exports = { crestTop };
