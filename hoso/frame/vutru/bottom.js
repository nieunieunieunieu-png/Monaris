// hoso/frame/vutru/bottom.js — hoạ tiết CẠNH DƯỚI phong cách Vũ trụ: hành tinh nhỏ ở giữa + các vành đai đối xứng + sao hai đầu
// Gốc toạ độ: giữa mép dưới thẻ, y xuống dưới. Cục bộ cao <= 16, nửa rộng <= 73 (compose.js scale 1.5, lề dưới 34px).
// Chữ ký: decorBottom(tier, W, H) -> chuỗi SVG. File tự chứa, không require file khác.

const ORDER = ['ĐỒNG', 'BẠC', 'VÀNG', 'BẠCH KIM', 'KIM CƯƠNG', 'HUYỀN THOẠI'];
const P = 'vtbottom';
const f = (n) => Number(n.toFixed(2));
const mirror = (half) => `<g>${half}</g><g transform="scale(-1 1)">${half}</g>`;

// Sao bốn cánh tâm (cx,cy), bán kính r
const star4 = (cx, cy, r, attrs) => {
  const k = r * 0.28;
  const pts = [[0, -r], [k, -k], [r, 0], [k, k], [0, r], [-k, k], [-r, 0], [-k, -k]]
    .map(([x, y]) => `${f(cx + x)} ${f(cy + y)}`);
  return `<path d="M${pts.join(' L')} Z" ${attrs}/>`;
};

function decorBottom(tier /*, W, H */) {
  const idx = Math.max(0, ORDER.indexOf(tier.name));
  const rb = Boolean(tier.rainbow);
  const acc = tier.accent || tier.light;
  const dark = tier.dark;
  const CY = 8.5; // tâm hành tinh và các vành (cao 0..17 -> giữ trong 0..16 nhờ bán kính nhỏ)
  const defs =
    `<defs>` +
    `<linearGradient id="${P}-g" gradientUnits="userSpaceOnUse" x1="0" y1="2" x2="0" y2="15"><stop offset="0" stop-color="${tier.light}"/><stop offset="0.55" stop-color="${tier.main}"/><stop offset="1" stop-color="${dark}"/></linearGradient>` +
    `<linearGradient id="${P}-rb" gradientUnits="userSpaceOnUse" x1="-73" y1="0" x2="73" y2="0"><stop offset="0" stop-color="#ff6b6b"/><stop offset="0.25" stop-color="#ffd93d"/><stop offset="0.5" stop-color="#6bffb8"/><stop offset="0.75" stop-color="#6bb8ff"/><stop offset="1" stop-color="#d96bff"/></linearGradient>` +
    `</defs>`;
  const ringCol = rb ? `url(#${P}-rb)` : tier.light;
  const ringCol2 = rb ? `url(#${P}-rb)` : tier.main;
  const ring = (rx, ry, col, w) => `fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"`;
  const sparkle = `fill="${acc}" stroke="${dark}" stroke-width="1" stroke-linejoin="round"`;
  const dot = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${tier.light}"/>`;

  // Danh sách vành (rx, ry): bậc cao có thêm vành ngoài
  const rings = [[34, 4]];
  if (idx >= 1) rings.push([46, 5]);
  if (idx >= 4) rings.push([62, 5]);

  // Nửa sau của vành vẽ trước (đè dưới hành tinh), nửa trước vẽ sau cùng
  let back = '';
  let front = '';
  rings.forEach(([rx, ry], i) => {
    const w = i === 0 ? 1.8 : 1.3;
    const col = i === 0 ? ringCol : ringCol2;
    const dash = i === 2 ? ' stroke-dasharray="1 5"' : '';
    back += `<ellipse cx="0" cy="${CY}" rx="${rx}" ry="${ry}" ${ring(rx, ry, col, w)}${dash}/>`;
    front += `<path d="M${-rx} ${CY} A${rx} ${ry} 0 0 0 ${rx} ${CY}" ${ring(rx, ry, col, w)}${dash}/>`;
  });

  // Hành tinh giữa + dải sáng
  const planet =
    `<circle cx="0" cy="${CY}" r="6" fill="url(#${P}-${rb ? 'rb' : 'g'})" stroke="${dark}" stroke-width="1.3"/>` +
    `<path d="M-4.6 ${CY - 2.2} Q0 ${CY + 0.5} 4.6 ${CY - 2.2}" fill="none" stroke="${dark}" stroke-width="1" stroke-linecap="round" stroke-opacity="0.7"/>`;

  // Phần hai bên (vẽ nửa phải rồi lật gương): đốm sáng ở đầu vành, sao nhỏ ở hai đầu cụm
  let half = dot(41, 11, 1.4);
  if (idx >= 2) half += star4(56, CY, 3.6, sparkle);
  if (idx >= 3) half += `<circle cx="24" cy="${f(CY + 4 * Math.sin(Math.acos(24 / 34)))}" r="2" fill="${acc}" stroke="${dark}" stroke-width="1"/>` + dot(66, 5, 1.1) + dot(66, 12, 1.1);
  if (idx >= 5) half += star4(69, CY, 2.8, sparkle) + dot(50, 14, 1);

  // BẠCH KIM II (cấp 35, nửa bậc +): mỗi bên 1 sao nhỏ trong vành, 1 vệt sao băng + 1 đốm ở đầu cụm (+3 phần tử/bên, cao ≤ 16, nửa rộng ≤ 70)
  if (tier.step === 1 && tier.name === 'BẠCH KIM' && !tier.star) half += star4(30, 13, 2, sparkle) + `<path d="M58 2.5 L69 1.5" fill="none" stroke="${ringCol}" stroke-width="1.4" stroke-linecap="round" stroke-opacity="0.85"/>` + dot(52, 2.5, 1.1);

  // HUYỀN THOẠI ★3+ (cấp 65+): mỗi bên 1 sao nhỏ trắng-vàng ở (22.5, 2.8) r=2.6 + 1 đốm (đối xứng; nằm trên vành trong, cao ≤ 6) = +2 phần tử/bên; cộng dồn
  if (tier.star >= 3) half += star4(22.5, 2.8, 2.6, `fill="#fff3c4" stroke="${dark}" stroke-width="0.8" stroke-linejoin="round"`) + `<circle cx="28" cy="2" r="0.9" fill="#ffffff"/>`;
  // HUYỀN THOẠI ★8+ (cấp 90+): dải 3 cánh sao băng mỗi bên (kim thoi nằm trong mặt phẳng vành, gốc ở sát hành tinh x=9 → mũi x≈30, y 3..13; vàng-trắng, viền tối) = +3 phần tử/bên; cao ≤ 14, nửa rộng ≤ 32; cộng dồn
  if (tier.star >= 8) {
    const leaf = `fill="#fff3c4" fill-opacity="0.9" stroke="${dark}" stroke-width="0.7" stroke-linejoin="round"`;
    half += `<path d="M9.5 6.2 Q20 0.8 31 2.6 Q20 6.2 9.5 6.2 Z" ${leaf}/><path d="M9.8 8.5 Q21 7.2 35 8.5 Q21 9.8 9.8 8.5 Z" ${leaf}/><path d="M9.5 10.8 Q20 16 31 14.4 Q20 10.8 9.5 10.8 Z" ${leaf}/>`;
  }
  return defs + back + planet + front + mirror(half);
}

module.exports = { decorBottom };
