const eventReplayService = require('../services/event-replay.service');

function buildCaseHandlers(orchestrationService, slaService) {
  return {
    async onCaseSubmitted(event, context = {}) {
      return eventReplayService.handleEventOnce(
        event,
        async function onCaseSubmittedHandler(currentEvent) {
          if (currentEvent.payload?.caseId) {
            await orchestrationService.recalculateCaseAggregateStatus(currentEvent.payload.caseId, {
              ...context,
              actor: context.actor || { primaryRole: 'system', permissions: ['system.internal_call'] }
            });
          }
          return { caseId: currentEvent.payload?.caseId, handled: true };
        },
        context
      );
    },

    async onSlaBreached(event, context = {}) {
      return eventReplayService.handleEventOnce(
        event,
        async function onSlaBreachedHandler(currentEvent) {
          return {
            timerId: currentEvent.payload?.timerId,
            notificationQueued: true,
            handled: true
          };
        },
        context
      );
    }
  };
}

module.exports = { buildCaseHandlers };
