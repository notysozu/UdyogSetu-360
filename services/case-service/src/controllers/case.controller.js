const { ok, fail } = require('../../../../packages/shared/src/utils/apiResponse');
const caseRepository = require('../repositories/case.repository');
const {
  createDraftCase,
  submitCase,
  amendCase,
  addDocument,
  createGrievance,
  listTimeline
} = require('../services/case.service');

async function createCase(req, res, next) {
  try {
    const created = await createDraftCase(req.body, {
      userId: req.get('x-user-id'),
      correlationId: req.correlationId,
      actor: { userId: req.get('x-user-id') || null, role: req.get('x-user-role') || null }
    });
    res.status(201).json(ok(created));
  } catch (error) {
    next(error);
  }
}

async function listCases(_req, res, next) {
  try {
    const records = await caseRepository.paginate({}, {
      activeOnly: true,
      sort: { createdAt: -1 },
      pagination: { page: 1, limit: 100 }
    });
    res.json(ok(records));
  } catch (error) {
    next(error);
  }
}

async function getCase(req, res, next) {
  try {
    const record = await caseRepository.findById(req.params.id, { activeOnly: true });
    if (!record) {
      return res.status(404).json(fail('Case not found'));
    }
    res.json(ok(record));
  } catch (error) {
    next(error);
  }
}

async function updateCase(req, res, next) {
  try {
    const record = await amendCase(req.params.id, req.body, {
      userId: req.get('x-user-id') || null,
      correlationId: req.correlationId
    });
    if (!record) {
      return res.status(404).json(fail('Case not found'));
    }
    res.json(ok(record));
  } catch (error) {
    next(error);
  }
}

async function submitCaseAction(req, res, next) {
  try {
    const record = await submitCase(req.params.id, {
      actor: { userId: req.get('x-user-id') || null, role: req.get('x-user-role') || null }
    });
    if (!record) {
      return res.status(404).json(fail('Case not found'));
    }
    res.json(ok(record));
  } catch (error) {
    next(error);
  }
}

async function getTimeline(req, res, next) {
  try {
    const timeline = await listTimeline(req.params.id);
    res.json(ok(timeline));
  } catch (error) {
    next(error);
  }
}

async function uploadDocument(req, res, next) {
  try {
    const record = await addDocument(req.params.id, req.body, {
      actor: { userId: req.get('x-user-id') || null, role: req.get('x-user-role') || null }
    });
    if (!record) {
      return res.status(404).json(fail('Case not found'));
    }
    res.status(201).json(ok(record));
  } catch (error) {
    next(error);
  }
}

async function raiseGrievance(req, res, next) {
  try {
    const record = await createGrievance(req.params.id, req.body, {
      userId: req.get('x-user-id') || null,
      actor: { userId: req.get('x-user-id') || null, role: req.get('x-user-role') || null }
    });
    if (!record) {
      return res.status(404).json(fail('Case not found'));
    }
    res.status(201).json(ok(record));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createCase,
  listCases,
  getCase,
  updateCase,
  submitCaseAction,
  getTimeline,
  uploadDocument,
  raiseGrievance
};
