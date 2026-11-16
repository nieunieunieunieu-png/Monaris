// ===== shop/ownership.js — khung đã sở hữu, giữ trong RAM (nạp từ tab "Shop Khung" lúc khởi động) =====
// File nhẹ, KHÔNG require discord/sheet để hoso/frame/levelRules.js dùng đồng bộ được.
// has() trả: true = có · false = chưa có · null = CHƯA BIẾT (chưa nạp xong) -> phía gọi không được khoá oan.
let owned = new Map(); // userId -> Set(frameId)
let loaded = false;

const isLoaded = () => loaded;
function replaceAll(map) {
  owned = map;
  loaded = true;
}
function add(userId, id) {
  const key = String(userId);
  if (!owned.has(key)) owned.set(key, new Set());
  owned.get(key).add(id);
}
function has(userId, id) {
  if (!loaded) return null;
  const set = owned.get(String(userId));
  return Boolean(set && set.has(id));
}
const list = (userId) => [...(owned.get(String(userId)) || [])];
const snapshot = () => new Map([...owned].map(([k, v]) => [k, new Set(v)]));

// Số thứ tự Chí Tôn 9/9 (userId -> N), do shop/index.js nạp; card.js/hoso dùng đồng bộ để đặt danh hiệu mặc định.
let ranks = new Map();
const setRanks = (map) => { ranks = new Map([...map].map(([k, v]) => [String(k), Number(v && v.rank !== undefined ? v.rank : v)])); };
const rankOf = (userId) => ranks.get(String(userId)) || null;

module.exports = { setRanks, rankOf, isLoaded, replaceAll, add, has, list, snapshot };
