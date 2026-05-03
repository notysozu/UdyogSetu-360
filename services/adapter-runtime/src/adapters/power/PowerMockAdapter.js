const { RestDepartmentAdapter } = require('../rest/RestDepartmentAdapter');
const { POWER_OUTBOUND_PROFILE } = require('../../mappings/mock-mapping-profiles');
const { mapCanonicalToDepartment } = require('../../mappings/mapping-engine');
const { normaliseDepartmentStatus } = require('../../transformers/department-payload-normaliser');

class PowerMockAdapter extends RestDepartmentAdapter {
  static adapterCode = 'power_mock_v1';
  static departmentCode = 'power';

  transformOutboundPayload(canonicalPayload) {
    return mapCanonicalToDepartment(canonicalPayload, POWER_OUTBOUND_PROFILE);
  }

  async submitApplication(canonicalPayload, context = {}) {
    const payload = this.transformOutboundPayload(canonicalPayload, context);
    const rawResponse = {
      success: true,
      applicationNo: 'BESCOM-HT-2026-000456',
      ackNo: 'BESCOM-ACK-2026-000456',
      status: 'application_registered',
      estimatedDemandCharges: 125000
    };
    return this.buildResult('submit_application', {
      externalReferenceId: rawResponse.applicationNo,
      acknowledgement: this.buildAcknowledgement(rawResponse, {
        ...context,
        message: 'Power connection application registered'
      }),
      status: {
        externalStatus: rawResponse.status,
        canonicalStatus: normaliseDepartmentStatus(rawResponse.status, this.departmentCode),
        statusMessage: 'Application registered with BESCOM'
      },
      rawResponse: { ...rawResponse, request: payload },
      correlationId: context.correlationId
    });
  }

  async getStatus(externalReferenceId, context = {}) {
    const rawResponse = {
      success: true,
      applicationNo: externalReferenceId,
      status: 'payment_pending',
      estimatedDemandCharges: 125000
    };
    return this.buildResult('status_check', {
      externalReferenceId,
      status: {
        externalStatus: rawResponse.status,
        canonicalStatus: normaliseDepartmentStatus(rawResponse.status, this.departmentCode),
        statusMessage: 'Demand charges awaiting payment'
      },
      rawResponse,
      correlationId: context.correlationId
    });
  }

  async receiveCallback(callbackPayload, context = {}) {
    return this.buildResult('callback_receive', {
      externalReferenceId: callbackPayload.externalReferenceId || 'BESCOM-HT-2026-000456',
      status: {
        externalStatus: callbackPayload.status || 'load_sanctioned',
        canonicalStatus: normaliseDepartmentStatus(callbackPayload.status || 'load_sanctioned', this.departmentCode),
        statusMessage: callbackPayload.remarks || 'Power callback normalised'
      },
      rawResponse: callbackPayload,
      correlationId: context.correlationId
    });
  }
}

module.exports = { PowerMockAdapter };
