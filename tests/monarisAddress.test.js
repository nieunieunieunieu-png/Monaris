'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { OWNER_ID, PERSONA, systemPrompt, normalizeReply } = require('../AutoReply/bongPersona');
const { GOI_BOT_KEYWORDS, KEYWORD_RESPONSES, REPLY_TO_BOT_RESPONSES } = require('../AutoReply/keywords');

test('owner is addressed as chủ nhân or bé', () => {
  const prompt = systemPrompt(OWNER_ID);
  assert.match(prompt, /chủ nhân hoặc bé/);
  assert.match(prompt, /xưng Monaris/);
  assert.equal(normalizeReply('Chào Bông', OWNER_ID), 'Chào chủ nhân');
});
test('other members are addressed as bạn; bot calls itself Monaris', () => {
  const prompt = systemPrompt('another-user');
  assert.match(prompt, /gọi họ là bạn/);
  assert.match(PERSONA, /Luôn tự xưng là "Monaris"/);
  assert.ok(GOI_BOT_KEYWORDS.length > 0);
  assert.ok(KEYWORD_RESPONSES['bot ơi'].every(x => x.includes('Monaris')));
  assert.ok(REPLY_TO_BOT_RESPONSES.every(x => x.includes('Monaris')));
});
