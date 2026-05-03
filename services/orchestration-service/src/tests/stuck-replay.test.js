const test = require('node:test');
const assert = require('node:assert/strict');
const stuckService = require('../stuck-case/stuck-case-detector.service');
const replayService = require('../replay/replay.service');

test('stuck-case detector exposes required methods', () => {
  ['scanForStuckCases', 'detectMissingTasks', 'detectNoActivity', 'detectOverdueTasks', 'detectStatusMismatch'].forEach((name) => {
    assert.equal(typeof stuckService[name], 'function');
  });
});

test('replay service exposes required methods', () => {
  ['createReplayAttempt', 'runReplay', 'listReplayAttempts', 'cancelReplay'].forEach((name) => {
    assert.equal(typeof replayService[name], 'function');
  });
});
