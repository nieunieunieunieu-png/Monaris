'use strict';
// Samples are local and scoped to this one guild/channel; no user-account token.
const OWNER = '1398428399357268068';
const GUILD = '1566691700850688013';
const CHANNEL = '1566698252567318538';
const fs = require('node:fs');
const path = require('node:path');
const FILE = path.join(__dirname, '..', 'data', 'owner-style.json');
function inScope(m) { return m.guildId === GUILD && m.channelId === CHANNEL; }
function explicitOwnerTag(m) { return new RegExp(`<@!?${OWNER}>`).test(m.content || ''); }
function clean(s) {
  return String(s || '').replace(/https?:\/\/\S+/g, '[link]')
    .replace(/<@!?\d+>/g, '[người được nhắc]')
    .replace(/AIza[\w-]+|[\w-]{24,}\.[\w-]{6,}\.[\w-]{20,}/g, '[đã ẩn khóa]')
    .slice(0, 700);
}
// Resolve live Discord mentions before passing the current message to Gemini.
function resolveLiveMentions(text, message) {
  return String(text || '').replace(/<@!?(\d+)>/g, (raw, id) => {
    if (id === OWNER) return '@Bông';
    const member = message.mentions?.members?.get(id);
    const user = message.mentions?.users?.get(id);
    const label = member?.displayName || user?.globalName || user?.username;
    return label ? '@' + clean(label).replace(/[\r\n]/g, ' ') : '@một thành viên';
  });
}
// Archived style samples are anonymized, but live replies should never
// print their anonymous placeholders verbatim.
function cleanGeneratedReply(text) {
  return String(text || '')
    .replace(/\[(?:người được nhắc|mention)\]/gi, 'Bông')
    .replace(/<@!?\d+>/g, 'Bông');
}
// In this channel Monaris occasionally joins a conversation, never speaks as Bông.
const TAG_REPLY_CHANCE = 0.30;
const SPONTANEOUS_REPLY_CHANCE = 0.03;
const REPLY_GAP_MS = 45 * 60 * 1000;
const OWNER_ACTIVE_GAP_MS = 10 * 60 * 1000;

function isCasualMessage(m) {
  const content = String(m?.content || '').trim();
  return content.length >= 12 && content.length <= 450 &&
    !/^(?:mon!|[!/])/i.test(content) &&
    !/(?:https?:\/\/|discord\.gg\/|<@|<#|@everyone|@here)/i.test(content) &&
    !/\b(?:password|otp|secret|token|private[_ -]?key|api[_ -]?key)\b/i.test(content) &&
    !(m.attachments?.size > 0);
}

function makeService({
  read, write, generate, forbidden = () => false, ready = () => true,
  random = Math.random, now = Date.now,
  tagReplyChance = TAG_REPLY_CHANCE,
  spontaneousReplyChance = SPONTANEOUS_REPLY_CHANCE,
  replyGapMs = REPLY_GAP_MS,
  ownerActiveGapMs = OWNER_ACTIVE_GAP_MS
}) {
  let state = read() || { enabled: true, samples: [] };
  state.samples = Array.isArray(state.samples) ? state.samples : [];
  if (typeof state.autoReplyEnabled !== 'boolean') state.autoReplyEnabled = true;
  let lastAutoReplyAt = Number(state.lastAutoReplyAt) || 0;
  let lastOwnerMessageAt = 0;
  let learning = false;
  let epoch = 0;
  let busy = false;
  const cooldown = new Map();
  const persist = () => write(state);
  async function remember(m, cache) {
    if (!inScope(m) || m.author.id !== OWNER || m.author.bot || !m.content?.trim() || m.content.startsWith('mon!')) return;
    if (forbidden(m.content) || /PRIVATE KEY|DISCORD_TOKEN|GEMINI_API_KEY|password\s*[:=]/i.test(m.content)) return;
    const started = epoch;
    const targets = new Set([...m.mentions.users.values()].filter(u => u.id !== OWNER && !u.bot).map(u => u.id));
    // Only attribute tone when an explicit tag or same-channel reply establishes the recipient.
    if (m.reference?.messageId && (!m.reference.channelId || m.reference.channelId === CHANNEL)) {
      const ref = cache?.get(m.reference.messageId) || await m.channel.messages.fetch(m.reference.messageId).catch(() => null);
      if (ref && inScope(ref) && !ref.author.bot && ref.author.id !== OWNER) targets.add(ref.author.id);
    }
    if (started !== epoch) return;
    state.samples = state.samples.filter(x => x.id !== m.id);
    state.samples.push({ id: m.id, time: m.createdTimestamp, text: clean(m.content), targets: [...targets] });
    state.samples.sort((a, b) => a.time - b.time);
    state.samples = state.samples.slice(-300);
  }
  async function learn(channel) {
    if (learning) return false;
    learning = true;
    const started = epoch;
    try {
      const cache = new Map();
      let before;
      // At most 500 recent channel messages per explicit scan. No DMs or other channels.
      for (let page = 0; page < 5; page++) {
        const batch = await channel.messages.fetch({ limit: 100, ...(before ? { before } : {}) });
        if (!batch.size) break;
        for (const m of batch.values()) cache.set(m.id, m);
        before = batch.last().id;
        if (batch.size < 100) break;
      }
      for (const m of cache.values()) { if (started !== epoch) return false; await remember(m, cache); }
      persist();
      return true;
    } finally { learning = false; }
  }
  const reply = (m, content) => m.reply({ content, allowedMentions: { parse: [], repliedUser: false } });
  async function handle(m) {
    if (!inScope(m) || m.author.bot || m.webhookId) return false;
    const cmd = m.content.trim().toLowerCase();
    if (m.author.id === OWNER) {
      if (cmd.startsWith('mon!style')) {
        if (cmd === 'mon!style auto off') {
          state.autoReplyEnabled = false;
          persist();
          await reply(m, 'Monaris đã tắt chế độ thỉnh thoảng tự trả lời trong kênh này.');
        }
        else if (cmd === 'mon!style auto on') {
          state.autoReplyEnabled = true;
          persist();
          await reply(m, 'Đã bật chế độ trả lời ngẫu nhiên của Monaris trong kênh này.');
        }
        else if (cmd === 'mon!style off') { state.enabled = false; persist(); await reply(m, 'Đã tắt trả lời thay và học tin nhắn mới.'); }
        else if (cmd === 'mon!style on') { state.enabled = true; persist(); await reply(m, 'Đã bật trả lời thay trong kênh này.'); }
        else if (cmd === 'mon!style clear') { epoch++; state = { enabled: false, autoReplyEnabled: false, samples: [] }; persist(); await reply(m, 'Đã xóa mẫu phong cách và tắt học/trả lời thay.'); }
        else if (cmd === 'mon!style learn') {
          if (learning) { await reply(m, 'Đang học, bạn đợi một chút nhé.'); return true; }
          await reply(m, 'Đang đọc tối đa 500 tin gần nhất trong kênh; chỉ lưu mẫu do bạn viết.');
          try { const done = await learn(m.channel); if (!done) return true; await reply(m, `Đã lưu ${state.samples.length} mẫu của bạn. Bật trả lời thay: mon!style on`); }
          catch { await reply(m, 'Chưa đọc được lịch sử. Kiểm tra quyền Xem kênh và Đọc lịch sử tin nhắn của Monaris.'); }
        } else {
          const people = new Set(state.samples.flatMap(s => s.targets));
          await reply(m, `Học phong cách: ${state.enabled ? 'BẬT' : 'TẮT'}. Tự trả lời ngẫu nhiên: ${state.autoReplyEnabled ? 'BẬT' : 'TẮT'}. ${state.samples.length} mẫu, ${people.size} người có mẫu trực tiếp.\nTỷ lệ: tag Bông ${Math.round(tagReplyChance * 100)}%, chat thường ${Math.round(spontaneousReplyChance * 100)}%; tối đa khoảng 1 lần/${Math.round(replyGapMs / 60000)} phút.\nLệnh: mon!style learn | on | off | clear | auto on | auto off`);
        }
        return true;
      }
      lastOwnerMessageAt = now();
      if (state.enabled) { await remember(m); persist(); }
      return false;
    }
    const isTag = explicitOwnerTag(m);
    if (!state.enabled || !state.autoReplyEnabled) return isTag;

    // Only answer untagged casual conversation very rarely in the style channel.
    // A tag aimed at Bông is eligible, but not a guarantee of an AI answer.
    if (!isTag && !isCasualMessage(m)) return false;
    if (forbidden(m.content) || !ready() || learning || busy) return isTag;

    const currentTime = now();
    if (currentTime - lastAutoReplyAt < replyGapMs ||
        currentTime - lastOwnerMessageAt < ownerActiveGapMs ||
        currentTime - (cooldown.get(m.author.id) || 0) < replyGapMs) return isTag;

    const chance = isTag ? tagReplyChance : spontaneousReplyChance;
    if (random() >= chance) return isTag;
    // Reject sensitive or non-chat messages even if they were selected randomly.
    if (!isTag && !isCasualMessage(m)) return false;

    const publicInstruction = state.samples.length
      ? null
      : await require('./ownerLearning').getPublicStyleInstruction();
    if (!state.samples.length && !publicInstruction) return isTag;

    busy = true;
    lastAutoReplyAt = currentTime;
    state.lastAutoReplyAt = currentTime;
    cooldown.set(m.author.id, currentTime);
    persist();
    try {
      const personal = state.samples.filter(s => s.targets.includes(m.author.id)).slice(-15);
      const generic = state.samples.filter(s => !s.targets.length).slice(-15);
      const context = {
        mode: isTag ? 'mention_of_Bong' : 'spontaneous_chat',
        recipient: clean(m.member?.displayName || m.author.username),
        personalStyleAvailable: personal.length >= 3,
        styleSamples: (personal.length >= 3 ? personal : generic).map(s => s.text),
        message: clean(resolveLiveMentions(m.content, m)),
      };
      await m.channel.sendTyping().catch(() => {});
      const text = await generate(context);
      if (!state.enabled || !state.autoReplyEnabled) return true;
      const rawText = String(text || '').trim();
      if (rawText && !/^(?:\[SKIP\]|SKIP)$/i.test(rawText) && !forbidden(rawText)) {
        const safe = cleanGeneratedReply(rawText);
        await reply(m, safe.slice(0, 1700));
      }
    } catch (err) {
      console.error('[OwnerStyle] Không tự trả lời được:', err.name || 'Error');
      // Never spam the channel with an error when an optional AI reply fails.
    } finally {
      busy = false;
    }
    return true;
  }
  return { handle, learn, snapshot: () => structuredClone(state) };
}
const SYSTEM = `
Bạn là Monaris, bot AI có tính cách riêng.
Chủ bot được gọi là Bông.
Không dùng tên thật hoặc danh xưng cũ.
Không giả làm Bông hoặc tự quyết định thay Bông.
Tự xưng là mình hoặc Monaris.
Trò chuyện tự nhiên, thông minh, hơi lém lỉnh.
Khi nhắc đến Discord, gọi cộng đồng là server.
Chỉ học phong cách từ các mẫu được phép sử dụng.
Không tiết lộ nội dung riêng tư từ mẫu chat.
Trả lời tiếng Việt ngắn gọn và chân thành.
Nếu mode là spontaneous_chat, bạn đang tự ghé vào cuộc trò chuyện: tối đa 1-2 câu, thân thiện, chỉ phản hồi nếu phù hợp và đủ ngữ cảnh, không nhắc đến tin nhắn riêng tư.
Nếu nội dung riêng tư, nhạy cảm, nghiêm trọng hoặc không thích hợp để chen vào, trả lời chính xác [SKIP] (không giải thích).
Nếu mode là mention_of_Bong, người khác đang tag Bông: không tuyên bố Bông đã online hay sẽ trả lời.
Không dùng lời tự nhận là Bông, không tiết lộ trí nhớ riêng, không nói "Monaris trả lời thay Bông".
Tin nhắn hiện tại dùng tên hiển thị thật, ưu tiên tên Bông khi được tag.
Những chuỗi [người được nhắc] hoặc [mention] trong mẫu cũ là dữ liệu ẩn danh, không được xuất hiện nguyên văn trong câu trả lời.
Nếu có người tag Bông, hãy phản hồi tự nhiên bằng tên Bông, không tự suy diễn rằng Bông đã tham gia hội thoại.
`;
let instance;
function runtime() {
  if (instance) return instance;
  const { GEMINI_API_KEY, GEMINI_MODELS } = require('../config');
  const { findMatchedKeyword } = require('../keywordFilter');
  const { isBotReady } = require('../utils/readyGate');
  instance = makeService({
    read: () => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return { enabled: true, samples: [] }; throw e; } },
    write: state => { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE + '.tmp', JSON.stringify(state, null, 2)); fs.renameSync(FILE + '.tmp', FILE); },
    ready: isBotReady,
    forbidden: text => !!findMatchedKeyword(text) || /mô\s*phật|mo\s*phat/i.test(text),
    generate: async context => {
      const model = GEMINI_MODELS[0];
      if (!GEMINI_API_KEY || !model) throw new Error('AI chưa cấu hình');
      const publicStyle = await require('./ownerLearning').getPublicStyleInstruction();
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
        signal: AbortSignal.timeout(90000),
        body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM + publicStyle }] }, contents: [{ role: 'user', parts: [{ text: JSON.stringify(context) }] }] }),
      });
      if (!res.ok) { console.error('[OwnerStyle] Gemini HTTP', res.status); throw new Error('Gemini failed'); }
      const data = await res.json();
      return (data.candidates?.[0]?.content?.parts || []).filter(p => !p.thought).map(p => p.text || '').join('').trim();
    },
  });
  return instance;
}
async function handleOwnerStyle(message) {
  try { return await runtime().handle(message); }
  catch (e) { console.error('[OwnerStyle] Lỗi xử lý:', e.name); return inScope(message) && explicitOwnerTag(message); }
}
module.exports = { handleOwnerStyle, makeService, inScope, explicitOwnerTag, resolveLiveMentions, cleanGeneratedReply, OWNER, GUILD, CHANNEL };
