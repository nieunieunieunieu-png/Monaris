// ===== hoso/frame/kiemhiep/side.js — HOẠ TIẾT CẠNH BÊN: dải lụa + vân tre =====
// Tự chứa. sideUnit(tier, W, H): 1 đơn vị cao đúng 100px, rộng <= 30px quanh x=0, nối liền khi xếp chồng. Lên bậc thêm chi tiết.
const IDX = { "ĐỒNG": 0, "BẠC": 1, "VÀNG": 2, "BẠCH KIM": 3, "KIM CƯƠNG": 4, "HUYỀN THOẠI": 5 };
function sideUnit(tier, W, H) {
  const P = 'kiemhiep-side-';
  const i = IDX[tier.name] || 0;
  const rbDef = tier.rainbow ? `<defs><linearGradient id="${P}rb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff6b6b"/><stop offset="0.25" stop-color="#ffd93d"/><stop offset="0.5" stop-color="#6bffb8"/><stop offset="0.75" stop-color="#6bb8ff"/><stop offset="1" stop-color="#d96bff"/></linearGradient></defs>` : '';
  const col = tier.rainbow ? `url(#${P}rb)` : tier.light;
  const line = `fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
  const leaf = `fill="${tier.rainbow ? `url(#${P}rb)` : tier.main}" stroke="${tier.dark}" stroke-width="1" stroke-linejoin="round"`;
  // dải lụa bậc gãy góc (nét bút lông): zig-zag nhẹ, đầu/cuối ở x=0
  let out = rbDef + `<path d="M0 0 L8 12 L8 38 L0 50 L-8 62 L-8 88 L0 100" ${line}/>`;
  if (i >= 1) out += `<path d="M-4 24 H4 M-4 26 H4 M-4 74 H4 M-4 76 H4" fill="none" stroke="${tier.dark}" stroke-width="1.4"/>`; // mắt tre
  if (i >= 2) out += `<path d="M8 25 L14.4 20.6 L11.4 27.4 Z M-8 75 L-14.4 70.6 L-11.4 77.4 Z" ${leaf}/>`;
  if (i >= 3) out += `<path d="M0 50 L-6 44 L0 38 L6 44 Z" fill="${tier.accent}" stroke="${tier.dark}" stroke-width="1"/>`;
  if (i >= 4) out += `<path d="M8 38 L13.8 44 L8 50 M-8 62 L-13.8 56 L-8 50" ${line} stroke-opacity="0.5"/>`;
  if (i >= 5) out += `<circle cx="8" cy="12" r="1.8" fill="${tier.accent}"/><circle cx="-8" cy="88" r="1.8" fill="${tier.accent}"/><circle cx="0" cy="50" r="1.5" fill="${tier.dark}"/>`;
  // Nửa bậc + (VÀNG II, cấp 25): 2 mảnh kiếm khí nhỏ ở khúc gãy (đối xứng chéo với cặp lá ở y=25/75) + 1 hạt ở giữa; vẫn nối liền khi xếp chồng.
  if (tier.step === 1 && tier.name === 'VÀNG' && !tier.star) out += `<path d="M8 38 L13 32.5 L11.6 40 Z M-8 62 L-13 67.5 L-11.6 60 Z" ${leaf}/><circle cx="0" cy="50" r="2" fill="${tier.accent}" stroke="${tier.dark}" stroke-width="0.8"/>`;
  // HUYỀN THOẠI ★3+ (cấp 65+, tier.star >= 3): 1 tia kiếm quang (sao 4 cánh dẹt: cánh ngang 3.8, dọc 3.2) ở y=50 bên phải khúc gãy (tâm x=11, x 7.2..14.8 ≤ 15; không vượt y 46.8..53.2 nên xếp chồng vẫn nối liền) + lõi trắng = +2 phần tử/đơn vị; cộng dồn tới TỐI THƯỢNG
  if (tier.star >= 3) out += `<path d="M7.2 50 Q10 49.2 11 46.8 Q12 49.2 14.8 50 Q12 50.8 11 53.2 Q10 50.8 7.2 50 Z" fill="${tier.accent || tier.light}" stroke="${tier.dark}" stroke-width="0.8" stroke-linejoin="round"/><circle cx="11" cy="50" r="1" fill="#ffffff"/>`;
  // HUYỀN THOẠI ★7+ (cấp 85+, tier.star >= 7): chuỗi hạt sáng liên tục BÁM THEO dải lụa gãy: 6 hạt/đơn vị tại (4,6) (8,17) (8,33) (-8,67) (-8,83) (-4,94) (đối xứng tâm, né mắt tre/lá/ngọc ở y=25,50,75) + quầng + lõi trắng = 3 path; xếp chồng vẫn nối nhịp vì đơn vị cao đúng 100; cộng dồn tới TỐI THƯỢNG
  if (tier.star >= 7) {
    const bd = 'M4 6h0.01M8 17h0.01M8 33h0.01M-8 67h0.01M-8 83h0.01M-4 94h0.01';
    out += `<path d="${bd}" fill="none" stroke="#fff3c4" stroke-opacity="0.4" stroke-width="7" stroke-linecap="round"/><path d="${bd}" fill="none" stroke="#fff3c4" stroke-width="3.6" stroke-linecap="round"/><path d="${bd}" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>`;
  }
  return out;
}

module.exports = { sideUnit };
