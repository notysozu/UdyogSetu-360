function validatePagination(query = {}) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 500);
  return { page, limit };
}

module.exports = { validatePagination };
