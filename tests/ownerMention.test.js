const test = require('node:test');
const assert = require('node:assert/strict');
const {
  OWNER, resolveLiveMentions, cleanGeneratedReply
} = require('../AutoReply/ownerStyle');

test('owner mention resolves to Bông before sample anonymization', () => {
  const message = { mentions: { users: new Map(), members: new Map() } };
  assert.equal(resolveLiveMentions('Ai tag <@' + OWNER + '> vậy?', message), 'Ai tag @Bông vậy?');
  assert.equal(resolveLiveMentions('Gọi <@!' + OWNER + '> đi', message), 'Gọi @Bông đi');
});

test('other known user mentions resolve to display names', () => {
  const message = {
    mentions: {
      users: new Map([['123456789012345678', { username: 'Friend' }]]),
      members: new Map([['123456789012345678', { displayName: 'Bạn Nhỏ' }]])
    }
  };
  assert.equal(resolveLiveMentions('Chào <@123456789012345678>', message), 'Chào @Bạn Nhỏ');
});

test('unknown mention receives a readable safe fallback', () => {
  assert.equal(resolveLiveMentions('<@123456789012345678>', { mentions: {} }), '@một thành viên');
});

test('generated reply never exposes anonymized mentions', () => {
  assert.equal(
    cleanGeneratedReply('[người được nhắc] được triệu hồi! [mention] tới rồi.'),
    'Bông được triệu hồi! Bông tới rồi.'
  );
});


function makeFakeMessage(content, authorId = '987654321098765432') {
  const sent = [];
  return {
    message: {
      guildId: '1566691700850688013',
      channelId: '1566698252567318538',
      author: { id: authorId, username: 'Khách', bot: false },
      member: { displayName: 'Khách' },
      content,
      mentions: { users: new Map(), members: new Map() },
      channel: {
        sendTyping: async () => {},
      },
      reply: async (payload) => { sent.push(payload.content); }
    },
    sent
  };
}

test('spontaneous replies only sometimes and respect cooldown', async () => {
  const { makeService } = require('../AutoReply/ownerStyle');
  const snapshots = [];
  let generated = 0;
  let timestamp = 5_000_000;
  const svc = makeService({
    read: () => ({ enabled: true, autoReplyEnabled: true, samples: [{ id: 'a', time: 1, text: 'test', targets: [] }] }),
    write: (value) => snapshots.push(structuredClone(value)),
    generate: async () => { generated++; return 'Ủa có vụ gì đó?'; },
    random: () => 0,
    now: () => timestamp,
    spontaneousReplyChance: 0.03,
    replyGapMs: 45 * 60000,
    ownerActiveGapMs: 10 * 60000,
  });
  const first = makeFakeMessage('Hôm nay mọi người chơi game gì vậy?');
  assert.equal(await svc.handle(first.message), true);
  assert.equal(first.sent.length, 1);
  const second = makeFakeMessage('Tối nay có ai đi phụ bản không?');
  assert.equal(await svc.handle(second.message), false);
  assert.equal(second.sent.length, 0);
  timestamp += 46 * 60000;
  const third = makeFakeMessage('Tối nay có ai đi phụ bản không?');
  assert.equal(await svc.handle(third.message), true);
  assert.equal(generated, 2);
  assert.ok(snapshots.length >= 2);
});

test('spontaneous replies are rare and can be turned off by owner', async () => {
  const { makeService, OWNER } = require('../AutoReply/ownerStyle');
  let snapshot = { enabled: true, autoReplyEnabled: true, samples: [{ id: 'a', time: 1, text: 'test', targets: [] }] };
  const svc = makeService({
    read: () => snapshot,
    write: (value) => { snapshot = structuredClone(value); },
    generate: async () => 'hello',
    random: () => 0.5,
    now: () => 5_000_000
  });
  const casual = makeFakeMessage('Mấy nay server có hoạt động gì vui không?');
  assert.equal(await svc.handle(casual.message), false);
  const cmd = makeFakeMessage('mon!style auto off', OWNER);
  await svc.handle(cmd.message);
  assert.equal(snapshot.autoReplyEnabled, false);
  const tagged = makeFakeMessage('Gọi <@' + OWNER + '> giúp với');
  assert.equal(await svc.handle(tagged.message), true);
  assert.equal(tagged.sent.length, 0);
});

test('spontaneous AI can opt out with SKIP and avoids URLs', async () => {
  const { makeService } = require('../AutoReply/ownerStyle');
  const svc = makeService({
    read: () => ({ enabled: true, autoReplyEnabled: true, samples: [{ id: 'a', time: 1, text: 'test', targets: [] }] }),
    write: () => {},
    generate: async () => '[SKIP]',
    random: () => 0,
    now: () => 5_000_000
  });
  const url = makeFakeMessage('Mọi người xem https://example.com nhé');
  assert.equal(await svc.handle(url.message), false);
  const casual = makeFakeMessage('Ai có chuyện gì hay kể đi nào');
  assert.equal(await svc.handle(casual.message), true);
  assert.equal(casual.sent.length, 0);
});
