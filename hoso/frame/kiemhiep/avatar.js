// ===== hoso/frame/kiemhiep/avatar.js — KHUNG AVATAR phong cách KIẾM HIỆP (6 bậc theo cấp) =====
// Tự chứa. avatarFrame(tier, R) -> SVG, gốc ở TÂM ảnh, ảnh tròn bán kính R (mặc định 70), y xuống. Chỉ vẽ khung (không vẽ ảnh, không vẽ đĩa nền).
// Dáng riêng: VÀNH DÂY THỪNG BỆN (vạch chéo) + HAI KIẾM CHÉO ở đỉnh + NÚT THẮT LỤA với 2 dải lụa bay + TUA RUA treo dưới.
// Giới hạn: vào ảnh r>=64; ngoài r<=84 chỉ nửa phải + nửa dưới, trên/trái r<=80.
// ĐỒNG: dây thừng + tua rua + nút lụa · BẠC: +kiếm chéo · VÀNG: +lụa dài · BẠCH KIM: +kiếm lớn, ngọc bội · KIM CƯƠNG: +đồng tiền · HUYỀN THOẠI: cầu vồng + tia sáng.
const ORDER = ['ĐỒNG', 'BẠC', 'VÀNG', 'BẠCH KIM', 'KIM CƯƠNG', 'HUYỀN THOẠI'];
const P = 'kiemhiep-avatar-';
const f = (n) => Number(n.toFixed(2));
const pt = (r, deg) => { const a = (deg * Math.PI) / 180; return [f(r * Math.cos(a)), f(r * Math.sin(a))]; };

function avatarFrame(tier, R = 70) {
  const idx = Math.max(0, ORDER.indexOf(tier.name));
  const rb = Boolean(tier.rainbow);
  const acc = tier.accent || tier.light;
  const defs =
    `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${tier.light}"/><stop offset="0.5" stop-color="${tier.main}"/><stop offset="1" stop-color="${tier.dark}"/></linearGradient>` +
    `<linearGradient id="${P}rb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6b6b"/><stop offset="0.25" stop-color="#ffd93d"/><stop offset="0.5" stop-color="#6bffb8"/><stop offset="0.75" stop-color="#6bb8ff"/><stop offset="1" stop-color="#d96bff"/></linearGradient></defs>`;
  const fillG = rb ? `url(#${P}rb)` : `url(#${P}g)`;
  const silk = idx >= 4 ? '#ff5d73' : idx >= 2 ? '#e0453f' : '#b8323a';
  let s = '';
  // 1) vành dây thừng r 70..77 + vạch bện chéo
  s += `<path fill-rule="evenodd" d="M-77 0 A77 77 0 1 0 77 0 A77 77 0 1 0 -77 0 Z M-70 0 A70 70 0 1 0 70 0 A70 70 0 1 0 -70 0 Z" fill="${fillG}" stroke="${tier.dark}" stroke-width="1.2"/>`;
  let br = '';
  for (let i = 0; i < 44; i++) { const [x1, y1] = pt(70.6, (360 * i) / 44), [x2, y2] = pt(76.4, (360 * i) / 44 + 7); br += `M${x1} ${y1} L${x2} ${y2} `; }
  s += `<path d="${br}" stroke="${tier.dark}" stroke-width="1.15" stroke-opacity="0.75" stroke-linecap="round"/>`;
  // 2) BẠC+: hai kiếm chéo ở đỉnh (trong r 63..80): lưỡi sáng + viền tối + chuôi + tay cầm
  if (idx >= 1) {
    const len = idx >= 3 ? 14 : 12, w = idx >= 3 ? 3.8 : 3.2;
    for (const sg of [1, -1]) {
      const ux = 0.57 * sg, uy = 0.82; // hướng kiếm (nghiêng ±35° so với trục dọc)
      const cx = 0, cy = -71.5;
      const x1 = f(cx - ux * len), y1 = f(cy - uy * len), x2 = f(cx + ux * len), y2 = f(cy + uy * len);
      s += `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${tier.dark}" stroke-width="${f(w + 1.8)}" stroke-linecap="round"/><path d="M${x1} ${y1} L${x2} ${y2}" stroke="${rb ? `url(#${P}rb)` : '#f2f5f9'}" stroke-width="${w}" stroke-linecap="round"/>`;
      const gx = f(cx + ux * (len - 4)), gy = f(cy + uy * (len - 4)); // đốc kiếm (gần phía trong ảnh)
      s += `<path d="M${f(gx - uy * 3.4)} ${f(gy + ux * 3.4)} L${f(gx + uy * 3.4)} ${f(gy - ux * 3.4)}" stroke="${tier.dark}" stroke-width="2.6" stroke-linecap="round"/><path d="M${f(gx - uy * 3.4)} ${f(gy + ux * 3.4)} L${f(gx + uy * 3.4)} ${f(gy - ux * 3.4)}" stroke="${acc}" stroke-width="1.2" stroke-linecap="round"/>`;
    }
    s += `<circle cx="0" cy="-71.5" r="2.6" fill="${acc}" stroke="${tier.dark}" stroke-width="1"/>`;
  }
  // 3) NÚT THẮT LỤA ở dưới phải + 2 dải lụa bay (tăng chiều dài theo bậc)
  {
    const [kx, ky] = pt(75.5, 52);
    const tail = (a2, a3, r2, r3, wid) => {
      const [c1x, c1y] = pt(r2, a2), [ex, ey] = pt(r3, a3);
      return `<path d="M${kx} ${ky} Q${c1x} ${c1y} ${ex} ${ey}" fill="none" stroke="${tier.dark}" stroke-width="${f(wid + 1.6)}" stroke-linecap="round"/><path d="M${kx} ${ky} Q${c1x} ${c1y} ${ex} ${ey}" fill="none" stroke="${silk}" stroke-width="${wid}" stroke-linecap="round"/>`;
    };
    s += tail(70, idx >= 2 ? 100 : 86, 84, 83, 3.2);
    s += tail(36, idx >= 2 ? 6 : 18, 83, 83, 3.2);
    s += `<circle cx="${kx}" cy="${ky}" r="3.9" fill="${silk}" stroke="${tier.dark}" stroke-width="1.1"/><circle cx="${f(kx - 1)}" cy="${f(ky - 1.1)}" r="1.1" fill="#fff" fill-opacity="0.7"/>`;
  }
  // 4) TUA RUA treo dưới đáy: hạt ngọc + chùm sợi
  {
    const [bx, by] = pt(78.5, 90);
    s += `<circle cx="${bx}" cy="${by}" r="2.8" fill="${acc}" stroke="${tier.dark}" stroke-width="1"/>`;
    let th = '';
    for (const dx of [-3, -1, 1, 3]) th += `M${f(bx + dx * 0.5)} ${f(by + 2.6)} L${f(bx + dx * 1.2)} ${f(by + 5.2)} `;
    s += `<path d="${th}" stroke="${silk}" stroke-width="1.5" stroke-linecap="round"/>`;
  }
  // 5) VÀNG+: dải lụa đỏ quấn bên trái vành (nửa dưới, r<=84)
  if (idx >= 2) { const [a1x, a1y] = pt(78, 118), [a2x, a2y] = pt(82.5, 140), [a3x, a3y] = pt(80, 165); s += `<path d="M${a1x} ${a1y} Q${a2x} ${a2y} ${a3x} ${a3y}" fill="none" stroke="${tier.dark}" stroke-width="4.4" stroke-linecap="round"/><path d="M${a1x} ${a1y} Q${a2x} ${a2y} ${a3x} ${a3y}" fill="none" stroke="${silk}" stroke-width="2.8" stroke-linecap="round"/>`; }
  // 6) BẠCH KIM+: ngọc bội hình thoi trên vành bên phải
  if (idx >= 3) { const [x, y] = pt(73.5, -20); s += `<path d="M${x} ${f(y - 6)} L${f(x + 4.4)} ${y} L${x} ${f(y + 6)} L${f(x - 4.4)} ${y} Z" fill="#7fe3c0" stroke="${tier.dark}" stroke-width="1.2" stroke-linejoin="round"/>`; }
  // 7) KIM CƯƠNG+: 2 đồng tiền (lỗ vuông) ở trái-trên vành
  if (idx >= 4) for (const d of [-158, 176]) { const [x, y] = pt(73.5, d); s += `<circle cx="${x}" cy="${y}" r="4.3" fill="${acc}" stroke="${tier.dark}" stroke-width="1.1"/><rect x="${f(x - 1.4)}" y="${f(y - 1.4)}" width="2.8" height="2.8" fill="${tier.dark}"/>`; }
  // 8) HUYỀN THOẠI: tia sáng nhỏ
  if (idx >= 5) for (const [d, r] of [[-60, 83], [-5, 83], [24, 83.5], [76, 83.5], [124, 83], [150, 83]]) { const [x, y] = pt(r, d); s += `<path d="M${x} ${f(y - 2.6)} Q${x} ${y} ${f(x + 2.6)} ${y} Q${x} ${y} ${x} ${f(y + 2.6)} Q${x} ${y} ${f(x - 2.6)} ${y} Q${x} ${y} ${x} ${f(y - 2.6)} Z" fill="${acc}"/>`; }
  // 5D (cấp 40+, tên KIM CƯƠNG; cấp 45 thừa hưởng): glow quanh vành (r 77.4 rộng mờ, mọi nét r ≤ 80) + vạch sáng mảnh r=70.8 + 3 mũi kiếm mini sáng trên đỉnh vành ở -112°/-90°/-68° (mũi r=80.2) (+5 phần tử)
  if (tier.name === 'KIM CƯƠNG') {
    s += `<circle r="77.4" fill="none" stroke="${tier.main}" stroke-opacity="0.2" stroke-width="5.2"/>` +
      `<circle r="70.8" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="0.7"/>`;
    for (const d of [-112, -90, -68]) {
      const [b1x, b1y] = pt(76.2, d - 3.2), [b2x, b2y] = pt(76.2, d + 3.2), [tx, ty] = pt(80.2, d);
      s += `<path d="M${b1x} ${b1y} L${tx} ${ty} L${b2x} ${b2y} Z" fill="#f2f5f9" stroke="${tier.dark}" stroke-width="0.9" stroke-linejoin="round"/>`;
    }
  }
  // 5D (cấp 50+, tên HUYỀN THOẠI; bậc sao thừa hưởng): glow cầu vồng quanh vành (r 77.4 rộng mờ + r 78.4 nét mảnh; mọi nét r ≤ 80) + vạch trắng mảnh r=70.8 + 3 mũi kiếm mini trắng trên đỉnh vành ở -112°/-90°/-68° (mũi r=80.2) (+6 phần tử)
  if (tier.name === 'HUYỀN THOẠI') {
    s += `<circle r="77.4" fill="none" stroke="url(#${P}rb)" stroke-opacity="0.25" stroke-width="5.2"/>` +
      `<circle r="78.4" fill="none" stroke="url(#${P}rb)" stroke-opacity="0.8" stroke-width="1.6"/>` +
      `<circle r="70.8" fill="none" stroke="#ffffff" stroke-opacity="0.55" stroke-width="0.7"/>`;
    for (const d of [-112, -90, -68]) {
      const [b1x, b1y] = pt(76.2, d - 3.2), [b2x, b2y] = pt(76.2, d + 3.2), [tx, ty] = pt(80.2, d);
      s += `<path d="M${b1x} ${b1y} L${tx} ${ty} L${b2x} ${b2y} Z" fill="#ffffff" stroke="${tier.dark}" stroke-width="0.9" stroke-linejoin="round"/>`;
    }
  }
  // Nửa bậc + (VÀNG II, cấp 25): 4 mũi kiếm mini (lưỡi nhọn sáng) toả ra từ vành ở -135°/-45°/-160°/-20° (trên/trái r ≤ 80.2, phải r ≤ 83).
  if (tier.step === 1 && tier.name === 'VÀNG' && !tier.star) {
    for (const [d, tip] of [[-135, 80.2], [-45, 80.2], [-160, 80.2], [-20, 83]]) {
      const [b1x, b1y] = pt(76.2, d - 3.2), [b2x, b2y] = pt(76.2, d + 3.2), [tx, ty] = pt(tip, d);
      s += `<path d="M${b1x} ${b1y} L${tx} ${ty} L${b2x} ${b2y} Z" fill="#f2f5f9" stroke="${tier.dark}" stroke-width="0.9" stroke-linejoin="round"/>`;
    }
  }
  // HUYỀN THOẠI ★1+ (cấp 55+, tier.star >= 1): vòng 12 chấm kiếm quang trên đường giữa vành dây thừng (r=74.5, mỗi 30° từ 15°; quầng mờ + chấm màu nhấn viền tối + lõi trắng; mọi nét r ≤ 78.3) = 3 path; vẽ SAU CÙNG (đè lên bện, nút lụa); từ ★5 (cấp 75+) chấm đổi trắng-vàng; cộng dồn tới TỐI THƯỢNG; bậc ≤ 50 y nguyên
  if (tier.star >= 1) {
    const sacc = tier.star >= 5 ? '#fff3c4' : acc;
    let dots = '';
    for (let n = 0; n < 12; n++) { const [x, y] = pt(74.5, 15 + n * 30); dots += `M${x} ${y} h0.01 `; }
    s += `<path d="${dots}" fill="none" stroke="${sacc}" stroke-opacity="0.4" stroke-width="7.5" stroke-linecap="round"/>` +
      `<path d="${dots}" fill="none" stroke="${tier.dark}" stroke-width="5" stroke-linecap="round"/>` +
      `<path d="${dots}" fill="none" stroke="${sacc}" stroke-width="3.6" stroke-linecap="round"/>` +
      `<path d="${dots}" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round"/>`;
  }
  // HUYỀN THOẠI ★4+ (cấp 70+, tier.star >= 4): vòng hào quang mảnh cầu vồng ngoài vành: nét tối r=81 (rộng 3.2, mờ 0.45) + vòng cầu vồng đầy r=81 (nét 1.6 → r 80.2..81.8) + cung phụ r=83.4 chỉ nửa phải + nửa dưới (-50°→185°, nét 1.2 → ≤ 84) mờ hơn = +3 phần tử; cộng dồn tới TỐI THƯỢNG
  if (tier.star >= 4) {
    const [ax, ay] = pt(83.4, -50), [bx, by] = pt(83.4, 185);
    s += `<circle r="81" fill="none" stroke="${tier.dark}" stroke-opacity="0.45" stroke-width="3.2"/><circle r="81" fill="none" stroke="url(#${P}rb)" stroke-width="1.6"/>` +
      `<path d="M${ax} ${ay} A83.4 83.4 0 1 1 ${bx} ${by}" fill="none" stroke="url(#${P}rb)" stroke-opacity="0.6" stroke-width="1.2" stroke-linecap="round"/>`;
  }
  // HUYỀN THOẠI ★8+ (cấp 90+, tier.star >= 8): 8 cánh nhỏ (lông vũ trắng-vàng #fff3c4 viền tối) quanh vòng avatar mỗi 45° từ 22.5°, gốc r=75.5, mũi r=82 (nửa trên/trái) hoặc 84 (nửa dưới) + 1 path gân tối = 2 phần tử; vẽ SAU CÙNG; cộng dồn tới TỐI THƯỢNG
  if (tier.star >= 8) {
    let fe = '', ve = '';
    for (let k = 0; k < 8; k++) {
      const a = 22.5 + k * 45, tipR = Math.sin((a * Math.PI) / 180) > 0 ? 84 : 82, midR = (75.5 + tipR) / 2;
      const [x0, y0] = pt(75.5, a), [tx, ty] = pt(tipR, a), [mx, my] = pt(midR, a), [nx, ny] = pt(1, a + 90);
      const w = 4;
      fe += `M${x0} ${y0}Q${f(mx + nx * w)} ${f(my + ny * w)} ${tx} ${ty}Q${f(mx - nx * w)} ${f(my - ny * w)} ${x0} ${y0}Z`;
      ve += `M${x0} ${y0}L${pt(tipR - 1.2, a)[0]} ${pt(tipR - 1.2, a)[1]}`;
    }
    s += `<path d="${fe}" fill="#fff3c4" stroke="${tier.dark}" stroke-width="0.9" stroke-linejoin="round"/><path d="${ve}" fill="none" stroke="${tier.dark}" stroke-opacity="0.55" stroke-width="0.6" stroke-linecap="round"/>`;
  }
  // TỐI THƯỢNG (cấp 100, tier.max): vành avatar KÉP + 16 tia: vành trắng-vàng r=77.4 (đệm tối) + vành mảnh r=66.2; 16 tia mỗi 22.5° từ 11.25° (lệch pha với 8 cánh ★8) từ r=78.6 ra r=83.4 (≤ 84) = 2 path; cộng sau mọi lớp ★1–★9
  if (tier.max) {
    let rd = '';
    for (let k = 0; k < 16; k++) { const [x0, y0] = pt(78.6, 11.25 + k * 22.5), [x1, y1] = pt(83.4, 11.25 + k * 22.5); rd += `M${x0} ${y0} L${x1} ${y1} `; }
    s += `<circle r="77.4" fill="none" stroke="${tier.dark}" stroke-width="2.4" stroke-opacity="0.5"/><circle r="77.4" fill="none" stroke="#fff3c4" stroke-width="1.2"/><circle r="66.2" fill="none" stroke="#fff3c4" stroke-opacity="0.85" stroke-width="1"/>` +
      `<path d="${rd}" fill="none" stroke="${tier.dark}" stroke-width="2.8" stroke-linecap="round"/><path d="${rd}" fill="none" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round"/>`;
  }
  return `${defs}<g transform="scale(${f(R / 70)})">${s}</g>`;
}

module.exports = { avatarFrame };
