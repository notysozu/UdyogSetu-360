const { BaseDepartmentAdapter } = require('../base/BaseDepartmentAdapter');

class HumanAssistedAdapter extends BaseDepartmentAdapter {
  async submitApplication(canonicalPayload, context = {}) {
    return this.buildResult('submit_application', {
      externalReferenceId: `${this.departmentCode.toUpperCase()}-MANUAL-${Date.now()}`,
      acknowledgement: {
        acknowledgementNumber: `${this.departmentCode.toUpperCase()}-MANUAL-ACK-${Date.now()}`,
        acknowledgedAt: new Date().toISOString(),
        message: 'Manual handoff queued for department officer'
      },
      status: {
        externalStatus: 'manual_pending',
        canonicalStatus: 'under_review',
        statusMessage: 'Manual handoff queued'
      },
      rawResponse: {
        queueName: this.config.humanAssisted?.queueName || 'manual-handoff',
        expectedManualFields: this.config.humanAssisted?.expectedManualFields || [],
        payload: canonicalPayload
      },
      correlationId: context.correlationId
    });
  }

  async getStatus(externalReferenceId, context = {}) {
    return this.buildResult('status_check', {
      externalReferenceId,
      status: {
        externalStatus: 'manual_in_progress',
        canonicalStatus: 'under_review',
        statusMessage: 'Manual processing in progress'
      },
      rawResponse: {},
      correlationId: context.correlationId
    });
  }

  async receiveCallback(callbackPayload, context = {}) {
    return this.buildResult('callback_receive', {
      externalReferenceId: callbackPayload.externalReferenceId || null,
      status: {
        externalStatus: callbackPayload.status || 'manual_completed',
        canonicalStatus: callbackPayload.status || 'manual_completed',
        statusMessage: callbackPayload.remarks || 'Manual officer update received'
      },
      rawResponse: callbackPayload,
      correlationId: context.correlationId
    });
  }
}

module.exports = { HumanAssistedAdapter };
