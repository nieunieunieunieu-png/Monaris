// ===== hoso/frame/cd_lienhoa/backdrop.js — TRANH NỀN LIỀN MẠCH cho thẻ /hosocd (thay 4 ô cảnh góc rời của scenes.js) =====
// Một bức phong cảnh phủ cả thẻ, vẽ trên nền xanh lam: tháp chùa trên vách núi (trên-trái) · trăng + núi xa + chim (trên-phải) · hồ sen (dưới-trái) · đình + tre trúc trên đồi (dưới-phải).
// Giữa thẻ để thoáng (chỗ chữ). Toạ độ thẻ 0..W × 0..H (W=934, H~400); vẽ TRONG nhóm thẻ, SAU nền và TRƯỚC avatar/chữ/viền. Không <text>. Bậc i chỉ THÊM chi tiết so với bậc i−1.
const { TIERS, byRealm } = require('./colors');
const P = 'cd_lienhoa-bd-';
const n = (v) => Number(v.toFixed(1));
const bird = (x, y, k = 1) => `M${x} ${y}q${2 * k}-${2.6 * k} ${4 * k} 0q${2 * k}-${2.6 * k} ${4 * k} 0`;
const star = (x, y, r = 2.4) => `M${x} ${y - r}V${y + r}M${x - r} ${y}H${x + r}`;
const lotus = (x, y, k) => `<g transform="translate(${x} ${y}) scale(${k})" fill="#F7A0B8" stroke="#FFF1F5" stroke-width=".5" stroke-linejoin="round"><path d="M0 0Q-6-1-5-7Q-1-4 0 0Z"/><path d="M0 0Q6-1 5-7Q1-4 0 0Z"/><path d="M0 0Q-3.5-4 0-10Q3.5-4 0 0Z"/></g>`;

// Tháp chùa trên vách núi, góc trên-trái (chân tháp ~ (62,120)).
function thap(t) {
  const tiers = 3 + (t.i >= 3 ? 1 : 0) + (t.i >= 6 ? 1 : 0);
  const cx = 62, base = 122;
  // vách núi mờ dần xuống chân (không còn cạnh cứng): gradient dọc từ đặc -> trong suốt
  let s = `<defs><linearGradient id="${P}cliff" gradientUnits="userSpaceOnUse" x1="0" y1="120" x2="0" y2="250"><stop offset="0" stop-color="#2F6E73" stop-opacity=".55"/><stop offset="1" stop-color="#2F6E73" stop-opacity="0"/></linearGradient></defs>`;
  s += `<path d="M-4 190Q16 150 38 136Q52 120 66 124Q84 128 102 160Q112 176 124 190Q130 215 124 250H-4Z" fill="url(#${P}cliff)"/>`;
  s += `<path d="M-4 200Q30 170 60 150Q92 150 118 192Q122 225 112 250H-4Z" fill="url(#${P}cliff)" opacity=".8"/>`;
  s += `<ellipse cx="118" cy="52" rx="26" ry="6.5" fill="#fff" opacity=".22"/><ellipse cx="146" cy="40" rx="17" ry="5.5" fill="#fff" opacity=".22"/><ellipse cx="36" cy="30" rx="20" ry="5" fill="#fff" opacity=".2"/>`;
  if (t.i >= 2) s += `<ellipse cx="190" cy="70" rx="22" ry="5.5" fill="#fff" opacity=".18"/>`;
  if (t.i >= 6) s += `<circle cx="${cx}" cy="${base - 34}" r="44" fill="none" stroke="#F5C518" stroke-width="1.4" opacity=".4"/>`;
  for (let k = 0; k < tiers; k++) {
    const w = 34 - 5 * k, y = base - 13 * k;
    s += `<rect x="${n(cx - (w - 6) / 2)}" y="${y - 7}" width="${w - 6}" height="7.5" fill="#A66A12" opacity=".8"/>`
      + `<path d="M${n(cx - w / 2 - 5)} ${y - 6}Q${n(cx - w / 2 + 2)} ${y - 8} ${cx} ${y - 14}Q${n(cx + w / 2 - 2)} ${y - 8} ${n(cx + w / 2 + 5)} ${y - 6}Z" fill="#F2B91E" stroke="#8A5A00" stroke-width=".7" stroke-linejoin="round" opacity=".85"/>`;
  }
  const top = base - 13 * (tiers - 1) - 14;
  s += `<path d="M${cx} ${top}V${top - 8}" stroke="#8A5A00" stroke-width="1.2" opacity=".85"/><circle cx="${cx}" cy="${top - 9}" r="2" fill="#F5C518" opacity=".9"/>`;
  if (t.i >= 8) s += `<path d="${star(22, 80)}${star(112, 24)}" stroke="#fff" stroke-width="1.1" opacity=".7" fill="none"/>`;
  return s;
}

// Trăng + núi xa + chim, góc trên-phải.
function trang(W, t) {
  const mx = W - 100, my = 74;
  let s = '';
  if (t.i >= 4) s += `<circle cx="${mx}" cy="${my}" r="46" fill="#FFF1B8" opacity=".14"/>`;
  s += `<circle cx="${mx}" cy="${my}" r="30" fill="#FFF1B8" opacity=".9"/><circle cx="${mx - 8}" cy="${my - 6}" r="6.5" fill="#F2DD94" opacity=".8"/><circle cx="${mx + 10}" cy="${my + 8}" r="4" fill="#F2DD94" opacity=".6"/>`;
  let b = bird(W - 190, 56, 1.4);
  if (t.i >= 1) b += bird(W - 230, 82, 1.2);
  if (t.i >= 3) b += bird(W - 168, 100, 1.1);
  if (t.i >= 5) b += bird(W - 260, 48, 1);
  s += `<path d="${b}" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".7"/>`;
  let st = '';
  if (t.i >= 6) st += star(W - 40, 30) + star(W - 300, 70);
  if (t.i >= 8) st += star(W - 140, 20, 3) + star(W - 30, 130);
  if (st) s += `<path d="${st}" stroke="#fff" stroke-width="1.1" opacity=".65" fill="none"/>`;
  // núi xa nối dài xuống đáy bên phải (liền với đồi đình)
  s += `<path d="M${W - 380} 400L${W - 290} 290L${W - 235} 338L${W - 160} 252L${W - 70} 318L${W} 262V400Z" fill="#2F6E73" opacity=".38"/>`;
  s += `<path d="M${W - 300} 400L${W - 210} 330L${W - 150} 366L${W - 80} 306L${W} 340V400Z" fill="#1F5A4A" opacity=".4"/>`;
  return s;
}

// Hồ sen, góc dưới-trái (mặt nước kéo dài tới giữa đáy thẻ, tan dần).
function ho(H, t) {
  const top = H - 62;
  // mặt hồ tan dần sang phải (gradient ngang), không còn mép dọc
  let s = `<defs><linearGradient id="${P}pond" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="460" y2="0"><stop offset="0" stop-color="#5FB0E0" stop-opacity=".34"/><stop offset=".6" stop-color="#5FB0E0" stop-opacity=".28"/><stop offset="1" stop-color="#5FB0E0" stop-opacity="0"/></linearGradient></defs>`;
  s += `<path d="M0 ${top + 8}Q90 ${top - 4} 200 ${top + 6}T460 ${top + 2}V${H}H0Z" fill="url(#${P}pond)"/>`;
  s += `<path d="M0 ${top + 20}Q110 ${top + 12} 230 ${top + 22}T460 ${top + 18}V${H}H0Z" fill="url(#${P}pond)" opacity=".9"/>`;
  s += `<path d="M0 ${top + 4}Q60 ${top - 6} 130 ${top + 2}T250 ${top}" stroke="#3A8F66" stroke-width="3" fill="none" opacity=".5"/>`;
  if (t.i >= 1) s += `<path d="M30 ${H - 20}q12-3 24 0M200 ${H - 14}q16-3 28 0M320 ${H - 28}q10-2 20 0" stroke="#fff" opacity=".35" fill="none" stroke-width="1.2"/>`;
  const pads = [[60, H - 30, 22], [150, H - 20, 19], [250, H - 30, 15]];
  if (t.i >= 3) pads.push([105, H - 44, 13]);
  pads.forEach(([x, y, rx]) => { s += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${n(rx * 0.32)}" fill="#2E8B57" stroke="#1F6B42" stroke-width=".8" opacity=".75"/>`; });
  [[22, H - 56], [32, H - 50]].forEach(([x]) => { s += `<path d="M${x} ${H - 14}Q${x - 2} ${H - 56} ${x + 2} ${H - 82}" stroke="#2E8B57" stroke-width="2.4" fill="none" opacity=".7"/><ellipse cx="${x + 2}" cy="${H - 86}" rx="2.6" ry="7" fill="#8B5A2B" opacity=".75"/>`; });
  const fl = [[58, H - 50], [152, H - 38]];
  if (t.i >= 2) fl.push([250, H - 46]);
  if (t.i >= 4) fl.push([102, H - 62]);
  if (t.i >= 6) fl.push([300, H - 34]);
  if (t.i >= 8) fl.push([196, H - 56]);
  fl.forEach(([x, y]) => { s += `<path d="M${x} ${H - 24}Q${x + 2} ${n((H - 24 + y) / 2)} ${x} ${y}" stroke="#2E8B57" stroke-width="1.6" fill="none" opacity=".7"/>${lotus(x, y, 1.5)}`; });
  return s;
}

// Đình + tre trúc trên đồi, góc dưới-phải.
function dinh(W, H, t) {
  const cx = W - 98, by = H - 40;
  let s = `<path d="M${W - 360} ${H}Q${W - 220} ${H - 70} ${W - 90} ${H - 50}T${W} ${H - 56}V${H}Z" fill="#3A9E6F" opacity=".5"/><path d="M${W - 250} ${H}Q${W - 130} ${H - 38} ${W} ${H - 30}V${H}Z" fill="#1F6B42" opacity=".5"/>`;
  if (t.i >= 6) s += `<circle cx="${cx}" cy="${by - 30}" r="50" fill="none" stroke="#F5C518" stroke-width="1.4" opacity=".4"/>`;
  s += `<rect x="${cx - 38}" y="${by - 2}" width="76" height="6" fill="#8A5A00" opacity=".75"/><rect x="${cx - 28}" y="${by - 30}" width="56" height="28" fill="#A66A12" opacity=".7"/><rect x="${cx - 6}" y="${by - 20}" width="12" height="20" rx="1.5" fill="#5a3a08" opacity=".8"/>`;
  s += `<path d="M${cx - 46} ${by - 28}Q${cx - 28} ${by - 30} ${cx} ${by - 62}Q${cx + 28} ${by - 30} ${cx + 46} ${by - 28}L${cx + 40} ${by - 24}H${cx - 40}Z" fill="#F2B91E" stroke="#8A5A00" stroke-width=".9" stroke-linejoin="round" opacity=".9"/><circle cx="${cx}" cy="${by - 64}" r="2.4" fill="#F5C518" opacity=".95"/>`;
  if (t.i >= 4) s += `<circle cx="${cx - 24}" cy="${by - 18}" r="3" fill="#E5483B" opacity=".9"/><circle cx="${cx + 24}" cy="${by - 18}" r="3" fill="#E5483B" opacity=".9"/>`;
  const stems = 2 + (t.i >= 3 ? 1 : 0) + (t.i >= 6 ? 1 : 0);
  for (let k = 0; k < stems; k++) {
    const x = W - 42 + k * 11, top = H - 190 + k * 12;
    s += `<path d="M${x} ${H}V${top}" stroke="#3A9E6F" stroke-width="4" fill="none" opacity=".7"/>`;
    let nd = '';
    for (let y = H - 18; y > top + 10; y -= 28) nd += `M${x - 3} ${y}h6`;
    s += `<path d="${nd}" stroke="#1F6B42" stroke-width="1.4" fill="none" opacity=".7"/>`;
    s += `<path d="M${x} ${top + 18}q-18-4-24-16M${x} ${top + 40}q18-4 24-16M${x} ${top + 66}q-16-3-22-14" stroke="#3A9E6F" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".65"/>`;
  }
  return s;
}

// Tranh nền: bán trong suốt, tự đậm dần ở góc/đáy và thoáng ở giữa (mặt nạ elip) để không cản chữ.
function backdrop(tier, W, H) {
  const t = tier && Number.isInteger(tier.i) ? tier : byRealm(tier && tier.i) || TIERS[0];
  const defs = `<defs><radialGradient id="${P}fade" gradientUnits="userSpaceOnUse" cx="${W * 0.58}" cy="${H * 0.46}" r="${W * 0.5}" gradientTransform="translate(${W * 0.58} ${H * 0.46}) scale(1 0.62) translate(${-W * 0.58} ${-H * 0.46})"><stop offset="0" stop-color="#000"/><stop offset=".55" stop-color="#333"/><stop offset="1" stop-color="#fff"/></radialGradient>`
    + `<mask id="${P}mask" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#${P}fade)"/></mask>`
    + `<linearGradient id="${P}glow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe3f0" stop-opacity="0"/><stop offset="1" stop-color="#bfe3f0" stop-opacity=".22"/></linearGradient></defs>`;
  return `${defs}<g mask="url(#${P}mask)"><rect width="${W}" height="${H}" fill="url(#${P}glow)"/>${thap(t)}${trang(W, t)}${ho(H, t)}${dinh(W, H, t)}</g>`;
}

module.exports = { backdrop };
