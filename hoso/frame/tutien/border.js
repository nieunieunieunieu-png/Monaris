// ===== hoso/frame/tutien/border.js — VIỀN + góc sen + ngọc, phong cách TU TIÊN =====
// Tự chứa. frameBorder(tier, W, H): toạ độ thẻ (0..W, 0..H), không lấn quá 22px vào trong. Viền phụ gợn sóng mây; góc = đoá sen (ô 44x44).
// Giữa cạnh trên (28px) để trống cho đỉnh hồ sơ. gem(cx, cy, r, color, dark) = hạt ngọc tròn.
const RB = ['#ff6b6b', '#ffd93d', '#6bffb8', '#6bb8ff', '#d96bff'];
const f = (n) => Number(n.toFixed(2));
const mix = (a, b, t) => {
  const ch = (h, i) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  return `#${[0, 1, 2].map((i) => Math.round(ch(a, i) * (1 - t) + ch(b, i) * t).toString(16).padStart(2, '0')).join('')}`;
};
const stopsOf = (cs) => cs.map((c, i) => `<stop offset="${(i / Math.max(1, cs.length - 1)).toFixed(3)}" stop-color="${c}"/>`).join('');

// Hạt ngọc tròn có điểm sáng.
function gem(cx, cy, r, color, dark) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="${dark}" stroke-width="1.6"/><circle cx="${f(cx - r * 0.3)}" cy="${f(cy - r * 0.3)}" r="${f(r * 0.35)}" fill="#ffffff" fill-opacity="0.8"/>`;
}
function leaf(px, py, ang, len, wid, style) {
  const d = `M0 0 C${f(len * 0.25)} ${f(-wid)} ${f(len * 0.75)} ${f(-wid * 0.9)} ${len} 0 C${f(len * 0.75)} ${f(wid * 0.9)} ${f(len * 0.25)} ${f(wid)} 0 0 Z`;
  return `<path transform="translate(${px} ${py}) rotate(${ang})" d="${d}" ${style}/>`;
}

// Đoạn viền gợn sóng: n cung cùng chiều từ (x0,y0) theo hướng (dx,dy), tổng dài len, cung phồng vào trong (sweep).
function scallop(x0, y0, dx, dy, len, sweep) {
  const n = Math.max(1, Math.round(len / 26));
  const s = len / n;
  const r = s / 2;
  let d = `M${f(x0)} ${f(y0)}`;
  // Cạnh ngang: rx=r, ry=5 (phồng 5px). Cạnh dọc: đổi chỗ (rx=5, ry=r), nếu không SVG tự phóng elip và cung phồng ~34px vào trong.
  const rx = dx !== 0 ? r : 5;
  const ry = dx !== 0 ? 5 : r;
  for (let i = 1; i <= n; i++) d += ` A${f(rx)} ${f(ry)} 0 0 ${sweep} ${f(x0 + dx * s * i)} ${f(y0 + dy * s * i)}`;
  return d;
}

function frameBorder(tier, W, H) {
  const id = 'tutien-border-';
  const dark = tier.dark;
  const grad = tier.rainbow ? stopsOf([...RB, RB[0]]) : stopsOf([tier.light, tier.main, mix(tier.main, dark, 0.35), tier.main, tier.light, tier.main]);
  const defs =
    `<defs><linearGradient id="${id}outer" x1="0" y1="0" x2="1" y2="1">${grad}</linearGradient>` +
    `<filter id="${id}glow" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="7"/></filter>` +
    `<clipPath id="${id}clip"><rect x="0" y="0" width="${W}" height="${H}" rx="26"/></clipPath></defs>`;
  const stroke = `fill="none" stroke="url(#${id}outer)" stroke-linecap="round"`;
  const sw = tier.double ? 2.2 : 1.5;
  const C = 44; // chừa góc cho đoá sen
  const half = (W - 2 * C - 28) / 2; // hai đoạn cạnh trên, chừa 28px giữa
  const wave =
    `<path d="${scallop(C, 14, 1, 0, half, 0)}" ${stroke} stroke-width="${sw}" stroke-opacity="0.85"/>` +
    `<path d="${scallop(W - C, 14, -1, 0, half, 1)}" ${stroke} stroke-width="${sw}" stroke-opacity="0.85"/>` +
    `<path d="${scallop(C, H - 14, 1, 0, W - 2 * C, 1)}" ${stroke} stroke-width="${sw}" stroke-opacity="0.85"/>` +
    `<path d="${scallop(14, C, 0, 1, H - 2 * C, 1)}" ${stroke} stroke-width="${sw}" stroke-opacity="0.85"/>` +
    `<path d="${scallop(W - 14, C, 0, 1, H - 2 * C, 0)}" ${stroke} stroke-width="${sw}" stroke-opacity="0.85"/>`;
  const third = tier.double ? `<rect x="20" y="20" width="${W - 40}" height="${H - 40}" rx="10" fill="none" stroke="url(#${id}outer)" stroke-opacity="0.4" stroke-width="1"/>` : '';

  // Đoá sen góc trên-trái (ô 44x44), xoay/lật cho 3 góc còn lại. Hai bậc trên thêm lớp cánh dài + xoáy mây.
  const petal = `fill="url(#${id}outer)" stroke="${dark}" stroke-width="1.1" stroke-linejoin="round"`;
  const corner =
    leaf(15, 15, 0, 26, 4.6, petal) + leaf(15, 15, 90, 26, 4.6, petal) + leaf(15, 15, 45, 30, 5.4, petal) +
    leaf(15, 15, 22, 20, 3.6, petal) + leaf(15, 15, 68, 20, 3.6, petal) +
    (tier.double ? `<path d="M30 38 C36 36 40 30 38 25 C36 22 32 24 34 27" fill="none" stroke="${tier.light}" stroke-width="1.5" stroke-linecap="round"/><path d="M38 30 C40 36 36 40 30 40" fill="none" stroke="${tier.light}" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.6"/>` : '');
  const cg = (tx, ty, sx, sy) => `<g transform="translate(${tx} ${ty}) scale(${sx} ${sy})">${corner}</g>`;
  const corners = cg(0, 0, 1, 1) + cg(W, 0, -1, 1) + cg(0, H, 1, -1) + cg(W, H, -1, -1);

  const gc = tier.rainbow ? RB : Array(5).fill(tier.accent);
  const gems =
    gem(14, 14, 6, gc[0], dark) + gem(W - 14, 14, 6, gc[1], dark) + gem(14, H - 14, 6, gc[2], dark) + gem(W - 14, H - 14, 6, gc[3], dark) +
    gem(W / 2, H - 6, 4.5, gc[4], dark);

  // Nửa bậc + (BẠC II, cấp 15): +1 vạch sáng mảnh lớp thứ 3 (mờ) + 4 ngọc nhỏ ở x=60 / W-60 trên và dưới (≤ 22px vào trong).
  let plus = '';
  if (tier.step === 1 && tier.name === 'BẠC' && !tier.star) {
    plus = `<rect x="20" y="20" width="${W - 40}" height="${H - 40}" rx="10" fill="none" stroke="${tier.light}" stroke-opacity="0.3" stroke-width="1"/>` +
      [60, W - 60].map((x) => gem(x, 6, 3, tier.accent, dark) + gem(x, H - 6, 3, tier.accent, dark)).join('');
  }
  // 5D (cấp 40+, tên KIM CƯƠNG; cấp 45 thừa hưởng): lớp viền thứ TƯ mảnh (inset 24) + 2 quầng ngoài mép thẻ (x=-1.5 / -4) + 4 hạt ngọc tròn NHÔ RA ngoài góc thẻ (tâm -3,-3, r 4.5 → ra 7.5px)
  if (tier.name === 'KIM CƯƠNG') {
    plus +=
      `<rect x="24" y="24" width="${W - 48}" height="${H - 48}" rx="7" fill="none" stroke="${tier.light}" stroke-opacity="0.55" stroke-width="0.8"/>` +
      `<rect x="-1.5" y="-1.5" width="${W + 3}" height="${H + 3}" rx="27" fill="none" stroke="url(#${id}outer)" stroke-opacity="0.5" stroke-width="1.6"/>` +
      `<rect x="-4" y="-4" width="${W + 8}" height="${H + 8}" rx="29" fill="none" stroke="${tier.main}" stroke-opacity="0.22" stroke-width="5"/>` +
      [[-3, -3], [W + 3, -3], [-3, H + 3], [W + 3, H + 3]].map(([x, y]) => gem(x, y, 4.5, tier.accent || tier.light, dark)).join('');
  }
  // 5D (cấp 50+, tên HUYỀN THOẠI): lớp viền thứ TƯ cầu vồng (inset 24) + 2 quầng cầu vồng ngoài mép thẻ (x=-1.5 / -4) + 4 hạt ngọc cầu vồng lớn hơn NHÔ RA ngoài góc thẻ 9px (tâm -4,-4, r 5)
  if (tier.name === 'HUYỀN THOẠI') {
    plus +=
      `<rect x="24" y="24" width="${W - 48}" height="${H - 48}" rx="7" fill="none" stroke="url(#${id}outer)" stroke-opacity="0.8" stroke-width="0.9"/>` +
      `<rect x="-1.5" y="-1.5" width="${W + 3}" height="${H + 3}" rx="27" fill="none" stroke="url(#${id}outer)" stroke-opacity="0.6" stroke-width="1.8"/>` +
      `<rect x="-4" y="-4" width="${W + 8}" height="${H + 8}" rx="29" fill="none" stroke="url(#${id}outer)" stroke-opacity="0.22" stroke-width="5"/>` +
      gem(-4, -4, 5, gc[0], dark) + gem(W + 4, -4, 5, gc[1], dark) + gem(-4, H + 4, 5, gc[2], dark) + gem(W + 4, H + 4, 5, gc[3], dark);
  }
  // HUYỀN THOẠI ★1+ (cấp 55+, tier.star >= 1): 4 sao 4 cánh nhỏ ở 4 góc TRÊN viền chính tại x=58 / W-58, y=4 / H-4 (cánh 9, ≤ 13px vào trong; x=58 để né lá sen góc dài tới x≈45) + quầng mờ + lõi trắng = 3 phần tử/sao (+12); vẽ SAU cùng; từ ★5 (cấp 75+) sao đổi sang trắng-vàng; cộng dồn tới ★10
  let stars = '';
  if (tier.star >= 1) {
    const sacc = tier.star >= 5 ? '#fff3c4' : (tier.accent || tier.light);
    const r = 9, k = f(r * 0.22);
    const st = (x, y) => `M${x} ${y - r} Q${f(x + k)} ${f(y - k)} ${x + r} ${y} Q${f(x + k)} ${f(y + k)} ${x} ${y + r} Q${f(x - k)} ${f(y + k)} ${x - r} ${y} Q${f(x - k)} ${f(y - k)} ${x} ${y - r} Z`;
    for (const [x, y] of [[58, 4], [W - 58, 4], [58, H - 4], [W - 58, H - 4]]) {
      stars += `<circle cx="${x}" cy="${y}" r="6.2" fill="${sacc}" fill-opacity="0.28"/><path d="${st(x, y)}" fill="${sacc}" stroke="${dark}" stroke-width="0.9" stroke-linejoin="round"/><circle cx="${x}" cy="${y}" r="1.5" fill="#ffffff"/>`;
    }
  }
  // HUYỀN THOẠI ★5+ (cấp 75+, tier.star >= 5): vạch KÉP sáng trắng-vàng bên trong viền (inset 21.5 và 23, nét 1, mờ 1/0.75; vẽ TRƯỚC góc sen để lá sen đè lên) = +2 phần tử; cộng dồn tới ★10
  let dbl = '';
  if (tier.star >= 5) {
    dbl = `<rect x="21.5" y="21.5" width="${W - 43}" height="${H - 43}" rx="8.5" fill="none" stroke="#fff3c4" stroke-opacity="1" stroke-width="1"/>` +
      `<rect x="23" y="23" width="${W - 46}" height="${H - 46}" rx="7" fill="none" stroke="#fff3c4" stroke-opacity="0.75" stroke-width="1"/>`;
  }
  // HUYỀN THOẠI ★9+ (cấp 95+, tier.star >= 9): NÂNG CẤP ngọc tròn ở 4 góc (tâm (14,14) / (W-14,14) / (14,H-14) / (W-14,H-14)) thay vì thêm ngọc mới (tránh đè lá sen): quầng mờ trắng-vàng r=8 + ngọc lớn r=7.5 (cùng màu ngọc cũ, viền trắng-vàng) + điểm sáng = 3 phần tử/góc (+12); mép trong ≤ 21.5px; vẽ SAU ngọc cũ; cộng dồn tới ★10
  let gems9 = '';
  if (tier.star >= 9) {
    [[14, 14, gc[0]], [W - 14, 14, gc[1]], [14, H - 14, gc[2]], [W - 14, H - 14, gc[3]]].forEach(([cx, cy, c]) => {
      gems9 += `<circle cx="${cx}" cy="${cy}" r="8" fill="#fff3c4" fill-opacity="0.3"/><circle cx="${cx}" cy="${cy}" r="7.5" fill="${c}" stroke="#fff3c4" stroke-width="1.6"/><circle cx="${f(cx - 2.3)}" cy="${f(cy - 2.3)}" r="2.2" fill="#ffffff" fill-opacity="0.85"/>`;
    });
  }
  // TỐI THƯỢNG (cấp 100, tier.max): hào quang trắng-vàng bao khung, nằm NGOÀI mép thẻ trong vùng đệm viền: 3 nét chồng quanh hình chữ nhật bo x=-2.5 (rộng 14/7/2.2, mờ 0.12/0.28/0.9; ra ngoài tối đa 9.5px) = +3 phần tử; cộng sau mọi lớp ★1–★9
  if (tier.max) {
    const hr = `x="-2.5" y="-2.5" width="${W + 5}" height="${H + 5}" rx="26.5" fill="none"`;
    plus += `<rect ${hr} stroke="#fff3c4" stroke-opacity="0.12" stroke-width="14"/><rect ${hr} stroke="#ffe9a6" stroke-opacity="0.28" stroke-width="7"/><rect ${hr} stroke="#fffbe8" stroke-opacity="0.9" stroke-width="2.2"/>`;
  }
  return (
    defs +
    `<g clip-path="url(#${id}clip)"><rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="23" fill="none" stroke="${tier.main}" stroke-opacity="0.7" stroke-width="12" filter="url(#${id}glow)"/></g>` +
    `<rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="23" fill="none" stroke="url(#${id}outer)" stroke-width="8"/>` +
    `<rect x="9.5" y="9.5" width="${W - 19}" height="${H - 19}" rx="19" fill="none" stroke="#ffffff" stroke-opacity="0.2" stroke-width="1"/>` +
    wave + third + dbl + corners + gems + gems9 + plus + stars
  );
}

module.exports = { frameBorder, gem };
