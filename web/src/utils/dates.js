function addDays(date, days) {
  const output = new Date(date);
  output.setDate(output.getDate() + Number(days || 0));
  return output;
}

module.exports = { addDays };
