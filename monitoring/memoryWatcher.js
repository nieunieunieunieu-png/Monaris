// Theo dõi RAM tiến trình Node đang dùng so với giới hạn RAM của service
// trên Railway (config.js -> MEMORY_LIMIT_MB), tự chat vào kênh
// MEMORY_ALERT_CHANNEL_ID khi vượt các mốc 50% / 90% — để KHÔNG cần chủ
// động mở dashboard Railway hay dùng dịch vụ ngoài (UptimeRobot...) mới
// biết RAM đang tăng dần.
//
// Dùng process.memoryUsage().rss (Resident Set Size — tổng RAM vật lý tiến
// trình Node đang chiếm, gồm cả code, stack, heap, buffer...) làm tử số vì
// đây là con số GẦN NHẤT với thứ Railway/hệ điều hành dùng để quyết định có
// OOM-kill hay không, thay vì chỉ heapUsed (chỉ tính riêng V8 heap, bỏ sót
// Buffer/stream ngoài heap).
const client = require('../client');
const { MEMORY_ALERT_CHANNEL_ID, MEMORY_LIMIT_MB } = require('../config');

// Các mốc % cảnh báo, tăng dần. Mỗi mốc chỉ báo 1 LẦN cho tới khi RAM tụt
// hẳn xuống dưới mốc thấp nhất (50%) — tránh spam kênh liên tục mỗi 5 phút
// trong lúc RAM cứ lơ lửng quanh 1 mốc nào đó.
const THRESHOLDS = [50, 90];

// Set các mốc ĐÃ báo trong lần chạy (process) hiện tại — tự reset về rỗng
// mỗi khi bot restart (kể cả do chính leak gây OOM), nên không cần lưu bền.
let alertedThresholds = new Set();
let wasElevated = false; // để biết có nên báo "đã trở lại bình thường" hay không

function formatMb(bytes) {
  return (bytes / (1024 * 1024)).toFixed(1);
}

async function sendAlertToChannel(content) {
  if (!MEMORY_ALERT_CHANNEL_ID) return;
  try {
    const channel = await client.channels.fetch(MEMORY_ALERT_CHANNEL_ID);
    await channel.send({ content, allowedMentions: { parse: [] } });
  } catch (error) {
    console.error('Không thể gửi cảnh báo RAM vào kênh:', error.message);
  }
}

async function checkMemoryUsage() {
  const memUsage = process.memoryUsage();
  const rssMb = memUsage.rss / (1024 * 1024);
  const percent = (rssMb / MEMORY_LIMIT_MB) * 100;

  // Tìm mốc CAO NHẤT đã vượt mà chưa báo — nếu RAM nhảy vọt qua nhiều mốc
  // cùng lúc (vd 20% -> 80%) chỉ gửi 1 DM duy nhất cho mốc cao nhất, kèm
  // đánh dấu luôn các mốc thấp hơn là "đã báo" để không báo lại lẻ tẻ.
  let highestNewThreshold = null;
  for (const threshold of THRESHOLDS) {
    if (percent >= threshold) {
      if (!alertedThresholds.has(threshold)) highestNewThreshold = threshold;
      alertedThresholds.add(threshold);
    }
  }

  if (highestNewThreshold !== null) {
    wasElevated = true;
    const emoji = highestNewThreshold >= 90 ? '🔴' : '🟡';
    await sendAlertToChannel(
      `${emoji} **Cảnh báo RAM: đã vượt ${highestNewThreshold}%**\n` +
        `Đang dùng: **${formatMb(memUsage.rss)} MB** / ${MEMORY_LIMIT_MB} MB (**${percent.toFixed(1)}%**)\n` +
        `Heap: ${formatMb(memUsage.heapUsed)} MB / ${formatMb(memUsage.heapTotal)} MB · Uptime: ${Math.floor(process.uptime() / 60)} phút\n` +
        (highestNewThreshold >= 90
          ? '⚠️ Rất gần giới hạn — Railway có thể OOM-kill bot bất kỳ lúc nào.'
          : 'Theo dõi thêm — nếu tiếp tục tăng đều dù không ai dùng bot, khả năng cao là leak.')
    );
    return;
  }

  // RAM tụt hẳn về dưới mốc thấp nhất sau khi từng báo động -> báo 1 lần
  // là đã ổn lại, đồng thời reset để có thể báo lại từ đầu nếu tăng nữa.
  if (wasElevated && percent < THRESHOLDS[0]) {
    wasElevated = false;
    alertedThresholds = new Set();
    await sendAlertToChannel(
      `✅ RAM đã trở lại bình thường: ${formatMb(memUsage.rss)} MB / ${MEMORY_LIMIT_MB} MB (${percent.toFixed(1)}%).`
    );
  }
}

// Snapshot RAM hiện tại — KHÔNG có tác dụng phụ nào (không đánh dấu mốc đã
// báo, không gửi tin cảnh báo) — dùng cho route GET /admin/health để hiển
// thị badge "RAM: xx%" trên trang Quản lý Bot, tách biệt hoàn toàn khỏi cơ
// chế cảnh báo tự động ở checkMemoryUsage() phía trên.
function getMemoryStatus() {
  const memUsage = process.memoryUsage();
  const rssMb = memUsage.rss / (1024 * 1024);
  const percent = (rssMb / MEMORY_LIMIT_MB) * 100;
  return {
    rssMb: Number(rssMb.toFixed(1)),
    heapUsedMb: Number(formatMb(memUsage.heapUsed)),
    heapTotalMb: Number(formatMb(memUsage.heapTotal)),
    limitMb: MEMORY_LIMIT_MB,
    percent: Number(percent.toFixed(1)),
    uptimeSeconds: Math.floor(process.uptime()),
  };
}

function startMemoryWatcher(intervalMinutes = 5) {
  setInterval(checkMemoryUsage, intervalMinutes * 60 * 1000);
  console.log(
    `Started memory watcher (checks every ${intervalMinutes} phút, limit = ${MEMORY_LIMIT_MB} MB, ngưỡng ${THRESHOLDS.join('/')}%).`
  );
}

module.exports = { startMemoryWatcher, checkMemoryUsage, getMemoryStatus };
