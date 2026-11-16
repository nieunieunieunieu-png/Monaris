// ===== hoso/frame/tutien/avatar.js — KHUNG AVATAR phong cách TU TIÊN (6 bậc theo cấp) =====
// Tự chứa. avatarFrame(tier, R) -> SVG, gốc ở TÂM ảnh, ảnh tròn bán kính R (mặc định 70), y xuống.
// Chỉ vẽ khung (không vẽ ảnh, không vẽ đĩa nền). Vành r 70..80; điểm nhấn lấn vào r>=64, ra ngoài r<=84 (nửa dưới).
// ĐỒNG: vành + 4 hạt linh khí + 3 cánh sen + 4 quái chính · BẠC: sen 5 cánh + sóng mây + đủ bát quái · VÀNG: +sen dày hơn
// BẠCH KIM: sen 7 cánh + ngọc đỉnh · KIM CƯƠNG: +cánh nhỏ xen kẽ, 2 ngọc phụ · HUYỀN THOẠI: cầu vồng + hào quang hạt.
const ORDER = ['ĐỒNG', 'BẠC', 'VÀNG', 'BẠCH KIM', 'KIM CƯƠNG', 'HUYỀN THOẠI'];
const P = 'tutien-avatar-';
const f = (n) => Number(n.toFixed(2));
const pt = (r, deg) => { const a = (deg * Math.PI) / 180; return [f(r * Math.cos(a)), f(r * Math.sin(a))]; };

function avatarFrame(tier, R = 70) {
  const idx = Math.max(0, ORDER.indexOf(tier.name));
  const rb = Boolean(tier.rainbow);
  const acc = tier.accent || tier.light;
  const defs =
    `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tier.light}"/><stop offset="0.5" stop-color="${tier.main}"/><stop offset="1" stop-color="${tier.dark}"/></linearGradient>` +
    `<linearGradient id="${P}rb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6b6b"/><stop offset="0.25" stop-color="#ffd93d"/><stop offset="0.5" stop-color="#6bffb8"/><stop offset="0.75" stop-color="#6bb8ff"/><stop offset="1" stop-color="#d96bff"/></linearGradient></defs>`;
  const fillG = rb ? `url(#${P}rb)` : `url(#${P}g)`;
  let s = '';
  // 1) vành ngọc chính r 70..77 (vòng rỗng bằng even-odd) + viền tối
  s += `<path fill-rule="evenodd" d="M-77 0 A77 77 0 1 0 77 0 A77 77 0 1 0 -77 0 Z M-70 0 A70 70 0 1 0 70 0 A70 70 0 1 0 -70 0 Z" fill="${fillG}" stroke="${tier.dark}" stroke-width="1.2"/>`;
  // 2) vạch sáng mảnh trong vành
  s += `<circle r="73.5" fill="none" stroke="${tier.light}" stroke-opacity="0.8" stroke-width="1.2"/>`;
  // 3) MỌI BẬC: 4 hạt linh khí trên vành (chéo)
  for (const d of [45, 135, 225, 315]) { const [x, y] = pt(73.5, d); s += `<circle cx="${x}" cy="${y}" r="2.2" fill="${acc}" stroke="${tier.dark}" stroke-width="0.8"/>`; }
  // 4) MỌI BẬC: cánh sen nửa dưới (r=77 ra r=84): ĐỒNG 3 cánh · BẠC, VÀNG 5 · BẠCH KIM+ 7
  {
    const n = idx === 0 ? 3 : idx <= 2 ? 5 : 7, span = idx === 0 ? 56 : idx <= 2 ? 100 : 150, c0 = 90;
    let petals = '';
    for (let i = 0; i < n; i++) {
      const a = c0 - span / 2 + (span * i) / (n - 1);
      const [x1, y1] = pt(76.5, a - 7), [x2, y2] = pt(76.5, a + 7), [tx, ty] = pt(84, a), [c1x, c1y] = pt(82, a - 9), [c2x, c2y] = pt(82, a + 9);
      petals += `M${x1} ${y1} Q${c1x} ${c1y} ${tx} ${ty} Q${c2x} ${c2y} ${x2} ${y2} Z `;
    }
    s += `<path d="${petals}" fill="${fillG}" stroke="${tier.dark}" stroke-width="1" stroke-linejoin="round"/>`;
    // KIM CƯƠNG+: lớp cánh nhỏ xen kẽ ở giữa các cánh lớn (màu nhấn)
    if (idx >= 4) {
      let q = '';
      for (let i = 0; i < n - 1; i++) {
        const a = c0 - span / 2 + (span * (i + 0.5)) / (n - 1);
        const [x1, y1] = pt(77, a - 4), [x2, y2] = pt(77, a + 4), [tx, ty] = pt(81.5, a);
        q += `M${x1} ${y1} Q${tx} ${ty} ${x2} ${y2} Z `;
      }
      s += `<path d="${q}" fill="${acc}" stroke="${tier.dark}" stroke-width="0.8" stroke-linejoin="round"/>`;
    }
  }
  // 5) ĐỒNG: 2 vân mây cuộn nhỏ hai bên (trái/phải, ngang tâm) cho khung thấp nhất cũng có hoạ tiết
  if (idx === 0) for (const sx of [1, -1]) s += `<path d="M${77 * sx} -3 C${80 * sx} -4.5 ${80.5 * sx} 1.5 ${77.5 * sx} 2" fill="none" stroke="${tier.light}" stroke-width="1.4" stroke-linecap="round"/>`;
  // 6) BẠC+: sóng mây mảnh quanh ngoài (nền r=76.5, đỉnh sóng ~79.5)
  if (idx >= 1) {
    let w = '';
    const N = 40;
    for (let i = 0; i < N; i++) { const [x1, y1] = pt(76.5, (360 * i) / N), [x2, y2] = pt(76.5, (360 * (i + 1)) / N); w += `${i ? '' : `M${x1} ${y1} `}A7.5 7.5 0 0 1 ${x2} ${y2} `; }
    s += `<path d="${w}" fill="none" stroke="${rb ? `url(#${P}rb)` : tier.light}" stroke-width="1.2" stroke-linecap="round"/>`;
  }
  // 7) BÁT QUÁI trên vành (r 72..75.2): 3 vạch/quái, liền = dương, đứt = âm. ĐỒNG: 4 quái chính (Càn Khôn Khảm Ly) · BẠC+: đủ 8 quái
  {
    const BAGUA = [[1, 1, 1], [0, 1, 1], [1, 0, 1], [0, 0, 1], [1, 1, 0], [0, 1, 0], [1, 0, 0], [0, 0, 0]];
    const pick = idx === 0 ? [0, 5, 2, 7] : [0, 1, 2, 3, 4, 5, 6, 7];
    const arc = (r, a1, a2) => { const [x1, y1] = pt(r, a1), [x2, y2] = pt(r, a2); return `M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2} `; };
    let t = '';
    pick.forEach((q, i) => {
      const c = idx === 0 ? -90 + i * 90 : -90 + i * 45;
      BAGUA[q].forEach((yang, li) => {
        const r = 72.1 + li * 1.55, h = idx === 0 ? 11 : 9.5;
        t += yang ? arc(r, c - h, c + h) : arc(r, c - h, c - 1.8) + arc(r, c + 1.8, c + h);
      });
    });
    s += `<path d="${t}" fill="none" stroke="${tier.dark}" stroke-width="0.95" stroke-linecap="butt"/>`;
  }
  // 8) BẠCH KIM+: ngọc hình thoi ở đỉnh (trong r<=80, che nhẹ ảnh tới r=66)
  if (idx >= 3) s += `<path d="M0 -80 L5 -73 L0 -66 L-5 -73 Z" fill="${acc}" stroke="${tier.dark}" stroke-width="1.2" stroke-linejoin="round"/>`;
  // 9) KIM CƯƠNG+: 2 ngọc nhỏ hai bên ngọc đỉnh
  if (idx >= 4) for (const d of [-112, -68]) { const [x, y] = pt(74, d); s += `<circle cx="${x}" cy="${y}" r="2.6" fill="${acc}" stroke="${tier.dark}" stroke-width="0.9"/>`; }
  // 10) HUYỀN THOẠI: hào quang hạt sáng (nửa phải + nửa dưới, r=82)
  if (idx >= 5) { let h = ''; for (const d of [-60, -30, 0, 30, 60, 120, 150]) { const [x, y] = pt(82, d); h += `<circle cx="${x}" cy="${y}" r="1.6" fill="${acc}"/>`; } s += h; }
  // 5D (cấp 40+, tên KIM CƯƠNG; cấp 45 thừa hưởng): glow quanh vành (r 77.4 rộng mờ, mọi nét r ≤ 80) + vạch sáng mảnh r=70.8 phía trong + 3 hạt linh khí phụ ở 0°/90°/180° trên vành (r=73.5) (+5 phần tử)
  if (tier.name === 'KIM CƯƠNG') {
    s += `<circle r="77.4" fill="none" stroke="${tier.main}" stroke-opacity="0.2" stroke-width="5.2"/>` +
      `<circle r="70.8" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="0.7"/>`;
    for (const d of [0, 90, 180]) { const [x, y] = pt(73.5, d); s += `<circle cx="${x}" cy="${y}" r="2" fill="${acc}" stroke="${tier.dark}" stroke-width="0.7"/>`; }
  }
  // 5D (cấp 50+, tên HUYỀN THOẠI; bậc sao thừa hưởng): glow cầu vồng quanh vành (r 77.4 rộng mờ + r 78.4 nét mảnh; mọi nét r ≤ 80) + vạch trắng mảnh r=70.8 + 3 hạt linh khí phụ ở 0°/90°/180° (+6 phần tử)
  if (tier.name === 'HUYỀN THOẠI') {
    s += `<circle r="77.4" fill="none" stroke="url(#${P}rb)" stroke-opacity="0.25" stroke-width="5.2"/>` +
      `<circle r="78.4" fill="none" stroke="url(#${P}rb)" stroke-opacity="0.8" stroke-width="1.6"/>` +
      `<circle r="70.8" fill="none" stroke="#ffffff" stroke-opacity="0.55" stroke-width="0.7"/>`;
    for (const d of [0, 90, 180]) { const [x, y] = pt(73.5, d); s += `<circle cx="${x}" cy="${y}" r="2" fill="#ffffff" stroke="${tier.dark}" stroke-width="0.7"/>`; }
  }
  // Nửa bậc + (BẠC II, cấp 15): thêm lớp cánh sen nhỏ (màu nhấn) xen giữa 5 cánh lớn + 3 ngọc nhỏ trên đỉnh vành (r ≤ 83).
  if (tier.step === 1 && tier.name === 'BẠC' && !tier.star) {
    const n = 5, span = 100, c0 = 90;
    let q = '';
    for (let i = 0; i < n - 1; i++) {
      const a = c0 - span / 2 + (span * (i + 0.5)) / (n - 1);
      const [x1, y1] = pt(77, a - 5), [x2, y2] = pt(77, a + 5), [tx, ty] = pt(82.6, a);
      q += `M${x1} ${y1} Q${tx} ${ty} ${x2} ${y2} Z `;
    }
    s += `<path d="${q}" fill="${acc}" stroke="${tier.dark}" stroke-width="0.8" stroke-linejoin="round"/>`;
    for (const d of [-112, -90, -68]) { const [x, y] = pt(74, d); s += `<circle cx="${x}" cy="${y}" r="${d === -90 ? 3 : 2.3}" fill="${acc}" stroke="${tier.dark}" stroke-width="0.9"/>`; }
  }
  // HUYỀN THOẠI ★1+ (cấp 55+, tier.star >= 1): vòng 12 chấm linh quang trên đường giữa vành (r=74.5, mỗi 30° từ 15°, lệch pha với 3 hạt linh khí 5D ở 0°/90°/180°; quầng + chấm màu nhấn + lõi trắng; mọi nét r ≤ 78.3) = 3 phần tử; cộng dồn cho mọi bậc sao tới ★10; bậc ≤ 50 y nguyên
  if (tier.star >= 1) {
    const sacc = tier.star >= 5 ? '#fff3c4' : (tier.accent || tier.light); // ★5+ (cấp 75+, mốc nửa chặng): chấm sáng đổi sang trắng-vàng
    let dots = '';
    for (let n = 0; n < 12; n++) { const [x, y] = pt(74.5, 15 + n * 30); dots += `M${x} ${y} h0.01 `; }
    s += `<path d="${dots}" stroke="${sacc}" stroke-opacity="0.4" stroke-width="7.5" stroke-linecap="round"/>` +
      `<path d="${dots}" stroke="${sacc}" stroke-width="4.2" stroke-linecap="round"/>` +
      `<path d="${dots}" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>`;
  }
  // HUYỀN THOẠI ★4+ (cấp 70+, tier.star >= 4): vòng hào quang mảnh cầu vồng ngoài vành: nét tối r=81 (rộng 3.2, mờ 0.45) + vòng cầu vồng đầy r=81 (nét 1.6 → r 80.2..81.8) + cung phụ r=83.4 chỉ nửa phải + nửa dưới (-50°→185°, nét 1.2 → ≤ 84) mờ hơn = +3 phần tử; mọi nét r ≤ 84; cộng dồn cho các bậc sao sau
  if (tier.star >= 4) {
    const [ax, ay] = pt(83.4, -50), [bx, by] = pt(83.4, 185);
    s += `<circle r="81" fill="none" stroke="${tier.dark}" stroke-opacity="0.45" stroke-width="3.2"/>` +
      `<circle r="81" fill="none" stroke="url(#${P}rb)" stroke-width="1.6"/>` +
      `<path d="M${ax} ${ay} A83.4 83.4 0 1 1 ${bx} ${by}" fill="none" stroke="url(#${P}rb)" stroke-opacity="0.6" stroke-width="1.2" stroke-linecap="round"/>`;
  }
  // HUYỀN THOẠI ★8+ (cấp 90+, tier.star >= 8): 8 cánh nhỏ (lông vũ trắng-vàng #fff3c4, viền tối) quanh vòng avatar mỗi 45° từ 22.5°, gốc r=75.5 (trên vành), mũi r=82 ở nửa trên/trái và r=84 ở nửa dưới (khớp ★4 r ≤ 81.8 và cánh sen r ≤ 84) + 1 path gân sáng giữa mỗi lông = 2 phần tử; vẽ SAU CÙNG (đè lên chấm ★1, sóng mây, cánh sen); cộng dồn tới ★10
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
  // TỐI THƯỢNG (cấp 100, tier.max): vành avatar KÉP + 16 tia: vành trắng-vàng r=77.4 (nét 1.2, đệm tối) + vành mảnh r=66.2 sát trong; 16 tia mỗi 22.5° bắt đầu từ 11.25° (lệch pha với 8 cánh ★8 ở 22.5°+45°k) từ r=78.6 ra r=83.4 (≤ 84) = 2 path; cộng sau mọi lớp ★1–★9
  if (tier.max) {
    let rd = '';
    for (let k = 0; k < 16; k++) { const [x0, y0] = pt(78.6, 11.25 + k * 22.5), [x1, y1] = pt(83.4, 11.25 + k * 22.5); rd += `M${x0} ${y0} L${x1} ${y1} `; }
    s += `<circle r="77.4" fill="none" stroke="${tier.dark}" stroke-width="2.4" stroke-opacity="0.5"/><circle r="77.4" fill="none" stroke="#fff3c4" stroke-width="1.2"/><circle r="66.2" fill="none" stroke="#fff3c4" stroke-opacity="0.85" stroke-width="1"/>` +
      `<path d="${rd}" fill="none" stroke="${tier.dark}" stroke-width="2.8" stroke-linecap="round"/><path d="${rd}" fill="none" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round"/>`;
  }
  return `${defs}<g transform="scale(${f(R / 70)})">${s}</g>`;
}

module.exports = { avatarFrame };
