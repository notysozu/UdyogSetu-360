const { CASE_TRANSITIONS, getCaseTransition } = require('./case-state-machine');

function canTransition(fromState, toState) {
  return Boolean(getCaseTransition(fromState, toState));
}

function assertTransition(fromState, toState) {
  if (!canTransition(fromState, toState)) {
    throw new Error(`Invalid case transition from ${fromState} to ${toState}`);
  }
}

module.exports = {
  CASE_TRANSITIONS,
  canTransition,
  assertTransition
};
