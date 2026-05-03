const axios = require('axios');
const { env } = require('../config/env');

async function postAi(path, payload) {
  try {
    const response = await axios.post(`${env.AI_SERVICE_URL}${path}`, payload, { timeout: 2500 });
    return response.data;
  } catch (error) {
    return {
      ok: false,
      unavailable: true,
      message: 'AI service unavailable. Falling back to deterministic rules.',
      detail: error.message
    };
  }
}

function fallbackRecommendation(payload) {
  const departments = ['KSPCB', 'BESCOM'];
  if (payload.fireSafety === 'yes') departments.push('FIRE');
  if (payload.factoryLicence === 'yes') departments.push('DISH');
  if (payload.labourRegistration === 'yes') departments.push('LABOUR');
  return {
    ok: true,
    recommendedDepartments: [...new Set(departments)],
    confidence: 0.62,
    explanation: 'Fallback rules selected departments from the submitted flags.'
  };
}

async function recommendApprovals(payload) {
  const result = await postAi('/ai/recommend-approvals', payload);
  if (result.ok && Array.isArray(result.recommendedDepartments)) return result;
  return fallbackRecommendation(payload);
}

async function validateSubmission(payload) {
  return postAi('/ai/validate-submission', payload);
}

async function predictDelay(payload) {
  return postAi('/ai/predict-delay', payload);
}

module.exports = { recommendApprovals, validateSubmission, predictDelay };
