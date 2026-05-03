function validateExportInput(input = {}) {
  const format = input.format || 'json';
  if (!['json', 'csv', 'html_print'].includes(format)) throw new Error('Invalid export format.');
  return { format, filter: input.filter || {} };
}

module.exports = { validateExportInput };
