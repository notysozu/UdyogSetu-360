function generateCaseId(date = new Date(), randomSource = Math.random) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const suffix = Math.floor(randomSource() * 90000 + 10000);
  return `US360-${y}${m}${d}-${suffix}`;
}

module.exports = { generateCaseId };
