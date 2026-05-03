const { RestDepartmentAdapter } = require('../rest/RestDepartmentAdapter');
const { FIRE_OUTBOUND_PROFILE } = require('../../mappings/mock-mapping-profiles');
const { mapCanonicalToDepartment } = require('../../mappings/mapping-engine');
const { normaliseDepartmentStatus } = require('../../transformers/department-payload-normaliser');

class FireMockAdapter extends RestDepartmentAdapter {
  static adapterCode = 'fire_mock_v1';
  static departmentCode = 'fire';

  transformOutboundPayload(canonicalPayload) {
    return mapCanonicalToDepartment(canonicalPayload, FIRE_OUTBOUND_PROFILE);
  }

  async submitApplication(canonicalPayload, context = {}) {
    const payload = this.transformOutboundPayload(canonicalPayload, context);
    const rawResponse = {
      success: true,
      applicationNo: 'KSFES-NOC-2026-000789',
      ackNo: 'KSFES-ACK-2026-000789',
      status: 'inspection_to_be_scheduled',
      inspectionRequired: true
    };
    return this.buildResult('submit_application', {
      externalReferenceId: rawResponse.applicationNo,
      acknowledgement: this.buildAcknowledgement(rawResponse, {
        ...context,
        message: 'Fire NOC application accepted'
      }),
      status: {
        externalStatus: rawResponse.status,
        canonicalStatus: normaliseDepartmentStatus(rawResponse.status, this.departmentCode),
        statusMessage: 'Inspection to be scheduled'
      },
      rawResponse: { ...rawResponse, request: payload },
      correlationId: context.correlationId
    });
  }

  async getStatus(externalReferenceId, context = {}) {
    const rawResponse = {
      success: true,
      applicationNo: externalReferenceId,
      status: 'inspection_scheduled',
      inspectionDate: new Date().toISOString()
    };
    return this.buildResult('status_check', {
      externalReferenceId,
      status: {
        externalStatus: rawResponse.status,
        canonicalStatus: normaliseDepartmentStatus(rawResponse.status, this.departmentCode),
        statusMessage: 'Inspection scheduled'
      },
      rawResponse,
      correlationId: context.correlationId
    });
  }

  async receiveCallback(callbackPayload, context = {}) {
    return this.buildResult('callback_receive', {
      externalReferenceId: callbackPayload.externalReferenceId || 'KSFES-NOC-2026-000789',
      status: {
        externalStatus: callbackPayload.status || 'inspection_completed',
        canonicalStatus: normaliseDepartmentStatus(callbackPayload.status || 'inspection_completed', this.departmentCode),
        statusMessage: callbackPayload.remarks || 'Inspection callback received'
      },
      rawResponse: callbackPayload,
      correlationId: context.correlationId
    });
  }
}

module.exports = { FireMockAdapter };
