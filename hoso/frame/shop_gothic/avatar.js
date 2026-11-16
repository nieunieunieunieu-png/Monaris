// ===== hoso/frame/shop_gothic/avatar.js — KHUNG AVATAR: cánh dơi 6 ngón màng lượn sóng ôm sát vòng, gai hồng quấn, ngọc huyết đỉnh =====
// Hình học: vành r 70..77; cánh dơi mép trong r71.5, mút ngón r 83.5 (≤ r=84), màng lõm r75.5; gai hồng quấn r 72..74.4; giọt máu r=80.
const T = require('./colors').TIERS[0];
const P = 'shop_gothic-avatar-';
const n = (v) => Number(v.toFixed(2));
const rad = (d) => (d * Math.PI) / 180;
const pt = (r, a) => `${n(r * Math.cos(rad(a)))} ${n(r * Math.sin(rad(a)))}`;
function avatarFrame(_tier, R = 70) {
  const k = Number((R / 70).toFixed(4));
  const defs = `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.light}"/><stop offset="0.5" stop-color="${T.main}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient><linearGradient id="${P}w" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="${T.wing}"/><stop offset="1" stop-color="${T.blood}"/></linearGradient></defs>`;
  const ring = `<path fill-rule="evenodd" fill="url(#${P}g)" d="M-77 0 A77 77 0 1 0 77 0 A77 77 0 1 0 -77 0 Z M-70 0 A70 70 0 1 0 70 0 A70 70 0 1 0 -70 0 Z"/>`;
  // cánh dơi trái: 6 xương ngón toả từ cổ tay (r77, 180°) tới mút r 83.5 (góc 112..242), màng lượn sóng giữa các mút, mép trong ôm vành r71
  const tips = [112, 136, 160, 200, 224, 248];
  const wr = pt(77, 180);
  let mem = `M${pt(71.5, 108)}L${pt(83.5, tips[0])}`;
  let bones = '';
  tips.forEach((a, i) => {
    bones += `<path d="M${wr}Q${pt(81, (a + 180) / 2 + (a > 180 ? 8 : -8))} ${pt(83.5, a)}" fill="none" stroke="${T.bloodDark}" stroke-width="0.9" stroke-linecap="round"/><path d="M${wr}Q${pt(81, (a + 180) / 2 + (a > 180 ? 8 : -8))} ${pt(83.5, a)}" fill="none" stroke="${T.light}" stroke-width="0.3" stroke-opacity="0.5"/>`;
    if (i < tips.length - 1) mem += `Q${pt(75.5, (a + tips[i + 1]) / 2)} ${pt(83.5, tips[i + 1])}`;
  });
  mem += `L${pt(71.5, 252)}A71.5 71.5 0 0 0 ${pt(71.5, 108)}Z`;
  const wing = `<path d="${mem}" fill="url(#${P}w)" stroke="${T.bloodDark}" stroke-width="0.8" stroke-linejoin="round"/>${bones}<circle cx="${wr.split(' ')[0]}" cy="${wr.split(' ')[1]}" r="1.6" fill="${T.bloodDark}" stroke="${T.light}" stroke-width="0.4"/>`;
  const wingL = `<g>${wing}</g>`;
  const wingR = `<g transform="scale(-1 1)">${wing}</g>`;
  let thorn = '';
  for (let a = 0; a <= 360; a += 18) {
    const o1 = pt(72.2, a);
    const o2 = pt(74.4, a + 9);
    thorn += `<path d="M${o1}L${o2}" stroke="${T.thorn}" stroke-width="0.8" stroke-opacity="0.85"/>`;
  }
  const spikes = [0, 60, 120, 180, 240, 300].map((a) => { const p1 = pt(72.5, a); const p2 = pt(76.5, a + 4); const p3 = pt(72.5, a + 8); return `<path d="M${p1}L${p2}L${p3}Z" fill="${T.thorn}" stroke="${T.bloodDark}" stroke-width="0.4"/>`; }).join('');
  const drops = [20, 100, 200, 280].map((a) => { const c = pt(80, a).split(' '); return `<circle cx="${c[0]}" cy="${c[1]}" r="1.4" fill="${T.blood}"/>`; }).join('');
  const gem = `<path d="M0 -72.6L3.4 -77L0 -81.6L-3.4 -77Z" fill="${T.blood}" stroke="${T.light}" stroke-width="0.7" stroke-linejoin="round"/><path d="M-1.2 -77L0 -79.6" stroke="#FFFFFF" stroke-width="0.6"/>`;
  return `${defs}<g transform="scale(${k})">${ring}${wingL}${wingR}${thorn}${spikes}${drops}${gem}</g>`;
}
module.exports = { avatarFrame };
