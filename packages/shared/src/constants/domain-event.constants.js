const { EVENT_NAMES, EVENT_NAME_VALUES } = require('./event-names.constants');

const DOMAIN_EVENT_NAMES = Object.freeze({
  USER_CREATED: 'user.created.v1',
  ORGANISATION_CREATED: 'organisation.created.v1',
  INVESTOR_PROFILE_CREATED: 'investor.profile_created.v1',
  DEPARTMENT_CREATED: 'department.created.v1',
  ...EVENT_NAMES,
  RETRY_DEAD_LETTERED: 'retry.dead_lettered.v1'
});

module.exports = {
  DOMAIN_EVENT_NAMES,
  DOMAIN_EVENT_NAME_VALUES: Object.freeze(Object.values(DOMAIN_EVENT_NAMES)),
  EVENT_NAMES,
  EVENT_NAME_VALUES
};
