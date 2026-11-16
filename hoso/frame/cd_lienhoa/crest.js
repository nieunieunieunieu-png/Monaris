// ===== hoso/frame/cd_lienhoa/crest.js — ĐỈNH THẺ: bảo châu + ngọn lửa trên đoá sen; càng cao bậc càng sáng, nhiều sen/châu/tia =====
// Hình học: gốc giữa cạnh trên; x ∈ [-80, 80], y ∈ [0, 36]; chân sen chạm y=36; đối xứng quanh x=0; bậc i chỉ THÊM so với bậc i−1 (ngọn lửa cao dần nhưng cùng gốc).
const { TIERS, byRealm } = require('./colors');
const { lotus } = require('./lotus');
const P = 'cd_lienhoa-crest-';
const n = (v) => Number(v.toFixed(2));
const CY = 22; // tâm bảo châu

// Nụ sen nhỏ hai bên (3 cánh) gốc (x,y), tỉ lệ k.
const bud = (x, y, k) => `<g transform="translate(${x} ${y}) scale(${k})" fill="#F7A0B8" stroke="#FFF1F5" stroke-width=".5" stroke-linejoin="round"><path d="M0 0Q-6-1-5-7Q-1-4 0 0Z"/><path d="M0 0Q6-1 5-7Q1-4 0 0Z"/><path d="M0 0Q-3.5-4 0-10Q3.5-4 0 0Z"/></g>`;

function crestTop(tier, _W, _H) {
  const t = tier && Number.isInteger(tier.i) ? tier : byRealm(tier && tier.i) || TIERS[0];
  const i = t.i;
  let s = `<defs><radialGradient id="${P}p" cx=".38" cy=".35" r=".7"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#FFE48A"/><stop offset="1" stop-color="${t.main}"/></radialGradient>`
    + `<linearGradient id="${P}f" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${t.main}"/><stop offset="1" stop-color="#FFF3C4"/></linearGradient>`
    + `<radialGradient id="${P}g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFF3C4" stop-opacity=".95"/><stop offset="1" stop-color="#FFF3C4" stop-opacity="0"/></radialGradient></defs>`;
  // i≥6: quầng sáng sau bảo châu, đậm dần (i=6 .35 → i=9 .8)
  if (i >= 6) s += `<circle cx="0" cy="${CY - 2}" r="${i >= 9 ? 19 : 16}" fill="url(#${P}g)" opacity="${n(0.35 + (i - 6) * 0.15)}"/>`;
  // i≥8: tia sáng nửa trên quanh bảo châu (i=8: 9 tia; i=9: 15 tia dài hơn)
  if (i >= 8) {
    const cnt = i >= 9 ? 15 : 9, r0 = 11.5, r1 = i >= 9 ? 21 : 16;
    let d = '';
    for (let k = 0; k < cnt; k++) {
      const a = (-170 + (160 / (cnt - 1)) * k) * Math.PI / 180, r = k % 2 ? r1 - 3 : r1;
      d += `M${n(r0 * Math.cos(a))} ${n(CY + r0 * Math.sin(a))}L${n(r * Math.cos(a))} ${n(CY + r * Math.sin(a))}`;
    }
    s += `<path d="${d}" stroke="#FFE48A" stroke-width="1" stroke-linecap="round" fill="none" opacity=".9"/>`;
  }
  // i≥6: hai cánh vàng cong dang ra hai bên
  if (i >= 6) s += `<path d="M10 30Q28 31 44 24M-10 30Q-28 31 -44 24" fill="none" stroke="${t.main}" stroke-width="1.4" stroke-linecap="round"/><path d="M44 24q4-2 7-6q-5 1-7 6zM-44 24q-4-2-7-6q5 1 7 6z" fill="${t.main}"/>`;
  // i≥4: châu nhỏ ở ±30 nối dây vàng xuống đế
  if (i >= 4) s += [-1, 1].map((d) => `<path d="M${d * 14} 34Q${d * 24} 36 ${d * 30} 31" fill="none" stroke="${t.colors[0]}" stroke-width="1"/><circle cx="${d * 30}" cy="31" r="2.6" fill="url(#${P}p)" stroke="${t.dark}" stroke-width=".5"/>`).join('');
  // i≥2: nụ sen hai bên đế
  if (i >= 2) s += bud(-20, 36, 0.62) + bud(20, 36, 0.62);
  // i≥7: thêm cặp nụ sen ngoài
  if (i >= 7) s += bud(-38, 35, 0.5) + bud(38, 35, 0.5);
  // ngọn lửa trên bảo châu: cao dần theo bậc (7 → ≈13)
  const h = n(7 + i * 0.7), w = n(3.2 + i * 0.12), y0 = CY - 8;
  s += `<path d="M0 ${y0}C${w} ${n(y0 - h * 0.4)} ${n(w * 0.6)} ${n(y0 - h * 0.8)} 0 ${n(y0 - h)}C${n(-w * 0.6)} ${n(y0 - h * 0.8)} ${-w} ${n(y0 - h * 0.4)} 0 ${y0}Z" fill="url(#${P}f)" stroke="${t.dark}" stroke-width=".5" stroke-linejoin="round"/>`;
  if (i >= 3) s += `<path d="M0 ${y0}C${n(w * 0.45)} ${n(y0 - h * 0.3)} ${n(w * 0.25)} ${n(y0 - h * 0.5)} 0 ${n(y0 - h * 0.62)}C${n(-w * 0.25)} ${n(y0 - h * 0.5)} ${n(-w * 0.45)} ${n(y0 - h * 0.3)} 0 ${y0}Z" fill="#fff" opacity=".8"/>`;
  // bảo châu + vòng
  s += `<circle cx="0" cy="${CY}" r="8" fill="url(#${P}p)" stroke="${t.dark}" stroke-width=".7"/><circle cx="-2.6" cy="${CY - 2.8}" r="2" fill="#fff" opacity=".75"/>`;
  s += `<circle cx="0" cy="${CY}" r="9.8" fill="none" stroke="${t.colors[0]}" stroke-width=".9"/>`;
  if (i >= 3) s += `<circle cx="0" cy="${CY}" r="11.2" fill="none" stroke="${t.accent}" stroke-width=".6" opacity=".9"/>`;
  // đoá sen đế (chân chạm y=36)
  // sen đế thu gọn (tối đa 14 cánh/3 lớp) để đỉnh thẻ không quá nặng; độ khác biệt giữa các bậc nằm ở lửa/châu/tia/cánh vàng
  const lt = { ...t, petals: Math.min(t.petals, 14), layers: Math.min(t.layers, 3) };
  s += `<g transform="translate(0 36)">${lotus(lt, { id: `${P}lt`, len: 13, pod: false })}</g>`;
  return s;
}
module.exports = { crestTop };
