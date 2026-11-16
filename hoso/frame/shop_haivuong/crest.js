// ===== hoso/frame/shop_haivuong/crest.js — ĐỈNH THẺ: đinh ba vàng 3 chạc có ngạnh khảm ngọc lam + sóng vàng hai bên =====
// Hình học: gốc giữa cạnh trên; x ∈ [-74,74], y ∈ [1,36]; chân chạm y=36; lật x bằng nhân toạ độ với sx=±1; hệ thống phóng ×2.
const T = require('./colors').TIERS[0];
const P = 'shop_haivuong-crest-';
function crestTop(_tier, _W, _H) {
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.goldLight}"/><stop offset="0.5" stop-color="${T.gold}"/><stop offset="1" stop-color="${T.goldDark}"/></linearGradient><radialGradient id="${P}gem" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.4" stop-color="${T.light}"/><stop offset="1" stop-color="${T.main}"/></radialGradient><radialGradient id="${P}o" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${T.light}" stop-opacity="0.5"/><stop offset="1" stop-color="${T.light}" stop-opacity="0"/></radialGradient></defs>`;
  const st = `stroke="${T.goldDark}" stroke-width="0.7" stroke-linejoin="round"`;
  const aura = `<ellipse cx="0" cy="16" rx="26" ry="16" fill="url(#${P}o)"/>`;
  const shaft = `<path d="M-2.4 36L-2 14H2L2.4 36Z" fill="url(#${P}g)" ${st}/><path d="M-3.4 30H3.4V32.4H-3.4Z" fill="${T.goldLight}" ${st}/>`;
  const centre = `<path d="M0 0.8L5.4 10L2.8 9.4V18H-2.8V9.4L-5.4 10Z" fill="url(#${P}g)" ${st}/><path d="M0 4V15" stroke="${T.goldLight}" stroke-width="0.7" stroke-opacity="0.9"/>`;
  const prong = (s) => `<path d="M${2.4 * s} 21C${2.4 * s} 13 ${14 * s} 16 ${15 * s} 8L${14.6 * s} 3L${17.4 * s} 8L${19.6 * s} 5.6C${20.6 * s} 16 ${10 * s} 20 ${5 * s} 24Z" fill="url(#${P}g)" ${st}/><path d="M${4 * s} 20C${5 * s} 15 ${13 * s} 15 ${15 * s} 9" fill="none" stroke="${T.goldLight}" stroke-width="0.6" stroke-opacity="0.9"/>`;
  const wave = (s) => `<path d="M${22 * s} 31C${34 * s} 31 ${38 * s} 23 ${50 * s} 25C${60 * s} 27 ${60 * s} 18 ${70 * s} 20C${74 * s} 21 ${73 * s} 27 ${69 * s} 26" fill="none" stroke="${T.goldDark}" stroke-width="3.4" stroke-linecap="round"/><path d="M${22 * s} 31C${34 * s} 31 ${38 * s} 23 ${50 * s} 25C${60 * s} 27 ${60 * s} 18 ${70 * s} 20C${74 * s} 21 ${73 * s} 27 ${69 * s} 26" fill="none" stroke="${T.gold}" stroke-width="1.8" stroke-linecap="round"/><path d="M${28 * s} 28.6C${36 * s} 28 ${42 * s} 24 ${50 * s} 22.6" fill="none" stroke="${T.foam}" stroke-width="0.8" stroke-opacity="0.9" stroke-linecap="round"/><circle cx="${36 * s}" cy="20" r="1.6" fill="${T.foam}" fill-opacity="0.3" stroke="${T.foam}" stroke-width="0.5"/><circle cx="${58 * s}" cy="12" r="1.2" fill="${T.foam}" fill-opacity="0.3" stroke="${T.foam}" stroke-width="0.5"/><circle cx="${46 * s}" cy="14" r="0.9" fill="${T.foam}" fill-opacity="0.3" stroke="${T.foam}" stroke-width="0.5"/>`;
  const cross = `<path d="M-13 18.6H13L11 22H-11Z" fill="url(#${P}g)" ${st}/>`;
  const gem = `<path d="M0 20.6L6.4 27L0 34L-6.4 27Z" fill="url(#${P}gem)" stroke="${T.goldDark}" stroke-width="0.9" stroke-linejoin="round"/><path d="M0 23.4L3.6 27L0 31L-3.6 27Z" fill="#FFFFFF" fill-opacity="0.35"/><path d="M-1.8 24.4L-0.2 23.6L-2.8 27Z" fill="#FFFFFF"/>`;
  return defs + aura + wave(1) + wave(-1) + shaft + prong(1) + prong(-1) + centre + cross + gem;
}
module.exports = { crestTop };
