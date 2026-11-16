// ===== hoso/frame/cd_lienhoa/accents.js — ĐIỂM NHẤN 4 GÓC (huy hiệu tròn nhô ngoài thẻ): nụ sen · trăng khuyết · cành trúc · bảo châu =====
// Hình học: mỗi góc quanh (0,0) hướng lên trái, nằm trong x,y ∈ [-28, 0]; tâm huy hiệu (-14,-14), r ≤ 13. 4 huy hiệu KHÁC nhau; chỉ phần đặt góc mới lật (sx, sy), hình vẽ không bị lật gương trong code.
// Bậc i chỉ THÊM: i≥2 vòng ngoài mảnh, i≥5 4 chấm cardinal, i≥8 4 chấm sáng chéo.
const { TIERS, byRealm } = require('./colors');
const P = 'cd_lienhoa-accent-';
const C = -14, R = 11;
const n = (v) => Number(v.toFixed(2));

function disc(t) {
  let s = `<circle cx="${C}" cy="${C}" r="${R}" fill="#1E3A3F" fill-opacity=".88" stroke="${t.colors[0]}" stroke-width="1.4"/>`;
  if (t.i >= 2) s += `<circle cx="${C}" cy="${C}" r="13" fill="none" stroke="${t.accent}" stroke-width=".8"/>`;
  if (t.i >= 5) s += [[0, 13], [0, -13], [13, 0], [-13, 0]].map(([dx, dy]) => `<circle cx="${C + dx}" cy="${C + dy}" r="1.1" fill="${t.accent}"/>`).join('');
  if (t.i >= 8) s += [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([dx, dy]) => `<circle cx="${n(C + dx * 9.2)}" cy="${n(C + dy * 9.2)}" r=".8" fill="#fff"/>`).join('');
  return s;
}

// Trên-trái: nụ sen hồng + lá.
const lotusBud = () => `<path d="M${C} -4V-9" stroke="#3A9E6F" stroke-width="1.2"/><ellipse cx="-9" cy="-6.5" rx="3.6" ry="1.4" transform="rotate(-25 -9 -6.5)" fill="#3A9E6F"/>`
  + `<g transform="translate(${C} -9) scale(.95)" fill="#F7A0B8" stroke="#FFF1F5" stroke-width=".5" stroke-linejoin="round"><path d="M0 0Q-6-1-5-7Q-1-4 0 0Z"/><path d="M0 0Q6-1 5-7Q1-4 0 0Z"/><path d="M0 0Q-3.5-4 0-10Q3.5-4 0 0Z"/></g>`;
// Trên-phải: trăng khuyết vàng + sao nhỏ.
const crescent = () => `<path d="M${C} -21A7 7 0 1 0 ${C} -7A9 9 0 0 1 ${C} -21Z" fill="#FFF1B8"/><circle cx="-8.5" cy="-17" r=".9" fill="#fff"/>`;
// Dưới-trái: cành trúc 2 lá.
const bamboo = () => `<path d="M${C} -5V-23" stroke="#3A9E6F" stroke-width="2"/><path d="M-15.4 -12h2.8M-15.4 -18h2.8" stroke="#1F6B42" stroke-width=".7"/>`
  + `<path d="M${C} -16q5-1 7-5q-5 0-7 5zM${C} -11q-5-1-7-5q5 0 7 5z" fill="#3A9E6F"/>`;
// Dưới-phải: bảo châu vàng trên đế vòng.
const pearl = (t) => `<defs><radialGradient id="${P}p" cx=".38" cy=".35" r=".7"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#FFE48A"/><stop offset="1" stop-color="${t.main}"/></radialGradient></defs>`
  + `<circle cx="${C}" cy="${C}" r="6.2" fill="url(#${P}p)" stroke="${t.dark}" stroke-width=".6"/><circle cx="${C}" cy="${C}" r="8.6" fill="none" stroke="${t.colors[0]}" stroke-width=".7" stroke-opacity=".8"/>`;

function accent(tier, W, H) {
  const t = tier && Number.isInteger(tier.i) ? tier : byRealm(tier && tier.i) || TIERS[0];
  const g = (tx, ty, sx, sy, body) => `<g transform="translate(${tx} ${ty}) scale(${sx} ${sy})">${disc(t)}${body}</g>`;
  return g(0, 0, 1, 1, lotusBud()) + g(W, 0, -1, 1, crescent()) + g(0, H, 1, -1, bamboo()) + g(W, H, -1, -1, pearl(t));
}
module.exports = { accent };
