const eventReplayService = require('../services/event-replay.service');

function buildTaskHandlers(orchestrationService) {
  async function recalcFromEvent(currentEvent, context = {}) {
    const caseId = currentEvent.payload?.caseId;
    if (caseId) {
      await orchestrationService.recalculateCaseAggregateStatus(caseId, {
        ...context,
        actor: context.actor || { primaryRole: 'system', permissions: ['system.internal_call'] }
      });
    }
    return { caseId, taskId: currentEvent.payload?.taskId, handled: true };
  }

  return {
    onTaskCreated(event, context = {}) {
      return eventReplayService.handleEventOnce(
        event,
        async function onTaskCreatedHandler(currentEvent) {
          return recalcFromEvent(currentEvent, context);
        },
        context
      );
    },
    onTaskStatusChanged(event, context = {}) {
      return eventReplayService.handleEventOnce(
        event,
        async function onTaskStatusChangedHandler(currentEvent) {
          return recalcFromEvent(currentEvent, context);
        },
        context
      );
    },
    onTaskQueryRaised(event, context = {}) {
      return eventReplayService.handleEventOnce(
        event,
        async function onTaskQueryRaisedHandler(currentEvent) {
          return recalcFromEvent(currentEvent, context);
        },
        context
      );
    },
    onTaskResponseSubmitted(event, context = {}) {
      return eventReplayService.handleEventOnce(
        event,
        async function onTaskResponseSubmittedHandler(currentEvent) {
          return recalcFromEvent(currentEvent, context);
        },
        context
      );
    },
    onTaskInspectionScheduled(event, context = {}) {
      return eventReplayService.handleEventOnce(
        event,
        async function onTaskInspectionScheduledHandler(currentEvent) {
          return recalcFromEvent(currentEvent, context);
        },
        context
      );
    },
    onTaskInspectionCompleted(event, context = {}) {
      return eventReplayService.handleEventOnce(
        event,
        async function onTaskInspectionCompletedHandler(currentEvent) {
          return recalcFromEvent(currentEvent, context);
        },
        context
      );
    },
    onTaskFeeDemanded(event, context = {}) {
      return eventReplayService.handleEventOnce(
        event,
        async function onTaskFeeDemandedHandler(currentEvent) {
          return recalcFromEvent(currentEvent, context);
        },
        context
      );
    },
    onTaskFeePaid(event, context = {}) {
      return eventReplayService.handleEventOnce(
        event,
        async function onTaskFeePaidHandler(currentEvent) {
          return recalcFromEvent(currentEvent, context);
        },
        context
      );
    },
    onTaskApproved(event, context = {}) {
      return eventReplayService.handleEventOnce(
        event,
        async function onTaskApprovedHandler(currentEvent) {
          return recalcFromEvent(currentEvent, context);
        },
        context
      );
    },
    onTaskRejected(event, context = {}) {
      return eventReplayService.handleEventOnce(
        event,
        async function onTaskRejectedHandler(currentEvent) {
          return recalcFromEvent(currentEvent, context);
        },
        context
      );
    },
    onCertificateIssued(event, context = {}) {
      return eventReplayService.handleEventOnce(
        event,
        async function onCertificateIssuedHandler(currentEvent) {
          return recalcFromEvent(currentEvent, context);
        },
        context
      );
    }
  };
}

module.exports = { buildTaskHandlers };
