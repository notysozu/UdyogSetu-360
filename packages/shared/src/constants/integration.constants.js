const INTEGRATION_TYPES = Object.freeze({
  REST_API: 'rest_api',
  WEBHOOK: 'webhook',
  SFTP: 'sftp',
  FILE_DROP: 'file_drop',
  DATABASE: 'database',
  RPA: 'rpa',
  MANUAL: 'manual'
});

module.exports = {
  INTEGRATION_TYPES,
  INTEGRATION_TYPE_VALUES: Object.freeze(Object.values(INTEGRATION_TYPES))
};
