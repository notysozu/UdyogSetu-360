const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('investor grievance and notification partials exist', async () => {
  const files = [
    '../views/partials/grievances/grievance-form.ejs',
    '../views/partials/grievances/grievance-message-thread.ejs',
    '../views/partials/notifications/notification-item.ejs'
  ];
  files.forEach((file) => {
    assert.equal(fs.existsSync(path.join(__dirname, file)), true);
  });
});
