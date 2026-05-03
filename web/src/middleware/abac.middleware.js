const {
  assertCanAccessCase,
  assertCanAccessTask
} = require('../services/abacService');

function requireCaseAccess(loader) {
  return async (req, _res, next) => {
    try {
      const caseDoc = await loader(req);
      assertCanAccessCase(req.user, caseDoc);
      req.caseDoc = caseDoc;
      next();
    } catch (error) {
      next(error);
    }
  };
}

function requireTaskAccess(loader) {
  return async (req, _res, next) => {
    try {
      const taskDoc = await loader(req);
      assertCanAccessTask(req.user, taskDoc);
      req.taskDoc = taskDoc;
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { requireCaseAccess, requireTaskAccess };
