// ===== hoso/frame/shop_vuongia/crest.js — ĐỈNH THẺ: vương miện 5 chóp khảm kim cương đỏ, đai nhung đỏ + nét cuộn vàng =====
// Hình học: gốc giữa cạnh trên; x ∈ [-68, 68], y ∈ [3, 36]; chân đế chạm y=36; đối xứng quanh x=0.
const T = require('./colors').TIERS[0];
const P = 'shop_vuongia-crest-';
function crestTop(_tier, W, H) {
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.5" stop-color="${T.main}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient><linearGradient id="${P}v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.ruby}"/><stop offset="1" stop-color="${T.rubyDark}"/></linearGradient></defs>`;
  const scroll = `<path d="M-30 31C-36 32 -40 33 -46 28C-52 24 -48 18 -44 20C-41 22 -45 26 -50 24M-46 28C-52 31 -62 32 -68 28" fill="none" stroke="${T.dark}" stroke-width="3" stroke-linecap="round"/><path d="M-30 31C-36 32 -40 33 -46 28C-52 24 -48 18 -44 20C-41 22 -45 26 -50 24M-46 28C-52 31 -62 32 -68 28" fill="none" stroke="${T.main}" stroke-width="1.4" stroke-linecap="round"/><circle cx="-57" cy="29.4" r="1.2" fill="${T.ruby}"/>`;
  const half = `<path d="M0 24L-6 20L-14 8L-24 22L-36 14L-32 30H0Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="1" stroke-linejoin="round"/><path d="M-6 20L-8 28M-14 8L-16 28M-24 22L-26 28" stroke="${T.dark}" stroke-opacity="0.4" stroke-width="0.7"/><circle cx="-14" cy="7" r="2.4" fill="${T.light}" stroke="${T.dark}" stroke-width="0.7"/><circle cx="-36" cy="13" r="2.4" fill="${T.light}" stroke="${T.dark}" stroke-width="0.7"/><circle cx="-24" cy="21" r="1.3" fill="${T.ruby}" stroke="${T.light}" stroke-width="0.4"/>` + scroll;
  const band = `<path d="M-33 29H33V36H-33Z" fill="url(#${P}v)" stroke="${T.dark}" stroke-width="1" stroke-linejoin="round"/><path d="M-33 30.6H33M-33 34.4H33" stroke="${T.main}" stroke-width="0.8"/>`;
  const mid = `<path d="M-8 22L0 4L8 22L5 30H-5Z" fill="${T.main}" stroke="${T.dark}" stroke-width="0.9" stroke-linejoin="round"/><circle cx="0" cy="3.4" r="2.4" fill="${T.ruby}" stroke="${T.light}" stroke-width="0.6"/><path d="M0 12L4.6 21L0 29L-4.6 21Z" fill="${T.ruby}" stroke="${T.light}" stroke-width="0.9" stroke-linejoin="round"/><path d="M-1.6 16.4L0 14.6L-2.6 21Z" fill="#FFFFFF"/>`;
  const gems = [-26, -13, 13, 26].map((x, i) => `<circle cx="${x}" cy="32.5" r="1.6" fill="${i % 2 ? T.silver : T.ruby}" stroke="${T.light}" stroke-width="0.5"/>`).join('') + `<circle cx="0" cy="33" r="1.9" fill="${T.light}" stroke="${T.main}" stroke-width="0.6"/>`;
  return defs + half + `<g transform="scale(-1 1)">${half}</g>` + band + mid + gems;
}
module.exports = { crestTop };
