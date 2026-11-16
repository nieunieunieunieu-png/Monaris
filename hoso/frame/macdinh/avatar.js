// ===== hoso/frame/macdinh/avatar.js — KHUNG AVATAR mặc định: giống vòng hiện tại (vành r 72..77, gradient chéo) =====
// Tự chứa. avatarFrame(tier, R) -> SVG, gốc ở TÂM ảnh (R=70). Không vẽ ảnh, không vẽ đĩa nền.
function avatarFrame(tier, R = 70) {
  const id = 'macdinh-avatar-g';
  const stops = tier.rainbow
    ? '<stop offset="0" stop-color="#ff6b6b"/><stop offset="0.25" stop-color="#ffd93d"/><stop offset="0.5" stop-color="#6bffb8"/><stop offset="0.75" stop-color="#6bb8ff"/><stop offset="1" stop-color="#d96bff"/>'
    : `<stop offset="0" stop-color="${tier.light}"/><stop offset="0.5" stop-color="${tier.main}"/><stop offset="1" stop-color="${tier.dark}"/>`;
  const k = Number((R / 70).toFixed(4));
  // Nửa bậc + (ĐỒNG II, cấp 5): vẽ y hệt ĐỒNG I rồi thêm 1 vòng mảnh sáng r≈79.4 + 8 hạt đồng ngoài vành (4 hạt thoi ở 4 hướng chính, 4 hạt tròn nhỏ ở góc chéo); mọi nét r ≤ 84.
  let plus = '';
  if (tier.step === 1 && tier.name === 'ĐỒNG' && !tier.star) {
    const acc = tier.accent || tier.light;
    const f = (n) => Number(n.toFixed(2));
    let beads = '';
    for (let a = 0; a < 8; a += 1) {
      const ang = (a * Math.PI) / 4 - Math.PI / 2;
      const cx = f(Math.cos(ang) * 80.4);
      const cy = f(Math.sin(ang) * 80.4);
      if (a % 2 === 0) {
        const r = 3.4;
        const rot = f((a * 45 * 180) / 180);
        beads += `<path transform="translate(${cx} ${cy}) rotate(${rot})" d="M0 -${r} L${r * 0.7} 0 L0 ${r} L-${r * 0.7} 0 Z" fill="${acc}" stroke="${tier.dark}" stroke-width="0.7"/>`;
      } else {
        beads += `<circle cx="${cx}" cy="${cy}" r="2.3" fill="${tier.light}" stroke="${tier.dark}" stroke-width="0.6"/>`;
      }
    }
    plus = `<circle r="79.4" fill="none" stroke="${tier.light}" stroke-width="1.1" stroke-opacity="0.9"/>` + beads;
  }
  // 5D (cấp 40+, tên KIM CƯƠNG; cấp 45 thừa hưởng): glow 2 nét quanh vành (r 77.5 rộng mờ + r 78.6 nét mảnh; mọi nét r ≤ 79.4) + vạch sáng mảnh r=71.2 phía trong vành → vành nổi khối hơn (+3 phần tử)
  if (tier.name === 'KIM CƯƠNG') {
    plus += `<circle r="77.5" fill="none" stroke="${tier.main}" stroke-opacity="0.2" stroke-width="5"/>` +
      `<circle r="78.6" fill="none" stroke="${tier.light}" stroke-opacity="0.55" stroke-width="1.6"/>` +
      `<circle r="71.2" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="0.7"/>`;
  }
  // 5D (cấp 50+, tên HUYỀN THOẠI; bậc sao thừa hưởng): glow cầu vồng 2 nét quanh vành (r 77.5 rộng mờ + r 78.6 nét mảnh; mọi nét r ≤ 79.5) + vạch trắng mảnh r=71.2 (+3 phần tử)
  if (tier.name === 'HUYỀN THOẠI') {
    plus += `<circle r="77.5" fill="none" stroke="url(#${id})" stroke-opacity="0.25" stroke-width="5"/>` +
      `<circle r="78.6" fill="none" stroke="url(#${id})" stroke-opacity="0.8" stroke-width="1.8"/>` +
      `<circle r="71.2" fill="none" stroke="#ffffff" stroke-opacity="0.55" stroke-width="0.7"/>`;
  }
  // HUYỀN THOẠI ★4+ (cấp 70+, tier.star >= 4): vòng hào quang mảnh cầu vồng ngoài vành: nét tối r=81 (rộng 3.2, mờ 0.45) + vòng cầu vồng đầy r=81 (nét 1.6 → r 80.2..81.8) + cung phụ r=83.4 chỉ nửa phải + nửa dưới (-50°→185°, nét 1.2 → ≤ 84) mờ hơn = +3 phần tử; mọi nét r ≤ 84; cộng dồn cho các bậc sao sau
  if (tier.star >= 4) {
    const ptr = (r, dg) => [Number((r * Math.cos((dg * Math.PI) / 180)).toFixed(2)), Number((r * Math.sin((dg * Math.PI) / 180)).toFixed(2))];
    const [ax, ay] = ptr(83.4, -50), [bx, by] = ptr(83.4, 185);
    plus += `<circle r="81" fill="none" stroke="${tier.dark}" stroke-opacity="0.45" stroke-width="3.2"/>` +
      `<circle r="81" fill="none" stroke="url(#${id})" stroke-width="1.6"/>` +
      `<path d="M${ax} ${ay} A83.4 83.4 0 1 1 ${bx} ${by}" fill="none" stroke="url(#${id})" stroke-opacity="0.6" stroke-width="1.2" stroke-linecap="round"/>`;
  }
  // HUYỀN THOẠI ★8+ (cấp 90+, tier.star >= 8): 8 cánh nhỏ (lông vũ nhọn dài 7.5, rộng 2.6) quanh vòng avatar, mỗi 45° từ -157.5°, gốc r=74.5 (giữa vành) → mũi r ≈ 81.6 (≤ 84), nghiêng 18° theo chiều xoay; trắng-vàng + viền tối + cuống trắng = 2 path gộp 8 cánh; vẽ đè lên vòng ★4; cộng dồn cho các bậc sau
  if (tier.star >= 8) {
    const ff = (n) => Number(n.toFixed(2));
    let wd = '', qd = '';
    for (let k = 0; k < 8; k++) {
      const d = -157.5 + k * 45, a = (d * Math.PI) / 180, t = ((d + 18) * Math.PI) / 180;
      const bx = ff(74.5 * Math.cos(a)), by = ff(74.5 * Math.sin(a)), ex = ff(bx + 7.5 * Math.cos(t)), ey = ff(by + 7.5 * Math.sin(t));
      const nx = -Math.sin(t) * 2.6, ny = Math.cos(t) * 2.6, mx = (bx + ex) / 2, my = (by + ey) / 2;
      wd += `M${bx} ${by} Q${ff(mx + nx)} ${ff(my + ny)} ${ex} ${ey} Q${ff(mx - nx)} ${ff(my - ny)} ${bx} ${by} Z `;
      qd += `M${bx} ${by} L${ex} ${ey} `;
    }
    plus += `<path d="${wd}" fill="#fff3c4" stroke="${tier.dark}" stroke-width="0.9" stroke-linejoin="round"/><path d="${qd}" stroke="#ffffff" stroke-width="0.6" stroke-linecap="round"/>`;
  }
  // HUYỀN THOẠI ★1+ (cấp 55+, tier.star >= 1): vòng 12 chấm sáng trên đường giữa vành (r=74.5, mỗi 30° từ 15°; quầng + chấm màu nhấn + lõi trắng; mọi nét r ≤ 78.3) = 3 phần tử; cộng dồn cho mọi bậc sao tới ★10; bậc ≤ 50 y nguyên
  if (tier.star >= 1) {
    const sacc = tier.star >= 5 ? '#fff3c4' : (tier.accent || tier.light); // ★5+ (cấp 75+, mốc nửa chặng): chấm sáng đổi sang trắng-vàng
    let dots = '';
    for (let n = 0; n < 12; n++) { const a = ((15 + n * 30) * Math.PI) / 180; dots += `M${Number((74.5 * Math.cos(a)).toFixed(2))} ${Number((74.5 * Math.sin(a)).toFixed(2))} h0.01 `; }
    plus += `<path d="${dots}" stroke="${sacc}" stroke-opacity="0.4" stroke-width="7.5" stroke-linecap="round"/>` +
      `<path d="${dots}" stroke="${sacc}" stroke-width="4.2" stroke-linecap="round"/>` +
      `<path d="${dots}" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>`;
  }
  // TỐI THƯỢNG (cấp 100, tier.max): vành avatar KÉP + 16 tia: vành thứ 2 trắng-vàng r=77.4 (nét 1.2) + vành mảnh r=66.2 sát trong = 3 circle (có 1 nét tối đệm); 16 tia mỗi 22.5° bắt đầu từ 11.25° (lệch pha với 8 cánh ★8 ở 22.5°·lẻ) từ r=78.6 ra r=83.4 (≤ 84) = 2 path (nền tối + lõi trắng-vàng); cộng sau mọi lớp ★1–★9
  if (tier.max) {
    const ff = (n) => Number(n.toFixed(2));
    let rd = '';
    for (let k = 0; k < 16; k++) {
      const a = ((11.25 + k * 22.5) * Math.PI) / 180;
      rd += `M${ff(78.6 * Math.cos(a))} ${ff(78.6 * Math.sin(a))} L${ff(83.4 * Math.cos(a))} ${ff(83.4 * Math.sin(a))} `;
    }
    plus += `<circle r="77.4" fill="none" stroke="${tier.dark}" stroke-width="2.4" stroke-opacity="0.5"/><circle r="77.4" fill="none" stroke="#fff3c4" stroke-width="1.2"/><circle r="66.2" fill="none" stroke="#fff3c4" stroke-opacity="0.85" stroke-width="1"/>` +
      `<path d="${rd}" stroke="${tier.dark}" stroke-width="2.8" stroke-linecap="round"/><path d="${rd}" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round"/>`;
  }
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient></defs>` +
    `<g transform="scale(${k})"><path fill-rule="evenodd" fill="url(#${id})" d="M-77 0 A77 77 0 1 0 77 0 A77 77 0 1 0 -77 0 Z M-72 0 A72 72 0 1 0 72 0 A72 72 0 1 0 -72 0 Z"/>${plus}</g>`;
}

module.exports = { avatarFrame };
