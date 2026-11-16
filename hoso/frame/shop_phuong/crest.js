// ===== hoso/frame/shop_phuong/crest.js — ĐỈNH THẺ: đầu phượng dang cánh 3 lớp, mào lửa, ngọc lửa + vầng hào quang =====
// Hình học: gốc giữa cạnh trên; x ∈ [-78, 78], y ∈ [1, 36]; mỏ chạm y=36; đối xứng quanh x=0.
const T = require('./colors').TIERS[0];
const P = 'shop_phuong-crest-';
const n = (v) => Number(v.toFixed(1));
const fp = (L, w) => `M0 0Q${n(L * 0.4)} ${-w} ${L} 0Q${n(L * 0.4)} ${w} 0 0Z`;
function crestTop(_tier, W, H) {
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="${T.dark}"/><stop offset="0.55" stop-color="${T.main}"/><stop offset="1" stop-color="${T.accent}"/></linearGradient><radialGradient id="${P}o" cx="0.4" cy="0.4" r="0.7"><stop offset="0" stop-color="${T.light}"/><stop offset="0.5" stop-color="${T.accent}"/><stop offset="1" stop-color="${T.main}"/></radialGradient><radialGradient id="${P}a" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${T.accent}" stop-opacity="0.55"/><stop offset="1" stop-color="${T.ember}" stop-opacity="0"/></radialGradient></defs>`;
  const aura = `<ellipse cx="0" cy="20" rx="34" ry="18" fill="url(#${P}a)"/>`;
  // cánh trái: 6 lông xoè từ gốc (-12,29), 3 lớp (nền đỏ sẫm, thân gradient, lõi vàng + gân sáng)
  let back = '', mid = '', inn = '', vein = '';
  [[212, 50], [203, 58], [193, 66], [183, 66], [173, 58], [163, 47]].forEach(([a, L]) => {
    back += `<g transform="translate(-12 29) rotate(${a})"><path d="${fp(L + 3, 7.4)}"/></g>`;
    mid += `<g transform="translate(-12 29) rotate(${a})"><path d="${fp(L * 0.92, 5.8)}"/></g>`;
    inn += `<g transform="translate(-12 29) rotate(${a})"><path d="${fp(L * 0.6, 2.8)}"/></g>`;
    vein += `<g transform="translate(-12 29) rotate(${a})"><path d="M${n(L * 0.12)} 0H${n(L * 0.86)}"/></g>`;
  });
  const wing = `<g fill="${T.dark}" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round">${back}</g><g fill="url(#${P}g)" stroke="${T.ember}" stroke-width="0.5" stroke-linejoin="round">${mid}</g><g fill="${T.accent}" fill-opacity="0.92">${inn}</g><g fill="none" stroke="${T.light}" stroke-width="0.5" stroke-opacity="0.85">${vein}</g>`;
  // mào 5 lông + đầu + mỏ + ngọc lửa
  const plume = [[-90, 17], [-110, 15], [-70, 15], [-128, 11], [-52, 11]].map(([a, L]) => `<g transform="translate(0 20) rotate(${a})"><path d="${fp(L, 3)}" fill="${T.main}" stroke="${T.dark}" stroke-width="0.7" stroke-linejoin="round"/></g>`).join('');
  const head = `<path d="M-8 22C-8 14 8 14 8 22C8 28 3 31 0 31C-3 31 -8 28 -8 22Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.9" stroke-linejoin="round"/><path d="M-3.5 29L0 36L3.5 29Z" fill="${T.accent}" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/><circle cx="-3.6" cy="23" r="1.3" fill="${T.dark}"/><circle cx="3.6" cy="23" r="1.3" fill="${T.dark}"/><circle cx="-3.2" cy="22.6" r="0.4" fill="${T.light}"/><circle cx="4" cy="22.6" r="0.4" fill="${T.light}"/>`;
  const gem = `<path d="M0 10C-4.4 15.6 -3.4 19 0 19C3.4 19 4.4 15.6 0 10Z" fill="url(#${P}o)" stroke="${T.dark}" stroke-width="0.7"/><circle cx="-0.8" cy="15.4" r="0.7" fill="#FFFFFF"/>`;
  return defs + aura + wing + `<g transform="scale(-1 1)">${wing}</g>` + plume + head + gem;
}
module.exports = { crestTop };
