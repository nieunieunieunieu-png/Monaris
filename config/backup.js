// ===== config/backup.js — Sao lưu Google Sheet hằng ngày sang Google Drive =====
// Chỉ chứa giá trị, không chứa logic. Xem backup/index.js.
//
// Cách hoạt động: mỗi ngày (giờ VN) bot dùng Drive API "tạo bản sao" từng spreadsheet của bot
// vào 1 folder Drive riêng, tên "Monaris-backup <ngày> | <tên sheet> | <8 ký tự đầu ID>", rồi tự xoá
// các bản cũ hơn BACKUP_KEEP_DAYS ngày. Bản sao giữ nguyên công thức + định dạng.
//
// BẮT BUỘC: tạo 1 folder trên Drive, share cho email service account của bot với quyền Editor,
// rồi set ENV BACKUP_DRIVE_FOLDER_ID = ID folder (đoạn cuối URL .../folders/<ID>).
// Chưa set thì tính năng tự tắt (chỉ ghi 1 dòng cảnh báo vào log lúc khởi động).

const BACKUP_DRIVE_FOLDER_ID = (process.env.BACKUP_DRIVE_FOLDER_ID || '').trim();

// ENV BACKUP_ENABLED=false để tắt hẳn dù đã có folder.
const BACKUP_ENABLED = !/^(0|false|off|no)$/i.test(String(process.env.BACKUP_ENABLED || 'true').trim());

// Giờ chạy hằng ngày theo giờ Việt Nam (0-23). Mặc định 4h sáng (ít người dùng bot nhất).
const BACKUP_HOUR_VN = (() => {
  const value = Number(process.env.BACKUP_HOUR_VN);
  return Number.isInteger(value) && value >= 0 && value <= 23 ? value : 4;
})();

// Giữ bản sao lưu bao nhiêu ngày (cũ hơn thì tự xoá). Tối thiểu 1.
const BACKUP_KEEP_DAYS = Math.max(1, Number(process.env.BACKUP_KEEP_DAYS) || 7);

// Tiền tố tên file — CHỈ file có tên bắt đầu bằng "<tiền tố> " trong folder backup mới bị tự xoá.
const BACKUP_NAME_PREFIX = 'Monaris-backup';

// Spreadsheet ID thêm tay (cách nhau dấu phẩy) — ngoài danh sách tự gom từ config.
const BACKUP_EXTRA_SPREADSHEET_IDS = (process.env.BACKUP_EXTRA_SPREADSHEET_IDS || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

// Nghỉ giữa 2 lần sao chép (ms) để không dồn request Drive.
const BACKUP_STEP_DELAY_MS = 1500;

// Sau khi khởi động bao lâu thì chạy "bù" nếu đã quá giờ backup mà hôm nay chưa có bản nào (ms).
const BACKUP_CATCHUP_DELAY_MS = 10 * 60 * 1000;

module.exports = {
  BACKUP_DRIVE_FOLDER_ID,
  BACKUP_ENABLED,
  BACKUP_HOUR_VN,
  BACKUP_KEEP_DAYS,
  BACKUP_NAME_PREFIX,
  BACKUP_EXTRA_SPREADSHEET_IDS,
  BACKUP_STEP_DELAY_MS,
  BACKUP_CATCHUP_DELAY_MS,
};
