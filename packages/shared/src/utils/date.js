function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function computeSlaDueAt(startAt = new Date(), slaDays = 15) {
  return addDays(startAt, slaDays);
}

module.exports = { addDays, computeSlaDueAt };
