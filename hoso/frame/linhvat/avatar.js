// ===== hoso/frame/linhvat/avatar.js — KHUNG AVATAR phong cách LINH VẬT (6 bậc theo cấp) =====
// Tự chứa. avatarFrame(tier, R) -> SVG, gốc ở TÂM ảnh, ảnh tròn bán kính R (mặc định 70), y xuống. Chỉ vẽ khung (không vẽ ảnh, không vẽ đĩa nền).
// Dáng riêng: VÒNG CỔ MÈO (vành mảnh có đường chỉ khâu) + HAI TAI MÈO to ở đỉnh + CHUÔNG vàng ở dưới + dấu CHÂN MÈO và TIM bên cạnh.
// Giới hạn: vào ảnh r>=64; ngoài r<=84 chỉ nửa phải + nửa dưới, trên/trái r<=80.
// ĐỒNG: tai + chuông + 1 chân mèo · BẠC: 2 chân mèo · VÀNG: +2 tim · BẠCH KIM: +lõi tai hồng, 3 chân mèo · KIM CƯƠNG: +tim thứ 3 · HUYỀN THOẠI: cầu vồng + lấp lánh.
const ORDER = ['ĐỒNG', 'BẠC', 'VÀNG', 'BẠCH KIM', 'KIM CƯƠNG', 'HUYỀN THOẠI'];
const P = 'linhvat-avatar-';
const f = (n) => Number(n.toFixed(2));
const pt = (r, deg) => { const a = (deg * Math.PI) / 180; return [f(r * Math.cos(a)), f(r * Math.sin(a))]; };
const heart = (x, y, k) => `M${x} ${f(y + 1.9 * k)} C${f(x - 3.2 * k)} ${f(y - 0.7 * k)} ${f(x - 2.4 * k)} ${f(y - 3.2 * k)} ${x} ${f(y - 1.7 * k)} C${f(x + 2.4 * k)} ${f(y - 3.2 * k)} ${f(x + 3.2 * k)} ${f(y - 0.7 * k)} ${x} ${f(y + 1.9 * k)} Z`;

function avatarFrame(tier, R = 70) {
  const idx = Math.max(0, ORDER.indexOf(tier.name));
  const rb = Boolean(tier.rainbow);
  const acc = tier.accent || tier.light;
  const defs =
    `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tier.light}"/><stop offset="0.5" stop-color="${tier.main}"/><stop offset="1" stop-color="${tier.dark}"/></linearGradient>` +
    `<linearGradient id="${P}rb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6b6b"/><stop offset="0.25" stop-color="#ffd93d"/><stop offset="0.5" stop-color="#6bffb8"/><stop offset="0.75" stop-color="#6bb8ff"/><stop offset="1" stop-color="#d96bff"/></linearGradient></defs>`;
  const fillG = rb ? `url(#${P}rb)` : `url(#${P}g)`;
  const pink = idx >= 3 ? '#ffb3d1' : acc;
  let s = '';
  // 1) tai mèo 2 bên đỉnh (vẽ TRƯỚC vành để chân tai chìm vào vành): đáy r 71, đỉnh nghiêng ra ngoài ở r 80 (giới hạn trên r<=80)
  for (const sg of [-1, 1]) {
    const d = -90 + sg * 33; // -128 (trái), -52 (phải)
    const [b1x, b1y] = pt(70.8, d - 6.5), [b2x, b2y] = pt(70.8, d + 6.5), [tx, ty] = pt(80.6, d + sg * 2.2);
    s += `<path d="M${b1x} ${b1y} Q${f((b1x + tx) / 2 + (sg > 0 ? 0 : -1))} ${f((b1y + ty) / 2)} ${tx} ${ty} Q${f((b2x + tx) / 2)} ${f((b2y + ty) / 2)} ${b2x} ${b2y} Z" fill="${fillG}" stroke="${tier.dark}" stroke-width="1.4" stroke-linejoin="round"/>`;
    const [i1x, i1y] = pt(72, d - 3.6), [i2x, i2y] = pt(72, d + 3.6), [itx, ity] = pt(77.4, d + sg * 1.6);
    s += `<path d="M${i1x} ${i1y} L${itx} ${ity} L${i2x} ${i2y} Z" fill="${pink}" fill-opacity="0.92"/>`;
  }
  // 2) vòng cổ r 70..75 + đường chỉ khâu đứt nét
  s += `<path fill-rule="evenodd" d="M-73.6 0 A73.6 73.6 0 1 0 73.6 0 A73.6 73.6 0 1 0 -73.6 0 Z M-70 0 A70 70 0 1 0 70 0 A70 70 0 1 0 -70 0 Z" fill="${fillG}" stroke="${tier.dark}" stroke-width="1.2"/>`;
  s += `<circle r="71.8" fill="none" stroke="${tier.dark}" stroke-width="0.9" stroke-dasharray="2.4 2.2" stroke-opacity="0.8"/>`;
  // 3) chuông ở dưới: móc + thân tròn + khe + chấm
  s += `<path d="M-3.4 75 Q0 71.4 3.4 75" fill="none" stroke="${tier.dark}" stroke-width="1.4"/>`;
  s += `<circle cx="0" cy="79.2" r="5.2" fill="${acc}" stroke="${tier.dark}" stroke-width="1.2"/><path d="M-5 79.4 L5 79.4" stroke="${tier.dark}" stroke-width="1"/><circle cx="0" cy="81.6" r="1.1" fill="${tier.dark}"/><circle cx="-1.7" cy="77.2" r="1" fill="#fff" fill-opacity="0.8"/>`;
  // 4) dấu chân mèo bên phải (góc 10..60°), 1/2/3 cái theo bậc
  const paws = idx >= 3 ? [12, 34, 56] : idx >= 1 ? [20, 45] : [32];
  for (const d of paws) {
    const [x, y] = pt(77.6, d);
    s += `<g transform="translate(${x} ${y}) rotate(${d + 90}) scale(1.2)"><ellipse cx="0" cy="1.1" rx="3" ry="2.5" fill="${acc}" stroke="${tier.dark}" stroke-width="0.8"/>` +
      [[-3.2, -2.2], [-1.1, -3.9], [1.1, -3.9], [3.2, -2.2]].map(([px, py]) => `<ellipse cx="${px}" cy="${py}" rx="1.25" ry="1.55" fill="${acc}" stroke="${tier.dark}" stroke-width="0.7"/>`).join('') + '</g>';
  }
  // 5) VÀNG+: tim bên trái-dưới (2 → 3 tim)
  if (idx >= 2) for (const [d, k] of (idx >= 4 ? [[126, 2.1], [150, 1.7], [172, 1.4]] : [[132, 2.1], [158, 1.7]])) { const [x, y] = pt(79, d); s += `<path d="${heart(x, y, k)}" fill="${rb ? `url(#${P}rb)` : '#ff8fb3'}" stroke="${tier.dark}" stroke-width="0.8" stroke-linejoin="round"/>`; }
  // 6) HUYỀN THOẠI: lấp lánh
  if (idx >= 5) for (const [d, r] of [[-20, 82], [78, 83], [108, 83], [186, 79]]) { const [x, y] = pt(r, d); s += `<path d="M${x} ${f(y - 2.4)} Q${x} ${y} ${f(x + 2.4)} ${y} Q${x} ${y} ${x} ${f(y + 2.4)} Q${x} ${y} ${f(x - 2.4)} ${y} Q${x} ${y} ${x} ${f(y - 2.4)} Z" fill="${acc}"/>`; }
  // 7) HUYỀN THOẠI ★1+ (cấp 55+, tier.star >= 1): vòng 12 chấm sáng gắn trên đường chỉ khâu của vòng cổ (r=71.8, mỗi 30° từ 15°; quầng + chấm + lõi trắng) + 3 chấm ở -165°/-105°/-75° nở thành sao 4 cánh nhô ra (r ≤ 79.7) = 4 phần tử; vẽ SAU cùng; cộng dồn cho mọi bậc sao tới ★10
  if (tier.star >= 1) {
    const sacc = tier.star >= 5 ? '#fff3c4' : acc; // ★5+ (cấp 75+, mốc nửa chặng): sao + chấm sáng đổi sang trắng-vàng
    const big = [-165, -105, -75];
    let dots = '';
    for (let k = 0; k < 12; k++) { const d = -165 + k * 30; if (big.includes(d)) continue; const [x, y] = pt(71.8, d); dots += `M${x} ${y} h0.01 `; }
    s += `<path d="${dots}" stroke="${sacc}" stroke-opacity="0.4" stroke-width="7.5" stroke-linecap="round"/>` +
      `<path d="${dots}" stroke="${sacc}" stroke-width="4.2" stroke-linecap="round"/>` +
      `<path d="${dots}" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>`;
    const st4 = (x, y, r) => `M${x} ${f(y - r)} Q${x} ${y} ${f(x + r)} ${y} Q${x} ${y} ${x} ${f(y + r)} Q${x} ${y} ${f(x - r)} ${y} Q${x} ${y} ${x} ${f(y - r)} Z`;
    s += `<path d="${big.map((d) => { const [x, y] = pt(74.4, d); return st4(x, y, 5.3); }).join(' ')}" fill="${sacc}" stroke="${tier.dark}" stroke-width="0.9" stroke-linejoin="round"/>`;
  }
  // 5D (cấp 40+, tên KIM CƯƠNG; cấp 45 thừa hưởng): glow r=77.2 (rộng 5, mờ 0.2, mọi nét r ≤ 80) + vạch sáng mảnh r=70.8 + 2 viên long châu nhỏ trên vành ở -78° và -104° (r=75.6, bán kính 2.8; có quầng); tránh chân tai (-128°/-52°)
  if (tier.name === 'KIM CƯƠNG') {
    s += `<circle r="77.2" fill="none" stroke="${acc}" stroke-opacity="0.2" stroke-width="5"/><circle r="70.8" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="0.7"/>`;
    for (const d of [-78, -104]) { const [x, y] = pt(75.6, d); s += `<circle cx="${x}" cy="${y}" r="4.6" fill="${acc}" fill-opacity="0.25"/><circle cx="${x}" cy="${y}" r="2.8" fill="${acc}" stroke="${tier.dark}" stroke-width="0.8"/><circle cx="${f(x - 0.8)}" cy="${f(y - 0.8)}" r="0.8" fill="#ffffff"/>`; }
  }
  // 5D (cấp 50+, tên HUYỀN THOẠI): hào quang cầu vồng quanh avatar: dải glow r=76.4 (rộng 7, mờ 0.18, trắng-vàng) + vòng cầu vồng mảnh r=77.3 (rộng 1.5) — nằm trong r ≤ 78.1 (≤ 80) = +2 phần tử, ≈+0.3KB; bậc ≤ 45 y nguyên
  if (idx >= 5) s += `<circle r="76.4" fill="none" stroke="#fff3c4" stroke-opacity="0.18" stroke-width="7"/><circle r="77.3" fill="none" stroke="url(#${P}rb)" stroke-width="1.5" stroke-opacity="0.9"/>`;
  // HUYỀN THOẠI ★4+ (cấp 70+, tier.star >= 4): vòng hào quang mảnh cầu vồng: vòng đầy r=79.1 (nét 1.6 → ≤ 79.9, đúng giới hạn trên/trái r ≤ 80) + cung phụ r=82.6 chỉ nửa phải + nửa dưới (-50°→185°, nét 1.3 → ≤ 83.3 ≤ 84) mờ hơn; dùng gradient cầu vồng có sẵn (`${P}rb`) = +3 phần tử (1 nét tối mảnh dưới vòng chính để tách khỏi tai/chấm), ≈+0.5KB; vẽ trước cùng với lớp sao ★1 (sao ★1 nằm đè lên), cộng dồn cho các bậc sao sau
  if (tier.star >= 4) {
    const [ax, ay] = pt(82.6, -50), [bx, by] = pt(82.6, 185);
    s += `<circle r="79.1" fill="none" stroke="${tier.dark}" stroke-width="2.6" stroke-opacity="0.45"/>` +
      `<circle r="79.1" fill="none" stroke="url(#${P}rb)" stroke-width="1.6" stroke-opacity="0.95"/>` +
      `<path d="M${ax} ${ay} A82.6 82.6 0 1 1 ${bx} ${by}" fill="none" stroke="url(#${P}rb)" stroke-width="1.3" stroke-linecap="round" stroke-opacity="0.65"/>`;
  }
  // HUYỀN THOẠI ★8+ (cấp 90+, tier.star >= 8): 8 cánh nhỏ (lông vũ nhọn dài 7.5, rộng 2.6) quanh vòng avatar, mỗi 45° từ -157.5°, gốc r=72.4 → mũi r ≤ 79.9 (≤ 80 đúng giới hạn trên/trái), nghiêng 18° theo chiều xoay cho cảm giác cánh; trắng-vàng + viền tối + cuống trắng = 2 path gộp 8 cánh, ≈+0.9KB; cộng dồn cho các bậc sau
  if (tier.star >= 8) {
    let wd = '', qd = '';
    for (let k = 0; k < 8; k++) {
      const d = -157.5 + k * 45, a = (d * Math.PI) / 180, t = ((d + 18) * Math.PI) / 180;
      const [bx, by] = pt(72.4, d), ex = f(bx + 7.5 * Math.cos(t)), ey = f(by + 7.5 * Math.sin(t));
      const nx = -Math.sin(t) * 2.6, ny = Math.cos(t) * 2.6, mx = (bx + ex) / 2, my = (by + ey) / 2;
      wd += `M${bx} ${by} Q${f(mx + nx)} ${f(my + ny)} ${ex} ${ey} Q${f(mx - nx)} ${f(my - ny)} ${bx} ${by} Z `;
      qd += `M${bx} ${by} L${ex} ${ey} `;
    }
    s += `<path d="${wd}" fill="#fff3c4" stroke="${tier.dark}" stroke-width="0.9" stroke-linejoin="round"/><path d="${qd}" stroke="#ffffff" stroke-width="0.6" stroke-linecap="round"/>`;
  }
  // TỐI THƯỢNG (cấp 100, tier.max): vành avatar KÉP + 16 tia: vành thứ 2 trắng-vàng r=77.4 (nét 1.2; ≤ 80) + vành mảnh r=66.2 sát trong (≥ 64 vào ảnh) = 2 circle; 16 tia mỗi 22.5° từ r=77.8 ra r=80 (trên/trái) hoặc r=83.4 (nửa phải/dưới, ≤ 84) = 2 path (nền tối + lõi trắng-vàng); +4 phần tử ≈+0.7KB
  if (tier.max) {
    let rd = '';
    for (let k = 0; k < 16; k++) {
      const d = k * 22.5, a = (d * Math.PI) / 180, out = Math.cos(a) >= -0.01 || Math.sin(a) >= -0.01 ? 83.4 : 79.9;
      const [x1, y1] = pt(78.6, d), [x2, y2] = pt(out, d);
      rd += `M${x1} ${y1} L${x2} ${y2} `;
    }
    s += `<circle r="77.4" fill="none" stroke="${tier.dark}" stroke-width="2.4" stroke-opacity="0.5"/><circle r="77.4" fill="none" stroke="#fff3c4" stroke-width="1.2"/><circle r="66.2" fill="none" stroke="#fff3c4" stroke-opacity="0.85" stroke-width="1"/>` +
      `<path d="${rd}" stroke="${tier.dark}" stroke-width="2.8" stroke-linecap="round"/><path d="${rd}" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round"/>`;
  }
  return `${defs}<g transform="scale(${f(R / 70)})">${s}</g>`;
}

module.exports = { avatarFrame };
