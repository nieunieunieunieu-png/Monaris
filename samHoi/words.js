// ===== samHoi/words.js — danh sách từ/cụm tục + bộ so khớp CHÍNH XÁC (đúng dấu, không viết tắt, không bỏ dấu) =====
// So khớp theo TỪ nguyên vẹn: tách tin thành các từ (chữ/số), so từng từ/cụm với danh sách. "buồi" ≠ "buổi", "đụ" ≠ "đu", "shit" ≠ "shiitake".
// Chữ hoa/thường không phân biệt. Không bắt viết tắt, không bắt gõ không dấu (đúng yêu cầu). Thêm từ: SAM_HOI_EXTRA_WORDS (ENV, cách nhau dấu phẩy).
const cfg = require('../config/congDuc');

const VI_HEAVY = [
  'địt', 'đụ', 'đéo', 'lồn', 'cặc', 'buồi', 'cứt',
  'địt mẹ', 'đụ mẹ', 'đụ má', 'đù má', 'đéo mẹ',
  'đĩ', 'con đĩ', 'điếm', 'chó đẻ', 'đồ chó', 'óc chó',
  'mẹ kiếp', 'đồ khốn', 'súc vật',
];
const VI_MILD = ['khốn nạn', 'mất dạy', 'vô học', 'chết tiệt', 'đồ ngu', 'thằng ngu', 'con ngu'];
const EN_HEAVY = [
  'fuck', 'fucking', 'fucker', 'motherfucker', 'shit', 'bullshit', 'bitch', 'asshole', 'bastard',
  'dick', 'dickhead', 'cunt', 'whore', 'slut', 'prick', 'twat', 'wanker',
  'nigger', 'faggot', 'retard',
];

// Chuẩn hoá để so khớp: bỏ ký tự vô hình, NFC (dấu tiếng Việt gộp sẵn), chữ thường. KHÔNG bỏ dấu.
const fold = (s) => String(s || '').replace(/[\u200b-\u200f\u2060\ufeff]/g, '').normalize('NFC').toLocaleLowerCase('vi');

// Bỏ phần không phải lời nói: mention, emoji tuỳ chỉnh (tên emoji có thể trùng từ tục), link, khối code.
function stripNoise(text) {
  return String(text || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<a?:\w+:\d+>/g, ' ')
    .replace(/<[@#&!]+\d+>/g, ' ')
    .replace(/https?:\/\/\S+/gi, ' ');
}
const tokenize = (text) => fold(stripNoise(text)).split(/[^\p{L}\p{M}\p{N}]+/u).filter(Boolean);

let phrases = null; // Map từ-đầu -> [mảng từ của cụm] (cụm dài thử trước)
function build() {
  const list = [...VI_HEAVY, ...EN_HEAVY, ...(cfg.SAM_HOI_INCLUDE_MILD ? VI_MILD : []), ...cfg.SAM_HOI_EXTRA_WORDS];
  const map = new Map();
  for (const raw of list) {
    const toks = tokenize(raw);
    if (!toks.length) continue;
    if (!map.has(toks[0])) map.set(toks[0], []);
    map.get(toks[0]).push(toks);
  }
  for (const arr of map.values()) arr.sort((a, b) => b.length - a.length);
  phrases = map;
}

// Trả cụm tục đầu tiên khớp (chuỗi) hoặc null. Mỗi tin chỉ tính 1 lần dù có nhiều từ tục.
function findSwear(text) {
  if (!phrases) build();
  const toks = tokenize(text);
  for (let i = 0; i < toks.length; i += 1) {
    const cands = phrases.get(toks[i]);
    if (!cands) continue;
    for (const c of cands) {
      let ok = true;
      for (let j = 1; j < c.length; j += 1) if (toks[i + j] !== c[j]) { ok = false; break; }
      if (ok) return c.join(' ');
    }
  }
  return null;
}
const _rebuild = () => { phrases = null; };

module.exports = { findSwear, tokenize, VI_HEAVY, VI_MILD, EN_HEAVY, _rebuild };
