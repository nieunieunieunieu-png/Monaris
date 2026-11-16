// ===== AutoReply/knowledgeFuzzy.js — tìm gần đúng trong kho kiến thức =====
// Dùng cho: nút "🔍 Tìm" ở Hub Tra Cứu (hub/knowledgeLookup.js) và gợi ý "Có phải ý bạn là…"
// khi gọi "bot, ... ?" mà không mục nào khớp từ khoá (AutoReply/knowledgeQuestion.js).
// Khác findMatchedEntries (bắt buộc từ khoá nằm nguyên trong câu hỏi): ở đây chịu được gõ sai dấu, thiếu chữ, gõ tắt đầu từ.
// Không gọi API nào, chỉ so chuỗi trên các mục đã có trong cache kho.

function norm(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Hệ số Dice trên cặp ký tự liền nhau (0..1), bỏ khoảng trắng để "cuu linh" ~ "cuulinh".
function dice(a, b) {
  const x = a.replace(/ /g, '');
  const y = b.replace(/ /g, '');
  if (x.length < 2 || y.length < 2) return x && x === y ? 1 : 0;
  const pairs = new Map();
  for (let i = 0; i < x.length - 1; i += 1) {
    const pair = x.slice(i, i + 2);
    pairs.set(pair, (pairs.get(pair) || 0) + 1);
  }
  let hit = 0;
  for (let i = 0; i < y.length - 1; i += 1) {
    const pair = y.slice(i, i + 2);
    const left = pairs.get(pair) || 0;
    if (left > 0) {
      pairs.set(pair, left - 1);
      hit += 1;
    }
  }
  return (2 * hit) / (x.length - 1 + (y.length - 1));
}

// Mỗi từ của câu tìm được chấm theo từ giống nhất trong ứng viên; trả trung bình (0..1).
function tokenCover(queryTokens, candidateTokens) {
  const usable = queryTokens.filter((t) => t.length >= 2);
  if (!usable.length || !candidateTokens.length) return 0;
  let total = 0;
  for (const q of usable) {
    let best = 0;
    for (const c of candidateTokens) {
      let score = 0;
      if (q === c) score = 1;
      else if (Math.min(q.length, c.length) >= 3 && (c.startsWith(q) || q.startsWith(c))) score = 0.85;
      else {
        const d = dice(q, c);
        if (d >= 0.7) score = d * 0.9;
      }
      if (score > best) best = score;
    }
    total += best;
  }
  return total / usable.length;
}

function similarity(query, candidate) {
  if (!query || !candidate) return 0;
  if (` ${query} `.includes(` ${candidate} `) || ` ${candidate} `.includes(` ${query} `)) return 0.95;
  if (Math.min(query.length, candidate.length) >= 3 && (query.includes(candidate) || candidate.includes(query))) return 0.7;
  return Math.max(dice(query, candidate), tokenCover(query.split(' '), candidate.split(' ')) * 0.9);
}

// Trả [{ entry, score }] điểm giảm dần (hoà thì theo thứ tự dòng), chỉ giữ score >= minScore, tối đa `limit`.
//   score = độ giống nhất giữa câu tìm với chủ đề / từ khoá; nếu mọi từ của câu tìm đều có trong nội dung mục thì tối thiểu 0.5.
function searchEntries(query, entries, { limit = 25, minScore = 0.4 } = {}) {
  const q = norm(query);
  if (q.replace(/ /g, '').length < 2) return [];
  const queryTokens = q.split(' ').filter((t) => t.length >= 2);
  const results = [];
  for (const entry of entries || []) {
    let best = similarity(q, norm(entry.topic));
    for (const keyword of entry.keywords || []) {
      best = Math.max(best, similarity(q, norm(keyword)));
    }
    if (best < 0.5 && queryTokens.length) {
      const words = new Set(norm(entry.content).split(' '));
      if (queryTokens.every((t) => words.has(t))) best = Math.max(best, 0.5);
    }
    if (best >= minScore) results.push({ entry, score: best });
  }
  results.sort((a, b) => b.score - a.score || a.entry.row - b.entry.row);
  return results.slice(0, limit);
}

module.exports = { searchEntries, normalizeLoose: norm };
