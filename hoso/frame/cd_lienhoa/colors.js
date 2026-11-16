// ===== hoso/frame/cd_lienhoa/colors.js — 10 bậc = 10 cảnh giới Công Đức (config/congDuc.js › CONG_DUC_REALMS), số liệu theo docs/KHUNG_CONGDUC_PROMPT.md mục 2.1 =====
// Màu viền hào quang CỘNG DỒN: bậc i dùng HALO_COLORS.slice(0, COLOR_COUNT[i]); bậc 9 = đủ 8 màu + dải cầu vồng vàng-trắng.
const HALO_COLORS = ['#F5C518', '#D98E04', '#2EB872', '#2F9BE0', '#8E5BD6', '#F06BA8', '#D93A2B', '#FFFFFF'];
//                      vàng       hổ phách   lục ngọc   lam ngọc   tím        hồng sen   đỏ son     trắng ngọc
const COLOR_COUNT = [1, 1, 2, 3, 4, 5, 6, 7, 8, 8];
const NAMES = ['Phàm Phu', 'Cư Sĩ', 'Sa Di', 'Tỳ Kheo', 'Tu Đà Hoàn', 'Tư Đà Hàm', 'A Na Hàm', 'A La Hán', 'Bồ Tát', 'Phật'];
const PETALS = [5, 6, 8, 10, 12, 16, 20, 24, 30, 36];
const LAYERS = [1, 1, 2, 2, 2, 3, 3, 3, 4, 4];
const SEEDS = [0, 3, 5, 7, 9, 9, 11, 13, 13, 15];

const TIERS = NAMES.map((name, i) => ({
  i, min: i, name, label: `${name} · ${i + 1}/10`,
  petals: PETALS[i], layers: LAYERS[i], seeds: SEEDS[i],
  bud: i === 0,            // bậc 0: nụ nhỏ, chưa có hạt
  bigPod: i >= 5,          // từ Tư Đà Hàm: đài to hơn
  ring: i >= 8,            // Bồ Tát+: vòng sáng nhỏ trên đài
  glow: i === 9,           // Phật: hào quang sau sen
  rainbow: i === 9,        // Phật: dải cầu vồng vàng-trắng
  colors: HALO_COLORS.slice(0, COLOR_COUNT[i]),
  main: '#E8B923', light: '#FFF3C4', dark: '#8A5A00',
  accent: HALO_COLORS[COLOR_COUNT[i] - 1],
  petalBase: '#FFF8E1', petalTip: '#F4A6C6', petalLine: '#B8860B',
}));

const byRealm = (idx) => TIERS[Math.max(0, Math.min(TIERS.length - 1, Math.floor(Number(idx)) || 0))];
module.exports = { TIERS, byRealm, HALO_COLORS };
