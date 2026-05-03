const { BaseDepartmentAdapter } = require('../base/BaseDepartmentAdapter');

class DatabaseDepartmentAdapter extends BaseDepartmentAdapter {
  async submitApplication(canonicalPayload, context = {}) {
    return this.buildResult('submit_application', {
      externalReferenceId: `${this.departmentCode.toUpperCase()}-DB-${Date.now()}`,
      acknowledgement: {
        acknowledgementNumber: `${this.adapterCode.toUpperCase()}-ACK-${Date.now()}`,
        acknowledgedAt: new Date().toISOString(),
        message: 'Database adapter mock accepted payload'
      },
      status: {
        externalStatus: 'accepted',
        canonicalStatus: 'under_review',
        statusMessage: 'Mock database handoff accepted'
      },
      rawResponse: {
        submitProcedure: this.config.database?.submitProcedure || null,
        payload: canonicalPayload
      },
      correlationId: context.correlationId
    });
  }

  async getStatus(externalReferenceId, context = {}) {
    return this.buildResult('status_check', {
      externalReferenceId,
      status: {
        externalStatus: 'database_pending',
        canonicalStatus: 'under_review',
        statusMessage: 'Status query placeholder'
      },
      rawResponse: {
        statusQuery: this.config.database?.statusQuery || null
      },
      correlationId: context.correlationId
    });
  }

  async receiveCallback(callbackPayload, context = {}) {
    return this.buildResult('callback_receive', {
      externalReferenceId: callbackPayload.externalReferenceId || null,
      status: {
        externalStatus: callbackPayload.status || 'received',
        canonicalStatus: callbackPayload.status || 'received',
        statusMessage: 'Database callback placeholder'
      },
      rawResponse: callbackPayload,
      correlationId: context.correlationId
    });
  }
}

module.exports = { DatabaseDepartmentAdapter };
