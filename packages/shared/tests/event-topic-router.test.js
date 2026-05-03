const test = require('node:test');
const assert = require('node:assert/strict');

const { getTopicForEvent } = require('../src/events/event-topic-router');
const { EVENT_TOPICS } = require('../src/constants/event-topics.constants');

test('topic router maps aggregate event families correctly', () => {
  assert.equal(getTopicForEvent('case.submitted.v1'), EVENT_TOPICS.DOMAIN_CASE);
  assert.equal(getTopicForEvent('task.created.v1'), EVENT_TOPICS.DOMAIN_TASK);
  assert.equal(getTopicForEvent('certificate.issued.v1'), EVENT_TOPICS.DOMAIN_CERTIFICATE);
  assert.throws(() => getTopicForEvent('unknown.event.v1'));
});
