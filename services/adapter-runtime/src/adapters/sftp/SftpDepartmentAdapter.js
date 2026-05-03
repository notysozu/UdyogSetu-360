const fs = require('fs/promises');
const path = require('path');
const { BaseDepartmentAdapter } = require('../base/BaseDepartmentAdapter');

class SftpDepartmentAdapter extends BaseDepartmentAdapter {
  async submitApplication(canonicalPayload, context = {}) {
    const outboundPath = this.config.fileDrop?.outboundPath || path.join(process.cwd(), 'tmp', 'adapter-outbound');
    await fs.mkdir(outboundPath, { recursive: true });
    const fileName = `${this.departmentCode}-${Date.now()}.json`;
    await fs.writeFile(path.join(outboundPath, fileName), JSON.stringify(canonicalPayload, null, 2));
    return this.buildResult('submit_application', {
      externalReferenceId: fileName,
      acknowledgement: {
        acknowledgementNumber: `${this.adapterCode.toUpperCase()}-FILE-${Date.now()}`,
        acknowledgedAt: new Date().toISOString(),
        message: 'Application staged to file drop'
      },
      status: {
        externalStatus: 'file_written',
        canonicalStatus: 'under_review',
        statusMessage: 'File written to outbound directory'
      },
      rawResponse: { fileName, outboundPath },
      correlationId: context.correlationId
    });
  }

  async getStatus(_externalReferenceId, context = {}) {
    return this.buildResult('status_check', {
      status: {
        externalStatus: 'status_polling_not_configured',
        canonicalStatus: 'under_review',
        statusMessage: 'Status polling placeholder for file drop adapter'
      },
      rawResponse: {},
      correlationId: context.correlationId
    });
  }

  async pushDocument(documentPayload, context = {}) {
    return this.submitApplication({ documentManifest: documentPayload }, context);
  }

  async healthCheck(context = {}) {
    const outboundPath = this.config.fileDrop?.outboundPath || path.join(process.cwd(), 'tmp', 'adapter-outbound');
    await fs.mkdir(outboundPath, { recursive: true });
    await fs.access(outboundPath);
    return this.buildResult('health_check', {
      status: {
        externalStatus: 'directory_accessible',
        canonicalStatus: 'ok',
        statusMessage: 'File drop directory is accessible'
      },
      rawResponse: { outboundPath },
      correlationId: context.correlationId
    });
  }
}

module.exports = { SftpDepartmentAdapter };
