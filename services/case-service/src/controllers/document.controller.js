const documentService = require('../services/document.service');
const { validateObjectId, validateUploadInput, validateMetadataPatch, validateTags } = require('../validators/document.validators');

function contextFromRequest(req) {
  return {
    user: {
      _id: req.get('x-user-id') || req.body.userId || null,
      id: req.get('x-user-id') || req.body.userId || null,
      primaryRole: req.get('x-user-role') || null,
      role: req.get('x-user-role') || null,
      organisationId: req.get('x-organisation-id') || req.body.organisationId || null,
      departmentId: req.get('x-department-id') || null,
      departmentCode: req.get('x-department-code') || null
    },
    correlationId: req.correlationId,
    requestId: req.requestId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    idempotencyKey: req.get('idempotency-key') || null
  };
}

async function upload(req, res, next) {
  try {
    const input = validateUploadInput(req.body || {});
    const document = await documentService.uploadDocument(req.file, input, contextFromRequest(req));
    res.status(201).json({ ok: true, data: document });
  } catch (error) {
    next(error);
  }
}

async function uploadForCase(req, res, next) {
  try {
    validateObjectId(req.params.caseId, 'caseId');
    const input = validateUploadInput({ ...req.body, caseId: req.params.caseId });
    const document = await documentService.uploadDocument(req.file, input, contextFromRequest(req));
    res.status(201).json({ ok: true, data: document });
  } catch (error) {
    next(error);
  }
}

async function signedUploadUrl(req, res, next) {
  try {
    const input = validateUploadInput(req.body || {});
    const intent = await documentService.createUploadIntent(input, contextFromRequest(req));
    res.status(201).json({ ok: true, data: intent });
  } catch (error) {
    next(error);
  }
}

async function confirmUpload(req, res, next) {
  try {
    validateObjectId(req.params.documentId, 'documentId');
    const document = await documentService.confirmSignedUpload(req.params.documentId, req.body || {}, contextFromRequest(req));
    res.json({ ok: true, data: document });
  } catch (error) {
    next(error);
  }
}

async function metadata(req, res, next) {
  try {
    const document = await documentService.getDocumentMetadata(req.params.documentId, contextFromRequest(req));
    res.json({ ok: true, data: document });
  } catch (error) {
    next(error);
  }
}

async function listByCase(req, res, next) {
  try {
    validateObjectId(req.params.caseId, 'caseId');
    const rows = await documentService.listCaseDocuments(req.params.caseId, req.query || {}, contextFromRequest(req));
    res.json({ ok: true, data: rows });
  } catch (error) {
    next(error);
  }
}

async function listByTask(req, res, next) {
  try {
    validateObjectId(req.params.taskId, 'taskId');
    const rows = await documentService.listTaskDocuments(req.params.taskId, req.query || {}, contextFromRequest(req));
    res.json({ ok: true, data: rows });
  } catch (error) {
    next(error);
  }
}

async function signedDownloadUrl(req, res, next) {
  try {
    const result = await documentService.generateSignedDownloadUrl(req.params.documentId, contextFromRequest(req));
    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function download(req, res, next) {
  try {
    const { document, object } = await documentService.downloadDocument(req.params.documentId, contextFromRequest(req));
    res.setHeader('Content-Type', document.file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${document.file.storedName}"`);
    if (object.Body?.pipe) {
      return object.Body.pipe(res);
    }
    return res.send(object.Body);
  } catch (error) {
    next(error);
  }
}

async function preview(req, res, next) {
  try {
    const { document, object } = await documentService.downloadDocument(req.params.documentId, contextFromRequest(req));
    res.setHeader('Content-Type', document.file.mimeType || 'application/octet-stream');
    if (object.Body?.pipe) {
      return object.Body.pipe(res);
    }
    return res.send(object.Body);
  } catch (error) {
    next(error);
  }
}

async function updateMetadata(req, res, next) {
  try {
    const patch = validateMetadataPatch(req.body || {});
    const document = await documentService.updateDocumentMetadata(req.params.documentId, patch, contextFromRequest(req));
    res.json({ ok: true, data: document });
  } catch (error) {
    next(error);
  }
}

async function newVersion(req, res, next) {
  try {
    const document = await documentService.createNewVersion(req.params.documentId, req.file, contextFromRequest(req));
    res.status(201).json({ ok: true, data: document });
  } catch (error) {
    next(error);
  }
}

async function versions(req, res, next) {
  try {
    const rows = await documentService.getDocumentVersions(req.params.documentId);
    res.json({ ok: true, data: rows });
  } catch (error) {
    next(error);
  }
}

async function addTags(req, res, next) {
  try {
    const document = await documentService.tagDocument(req.params.documentId, validateTags(req.body.tags || []), contextFromRequest(req));
    res.json({ ok: true, data: document });
  } catch (error) {
    next(error);
  }
}

async function removeTag(req, res, next) {
  try {
    const document = await documentService.removeDocumentTag(req.params.documentId, req.params.tag, contextFromRequest(req));
    res.json({ ok: true, data: document });
  } catch (error) {
    next(error);
  }
}

async function verify(req, res, next) {
  try {
    const document = await documentService.verifyDocument(req.params.documentId, req.body || {}, contextFromRequest(req));
    res.json({ ok: true, data: document });
  } catch (error) {
    next(error);
  }
}

async function reject(req, res, next) {
  try {
    const document = await documentService.rejectDocument(req.params.documentId, req.body || {}, contextFromRequest(req));
    res.json({ ok: true, data: document });
  } catch (error) {
    next(error);
  }
}

async function supersede(req, res, next) {
  try {
    const document = await documentService.supersedeDocument(req.params.documentId, req.body.newDocumentId, contextFromRequest(req));
    res.json({ ok: true, data: document });
  } catch (error) {
    next(error);
  }
}

async function scan(req, res, next) {
  try {
    const document = await require('../services/document-scanning.service').requestScan(req.params.documentId, contextFromRequest(req));
    res.json({ ok: true, data: document });
  } catch (error) {
    next(error);
  }
}

async function scanCallback(req, res, next) {
  try {
    const result = await require('../services/document-scanning.service').handleScanCallback(req.body || {}, contextFromRequest(req));
    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function localUpload(req, res, next) {
  try {
    const result = await documentService.handleLocalSignedUpload({
      objectKey: req.query.objectKey,
      expiresAt: req.query.expires,
      signature: req.query.signature,
      body: req.body,
      contentType: req.get('content-type') || 'application/octet-stream'
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function localDownload(req, res, next) {
  try {
    const { object, document } = await documentService.downloadLocalSignedObject({
      objectKey: req.query.objectKey,
      expiresAt: req.query.expires,
      signature: req.query.signature,
      context: contextFromRequest(req)
    });
    res.setHeader('Content-Type', document?.file?.mimeType || 'application/octet-stream');
    if (document?.file?.storedName) {
      res.setHeader('Content-Disposition', `attachment; filename="${document.file.storedName}"`);
    }
    if (object.Body?.pipe) {
      return object.Body.pipe(res);
    }
    return res.send(object.Body);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  upload,
  uploadForCase,
  signedUploadUrl,
  confirmUpload,
  metadata,
  listByCase,
  listByTask,
  signedDownloadUrl,
  download,
  preview,
  updateMetadata,
  newVersion,
  versions,
  addTags,
  removeTag,
  verify,
  reject,
  supersede,
  scan,
  scanCallback,
  localUpload,
  localDownload
};
