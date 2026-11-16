// ===== hoso/bonusKit.js — bộ dựng chung cho 5 BỘ THƯỞNG (shop_thienhoang, shop_sonha, shop_cucquang, shop_tula, shop_luongtu) =====
// Mỗi bộ thưởng có 8 file đúng hợp đồng KHUNG_SHOP_PROMPT.md mục 4 (colors/avatar/accents/crest/border/side/bottom/index) + 1 file `motif.js`
// chứa hoạ tiết riêng của bộ. Phần KHUNG SƯỜN (vành đôi, đinh ngọc, nẹp đôi, góc, cạnh) dùng chung ở đây để 5 bộ cùng đẳng cấp "xịn hơn khung thường":
// vành/nẹp 2 lớp gradient 3 tông + viền sáng, đinh ngọc xen ngọc trai, hoạ tiết riêng ở đỉnh/góc/cạnh/đáy.
// File này nằm ở hoso/ (KHÔNG nằm trong hoso/frame/) nên registry.js không quét nhầm thành phong cách.
// Mọi hàm trả MẢNH SVG (không có thẻ <svg>), id duy nhất theo tiền tố `<id>-<phần>-`.
const n = (v) => Number(Number(v).toFixed(2));
const tf = (x, y, a = 0, s = 1) => `transform="translate(${n(x)} ${n(y)})${a ? ` rotate(${n(a)})` : ''}${s !== 1 ? ` scale(${n(s)})` : ''}"`;
const polar = (r, deg) => [n(r * Math.sin((deg * Math.PI) / 180)), n(-r * Math.cos((deg * Math.PI) / 180))]; // 0° = hướng LÊN, chiều kim đồng hồ
const mirror = (s) => `<g transform="scale(-1 1)">${s}</g>`;
const lg = (id, T, x2 = 1, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${T.light}"/><stop offset="0.5" stop-color="${T.main}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient>`;

// ---- hình cơ bản (mọi hình vẽ quanh gốc (0,0), "lên" = y âm, a = góc xoay độ) ----
const gem = (x, y, r, fill, T, a = 0) => `<g ${tf(x, y, a)}><path d="M0 ${-r}L${n(r * 0.72)} 0L0 ${r}L${n(-r * 0.72)} 0Z" fill="${fill}" stroke="${T.dark}" stroke-width="0.6" stroke-linejoin="round"/><path d="M0 ${-r}L${n(r * 0.72)} 0L0 0Z" fill="#fff" fill-opacity="0.42"/></g>`;
const pearl = (x, y, r, T) => `<circle cx="${n(x)}" cy="${n(y)}" r="${r}" fill="${T.light}" stroke="${T.dark}" stroke-width="0.5"/><circle cx="${n(x - r * 0.3)}" cy="${n(y - r * 0.3)}" r="${n(r * 0.3)}" fill="#fff" fill-opacity="0.85"/>`;
const spike = (x, y, a, len, w, fill, T, sw = 0.5) => `<path ${tf(x, y, a)} d="M${-w} 0L0 ${-len}L${w} 0Z" fill="${fill}" stroke="${T.dark}" stroke-width="${sw}" stroke-linejoin="round"/>`;
const petal = (x, y, a, len, w, fill, T) => `<path ${tf(x, y, a)} d="M0 0C${-w} ${n(-len * 0.4)} ${n(-w * 0.6)} ${n(-len * 0.85)} 0 ${-len}C${n(w * 0.6)} ${n(-len * 0.85)} ${w} ${n(-len * 0.4)} 0 0Z" fill="${fill}" stroke="${T.dark}" stroke-width="0.5" stroke-linejoin="round"/>`;
const star4 = (x, y, r, fill, op = 1) => `<path d="M${n(x)} ${n(y - r)}L${n(x + r * 0.28)} ${n(y - r * 0.28)}L${n(x + r)} ${n(y)}L${n(x + r * 0.28)} ${n(y + r * 0.28)}L${n(x)} ${n(y + r)}L${n(x - r * 0.28)} ${n(y + r * 0.28)}L${n(x - r)} ${n(y)}L${n(x - r * 0.28)} ${n(y - r * 0.28)}Z" fill="${fill}" fill-opacity="${op}"/>`;
const dot = (x, y, r, fill, op = 1) => `<circle cx="${n(x)}" cy="${n(y)}" r="${r}" fill="${fill}" fill-opacity="${op}"/>`;
// lặp quanh tâm: fn(x, y, θ, i) cho count điểm ở bán kính r, bắt đầu từ góc start
const radial = (count, r, fn, start = 0) => {
  let out = '';
  for (let i = 0; i < count; i += 1) {
    const th = start + (i * 360) / count;
    const [x, y] = polar(r, th);
    out += fn(x, y, th, i);
  }
  return out;
};
const helpers = { n, tf, polar, mirror, lg, gem, pearl, spike, petal, star4, dot, radial };

// ---- dựng 6 phần từ cấu hình ----
// cfg = { id, T, motif: { avatar, crest, corner, edge, side, bottom, accent } } — mỗi hàm motif nhận (T, P, h) với P = tiền tố id.
function build(cfg) {
  const { id, T, motif } = cfg;
  const gemFill = T.ruby || T.accent;

  function avatarFrame(_tier, R = 70) {
    const P = `${id}-avatar-`;
    const k = Number((R / 70).toFixed(4));
    const defs = `<defs>${lg(`${P}g`, T)}</defs>`;
    const ring = `<path fill-rule="evenodd" fill="url(#${P}g)" d="M-77 0A77 77 0 1 0 77 0A77 77 0 1 0 -77 0ZM-70 0A70 70 0 1 0 70 0A70 70 0 1 0 -70 0Z"/>`
      + `<circle r="73.5" fill="none" stroke="${T.light}" stroke-opacity="0.7" stroke-width="0.8"/><circle r="70.6" fill="none" stroke="${T.dark}" stroke-opacity="0.55" stroke-width="0.7"/><circle r="79.2" fill="none" stroke="${T.main}" stroke-opacity="0.85" stroke-width="1"/>`;
    const studs = radial(12, 78.6, (x, y, th, i) => (i % 2 === 0 ? gem(x, y, 3.2, gemFill, T, th) : pearl(x, y, 1.7, T)));
    return `${defs}<g transform="scale(${k})">${ring}${motif.avatar(T, P, helpers)}${studs}</g>`;
  }

  function accent(_tier, W, H) {
    const P = `${id}-accent-`;
    const u = (tx, ty, sx, sy) => `<use href="#${P}c" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
    return `<defs><g id="${P}c">${motif.accent(T, P, helpers)}</g></defs>` + u(0, 0, 1, 1) + u(W, 0, -1, 1) + u(0, H, 1, -1) + u(W, H, -1, -1);
  }

  function crestTop(_tier, _W, _H) {
    const P = `${id}-crest-`;
    return `<defs>${lg(`${P}g`, T, 0, 1)}</defs>${motif.crest(T, P, helpers)}`;
  }

  function frameBorder(_tier, W, H) {
    const P = `${id}-border-`;
    const defs = `<defs>${lg(`${P}g`, T)}<g id="${P}e">${motif.edge(T, P, helpers)}</g><g id="${P}k">${motif.corner(T, P, helpers)}</g></defs>`;
    // nẹp đôi: dải gradient dày 7 (inset 2..9) + vạch trong mảnh (inset 14) + vạch sáng viền ngoài
    const band = `<rect x="5.5" y="5.5" width="${W - 11}" height="${H - 11}" rx="5" fill="none" stroke="url(#${P}g)" stroke-width="7"/>`
      + `<rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="6" fill="none" stroke="${T.light}" stroke-opacity="0.75" stroke-width="0.9"/>`
      + `<rect x="14" y="14" width="${W - 28}" height="${H - 28}" rx="3" fill="none" stroke="${T.main}" stroke-opacity="0.85" stroke-width="1.2"/>`;
    let units = '';
    const skip = (c, len) => Math.abs(c - len / 2) < 36; // chừa chỗ cho đỉnh ở giữa cạnh trên
    const run = (len, fn) => {
      const cnt = Math.max(1, Math.floor((len - 88) / 44));
      const off = 44 + (len - 88 - cnt * 44) / 2 + 22;
      for (let i = 0; i < cnt; i += 1) fn(n(off + i * 44));
    };
    run(W, (x) => { if (!skip(x, W)) units += `<use href="#${P}e" transform="translate(${x} 0)"/>`; });
    run(W, (x) => { units += `<use href="#${P}e" transform="translate(${x} ${H}) rotate(180)"/>`; });
    run(H, (y) => { units += `<use href="#${P}e" transform="translate(0 ${y}) rotate(-90)"/>`; });
    run(H, (y) => { units += `<use href="#${P}e" transform="translate(${W} ${y}) rotate(90)"/>`; });
    const k = (tx, ty, sx, sy) => `<use href="#${P}k" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
    return defs + band + units + k(0, 0, 1, 1) + k(W, 0, -1, 1) + k(0, H, 1, -1) + k(W, H, -1, -1);
  }

  function sideUnit(_tier, _W, _H) {
    const P = `${id}-side-`;
    const spine = `<path d="M0 0V100" stroke="${T.dark}" stroke-width="3.6"/><path d="M0 0V100" stroke="${T.main}" stroke-width="2.2"/><path d="M0 0V100" stroke="${T.light}" stroke-opacity="0.8" stroke-width="0.7"/>`;
    return `<defs>${lg(`${P}g`, T, 1, 0)}</defs>${spine}${motif.side(T, P, helpers)}`;
  }

  function decorBottom(_tier, _W, _H) {
    const P = `${id}-bottom-`;
    return `<defs>${lg(`${P}g`, T, 0, 1)}</defs>${motif.bottom(T, P, helpers)}`;
  }

  return { avatarFrame, accent, crestTop, frameBorder, sideUnit, decorBottom };
}

const cache = {};
// Lấy (và nhớ) bộ hàm dựng cho 1 bộ thưởng: getBuilt('shop_sonha', T, motif)
const getBuilt = (id, T, motif) => cache[id] || (cache[id] = build({ id, T, motif }));

module.exports = { getBuilt, helpers };
