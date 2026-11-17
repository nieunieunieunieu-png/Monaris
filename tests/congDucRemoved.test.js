'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
test('removed Công Đức slash commands are not registered', () => {
  const registry = require('../commands/registry').getSlashCommands();
  const names = registry.map(command => command.name);
  for(const removed of ['congduc','canhgioi','hosocd','topcongduc','cuahangcongduc']){
    assert.equal(names.includes(removed),false,removed);
  }
});
test('removed Công Đức startup is disabled', () => {
  assert.equal(require('../config/congDuc').CONG_DUC_ENABLED,false);
  assert.doesNotMatch(read('index.js'), /deferredStep\('startCongDuc'/);
});
