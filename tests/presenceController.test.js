'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const { OWNER } = require('../AutoReply/ownerStyle');
const presence = require('../commands/presence');
const controller = require('../controller/start');

test('/trangthai registered and input validated', () => {
  assert.equal(presence.STATUS_SLASH_COMMANDS[0].name, 'trangthai');
  assert.equal(presence.normalizeStatus(' Đồ Ngốc '), 'Đồ Ngốc');
  assert.equal(presence.normalizeStatus('xoa'), '');
  assert.equal(presence.normalizeStatus('X'.repeat(129)), null);
});
test('only owner can change and persist status', async () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'monaris-presence-')), 'status.json');
  const calls = [];
  const user = { setPresence(x) { calls.push(x); } };
  const make = id => ({
    commandName: 'trangthai', isChatInputCommand: () => true,
    user: { id }, options: { getString: () => 'Đồ Ngốc' },
    replies: [], async reply(x) { this.replies.push(x); },
  });
  const other = make('other');
  await presence.handleStatus(other, { user, filepath: file });
  assert.equal(calls.length, 0);
  const owner = make(OWNER);
  await presence.handleStatus(owner, { user, filepath: file });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].activities[0].state, 'Đồ Ngốc');
  assert.equal(JSON.parse(fs.readFileSync(file, 'utf8')).status, 'Đồ Ngốc');
  assert.equal(presence.restoreStatus(user, file), true);
  assert.equal(calls.length, 2);
  fs.rmSync(path.dirname(file), { recursive: true, force: true });
});
test('/moboss restricted to owner; controller only starts one tracked process', async () => {
  let created = 0;
  let child;
  const runner = controller.makeRunner({
    spawnChild(node, args, options) {
      created++;
      assert.equal(args.at(-1).endsWith('start.js'), true);
      child = new EventEmitter();
      child.pid = 4321; child.exitCode = null; child.signalCode = null;
      return child;
    },
  });
  const make = id => ({
    commandName: 'moboss', isChatInputCommand: () => true,
    user: { id }, replies: [], async reply(x) { this.replies.push(x); },
  });
  await controller.handleMoboss(make('other'), runner, OWNER);
  assert.equal(created, 0);
  await controller.handleMoboss(make(OWNER), runner, OWNER);
  await controller.handleMoboss(make(OWNER), runner, OWNER);
  assert.equal(created, 1);
  child.exitCode = 0; child.emit('exit', 0, null);
  await controller.handleMoboss(make(OWNER), runner, OWNER);
  assert.equal(created, 2);
});
