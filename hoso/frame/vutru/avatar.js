// ===== hoso/frame/vutru/avatar.js — KHUNG AVATAR phong cách VŨ TRỤ (6 bậc theo cấp) =====
// Tự chứa. avatarFrame(tier, R) -> SVG, gốc ở TÂM ảnh, ảnh tròn bán kính R (mặc định 70), y xuống. Chỉ vẽ khung (không vẽ ảnh, không vẽ đĩa nền).
// Dáng riêng: vành MẢNH như quỹ đạo + TRĂNG LƯỠI LIỀM ôm góc trên phải + HÀNH TINH CÓ VÀNH đai ở góc dưới phải + sao 4 cánh + sao chổi.
// Giới hạn: vào ảnh r>=64; ngoài r<=84 chỉ nửa phải + nửa dưới, trên/trái r<=80.
// ĐỒNG: trăng + hành tinh nhỏ + 4 sao · BẠC: +quỹ đạo đứt nét · VÀNG: +vành đai hành tinh · BẠCH KIM: +sao lớn ở đỉnh · KIM CƯƠNG: +sao chổi · HUYỀN THOẠI: cầu vồng + bụi sao.
const ORDER = ['ĐỒNG', 'BẠC', 'VÀNG', 'BẠCH KIM', 'KIM CƯƠNG', 'HUYỀN THOẠI'];
const P = 'vutru-avatar-';
const f = (n) => Number(n.toFixed(2));
const pt = (r, deg) => { const a = (deg * Math.PI) / 180; return [f(r * Math.cos(a)), f(r * Math.sin(a))]; };
const star = (x, y, r) => `M${x} ${f(y - r)} Q${x} ${y} ${f(x + r)} ${y} Q${x} ${y} ${x} ${f(y + r)} Q${x} ${y} ${f(x - r)} ${y} Q${x} ${y} ${x} ${f(y - r)} Z`;

function avatarFrame(tier, R = 70) {
  const idx = Math.max(0, ORDER.indexOf(tier.name));
  const rb = Boolean(tier.rainbow);
  const acc = tier.star >= 5 ? '#fff3c4' : (tier.accent || tier.light); // ★5+ (cấp 75+): sao nhấn đổi sang trắng-vàng
  const gold = '#fff3c4';
  const defs =
    `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${tier.light}"/><stop offset="0.5" stop-color="${tier.main}"/><stop offset="1" stop-color="${tier.dark}"/></linearGradient>` +
    `<linearGradient id="${P}rb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6b6b"/><stop offset="0.25" stop-color="#ffd93d"/><stop offset="0.5" stop-color="#6bffb8"/><stop offset="0.75" stop-color="#6bb8ff"/><stop offset="1" stop-color="#d96bff"/></linearGradient>` +
    `<radialGradient id="${P}pl" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="${tier.light}"/><stop offset="0.6" stop-color="${tier.main}"/><stop offset="1" stop-color="${tier.dark}"/></radialGradient></defs>`;
  const fillG = rb ? `url(#${P}rb)` : `url(#${P}g)`;
  let s = '';
  // 1) vành mảnh r 71..74 (quỹ đạo) + vạch sáng
  s += `<path fill-rule="evenodd" d="M-74 0 A74 74 0 1 0 74 0 A74 74 0 1 0 -74 0 Z M-71 0 A71 71 0 1 0 71 0 A71 71 0 1 0 -71 0 Z" fill="${fillG}" stroke="${tier.dark}" stroke-width="0.8"/>`;
  // 2) quỹ đạo đứt nét ngoài (BẠC+)
  if (idx >= 1) s += `<circle r="79" fill="none" stroke="${rb ? `url(#${P}rb)` : tier.light}" stroke-width="0.9" stroke-dasharray="1.6 3.4" stroke-linecap="round" stroke-opacity="0.9"/>`;
  // HUYỀN THOẠI ★1+ (cấp 55+): vòng 12 chấm bụi sao trên quỹ đạo r=82.6 (mỗi 30° từ 15°; 3 path dùng nét tròn dài 0 = quầng + chấm + lõi trắng; mọi nét r ≤ 84.2); vẽ DƯỚI trăng/hành tinh; cộng dồn tới ★10
  if (tier.star >= 1) {
    let dd = '';
    for (let k = 0; k < 12; k += 1) { const [x, y] = pt(82.6, 15 + 30 * k); dd += `M${x} ${y}h0.01`; }
    s += `<path d="${dd}" fill="none" stroke="${acc}" stroke-opacity="0.3" stroke-width="3.2" stroke-linecap="round"/><path d="${dd}" fill="none" stroke="${acc}" stroke-width="2.4" stroke-linecap="round"/><path d="${dd}" fill="none" stroke="#ffffff" stroke-width="1" stroke-linecap="round"/>`;
  }
  // HUYỀN THOẠI ★8+ (cấp 90+): 8 tia sao dạng kim thoi gốc r=74.4 → mũi r=84 mỗi 45° từ 22.5° (lệch pha với 12 chấm ★1 ≥ 7.5°) + 1 vạch lõi trắng; vẽ DƯỚI trăng/hành tinh; cộng dồn tới ★10
  if (tier.star >= 8) {
    let kp = '', kl = '';
    for (let k = 0; k < 8; k += 1) {
      const a = 22.5 + 45 * k, [bx, by] = pt(74.4, a), [tx, ty] = pt(84, a), [lx, ly] = pt(78.4, a - 2.1), [rx, ry] = pt(78.4, a + 2.1);
      kp += `M${bx} ${by} L${lx} ${ly} L${tx} ${ty} L${rx} ${ry} Z`;
      kl += `M${bx} ${by} L${tx} ${ty}`;
    }
    s += `<path d="${kp}" fill="${gold}" stroke="${tier.dark}" stroke-width="0.6" stroke-linejoin="round"/><path d="${kl}" fill="none" stroke="#ffffff" stroke-width="0.7" stroke-linecap="round"/>`;
  }
  // 3) TRĂNG LƯỠI LIỀM ôm góc trên phải: đĩa trăng trừ 1 đĩa lệch về phía tâm ảnh (phần dày quay ra ngoài)
  {
    const Rm = 10 + idx * 0.3, rin = Rm * 0.9, e = Rm * 0.85;
    const [cx, cy] = pt(76.2, -44);
    const L = Math.hypot(cx, cy) || 1, ux = -cx / L, uy = -cy / L; // hướng từ trăng về tâm ảnh
    const a = (Rm * Rm - rin * rin + e * e) / (2 * e), h = Math.sqrt(Math.max(0, Rm * Rm - a * a));
    const p1 = [f(cx + a * ux - h * uy), f(cy + a * uy + h * ux)], p2 = [f(cx + a * ux + h * uy), f(cy + a * uy - h * ux)];
    s += `<path d="M${p1[0]} ${p1[1]} A${f(Rm)} ${f(Rm)} 0 1 1 ${p2[0]} ${p2[1]} A${f(rin)} ${f(rin)} 0 0 0 ${p1[0]} ${p1[1]} Z" fill="${fillG}" stroke="${tier.dark}" stroke-width="1" stroke-linejoin="round"/>`;
  }
  // 4) HÀNH TINH dưới phải (r~7..9), có vành đai từ VÀNG+
  {
    const pr = 6.6 + idx * 0.5;
    const [px, py] = pt(76, 50);
    s += `<circle cx="${px}" cy="${py}" r="${f(pr)}" fill="url(#${P}pl)" stroke="${tier.dark}" stroke-width="1"/>`;
    if (idx >= 2) {
      s += `<ellipse cx="${px}" cy="${py}" rx="${f(pr * 1.9)}" ry="${f(pr * 0.5)}" transform="rotate(-24 ${px} ${py})" fill="none" stroke="${rb ? `url(#${P}rb)` : acc}" stroke-width="1.7" stroke-linecap="round"/>`;
      s += `<ellipse cx="${px}" cy="${py}" rx="${f(pr * 1.9)}" ry="${f(pr * 0.5)}" transform="rotate(-24 ${px} ${py})" fill="none" stroke="${tier.dark}" stroke-width="0.5"/>`;
    }
  }
  // 5) sao 4 cánh quanh vành
  const sp = [[-148, 6.5], [162, 4.6], [128, 5], [96, 4.2]];
  sp.slice(0, 2 + Math.min(2, idx)).forEach(([d, r]) => { const [x, y] = pt(d < -100 ? 77 : 80, d); s += `<path d="${star(x, y, r)}" fill="${acc}" stroke="${tier.dark}" stroke-width="0.7" stroke-linejoin="round"/>`; });
  // 6) BẠCH KIM+: sao lớn ở đỉnh (r<=80)
  if (idx >= 3) { const [x, y] = pt(74, -102); s += `<path d="${star(x, y, 8)}" fill="${acc}" stroke="${tier.dark}" stroke-width="1" stroke-linejoin="round"/>`; }
  // 7) KIM CƯƠNG+: sao chổi bên trái-dưới, đuôi cong ôm vành (r<=84, nửa dưới)
  if (idx >= 4) {
    const [hx, hy] = pt(79, 150), [t1x, t1y] = pt(80.5, 128), [t2x, t2y] = pt(83.5, 108), [c1x, c1y] = pt(84, 140), [c2x, c2y] = pt(84, 118);
    s += `<path d="M${hx} ${hy} Q${c1x} ${c1y} ${t1x} ${t1y} Q${c2x} ${c2y} ${t2x} ${t2y}" fill="none" stroke="${acc}" stroke-width="2.4" stroke-linecap="round" stroke-opacity="0.85"/>`;
    s += `<circle cx="${hx}" cy="${hy}" r="3.2" fill="${acc}" stroke="${tier.dark}" stroke-width="0.8"/>`;
  }
  // 5D (cấp 40+, tên KIM CƯƠNG; cấp 45 thừa hưởng): glow quanh vành (r 77.4 rộng mờ, mọi nét r ≤ 80) + vạch sáng mảnh r=70.8 + 2 sao nhỏ trên vành ở -40° và 10° (r=74) (+4 phần tử)
  if (tier.name === 'KIM CƯƠNG') {
    s += `<circle r="77.4" fill="none" stroke="${tier.main}" stroke-opacity="0.2" stroke-width="5.2"/>` +
      `<circle r="70.8" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="0.7"/>`;
    for (const d of [-40, 10]) { const [x, y] = pt(74, d); s += `<path d="${star(x, y, 4.4)}" fill="${acc}" stroke="${tier.dark}" stroke-width="0.9" stroke-linejoin="round"/>`; }
  }
  // 8) HUYỀN THOẠI: bụi sao
  if (idx >= 5) { let h = ''; for (const [d, r] of [[-28, 82], [-4, 82.5], [20, 83], [74, 83], [118, 82.5], [176, 80]]) { const [x, y] = pt(r, d); h += `<circle cx="${x}" cy="${y}" r="1.5" fill="${acc}"/>`; } s += h; }
  // 5D (cấp 50+, tên HUYỀN THOẠI; mọi bậc sao 55–100 thừa hưởng): glow cầu vồng quanh vành (r 77.4 rộng mờ + r 78.6 mảnh, mọi nét r ≤ 80) + vạch trắng r=70.8 + 2 sao trắng nhỏ trên vành ở -76° và -128° (r=74) (+5 phần tử)
  if (tier.name === 'HUYỀN THOẠI') {
    s += `<circle r="77.4" fill="none" stroke="url(#${P}rb)" stroke-opacity="0.26" stroke-width="5.2"/>` +
      `<circle r="78.6" fill="none" stroke="url(#${P}rb)" stroke-opacity="0.9" stroke-width="0.9"/>` +
      `<circle r="70.8" fill="none" stroke="#ffffff" stroke-opacity="0.6" stroke-width="0.7"/>`;
    for (const d of [-76, -128]) { const [x, y] = pt(74, d); s += `<path d="${star(x, y, 4.6)}" fill="#ffffff" stroke="${tier.dark}" stroke-width="0.9" stroke-linejoin="round"/>`; }
  }
  // Nửa bậc + (BẠCH KIM II, cấp 35): 1 vệ tinh nhỏ bay trên quỹ đạo đứt nét (dưới-trái, r=79, chưa có phụ kiện nào ở vùng này).
  if (tier.step === 1 && tier.name === 'BẠCH KIM' && !tier.star) {
    const [sx, sy] = pt(79, 112);
    s += `<g transform="translate(${sx} ${sy}) rotate(22)">` +
      `<rect x="-3.2" y="-1.6" width="6.4" height="3.2" rx="0.6" fill="${tier.light}" stroke="${tier.dark}" stroke-width="0.7"/>` +
      `<rect x="-7.6" y="-0.9" width="4" height="1.8" fill="${acc}" stroke="${tier.dark}" stroke-width="0.5"/>` +
      `<rect x="3.6" y="-0.9" width="4" height="1.8" fill="${acc}" stroke="${tier.dark}" stroke-width="0.5"/>` +
      `<path d="M0 -1.6 V-3.4" stroke="${tier.dark}" stroke-width="0.7" stroke-linecap="round"/>` +
      `</g>`;
  }
  // HUYỀN THOẠI ★4+ (cấp 70+): vòng hào quang mảnh cầu vồng r=80.6 (nét 1.2 → r 80..81.2) + dải quầng mờ r=80.6 (nét 3.2) + nét tối đệm = +3 phần tử; ôm sát quỹ đạo, không chạm chấm ★1 (r ≥ 81.3); cộng dồn
  if (tier.star >= 4) {
    s += `<circle r="80.6" fill="none" stroke="url(#${P}rb)" stroke-opacity="0.22" stroke-width="3.2"/><circle r="80.6" fill="none" stroke="${tier.dark}" stroke-opacity="0.35" stroke-width="1.8"/><circle r="80.6" fill="none" stroke="url(#${P}rb)" stroke-width="1.2"/>`;
  }
  // TỐI THƯỢNG (cấp 100, tier.max): vành avatar KÉP (vành trắng-vàng r=75.4 + vành mảnh r=66.2) + 16 tia mỗi 22.5° từ 11.25° (lệch pha với 8 tia ★8) từ r=78.6 ra r=83.4 (≤ 84); vẽ SAU mọi lớp ★1–★9
  if (tier.max) {
    let rd = '';
    for (let k = 0; k < 16; k += 1) { const a = 11.25 + 22.5 * k, [x1, y1] = pt(78.6, a), [x2, y2] = pt(83.4, a); rd += `M${x1} ${y1} L${x2} ${y2} `; }
    s += `<circle r="75.4" fill="none" stroke="${tier.dark}" stroke-width="2.4" stroke-opacity="0.5"/><circle r="75.4" fill="none" stroke="${gold}" stroke-width="1.2"/><circle r="66.2" fill="none" stroke="${gold}" stroke-opacity="0.85" stroke-width="1"/>` +
      `<path d="${rd}" fill="none" stroke="${tier.dark}" stroke-width="3" stroke-linecap="round" stroke-opacity="0.55"/><path d="${rd}" fill="none" stroke="${gold}" stroke-width="1.5" stroke-linecap="round"/>`;
  }
  return `${defs}<g transform="scale(${f(R / 70)})">${s}</g>`;
}

module.exports = { avatarFrame };
