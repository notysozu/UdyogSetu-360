const DEPARTMENT_CODES = Object.freeze({
  POLLUTION: 'pollution',
  POWER: 'power',
  FIRE: 'fire',
  INDUSTRIAL_SAFETY: 'industrial_safety',
  LABOUR: 'labour'
});

const DEPARTMENT_CODE_VALUES = Object.freeze(Object.values(DEPARTMENT_CODES));

module.exports = { DEPARTMENT_CODES, DEPARTMENT_CODE_VALUES };
