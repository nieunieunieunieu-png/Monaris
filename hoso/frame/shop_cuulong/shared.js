// ===== hoso/frame/shop_cuulong/shared.js — tiện ích dùng chung cho border/side/bottom (CLCT-2): ctx, tải emblem từng bộ, đĩa rồng =====
const kit = require('../../dragonKit');
const bonus = require('../../bonusKit');
const { EMB } = require('./motif');

const n2 = kit.n;
const round2 = (s) => s.replace(/-?\d+\.\d{3,}/g, (m) => String(Number(Number(m).toFixed(2))));
const ctxOf = (ctx) => {
  try { if (ctx && ctx.owned && typeof ctx.owned.has === 'function') return { ...ctx, n: Number.isFinite(ctx.n) ? ctx.n : 0 }; } catch (e) { /* bỏ qua */ }
  return { owned: new Set(), n: 0, mask: 0, maxed: false, full: false };
};
// Bộ lọc tạo khối cho đầu rồng đã sở hữu (hoso/ nâng cấp nét vẽ): bản đồ độ cao = độ sáng của chính hình vẽ -> vân/nét tối thành rãnh, mảng sáng nổi lên;
// khuếch tán (sáng tối) + phản chiếu nhẹ + bóng đổ dưới thân. Cùng id `clrl` ở mọi nơi (nội dung giống nhau nên trùng id là an toàn).
const RELIEF = '<filter id="clrl" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">'
  + '<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.35 0.55 0.10 0 0" result="hm"/>'
  + '<feGaussianBlur in="hm" stdDeviation="0.35" result="hb"/>'
  + '<feDiffuseLighting in="hb" surfaceScale="3.2" diffuseConstant="1.15" lighting-color="#ffffff" result="df"><feDistantLight azimuth="225" elevation="52"/></feDiffuseLighting>'
  + '<feComposite in="SourceGraphic" in2="df" operator="arithmetic" k1="1.12" k2="0" k3="0" k4="0" result="shaded"/>'
  + '<feSpecularLighting in="hb" surfaceScale="3.2" specularConstant="0.5" specularExponent="22" lighting-color="#fff6dc" result="sp"><feDistantLight azimuth="225" elevation="48"/></feSpecularLighting>'
  + '<feComposite in="sp" in2="SourceAlpha" operator="in" result="spin"/>'
  + '<feComposite in="shaded" in2="spin" operator="arithmetic" k1="0" k2="1" k3="0.3" k4="0" result="lit"/>'
  + '<feGaussianBlur in="SourceAlpha" stdDeviation="1.1" result="sb"/><feOffset in="sb" dx="0.8" dy="1.4" result="so"/>'
  + '<feComponentTransfer in="so" result="shd"><feFuncA type="linear" slope="0.55"/></feComponentTransfer>'
  + '<feMerge><feMergeNode in="shd"/><feMergeNode in="lit"/></feMerge></filter>';
const reliefAttr = (own) => (own ? ' filter="url(#clrl)"' : '');
const cache = {};
function dragonMod(i) {
  if (cache[i] !== undefined) return cache[i];
  try {
    const id = kit.CL_IDS[i];
    const m = require(`../${id}/motif`);
    const T = require(`../${id}/colors`).TIERS[0];
    cache[i] = typeof m.emblem === 'function' && typeof m.emblemGhost === 'function' ? { m, T } : null;
  } catch (e) { cache[i] = null; }
  return cache[i];
}
// Đĩa vàng kim r=R + đúng emblem (có rồng) / emblemGhost + chấm nguyên tố mờ (chưa có) của rồng k, đặt tại (x,y), xoay rot độ, đầu cao ≈ half px.
// `T` = TIERS[0] của Chí Tôn; P = tiền tố id duy nhất.
function dragonDisc(T, P, k, c, x, y, rot, R, half) {
  const d = T.dragons[k];
  const own = c.owned.has(d.id);
  const mod = dragonMod(k);
  const [cy, hh] = EMB[k];
  const sc = Math.min(2, half / hh);
  let s = `<g transform="translate(${n2(x)} ${n2(y)})">`;
  s += `<circle r="${n2(R + 3)}" fill="${own ? d.main : T.gold2}" fill-opacity="${own ? 0.3 : 0.18}"/>`;
  s += `<circle r="${R}" fill="${T.void}" stroke="url(#${P}g)" stroke-width="2.4"/><circle r="${n2(R - 2.6)}" fill="none" stroke="${own ? d.light : T.gold3}" stroke-opacity="${own ? 0.8 : 0.35}" stroke-width="0.7"/>`;
  if (mod) s += `<g transform="rotate(${rot}) scale(${n2(sc)}) translate(0 ${n2(-cy)})">${own ? mod.m.emblem(mod.T, `${P}e${k}-`, bonus.helpers) : mod.m.emblemGhost(mod.T, `${P}h${k}-`, bonus.helpers)}</g>`;
  if (!own) s += kit.ghostDot(0, 0, d.main).replace('fill-opacity="0.3"', 'fill-opacity="0.45"');
  return `${s}</g>`;
}
const goldGrad = (id, T, x2 = 1, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${T.light}"/><stop offset="0.35" stop-color="${T.main}"/><stop offset="0.7" stop-color="${T.gold2}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient>`;
module.exports = { RELIEF, reliefAttr, dragonMod, ctxOf, dragonDisc, goldGrad, round2, n2 };
