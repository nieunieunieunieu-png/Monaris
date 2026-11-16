// ===== Build khối "lịch scrim/bang chiến thật" + "lịch sử chat" cho prompt =====
// Tách khỏi aiClient.js.

// Build khối "LỊCH SCRIM/BANG CHIẾN THỰC TẾ" từ scrimData/bcData (state.js,
// được Bông cập nhật qua mon!us1 / mon!us2 mỗi tuần) — để AI trả lời ĐÚNG giờ
// đánh scrim thật khi được hỏi kiểu tự do qua "bot ơi, ..." / reply / tag
// thẳng bot (KHÁC với nhánh SCRIM_QUERY_KEYWORDS cố định ở AutoReply/index.js,
// nhánh đó chỉ bắt được đúng vài cụm từ cố định, không qua AI nên không hiểu
// được câu hỏi diễn đạt kiểu khác). Không có scrimData thì bỏ qua, không
// chèn khối rỗng vào prompt.
function buildScrimContextBlock(scrimData, bcData) {
  if (!require('../config/branding').BANG_INTEGRATION_ENABLED) return '';
  if (!scrimData) return '';

  const time1 = scrimData.session1Time || 'chưa rõ giờ';
  const time2 = scrimData.session2Time || 'chưa rõ giờ';
  const date1 = scrimData.session1Date ? ` (ngày ${scrimData.session1Date})` : '';
  const date2 = scrimData.session2Date ? ` (ngày ${scrimData.session2Date})` : '';

  const bcCheckinNote = bcData && bcData.messageId
    ? 'Tin điểm danh Bang Chiến tuần này ĐÃ được gửi.'
    : 'Tin điểm danh Bang Chiến tuần này CHƯA được gửi.';

  return (
    `\n\nTHÔNG TIN LỊCH SCRIM/BANG CHIẾN TUẦN NÀY (dữ liệu THẬT, do Bông cập nhật, PHẢI dùng ĐÚNG y ` +
    `hệt khi được hỏi về giờ/ngày/đối thủ đánh scrim hay bang chiến, TUYỆT ĐỐI KHÔNG bịa ra số liệu ` +
    `khác hay dùng giờ Bang Chiến cố định (tối Thứ 7, 20h) để trả lời thay cho giờ Scrim — 2 thứ khác nhau):\n` +
    `- Buổi 1: đối thủ "${scrimData.session1Opponent || 'chưa rõ'}" - ${scrimData.session1Day || 'chưa rõ ngày'} - ` +
    `${time1}${date1} - số trận: ${scrimData.session1Matches || 'chưa rõ'}\n` +
    `- Buổi 2: đối thủ "${scrimData.session2Opponent || 'chưa rõ'}" - ${scrimData.session2Day || 'chưa rõ ngày'} - ` +
    `${time2}${date2} - số trận: ${scrimData.session2Matches || 'chưa rõ'}\n` +
    `- Bang chiến: ${bcCheckinNote} (giờ Bang chiến cố định hàng tuần đã biết ở trên, không liên quan tới giờ Scrim này).`
  );
}

// Build khối "lịch sử trò chuyện gần đây" từ chatHistory = [{ userDisplayName,
// userMessage, botReply }] (lấy từ googleSheets/chatHistorySheet.js ->
// getRecentChatHistoryForChannel(), đã theo đúng thứ tự CŨ -> MỚI) — nhét
// vào prompt để AI biết mạch chuyện CHUNG của cả kênh (không chỉ riêng người
// đang gõ lần này), trả lời được các câu nhắc lại/tiếp nối ý trước đó (vd
// "lúc nãy tao hỏi gì ấy nhỉ", "ừ đúng rồi đó", hay đang nói dở về ai đó thì
// câu sau vẫn phải hiểu đang nói tiếp về người/chuyện đó) thay vì mỗi lượt
// là mất trí nhớ hoàn toàn. Ghi kèm tên người nói ở mỗi dòng vì giờ lịch sử
// gộp chung nhiều người trong cùng channel, không còn là 1 người duy nhất.
function buildChatHistoryBlock(chatHistory) {
  if (!Array.isArray(chatHistory) || !chatHistory.length) return '';

  const lines = chatHistory
    .map((entry) => `${entry.userDisplayName || 'Người dùng'}: ${entry.userMessage}\nBạn: ${entry.botReply}`)
    .join('\n');

  return (
    `\n\nLỊCH SỬ TRÒ CHUYỆN GẦN ĐÂY trong CÙNG kênh này (cũ -> mới, có thể có nhiều người khác nhau ` +
    `tham gia, chỉ để tham khảo ngữ cảnh, KHÔNG cần lặp lại nguyên văn) — dùng để nối mạch chuyện ` +
    `cho tự nhiên khi tin nhắn hiện tại có nhắc/nối tiếp điều gì đó ở đây (đang nói dở về ai/việc ` +
    `gì thì hiểu là nói tiếp, đừng trả lời như không liên quan gì tới lượt trước):\n${lines}`
  );
}

module.exports = { buildScrimContextBlock, buildChatHistoryBlock };
