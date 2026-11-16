// ===== hoso/frame/congnghe/avatar.js — KHUNG AVATAR phong cách CÔNG NGHỆ (6 bậc theo cấp) =====
// Tự chứa. avatarFrame(tier, R) -> SVG, gốc ở TÂM ảnh, ảnh tròn bán kính R (mặc định 70), y xuống. Chỉ vẽ khung (không vẽ ảnh, không vẽ đĩa nền).
// Dáng riêng: KHUNG BÁT GIÁC vát góc (ngoài) ôm lỗ tròn (trong) như chip/ốp kim loại + chân mạch + đèn LED. Khác hẳn vành tròn của các phong cách khác.
// Giới hạn: vào ảnh r>=64; ngoài r<=84 chỉ nửa phải + nửa dưới, trên/trái r<=80 (đỉnh bát giác r=80).
// ĐỒNG: bát giác + 8 đinh + 4 chân mạch · BẠC: +LED + thanh dữ liệu · VÀNG: +đường mạch vát · BẠCH KIM: +chip đỉnh, radar · KIM CƯƠNG: +chân mạch phụ · HUYỀN THOẠI: cầu vồng + LED.
const ORDER = ['ĐỒNG', 'BẠC', 'VÀNG', 'BẠCH KIM', 'KIM CƯƠNG', 'HUYỀN THOẠI'];
const P = 'congnghe-avatar-';
const f = (n) => Number(n.toFixed(2));
const pt = (r, deg) => { const a = (deg * Math.PI) / 180; return [f(r * Math.cos(a)), f(r * Math.sin(a))]; };
const octPath = (r) => { let d = ''; for (let k = 0; k < 8; k++) { const [x, y] = pt(r, 22.5 + k * 45); d += `${k ? 'L' : 'M'}${x} ${y} `; } return `${d}Z`; };

function avatarFrame(tier, R = 70) {
  const idx = Math.max(0, ORDER.indexOf(tier.name));
  const rb = Boolean(tier.rainbow);
  const acc = tier.star >= 5 ? '#fff3c4' : (tier.accent || tier.light); // ★5+ (cấp 75+): LED/đinh nhấn đổi sang trắng-vàng
  const gold = '#fff3c4';
  const defs =
    `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${tier.light}"/><stop offset="0.5" stop-color="${tier.main}"/><stop offset="1" stop-color="${tier.dark}"/></linearGradient>` +
    `<linearGradient id="${P}rb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6b6b"/><stop offset="0.25" stop-color="#ffd93d"/><stop offset="0.5" stop-color="#6bffb8"/><stop offset="0.75" stop-color="#6bb8ff"/><stop offset="1" stop-color="#d96bff"/></linearGradient></defs>`;
  const fillG = rb ? `url(#${P}rb)` : `url(#${P}g)`;
  const line = rb ? `url(#${P}rb)` : tier.light;
  let s = '';
  // 1) thân bát giác r=80 khoét lỗ tròn r=70 (even-odd) + viền tối
  s += `<path fill-rule="evenodd" d="${octPath(80)} M-70 0 A70 70 0 1 0 70 0 A70 70 0 1 0 -70 0 Z" fill="${fillG}" stroke="${tier.dark}" stroke-width="1.3" stroke-linejoin="miter"/>`;
  // 2) rãnh bát giác mảnh bên trong thân
  s += `<path d="${octPath(76)}" fill="none" stroke="${tier.dark}" stroke-width="0.9" stroke-opacity="0.75"/>`;
  s += `<path d="${octPath(74.6)}" fill="none" stroke="${line}" stroke-width="0.7" stroke-opacity="0.9"/>`;
  // 3) 8 đinh vuông ở 8 đỉnh
  for (let k = 0; k < 8; k++) { const [x, y] = pt(77.2, 22.5 + k * 45); s += `<rect x="${f(x - 2.3)}" y="${f(y - 2.3)}" width="4.6" height="4.6" fill="${acc}" stroke="${tier.dark}" stroke-width="0.9" transform="rotate(45 ${x} ${y})"/>`; }
  // 4) chân mạch thò ra ngoài (nửa phải + nửa dưới): đoạn thẳng + đầu tròn rỗng, số lượng theo bậc
  const pads = idx >= 4 ? [-22.5, 22.5, 67.5, 112.5, 157.5] : idx >= 1 ? [22.5, 67.5, 112.5] : [22.5, 112.5];
  for (const d of pads) { const [x1, y1] = pt(80, d), [x2, y2] = pt(83, d); s += `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${tier.dark}" stroke-width="2.4" stroke-linecap="round"/><path d="M${x1} ${y1} L${x2} ${y2}" stroke="${line}" stroke-width="1.1" stroke-linecap="round"/>`; }
  // 5) BẠC+: đèn LED trên 4 cạnh (giữa các cạnh bát giác) phát sáng
  if (idx >= 1) for (const d of [0, 90, 180, 270]) { const [x, y] = pt(72.4, d); s += `<circle cx="${x}" cy="${y}" r="2.7" fill="${acc}" stroke="${tier.dark}" stroke-width="0.9"/><circle cx="${x}" cy="${y}" r="1" fill="#fff" fill-opacity="0.85"/>`; }
  // 6) BẠC+: thanh dữ liệu 3 vạch ở cạnh dưới-phải (r<=84)
  if (idx >= 1) for (let i = 0; i < 3; i++) { const [x, y] = pt(74.5, 40 + i * 7); s += `<rect x="${f(x - 1.1)}" y="${f(y - 1 - i * 0.9)}" width="2.2" height="${f(2 + i * 1.8)}" fill="${acc}" stroke="${tier.dark}" stroke-width="0.5"/>`; }
  // 7) VÀNG+: đường mạch vát 45° từ đỉnh vào trong vành (r 66..80)
  if (idx >= 2) { let t = ''; for (const d of [157.5, 202.5, 247.5, 292.5]) { const [x1, y1] = pt(80, d), [x2, y2] = pt(74, d), [x3, y3] = pt(66.5, d + 9); t += `M${x1} ${y1} L${x2} ${y2} L${x3} ${y3} `; } s += `<path d="${t}" fill="none" stroke="${tier.dark}" stroke-width="1.1" stroke-linejoin="round"/><path d="${t}" fill="none" stroke="${line}" stroke-width="0.5" stroke-linejoin="round"/>`; }
  // 8) BẠCH KIM+: chip chữ nhật ở đỉnh + cung radar đứt nét vào trong ảnh
  if (idx >= 3) {
    s += `<rect x="-10" y="-80.5" width="20" height="9" rx="1.5" fill="${acc}" stroke="${tier.dark}" stroke-width="1.1"/><rect x="-5" y="-78" width="10" height="4" fill="${tier.dark}" fill-opacity="0.8"/>`;
    s += `<path d="M${pt(66, -150)[0]} ${pt(66, -150)[1]} A66 66 0 0 1 ${pt(66, -30)[0]} ${pt(66, -30)[1]}" fill="none" stroke="${line}" stroke-width="0.9" stroke-dasharray="3 2.4" stroke-opacity="0.85"/>`;
  }
  // 10) KIM CƯƠNG II (cấp 45, nửa bậc +): vạch chia mịn r 70.6..73.4 (48 vạch bằng 1 nét đứt) + 4 vạch dài chéo + 4 chân LED ngắn ở giữa cạnh bát giác (r<=80.5, nửa phải/dưới) + cung radar phụ dưới ảnh (+8 phần tử)
  if (tier.step === 1 && tier.name === 'KIM CƯƠNG' && !tier.star) {
    s += `<circle r="72" fill="none" stroke="${line}" stroke-width="2.8" stroke-dasharray="0.7 1.9" stroke-opacity="0.8"/>`;
    let tk = '';
    for (const d of [45, 135, 225, 315]) { const [x1, y1] = pt(70.4, d), [x2, y2] = pt(74.2, d); tk += `M${x1} ${y1} L${x2} ${y2} `; }
    s += `<path d="${tk}" stroke="${tier.dark}" stroke-width="2.2" stroke-linecap="round"/><path d="${tk}" stroke="${acc}" stroke-width="1.1" stroke-linecap="round"/>`;
    let stub = '';
    for (const d of [0, 45, 90, 135]) { const [x1, y1] = pt(73.6, d), [x2, y2] = pt(77, d); stub += `M${x1} ${y1} L${x2} ${y2} `; }
    s += `<path d="${stub}" stroke="${tier.dark}" stroke-width="2.2" stroke-linecap="round"/><path d="${stub}" stroke="${line}" stroke-width="0.9" stroke-linecap="round"/>`;
    for (const d of [0, 45, 90, 135]) { const [x, y] = pt(78.6, d); s += `<circle cx="${x}" cy="${y}" r="1.9" fill="${acc}" stroke="${tier.dark}" stroke-width="0.7"/>`; }
    s += `<path d="M${pt(65, 35)[0]} ${pt(65, 35)[1]} A65 65 0 0 1 ${pt(65, 145)[0]} ${pt(65, 145)[1]}" fill="none" stroke="${acc}" stroke-width="0.9" stroke-dasharray="3 2.4" stroke-opacity="0.75"/>`;
  }
  // 5D (cấp 40+, tên KIM CƯƠNG; cấp 45 thừa hưởng): glow 2 nét bát giác chồng (r=75, nằm trong thân r 70..80) + vạch sáng mảnh r=71 → vành nổi khối hơn (+3 phần tử, mọi nét r ≤ 78.6)
  if (tier.name === 'KIM CƯƠNG') {
    s += `<path d="${octPath(75)}" fill="none" stroke="${acc}" stroke-opacity="0.16" stroke-width="7" stroke-linejoin="miter"/>`;
    s += `<path d="${octPath(75)}" fill="none" stroke="${acc}" stroke-opacity="0.4" stroke-width="3" stroke-linejoin="miter"/>`;
    s += `<path d="${octPath(71.2)}" fill="none" stroke="#ffffff" stroke-opacity="0.55" stroke-width="0.7" stroke-linejoin="miter"/>`;
  }
  // 5D (cấp 50+, tên HUYỀN THOẠI; bậc sao thừa hưởng): glow cầu vồng 2 nét bát giác chồng (r=75, mọi nét r ≤ 78.8) + vạch trắng mảnh r=71.2 → vành nổi khối, rực hơn KIM CƯƠNG (+3 phần tử)
  if (tier.name === 'HUYỀN THOẠI') {
    s += `<path d="${octPath(75)}" fill="none" stroke="url(#${P}rb)" stroke-opacity="0.2" stroke-width="7" stroke-linejoin="miter"/>`;
    s += `<path d="${octPath(75)}" fill="none" stroke="url(#${P}rb)" stroke-opacity="0.65" stroke-width="2.6" stroke-linejoin="miter"/>`;
    s += `<path d="${octPath(71.2)}" fill="none" stroke="#ffffff" stroke-opacity="0.6" stroke-width="0.7" stroke-linejoin="miter"/>`;
  }
  // 9) HUYỀN THOẠI: hạt sáng dọc chân mạch
  if (idx >= 5) for (const d of [-67.5, -22.5, 67.5, 157.5, 202.5]) { const [x, y] = pt(84, d); s += `<circle cx="${x}" cy="${y}" r="1.6" fill="${acc}"/>`; }
  // bán kính mép ngoài bát giác (r=80, đỉnh ở 22.5°+45°k) theo hướng deg
  const rho = (deg) => { let m = ((deg % 45) + 45) % 45; if (m > 22.5) m -= 45; return 73.9 / Math.cos((m * Math.PI) / 180); };
  const cap = (r, deg) => { const a = (deg * Math.PI) / 180; return Math.min(r, Math.cos(a) < 0 || Math.sin(a) < 0 ? 80.5 : 84.2); };
  // HUYỀN THOẠI ★4+ (cấp 70+): viền neon cầu vồng bát giác ôm mép thân (octPath 80.8: nét 1.3 + quầng 3.6 mờ + nét tối đệm = +3 phần tử; đỉnh r=80.8, mọi nét r ≤ 81.5); cộng dồn
  if (tier.star >= 4) {
    s += `<path d="${octPath(80.8)}" fill="none" stroke="${tier.dark}" stroke-opacity="0.4" stroke-width="2.4" stroke-linejoin="miter"/><path d="${octPath(80.8)}" fill="none" stroke="url(#${P}rb)" stroke-opacity="0.22" stroke-width="3.8" stroke-linejoin="miter"/><path d="${octPath(80.8)}" fill="none" stroke="url(#${P}rb)" stroke-width="1.3" stroke-linejoin="miter"/>`;
  }
  // HUYỀN THOẠI ★8+ (cấp 90+): 8 tản nhiệt dạng lược 3 răng ở giữa 8 cạnh bát giác (răng dài 4.2 / 5.6 / 4.2 từ r=73.9, tối đa r ≈ 79.5; 2 path: nền tối + lõi trắng-vàng); cộng dồn
  if (tier.star >= 8) {
    let fin = '';
    for (let k = 0; k < 8; k += 1) {
      const a = (45 * k * Math.PI) / 180, ux = Math.cos(a), uy = Math.sin(a), tx = -uy, ty = ux;
      for (const [o, L] of [[-3.4, 78.1], [0, 79.5], [3.4, 78.1]]) fin += `M${f(73.4 * ux + o * tx)} ${f(73.4 * uy + o * ty)} L${f(L * ux + o * tx)} ${f(L * uy + o * ty)} `;
    }
    s += `<path d="${fin}" fill="none" stroke="${tier.dark}" stroke-width="2.6" stroke-linecap="square"/><path d="${fin}" fill="none" stroke="${gold}" stroke-width="1.2" stroke-linecap="square"/>`;
  }
  // HUYỀN THOẠI ★1+ (cấp 55+): vòng 12 đèn LED vuông ngoài mép bát giác (mỗi 30° từ 15°, cách mép 2.8px, trên/trái r ≤ 80.5, phải/dưới r ≤ 84.2; 3 path nét dài 0: quầng + ô vuông + lõi trắng = +3 phần tử); cộng dồn tới ★10
  if (tier.star >= 1) {
    let dd = '';
    for (let k = 0; k < 12; k += 1) { const d = 15 + 30 * k, [x, y] = pt(cap(rho(d) + 2.8, d), d); dd += `M${x} ${y}h0.01`; }
    s += `<path d="${dd}" fill="none" stroke="${acc}" stroke-opacity="0.3" stroke-width="5" stroke-linecap="round"/><path d="${dd}" fill="none" stroke="${acc}" stroke-width="2.8" stroke-linecap="square"/><path d="${dd}" fill="none" stroke="#ffffff" stroke-width="1.1" stroke-linecap="square"/>`;
  }
  // TỐI THƯỢNG (cấp 100, tier.max): vành kép (bát giác trắng-vàng octPath 78.4 + vành tròn mảnh r=66.2) + 16 tia mỗi 22.5° từ 11.25° (lệch pha với 12 LED ★1 và 8 lược ★8), từ mép thân +0.8 ra tối đa +7 (trên/trái r ≤ 80.5, phải/dưới ≤ 84); vẽ SAU mọi lớp ★1–★9
  if (tier.max) {
    let rd = '';
    for (let k = 0; k < 16; k += 1) { const d = 11.25 + 22.5 * k, [x1, y1] = pt(rho(d) + 0.8, d), [x2, y2] = pt(cap(rho(d) + 7, d), d); rd += `M${x1} ${y1} L${x2} ${y2} `; }
    s += `<path d="${octPath(78.4)}" fill="none" stroke="${tier.dark}" stroke-opacity="0.5" stroke-width="2.4" stroke-linejoin="miter"/><path d="${octPath(78.4)}" fill="none" stroke="${gold}" stroke-width="1.1" stroke-linejoin="miter"/><circle r="66.2" fill="none" stroke="${gold}" stroke-opacity="0.85" stroke-width="1"/>` +
      `<path d="${rd}" fill="none" stroke="${tier.dark}" stroke-width="3" stroke-linecap="round" stroke-opacity="0.55"/><path d="${rd}" fill="none" stroke="${gold}" stroke-width="1.4" stroke-linecap="round"/>`;
  }
  return `${defs}<g transform="scale(${f(R / 70)})">${s}</g>`;
}

module.exports = { avatarFrame };
