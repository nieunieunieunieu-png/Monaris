// ===== config/featureFlags.js — Công tắc bật/tắt tính năng vui/giải trí (chỉnh trên web Monaris Admin) =====
// Chỉ chứa giá trị, không chứa logic. Danh sách tính năng nằm ở features/registry.js.
//
// ENV (đều tuỳ chọn): FEATURE_FLAGS_SHEET_NAME (mặc định "Công Tắc Tính Năng", tab nằm trong sheet chính GOOGLE_SHEET_ID).
// Tab này bot tự tạo; sửa tay cột C (bật/tắt) rồi gọi POST /admin/features/reload (hoặc restart bot) để áp dụng.

const FEATURE_FLAGS_SHEET_NAME = process.env.FEATURE_FLAGS_SHEET_NAME || 'Công Tắc Tính Năng';

module.exports = { FEATURE_FLAGS_SHEET_NAME };
