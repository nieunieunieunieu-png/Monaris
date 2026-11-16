// ===== Admin API: tiện ích HTTP =====
// Đọc body JSON (giới hạn dung lượng, decode UTF-8 đúng 1 lần) và trả JSON.

// Giới hạn dung lượng RAW của body JSON gửi lên /admin/* (đặc biệt là
// srcimage/stage — ảnh PNG "Đội Hình" mã hoá base64). TRƯỚC ĐÂY để 1e6
// (~1MB) — quá nhỏ so với giới hạn ảnh THẬT SỰ cho phép (8MB, xem
// MAX_IMAGE_BYTES trong uploadImage/stagedImages.js), nên hầu như MỌI lần
// "Đăng ảnh"/"Cập nhật ảnh" đều bị huỷ kết nối giữa chừng (req.destroy())
// trước khi tới được chỗ kiểm tra 8MB đó — phía web (Monaris Admin) nhận về lỗi
// kết nối, không đọc được data.error, nên chỉ hiện thông báo chung chung
// "Không gửi được ảnh sang Bot.".
//
// Ảnh sau khi mã hoá base64 nặng hơn ~33% so với buffer gốc, cộng thêm phần
// bọc JSON ({"key":"...","imageBase64":"..."}) — nên đặt ngưỡng RAW cao hơn
// hẳn 8MB gốc, đủ dư để không cắt ngang 1 ảnh hợp lệ trước khi setStagedImage()
// tự kiểm tra lại đúng giới hạn 8MB của nó.
const MAX_RAW_BODY_BYTES = 12 * 1024 * 1024;
 // 12MB

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    // QUAN TRỌNG: gom BUFFER (mảng chunks) rồi Buffer.concat() + decode UTF-8
    // ĐÚNG 1 LẦN DUY NHẤT ở cuối — KHÔNG được nối kiểu `raw += chunk` (chunk
    // là Buffer, phép += ép chunk.toString('utf8') ngay lập tức cho TỪNG
    // chunk một). Body có ảnh base64 (bcstat/analyze-image, srcimage/stage...)
    // luôn bị chia thành nhiều chunk TCP vì khá lớn — nếu điểm cắt giữa 2
    // chunk rơi đúng giữa 1 ký tự tiếng Việt nhiều byte (vd "ế", "ợ" trong
    // "Chiến Lược"), decode riêng lẻ từng chunk sẽ biến ký tự đó thành ký tự
    // lỗi (U+FFFD) — JSON vẫn parse được bình thường (không lỗi cú pháp),
    // chỉ riêng giá trị chuỗi đó bị sai vài byte so với bản gốc, nhìn qua
    // giống hệt nhưng so sánh strict-equal (vd tra BCSTAT_TAB_CATEGORY_KEYS)
    // sẽ KHÔNG khớp. Request nhỏ (không kèm ảnh) lọt gọn 1 chunk nên không
    // bao giờ gặp lỗi này — đúng lý do bug chỉ tái hiện khi gửi kèm ảnh.
    const chunks = [];
    let totalBytes = 0;
    let rejected = false;
    req.on('data', (chunk) => {
      if (rejected) return;
      totalBytes += chunk.length; // .length của Buffer = số BYTE thật, không lệch như .length của string đã decode
      if (totalBytes > MAX_RAW_BODY_BYTES) {
        rejected = true;
        // KHÔNG gọi req.destroy() ở đây: req/res dùng chung 1 socket TCP,
        // huỷ req giữa chừng có thể khiến socket đóng luôn trước khi
        // sendJson() (ở handleAdminRequest, chỗ bắt lỗi readJsonBody) kịp
        // ghi phản hồi JSON — khiến client chỉ thấy "mất kết nối" chứ
        // không đọc được thông báo lỗi rõ ràng ở trên. Chỉ cần dừng gom dữ
        // liệu (return sớm ở đầu handler này) là đủ để tránh phình RAM,
        // phần dữ liệu còn lại của request cứ để trôi qua bình thường.
        reject(new Error(`Dữ liệu gửi lên quá lớn (vượt quá ${Math.round(MAX_RAW_BODY_BYTES / (1024 * 1024))}MB).`));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (rejected) return;
      if (!chunks.length) return resolve({});
      const raw = Buffer.concat(chunks).toString('utf8');
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(new Error('Body không phải JSON hợp lệ.'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

module.exports = {
  readJsonBody,
  sendJson,
};
