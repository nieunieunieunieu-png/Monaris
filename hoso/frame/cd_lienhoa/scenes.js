// ===== hoso/frame/cd_lienhoa/scenes.js — 4 CẢNH GÓC bo tròn: tháp chùa · trăng núi · hồ sen · đình + tre trúc =====
// Hình học: mỗi cảnh là ô 64×64 đặt trong thẻ ở inset 26 (ngay trong viền hào quang, bậc 9 dày nhất ≈ 24px); bo tròn: góc ngoài r=20, ba góc còn lại r=9; viền vàng mảnh.
// 4 cảnh KHÁC nhau (không lật gương). Bậc i chỉ THÊM chi tiết so với bậc i−1 (cùng nhánh `if (t.i >= n)`). border.js nối `scenes(tier, W, H)` vào cuối chuỗi frameBorder.
const { TIERS, byRealm } = require('./colors');
const P = 'cd_lienhoa-scene-';
const n = (v) => Number(v.toFixed(2));
const S = 64, INSET = 26, RO = 20, RI = 9;

// Đường bo tròn 64×64 với bán kính từng góc [trên-trái, trên-phải, dưới-phải, dưới-trái].
const rr = (a, b, c, d) => `M${a} 0H${S - b}A${b} ${b} 0 0 1 ${S} ${b}V${S - c}A${c} ${c} 0 0 1 ${S - c} ${S}H${d}A${d} ${d} 0 0 1 0 ${S - d}V${a}A${a} ${a} 0 0 1 ${a} 0Z`;
const grad = (id, stops) => `<linearGradient id="${P}${id}" x1="0" y1="0" x2="0" y2="1">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
const bird = (x, y) => `M${x} ${y}q2-2.4 4 0q2-2.4 4 0`;
const star = (x, y) => `M${x} ${y - 2}V${y + 2}M${x - 2} ${y}H${x + 2}`;
// Hoa sen nhỏ (3 cánh) gốc (x,y), tỉ lệ k.
const flower = (x, y, k) => `<g transform="translate(${x} ${y}) scale(${k})" fill="#F7A0B8" stroke="#FFF1F5" stroke-width=".5" stroke-linejoin="round"><path d="M0 0Q-6-1-5-7Q-1-4 0 0Z"/><path d="M0 0Q6-1 5-7Q1-4 0 0Z"/><path d="M0 0Q-3.5-4 0-10Q3.5-4 0 0Z"/></g>`;

// 1) Trên-trái: tháp chùa trên đồi + mây (3 tầng; i≥3 thêm tầng 4; i≥6 thêm tầng 5 + vầng sáng; i≥8 thêm sao).
function thap(t) {
  const tiers = 3 + (t.i >= 3 ? 1 : 0) + (t.i >= 6 ? 1 : 0), cx = 32, base = 50;
  let s = `<rect width="64" height="64" fill="url(#${P}tl)"/>`;
  s += `<ellipse cx="14" cy="14" rx="9" ry="2.6" fill="#fff" opacity=".55"/><ellipse cx="22" cy="11" rx="6" ry="2.2" fill="#fff" opacity=".55"/>`;
  if (t.i >= 2) s += `<ellipse cx="50" cy="20" rx="8" ry="2.4" fill="#fff" opacity=".5"/>`;
  if (t.i >= 6) s += `<circle cx="32" cy="27" r="23" fill="none" stroke="#F5C518" stroke-width="1" opacity=".55"/>`;
  s += `<path d="M0 52Q14 44 30 50T64 47V64H0Z" fill="#4FA07A"/><path d="M0 58Q20 50 40 57T64 55V64H0Z" fill="#2F7A5A"/>`;
  for (let k = 0; k < tiers; k++) {
    const w = 20 - 3 * k, y = base - 8 * k;
    s += `<rect x="${n(cx - (w - 4) / 2)}" y="${y - 4}" width="${w - 4}" height="4.5" fill="#A66A12"/>`
      + `<path d="M${n(cx - w / 2 - 3)} ${y - 3.5}Q${n(cx - w / 2 + 1)} ${y - 4.5} ${cx} ${y - 8.5}Q${n(cx + w / 2 - 1)} ${y - 4.5} ${n(cx + w / 2 + 3)} ${y - 3.5}Z" fill="#F2B91E" stroke="#8A5A00" stroke-width=".5" stroke-linejoin="round"/>`;
  }
  const top = base - 8 * (tiers - 1) - 8.5;
  s += `<path d="M${cx} ${top}V${top - 4.5}" stroke="#8A5A00" stroke-width=".8"/><circle cx="${cx}" cy="${n(top - 5)}" r="1.2" fill="#F5C518"/>`;
  if (t.i >= 8) s += `<path d="${star(9, 30)}${star(55, 38)}" stroke="#fff" stroke-width=".8" opacity=".85" fill="none"/>`;
  return s;
}

// 2) Trên-phải: trăng + núi + chim (i≥1 chim 1; i≥3 chim 2; i≥4 quầng trăng; i≥5 chim 3; i≥6 sao; i≥8 thêm sao).
function trang(t) {
  let s = `<rect width="64" height="64" fill="url(#${P}tr)"/>`;
  if (t.i >= 4) s += `<circle cx="44" cy="18" r="13" fill="#FFF1B8" opacity=".22"/>`;
  s += `<circle cx="44" cy="18" r="8" fill="#FFF1B8"/><circle cx="41.5" cy="16" r="2" fill="#F2DD94"/>`;
  s += `<path d="M0 50L15 31L28 46L42 30L64 52V64H0Z" fill="#2F6E73" opacity=".9"/><path d="M0 64V55Q16 46 32 55T64 53V64Z" fill="#1F5A4A"/>`;
  let b = '';
  if (t.i >= 1) b += bird(10, 16);
  if (t.i >= 3) b += bird(22, 26);
  if (t.i >= 5) b += bird(28, 11);
  if (b) s += `<path d="${b}" stroke="#fff" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".9"/>`;
  let st = '';
  if (t.i >= 6) st += star(12, 7) + star(58, 38);
  if (t.i >= 8) st += star(30, 36) + star(56, 6);
  if (st) s += `<path d="${st}" stroke="#fff" stroke-width=".8" opacity=".8" fill="none"/>`;
  return s;
}

// 3) Dưới-trái: hồ sen + lá sen + bồ hoàng (2 hoa; i≥2 +1; i≥3 lá thứ 3; i≥4 +1; i≥6 +1; i≥8 +1; i≥1 gợn sóng).
function ho(t) {
  let s = `<rect width="64" height="64" fill="url(#${P}bl)"/><path d="M0 27Q14 21 30 26T64 24V28H0Z" fill="#3A8F66"/>`;
  if (t.i >= 1) s += `<path d="M6 59q6-1.5 12 0M36 61q8-1.5 14 0" stroke="#fff" opacity=".45" fill="none" stroke-width=".8"/>`;
  const pads = [[16, 52, 9], [42, 55, 8]];
  if (t.i >= 3) pads.push([30, 47, 6]);
  pads.forEach(([x, y, rx]) => { s += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="3" fill="#2E8B57" stroke="#1F6B42" stroke-width=".5"/>`; });
  [6, 11].forEach((x) => { s += `<path d="M${x} 60Q${x - 1} 42 ${x + 1} 33" stroke="#2E8B57" stroke-width="1.2" fill="none"/><ellipse cx="${x + 1}" cy="31.5" rx="1.3" ry="3.4" fill="#8B5A2B"/>`; });
  const fl = [[24, 36, 1], [34, 40, 0.85]];
  if (t.i >= 2) fl.push([46, 38, 1]);
  if (t.i >= 4) fl.push([18, 41, 0.8]);
  if (t.i >= 6) fl.push([56, 43, 0.8]);
  if (t.i >= 8) fl.push([29, 31, 0.75]);
  fl.forEach(([x, y]) => { s += `<path d="M${x} 56Q${x + 1} ${n((56 + y) / 2)} ${x} ${y}" stroke="#2E8B57" stroke-width="1" fill="none"/>`; });
  fl.forEach(([x, y, k]) => { s += flower(x, y, k); });
  return s;
}

// 4) Dưới-phải: đình vàng + tre trúc (2 cây tre; i≥2 +1; i≥5 +1; i≥4 đèn lồng; i≥6 vầng sáng sau đình).
function dinh(t) {
  let s = `<rect width="64" height="64" fill="url(#${P}br)"/>`;
  if (t.i >= 6) s += `<circle cx="24" cy="38" r="19" fill="none" stroke="#F5C518" stroke-width="1" opacity=".55"/>`;
  s += `<path d="M0 60Q20 56 40 59T64 58V64H0Z" fill="#2F7A5A"/>`;
  s += `<rect x="9" y="55" width="30" height="4" fill="#7A4B14"/><rect x="13" y="42" width="22" height="13" fill="#C8871A"/><path d="M21 55V48Q24 44 27 48V55Z" fill="#FFF3C4"/>`;
  s += `<path d="M3 44Q16 43 24 29Q32 43 45 44L42 46H6Z" fill="#F2B91E" stroke="#8A5A00" stroke-width=".6" stroke-linejoin="round"/><circle cx="24" cy="28" r="1.4" fill="#F5C518"/>`;
  if (t.i >= 4) s += `<circle cx="9" cy="48" r="1.7" fill="#D93A2B"/><circle cx="39" cy="48" r="1.7" fill="#D93A2B"/>`;
  const stems = [[57, 6], [52, 14]];
  if (t.i >= 2) stems.push([62, 10]);
  if (t.i >= 5) stems.push([47.5, 20]);
  stems.forEach(([x, top], j) => {
    s += `<path d="M${x} 62V${top}" stroke="#3A9E6F" stroke-width="2.2" fill="none"/>`;
    let nd = '';
    for (let y = 56; y > top + 3; y -= 9) nd += `M${n(x - 1.4)} ${y}h2.8`;
    s += `<path d="${nd}" stroke="#1F6B42" stroke-width=".8" fill="none"/>`;
    const d = j % 2 ? -1 : 1;
    s += `<path d="M${x} ${top + 5}q${5 * d} -1 ${8 * d} -5q${-5 * d} 0 ${-8 * d} 5zM${x} ${top + 13}q${-5 * d} -1 ${-8 * d} -5q${5 * d} 0 ${8 * d} 5z" fill="#3A9E6F"/>`;
  });
  return s;
}

const CELLS = [
  { id: 'tl', radii: [RO, RI, RI, RI], draw: thap, at: () => [INSET, INSET] },
  { id: 'tr', radii: [RI, RO, RI, RI], draw: trang, at: (W) => [W - INSET - S, INSET] },
  { id: 'bl', radii: [RI, RI, RI, RO], draw: ho, at: (W, H) => [INSET, H - INSET - S] },
  { id: 'br', radii: [RI, RI, RO, RI], draw: dinh, at: (W, H) => [W - INSET - S, H - INSET - S] },
];

function scenes(tier, W, H) {
  const t = tier && Number.isInteger(tier.i) ? tier : byRealm(tier && tier.i) || TIERS[0];
  const defs = `<defs>${grad('tl', [[0, '#2B78AE'], [1, '#D6EEF5']])}${grad('tr', [[0, '#1B3A6B'], [1, '#6FB0D6']])}${grad('bl', [[0, '#BFE3F0'], [0.42, '#8CCBEA'], [0.43, '#5FB0E0'], [1, '#2C7DB8']])}${grad('br', [[0, '#9ED0EE'], [1, '#E8F5F8']])}</defs>`;
  let s = defs;
  // Hoà làm một với nền thẻ: mỗi cảnh KHÔNG còn khung/viền cứng — tranh tan dần (mặt nạ gradient tròn, mờ ra mép) vào nền xanh lam của thẻ,
  // phủ nhẹ màu lam để cùng tông. Tranh vẫn nằm trong ô 64×64 (clip bo tròn) nên không đè lên viền hào quang.
  CELLS.forEach((c) => {
    const [x, y] = c.at(W, H), d = rr(...c.radii), mid = `${P}m-${c.id}`;
    s += `<defs><radialGradient id="${mid}g" cx=".5" cy=".5" r=".64"><stop offset="0" stop-color="#fff"/><stop offset=".62" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>`
      + `<mask id="${mid}" maskUnits="userSpaceOnUse" x="0" y="0" width="${S}" height="${S}"><rect width="${S}" height="${S}" fill="url(#${mid}g)"/></mask></defs>`;
    s += `<g transform="translate(${x} ${y})"><clipPath id="${P}c-${c.id}"><path d="${d}"/></clipPath>`
      + `<g clip-path="url(#${P}c-${c.id})"><g mask="url(#${mid})"><g opacity=".92">${c.draw(t)}</g><rect width="${S}" height="${S}" fill="#2A6CC0" opacity=".14"/></g></g></g>`;
  });
  return s;
}
module.exports = { scenes };
