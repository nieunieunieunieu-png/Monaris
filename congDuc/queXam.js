// ===== congDuc/queXam.js — Quẻ xăm hằng ngày (mục 8 backlog) =====
// Luồng: thắp hương miễn phí THÀNH CÔNG (congDuc/incense.js freeIncense, gọi từ interactions.js) -> rút 1 quẻ, thang
// Thượng Thượng (hiếm, tốt nhất) đến Hạ Hạ (hiếm, kém nhất), kèm 1 câu "lời sấm" do Gemini viết theo giọng bot (Phật
// pháp, thanh tịnh — cùng tông với congDuc/view.js), có lời sấm viết sẵn dự phòng nếu chưa cấu hình Gemini/API lỗi.
// Quẻ TỐT (Thượng Thượng/Thượng) thưởng thêm 1 ít Công Đức NGAY + buff nhân Công Đức trong ít phút tới; quẻ kém
// chỉ mang tính vui, KHÔNG trừ/phạt gì (đúng tinh thần "quẻ tốt CÓ THỂ cho buff nhỏ" — không nói quẻ xấu bị phạt).
// Chỉ 1 lần/ngày/người (idempotent, gọi lại trong ngày trả về đúng quẻ cũ, không rút lại, không cộng thưởng lần 2).
//
// Trạng thái "đã rút hôm nay" + tier/lời sấm/buff lưu NGAY TRÊN record RAM của congDuc/core.js (rec.queXam*, rec
// không lưu các field lạ này xuống Sheet — xem googleSheets/congDucSheet.js chỉ map đúng cột A..P) nên nhẹ, không
// cần sửa schema Sheet; cái giá đánh đổi là bot restart đúng lúc thì có thể rút lại trong ngày đó — chấp nhận được
// vì đây là tính năng phụ mang tính giải trí, không phải nguồn Công Đức chính.
const cfg = require('../config/congDuc');
const core = require('./core');

// Phụ thuộc ngoài, nạp lười để test thuần không cần GEMINI_API_KEY/mạng. Test gọi setDeps() để thay.
const realDeps = {
  askGemini: (prompt, opts) => require('../AutoReply/geminiCore').callGeminiWithFallback(prompt, opts),
  hasGeminiKey: () => Boolean(require('../config').GEMINI_API_KEY),
};
let deps = realDeps;
function setDeps(over) { deps = over ? { ...realDeps, ...over } : realDeps; }

// weight càng cao càng dễ ra — phân bố hình chuông, 2 đầu (tốt nhất/kém nhất) hiếm nhất. Chỉ quẻ có buffMult>1 là "tốt".
const TIERS = [
  { key: 'thuong_thuong', label: 'Thượng Thượng', weight: 3, emoji: '🌟', bonusCd: 300, buffMult: 1.5, buffMinutes: 60 },
  { key: 'thuong', label: 'Thượng', weight: 10, emoji: '✨', bonusCd: 150, buffMult: 1.2, buffMinutes: 30 },
  { key: 'trung_thuong', label: 'Trung Thượng', weight: 20, emoji: '🍃', bonusCd: 50, buffMult: 1, buffMinutes: 0 },
  { key: 'trung_binh', label: 'Trung Bình', weight: 34, emoji: '🪷', bonusCd: 0, buffMult: 1, buffMinutes: 0 },
  { key: 'trung_ha', label: 'Trung Hạ', weight: 20, emoji: '🍂', bonusCd: 0, buffMult: 1, buffMinutes: 0 },
  { key: 'ha', label: 'Hạ', weight: 10, emoji: '🌧️', bonusCd: 0, buffMult: 1, buffMinutes: 0 },
  { key: 'ha_ha', label: 'Hạ Hạ', weight: 3, emoji: '⛈️', bonusCd: 0, buffMult: 1, buffMinutes: 0 },
];
const TOTAL_WEIGHT = TIERS.reduce((s, t) => s + t.weight, 0);
const tierByKey = (key) => TIERS.find((t) => t.key === key) || TIERS[3];

function pickTier(rng = Math.random) {
  let r = rng() * TOTAL_WEIGHT;
  for (const t of TIERS) { if (r < t.weight) return t; r -= t.weight; }
  return TIERS[TIERS.length - 1];
}

// Lời sấm dự phòng (dùng khi tắt AI / chưa có GEMINI_API_KEY / Gemini lỗi-hết-quota) — vài câu/mức để đỡ lặp.
const FALLBACK_SAM = {
  thuong_thuong: [
    'Mây lành tụ trước sân, việc lớn việc nhỏ đều hanh thông. Cứ vững tâm mà làm, phúc tự khắc tới.',
    'Hoa khai đúng tiết, quả ngọt đúng mùa — hôm nay làm gì cũng thuận, chớ quên san sẻ phúc lành cho người khác.',
  ],
  thuong: [
    'Gió xuôi chiều thuyền nhẹ trôi, hôm nay mọi sự nhẹ nhàng hơn thường lệ. Gắng thêm chút nữa, thành quả sẽ đẹp hơn mong đợi.',
    'Trời quang mây tạnh, lòng người cũng nhẹ — một ngày tốt để bắt đầu việc còn dang dở.',
  ],
  trung_thuong: [
    'Bình thường cũng là phúc — đi đứng nằm ngồi đều an, chẳng cầu gì hơn một ngày yên ổn.',
    'Nước chảy đá mòn, chẳng vội được đâu — hôm nay cứ chậm rãi mà tích, ắt có ngày đầy.',
  ],
  trung_binh: [
    'Trời đất vẫn vậy, lòng người tự định — hôm nay không tốt chẳng xấu, tuỳ cái tâm mà hoá cát hung.',
    'Sớm nắng chiều mưa là chuyện thường, giữ tâm bình thản thì ngày nào cũng là ngày lành.',
  ],
  trung_ha: [
    'Có đôi chút trắc trở, nhưng qua cơn mưa trời lại sáng — nhẫn một chút, việc sẽ xuôi.',
    'Đường đi có đá có gai, cẩn thận từng bước thì vẫn tới nơi cần tới.',
  ],
  ha: [
    'Hôm nay hơi ngược gió, bớt nóng vội, việc gấp để mai tính cũng chẳng muộn.',
    'Mây đen qua rồi cũng tan, hôm nay chỉ là một ngày cần thêm chút kiên nhẫn thôi.',
  ],
  ha_ha: [
    'Vận có lúc lên lúc xuống, hôm nay xuống một chút thì mai lại lên — tịnh tâm một lát rồi việc gì cũng nhẹ.',
    'Chẳng có quẻ nào xấu mãi — hôm nay cứ an nhiên, giữ miệng giữ lòng, phúc tự sinh.',
  ],
};
const pickFallback = (tier, rng = Math.random) => { const pool = FALLBACK_SAM[tier.key] || FALLBACK_SAM.trung_binh; return pool[Math.floor(rng() * pool.length)] || pool[0]; };

// Giọng văn CÙNG TÔNG với congDuc/view.js: Phật pháp, thanh tịnh, ngắn — không tu tiên/kiếm hiệp.
const SAM_SYSTEM_INSTRUCTION = 'Bạn là một vị sư hiền hoà trông coi một ngôi chùa nhỏ, vừa cho thí chủ rút quẻ xăm. '
  + 'Giọng văn Phật pháp, thanh tịnh, gần gũi dân gian — TUYỆT ĐỐI KHÔNG dùng từ tu tiên/kiếm hiệp/ma pháp/khoa học viễn tưởng. '
  + 'Viết đúng 1 lời sấm ngắn (1-2 câu, dưới 200 ký tự), âm hưởng nhẹ nhàng kiểu ca dao, hợp với mức cát hung được cho — '
  + 'quẻ xấu vẫn phải viết khéo léo động viên, không doạ nạt, không bi quan. Không chào hỏi, không giải thích gì thêm, '
  + 'CHỈ trả về đúng lời sấm.';

async function genSam(tier) {
  if (!cfg.CONG_DUC_QUEXAM_AI_ENABLED || !deps.hasGeminiKey()) return pickFallback(tier);
  try {
    const muc = tier.buffMult > 1 ? 'tốt' : tier.key === 'trung_binh' ? 'bình thường' : 'hơi kém';
    const prompt = `Thí chủ vừa rút được quẻ xăm "${tier.label}" (mức ${muc} trên thang Thượng Thượng → Hạ Hạ). Viết lời sấm cho quẻ này.`;
    const text = await deps.askGemini(prompt, { systemInstruction: SAM_SYSTEM_INSTRUCTION, temperature: 0.9 });
    if (!text || text === '__QUOTA_EXCEEDED__') return pickFallback(tier);
    const clean = text.replace(/\s+/g, ' ').trim().replace(/^["“]|["”]$/g, '');
    return clean.slice(0, 300) || pickFallback(tier);
  } catch (error) {
    console.error('[công đức] Quẻ xăm: Gemini lỗi, dùng lời sấm dự phòng:', error && error.message ? error.message : error);
    return pickFallback(tier);
  }
}

const drawnToday = (rec, day) => Boolean(rec) && rec.queXamDay === day;

// Quẻ đã rút hôm nay (nếu có), KHÔNG rút mới — dùng để hiện lại ở /congduc. Trả null nếu chưa rút hôm nay.
function todayResult(userId, now = Date.now()) {
  const rec = core.getRecord(userId, '', { create: false });
  const day = core.vnDay(now);
  if (!drawnToday(rec, day)) return null;
  return { tier: tierByKey(rec.queXamTier), text: rec.queXamText || '' };
}

// Rút quẻ — chỉ 1 lần/ngày/người, idempotent (gọi lại trong ngày trả về đúng quẻ cũ kèm already:true, không rút/thưởng lại).
async function draw(userId, name, { now = Date.now(), rng = Math.random } = {}) {
  if (!require('../features').isEnabled('quexam')) return null;
  const day = core.vnDay(now);
  const rec = core.getRecord(userId, name);
  if (drawnToday(rec, day)) return { ...todayResult(userId, now), already: true };

  const tier = pickTier(rng);
  const text = await genSam(tier);
  // Re-check ngay trước khi ghi: 2 lần bấm gần như đồng thời (interactions.js đã khoá theo userId ở bước thắp hương,
  // nhưng genSam() await lâu nên vẫn phòng hờ) — nếu đã có người ghi trước thì bỏ qua, trả quẻ đã ghi, không rút đè.
  if (drawnToday(rec, day)) return { ...todayResult(userId, now), already: true };
  rec.queXamDay = day;
  rec.queXamTier = tier.key;
  rec.queXamText = text;
  if (tier.buffMinutes > 0 && tier.buffMult > 1) { rec.queXamBuffUntil = now + tier.buffMinutes * 60_000; rec.queXamBuffMult = tier.buffMult; }

  const bonus = tier.bonusCd > 0 ? core.addMerit(rec, tier.bonusCd, { day, now }) : null;
  return { tier, text, bonus, already: false };
}

// Hệ số buff quẻ xăm đang hiệu lực cho userId tại `now` (1 = không có/hết hạn). Gắn vào congDuc/core.js qua setMeritMultiplierProvider.
function buffMultiplierFor(userId, now = Date.now()) {
  const rec = core.getRecord(userId, '', { create: false });
  if (!rec || !rec.queXamBuffUntil || now > rec.queXamBuffUntil) return 1;
  return rec.queXamBuffMult || 1;
}

// Phút buff còn lại cho userId tại `now` (0 nếu không có) — dùng để hiển thị ở /congduc.
function buffMinutesLeft(userId, now = Date.now()) {
  const rec = core.getRecord(userId, '', { create: false });
  if (!rec || !rec.queXamBuffUntil || now > rec.queXamBuffUntil) return 0;
  return Math.ceil((rec.queXamBuffUntil - now) / 60_000);
}

module.exports = { TIERS, draw, todayResult, buffMultiplierFor, buffMinutesLeft, setDeps, _pickTier: pickTier };
