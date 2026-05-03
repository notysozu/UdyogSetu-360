const mongoose = require('mongoose');

const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const SNAKE_CASE_PATTERN = /^[a-z]+(?:_[a-z]+)*$/;
const PHONE_PATTERN = /^[0-9+\-() ]{7,20}$/;

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function validateGstin(value) {
  return !value || GSTIN_PATTERN.test(value);
}

function validatePan(value) {
  return !value || PAN_PATTERN.test(value);
}

function validateSnakeCase(value) {
  return !value || SNAKE_CASE_PATTERN.test(value);
}

function validatePhone(value) {
  return !value || PHONE_PATTERN.test(value);
}

module.exports = {
  GSTIN_PATTERN,
  PAN_PATTERN,
  SNAKE_CASE_PATTERN,
  PHONE_PATTERN,
  isValidObjectId,
  validateGstin,
  validatePan,
  validateSnakeCase,
  validatePhone
};
