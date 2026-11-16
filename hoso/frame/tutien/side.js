// ===== hoso/frame/tutien/side.js — HOẠ TIẾT CẠNH BÊN: dây linh khí uốn lượn + đoá sen nhỏ =====
// Tự chứa. sideUnit(tier, W, H): 1 đơn vị cao đúng 100px, rộng <= 30px quanh x=0, nối liền khi xếp chồng. Lên bậc thêm chi tiết.
const IDX = { "ĐỒNG": 0, "BẠC": 1, "VÀNG": 2, "BẠCH KIM": 3, "KIM CƯƠNG": 4, "HUYỀN THOẠI": 5 };
const f = (n) => Number(n.toFixed(2));
function leaf(px, py, ang, len, wid, style) {
  const d = `M0 0 C${f(len * 0.25)} ${f(-wid)} ${f(len * 0.75)} ${f(-wid * 0.9)} ${len} 0 C${f(len * 0.75)} ${f(wid * 0.9)} ${f(len * 0.25)} ${f(wid)} 0 0 Z`;
  return `<path transform="translate(${px} ${py}) rotate(${ang})" d="${d}" ${style}/>`;
}
function sideUnit(tier, W, H) {
  const P = 'tutien-side-';
  const i = IDX[tier.name] || 0;
  const rbDef = tier.rainbow ? `<defs><linearGradient id="${P}rb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff6b6b"/><stop offset="0.25" stop-color="#ffd93d"/><stop offset="0.5" stop-color="#6bffb8"/><stop offset="0.75" stop-color="#6bb8ff"/><stop offset="1" stop-color="#d96bff"/></linearGradient></defs>` : '';
  const col = tier.rainbow ? `url(#${P}rb)` : tier.light;
  const line = `fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round"`;
  const petal = `fill="${tier.rainbow ? `url(#${P}rb)` : tier.main}" stroke="${tier.dark}" stroke-width="1"`;
  let out = rbDef + `<path d="M0 0 C-12 17 -12 33 0 50 C12 67 12 83 0 100" ${line}/>`;
  if (i >= 1) out += `<circle cx="-9" cy="25" r="2" fill="${tier.accent}"/><circle cx="9" cy="75" r="2" fill="${tier.accent}"/>`;
  if (i >= 2) out += leaf(-8, 30, -150, 7, 2.4, petal) + leaf(8, 70, -30, 7, 2.4, petal);
  if (i >= 3) out += leaf(0, 50, -90, 9, 2.4, petal) + leaf(0, 50, -125, 8, 2.2, petal) + leaf(0, 50, -55, 8, 2.2, petal);
  if (i >= 4) out += `<path d="M0 0 C12 17 12 33 0 50 C-12 67 -12 83 0 100" ${line} stroke-opacity="0.45"/>`;
  if (i >= 5) out += `<circle cx="0" cy="25" r="1.6" fill="${tier.accent}"/><circle cx="0" cy="75" r="1.6" fill="${tier.accent}"/><circle cx="0" cy="12" r="1.2" fill="${tier.accent}"/><circle cx="0" cy="88" r="1.2" fill="${tier.accent}"/>`;
  // Nửa bậc + (BẠC II, cấp 15): 1 nụ sen mini ở y=50 (2 lá nhỏ + 1 hạt), vẫn nối liền khi xếp chồng.
  if (tier.step === 1 && tier.name === 'BẠC' && !tier.star) out += leaf(0, 50, -125, 10, 3, petal) + leaf(0, 50, -55, 10, 3, petal) + `<circle cx="0" cy="50" r="3" fill="${tier.accent}" stroke="${tier.dark}" stroke-width="0.9"/>`;
  // HUYỀN THOẠI ★3+ (cấp 65+, tier.star >= 3): sao 4 cánh nhỏ ở y=50 bên phải đường dây (tâm x=10.5, cánh 4.2 → x 6.3..14.7 ≤ 15, y 45.8..54.2; đường uốn chỉ tới x≈3 ở y 55 và chồi sen nằm bên trái nên không đè) + lõi trắng = +2 phần tử/đơn vị; không vượt y 40..60 nên xếp chồng vẫn nối liền; cộng dồn cho các bậc sao sau
  if (tier.star >= 3) out += `<path d="M10.5 45.8 L11.9 49 L14.7 50 L11.9 51 L10.5 54.2 L9.1 51 L6.3 50 L9.1 49 Z" fill="${tier.accent || tier.light}" stroke="${tier.dark}" stroke-width="0.8" stroke-linejoin="round"/><circle cx="10.5" cy="50" r="1.2" fill="#ffffff"/>`;
  // HUYỀN THOẠI ★7+ (cấp 85+, tier.star >= 7): chuỗi hạt sáng liên tục BÁM THEO sợi dây uốn: sợi chỉ mảnh trắng-vàng chạy đúng đường cong (y 0..100, nối liền) + 8 hạt/đơn vị (tại t=0.17/0.33/0.67/0.83 của mỗi nửa đường cong, né nụ sen y=50, chấm ★1 y=25/75 và sao ★3) = 4 phần tử (chỉ + quầng + hạt + lõi); mọi xếp chồng vẫn đúng nhịp vì đơn vị cao đúng 100
  if (tier.star >= 7) {
    let dots = '';
    for (const [sgx, oy] of [[-1, 0], [1, 50]]) {
      for (const t of [0.17, 0.33, 0.67, 0.83]) {
        const x = sgx * 36 * t * (1 - t), y = oy + 3 * (1 - t) * (1 - t) * t * 17 + 3 * (1 - t) * t * t * 33 + 50 * t * t * t;
        dots += `M${f(x)} ${f(y)}h0.01`;
      }
    }
    out += `<path d="M0 0 C-12 17 -12 33 0 50 C12 67 12 83 0 100" fill="none" stroke="#fff3c4" stroke-opacity="0.6" stroke-width="0.8"/>` +
      `<path d="${dots}" stroke="#fff3c4" stroke-opacity="0.35" stroke-width="6" stroke-linecap="round"/>` +
      `<path d="${dots}" stroke="#fff3c4" stroke-width="3.2" stroke-linecap="round"/><path d="${dots}" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round"/>`;
  }
  return out;
}

module.exports = { sideUnit };
