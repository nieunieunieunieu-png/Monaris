// ===== hoso/frame/tutien/bottom.js — CẠNH DƯỚI: sóng mây tường vân + sen nhỏ =====
// Tự chứa. decorBottom(tier, W, H): gốc giữa mép dưới thẻ; compose.js scale 1.5 nên cục bộ cao <= 16, nửa rộng <= 70.
const IDX = { "ĐỒNG": 0, "BẠC": 1, "VÀNG": 2, "BẠCH KIM": 3, "KIM CƯƠNG": 4, "HUYỀN THOẠI": 5 };
function decorBottom(tier, W, H) {
  const P = 'tutien-bottom-';
  const i = IDX[tier.name] || 0;
  const rbDef = tier.rainbow ? `<defs><linearGradient id="${P}rb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff6b6b"/><stop offset="0.25" stop-color="#ffd93d"/><stop offset="0.5" stop-color="#6bffb8"/><stop offset="0.75" stop-color="#6bb8ff"/><stop offset="1" stop-color="#d96bff"/></linearGradient></defs>` : '';
  const col = tier.rainbow ? `url(#${P}rb)` : tier.light;
  const line = `fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round"`;
  // nửa phải: sóng mây cuộn, thêm 1 cuộn/1 đường phụ khi lên bậc
  let half = `<path d="M10 0 C20 -2 26 -9 34 -7 C40 -6 40 0 36 0 C33 0 33 -4 36 -4" ${line}/>`;
  if (i >= 2) half += `<path d="M42 -1 C50 -2 54 -9 60 -7 C65 -6 64 0 61 -1" ${line}/>`;
  if (i >= 4) half += `<path d="M12 3 C30 4 44 2 66 3" ${line} stroke-opacity="0.5"/>`;
  // Nửa bậc + (BẠC II, cấp 15): mỗi bên thêm 2 hạt linh khí + 1 đường sóng phụ mờ; giữa thêm 1 hạt ngọc trên đài sen (cao ≤ 16).
  const plusOn = tier.step === 1 && tier.name === 'BẠC' && !tier.star;
  if (plusOn) half += `<circle cx="48" cy="-3" r="1.8" fill="${tier.accent}"/><circle cx="62" cy="-6" r="1.4" fill="${tier.accent}"/><path d="M14 3 C28 4 40 3 52 3" ${line} stroke-opacity="0.5"/>`;
  const mirror = `<g>${half}</g><g transform="scale(-1 1)">${half}</g>`;
  // giữa: sen nhỏ (3 cánh, 5 cánh từ bậc 3)
  const petal = `fill="${tier.rainbow ? `url(#${P}rb)` : tier.main}" stroke="${tier.dark}" stroke-width="1"`;
  const pt = (a, l) => `<path transform="translate(0 2) rotate(${a})" d="M0 0 C${l * 0.3} -2 ${l * 0.7} -2 ${l} 0 C${l * 0.7} 2 ${l * 0.3} 2 0 0 Z" ${petal}/>`;
  let lotus = pt(-90, 10) + pt(-60, 8) + pt(-120, 8);
  if (i >= 3) lotus += pt(-30, 6) + pt(-150, 6);
  if (plusOn) lotus += `<circle cx="0" cy="-14" r="2" fill="${tier.accent}" stroke="${tier.dark}" stroke-width="0.8"/>`;
  // HUYỀN THOẠI ★3+ (cấp 65+, tier.star >= 3): mỗi bên 1 sao 4 cánh nhỏ dưới sóng mây (tâm x=28, y=8.5, cánh 4.2 → y 4.3..12.7 ≤ 16; nửa rộng ≤ 70) + lõi trắng = +2 phần tử/bên (+4); đối xứng, cộng dồn cho các bậc sao sau
  let star3 = '';
  if (tier.star >= 3) {
    const s3 = `<path d="M28 4.3 L29.4 7.1 L32.2 8.5 L29.4 9.9 L28 12.7 L26.6 9.9 L23.8 8.5 L26.6 7.1 Z" fill="${tier.accent || tier.light}" stroke="${tier.dark}" stroke-width="0.8" stroke-linejoin="round"/><circle cx="28" cy="8.5" r="1" fill="#ffffff"/>`;
    star3 = `<g>${s3}</g><g transform="scale(-1 1)">${s3}</g>`;
  }
  // HUYỀN THOẠI ★8+ (cấp 90+, tier.star >= 8): mỗi bên 1 cánh quạt 3 lông vũ trắng-vàng (gốc (46,5.5), hướng 10°/32°/54° xuống-ra ngoài, dài 20/16/12 → y ≤ 15.2, x ≤ 65.7) + 2 sao 4 cánh nhỏ (x=37 và x=66) + 2 lõi trắng = 4 phần tử/bên (+8); dưới đường sóng phụ y≈3, né sao ★3 ở x=28; đối xứng; nửa rộng ≤ 70, cao ≤ 16; cộng dồn tới ★10
  let star8 = '';
  if (tier.star >= 8) {
    const r1 = (n) => Number(n.toFixed(1));
    let fd = '';
    for (const [deg, len] of [[10, 20], [32, 16], [54, 12]]) {
      const a = (deg * Math.PI) / 180, c = Math.cos(a), sn = Math.sin(a), tx = 46 + len * c, ty = 5.5 + len * sn, mx = 46 + (len * c) / 2, my = 5.5 + (len * sn) / 2, w = len * 0.17;
      fd += `M46 5.5Q${r1(mx - sn * w)} ${r1(my + c * w)} ${r1(tx)} ${r1(ty)}Q${r1(mx + sn * w)} ${r1(my - c * w)} 46 5.5Z`;
    }
    const st = (x, y, r) => `M${x} ${r1(y - r)}L${r1(x + r * 0.3)} ${r1(y - r * 0.3)}L${r1(x + r)} ${y}L${r1(x + r * 0.3)} ${r1(y + r * 0.3)}L${x} ${r1(y + r)}L${r1(x - r * 0.3)} ${r1(y + r * 0.3)}L${r1(x - r)} ${y}L${r1(x - r * 0.3)} ${r1(y - r * 0.3)}Z`;
    const s8 = `<path d="${fd}" fill="#fff3c4" stroke="${tier.dark}" stroke-width="0.7" stroke-linejoin="round"/><path d="${st(37, 10.5, 3.4)} ${st(66, 13.4, 2.6)}" fill="#fff3c4" stroke="${tier.dark}" stroke-width="0.7" stroke-linejoin="round"/><path d="M37 10.5h0.01M66 13.4h0.01" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round"/>`;
    star8 = `<g>${s8}</g><g transform="scale(-1 1)">${s8}</g>`;
  }
  return rbDef + mirror + lotus + star3 + star8;
}

module.exports = { decorBottom };
