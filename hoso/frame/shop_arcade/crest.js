// ===== hoso/frame/shop_arcade/crest.js — ĐỈNH THẺ (nâng cấp): tim 8-bit lớn + tia pixel + equalizer + sao pixel =====
// Hình học: gốc giữa cạnh trên; x ∈ [-78,78], y ∈ [0,36]; chân (bệ) chạm y=36; hệ thống phóng ×2.
const T = require('./colors').TIERS[0];
const P = 'shop_arcade-crest-';
const f = (v) => Number(v.toFixed(2));
function crestTop(_tier, _W, _H) {
  const c = 3; // kích thước ô tim
  const rows = ['..XX...XX..', '.XXXX.XXXX.', 'XXXXXXXXXXX', 'XXXXXXXXXXX', 'XXXXXXXXXXX', '.XXXXXXXXX.', '..XXXXXXX..', '...XXXXX...', '....XXX....', '.....X.....'];
  const x0 = -16.5; const y0 = 3;
  const shape = (ox, oy, pred) => {
    let d = '';
    rows.forEach((r, j) => {
      let i = 0;
      while (i < r.length) {
        if (r[i] === 'X' && (!pred || pred(i, j))) { let e = i; while (e + 1 < r.length && r[e + 1] === 'X' && (!pred || pred(e + 1, j))) e++; d += `M${f(x0 + ox + i * c)} ${f(y0 + oy + j * c)}h${f((e - i + 1) * c)}v${c}h-${f((e - i + 1) * c)}z`; i = e + 1; } else i++;
      }
    });
    return d;
  };
  const sq = (x, y, s, col, op) => `<rect x="${f(x)}" y="${f(y)}" width="${s}" height="${s}" fill="${col}"${op ? ` fill-opacity="${op}"` : ''}/>`;
  const star = (cx, cy, s, col) => `<path fill="${col}" d="M${cx - s / 2} ${cy - s / 2}h${s}v${s}h-${s}zM${cx + s / 2} ${cy - s / 2}h${s}v${s}h-${s}zM${cx - s * 1.5} ${cy - s / 2}h${s}v${s}h-${s}zM${cx - s / 2} ${cy + s / 2}h${s}v${s}h-${s}zM${cx - s / 2} ${cy - s * 1.5}h${s}v${s}h-${s}z"/>`;
  const defs = `<defs><radialGradient id="${P}glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${T.main}" stop-opacity="0.5"/><stop offset="1" stop-color="${T.main}" stop-opacity="0"/></radialGradient></defs>`;
  const glow = `<ellipse cx="0" cy="19" rx="34" ry="17" fill="url(#${P}glow)"/>`;
  // tia pixel toả hai bên tim (min y ≈ 1)
  let rays = '';
  const spec = [[15, [22, 27, 32]], [30, [22, 27]], [45, [21, 24]]];
  spec.forEach(([deg, ds], a) => ds.forEach((d, i) => [-1, 1].forEach((sx) => {
    const rad = (deg * Math.PI) / 180;
    rays += sq(sx * d * Math.cos(rad) - 1, 18 - d * Math.sin(rad) - 1, 2, a % 2 ? T.main : T.accent, f(0.95 - i * 0.2));
  })));
  // cột equalizer hai bên (cao thấp so le), chân y=33
  let eq = '';
  const colsB = [T.main, T.accent, T.blue, T.light];
  const hs = [6, 11, 8, 14, 9];
  [-1, 1].forEach((sx) => hs.forEach((h, i) => {
    const x = sx > 0 ? 38 + i * 7 : -38 - (i + 1) * 7;
    eq += `<rect x="${x}" y="${33 - h}" width="5" height="${h}" fill="${colsB[i % 4]}" fill-opacity="${f(1 - i * 0.13)}"/>`;
    eq += `<rect x="${x}" y="${33 - h}" width="5" height="1.2" fill="#FFFFFF" fill-opacity="${f(0.8 - i * 0.12)}"/>`;
  }));
  const stars = star(-30, 8, 2.2, T.accent) + star(30, 8, 2.2, T.accent) + star(-70, 12, 1.6, T.blue) + star(70, 12, 1.6, T.blue) + star(-56, 4, 1.4, T.light) + star(56, 4, 1.4, T.light);
  const base = `<path fill="${T.dark}" d="M-24 33h48v3h-48z"/><path fill="${T.main}" d="M-24 33h48v1.2h-48z"/><path fill="${T.accent}" d="M-14 34.4h28v1.1h-28z"/><path fill="${T.bg}" d="M-24 35.6h48v.4h-48z"/>`;
  const shadow = `<path fill="${T.dark}" d="${shape(1.5, 1.5)}"/>`;
  const heart = `<path fill="${T.main}" d="${shape(0, 0)}"/>`;
  const lower = `<path fill="${T.dark}" fill-opacity="0.55" d="${shape(0, 0, (i, j) => j >= 6 || (j >= 3 && (i >= 8)))}"/>`;
  const shine = `<path fill="${T.light}" d="${shape(0, 0, (i, j) => (j === 1 && (i === 1 || i === 2)) || (j === 2 && i <= 1) || (j === 3 && i === 0))}"/>` + sq(x0 + 2 * c, y0 + c, c / 2, '#FFFFFF');
  return `${defs}<g id="${P}h" shape-rendering="crispEdges">${glow}${rays}${stars}${eq}${base}${shadow}${heart}${lower}${shine}</g>`;
}
module.exports = { crestTop };
