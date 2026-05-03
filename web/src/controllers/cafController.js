const { randomUUID } = require('crypto');
const { buildCafService, CafServiceError } = require('../services/caf.service');
const { duplicateCheckSchema } = require('../validators/caf.validators');
const { calculateApprovalTracks } = require('../services/approval-track.service');

const cafService = buildCafService();

function wantsJson(req) {
  return req.xhr || req.path.startsWith('/api/') || req.get('accept')?.includes('application/json');
}

function buildContext(req) {
  return {
    user: req.user || req.session?.user || null,
    correlationId: req.correlationId,
    requestId: req.requestId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    idempotencyKey: req.get('Idempotency-Key') || req.body.idempotencyKey || null
  };
}

function defaultFormData() {
  return {
    enterprise: {},
    project: {},
    land: {},
    environment: {},
    power: {},
    fire: {},
    industrialSafety: {},
    labour: {},
    attachments: []
  };
}

function renderForm(res, overrides = {}) {
  return res.render('pages/cases/caf-form', {
    title: overrides.title || 'Combined Application Form',
    formData: overrides.formData || defaultFormData(),
    errors: overrides.errors || {},
    warnings: overrides.warnings || [],
    caseDoc: overrides.caseDoc || null,
    duplicateCheck: overrides.duplicateCheck || null,
    generatedIdempotencyKey: overrides.generatedIdempotencyKey || randomUUID(),
    formAction: overrides.formAction || '/cases/draft',
    submitAction: overrides.submitAction || null,
    validateAction: overrides.validateAction || null,
    saveMethodOverride: overrides.saveMethodOverride || null
  });
}

function handleControllerError(req, res, next, error, fallbackView = null, fallbackData = {}) {
  if (!(error instanceof CafServiceError)) {
    return next(error);
  }

  if (wantsJson(req)) {
    return res.status(error.status).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.errors
      },
      data: error.duplicateCheck ? { duplicateCheck: error.duplicateCheck } : null
    });
  }

  if (error.code === 'DUPLICATE_BLOCKED' || error.code === 'DUPLICATE_CONFIRMATION_REQUIRED') {
    return res.status(error.status).render('pages/cases/duplicate-warning', {
      title: 'Potential Duplicate Detected',
      duplicateCheck: error.duplicateCheck,
      caseDoc: fallbackData.caseDoc || null,
      formData: fallbackData.formData || defaultFormData(),
      generatedIdempotencyKey: randomUUID()
    });
  }

  if (fallbackView) {
    return res.status(error.status).render(fallbackView, {
      title: fallbackData.title || 'Combined Application Form',
      formData: fallbackData.formData || defaultFormData(),
      errors: error.errors || {},
      warnings: error.warnings || [],
      caseDoc: fallbackData.caseDoc || null,
      duplicateCheck: fallbackData.duplicateCheck || null,
      generatedIdempotencyKey: fallbackData.generatedIdempotencyKey || randomUUID(),
      formAction: fallbackData.formAction,
      submitAction: fallbackData.submitAction,
      validateAction: fallbackData.validateAction,
      saveMethodOverride: fallbackData.saveMethodOverride || null
    });
  }

  req.flash('error', error.message);
  return res.redirect('/dashboard');
}

function showNewForm(req, res) {
  return renderForm(res);
}

async function saveDraft(req, res, next) {
  try {
    const result = await cafService.createDraft(req.body, buildContext(req));
    if (wantsJson(req)) {
      return res.status(201).json({
        success: true,
        data: {
          caseId: result.caseDoc.caseId,
          status: result.caseDoc.status,
          warnings: result.validation.warnings
        }
      });
    }

    req.flash('success', 'Draft saved successfully.');
    return res.redirect(`/cases/${result.caseDoc.caseId}/edit`);
  } catch (error) {
    return handleControllerError(req, res, next, error, 'pages/cases/caf-form', {
      formData: req.body,
      formAction: '/cases/draft'
    });
  }
}

async function showEditDraft(req, res, next) {
  try {
    const caseDoc = await cafService.getCase(req.params.caseId, buildContext(req));
    return renderForm(res, {
      title: `Edit CAF Draft ${caseDoc.caseId}`,
      formData: caseDoc.cafData || defaultFormData(),
      warnings: caseDoc.validationWarnings || [],
      caseDoc,
      formAction: `/cases/${caseDoc.caseId}/draft?_method=PATCH`,
      submitAction: `/cases/${caseDoc.caseId}/submit`,
      validateAction: `/cases/${caseDoc.caseId}/validate`,
      saveMethodOverride: 'PATCH'
    });
  } catch (error) {
    return next(error);
  }
}

async function updateDraft(req, res, next) {
  try {
    const result = await cafService.updateDraft(req.params.caseId, req.body, buildContext(req));
    if (wantsJson(req)) {
      return res.json({
        success: true,
        data: {
          caseId: result.caseDoc.caseId,
          status: result.caseDoc.status,
          warnings: result.validation.warnings
        }
      });
    }

    req.flash('success', 'Draft updated successfully.');
    return res.redirect(`/cases/${result.caseDoc.caseId}/edit`);
  } catch (error) {
    return handleControllerError(req, res, next, error, 'pages/cases/caf-form', {
      title: 'Edit CAF Draft',
      formData: req.body,
      caseDoc: { caseId: req.params.caseId },
      formAction: `/cases/${req.params.caseId}/draft?_method=PATCH`,
      submitAction: `/cases/${req.params.caseId}/submit`,
      validateAction: `/cases/${req.params.caseId}/validate`,
      saveMethodOverride: 'PATCH'
    });
  }
}

async function validateDraft(req, res, next) {
  try {
    const result = await cafService.validateDraft(req.params.caseId, buildContext(req));
    if (wantsJson(req)) {
      return res.json({
        success: true,
        data: {
          valid: result.validation.valid,
          errors: result.validation.errors,
          warnings: result.validation.warnings,
          duplicateCheck: result.duplicateCheck,
          approvalInfo: result.approvalInfo
        }
      });
    }

    if (!result.validation.valid) {
      return renderForm(res.status(400), {
        title: `Edit CAF Draft ${result.caseDoc.caseId}`,
        formData: result.caseDoc.cafData || defaultFormData(),
        errors: result.validation.errors,
        warnings: result.validation.warnings,
        caseDoc: result.caseDoc,
        duplicateCheck: result.duplicateCheck,
        formAction: `/cases/${result.caseDoc.caseId}/draft?_method=PATCH`,
        submitAction: `/cases/${result.caseDoc.caseId}/submit`,
        validateAction: `/cases/${result.caseDoc.caseId}/validate`,
        saveMethodOverride: 'PATCH'
      });
    }

    return res.render('pages/cases/caf-review', {
      title: `Review CAF ${result.caseDoc.caseId}`,
      caseDoc: result.caseDoc,
      formData: result.caseDoc.cafData || defaultFormData(),
      validation: result.validation,
      duplicateCheck: result.duplicateCheck,
      approvalInfo: result.approvalInfo,
      submitAction: `/cases/${result.caseDoc.caseId}/submit`,
      generatedIdempotencyKey: randomUUID()
    });
  } catch (error) {
    return next(error);
  }
}

async function submitCase(req, res, next) {
  try {
    const result = await cafService.submitCase(req.params.caseId, req.body, buildContext(req));
    if (wantsJson(req)) {
      return res.status(result.replayed ? 200 : 201).json({
        success: true,
        data: {
          caseId: result.caseDoc.caseId,
          universalCaseId: result.caseDoc.universalCaseId,
          status: result.caseDoc.status,
          acknowledgement: result.acknowledgement,
          replayed: Boolean(result.replayed)
        }
      });
    }

    req.flash('success', `Application submitted successfully. Universal Case ID: ${result.caseDoc.universalCaseId}`);
    return res.redirect(`/cases/${result.caseDoc.caseId}/acknowledgement`);
  } catch (error) {
    if (error instanceof CafServiceError && (error.code === 'DUPLICATE_BLOCKED' || error.code === 'DUPLICATE_CONFIRMATION_REQUIRED')) {
      const caseDoc = await cafService.getCase(req.params.caseId, buildContext(req)).catch(() => null);
      return handleControllerError(req, res, next, error, null, {
        caseDoc,
        formData: caseDoc?.cafData || defaultFormData()
      });
    }
    return handleControllerError(req, res, next, error, 'pages/cases/caf-form', {
      title: 'Edit CAF Draft',
      formData: req.body,
      caseDoc: { caseId: req.params.caseId },
      formAction: `/cases/${req.params.caseId}/draft?_method=PATCH`,
      submitAction: `/cases/${req.params.caseId}/submit`,
      validateAction: `/cases/${req.params.caseId}/validate`,
      saveMethodOverride: 'PATCH'
    });
  }
}

async function showAcknowledgement(req, res, next) {
  try {
    const result = await cafService.getAcknowledgement(req.params.caseId, buildContext(req));
    if (wantsJson(req)) {
      return res.json({ success: true, data: result });
    }
    return res.render('pages/cases/acknowledgement', {
      title: `Acknowledgement ${result.acknowledgement.acknowledgementNumber}`,
      caseDoc: result.caseDoc,
      tasks: result.tasks,
      acknowledgement: result.acknowledgement
    });
  } catch (error) {
    return next(error);
  }
}

async function showAcknowledgementPdf(req, res, next) {
  try {
    const result = await cafService.getAcknowledgement(req.params.caseId, buildContext(req));
    return res.render('pages/cases/acknowledgement', {
      title: `Acknowledgement ${result.acknowledgement.acknowledgementNumber}`,
      caseDoc: result.caseDoc,
      tasks: result.tasks,
      acknowledgement: result.acknowledgement,
      pdfMode: true
    });
  } catch (error) {
    return next(error);
  }
}

async function showAmendmentForm(req, res, next) {
  try {
    const caseDoc = await cafService.getCase(req.params.caseId, buildContext(req));
    return res.render('pages/cases/amendment-form', {
      title: `Amend ${caseDoc.universalCaseId || caseDoc.caseId}`,
      caseDoc,
      formData: caseDoc.cafData || defaultFormData(),
      errors: {}
    });
  } catch (error) {
    return next(error);
  }
}

async function submitAmendment(req, res, next) {
  try {
    const result = await cafService.amendCase(req.params.caseId, req.body, buildContext(req));
    if (wantsJson(req)) {
      return res.json({ success: true, data: result });
    }
    req.flash('success', 'Amendment request applied successfully.');
    return res.redirect(`/cases/${result.caseDoc.caseId}/edit`);
  } catch (error) {
    return handleControllerError(req, res, next, error, 'pages/cases/amendment-form', {
      title: `Amend ${req.params.caseId}`,
      formData: req.body,
      caseDoc: { caseId: req.params.caseId }
    });
  }
}

async function resubmitCase(req, res, next) {
  try {
    const result = await cafService.resubmitCase(req.params.caseId, req.body, buildContext(req));
    if (wantsJson(req)) {
      return res.json({ success: true, data: result });
    }
    req.flash('success', 'Case resubmitted successfully.');
    return res.redirect(`/cases/${result.caseDoc.caseId}`);
  } catch (error) {
    return handleControllerError(req, res, next, error, 'pages/cases/amendment-form', {
      title: `Resubmit ${req.params.caseId}`,
      formData: req.body,
      caseDoc: { caseId: req.params.caseId }
    });
  }
}

async function duplicateCheck(req, res, next) {
  try {
    const { data } = duplicateCheckSchema(req.body);
    const context = buildContext(req);
    const duplicateService = require('../services/duplicate-detection.service');
    const result = await duplicateService.checkDuplicate(data, context);
    return res.json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  showNewForm,
  saveDraft,
  showEditDraft,
  updateDraft,
  validateDraft,
  submitCase,
  showAcknowledgement,
  showAcknowledgementPdf,
  showAmendmentForm,
  submitAmendment,
  resubmitCase,
  duplicateCheck
};
