// ===== hoso/frame/kiemhiep/border.js — VIỀN + góc nút thắt dải lụa + đồng tiền, phong cách KIẾM HIỆP =====
// Tự chứa. frameBorder(tier, W, H): toạ độ thẻ, không lấn quá 22px vào trong. Viền phụ bậc thang gãy 45 độ như nét bút lông; góc = nút thắt dải lụa (ô 44x44).
// Giữa cạnh trên (28px) để trống cho đỉnh. gem(cx, cy, r, color, dark) = đồng tiền (tròn, lỗ vuông).
const RB = ['#ff6b6b', '#ffd93d', '#6bffb8', '#6bb8ff', '#d96bff'];
const f = (n) => Number(n.toFixed(2));
const mix = (a, b, t) => {
  const ch = (h, i) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  return `#${[0, 1, 2].map((i) => Math.round(ch(a, i) * (1 - t) + ch(b, i) * t).toString(16).padStart(2, '0')).join('')}`;
};
const stopsOf = (cs) => cs.map((c, i) => `<stop offset="${(i / Math.max(1, cs.length - 1)).toFixed(3)}" stop-color="${c}"/>`).join('');

// Đồng tiền: đĩa tròn + lỗ vuông.
function gem(cx, cy, r, color, dark) {
  const h = r * 0.38;
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="${dark}" stroke-width="1.6"/><rect x="${f(cx - h)}" y="${f(cy - h)}" width="${f(h * 2)}" height="${f(h * 2)}" fill="${dark}"/>`;
}

// Đường bậc thang: từ (x0,y0) theo (dx,dy) dài len, cứ 44px có 1 bậc thụt vào trong (nx,ny) sâu 4px bằng nét xiên 45 độ.
function stairs(x0, y0, dx, dy, len, nx, ny) {
  let d = `M${f(x0)} ${f(y0)}`;
  let t = 0;
  const px = (s, o) => `${f(x0 + dx * s + nx * o)} ${f(y0 + dy * s + ny * o)}`;
  while (t + 44 <= len) {
    d += ` L${px(t + 20, 0)} L${px(t + 24, 4)} L${px(t + 40, 4)} L${px(t + 44, 0)}`;
    t += 44;
  }
  return d + ` L${px(len, 0)}`;
}

function frameBorder(tier, W, H) {
  const id = 'kiemhiep-border-';
  const dark = tier.dark;
  const grad = tier.rainbow ? stopsOf([...RB, RB[0]]) : stopsOf([tier.light, tier.main, mix(tier.main, dark, 0.35), tier.main, tier.light, tier.main]);
  const defs =
    `<defs><linearGradient id="${id}outer" x1="0" y1="0" x2="1" y2="1">${grad}</linearGradient>` +
    `<filter id="${id}glow" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="7"/></filter>` +
    `<clipPath id="${id}clip"><rect x="0" y="0" width="${W}" height="${H}" rx="26"/></clipPath></defs>`;
  const st = `fill="none" stroke="url(#${id}outer)" stroke-width="${tier.double ? 2.4 : 1.6}" stroke-opacity="0.85" stroke-linejoin="miter"`;
  const C = 44;
  const half = (W - 2 * C - 28) / 2;
  const wave =
    `<path d="${stairs(C, 14, 1, 0, half, 0, 1)}" ${st}/>` +
    `<path d="${stairs(W - C, 14, -1, 0, half, 0, 1)}" ${st}/>` +
    `<path d="${stairs(C, H - 14, 1, 0, W - 2 * C, 0, -1)}" ${st}/>` +
    `<path d="${stairs(14, C, 0, 1, H - 2 * C, 1, 0)}" ${st}/>` +
    `<path d="${stairs(W - 14, C, 0, 1, H - 2 * C, -1, 0)}" ${st}/>`;
  const third = tier.double ? `<rect x="20" y="20" width="${W - 40}" height="${H - 40}" rx="4" fill="none" stroke="url(#${id}outer)" stroke-opacity="0.4" stroke-width="1"/>` : '';

  // Nút thắt dải lụa góc trên-trái: 2 cánh nơ + nút giữa + 2 đuôi; lớp thứ 2 (bậc kép) thêm lưỡi kiếm chéo.
  const rib = `fill="${tier.accent}" stroke="${dark}" stroke-width="1" stroke-linejoin="round"`;
  const corner =
    (tier.double ? `<path d="M10 10 L40 40" stroke="url(#${id}outer)" stroke-width="3" stroke-linecap="round"/><path d="M10 10 L40 40" stroke="${tier.light}" stroke-width="1" stroke-linecap="round"/>` : '') +
    `<path d="M17 17 L38 12 L33 25 Z" ${rib}/><path d="M17 17 L12 38 L25 33 Z" ${rib}/>` +
    `<path d="M20 20 L36 32 L32 38 Z" ${rib} fill-opacity="0.8"/>` +
    `<rect x="13.5" y="13.5" width="7" height="7" transform="rotate(45 17 17)" fill="url(#${id}outer)" stroke="${dark}" stroke-width="1"/>`;
  const cg = (tx, ty, sx, sy) => `<g transform="translate(${tx} ${ty}) scale(${sx} ${sy})">${corner}</g>`;
  const corners = cg(0, 0, 1, 1) + cg(W, 0, -1, 1) + cg(0, H, 1, -1) + cg(W, H, -1, -1);

  const gc = tier.rainbow ? RB : Array(5).fill(tier.light);
  const gems = gem(W / 2 - 80, 7, 4, gc[0], dark) + gem(W / 2 + 80, 7, 4, gc[1], dark) + gem(W / 2, H - 7, 5, gc[4], dark);

  // Nửa bậc + (VÀNG II, cấp 25): +1 vạch sáng lớp 3 (mờ) + mỗi góc 2 vết kiếm khí chéo (1 sáng, 1 mờ) nằm trong 40px góc (không lấn quá 22px theo mỗi trục ngoài góc).
  let plus = '';
  if (tier.step === 1 && tier.name === 'VÀNG' && !tier.star) {
    const slash = `<path d="M10 10 L40 40" stroke="${tier.light}" stroke-width="1.2" stroke-linecap="round"/><path d="M8 22 L26 40" stroke="${tier.light}" stroke-opacity="0.5" stroke-width="1" stroke-linecap="round"/>`;
    const cp = (tx, ty, sx, sy) => `<g transform="translate(${tx} ${ty}) scale(${sx} ${sy})">${slash}</g>`;
    plus = `<rect x="20" y="20" width="${W - 40}" height="${H - 40}" rx="4" fill="none" stroke="${tier.light}" stroke-opacity="0.3" stroke-width="1"/>` + cp(0, 0, 1, 1) + cp(W, 0, -1, 1) + cp(0, H, 1, -1) + cp(W, H, -1, -1);
  }
  // 5D (cấp 40+, tên KIM CƯƠNG; cấp 45 thừa hưởng): lớp viền thứ TƯ mảnh (inset 24) + 2 quầng ngoài mép thẻ (x=-1.5 / -4) + 4 đồng tiền nhỏ NHÔ RA ngoài góc thẻ (tâm -3,-3, r 5 → ra 8px)
  if (tier.name === 'KIM CƯƠNG') {
    plus +=
      `<rect x="24" y="24" width="${W - 48}" height="${H - 48}" rx="4" fill="none" stroke="${tier.light}" stroke-opacity="0.55" stroke-width="0.8"/>` +
      `<rect x="-1.5" y="-1.5" width="${W + 3}" height="${H + 3}" rx="27" fill="none" stroke="url(#${id}outer)" stroke-opacity="0.5" stroke-width="1.6"/>` +
      `<rect x="-4" y="-4" width="${W + 8}" height="${H + 8}" rx="29" fill="none" stroke="${tier.main}" stroke-opacity="0.22" stroke-width="5"/>` +
      [[-3, -3], [W + 3, -3], [-3, H + 3], [W + 3, H + 3]].map(([x, y]) => gem(x, y, 5, tier.accent || tier.light, dark)).join('');
  }
  // 5D (cấp 50+, tên HUYỀN THOẠI): lớp viền thứ TƯ cầu vồng (inset 24) + 2 quầng cầu vồng ngoài mép thẻ (x=-1.5 / -4) + 4 đồng tiền cầu vồng lớn hơn NHÔ RA ngoài góc thẻ 10px (tâm -4,-4, r 6)
  if (tier.name === 'HUYỀN THOẠI') {
    plus +=
      `<rect x="24" y="24" width="${W - 48}" height="${H - 48}" rx="4" fill="none" stroke="url(#${id}outer)" stroke-opacity="0.8" stroke-width="0.9"/>` +
      `<rect x="-1.5" y="-1.5" width="${W + 3}" height="${H + 3}" rx="27" fill="none" stroke="url(#${id}outer)" stroke-opacity="0.6" stroke-width="1.8"/>` +
      `<rect x="-4" y="-4" width="${W + 8}" height="${H + 8}" rx="29" fill="none" stroke="url(#${id}outer)" stroke-opacity="0.22" stroke-width="5"/>` +
      gem(-4, -4, 6, gc[0], dark) + gem(W + 4, -4, 6, gc[1], dark) + gem(-4, H + 4, 6, gc[2], dark) + gem(W + 4, H + 4, 6, gc[3], dark);
  }
  // HUYỀN THOẠI ★1+ (cấp 55+, tier.star >= 1): 4 TIA KIẾM QUANG (sao 4 cánh dẹt: cánh ngang dài 11, cánh dọc 6 — như vệt sáng lưỡi kiếm, khác sao đều của phong cách khác) ở 4 góc TRÊN viền chính tại x=58 / W-58, y=4 / H-4 (≤ 10px vào trong; x=58 né nút thắt lụa góc dài tới x≈40) + quầng mờ + lõi trắng = 3 phần tử/tia (+12); vẽ SAU cùng; từ ★5 (cấp 75+) đổi trắng-vàng; cộng dồn tới TỐI THƯỢNG
  let stars = '';
  if (tier.star >= 1) {
    const sacc = tier.star >= 5 ? '#fff3c4' : (tier.accent || tier.light);
    const gl = (x, y) => `M${f(x - 11)} ${y} Q${f(x - 1.5)} ${f(y - 1.2)} ${x} ${f(y - 6)} Q${f(x + 1.5)} ${f(y - 1.2)} ${f(x + 11)} ${y} Q${f(x + 1.5)} ${f(y + 1.2)} ${x} ${f(y + 6)} Q${f(x - 1.5)} ${f(y + 1.2)} ${f(x - 11)} ${y} Z`;
    for (const [x, y] of [[58, 4], [W - 58, 4], [58, H - 4], [W - 58, H - 4]]) {
      stars += `<ellipse cx="${x}" cy="${y}" rx="9" ry="5" fill="${sacc}" fill-opacity="0.28"/><path d="${gl(x, y)}" fill="${sacc}" stroke="${dark}" stroke-width="0.9" stroke-linejoin="round"/><circle cx="${x}" cy="${y}" r="1.5" fill="#ffffff"/>`;
    }
  }
  // HUYỀN THOẠI ★5+ (cấp 75+, tier.star >= 5): vạch KÉP sáng trắng-vàng bên trong viền (inset 21.6 và 22.8, nét 0.9, mờ 1/0.7; vẽ TRƯỚC góc nút thắt để lụa đè lên) = +2 phần tử; cộng dồn tới TỐI THƯỢNG
  let dbl = '';
  if (tier.star >= 5) {
    dbl = `<rect x="21.6" y="21.6" width="${W - 43.2}" height="${H - 43.2}" rx="4" fill="none" stroke="#fff3c4" stroke-width="0.9"/><rect x="22.8" y="22.8" width="${W - 45.6}" height="${H - 45.6}" rx="4" fill="none" stroke="#fff3c4" stroke-opacity="0.7" stroke-width="0.9"/>`;
  }
  // HUYỀN THOẠI ★9+ (cấp 95+, tier.star >= 9): NÂNG CẤP nút ngọc giữa mỗi góc (tâm (17,17)): quầng mờ trắng-vàng r=8.5 + ngọc thoi lớn (nửa đường chéo 6.5 → 10.5..23.5) hồng #ff9ecb viền trắng-vàng + điểm sáng = 3 phần tử/góc (+12); vẽ SAU góc cũ
  let gems9 = '';
  if (tier.star >= 9) {
    const g9 = `<circle cx="17" cy="17" r="8.5" fill="#fff3c4" fill-opacity="0.3"/><path d="M17 10.5 L23.5 17 L17 23.5 L10.5 17 Z" fill="#ff9ecb" stroke="#fff3c4" stroke-width="1.4" stroke-linejoin="round"/><circle cx="15" cy="14.8" r="1.8" fill="#ffffff" fill-opacity="0.85"/>`;
    const c9 = (tx, ty, sx, sy) => `<g transform="translate(${tx} ${ty}) scale(${sx} ${sy})">${g9}</g>`;
    gems9 = c9(0, 0, 1, 1) + c9(W, 0, -1, 1) + c9(0, H, 1, -1) + c9(W, H, -1, -1);
  }
  // TỐI THƯỢNG (cấp 100, tier.max): hào quang trắng-vàng bao khung NGOÀI mép thẻ: 3 nét chồng quanh x=-2.5 (rộng 14/7/2.2, mờ 0.12/0.28/0.9; ra ngoài ≤ 9.5px) = +3 phần tử; cộng sau mọi lớp ★1–★9
  if (tier.max) {
    const hr = `x="-2.5" y="-2.5" width="${W + 5}" height="${H + 5}" rx="26.5" fill="none"`;
    plus += `<rect ${hr} stroke="#fff3c4" stroke-opacity="0.12" stroke-width="14"/><rect ${hr} stroke="#ffe9a6" stroke-opacity="0.28" stroke-width="7"/><rect ${hr} stroke="#fffbe8" stroke-opacity="0.9" stroke-width="2.2"/>`;
  }
  return (
    defs +
    `<g clip-path="url(#${id}clip)"><rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="23" fill="none" stroke="${tier.main}" stroke-opacity="0.7" stroke-width="12" filter="url(#${id}glow)"/></g>` +
    `<rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="23" fill="none" stroke="url(#${id}outer)" stroke-width="8"/>` +
    `<rect x="9.5" y="9.5" width="${W - 19}" height="${H - 19}" rx="19" fill="none" stroke="#ffffff" stroke-opacity="0.2" stroke-width="1"/>` +
    wave + third + dbl + corners + gems9 + gems + plus + stars
  );
}

module.exports = { frameBorder, gem };
