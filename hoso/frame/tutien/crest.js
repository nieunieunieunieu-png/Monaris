// ===== hoso/frame/tutien/crest.js — ĐỈNH hồ sơ TU TIÊN =====
// Tự chứa. crestTop(tier, W, H) -> SVG (defs id 'tutien-crest-'). Gốc giữa cạnh trên, x -80..80, y 0..36 (chân y=36).
// 6 bậc: Hồ lô + linh khí · Ấn bát quái · Tiên hạc · Đan lô + sen · Tiên đảo + bảo tháp · Cửu thiên tiên môn.
const f = (n) => Number(n.toFixed(2));
const mirror = (half) => `<g>${half}</g><g transform="scale(-1 1)">${half}</g>`;
// Cánh/lá: gốc (px,py), chỉ sang phải, xoay ang độ.
function leaf(px, py, ang, len, wid, style) {
  const d = `M0 0 C${f(len * 0.25)} ${f(-wid)} ${f(len * 0.75)} ${f(-wid * 0.9)} ${len} 0 C${f(len * 0.75)} ${f(wid * 0.9)} ${f(len * 0.25)} ${f(wid)} 0 0 Z`;
  return `<path transform="translate(${px} ${py}) rotate(${ang})" d="${d}" ${style}/>`;
}
// Đoá sen: n cánh toả quanh (cx,cy) hướng lên, cao h.
function lotus(cx, cy, h, n, style) {
  let out = '';
  const span = n > 3 ? 120 : 80;
  for (let i = 0; i < n; i++) out += leaf(cx, cy, -90 - span / 2 + (span / (n - 1)) * i, h, h * 0.2, style);
  return out;
}

function crestTop(tier, W, H) {
  const P = 'tutien-crest-';
  const dark = tier.dark;
  const rb = Boolean(tier.rainbow);
  const defs =
    `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tier.light}"/><stop offset="0.55" stop-color="${tier.main}"/><stop offset="1" stop-color="${dark}"/></linearGradient>` +
    `<linearGradient id="${P}rb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff6b6b"/><stop offset="0.25" stop-color="#ffd93d"/><stop offset="0.5" stop-color="#6bffb8"/><stop offset="0.75" stop-color="#6bb8ff"/><stop offset="1" stop-color="#d96bff"/></linearGradient></defs>`;
  const fillG = rb ? `url(#${P}rb)` : `url(#${P}g)`;
  const fill = `fill="${fillG}" stroke="${dark}" stroke-width="1.4" stroke-linejoin="round"`;
  const line = `fill="none" stroke="${rb ? `url(#${P}rb)` : tier.light}" stroke-width="2" stroke-linecap="round"`;
  const thin = `fill="none" stroke="${dark}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"`;
  const pearl = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${tier.accent}" stroke="${dark}" stroke-width="1"/>`;
  // dải mây nền chung (chân vật liền khối với viền)
  const baseHalf = `<path d="M0 36 H30 C36 36 38 30 33 29 C29 28 27 33 31 34" ${line}/>`;
  const base = mirror(baseHalf);

  // ĐỒNG — hồ lô + dải linh khí
  const hoLo =
    `<path d="M-4 12 H4 V15 H-4 Z" ${fill}/>` +
    `<path d="M-3 15 C-3 18 -6 18 -6 23 C-6 27 -4 28 -4 29 C-9 30 -11 34 -8 36 H8 C11 34 9 30 4 29 C4 28 6 27 6 23 C6 18 3 18 3 15 Z" ${fill}/>` +
    `<path d="M-3 24 C-1 25 1 25 3 24" ${thin}/>` +
    mirror(`<path d="M12 30 C20 28 22 20 28 21 C32 22 31 27 27 26" ${line}/><path d="M16 33 C24 33 30 31 38 33" ${line} stroke-opacity="0.6"/>`) + base;

  // BẠC — ấn bát quái: bát giác + 4 vạch quẻ + dải linh khí hai bên
  const oct = (r) => [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `${f(Math.cos(((i * 45 + 22.5) * Math.PI) / 180) * r)} ${f(20 + Math.sin(((i * 45 + 22.5) * Math.PI) / 180) * r)}`).join(' L');
  const an =
    `<path d="M${oct(16)} Z" ${fill}/><path d="M${oct(10.5)} Z" ${thin}/>` +
    `<path d="M-4 9 H4 M-4 12 H-1 M1 12 H4 M-4 28 H4 M-4 31 H-1 M1 31 H4" ${thin}/><path d="M-9 17 V23 M9 17 V23" ${thin}/>` +
    `<circle cx="0" cy="20" r="3" fill="${tier.accent}" stroke="${dark}" stroke-width="1"/>` +
    mirror(`<path d="M18 28 C28 26 30 18 37 19 C42 20 41 26 36 25" ${line}/><path d="M20 33 C30 33 40 30 50 33" ${line} stroke-opacity="0.6"/>`) + base;

  // VÀNG — tiên hạc: thân, cổ dài, đầu mỏ, đôi cánh giương
  const hac =
    mirror([-70, -48, -26, -6].map((a, i) => leaf(5, 27, a, 28 - i * 2, 4.4, fill)).join('')) +
    `<path d="M-6 28 C-6 22 6 22 6 28 C6 33 -6 33 -6 28 Z" ${fill}/>` +
    `<path d="M2 24 C8 20 6 12 3 9" fill="none" stroke="${dark}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 24 C8 20 6 12 3 9" fill="none" stroke="${tier.light}" stroke-width="1.6" stroke-linecap="round"/>` +
    `<circle cx="3" cy="8" r="2.6" fill="${tier.light}" stroke="${dark}" stroke-width="1"/><path d="M5 7.5 L11 9 L5.5 10.2 Z" fill="${tier.accent}" stroke="${dark}" stroke-width="0.8"/>` +
    `<path d="M-1 33 L-1 36 M3 33 L3 36" ${thin}/>` + base;

  // BẠCH KIM — đan lô + đoá sen, khói linh khí
  const lo =
    lotus(0, 18, 14, 5, fill) +
    `<path d="M-14 22 H14 C13 30 9 33 6 33 H-6 C-9 33 -13 30 -14 22 Z" ${fill}/>` +
    `<path d="M-14 22 C-19 22 -19 28 -14 27 M14 22 C19 22 19 28 14 27" ${thin}/>` +
    `<path d="M-6 33 L-9 36 M6 33 L9 36" ${thin}/><path d="M-9 26 H9" ${thin}/>` + pearl(0, 28, 2) +
    mirror(`<path d="M12 18 C20 14 18 8 24 6" ${line}/><path d="M22 26 C32 24 34 18 41 19" ${line}/>`) + base;

  // KIM CƯƠNG — tiên đảo + bảo tháp 3 tầng, 2 đảo nhỏ
  const tier3 = (y, w) => `<path d="M${-w} ${y} H${w} L${w - 3} ${y - 4} H${-(w - 3)} Z" ${fill}/><path d="M${-w - 3} ${y - 4} Q0 ${y - 9} ${w + 3} ${y - 4}" ${thin}/>`;
  const dao =
    `<path d="M-22 26 H22 C20 31 12 33 8 36 H-8 C-12 33 -20 31 -22 26 Z" ${fill}/>` +
    `<path d="M-20 26 C-10 22 10 22 20 26" ${thin}/>` +
    tier3(24, 8) + tier3(17, 6) + tier3(11, 4) + `<path d="M0 3 V7" ${thin}/>` + pearl(0, 2.5, 2) +
    mirror(`<path d="M40 24 H56 C54 28 50 29 48 31 H44 C42 29 40 28 40 24 Z" ${fill}/><path d="M46 24 V19 L50 24" ${thin}/><path d="M26 33 H34 C40 33 41 28 37 28" ${line}/>`) + base;

  // HUYỀN THOẠI — cửu thiên tiên môn: cổng 2 trụ, vòm, quầng sáng, sen đỉnh, cánh khí
  const mon =
    mirror([-62, -40, -18].map((a, i) => leaf(26, 30, a, 33 - i * 4, 4.6, fill)).join('')) +
    `<circle cx="0" cy="22" r="10" fill="${tier.accent}" fill-opacity="0.55"/>` +
    `<path d="M-17 36 V16 C-17 4 17 4 17 16 V36 H12 V17 C12 10 -12 10 -12 17 V36 Z" ${fill}/>` +
    `<path d="M-20 14 Q0 -2 20 14" fill="none" stroke="${dark}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>` +
    lotus(0, 9, 10, 5, fill) + pearl(0, 22, 3.2) +
    `<path d="M-14 36 V30 M14 36 V30" ${thin}/>` + base;

  const byName = { 'ĐỒNG': hoLo, 'BẠC': an, 'VÀNG': hac, 'BẠCH KIM': lo, 'KIM CƯƠNG': dao, 'HUYỀN THOẠI': mon };
  // Nửa bậc + (BẠC II, cấp 15): Ấn bát quái y hệt + 1 vòng bát giác ngoài mảnh + mỗi bên 1 tia linh khí cuộn lên và 1 hạt ngọc (đối xứng; y ≥ 0, chân vẫn y=36).
  let plus = '';
  if (tier.step === 1 && tier.name === 'BẠC' && !tier.star) {
    plus = `<path d="M${oct(19.5)} Z" fill="none" stroke="${tier.accent}" stroke-opacity="0.8" stroke-width="1.2" stroke-linejoin="round"/>` +
      mirror(`<path d="M42 26 C52 25 54 14 60 11 C66 9 67 16 62 16" ${line}/>${pearl(65, 24, 2.2)}`);
  }
  // 5D (cấp 40+, tên KIM CƯƠNG; cấp 45 thừa hưởng): vầng tiên quang sau bảo tháp (tâm (0,18), r=15: quầng rộng mờ + vòng mảnh; y 3..33) + mỗi bên 1 dải tiên khí cuộn lên ngoài đảo nhỏ (x 58..71, y 9..33) + 2 hạt ngọc. Mọi điểm y ≥ 1, |x| ≤ 74, chân vẫn y=36.
  let haloKC = '';
  if (tier.name === 'KIM CƯƠNG') {
    haloKC = `<circle cx="0" cy="18" r="15" fill="none" stroke="${tier.accent || tier.light}" stroke-opacity="0.22" stroke-width="6"/>` +
      `<circle cx="0" cy="18" r="15" fill="none" stroke="${tier.light}" stroke-opacity="0.8" stroke-width="1.2"/>`;
    plus += mirror(
      `<path d="M58 33 C67 31 71 23 69 17 C67 12 60 13 62.5 18" ${line}/>` +
        `<path d="M60 28 C64 26.5 66.5 22 65 19" ${thin} stroke-opacity="0.7"/>` +
        pearl(70, 10, 2.4) + pearl(57, 24, 1.8)
    );
  }
  // 5D (cấp 50+, tên HUYỀN THOẠI; bậc sao 55–100 thừa hưởng): cầu vồng vắt qua sau tiên môn (đỉnh y=7: quầng rộng mờ + nét lõi) + mỗi bên 1 dải tiên khí cầu vồng cuộn lên ngoài cánh khí (x 56..72, y 9..33) + sao 4 cánh + 2 hạt ngọc. Mọi điểm y ≥ 1, |x| ≤ 76, chân vẫn y=36.
  let rbHT = '';
  if (tier.name === 'HUYỀN THOẠI') {
    rbHT = `<path d="M-66 34 Q0 -20 66 34" fill="none" stroke="url(#${P}rb)" stroke-opacity="0.28" stroke-width="7"/>` +
      `<path d="M-66 34 Q0 -20 66 34" fill="none" stroke="url(#${P}rb)" stroke-width="2.2" stroke-linecap="round"/>`;
    plus += mirror(
      `<path d="M58 33 C67 31 71 23 69 17 C67 12 60 13 62.5 18" ${line}/>` +
        `<path d="M70 4 L71.4 8.1 L75.5 9.5 L71.4 10.9 L70 15 L68.6 10.9 L64.5 9.5 L68.6 8.1 Z" fill="url(#${P}rb)" stroke="${dark}" stroke-width="0.7" stroke-linejoin="round"/>` +
        pearl(57, 24, 1.9) + pearl(74, 24, 1.6)
    );
  }
  // HUYỀN THOẠI ★2+ (cấp 60+, tier.star >= 2): mỗi bên 1 sao 4 cánh nhỏ phía trên cánh khí, dưới cầu vồng (tâm x=±54, y=6, cánh 4.8 → y ≥ 1.2, |x| ≤ 58.8): quầng mờ + sao màu nhấn viền tối + lõi trắng = 3 phần tử/bên (+6); cộng dồn cho các bậc sao sau
  if (tier.star >= 2) {
    const sa = tier.accent || '#ffffff';
    plus += mirror(`<circle cx="54" cy="6" r="7" fill="${sa}" fill-opacity="0.28"/><path d="M54 1.2 L55.4 4.6 L58.8 6 L55.4 7.4 L54 10.8 L52.6 7.4 L49.2 6 L52.6 4.6 Z" fill="${sa}" stroke="${dark}" stroke-width="0.9" stroke-linejoin="round"/><circle cx="54" cy="6" r="1.4" fill="#ffffff"/>`);
  }
  // HUYỀN THOẠI ★4+ (cấp 70+, tier.star >= 4): tia sáng toả SAU LƯNG tiên môn: 9 tia mảnh từ (0,32) góc -168°…-12° (cách 19.5°), dài tối đa 70 nhưng cắt để đầu tia ở y ≥ 4.5 (không điểm nào y < 0, |x| ≤ 70); vẽ TRƯỚC thân (nằm dưới), màu nhấn mờ + cầu vồng ở lõi = +2 path; cộng dồn cho các bậc sao sau
  let rays4 = '';
  if (tier.star >= 4) {
    let d = '';
    for (let k = 0; k < 9; k++) {
      const a = ((-168 + k * 19.5) * Math.PI) / 180;
      const len = Math.min(70, 27.5 / Math.max(0.2, -Math.sin(a)));
      d += `M${f(14 * Math.cos(a))} ${f(32 + 14 * Math.sin(a))} L${f(len * Math.cos(a))} ${f(32 + len * Math.sin(a))} `;
    }
    rays4 = `<path d="${d}" fill="none" stroke="${tier.accent || '#ffffff'}" stroke-opacity="0.28" stroke-width="5" stroke-linecap="round"/><path d="${d}" fill="none" stroke="url(#${P}rb)" stroke-opacity="0.9" stroke-width="1.8" stroke-linecap="round"/>`;
  }
  // HUYỀN THOẠI ★6+ (cấp 80+, tier.star >= 6): vương miện mini 3 mũi vàng nhạt #ffe9a6 đội trên cung cổng tiên môn, neo (0,10), đáy rộng 15, cao 8 (đỉnh y=2): thân + vạch đáy + 3 ngọc ở đầu mũi (y ≥ 0.8) + vệt sáng = 6 phần tử; vẽ SAU CÙNG (đè lên đoá sen đỉnh); cộng dồn tới ★10 (cấp 100 phóng 1.15x như macdinh)
  let crown6 = '';
  if (tier.star >= 6) {
    crown6 = `<path d="M-7.5 10 L-8.6 3 L-4.2 6.6 L0 2 L4.2 6.6 L8.6 3 L7.5 10 Z" fill="#ffe9a6" stroke="${dark}" stroke-width="1.1" stroke-linejoin="round"/>` +
      `<path d="M-7.3 8.2 H7.3" fill="none" stroke="${dark}" stroke-width="0.9" stroke-linecap="round"/>` +
      [[-8.6, 3], [0, 2], [8.6, 3]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2" fill="${tier.accent || '#ffffff'}" stroke="${dark}" stroke-width="0.7"/>`).join('') +
      `<path d="M-5 7.2 L-3.4 6.6" fill="none" stroke="#ffffff" stroke-width="1" stroke-linecap="round" stroke-opacity="0.9"/>`;
  }
  // HUYỀN THOẠI ★9+ (cấp 95+, tier.star >= 9): hào quang TRÒN sau đầu tiên môn: tâm (0,28) r=25 cắt phẳng ở chân y=36 (nửa trên; r lớn hơn bề rộng cổng ±20 nên vòng nhìn ra hai bên): đĩa mờ trắng-vàng + vòng vàng nhạt + vòng đứt trong r=20 = 3 phần tử; không điểm nào y < 3 (|x| ≤ 25); vẽ SAU tia ★4, TRƯỚC thân (nằm sau cổng); cộng dồn tới ★10
  let halo9 = '';
  if (tier.star >= 9) {
    halo9 = `<path d="M-23.7 36 A25 25 0 1 1 23.7 36 Z" fill="#fff3c4" fill-opacity="0.22"/><path d="M-23.7 36 A25 25 0 1 1 23.7 36" fill="none" stroke="#fff3c4" stroke-opacity="0.9" stroke-width="1.3"/><path d="M-18.3 36 A20 20 0 1 1 18.3 36" fill="none" stroke="#fff3c4" stroke-opacity="0.65" stroke-width="0.8" stroke-dasharray="2 2"/>`;
  }
  // TỐI THƯỢNG (cấp 100, tier.max): vương miện ★6 phóng 1.15× quanh đáy (0,10) (đỉnh y = 10 − 8·1.15 = 0.8 ≥ 0) + ngọc đỏ giữa vành + 2 SAO LỚN 4 cánh trắng-vàng hai bên (tâm x=±40, y=9, cánh 7.5 → y ≥ 1.5, |x| ≤ 47.5; cách sao ★2 ở x=±54 ≥ 1.7px) có quầng mờ + lõi trắng; thay vương miện ★6 bằng bản đặc biệt
  if (tier.max) {
    const st = `<circle cx="40" cy="9" r="9" fill="#fff3c4" fill-opacity="0.3"/><path d="M40 1.5 Q40 9 47.5 9 Q40 9 40 16.5 Q40 9 32.5 9 Q40 9 40 1.5 Z" fill="#fff3c4" stroke="${dark}" stroke-width="1" stroke-linejoin="round"/><circle cx="40" cy="9" r="2" fill="#ffffff"/>`;
    crown6 = `<g transform="translate(0 10) scale(1.15) translate(0 -10)">${crown6}<circle cx="0" cy="6.4" r="1.7" fill="#ff4d6d" stroke="${dark}" stroke-width="0.6"/></g>` + mirror(st);
  }
  return `${defs}${haloKC}${rbHT}${rays4}${halo9}${byName[tier.name] || ''}${plus}${crown6}`;
}

module.exports = { crestTop };
