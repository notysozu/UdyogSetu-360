const { isValidObjectId } = require('../../../../packages/shared/src');

function assertObjectId(value, fieldName) {
  if (!isValidObjectId(value)) {
    throw new Error(`${fieldName} must be a valid ObjectId.`);
  }
}

function assertEnum(value, allowedValues, fieldName) {
  if (!allowedValues.includes(value)) {
    throw new Error(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
  }
}

function assertDateOrder(start, end, message) {
  if (start && end && end <= start) {
    throw new Error(message);
  }
}

function assertNonNegative(value, fieldName) {
  if (Number(value) < 0) {
    throw new Error(`${fieldName} must be non-negative.`);
  }
}

module.exports = {
  assertObjectId,
  assertEnum,
  assertDateOrder,
  assertNonNegative
};
