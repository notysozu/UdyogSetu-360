const metricsService = require('../services/public-metrics.service');

function apiEnvelope(req, data, meta = {}, status = 200) {
  return {
    status,
    body: {
      success: true,
      data,
      error: null,
      meta: {
        correlationId: req.correlationId,
        timestamp: new Date().toISOString(),
        ...meta
      }
    }
  };
}

async function loadBundle(req) {
  return metricsService.getPublicMetricsBundle(req.publicMetricsFilters || {}, {
    correlationId: req.correlationId,
    requestId: req.requestId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });
}

async function showDashboard(req, res, next) {
  try {
    const bundle = await loadBundle(req);
    res.setHeader('Cache-Control', `public, max-age=${bundle.meta.cache.ttlSeconds}`);
    return res.render('public/dashboard', {
      title: 'Public Transparency Dashboard',
      bundle,
      filters: req.publicMetricsFilters || {}
    });
  } catch (error) {
    return next(error);
  }
}

async function showMetricsOverview(req, res, next) {
  try {
    const bundle = await loadBundle(req);
    res.setHeader('Cache-Control', `public, max-age=${bundle.meta.cache.ttlSeconds}`);
    return res.render('public/metrics-overview', { title: 'Public Metrics Overview', bundle, filters: req.publicMetricsFilters || {} });
  } catch (error) {
    return next(error);
  }
}

async function showDepartments(req, res, next) {
  try {
    const bundle = await loadBundle(req);
    return res.render('public/department-metrics', { title: 'Department Turnaround', bundle, filters: req.publicMetricsFilters || {} });
  } catch (error) {
    return next(error);
  }
}

async function showGrievances(req, res, next) {
  try {
    const bundle = await loadBundle(req);
    return res.render('public/grievance-trends', { title: 'Public Grievance Trends', bundle, filters: req.publicMetricsFilters || {} });
  } catch (error) {
    return next(error);
  }
}

async function showCertificates(req, res, next) {
  try {
    const bundle = await loadBundle(req);
    return res.render('public/certificate-metrics', { title: 'Certificate Issuance Metrics', bundle, filters: req.publicMetricsFilters || {} });
  } catch (error) {
    return next(error);
  }
}

async function getBundleApi(req, res, next) {
  try {
    const bundle = await loadBundle(req);
    res.setHeader('Cache-Control', `public, max-age=${bundle.meta.cache.ttlSeconds}`);
    const payload = apiEnvelope(req, {
      overview: bundle.overview,
      stageCounts: bundle.stageCounts,
      departmentTurnaround: bundle.departmentTurnaround,
      approvalRates: bundle.approvalRates,
      certificateMetrics: bundle.certificateMetrics,
      grievanceMetrics: bundle.grievanceMetrics,
      monthlyApplications: bundle.monthlyApplications
    }, bundle.meta);
    return res.status(payload.status).json(payload.body);
  } catch (error) {
    return next(error);
  }
}

async function getApplicationsApi(req, res, next) {
  try {
    const bundle = await loadBundle(req);
    return res.json(apiEnvelope(req, { overview: bundle.overview, monthlyApplications: bundle.monthlyApplications }, bundle.meta).body);
  } catch (error) {
    return next(error);
  }
}

async function getStagesApi(req, res, next) {
  try {
    const bundle = await loadBundle(req);
    return res.json(apiEnvelope(req, { stageCounts: bundle.stageCounts }, bundle.meta).body);
  } catch (error) {
    return next(error);
  }
}

async function getDepartmentsApi(req, res, next) {
  try {
    const bundle = await loadBundle(req);
    return res.json(apiEnvelope(req, { departmentTurnaround: bundle.departmentTurnaround }, bundle.meta).body);
  } catch (error) {
    return next(error);
  }
}

async function getApprovalsApi(req, res, next) {
  try {
    const bundle = await loadBundle(req);
    return res.json(apiEnvelope(req, { approvalRates: bundle.approvalRates }, bundle.meta).body);
  } catch (error) {
    return next(error);
  }
}

async function getCertificatesApi(req, res, next) {
  try {
    const bundle = await loadBundle(req);
    return res.json(apiEnvelope(req, { certificateMetrics: bundle.certificateMetrics }, bundle.meta).body);
  } catch (error) {
    return next(error);
  }
}

async function getGrievancesApi(req, res, next) {
  try {
    const bundle = await loadBundle(req);
    return res.json(apiEnvelope(req, { grievanceMetrics: bundle.grievanceMetrics }, bundle.meta).body);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  showDashboard,
  showMetricsOverview,
  showDepartments,
  showGrievances,
  showCertificates,
  getBundleApi,
  getApplicationsApi,
  getStagesApi,
  getDepartmentsApi,
  getApprovalsApi,
  getCertificatesApi,
  getGrievancesApi
};
