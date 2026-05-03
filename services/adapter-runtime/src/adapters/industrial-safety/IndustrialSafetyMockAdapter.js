const { RestDepartmentAdapter } = require('../rest/RestDepartmentAdapter');
const { INDUSTRIAL_SAFETY_OUTBOUND_PROFILE } = require('../../mappings/mock-mapping-profiles');
const { mapCanonicalToDepartment } = require('../../mappings/mapping-engine');
const { normaliseDepartmentStatus } = require('../../transformers/department-payload-normaliser');

class IndustrialSafetyMockAdapter extends RestDepartmentAdapter {
  static adapterCode = 'industrial_safety_mock_v1';
  static departmentCode = 'industrial_safety';

  transformOutboundPayload(canonicalPayload) {
    return mapCanonicalToDepartment(canonicalPayload, INDUSTRIAL_SAFETY_OUTBOUND_PROFILE);
  }

  async submitApplication(canonicalPayload, context = {}) {
    const payload = this.transformOutboundPayload(canonicalPayload, context);
    const rawResponse = {
      success: true,
      applicationNo: 'DFBIS-FL-2026-000321',
      ackNo: 'DFBIS-ACK-2026-000321',
      status: 'technical_scrutiny'
    };
    return this.buildResult('submit_application', {
      externalReferenceId: rawResponse.applicationNo,
      acknowledgement: this.buildAcknowledgement(rawResponse, {
        ...context,
        message: 'Industrial safety application under technical scrutiny'
      }),
      status: {
        externalStatus: rawResponse.status,
        canonicalStatus: normaliseDepartmentStatus(rawResponse.status, this.departmentCode),
        statusMessage: 'Technical scrutiny started'
      },
      rawResponse: { ...rawResponse, request: payload },
      correlationId: context.correlationId
    });
  }

  async getStatus(externalReferenceId, context = {}) {
    const rawResponse = {
      success: true,
      applicationNo: externalReferenceId,
      status: 'fee_required'
    };
    return this.buildResult('status_check', {
      externalReferenceId,
      status: {
        externalStatus: rawResponse.status,
        canonicalStatus: normaliseDepartmentStatus(rawResponse.status, this.departmentCode),
        statusMessage: 'Department fee required'
      },
      rawResponse,
      correlationId: context.correlationId
    });
  }

  async receiveCallback(callbackPayload, context = {}) {
    return this.buildResult('callback_receive', {
      externalReferenceId: callbackPayload.externalReferenceId || 'DFBIS-FL-2026-000321',
      status: {
        externalStatus: callbackPayload.status || 'license_approved',
        canonicalStatus: normaliseDepartmentStatus(callbackPayload.status || 'license_approved', this.departmentCode),
        statusMessage: callbackPayload.remarks || 'Industrial safety callback received'
      },
      rawResponse: callbackPayload,
      correlationId: context.correlationId
    });
  }
}

module.exports = { IndustrialSafetyMockAdapter };
