# Monaris — Ghi chú động tác từ video (thử nghiệm)

Nhánh thử nghiệm: \`feature/video-action-notes\`. Không triển khai trực tiếp lên bản bot đang chạy.

## Cách sử dụng
- **Tự nhận video**: chủ bot gửi link YouTube công khai hoặc tệp video Discord trong kênh riêng được chỉ định.
- **Gọi thủ công**: chủ bot gửi \`mon!dongtac https://www.youtube.com/watch?v=...\` hoặc gửi tệp video kèm nội dung \`mon!dongtac\`.
- Monaris trả tối đa 6 mốc, mỗi mốc gồm **Động tác nam**, **Động tác nữ** và ảnh khung hình (nếu có tệp video Discord).
- Nếu chưa nhận diện được vai, bot phải ghi không xác định rõ thay vì đoán.
- Monaris không tự bật trên tất cả kênh: chỉ tài khoản chủ bot được dùng và chỉ kênh riêng tự nhận link.

## Giới hạn của phiên bản đầu
- Video Discord trực tiếp: MP4/MOV/WebM/MPEG, tối đa **9 MB**; **phải cài FFmpeg** để chụp ảnh. Ảnh là khung hình nguyên bản trong clip, được giảm kích thước; không tự chỉnh sửa nhân vật.
- Link YouTube **công khai**: gửi URL trực tiếp vào Gemini để lấy ghi chú và mốc thời gian. **Chưa chụp được ảnh** chỉ từ URL vì không tải/cắt video YouTube; nếu cần ảnh, gửi chính tệp clip vào Discord.
- TikTok, Douyin, Facebook Reels, các link tùy ý **chưa hỗ trợ**. Bot không bao giờ tự fetch URL chưa được cho phép trên máy công ty (tránh SSRF).
- Chưa tự ghi Google Sheets/Drive: hiện trả ghi chú và ảnh trực tiếp trong Discord. Nếu cần lưu kho, bổ sung API Google sau khi xác nhận mẫu.
- Gemini tính quota trên tài khoản API hiện có. Phân tích video có thể thất bại do quota, định dạng hoặc giới hạn mô hình.
- Mặc định có tối đa một video đang xử lý để tránh ngốn RAM. File video và ảnh tạm được xóa sau khi xử lý.

## Biến môi trường
- \`GEMINI_API_KEY\`: dùng khóa Gemini hiện tại.
- \`ADMIN_USER_ID\`: mặc định được sử dụng để xác thực người điều khiển (chủ bot).
- \`MONARIS_VIDEO_OWNER_ID\` (không bắt buộc): nếu muốn giới hạn một tài khoản khác.
- \`MONARIS_VIDEO_CHANNEL_ID\` (không bắt buộc): kênh tự xử lý video; nếu bỏ trống dùng kênh riêng Monaris hiện tại.
- \`MONARIS_VIDEO_MODEL\` (không bắt buộc): mặc định dùng model Gemini đầu tiên trong \`GEMINI_MODEL\`, hoặc \`gemini-2.5-flash\`.
- \`MONARIS_FFMPEG_PATH\` (không bắt buộc): đường dẫn \`ffmpeg.exe\` nếu FFmpeg chưa có trong PATH.

## Thử nghiệm trước khi deploy
1. Trên máy **thử nghiệm** đã cài Node.js tương thích với bản đang chạy, \`npm ci\` và \`npm test\`. Không chạy đồng thời cùng Discord token trên hai bot.
2. Kiểm tra \`ffmpeg -version\` trong CMD.
3. Bảo đảm bot có quyền View Channel, Send Messages, Attach Files và Read Message History trong kênh thử nghiệm.
4. Dừng bản bot cũ trước khi khởi động bản nâng cấp bằng cùng token.
5. Gửi tệp video ngắn, kiểm tra ghi chú, ảnh đính kèm và mốc thời gian; sau đó mới thử YouTube.

> Nhánh này chỉ mới được viết và kiểm tra tĩnh, chưa chạy thử thực tế với Gemini/Discord/FFmpeg. Không tự động đưa vào \`monaris-lite\` hoặc máy công ty.
