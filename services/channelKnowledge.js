
const fs = require("node:fs");
const path = require("node:path");

const CHANNEL_ID = process.env.MONARIS_READ_CHANNEL_ID;
const ENABLED = process.env.MONARIS_READ_CHANNEL_ENABLED === "true";

const DATA_FILE = path.join(
  process.cwd(),
  "data",
  "monaris-channel-knowledge.json"
);

const PRIVATE_CHANNEL = '1566701909270601758';
const knowledge = new Map();

function saveKnowledge() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });

  const tempFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(
    tempFile,
    JSON.stringify([...knowledge.values()], null, 2),
    "utf8"
  );
  fs.renameSync(tempFile, DATA_FILE);
}

function loadKnowledge() {
  if (!fs.existsSync(DATA_FILE)) return;

  const records = JSON.parse(
    fs.readFileSync(DATA_FILE, "utf8")
  );

  for (const record of records) {
    if (record.channelId !== PRIVATE_CHANNEL) knowledge.set(record.id, record);
  }
}

function rememberMessage(message) {
  if (!ENABLED || message.channelId !== CHANNEL_ID || message.channelId === PRIVATE_CHANNEL) return;
  if (message.author?.bot || message.webhookId) return;

  const content = message.content?.trim();
  if (!content) return;

  knowledge.set(message.id, {
    id: message.id,
    authorId: message.author.id,
    content: content.slice(0, 4000),
    createdAt: message.createdAt.toISOString(),
    channelId: message.channelId
  });

  saveKnowledge();
}

async function syncHistory(client) {
  if (!ENABLED || !CHANNEL_ID || CHANNEL_ID === PRIVATE_CHANNEL) return;

  const channel = await client.channels.fetch(CHANNEL_ID);

  if (!channel?.messages?.fetch) {
    throw new Error("Kênh không hỗ trợ đọc tin nhắn.");
  }

  const limit = Math.max(
    1,
    Math.min(
      100,
      Number(process.env.MONARIS_READ_HISTORY_LIMIT) || 100
    )
  );

  const messages = await channel.messages.fetch({ limit });

  for (const message of messages.values()) {
    rememberMessage(message);
  }

  console.log(
    `[Knowledge] Đã đồng bộ ${messages.size} tin nhắn.`
  );
}

function searchKnowledge(question, limit = 5) {
  const terms = question
    .toLowerCase()
    .match(/[\p{L}\p{N}]+/gu) || [];

  const uniqueTerms = [...new Set(terms.filter(x => x.length > 2))];

  if (!uniqueTerms.length) return [];

  return [...knowledge.values()]
    .filter(item => item.channelId !== PRIVATE_CHANNEL)
    .map(item => {
      const content = item.content.toLowerCase();
      const score = uniqueTerms.reduce(
        (total, term) => total + (content.includes(term) ? 1 : 0),
        0
      );
      return { ...item, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function removeKnowledge(messageId) {
  if (knowledge.delete(messageId)) saveKnowledge();
}

function clearKnowledge() {
  knowledge.clear();
  saveKnowledge();
}

module.exports = {
  loadKnowledge,
  rememberMessage,
  syncHistory,
  searchKnowledge,
  removeKnowledge,
  clearKnowledge
};
