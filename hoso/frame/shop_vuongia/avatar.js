// ===== hoso/frame/shop_vuongia/avatar.js — KHUNG AVATAR: nguyệt quế vàng 9 lá×2 cánh có gân + nơ lụa đỏ đáy + vương miện mini =====
// Hình học: vành r 70..77; lá nguyệt quế ôm cung tối đa r≈83; vương miện r 72..84 ở đỉnh; kim cương trên vành.
const T = require('./colors').TIERS[0];
const P = 'shop_vuongia-avatar-';
const n = (v) => Number(v.toFixed(2));
const pol = (r, deg) => { const t = (deg * Math.PI) / 180; return `${n(r * Math.cos(t))} ${n(r * Math.sin(t))}`; };
function avatarFrame(_tier, R = 70) {
  const k = Number((R / 70).toFixed(4));
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.5" stop-color="${T.main}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient></defs>`;
  const ring = `<path fill-rule="evenodd" fill="url(#${P}g)" d="M-77 0 A77 77 0 1 0 77 0 A77 77 0 1 0 -77 0 Z M-70 0 A70 70 0 1 0 70 0 A70 70 0 1 0 -70 0 Z"/><circle r="73.5" fill="none" stroke="${T.dark}" stroke-opacity="0.6" stroke-width="0.7"/>`;
  // nguyệt quế trái: lá ngoài (r→83) và lá trong (r→71) xen kẽ, từ dưới (100°) lên (≈245°)
  let lo = '', li = '', berry = '', vein = '';
  for (let i = 0; i < 9; i++) {
    const a = 100 + i * 16.5;
    lo += `M${pol(75, a)}Q${pol(84, a + 6)} ${pol(82.5, a + 19)}Q${pol(78, a + 11)} ${pol(75, a)}Z`;
    li += `M${pol(73, a + 8)}Q${pol(68.5, a + 15)} ${pol(70.5, a + 27)}Q${pol(72.5, a + 18)} ${pol(73, a + 8)}Z`;
    vein += `M${pol(75.5, a + 1)}Q${pol(80, a + 6)} ${pol(81.5, a + 15)}`;
    const [x, y] = pol(81, a + 4).split(' ');
    berry += `<circle cx="${x}" cy="${y}" r="1.1" fill="${T.ruby}"/>`;
  }
  const laurel = `<path d="${lo}" fill="${T.main}" stroke="${T.dark}" stroke-width="0.6" stroke-linejoin="round"/><path d="${li}" fill="${T.light}" stroke="${T.dark}" stroke-width="0.5" stroke-linejoin="round"/>${berry}<path d="${vein}" fill="none" stroke="${T.dark}" stroke-width="0.5" stroke-opacity="0.7"/>`;
  // kim cương bạc trên vành
  let dm = '';
  [20, 60, 120, 160].forEach((d) => { dm += `<g transform="rotate(${d})"><path d="M0 -73.5L2.6 -76.5L0 -79.5L-2.6 -76.5Z" fill="${T.light}" stroke="${T.silver}" stroke-width="0.6"/></g>`; });
  const dmm = dm + dm.replace(/rotate\((\d+)\)/g, (m, d) => `rotate(${360 - d})`);
  // vương miện mini ở đỉnh (y -72..-84)
  const crown = `<path d="M-9 -73L-10 -82L-5 -78L0 -84L5 -78L10 -82L9 -73Z" fill="url(#${P}g)" stroke="${T.dark}" stroke-width="0.8" stroke-linejoin="round"/><rect x="-9.4" y="-75" width="18.8" height="2.6" fill="${T.main}" stroke="${T.dark}" stroke-width="0.6"/><circle cx="0" cy="-77.6" r="1.7" fill="${T.ruby}" stroke="${T.light}" stroke-width="0.5"/><circle cx="-5.5" cy="-76.6" r="0.9" fill="${T.silver}"/><circle cx="5.5" cy="-76.6" r="0.9" fill="${T.silver}"/><circle cx="0" cy="-84" r="1" fill="${T.ruby}"/><circle cx="-10" cy="-82" r="0.9" fill="${T.light}"/><circle cx="10" cy="-82" r="0.9" fill="${T.light}"/>`;
  // nơ lụa đỏ buộc nguyệt quế ở đáy (r 72..84)
  const bow = `<path d="M0 78C-5 72 -13 73 -12 78C-11 82 -4 81 0 78Z M0 78C5 72 13 73 12 78C11 82 4 81 0 78Z" fill="${T.ruby}" stroke="${T.rubyDark}" stroke-width="0.7" stroke-linejoin="round"/><path d="M-1 79L-6 84L-2.4 82.6L-1.4 84Z M1 79L6 84L2.4 82.6L1.4 84Z" fill="${T.ruby}" stroke="${T.rubyDark}" stroke-width="0.6" stroke-linejoin="round"/><circle cx="0" cy="78" r="2.2" fill="${T.main}" stroke="${T.dark}" stroke-width="0.6"/>`;
  return `${defs}<g transform="scale(${k})">${ring}${laurel}<g transform="scale(-1 1)">${laurel}</g>${dmm}${crown}${bow}</g>`;
}
module.exports = { avatarFrame };
