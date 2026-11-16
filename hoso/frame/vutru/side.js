// hoso/frame/vutru/side.js — hoạ tiết CẠNH BÊN phong cách Vũ trụ: quỹ đạo uốn lượn + chuỗi sao (lặp mỗi 100px, đầu/cuối nối liền ở x=0)
// Gốc toạ độ: giữa lề trái, rộng tối đa 30px (x -15..15). Cạnh phải do bên ghép lật gương scale(-1 1).
// Chữ ký: sideUnit(tier) -> chuỗi SVG của 1 đơn vị cao 100px. File tự chứa, không require file khác, không dùng defs (không lo trùng id khi lặp).

const ORDER = ['ĐỒNG', 'BẠC', 'VÀNG', 'BẠCH KIM', 'KIM CƯƠNG', 'HUYỀN THOẠI'];
const RAINBOW = ['#ff6b6b', '#ffd93d', '#6bffb8', '#6bb8ff', '#d96bff'];
const f = (n) => Number(n.toFixed(2));

// Sao bốn cánh tâm (cx,cy), bán kính r
const star4 = (cx, cy, r, attrs) => {
  const k = r * 0.28;
  const pts = [[0, -r], [k, -k], [r, 0], [k, k], [0, r], [-k, k], [-r, 0], [-k, -k]]
    .map(([x, y]) => `${f(cx + x)} ${f(cy + y)}`);
  return `<path d="M${pts.join(' L')} Z" ${attrs}/>`;
};

function sideUnit(tier /*, W, H */) {
  const idx = Math.max(0, ORDER.indexOf(tier.name));
  const rb = Boolean(tier.rainbow);
  const acc = tier.accent || tier.light;
  const dark = tier.dark;
  // Màu từng phần: bậc cầu vồng lấy từ 5 màu cố định (chia đôi mỗi dải), bậc khác dùng màu bậc
  const c1 = rb ? [RAINBOW[1], RAINBOW[3]] : [tier.light, tier.light];
  const c2 = rb ? [RAINBOW[2], RAINBOW[4]] : [tier.main, tier.main];
  const sk = (col, w) => `fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  const bead = (col) => `fill="${col}" stroke="${dark}" stroke-width="1" stroke-linejoin="round"`;
  const dot = (x, y, r, col) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}"/>`;

  // Quỹ đạo 1: sóng mượt, lồi phải ở nửa trên (đỉnh lồi x=6,y=25), lồi trái ở nửa dưới (x=-6,y=75); liền tại x=0, y=0/50/100
  let s =
    `<path d="M0 0 C8 12 8 38 0 50" ${sk(c1[0], 2)}/>` +
    `<path d="M0 50 C-8 62 -8 88 0 100" ${sk(c1[1], 2)}/>` +
    star4(6, 25, 4.2, bead(rb ? RAINBOW[0] : acc));

  if (idx >= 1) s += star4(-6, 75, 4.2, bead(rb ? RAINBOW[1] : acc));

  // Quỹ đạo 2 đối pha với quỹ đạo 1 (hai dải đan nhau như chuỗi xoắn)
  if (idx >= 2) {
    s +=
      `<path d="M0 0 C-8 12 -8 38 0 50" ${sk(c2[0], 1.5)}/>` +
      `<path d="M0 50 C8 62 8 88 0 100" ${sk(c2[1], 1.5)}/>` +
      dot(-6, 25, 1.8, tier.light) + dot(6, 75, 1.8, tier.light);
  }

  // Hành tinh nhỏ ở điểm giao giữa hai quỹ đạo
  if (idx >= 3) s += `<circle cx="0" cy="50" r="3" ${bead(rb ? RAINBOW[2] : acc)}/>`;

  // Sao nhỏ lạc ngoài quỹ đạo
  if (idx >= 4) s += star4(12, 60, 2.4, bead(tier.light)) + star4(-12, 12, 2.4, bead(tier.light)) + dot(-12, 90, 1.1, tier.light) + dot(12, 8, 1.1, tier.light);

  // Dải bụi sao cuối cùng + thêm sao nhỏ
  if (idx >= 5) s += star4(-12, 40, 2, bead(RAINBOW[3])) + star4(12, 88, 2, bead(RAINBOW[4])) + dot(13, 34, 1, RAINBOW[0]) + dot(-13, 66, 1, RAINBOW[1]);

  // BẠCH KIM II (cấp 35, nửa bậc +): vòng quỹ đạo đứt nét quanh hành tinh y=50 + 1 mặt trăng nhỏ + 1 vệt sao băng ngắn ở y=88 (+3 phần tử, x -15..15, nối liền)
  if (tier.step === 1 && tier.name === 'BẠCH KIM' && !tier.star) {
    s += `<circle cx="0" cy="50" r="8" fill="none" stroke="${rb ? RAINBOW[3] : tier.light}" stroke-width="1" stroke-dasharray="2 2.6" stroke-linecap="round" stroke-opacity="0.9"/>` +
      `<circle cx="5.7" cy="44.3" r="1.9" fill="${acc}" stroke="${dark}" stroke-width="0.8"/>` +
      `<path d="M13 80 L6 87" fill="none" stroke="${rb ? RAINBOW[4] : tier.light}" stroke-width="1.6" stroke-linecap="round" stroke-opacity="0.85"/>`;
  }
  // HUYỀN THOẠI ★3+ (cấp 65+): hành tinh y=50 có vành đai nghiêng cầu vồng (ellipse rx 10 ry 2.8, nghiêng -24°; 1 nét tối đệm + 1 nét sáng) + sao tín hiệu nhỏ ở (-9,42) = +3 phần tử (x -15..15, nối liền); cộng dồn
  if (tier.star >= 3) {
    s += `<ellipse cx="0" cy="50" rx="10" ry="2.8" transform="rotate(-24 0 50)" fill="none" stroke="${dark}" stroke-width="2.6" stroke-opacity="0.5"/>` +
      `<ellipse cx="0" cy="50" rx="10" ry="2.8" transform="rotate(-24 0 50)" fill="none" stroke="${RAINBOW[1]}" stroke-width="1.2"/>` +
      star4(-9, 42, 2.4, bead('#fff3c4'));
  }
  // HUYỀN THOẠI ★7+ (cấp 85+): chuỗi 8 hạt sáng bám hai quỹ đạo chính (4 hạt/nửa: t=0.2/0.35/0.65/0.8 của đường cong; nửa dưới đối xứng tâm), né sao y=25/75 và hành tinh y=50; 1 path nét tròn dài 0 ×2 lớp = +2 phần tử; nối liền khi xếp chồng (không đụng y=0/100)
  if (tier.star >= 7) {
    const bd = 'M3.84 8.66h0.01M5.46 16.5h0.01M5.46 33.4h0.01M3.84 41.35h0.01M-3.84 58.66h0.01M-5.46 66.5h0.01M-5.46 83.4h0.01M-3.84 91.35h0.01';
    s += `<path d="${bd}" fill="none" stroke="#fff3c4" stroke-width="3" stroke-linecap="round" stroke-opacity="0.9"/><path d="${bd}" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>`;
  }
  return s;
}

module.exports = { sideUnit };
