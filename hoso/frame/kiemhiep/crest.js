// ===== hoso/frame/kiemhiep/crest.js — ĐỈNH hồ sơ KIẾM HIỆP =====
// Tự chứa. crestTop(tier, W, H) -> SVG (defs id 'kiemhiep-crest-'). Gốc giữa cạnh trên, x -80..80, y 0..36 (chân y=36).
// 6 bậc: Song kiếm bắt chéo · Lệnh bài + dải lụa · Đỉnh núi + kiếm cắm · Song đao + vòng bát quái · Chùa + trường kiếm + trăng · Ngũ kiếm toả quạt.
const f = (n) => Number(n.toFixed(2));
const mirror = (half) => `<g>${half}</g><g transform="scale(-1 1)">${half}</g>`;

function crestTop(tier, W, H) {
  const P = 'kiemhiep-crest-';
  const dark = tier.dark;
  const rb = Boolean(tier.rainbow);
  const defs =
    `<defs><linearGradient id="${P}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tier.light}"/><stop offset="0.55" stop-color="${tier.main}"/><stop offset="1" stop-color="${dark}"/></linearGradient>` +
    `<linearGradient id="${P}rb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff6b6b"/><stop offset="0.25" stop-color="#ffd93d"/><stop offset="0.5" stop-color="#6bffb8"/><stop offset="0.75" stop-color="#6bb8ff"/><stop offset="1" stop-color="#d96bff"/></linearGradient></defs>`;
  const fillG = rb ? `url(#${P}rb)` : `url(#${P}g)`;
  const fill = `fill="${fillG}" stroke="${dark}" stroke-width="1.4" stroke-linejoin="round"`;
  const line = `fill="none" stroke="${rb ? `url(#${P}rb)` : tier.light}" stroke-width="2" stroke-linecap="round"`;
  const thin = `fill="none" stroke="${dark}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"`;
  const red = `fill="${tier.accent}" stroke="${dark}" stroke-width="1" stroke-linejoin="round"`;

  // Kiếm: chuôi ở (0,0), mũi hướng lên dài len; xoay ang độ quanh điểm (px,py).
  const sword = (px, py, ang, len) =>
    `<g transform="translate(${px} ${py}) rotate(${ang})">` +
    `<path d="M-2.4 -6 L-1.6 ${-len + 5} L0 ${-len} L1.6 ${-len + 5} L2.4 -6 Z" ${fill}/><path d="M0 -7 V${-len + 6}" ${thin}/>` +
    `<path d="M-6.5 -5.5 L-5 -7.5 H5 L6.5 -5.5 Z" ${fill}/><rect x="-1.6" y="-5.5" width="3.2" height="5.5" ${red}/></g>`;
  // Đao: lưỡi cong (chém), chuôi ở (0,0).
  const dao = (px, py, ang, len) =>
    `<g transform="translate(${px} ${py}) rotate(${ang})">` +
    `<path d="M-2.4 -6 C-4 ${-len * 0.5} -1 ${-len * 0.9} 5 ${-len} C3 ${-len * 0.75} 3 ${-len * 0.4} 2.4 -6 Z" ${fill}/>` +
    `<rect x="-5" y="-7.5" width="10" height="2.4" ${fill}/><rect x="-1.6" y="-5.2" width="3.2" height="5.2" ${red}/></g>`;
  const base = mirror(`<path d="M0 36 H34 L38 33 H46" ${line}/>`); // vạch chân phẳng, gãy góc như nét bút lông

  // ĐỒNG — song kiếm bắt chéo
  const songKiem = sword(-9, 36, 28, 33) + sword(9, 36, -28, 33) + `<circle cx="0" cy="22" r="2.6" ${red}/>` + base;

  // BẠC — lệnh bài + dải lụa
  const lenh =
    mirror(`<path d="M6 24 C14 24 18 30 26 29 L24 33 C16 34 12 29 6 29 Z" ${red}/><path d="M14 30 L16 36 L21 32" ${red}/>`) +
    `<path d="M-11 36 V12 L0 4 L11 12 V36 Z" ${fill}/><path d="M-7 33 V13.5 L0 8 L7 13.5 V33 Z" ${thin}/>` +
    `<circle cx="0" cy="14" r="2.6" fill="${tier.accent}" stroke="${dark}" stroke-width="1"/><path d="M-4 22 H4 M-4 26 H4 M0 20 V30" ${thin}/>` + base;

  // VÀNG — đỉnh núi + kiếm cắm
  const nui =
    `<path d="M-46 36 L-30 20 L-24 25 L-12 12 L-3 36 Z M46 36 L30 20 L24 25 L12 12 L3 36 Z" ${fill}/>` +
    `<path d="M-20 36 L-8 24 L0 31 L8 24 L20 36 Z" ${fill}/>` +
    `<path d="M-12 12 L-9 18 L-14 17 M12 12 L9 18 L14 17" ${thin}/>` +
    sword(0, 30, 0, 29) + base;

  // BẠCH KIM — song đao + vòng bát quái
  const o8 = (r) => [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `${f(Math.cos(((i * 45 + 22.5) * Math.PI) / 180) * r)} ${f(18 + Math.sin(((i * 45 + 22.5) * Math.PI) / 180) * r)}`).join(' L');
  const songDao =
    mirror(dao(-4, 36, -58, 38)) +
    `<path d="M${o8(13)} Z" ${fill}/><path d="M${o8(8)} Z" ${thin}/><circle cx="0" cy="18" r="3.4" ${red}/>` +
    `<path d="M-3 5 H3 M-3 8 H-1 M1 8 H3" ${thin}/>` + base;

  // KIM CƯƠNG — chùa 3 tầng + trường kiếm + trăng
  const mai = (y, w) => `<path d="M${-w - 5} ${y} L${-w} ${y - 4} H${w} L${w + 5} ${y} Z" ${fill}/>`;
  const chua =
    sword(0, 36, 0, 36) +
    `<path d="M-9 36 V28 H9 V36 Z" ${fill}/>` + mai(28, 9) +
    `<path d="M-7 28 V21 H7 V28" ${fill}/>` + mai(21, 7) +
    `<path d="M-5 21 V15 H5 V21" ${fill}/>` + mai(15, 5) +
    `<path d="M-14 36 L-15 31 L-9 33 M14 36 L15 31 L9 33" ${thin}/>` +
    `<path d="M44 4 A14 14 0 0 0 44 32 A16 16 0 0 1 44 4 Z" ${fill}/>` +
    `<circle cx="-40" cy="12" r="1.6" fill="${tier.accent}"/><circle cx="-30" cy="20" r="1.2" fill="${tier.accent}"/>` + base;

  // HUYỀN THOẠI — ngũ kiếm toả như quạt
  const ngu = [-72, -36, 0, 36, 72].map((a, i) => sword(0, 36, a, i === 2 ? 36 : 33)).join('') +
    `<circle cx="0" cy="34" r="5" fill="${tier.accent}" stroke="${dark}" stroke-width="1.2"/><circle cx="0" cy="34" r="1.8" fill="${dark}"/>`;

  const byName = { 'ĐỒNG': songKiem, 'BẠC': lenh, 'VÀNG': nui, 'BẠCH KIM': songDao, 'KIM CƯƠNG': chua, 'HUYỀN THOẠI': ngu };
  // Nửa bậc + (VÀNG II, cấp 25): núi + kiếm cắm y hệt + dải lụa đỏ buộc dưới chuôi kiếm (buông dọc 2 bên, đối xứng)
  // + 2 vệt kiếm khí nhỏ cạnh mũi kiếm. y ≥ 0, chân vẫn y=36.
  let plus = '';
  if (tier.step === 1 && tier.name === 'VÀNG' && !tier.star) {
    const ribbon = (sx) =>
      `<path d="M${2 * sx} 28 C${7 * sx} 30 ${9 * sx} 34 ${6 * sx} 36" fill="none" stroke="${dark}" stroke-width="2.6" stroke-linecap="round"/>` +
      `<path d="M${2 * sx} 28 C${7 * sx} 30 ${9 * sx} 34 ${6 * sx} 36" fill="none" stroke="${tier.accent}" stroke-width="1.5" stroke-linecap="round"/>`;
    const qi = (sx) => `<path d="M${3 * sx} 4 Q${8 * sx} 1 ${12 * sx} 5" fill="none" stroke="${tier.light}" stroke-opacity="0.8" stroke-width="1.3" stroke-linecap="round"/>`;
    plus = ribbon(1) + ribbon(-1) + qi(1) + qi(-1) + `<circle cx="0" cy="24.5" r="1.8" fill="${tier.accent}" stroke="${dark}" stroke-width="0.8"/>`;
  }
  // 5D (cấp 40+, tên KIM CƯƠNG; cấp 45 thừa hưởng): vầng kiếm quang sau chùa (tâm (0,19), r=17: quầng rộng mờ + vòng mảnh; y 2..36) + mỗi bên 1 thanh kiếm cắm đứng ngoài trăng/hạt (lưỡi x 64..70, y 8..33 + chắn kiếm + hạt ngọc). Mọi điểm y ≥ 1, |x| ≤ 76, chân vẫn y=36.
  let haloKC = '';
  if (tier.name === 'KIM CƯƠNG') {
    haloKC = `<circle cx="0" cy="19" r="17" fill="none" stroke="${tier.accent || tier.light}" stroke-opacity="0.22" stroke-width="6"/>` +
      `<circle cx="0" cy="19" r="17" fill="none" stroke="${tier.light}" stroke-opacity="0.8" stroke-width="1.2"/>`;
    plus += mirror(
      `<path d="M64 33 L67 8 L70 33 Z" ${fill}/>` +
        `<path d="M67 11 V30" ${thin} stroke-opacity="0.6"/>` +
        `<path d="M60 31 H74" fill="none" stroke="${dark}" stroke-width="3.4" stroke-linecap="round"/><path d="M60 31 H74" fill="none" stroke="${tier.accent || tier.light}" stroke-width="1.8" stroke-linecap="round"/>` +
        `<circle cx="67" cy="5.2" r="2.1" fill="${tier.accent || tier.light}" stroke="${dark}" stroke-width="0.8"/>`
    );
  }
  // 5D (cấp 50+, tên HUYỀN THOẠI; bậc sao 55–100 thừa hưởng): cầu vồng vắt sau quạt ngũ kiếm (đỉnh y=7: quầng mờ + nét lõi) + mỗi bên 1 thanh kiếm cắm đứng màu cầu vồng ngoài quạt (lưỡi x 64..70, y 8..33 + chắn kiếm + hạt trắng) + 1 sao 4 cánh (x 46..54, y 8..16). Mọi điểm y ≥ 1, |x| ≤ 76, chân vẫn y=36.
  let rbHT = '';
  if (tier.name === 'HUYỀN THOẠI') {
    rbHT = `<path d="M-66 34 Q0 -20 66 34" fill="none" stroke="url(#${P}rb)" stroke-opacity="0.28" stroke-width="7"/>` +
      `<path d="M-66 34 Q0 -20 66 34" fill="none" stroke="url(#${P}rb)" stroke-width="2.2" stroke-linecap="round"/>`;
    plus += mirror(
      `<path d="M64 33 L67 8 L70 33 Z" ${fill}/>` +
        `<path d="M67 11 V30" ${thin} stroke-opacity="0.6"/>` +
        `<path d="M60 31 H74" fill="none" stroke="${dark}" stroke-width="3.4" stroke-linecap="round"/><path d="M60 31 H74" fill="none" stroke="url(#${P}rb)" stroke-width="1.8" stroke-linecap="round"/>` +
        `<circle cx="67" cy="5.2" r="2.1" fill="#ffffff" stroke="${dark}" stroke-width="0.8"/>` +
        `<path d="M50 8 L51.2 11.6 L54.8 12.8 L51.2 14 L50 17.6 L48.8 14 L45.2 12.8 L48.8 11.6 Z" fill="url(#${P}rb)" stroke="${dark}" stroke-width="0.7" stroke-linejoin="round"/>`
    );
  }
  // HUYỀN THOẠI ★2+ (cấp 60+, tier.star >= 2): mỗi bên 1 sao 4 cánh nhỏ trên cánh quạt ngũ kiếm, trên cung cầu vồng (tâm x=±36, y=6, cánh 5 → y ≥ 1, |x| ≤ 41; cách sao 5D ở x≈50 ≥ 4px): quầng mờ + sao màu nhấn viền tối + lõi trắng = 3 phần tử/bên (+6); cộng dồn tới TỐI THƯỢNG
  if (tier.star >= 2) {
    const sa = tier.accent || '#ffffff';
    plus += mirror(`<circle cx="36" cy="6" r="7" fill="${sa}" fill-opacity="0.28"/><path d="M36 1 L37.5 4.5 L41 6 L37.5 7.5 L36 11 L34.5 7.5 L31 6 L34.5 4.5 Z" fill="${sa}" stroke="${dark}" stroke-width="0.9" stroke-linejoin="round"/><circle cx="36" cy="6" r="1.4" fill="#ffffff"/>`);
  }
  // HUYỀN THOẠI ★4+ (cấp 70+, tier.star >= 4): 9 tia kiếm quang toả SAU LƯNG ngũ kiếm từ (0,32), góc -168°…-12° (cách 19.5°), cắt để đầu tia ở y ≥ 4.5; vẽ TRƯỚC thân; màu nhấn mờ + cầu vồng lõi = 2 path; cộng dồn tới TỐI THƯỢNG
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
  // HUYỀN THOẠI ★9+ (cấp 95+, tier.star >= 9): hào quang TRÒN sau quạt ngũ kiếm: tâm (0,34) r=30 cắt phẳng ở chân y=36 (y ≥ 4): đĩa mờ trắng-vàng + vòng vàng nhạt + vòng đứt trong r=24 = 3 phần tử; vẽ SAU tia ★4, TRƯỚC thân
  let halo9 = '';
  if (tier.star >= 9) {
    halo9 = `<path d="M-29.9 36 A30 30 0 1 1 29.9 36 Z" fill="#fff3c4" fill-opacity="0.2"/><path d="M-29.9 36 A30 30 0 1 1 29.9 36" fill="none" stroke="#fff3c4" stroke-opacity="0.9" stroke-width="1.3"/><path d="M-23.9 36 A24 24 0 1 1 23.9 36" fill="none" stroke="#fff3c4" stroke-opacity="0.65" stroke-width="0.8" stroke-dasharray="2 2"/>`;
  }
  // HUYỀN THOẠI ★6+ (cấp 80+, tier.star >= 6): vương miện mini 3 mũi vàng nhạt #ffe9a6 đội trên đầu thanh kiếm giữa của quạt, neo (0,11), đáy rộng 15, cao 8 (đỉnh y=3): thân + vạch đáy + 3 ngọc ở đầu mũi + vệt sáng = 6 phần tử; vẽ SAU CÙNG; cộng dồn tới ★10
  let crown6 = '';
  if (tier.star >= 6) {
    crown6 = `<path d="M-7.5 11 L-8.6 4 L-4.2 7.6 L0 3 L4.2 7.6 L8.6 4 L7.5 11 Z" fill="#ffe9a6" stroke="${dark}" stroke-width="1.1" stroke-linejoin="round"/>` +
      `<path d="M-7.3 9.2 H7.3" fill="none" stroke="${dark}" stroke-width="0.9" stroke-linecap="round"/>` +
      [[-8.6, 4], [0, 3], [8.6, 4]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2" fill="${tier.accent || '#ffffff'}" stroke="${dark}" stroke-width="0.7"/>`).join('') +
      `<path d="M-5 8.2 L-3.4 7.6" fill="none" stroke="#ffffff" stroke-width="1" stroke-linecap="round" stroke-opacity="0.9"/>`;
  }
  // TỐI THƯỢNG (cấp 100, tier.max): vương miện ★6 phóng 1.15× quanh đáy (0,11) (đỉnh y = 11 − 8·1.15 = 1.8 ≥ 0) + ngọc đỏ giữa vành + 2 SAO LỚN 4 cánh trắng-vàng (tâm x=±46, y=25, cánh 7.5; dưới cung cầu vồng, ngoài đầu quạt, trong thanh kiếm cắm x 64..70) quầng mờ + lõi trắng
  if (tier.max) {
    const st = `<circle cx="46" cy="25" r="9" fill="#fff3c4" fill-opacity="0.3"/><path d="M46 17.5 Q46 25 53.5 25 Q46 25 46 32.5 Q46 25 38.5 25 Q46 25 46 17.5 Z" fill="#fff3c4" stroke="${dark}" stroke-width="1" stroke-linejoin="round"/><circle cx="46" cy="25" r="2" fill="#ffffff"/>`;
    crown6 = `<g transform="translate(0 11) scale(1.15) translate(0 -11)">${crown6}<circle cx="0" cy="7" r="1.7" fill="#ff4d6d" stroke="${dark}" stroke-width="0.6"/></g>` + mirror(st);
  }
  return `${defs}${haloKC}${rbHT}${rays4}${halo9}${byName[tier.name] || ''}${plus}${crown6}`;
}

module.exports = { crestTop };
