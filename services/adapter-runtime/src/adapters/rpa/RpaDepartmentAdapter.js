const { BaseDepartmentAdapter } = require('../base/BaseDepartmentAdapter');

class RpaDepartmentAdapter extends BaseDepartmentAdapter {
  async submitApplication(canonicalPayload, context = {}) {
    if (this.config.rpa?.botEndpoint && !this.config.metadata?.mock) {
      const response = await fetch(this.config.rpa.botEndpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-correlation-id': context.correlationId || ''
        },
        body: JSON.stringify({
          botName: this.config.rpa.botName,
          scriptName: this.config.rpa.scriptName,
          payload: canonicalPayload
        })
      });
      const data = await response.json();
      return this.buildResult('submit_application', {
        externalReferenceId: data.externalReferenceId || `${this.departmentCode.toUpperCase()}-RPA-${Date.now()}`,
        acknowledgement: this.buildAcknowledgement(data, context),
        status: {
          externalStatus: data.status || 'bot_accepted',
          canonicalStatus: 'under_review',
          statusMessage: data.message || 'Bot accepted the request'
        },
        rawResponse: data,
        correlationId: context.correlationId
      });
    }
    return this.buildResult('submit_application', {
      externalReferenceId: `${this.departmentCode.toUpperCase()}-RPA-${Date.now()}`,
      acknowledgement: {
        acknowledgementNumber: `${this.departmentCode.toUpperCase()}-RPA-ACK-${Date.now()}`,
        acknowledgedAt: new Date().toISOString(),
        message: 'Development RPA placeholder accepted request'
      },
      status: {
        externalStatus: 'bot_accepted',
        canonicalStatus: 'under_review',
        statusMessage: 'RPA placeholder accepted request'
      },
      rawResponse: {
        botName: this.config.rpa?.botName || null
      },
      correlationId: context.correlationId
    });
  }

  async getStatus(externalReferenceId, context = {}) {
    return this.buildResult('status_check', {
      externalReferenceId,
      status: {
        externalStatus: 'bot_processing',
        canonicalStatus: 'under_review',
        statusMessage: 'Bot is processing the submission'
      },
      rawResponse: {},
      correlationId: context.correlationId
    });
  }
}

module.exports = { RpaDepartmentAdapter };
