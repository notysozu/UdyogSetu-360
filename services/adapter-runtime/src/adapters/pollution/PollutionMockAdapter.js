const { RestDepartmentAdapter } = require('../rest/RestDepartmentAdapter');
const { normaliseDepartmentStatus } = require('../../transformers/department-payload-normaliser');
const { POLLUTION_OUTBOUND_PROFILE } = require('../../mappings/mock-mapping-profiles');
const { mapCanonicalToDepartment } = require('../../mappings/mapping-engine');

class PollutionMockAdapter extends RestDepartmentAdapter {
  static adapterCode = 'pollution_mock_v1';
  static departmentCode = 'pollution';

  transformOutboundPayload(canonicalPayload) {
    return mapCanonicalToDepartment(canonicalPayload, POLLUTION_OUTBOUND_PROFILE);
  }

  async submitApplication(canonicalPayload, context = {}) {
    const payload = this.transformOutboundPayload(canonicalPayload, context);
    const rawResponse = {
      success: true,
      applicationNo: 'KSPCB-CTE-2026-000123',
      ackNo: 'KSPCB-ACK-2026-000123',
      status: 'received_for_scrutiny',
      message: 'Consent application received for scrutiny'
    };
    return this.buildResult('submit_application', {
      externalReferenceId: rawResponse.applicationNo,
      acknowledgement: this.buildAcknowledgement(rawResponse, context),
      status: {
        externalStatus: rawResponse.status,
        canonicalStatus: normaliseDepartmentStatus(rawResponse.status, this.departmentCode),
        statusMessage: rawResponse.message
      },
      rawResponse: { ...rawResponse, request: payload },
      correlationId: context.correlationId
    });
  }

  async getStatus(externalReferenceId, context = {}) {
    const rawResponse = {
      success: true,
      applicationNo: externalReferenceId,
      status: 'query_raised',
      message: 'Clarification required from applicant'
    };
    return this.buildResult('status_check', {
      externalReferenceId,
      status: {
        externalStatus: rawResponse.status,
        canonicalStatus: normaliseDepartmentStatus(rawResponse.status, this.departmentCode),
        statusMessage: rawResponse.message
      },
      rawResponse,
      correlationId: context.correlationId
    });
  }

  async pushDocument(documentPayload, context = {}) {
    return this.buildResult('document_push', {
      externalReferenceId: documentPayload.externalReferenceId || 'KSPCB-CTE-2026-000123',
      acknowledgement: {
        acknowledgementNumber: 'KSPCB-DOC-ACK-2026-000123',
        acknowledgedAt: new Date().toISOString(),
        message: 'Document manifest received'
      },
      status: {
        externalStatus: 'document_received',
        canonicalStatus: 'under_review',
        statusMessage: 'Document received by pollution department'
      },
      rawResponse: { success: true, documentPayload },
      correlationId: context.correlationId
    });
  }

  async receiveCallback(callbackPayload, context = {}) {
    return this.buildResult('callback_receive', {
      externalReferenceId: callbackPayload.externalReferenceId || 'KSPCB-CTE-2026-000123',
      status: {
        externalStatus: callbackPayload.status || 'approved',
        canonicalStatus: normaliseDepartmentStatus(callbackPayload.status || 'approved', this.departmentCode),
        statusMessage: callbackPayload.remarks || 'Callback received from pollution department'
      },
      rawResponse: callbackPayload,
      correlationId: context.correlationId
    });
  }
}

module.exports = { PollutionMockAdapter };
