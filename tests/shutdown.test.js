'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { SHUTDOWN_SLASH_COMMANDS, handleShutdown, isOwner, isHosted } = require('../commands/shutdown');
const { OWNER } = require('../AutoReply/ownerStyle');

function fakeInteraction(userId) {
  const replies = [];
  return {
    replies,
    user: { id: userId },
    commandName: 'tatbot',
    isChatInputCommand: () => true,
    async reply(payload) { replies.push(payload); },
  };
}

test('slash command is registered under the intended name', () => {
  assert.equal(SHUTDOWN_SLASH_COMMANDS[0].name, 'tatbot');
});

test('only the owner can request shutdown', async () => {
  let stopped = false;
  const interaction = fakeInteraction('someone-else');
  await handleShutdown(interaction, {
    env: {}, client: { destroy() { stopped = true; } },
    schedule() { stopped = true; },
    exit() { stopped = true; },
  });
  assert.equal(stopped, false);
  assert.match(interaction.replies[0].content, /Chỉ Bông/);
  assert.equal(isOwner(OWNER), true);
  assert.equal(isOwner('someone-else'), false);
});

test('does not terminate hosted Railway instance', async () => {
  const interaction = fakeInteraction(OWNER);
  let stopped = false;
  await handleShutdown(interaction, {
    env: { RAILWAY_SERVICE_ID: 'example' },
    client: { destroy() { stopped = true; } },
    schedule() { stopped = true; },
    exit() { stopped = true; },
  });
  assert.equal(stopped, false);
  assert.equal(isHosted({ RAILWAY_SERVICE_ID: 'example' }), true);
});

test('local owner request acknowledges, disconnects, then schedules exit', async () => {
  const events = [];
  const interaction = fakeInteraction(OWNER);
  await handleShutdown(interaction, {
    env: {},
    client: { destroy() { events.push('disconnect'); } },
    schedule(fn, ms) { events.push('scheduled:' + ms); fn(); },
    exit(code) { events.push('exit:' + code); },
  });
  assert.match(interaction.replies[0].content, /Tạm biệt bé/);
  assert.deepEqual(events, ['disconnect', 'scheduled:500', 'exit:0']);
});
