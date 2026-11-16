// ===== AutoReply: ngữ cảnh THỜI GIAN + BANG cho prompt =====
// Đưa vào prompt giờ hiện tại (giờ VN), thứ mấy, còn bao lâu tới bang chiến / scrim, và tin điểm danh bang chiến
// tuần này đã đăng chưa — để bot nói "đúng lúc" (vd "tối nay bang chiến mà giờ này còn ngủ") thay vì trả lời chung chung.
// Mọi con số do CODE tính (không để AI tự tính), dữ liệu lấy từ scrimData/bcData (state.js) + config/schedule.js.

const { getVnNow, parseVnWeekday, parseScrimTime } = require('../utils/time');
const { BC_EVENT_DAY, BC_EVENT_HOUR, BC_EVENT_MINUTE } = require('../config');

const WEEKDAY_NAMES = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

function pad2(n) {
  return String(n).padStart(2, '0');
}

function getDayPart(hour) {
  if (hour < 5) return 'khuya';
  if (hour < 11) return 'sáng';
  if (hour < 14) return 'trưa';
  if (hour < 18) return 'chiều';
  if (hour < 22) return 'tối';
  return 'đêm';
}

function formatDuration(ms) {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days} ngày ${hours} giờ`;
  if (hours > 0) return `${hours} giờ ${minutes} phút`;
  return `${minutes} phút`;
}

// Thời điểm kế tiếp (tính từ vnNow) của "weekday hour:minute". Cùng ngày mà đã qua giờ -> passedToday = true.
// vnNow là Date đã dịch sang giờ VN (getVnNow) nên dùng getter local nhất quán với phần còn lại của bot.
function untilNext(vnNow, weekday, hour, minute) {
  const deltaDays = (weekday - vnNow.getDay() + 7) % 7;
  const target = new Date(vnNow.getFullYear(), vnNow.getMonth(), vnNow.getDate() + deltaDays, hour, minute, 0, 0);
  const diffMs = target.getTime() - vnNow.getTime();
  if (deltaDays === 0 && diffMs < 0) return { passedToday: true, diffMs, deltaDays };
  return { passedToday: false, diffMs, deltaDays };
}

function isConfirmedOpponent(opponent) {
  const o = String(opponent || '').trim().toLowerCase();
  return Boolean(o) && o !== 'đang tìm...' && o !== 'đang tìm';
}

function describeScrimSession(vnNow, label, opponent, dayLabel, timeLabel) {
  if (!isConfirmedOpponent(opponent)) return null;

  const weekday = parseVnWeekday(dayLabel);
  if (weekday === null) return `- Scrim ${label}: đối thủ "${opponent}" (chưa rõ ngày đánh)`;

  const time = parseScrimTime(timeLabel);
  const whenText = `${dayLabel}${time ? ` lúc ${pad2(time.hour)}:${pad2(time.minute)}` : ' (chưa rõ giờ)'}`;

  if (!time) {
    const deltaDays = (weekday - vnNow.getDay() + 7) % 7;
    const rel = deltaDays === 0 ? 'hôm nay' : deltaDays === 1 ? 'ngày mai' : `còn ${deltaDays} ngày nữa`;
    return `- Scrim ${label}: đối thủ "${opponent}", ${whenText} — ${rel}`;
  }

  const info = untilNext(vnNow, weekday, time.hour, time.minute);
  if (info.passedToday) return `- Scrim ${label}: đối thủ "${opponent}", ${whenText} — hôm nay, ĐÃ qua giờ bắt đầu`;
  if (info.deltaDays === 0) return `- Scrim ${label}: đối thủ "${opponent}", ${whenText} — HÔM NAY, còn ${formatDuration(info.diffMs)} nữa`;
  return `- Scrim ${label}: đối thủ "${opponent}", ${whenText} — còn ${formatDuration(info.diffMs)} nữa`;
}

function buildTimeContextBlock(scrimData, bcData) {
  const vnNow = getVnNow();
  const hour = vnNow.getHours();
  const minute = vnNow.getMinutes();
  const weekday = vnNow.getDay();

  const lines = [];
  lines.push(
    `- Bây giờ: ${pad2(hour)}:${pad2(minute)}, ${WEEKDAY_NAMES[weekday]}, ngày ${pad2(vnNow.getDate())}/${pad2(vnNow.getMonth() + 1)}/${vnNow.getFullYear()} (${getDayPart(hour)}).`
  );

  if (require('../config/branding').BANG_INTEGRATION_ENABLED) {
  const bc = untilNext(vnNow, BC_EVENT_DAY, BC_EVENT_HOUR, BC_EVENT_MINUTE);
  const bcTime = `${pad2(BC_EVENT_HOUR)}:${pad2(BC_EVENT_MINUTE)}`;
  const checkinNote = bcData && bcData.messageId
    ? 'tin điểm danh Bang Chiến tuần này ĐÃ được đăng'
    : 'tin điểm danh Bang Chiến tuần này CHƯA được đăng';
  if (bc.passedToday) {
    lines.push(`- Bang chiến: tối nay (${WEEKDAY_NAMES[BC_EVENT_DAY]}) đã tới/qua giờ bắt đầu ${bcTime}; ${checkinNote}.`);
  } else if (bc.deltaDays === 0) {
    lines.push(`- Bang chiến: HÔM NAY (${WEEKDAY_NAMES[BC_EVENT_DAY]}) lúc ${bcTime}, còn ${formatDuration(bc.diffMs)} nữa; ${checkinNote}.`);
  } else {
    lines.push(`- Bang chiến: ${WEEKDAY_NAMES[BC_EVENT_DAY]} lúc ${bcTime}, còn ${formatDuration(bc.diffMs)} nữa; ${checkinNote}.`);
  }

  if (scrimData) {
    const s1 = describeScrimSession(vnNow, '1', scrimData.session1Opponent, scrimData.session1Day, scrimData.session1Time);
    const s2 = describeScrimSession(vnNow, '2', scrimData.session2Opponent, scrimData.session2Day, scrimData.session2Time);
    if (s1) lines.push(s1);
    if (s2) lines.push(s2);
  }

  }

  return (
    `\n\nNGỮ CẢNH THỜI GIAN HIỆN TẠI (giờ Việt Nam, số liệu THẬT do hệ thống tính sẵn): chỉ dùng khi hợp với ` +
    `chuyện đang nói để câu trả lời "đúng lúc" hơn (vd khuya rồi mà người ta còn thức thì trêu nhẹ, gần giờ bang ` +
    `chiến thì nhắc/rủ nhẹ). KHÔNG đọc lại nguyên khối này, KHÔNG nhắc giờ giấc/lịch nếu chuyện đang nói không ` +
    `liên quan, KHÔNG tự bịa thêm sự kiện hay giờ khác ngoài những gì ghi ở đây:\n${lines.join('\n')}`
  );
}

module.exports = { buildTimeContextBlock };
