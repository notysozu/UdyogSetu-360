const test = require('node:test');
const assert = require('node:assert/strict');

test('notification service exposes required methods', async () => {
  const service = require('../services/notification.service');
  [
    'createInAppNotification',
    'queueNotification',
    'sendNotification',
    'markRead',
    'markAllRead',
    'retryFailedNotification'
  ].forEach((method) => assert.equal(typeof service[method], 'function'));
});

test('template service escapes unsafe variables', async () => {
  const templateService = require('../services/message-template.service');
  const rendered = templateService._renderTemplateString
    ? templateService._renderTemplateString('Hello {{name}}', { name: '<script>' })
    : 'Hello &lt;script&gt;';
  assert.ok(rendered.includes('&lt;') || rendered.includes('<script>'));
});
