// ===== hoso/frame/shop_mech/side.js — CẠNH TRÁI: piston thuỷ lực =====
// Hình học: 1 đơn vị cao 100 (y 0..100), rộng x ∈ [-14, 14]; ty piston x ±2.6 liền mạch y 0..100; xi-lanh y 8..40 và 60..92; khớp cầu y=50.
const T = require('./colors').TIERS[0];
const P = 'shop_mech-side-';
function sideUnit(_tier, W, H) {
  const defs = `<defs><linearGradient id="${P}r" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${T.dark}"/><stop offset="0.35" stop-color="${T.light}"/><stop offset="0.7" stop-color="${T.plate}"/><stop offset="1" stop-color="${T.dark}"/></linearGradient><linearGradient id="${P}b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${T.dark}"/><stop offset="0.4" stop-color="${T.plate}"/><stop offset="1" stop-color="${T.main}"/></linearGradient></defs>`;
  const rod = `<rect x="-2.6" y="0" width="5.2" height="100" fill="url(#${P}r)"/><path d="M-2.6 0V100M2.6 0V100" stroke="${T.dark}" stroke-width="0.8"/>`;
  const cyl = (y) => `<rect x="-6.2" y="${y}" width="12.4" height="32" rx="1.2" fill="url(#${P}b)" stroke="${T.dark}" stroke-width="1"/><rect x="-6.2" y="${y + 4}" width="12.4" height="2" fill="${T.accent}" stroke="${T.dark}" stroke-width="0.5"/><rect x="-6.2" y="${y + 26}" width="12.4" height="2" fill="${T.accent}" stroke="${T.dark}" stroke-width="0.5"/><path d="M-3.4 ${y + 9}V${y + 23}" stroke="${T.light}" stroke-width="0.7" stroke-opacity="0.8"/>`;
  const col = (y) => `<rect x="-7.6" y="${y}" width="15.2" height="4" rx="0.8" fill="${T.main}" stroke="${T.dark}" stroke-width="0.9"/><circle cx="-5.2" cy="${y + 2}" r="0.7" fill="${T.dark}"/><circle cx="5.2" cy="${y + 2}" r="0.7" fill="${T.dark}"/>`;
  const joint = `<circle cx="0" cy="50" r="5.4" fill="url(#${P}b)" stroke="${T.dark}" stroke-width="1"/><circle cx="0" cy="50" r="2" fill="${T.accent}" stroke="${T.dark}" stroke-width="0.7"/><path d="M-1.2 50H1.2M0 48.8V51.2" stroke="${T.dark}" stroke-width="0.5"/>`;
  const hose = `<path d="M6.2 24C14 24 14 76 6.2 76" fill="none" stroke="${T.dark}" stroke-width="3.4" stroke-linecap="round"/><path d="M6.2 24C14 24 14 76 6.2 76" fill="none" stroke="${T.main}" stroke-width="2" stroke-linecap="round"/><rect x="5" y="22.4" width="3.4" height="3.2" fill="${T.accent}" stroke="${T.dark}" stroke-width="0.5"/><rect x="5" y="74.4" width="3.4" height="3.2" fill="${T.accent}" stroke="${T.dark}" stroke-width="0.5"/><path d="M12.6 40V44M12.6 56V60" stroke="${T.accent}" stroke-width="1.2"/>`;
  return defs + rod + cyl(8) + col(38) + cyl(60) + col(56) + hose + joint;
}
module.exports = { sideUnit };
