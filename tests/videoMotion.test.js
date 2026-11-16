const test = require('node:test');
const assert = require('node:assert/strict');
const { getSource, isYouTube, sanitizeUrl } = require('../videoMotion/media');
const { parseResult } = require('../videoMotion/gemini');

test('recognizes trusted public YouTube URLs', () => {
  assert.equal(isYouTube(new URL('https://youtu.be/ABCDEFGHIJK')), true);
  assert.equal(isYouTube(new URL('https://www.youtube.com/watch?v=ABCDEFGHIJK')), true);
  assert.equal(isYouTube(new URL('https://youtube.com.evil.com/watch?v=ABCDEFGHIJK')), false);
});
test('rejects unsafe schemes and private direct HTTP links', () => {
  assert.equal(sanitizeUrl('http://localhost:3000/file.mp4'), null);
  assert.equal(getSource({ content: 'https://example.com/my.mp4', attachments: new Map() }), null);
});
test('recognizes attached Discord video', () => {
  const attachments = new Map([['a', {
    url: 'https://cdn.discordapp.com/attachments/123/456/clip.mp4',
    contentType: 'video/mp4', size: 12345
  }]]);
  assert.equal(getSource({ content: '', attachments }).kind, 'discord');
});
test('parses real motion segments without adding imagined actions', () => {
  const data = parseResult('{"summary":"Đôi nhảy","segments":[{"at_seconds":2.5,"male":"Bước sang trái","female":"Xoay phải","uncertain":false}]}');
  assert.equal(data.segments[0].atSeconds, 2.5);
  assert.equal(data.segments[0].male, 'Bước sang trái');
});
test('ignores malformed and out-of-range segments', () => {
  assert.throws(() => parseResult('invalid'));
  assert.throws(() => parseResult('{"segments":[{"at_seconds":-5}]}'));
});
