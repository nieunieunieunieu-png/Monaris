// ===== hoso/frame/shop_huyetnguyet/avatar.js — KHUNG AVATAR: vòng quỷ khí đỏ thẫm quấn xích, khói đỏ =====
// Hình học: vành r 70..77; xích sắt r 69..78; gai tối đa r=83.5; khói tối đa r≈84; mắt ma ở đỉnh (270°) r 69..79.
const T = require('./colors').TIERS[0];
const P = 'shop_huyetnguyet-avatar-';
const n = (v) => Number(v.toFixed(2));
const pol = (r, deg) => { const t = (deg * Math.PI) / 180; return `${n(r * Math.cos(t))} ${n(r * Math.sin(t))}`; };
function avatarFrame(_tier, R = 70) {
  const k = Number((R / 70).toFixed(4));
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.blood}"/><stop offset="0.5" stop-color="${T.black}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient>`
    + `<g id="${P}a"><ellipse cx="73.5" cy="0" rx="2.5" ry="4.3" fill="none" stroke="${T.black}" stroke-width="2.4"/><ellipse cx="73.5" cy="0" rx="2.5" ry="4.3" fill="none" stroke="${T.iron}" stroke-width="1.4"/><path d="M71.6 -2.6A2.5 4.3 0 0 1 74 -4.2" fill="none" stroke="${T.ironLight}" stroke-width="0.5"/></g>`
    + `<g id="${P}b"><ellipse cx="73.5" cy="0" rx="1" ry="3.7" fill="${T.iron}" stroke="${T.black}" stroke-width="0.6"/></g></defs>`;
  const ring = `<path fill-rule="evenodd" fill="url(#${P}g)" d="M-77 0 A77 77 0 1 0 77 0 A77 77 0 1 0 -77 0 Z M-70 0 A70 70 0 1 0 70 0 A70 70 0 1 0 -70 0 Z"/><circle r="70.6" fill="none" stroke="${T.main}" stroke-width="1.1"/><circle r="76.4" fill="none" stroke="${T.main}" stroke-width="0.8" stroke-opacity="0.7"/>`;
  let smoke = '';
  [20, 95, 150, 215, 320].forEach((a) => { smoke += `M${pol(77, a)}Q${pol(88, a + 9)} ${pol(79, a + 22)}`; });
  const wisps = `<path d="${smoke}" fill="none" stroke="${T.main}" stroke-opacity="0.5" stroke-width="2.2" stroke-linecap="round"/><path d="${smoke}" fill="none" stroke="${T.ember}" stroke-opacity="0.7" stroke-width="0.7" stroke-linecap="round" transform="translate(0.8 -0.8)"/>`;
  let sp = '';
  for (let a = 22.5; a < 360; a += 45) sp += `M${pol(75, a - 3.4)}L${pol(83.5, a)}L${pol(75, a + 3.4)}Z`;
  const spikes = `<path d="${sp}" fill="${T.black}" stroke="${T.main}" stroke-width="0.7" stroke-linejoin="round"/>`;
  let links = '';
  for (let a = 0, i = 0; a < 360; a += 12, i++) links += `<use href="#${P}${i % 2 ? 'b' : 'a'}" transform="rotate(${a})"/>`;
  const eye = `<g transform="translate(0 -73.5)"><path d="M-10 -1.5L-7.5 -4L-7 1L-10 3Z M10 -1.5L7.5 -4L7 1L10 3Z" fill="${T.iron}" stroke="${T.black}" stroke-width="0.7" stroke-linejoin="round"/><path d="M-7.5 0Q0 -5.4 7.5 0Q0 5.4 -7.5 0Z" fill="${T.main}" stroke="${T.black}" stroke-width="1"/><circle r="2.3" fill="${T.ember}"/><ellipse rx="0.75" ry="2.3" fill="${T.black}"/><circle cx="-1.2" cy="-1.2" r="0.5" fill="#FFFFFF"/></g>`;
  return `${defs}<g transform="scale(${k})">${wisps}${ring}${links}${spikes}${eye}</g>`;
}
module.exports = { avatarFrame };
