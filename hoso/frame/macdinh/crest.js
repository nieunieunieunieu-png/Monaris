// ===== hoso/frame/macdinh/crest.js — ĐỈNH hồ sơ (khung mặc định: 6 linh vật thần thoại) =====
// Tự chứa, không require file khác. crestTop(tier, W, H) -> chuỗi SVG (có <defs> id tiền tố 'macdinh-crest-').
// Toạ độ cục bộ: gốc giữa cạnh trên thẻ, x -80..80, y 0..36 (chân y=36). Phần ghép (translate/scale) do compose.js làm.

const f = (n) => Number(n.toFixed(2));

// Vẽ 1 nửa (x >= 0) rồi lật gương sang nửa còn lại.
const mirror = (half) => `<g>${half}</g><g transform="scale(-1 1)">${half}</g>`;

// 1 chiếc lông/cánh/đuôi hình lá, gốc ở (0,0) chỉ sang phải, dài len, rộng wid; xoay ang độ quanh (px,py).
function leaf(px, py, ang, len, wid, style) {
  const d = `M0 0 C${f(len * 0.25)} ${f(-wid)} ${f(len * 0.75)} ${f(-wid * 0.9)} ${len} 0 C${f(len * 0.75)} ${f(wid * 0.9)} ${f(len * 0.25)} ${f(wid)} 0 0 Z`;
  return `<path transform="translate(${px} ${py}) rotate(${ang})" d="${d}" ${style}/>`;
}


function crestTop(tier, W, H) {
  const dark = tier.dark;
  const rainbow = Boolean(tier.rainbow);
  const fillG = rainbow ? 'url(#macdinh-crest-rb)' : 'url(#macdinh-crest-g)';
  const fill = `fill="${fillG}" stroke="${dark}" stroke-width="1.4" stroke-linejoin="round"`;
  const line = `fill="none" stroke="${rainbow ? 'url(#macdinh-crest-rb)' : tier.light}" stroke-width="2" stroke-linecap="round"`;
  const thin = `fill="none" stroke="${dark}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"`;
  const eye = `fill="#ffffff" stroke="${dark}" stroke-width="1"`;

  const defs =
    `<defs>` +
    `<linearGradient id="macdinh-crest-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tier.light}"/><stop offset="0.55" stop-color="${tier.main}"/><stop offset="1" stop-color="${dark}"/></linearGradient>` +
    `<linearGradient id="macdinh-crest-rb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff6b6b"/><stop offset="0.25" stop-color="#ffd93d"/><stop offset="0.5" stop-color="#6bffb8"/><stop offset="0.75" stop-color="#6bb8ff"/><stop offset="1" stop-color="#d96bff"/></linearGradient>` +
    `</defs>`;

  // ---------- từng linh vật (gốc toạ độ = giữa cạnh trên thẻ, y xuống dưới, cao tối đa ~36) ----------
  const wavesHalf = `<path d="M44 30 C48 22 58 22 60 29 C61 33 56 34 55 30" ${line}/><path d="M64 31 C70 25 80 26 82 31" ${line}/>`;

  // Đồng — Thần Quy (rùa thần): mai có hoa văn lục giác, đầu ngẩng, sóng nước hai bên.
  const quy =
    mirror(wavesHalf) +
    `<path d="M-25 31 C-25 11 -11 5 3 5 C18 5 29 13 29 31 Z" ${fill}/>` +
    `<path d="M-8 31 L-5 13 L7 9 L14 20 L11 31 M-5 13 L-15 21 L-17 31 M7 9 L2 5 M14 20 L27 21 M-15 21 L-5 13" ${thin}/>` +
    `<path d="M29 26 C35 23 41 19 47 21 C52 23 50 29 43 30 C38 31 33 31 29 31 Z" ${fill}/>` +
    `<circle cx="45" cy="24.5" r="1.8" fill="${dark}"/>` +
    `<ellipse cx="-14" cy="32" rx="7" ry="3.2" ${fill}/><ellipse cx="17" cy="32" rx="7" ry="3.2" ${fill}/>` +
    `<path d="M-25 27 C-32 29 -36 27 -38 22" ${thin}/>`;

  // Bạc — Bạch Hổ: mặt hổ nhìn thẳng, chữ Vương trên trán, râu bay.
  const hoHalf =
    `<path d="M9 9 L21 2 L22 16 Z" ${fill}/>` +
    `<path d="M0 4 C10 4 18 10 18 20 C18 28 10 34 0 34 Z" ${fill}/>` +
    `<path d="M18 15 L12 17 M18 21 L11 22 M17 26 L11 26" ${thin}/>` +
    `<path d="M5 19 L13 15.5 L12 21 Z" ${eye}/><circle cx="10.5" cy="18.4" r="1.2" fill="${dark}"/>` +
    `<path d="M0 28 L4 30.5 C6 32 8 31 9 29.5" ${thin}/>` +
    `<path d="M20 25 C30 22 38 25 46 22 M20 29 C30 30 38 34 47 31" ${line}/>` +
    `<path d="M52 27 C56 20 64 21 64 27 C64 31 58 31 58 27" ${line}/>`;
  const ho =
    mirror(hoHalf) +
    `<path d="M-4 8 H4 M-3 11.5 H3 M0 8 V15" ${thin}/>` +
    `<path d="M-3.5 25 H3.5 L0 29 Z" fill="${dark}"/>`;

  // Vàng — Phượng Hoàng: hai cánh giương cao như ngọn lửa, đầu có mào, đuôi 3 dải lông dài uốn lượn.
  const phuongHalf =
    [-78, -62, -46, -30, -14].map((ang, i) => leaf(6, 27, ang, 33 - Math.abs(i - 1) * 2, 4.6, fill)).join('') +
    "<path d='M5 28 C12 34 20 36 30 34 C22 40 12 40 4 34 Z' " + fill + "/>" +
    "<path d='M3 33 C8 41 16 44 26 46 C16 48 6 44 1 36 Z' " + fill + "/>";
  const phuong =
    mirror(phuongHalf) +
    "<path d='M-3 33 C-6 40 3 44 0 50 C-1 44 -9 40 -3 33 Z M3 33 C6 40 -3 44 0 50' " + fill + "/>" +
    "<path d='M0 14 C8 18 9 30 0 38 C-9 30 -8 18 0 14 Z' " + fill + "/>" +
    "<circle cx='0' cy='13' r='5.6' " + fill + "/>" +
    "<path d='M-2 7.5 C-3 3 -6 0 -9 -2 M2 7.5 C3 3 6 0 9 -2 M0 7.5 V-1' " + line + "/>" +
    "<path d='M-2.8 16 L0 21 L2.8 16 Z' fill='" + dark + "'/>" +
    "<circle cx='-2.4' cy='12.2' r='1.1' fill='" + dark + "'/><circle cx='2.4' cy='12.2' r='1.1' fill='" + dark + "'/>";

  // Bạch Kim — Cửu Vĩ Hồ: chín chiếc đuôi cuộn như ngọn lửa toả sau đầu cáo.
  const tail9 = (ang, len) =>
    "<path transform='translate(0 34) rotate(" + ang + ")' d='M0 0 C" + f(len * 0.3) + " " + f(-len * 0.28) + " " + f(len * 0.72) + " " + f(-len * 0.34) + " " + len + " " + f(-len * 0.16) + " C" + f(len * 0.72) + " " + f(len * 0.02) + " " + f(len * 0.3) + " " + f(len * 0.12) + " 0 0 Z' " + fill + "/>";
  const tailAngles = [-88, -66, -44, -22];
  const tailHalf = tailAngles.map((a, i) => tail9(a, 36 - i * 1.5)).join('');
  const ho9 =
    "<g transform='scale(-1 1)'>" + tailHalf + "</g>" + tailHalf + tail9(-90, 36) +
    "<path d='M-14 17 L-10.5 6 L-4 13 L4 13 L10.5 6 L14 17 L11 26 L0 35 L-11 26 Z' " + fill + "/>" +
    "<path d='M-10 18.5 L-4 20 L-5.5 22.5 Z M10 18.5 L4 20 L5.5 22.5 Z' fill='" + dark + "'/>" +
    "<path d='M-2.6 28.5 H2.6 L0 31.5 Z' fill='" + dark + "'/>" +
    "<path d='M-8.5 9 L-7 12.5 M8.5 9 L7 12.5' " + thin + "/>";

  // Rồng (Kim Cương, và là đầu của Long Phụng): sừng chẻ nhánh, mày dữ, mũi rộng, bờm lửa hai bên, râu dài, ngọc trên trán.
  const rongHalf = (long) =>
    "<path d='M9 9 C11 3 19 1 26 -2 C24 2 22 4 19 5 C23 4 27 5 30 3 C27 7 22 8 17 9.5 C14 10.5 12 13 11 16 Z' " + fill + "/>" +
    "<path d='M15 17 L23 14 L19.5 19 L26 21 L18 24 L22 29 L14 27 Z' " + fill + "/>" +
    "<path d='M0 5 C8 5 14 9 15 15 C16 19 14 21 13 23 C15 27 13 32 9 34 C6 36 3 36 0 36 Z' " + fill + "/>" +
    "<path d='M3 14 L14 9.5' fill='none' stroke='" + dark + "' stroke-width='2' stroke-linecap='round'/>" +
    "<path d='M5 18 L13 14.5 L11.5 20 Z' " + eye + "/><circle cx='10.6' cy='17' r='1.2' fill='" + dark + "'/>" +
    "<circle cx='4.6' cy='29' r='1.7' fill='" + dark + "'/>" +
    "<path d='M3 33 L5.5 38 L8 32.5 Z' fill='#ffffff' stroke='" + dark + "' stroke-width='0.8'/>" +
    "<path d='M14 24 C" + (long ? 26 : 24) + " 22 " + (long ? 34 : 30) + " 31 " + (long ? 48 : 42) + " 26 C" + (long ? 58 : 50) + " 23 " + (long ? 66 : 56) + " 29 " + (long ? 78 : 62) + " 25' " + line + "/>" +
    "<path d='M12 29 C23 31 30 38 42 35' " + line + "/>";
  const rong =
    mirror(rongHalf(false)) +
    "<path d='M-4 25 C-2 22.5 2 22.5 4 25 C2 27.5 -2 27.5 -4 25 Z' fill='" + dark + "' fill-opacity='0.8'/>" +
    "<circle cx='0' cy='9' r='3.6' fill='" + (rainbow ? 'url(#macdinh-crest-rb)' : '#ffffff') + "' stroke='" + dark + "' stroke-width='1'/>";

  // Huyền Thoại — Long Phụng: đầu rồng ở giữa, hai cánh phượng toả hai bên (màu cầu vồng).
  const wings = [-40, -22, -5, 12].map((a, i) => leaf(18, 26, a, 58 - i * 5, 5.4, fill)).join('');
  const longPhung =
    mirror(wings) +
    mirror(rongHalf(true)) +
    `<circle cx="0" cy="9" r="3.8" fill="url(#macdinh-crest-rb)" stroke="${dark}" stroke-width="1"/>` +
    `<path d="M-3.5 24.5 C-2 22 2 22 3.5 24.5 C2 26.5 -2 26.5 -3.5 24.5 Z" fill="${dark}" fill-opacity="0.8"/>`;

  const byName = { 'ĐỒNG': quy, 'BẠC': ho, 'VÀNG': phuong, 'BẠCH KIM': ho9, 'KIM CƯƠNG': rong, 'HUYỀN THOẠI': longPhung };
  // Nửa bậc + (ĐỒNG II, cấp 5): vẽ y hệt Thần Quy rồi thêm 1 viên ngọc trên đỉnh mai, 1 vệt sáng trên mai và mỗi bên 1 tia sáng 4 cánh + 1 hạt (đối xứng; y ≥ 0, chân vẫn y=36).
  let plus = '';
  if (tier.step === 1 && tier.name === 'ĐỒNG' && !tier.star) {
    const acc = tier.accent || tier.light;
    const spark = `<path d="M40 3 L41.8 8.2 L47 10 L41.8 11.8 L40 17 L38.2 11.8 L33 10 L38.2 8.2 Z" fill="${acc}" stroke="${dark}" stroke-width="0.7" stroke-linejoin="round"/><circle cx="58" cy="14" r="1.8" fill="${tier.light}"/>`;
    plus = mirror(spark) +
      `<circle cx="3" cy="4" r="2.6" fill="${acc}" stroke="${dark}" stroke-width="0.9"/>` +
      `<path d="M-17 17 C-13 11 -7 8 -2 8" fill="none" stroke="${tier.light}" stroke-opacity="0.85" stroke-width="1.6" stroke-linecap="round"/>`;
  }
  // 5D (cấp 40+, tên KIM CƯƠNG; cấp 45 thừa hưởng): mỗi bên 1 ngọc châu bốc lửa lơ lửng hai bên rồng (x 40..52, y 3..19) + đuôi mây cuộn dưới râu (y 31..36) + 2 hạt sáng; trên trán rồng thêm ngọn lửa ngọc nhỏ (y 1..6). Mọi điểm y ≥ 1, |x| ≤ 56, chân vẫn y=36.
  let kc = '';
  if (tier.name === 'KIM CƯƠNG') {
    const acc = tier.accent || tier.light;
    kc = mirror(
      `<path d="M46 3 C50.5 8 53 12.5 46 19.5 C39 12.5 41.5 8 46 3 Z" fill="url(#macdinh-crest-g)" stroke="${tier.light}" stroke-width="1.2" stroke-linejoin="round"/>` +
        `<path d="M46 9 C47.8 11.5 47.8 14 46 16.5 C44.2 14 44.2 11.5 46 9 Z" fill="#ffffff" fill-opacity="0.85"/>` +
        `<path d="M24 34 C32 30 40 34.5 56 30.5" fill="none" stroke="${tier.light}" stroke-opacity="0.85" stroke-width="1.6" stroke-linecap="round"/>` +
        `<circle cx="56" cy="30.5" r="1.7" fill="${acc}" stroke="${dark}" stroke-width="0.8"/>`
    ) + `<path d="M-3.4 6.6 C-2.6 3.8 -0.8 2.4 0 1 C0.8 2.4 2.6 3.8 3.4 6.6 Z" fill="${acc}" stroke="${dark}" stroke-width="0.8" stroke-linejoin="round"/>`;
  }
  // 5D (cấp 50+, tên HUYỀN THOẠI; bậc sao 55–100 thừa hưởng): vầng hào quang cầu vồng sau đầu Long Phụng (tâm (0,19), r=17: quầng rộng mờ + vòng lõi; y 2..36) + mỗi bên 2 sao 4 cánh cầu vồng ngoài cánh phượng (x 66..77, y 6..32) + hạt sáng. Mọi điểm y ≥ 1, |x| ≤ 78, chân vẫn y=36.
  let haloHT = '';
  let starsHT = '';
  if (tier.name === 'HUYỀN THOẠI') {
    const st4 = (cx, cy, r) => `<path d="M${cx} ${cy - r} L${f(cx + r * 0.28)} ${f(cy - r * 0.28)} L${cx + r} ${cy} L${f(cx + r * 0.28)} ${f(cy + r * 0.28)} L${cx} ${cy + r} L${f(cx - r * 0.28)} ${f(cy + r * 0.28)} L${cx - r} ${cy} L${f(cx - r * 0.28)} ${f(cy - r * 0.28)} Z" fill="url(#macdinh-crest-rb)" stroke="${dark}" stroke-width="0.8" stroke-linejoin="round"/>`;
    haloHT = `<circle cx="0" cy="19" r="17" fill="none" stroke="url(#macdinh-crest-rb)" stroke-opacity="0.28" stroke-width="7"/>` +
      `<circle cx="0" cy="19" r="17" fill="none" stroke="url(#macdinh-crest-rb)" stroke-width="2.2"/>`;
    starsHT = mirror(st4(71, 25, 6) + st4(73.5, 9, 3.6) + `<circle cx="66" cy="16" r="1.5" fill="#ffffff"/><circle cx="76" cy="32" r="1.4" fill="#ffffff"/>`);
  }
  // HUYỀN THOẠI ★2+ (cấp 60+, tier.star >= 2): mỗi bên 1 sao 4 cánh nhỏ trên cánh phượng (tâm x=±60, y=8, cánh 5.5 → y ≥ 2.5, |x| ≤ 65.5): quầng mờ + sao màu nhấn viền tối + lõi trắng = 3 phần tử/bên (+6); cộng dồn cho các bậc sao sau
  let star2 = '';
  if (tier.star >= 2) {
    const sa = tier.accent || '#ffffff';
    star2 = mirror(`<circle cx="60" cy="8" r="8" fill="${sa}" fill-opacity="0.28"/><path d="M60 2.5 L61.5 6.5 L65.5 8 L61.5 9.5 L60 13.5 L58.5 9.5 L54.5 8 L58.5 6.5 Z" fill="${sa}" stroke="${dark}" stroke-width="0.9" stroke-linejoin="round"/><circle cx="60" cy="8" r="1.5" fill="#ffffff"/>`);
  }
  // HUYỀN THOẠI ★4+ (cấp 70+, tier.star >= 4): tia sáng toả SAU LƯNG linh vật: 9 tia mảnh từ (0,32) góc -168°…-12° (cách 19.5°), dài tới 70 nhưng cắt để đầu tia ở y ≥ 4.5 (không điểm nào y < 0, |x| ≤ 70); vẽ TRƯỚC thân (nằm dưới), màu nhấn mờ + cầu vồng ở lõi = +2 phần tử (2 path gộp tia); cộng dồn cho các bậc sao sau
  let rays4 = '';
  if (tier.star >= 4) {
    let d = '';
    for (let k = 0; k < 9; k++) {
      const a = ((-168 + k * 19.5) * Math.PI) / 180;
      const len = Math.min(70, 27.5 / Math.max(0.2, -Math.sin(a)));
      d += `M${f(14 * Math.cos(a))} ${f(32 + 14 * Math.sin(a))} L${f(len * Math.cos(a))} ${f(32 + len * Math.sin(a))} `;
    }
    rays4 = `<path d="${d}" fill="none" stroke="${tier.accent || '#ffffff'}" stroke-opacity="0.28" stroke-width="5" stroke-linecap="round"/><path d="${d}" fill="none" stroke="url(#macdinh-crest-rb)" stroke-opacity="0.9" stroke-width="1.8" stroke-linecap="round"/>`;
  }
  // HUYỀN THOẠI ★6+ (cấp 80+, tier.star >= 6): vương miện mini 3 mũi (vàng nhạt #ffe9a6) đội trên đầu Long Phụng, đặt SAU cùng (đè lên trán/sừng ở giữa đầu): neo (0, 10) đáy rộng 15, cao 8 (đỉnh y = 2 → không điểm nào y < 0), viền tối + 3 ngọc nhỏ ở đầu mũi + vệt sáng = 6 phần tử; cộng dồn cho các bậc sau
  let crown = '';
  if (tier.star >= 6) {
    const cx = 0, cy = 10, hw = 7.5, h = 8;
    const d = `M${f(cx - hw)} ${cy} L${f(cx - hw - 1)} ${f(cy - h * 0.7)} L${f(cx - hw * 0.5)} ${f(cy - h * 0.35)} L${cx} ${f(cy - h)} L${f(cx + hw * 0.5)} ${f(cy - h * 0.35)} L${f(cx + hw + 1)} ${f(cy - h * 0.7)} L${f(cx + hw)} ${cy} Z`;
    crown = `<path d="${d}" fill="#ffe9a6" stroke="${tier.dark}" stroke-width="1.1" stroke-linejoin="round"/>` +
      `<path d="M${f(cx - hw + 1.5)} ${f(cy - 1.8)} H${f(cx + hw - 1.5)}" stroke="${tier.dark}" stroke-opacity="0.45" stroke-width="1" stroke-linecap="round"/>` +
      [[cx - hw - 1, cy - h * 0.7, '#ff8fb3'], [cx, cy - h, '#6bb8ff'], [cx + hw + 1, cy - h * 0.7, '#ff8fb3']].map(([gx, gy, gc]) => `<circle cx="${f(gx)}" cy="${f(gy)}" r="1.5" fill="${gc}" stroke="${tier.dark}" stroke-width="0.6"/>`).join('') +
      `<path d="M${f(cx - 3.5)} ${f(cy - 4.2)} L${f(cx - 1.5)} ${f(cy - 6.4)}" stroke="#ffffff" stroke-width="1" stroke-linecap="round"/>`;
  }
  // HUYỀN THOẠI ★9+ (cấp 95+, tier.star >= 9): hào quang tròn lớn sau đầu Long Phụng: tâm (0,21) r=19 (đỉnh y=2 ≥ 0) = 3 phần tử (đĩa mờ trắng-vàng + vòng vàng nhạt ngoài + vòng đứt mảnh trong r=12.5); vẽ TRƯỚC thân (dưới linh vật), trên vầng cầu vồng 5D; cộng dồn cho cấp 100
  let halo9 = '';
  if (tier.star >= 9) {
    halo9 = `<circle cx="0" cy="21" r="19" fill="#fff3c4" fill-opacity="0.3"/><circle cx="0" cy="21" r="19" fill="none" stroke="#ffe9a6" stroke-opacity="0.7" stroke-width="1.2"/><circle cx="0" cy="21" r="12.5" fill="none" stroke="#ffe9a6" stroke-opacity="0.5" stroke-width="0.8" stroke-dasharray="2.4 2.4"/>`;
  }
  // TỐI THƯỢNG (cấp 100, tier.max): vương miện ★6 phóng 1.15× quanh đáy (0,10) (đỉnh y = 10 − 8·1.15 = 0.8 ≥ 0; 1.3× sẽ chui y < 0) + ngọc đỏ lớn giữa vành + 2 SAO LỚN 4 cánh trắng-vàng hai bên (x=±46, y=11, cánh 9 → y ≥ 2, |x| ≤ 55; cách sao ★2 ở x=±60) có quầng mờ + lõi trắng; thay vương miện ★6 bằng bản đặc biệt
  if (tier.max) {
    const k = 1.15;
    const st = `<circle cx="46" cy="11" r="11" fill="#fff3c4" fill-opacity="0.3"/><path d="M46 2 Q46 11 55 11 Q46 11 46 20 Q46 11 37 11 Q46 11 46 2 Z" fill="#fff3c4" stroke="${tier.dark}" stroke-width="1" stroke-linejoin="round"/><circle cx="46" cy="11" r="2.2" fill="#ffffff"/>`;
    crown = `<g transform="translate(0 10) scale(${k}) translate(0 -10)">${crown}<circle cx="0" cy="6.4" r="1.7" fill="#ff4d6d" stroke="${tier.dark}" stroke-width="0.6"/></g>` + mirror(st);
  }
  return `${defs}${haloHT}${halo9}${rays4}${byName[tier.name] || ''}${plus}${kc}${starsHT}${star2}${crown}`;

}

module.exports = { crestTop };
