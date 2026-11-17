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
