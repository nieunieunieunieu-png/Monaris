// ===== Gọi Gemini generateContent (thấp nhất, không biết gì về prompt cụ thể) =====
// Tách khỏi aiClient.js.
const { GEMINI_API_KEY, GEMINI_MODELS } = require('../config');
const { SYSTEM_INSTRUCTION } = require('./systemInstruction');

const GEMINI_ENDPOINT = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

// Gọi API cho 1 model cụ thể. Trả về { ok: true, text } khi thành công,
// { ok: false, status, errText } khi thất bại — để hàm gọi ngoài biết được
// mã lỗi (đặc biệt là 429) để quyết định có nên fallback sang model khác không.
// options (tuỳ chọn): { systemInstruction, temperature } — không truyền thì dùng
// persona chat mặc định như cũ (translate/index.js truyền system instruction riêng).
async function callGeminiModel(model, prompt, options = {}) {
  const body = {
    systemInstruction: { parts: [{ text: options.systemInstruction || SYSTEM_INSTRUCTION }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  };
  if (typeof options.temperature === 'number') {
    body.generationConfig = { temperature: options.temperature };
  }

  const response = await fetch(GEMINI_ENDPOINT(model), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
    signal: AbortSignal.timeout(90000),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    return { ok: false, status: response.status, errText };
  }

  const data = await response.json();
  const candidate = data?.candidates?.[0];
  const text = candidate?.content?.parts?.map((part) => part.text).join('') ?? '';

  return { ok: true, text: text.trim() };
}

// Thử lần lượt từng model trong GEMINI_MODELS. Chỉ fallback sang model tiếp
// theo khi lỗi là 429 (hết quota) — các lỗi khác (400, 500...) dừng luôn vì
// đổi model không giải quyết được, tránh gọi API thừa vô ích.
async function callGeminiWithFallback(prompt, options = {}) {
  const models = GEMINI_MODELS;
  if (!models.length) {
    console.error('GEMINI_MODELS rỗng — kiểm tra lại config.js.');
    return null;
  }

  for (let i = 0; i < models.length; i += 1) {
    const model = models[i];
    const isLastModel = i === models.length - 1;

    try {
      const result = await callGeminiModel(model, prompt, options);

      if (result.ok) {
        return result.text || null;
      }

      console.error(`Gemini API lỗi (model="${model}"):`, result.status);

      if ([404, 429, 500, 502, 503, 504].includes(result.status) && !isLastModel) {
        console.warn(`Model "${model}" hết quota, chuyển sang model dự phòng tiếp theo...`);
        continue;
      }

      if (result.status === 429) {
        return '__QUOTA_EXCEEDED__'; // đánh dấu đặc biệt để askGemini() trả đúng message
      }
      return null;
    } catch (error) {
      console.error(`Gọi Gemini API thất bại (model="${model}"):`, error.message);
      if (isLastModel) return null;
      // Lỗi mạng/lỗi bất ngờ cũng thử model tiếp theo, không dừng hẳn.
    }
  }

  return null;
}

module.exports = { callGeminiWithFallback };
