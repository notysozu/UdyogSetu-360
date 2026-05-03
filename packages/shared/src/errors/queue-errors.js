class QueueError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    this.code = details.code || this.constructor.name;
    this.retryable = Boolean(details.retryable);
  }
}

class RetryableQueueError extends QueueError {
  constructor(message, details = {}) {
    super(message, { ...details, retryable: true });
  }
}

class NonRetryableQueueError extends QueueError {
  constructor(message, details = {}) {
    super(message, { ...details, retryable: false });
  }
}

class QueueValidationError extends NonRetryableQueueError {}
class QueuePoisonMessageError extends NonRetryableQueueError {}
class DepartmentUnavailableError extends RetryableQueueError {}
class DepartmentTimeoutError extends RetryableQueueError {}
class CallbackReconciliationError extends RetryableQueueError {}
class QueuePublishError extends RetryableQueueError {}
class QueueTopologyError extends QueueError {}

module.exports = {
  QueueError,
  RetryableQueueError,
  NonRetryableQueueError,
  QueueValidationError,
  QueuePoisonMessageError,
  DepartmentUnavailableError,
  DepartmentTimeoutError,
  CallbackReconciliationError,
  QueuePublishError,
  QueueTopologyError
};
