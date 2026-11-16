// ===== hoso/frame/kiemhiep/bottom.js — CẠNH DƯỚI: hai thanh kiếm nhỏ bắt chéo + dải lụa =====
// Tự chứa. decorBottom(tier, W, H): gốc giữa mép dưới thẻ; compose.js scale 1.5 nên cục bộ cao <= 16, nửa rộng <= 70.
const IDX = { "ĐỒNG": 0, "BẠC": 1, "VÀNG": 2, "BẠCH KIM": 3, "KIM CƯƠNG": 4, "HUYỀN THOẠI": 5 };
function decorBottom(tier, W, H) {
  const P = 'kiemhiep-bottom-';
  const i = IDX[tier.name] || 0;
  const rbDef = tier.rainbow ? `<defs><linearGradient id="${P}rb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff6b6b"/><stop offset="0.25" stop-color="#ffd93d"/><stop offset="0.5" stop-color="#6bffb8"/><stop offset="0.75" stop-color="#6bb8ff"/><stop offset="1" stop-color="#d96bff"/></linearGradient></defs>` : '';
  const col = tier.rainbow ? `url(#${P}rb)` : tier.light;
  const fill = `fill="${tier.rainbow ? `url(#${P}rb)` : tier.main}" stroke="${tier.dark}" stroke-width="1.1" stroke-linejoin="round"`;
  const line = `fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
  const blade = (ang) => `<g transform="translate(0 -2) rotate(${ang})"><path d="M-36 -1.6 L26 -1.6 L36 0 L26 1.6 L-36 1.6 Z" ${fill}/><path d="M-30 -4.5 V4.5" stroke="${tier.dark}" stroke-width="2"/></g>`;
  let out = rbDef + blade(-9) + blade(9) + `<circle cx="0" cy="-2" r="2.6" fill="${tier.accent}" stroke="${tier.dark}" stroke-width="1"/>`;
  if (i >= 2) out += `<path d="M-8 2 L-20 4 L-30 3 M8 2 L20 4 L30 3" ${line}/>`;
  if (i >= 4) out += `<path d="M-40 6 H-52 L-56 3 M40 6 H52 L56 3" ${line} stroke-opacity="0.6"/>`;
  // Nửa bậc + (VÀNG II, cấp 25): tua rua lụa treo dưới nút giữa (đường + hạt) + 2 hạt sáng hai bên (cao ≤ 16, nửa rộng ≤ 70).
  if (tier.step === 1 && tier.name === 'VÀNG' && !tier.star) out += `<path d="M0 1 V9" stroke="${tier.accent}" stroke-width="1.8" stroke-linecap="round"/><circle cx="0" cy="11" r="2.2" fill="${tier.accent}" stroke="${tier.dark}" stroke-width="0.9"/><circle cx="-44" cy="3" r="1.6" fill="${tier.light}"/><circle cx="44" cy="3" r="1.6" fill="${tier.light}"/>`;
  // HUYỀN THOẠI ★3+ (cấp 65+, tier.star >= 3): mỗi bên 1 tia kiếm quang nhỏ (sao 4 cánh dẹt: ngang 5, dọc 3.8) dưới đường lụa (tâm x=±24, y=10 → y 6.2..13.8 ≤ 16, nửa rộng ≤ 29) + lõi trắng = +2 phần tử/bên (+4); đối xứng; cộng dồn tới TỐI THƯỢNG
  if (tier.star >= 3) {
    const g3 = (x) => `<path d="M${x - 5} 10 Q${x - 1} 9 ${x} 6.2 Q${x + 1} 9 ${x + 5} 10 Q${x + 1} 11 ${x} 13.8 Q${x - 1} 11 ${x - 5} 10 Z" fill="${tier.accent || tier.light}" stroke="${tier.dark}" stroke-width="0.8" stroke-linejoin="round"/><circle cx="${x}" cy="10" r="1.1" fill="#ffffff"/>`;
    out += g3(-24) + g3(24);
  }
  // HUYỀN THOẠI ★8+ (cấp 90+, tier.star >= 8): mỗi bên 1 cánh quạt 3 lông vũ trắng-vàng (gốc (34,9), hướng -10°/10°/30° ra ngoài, dài 20/16/12 → y 5.5..15, x ≤ 53.7) + 1 sao 4 cánh nhỏ (x=62, y=11.5, cánh 3.4) + lõi trắng = 3 phần tử/bên (+6); đối xứng; cao ≤ 16, nửa rộng ≤ 66; cộng dồn tới TỐI THƯỢNG
  if (tier.star >= 8) {
    const r1 = (n) => Number(n.toFixed(1));
    let fd = '';
    for (const [deg, len] of [[-10, 20], [10, 16], [30, 12]]) {
      const a = (deg * Math.PI) / 180, c = Math.cos(a), sn = Math.sin(a), tx = 34 + len * c, ty = 9 + len * sn, mx = 34 + (len * c) / 2, my = 9 + (len * sn) / 2, w = len * 0.17;
      fd += `M34 9Q${r1(mx - sn * w)} ${r1(my + c * w)} ${r1(tx)} ${r1(ty)}Q${r1(mx + sn * w)} ${r1(my - c * w)} 34 9Z`;
    }
    const s8 = `<path d="${fd}" fill="#fff3c4" stroke="${tier.dark}" stroke-width="0.7" stroke-linejoin="round"/><path d="M62 8.1 Q62.8 10.7 65.4 11.5 Q62.8 12.3 62 14.9 Q61.2 12.3 58.6 11.5 Q61.2 10.7 62 8.1 Z" fill="#fff3c4" stroke="${tier.dark}" stroke-width="0.7" stroke-linejoin="round"/><circle cx="62" cy="11.5" r="1" fill="#ffffff"/>`;
    out += `<g>${s8}</g><g transform="scale(-1 1)">${s8}</g>`;
  }
  return out;
}

module.exports = { decorBottom };
