// ===== Gọi Serper (https://serper.dev) để lấy kết quả search thật =====
// Tách khỏi aiClient.js. Search ("bot ơi tìm,") KHÔNG dùng Google Search
// grounding built-in của Gemini nữa (bị chặn quota trên free tier chưa gắn
// billing). Thay vào đó: gọi Serper lấy kết quả search thật, nhét vào
// prompt, rồi để Gemini (model chat bình thường) tổng hợp câu trả lời.
const { SERPER_API_KEY } = require('../config');
const { isBlockedContentQuery } = require('./contentFilter');

const SERPER_ENDPOINT = 'https://google.serper.dev/search';

// Trả về { text, links } khi thành công (text để nhét vào prompt, links để
// hiển thị "Nguồn:" cho user), hoặc null nếu lỗi/không có kết quả.
async function fetchSerperResults(query) {
  if (!SERPER_API_KEY) {
    console.error('SERPER_API_KEY chưa được set — không thể search.');
    return null;
  }

  try {
    const response = await fetch(SERPER_ENDPOINT, {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, gl: 'vn', hl: 'vi' }),
    });

    if (!response.ok) {
      console.error('Serper API lỗi:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const parts = [];
    const links = [];

    // Lọc bỏ từng mục kết quả có dính từ khoá bị chặn — dù CÂU HỎI sạch,
    // KẾT QUẢ Google trả về vẫn có thể dính tiêu đề/snippet/link 18+
    // (search engine không đảm bảo an toàn 100%), nên phải lọc lại lần nữa
    // ở đây trước khi đưa vào prompt hoặc hiện link nguồn cho người dùng.
    const isSafe = (text) => text && !isBlockedContentQuery(text);

    if (data.answerBox) {
      const answerText = data.answerBox.answer || data.answerBox.snippet;
      if (answerText && isSafe(answerText)) parts.push(`Answer box: ${answerText}`);
    }

    if (data.knowledgeGraph) {
      const kg = data.knowledgeGraph;
      const kgText = `${kg.title || ''} - ${kg.description || ''}`;
      if (isSafe(kgText)) {
        parts.push(`Knowledge graph: ${kgText}`);
        if (kg.descriptionLink && isSafe(kg.descriptionLink)) links.push(kg.descriptionLink);
      }
    }

    if (Array.isArray(data.organic)) {
      data.organic
        .filter((item) => isSafe(item.title) && isSafe(item.snippet) && isSafe(item.link))
        .slice(0, 5)
        .forEach((item, i) => {
          parts.push(`[${i + 1}] ${item.title}: ${item.snippet} (${item.link})`);
          if (item.link) links.push(item.link);
        });
    }

    if (!parts.length) return null;

    return {
      text: parts.join('\n'),
      links: links.slice(0, 2), // chỉ giữ 2 link đầu để hiển thị "Nguồn:"
    };
  } catch (error) {
    console.error('Gọi Serper API thất bại:', error.message);
    return null;
  }
}

module.exports = { fetchSerperResults };
