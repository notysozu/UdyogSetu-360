const { RestDepartmentAdapter } = require('../rest/RestDepartmentAdapter');
const { LABOUR_OUTBOUND_PROFILE } = require('../../mappings/mock-mapping-profiles');
const { mapCanonicalToDepartment } = require('../../mappings/mapping-engine');
const { normaliseDepartmentStatus } = require('../../transformers/department-payload-normaliser');

class LabourMockAdapter extends RestDepartmentAdapter {
  static adapterCode = 'labour_mock_v1';
  static departmentCode = 'labour';

  transformOutboundPayload(canonicalPayload) {
    return mapCanonicalToDepartment(canonicalPayload, LABOUR_OUTBOUND_PROFILE);
  }

  async submitApplication(canonicalPayload, context = {}) {
    const payload = this.transformOutboundPayload(canonicalPayload, context);
    const rawResponse = {
      success: true,
      applicationNo: 'LABOUR-REG-2026-000654',
      ackNo: 'LABOUR-ACK-2026-000654',
      status: 'registration_under_review'
    };
    return this.buildResult('submit_application', {
      externalReferenceId: rawResponse.applicationNo,
      acknowledgement: this.buildAcknowledgement(rawResponse, {
        ...context,
        message: 'Labour registration received'
      }),
      status: {
        externalStatus: rawResponse.status,
        canonicalStatus: normaliseDepartmentStatus(rawResponse.status, this.departmentCode),
        statusMessage: 'Registration under review'
      },
      rawResponse: { ...rawResponse, request: payload },
      correlationId: context.correlationId
    });
  }

  async getStatus(externalReferenceId, context = {}) {
    const rawResponse = {
      success: true,
      applicationNo: externalReferenceId,
      status: 'clarification_required'
    };
    return this.buildResult('status_check', {
      externalReferenceId,
      status: {
        externalStatus: rawResponse.status,
        canonicalStatus: normaliseDepartmentStatus(rawResponse.status, this.departmentCode),
        statusMessage: 'Clarification required'
      },
      rawResponse,
      correlationId: context.correlationId
    });
  }

  async receiveCallback(callbackPayload, context = {}) {
    return this.buildResult('callback_receive', {
      externalReferenceId: callbackPayload.externalReferenceId || 'LABOUR-REG-2026-000654',
      status: {
        externalStatus: callbackPayload.status || 'registration_approved',
        canonicalStatus: normaliseDepartmentStatus(callbackPayload.status || 'registration_approved', this.departmentCode),
        statusMessage: callbackPayload.remarks || 'Labour callback received'
      },
      rawResponse: callbackPayload,
      correlationId: context.correlationId
    });
  }
}

module.exports = { LabourMockAdapter };
