"use strict";
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, 'settings.json');
const defaults = { warmth: 90, proactive: 90, humor: 65, concise: 75 };
function read() { try { const x=JSON.parse(fs.readFileSync(FILE,'utf8')); return { ...defaults, ...x }; } catch { return {...defaults}; } }
function save(body) {
 const out={};
 for (const key of Object.keys(defaults)) { const n=Number(body[key]); if (!Number.isInteger(n)||n<0||n>100) throw new Error('Giá trị '+key+' phải từ 0 đến 100'); out[key]=n; }
 fs.writeFileSync(FILE+'.tmp', JSON.stringify(out,null,2), {mode:0o600}); fs.renameSync(FILE+'.tmp', FILE); return out;
}
function prompt() { const x=read(); return `\n[CẤU HÌNH TÍNH CÁCH ADMIN] Nhiệt tình ${x.warmth}/100, chủ động hỗ trợ ${x.proactive}/100, hài hước ${x.humor}/100, ưu tiên ngắn gọn ${x.concise}/100. Trả lời trực tiếp câu hỏi nếu có đủ thông tin, không hỏi lại vô ích. Luôn giữ độ chính xác, không bịa thông tin. [/CẤU HÌNH]`; }
module.exports={read,save,prompt};
