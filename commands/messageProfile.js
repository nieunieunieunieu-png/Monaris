// ===== Lệnh mon!: hồ sơ / quan hệ =====
// mon!setpf, mon!setmqh.

const { upsertChatGlobalMember } = require('../googleSheets/chatGlobalSheet');
const { applySetMqh } = require('./slashCommands');
const { BONG_ROLE_ID } = require('../config');
const { hasChatFeatureAccess } = require('../utils/permissions');
const { resolveMentionToken } = require('./messageHelpers');

// Trả về true nếu tin nhắn đã được xử lý ở nhóm lệnh này (tương ứng `return;` trong listener gốc).
async function handleProfileMessageCommands(message, content) {
  if (content.toLowerCase().startsWith('mon!setpf')) {
    // Bản prefix của /setpf — dùng CHUNG cho MỌI server (không cần role
    // Bông, ai cũng set được profile của mình, hoặc set THAY người khác qua
    // tag/@mention hoặc Discord ID). Cú pháp giống mon!us1/us2: các giá trị
    // cách nhau bởi dấu ";", giá trị nào để trống thì GIỮ NGUYÊN dữ liệu cũ
    // (không bị xoá), đúng hành vi của upsertChatGlobalMember.
    const rawArgs = content.substring('mon!setpf'.length).trim();
    const args = rawArgs.split(';').map((arg) => arg.trim());

    const ingame = args[0] || undefined;
    const className = args[1] || undefined;
    const nickname = args[2] || undefined;
    const targetArg = args[3] || '';

    if (!ingame && !className && !nickname) {
      message.reply(
        'Format: `mon!setpf [ingame] ; [class] ; [biet_danh] ; [@tag hoặc Discord ID]`\n' +
          'Ví dụ:\n' +
          '`mon!setpf Kiếm Vương ; Thiếu Lâm ; Boss` (set cho chính bạn)\n' +
          '`mon!setpf Kiếm Vương ; ; ; @user` (set thay người khác đang ở trong server, chỉ đổi ingame)\n' +
          '`mon!setpf Kiếm Vương ; Thiếu Lâm ; ; 123456789012345678` (set thay người quen KHÔNG có trong server, dùng Discord ID)'
      );
      return true;
    }

    const mentionedUser = message.mentions.users.first();
    let resolvedUserId = message.author.id;

    if (mentionedUser) {
      resolvedUserId = mentionedUser.id;
    } else if (targetArg) {
      if (!/^\d{15,25}$/.test(targetArg)) {
        message.reply(
          '❌ Giá trị ở vị trí thứ 4 không hợp lệ — phải là @tag một thành viên trong server, hoặc Discord ID dạng số (VD: 123456789012345678).'
        );
        return true;
      }
      resolvedUserId = targetArg;
    }

    // Set profile của CHÍNH MÌNH vẫn mở cho tất cả như trước giờ — chỉ set
    // THAY người khác (qua @tag hoặc Discord ID) mới cần quyền Bông/AccessID.
    if (resolvedUserId !== message.author.id && !hasChatFeatureAccess(message.author.id, message.member)) {
      message.reply('❌ Bạn không có quyền set profile thay người khác. Cần role Bông hoặc được cấp quyền qua role Bông.');
      return true;
    }

    try {
      const result = await upsertChatGlobalMember({
        discordId: resolvedUserId,
        ingame,
        className,
        nickname,
      });

      const targetLabel =
        resolvedUserId === message.author.id
          ? 'bạn'
          : mentionedUser
          ? `<@${mentionedUser.id}>`
          : `\`${resolvedUserId}\``;

      message.reply(
        `✅ Đã cập nhật profile cho ${targetLabel}:\n` +
          `- Ingame: ${result.ingame || '(chưa có)'}\n` +
          `- Class: ${result.className || '(chưa có)'}\n` +
          `- Biệt Danh: ${result.nickname || '(chưa có)'}`
      );
    } catch (error) {
      console.error('Failed to upsert ChatGlobal profile via mon!setpf:', error.message);
      message.reply('❌ Lỗi khi ghi vào Google Sheet.');
    }
    return true;
  }

  if (content.toLowerCase().startsWith('mon!setmqh')) {
    // Bản prefix của /setmqh — 2 cú pháp được hỗ trợ:
    //
    // (1) `mon!setmqh <idA> <loai> <idB hoặc tên kim lan>` — <loai> chỉ nhận
    //     3 giá trị: suphu | triky | kimlan (không dấu, liền không cách,
    //     khớp đúng "value" của 3 lựa chọn ở slash command).
    // (2) `mon!setmqh dt<idA>; sp<idB>` (hoặc viết đầy đủ `detu<idA>;
    //     suphu<idB>`) — cú pháp gắn nhãn vai trò ngay trước từng ID, NGẮN
    //     GỌN hơn khi set quan hệ Sư Phụ/Đệ Tử (khỏi phải nhớ thứ tự "A
    //     trước, B sau" của cú pháp (1)) — ý nghĩa GIỐNG HỆT `<idA> suphu
    //     <idB>`, chỉ là cách viết khác. Cho phép có/không có khoảng trắng
    //     giữa từ khoá và ID.
    //
    // Cả idA VÀ idB (trừ trường hợp Kim Lan — idB lúc đó là TÊN, không phải
    // ID) đều chấp nhận @mention (<@ID>/<@!ID>) THAY vì phải gõ tay ID dạng
    // số — resolveMentionToken() bên dưới tự bóc ID ra khỏi mention, applySetMqh
    // vẫn nhận đúng ID số thuần như trước, không cần sửa gì ở đó.
    const rawArgs = content.substring('mon!setmqh'.length).trim();

    const roleTaggedMatch = rawArgs.match(
      /^(?:dt|detu)\s*(<@!?\d{15,25}>|\d{15,25})\s*;\s*(?:sp|suphu)\s*(<@!?\d{15,25}>|\d{15,25})\s*$/i
    );
    if (roleTaggedMatch) {
      const [, detuIdRaw, suPhuIdRaw] = roleTaggedMatch;
      const detuId = resolveMentionToken(detuIdRaw);
      const suPhuId = resolveMentionToken(suPhuIdRaw);
      try {
        const result = await applySetMqh(detuId, 'suphu', suPhuId, {
          callerId: message.author.id,
          isBong: Boolean(message.member && message.member.roles.cache.has(BONG_ROLE_ID)),
        });
        message.reply(result.message);
      } catch (error) {
        console.error('Failed to set relationship via mon!setmqh (detu/suphu syntax):', error.message);
        message.reply('❌ Lỗi khi ghi vào Google Sheet.');
      }
      return true;
    }

    const parts = rawArgs.split(/\s+/);
    const idARaw = parts[0];
    const loai = parts[1] ? parts[1].toLowerCase() : '';
    // idB lấy TỪ token thứ 3 trở đi, giữ nguyên khoảng trắng ở giữa — vì
    // tên Kim Lan có thể gồm nhiều từ (vd "Kim Lan Hoa Đào").
    const idBRaw = parts.slice(2).join(' ');

    const idA = resolveMentionToken(idARaw);
    // Kim Lan: idB là TÊN kim lan (text, có thể nhiều từ) — KHÔNG bóc
    // mention cho trường hợp này, giữ nguyên như người dùng gõ.
    const idB = ['kimlan', 'kl'].includes(loai) ? idBRaw : resolveMentionToken(idBRaw);

    if (!idA || !loai || !idB) {
      message.reply(
        'Format: `mon!setmqh <idA> <suphu(sp)|triky(tk)|kimlan(kl)> <idB hoặc tên kim lan>`\n' +
          'hoặc: `mon!setmqh dt<idA>; sp<idB>` (set Sư Phụ/Đệ Tử, tương đương cú pháp trên)\n' +
          '`idA`/`idB` có thể là Discord ID dạng số HOẶC @tag trực tiếp thành viên (trừ idB khi set Kim Lan — lúc đó là TÊN kim lan).\n' +
          'Ví dụ:\n' +
          '`mon!setmqh 398099412070694912 sp 777064247359569941` (A nhận B làm sư phụ)\n' +
          '`mon!setmqh @TênA sp @TênB` (giống hệt ví dụ trên, dùng @tag)\n' +
          '`mon!setmqh dt398099412070694912; sp777064247359569941` (giống hệt ví dụ trên)\n' +
          '`mon!setmqh 398099412070694912 tk 777064247359569941` (A - B thành tri kỷ/chí duyên, tự động 2 chiều)\n' +
          '`mon!setmqh 398099412070694912 kl Kim Lan Hoa Đào` (set Kim Lan cho A, trùng tên = chung kim lan)'
      );
      return true;
    }

    try {
      const result = await applySetMqh(idA, loai, idB, {
        callerId: message.author.id,
        isBong: Boolean(message.member && message.member.roles.cache.has(BONG_ROLE_ID)),
      });
      message.reply(result.message);
    } catch (error) {
      console.error('Failed to set relationship via mon!setmqh:', error.message);
      message.reply('❌ Lỗi khi ghi vào Google Sheet.');
    }
    return true;
  }

  return false;
}

module.exports = {
  handleProfileMessageCommands,
};
