function generateUniversalCaseId(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `US360-${year}${month}${day}-${randomPart}`;
}

module.exports = { generateUniversalCaseId };
