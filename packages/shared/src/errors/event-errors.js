class EventError extends Error {
  constructor(message, code = 'EVENT_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
  }
}

class RetryableEventError extends EventError {
  constructor(message, details = null) {
    super(message, 'RETRYABLE_EVENT_ERROR', details);
  }
}

class NonRetryableEventError extends EventError {
  constructor(message, details = null) {
    super(message, 'NON_RETRYABLE_EVENT_ERROR', details);
  }
}

class EventValidationError extends NonRetryableEventError {
  constructor(message, details = null) {
    super(message, details);
    this.code = 'EVENT_VALIDATION_ERROR';
  }
}

class EventSchemaError extends NonRetryableEventError {
  constructor(message, details = null) {
    super(message, details);
    this.code = 'EVENT_SCHEMA_ERROR';
  }
}

class EventHandlerNotFoundError extends NonRetryableEventError {
  constructor(message, details = null) {
    super(message, details);
    this.code = 'EVENT_HANDLER_NOT_FOUND';
  }
}

class EventIdempotencyError extends EventError {
  constructor(message, details = null) {
    super(message, 'EVENT_IDEMPOTENCY_ERROR', details);
  }
}

class EventPublishError extends RetryableEventError {
  constructor(message, details = null) {
    super(message, details);
    this.code = 'EVENT_PUBLISH_ERROR';
  }
}

class EventDeadLetterError extends NonRetryableEventError {
  constructor(message, details = null) {
    super(message, details);
    this.code = 'EVENT_DEAD_LETTER_ERROR';
  }
}

class KafkaConnectionError extends RetryableEventError {
  constructor(message, details = null) {
    super(message, details);
    this.code = 'KAFKA_CONNECTION_ERROR';
  }
}

module.exports = {
  EventError,
  RetryableEventError,
  NonRetryableEventError,
  EventValidationError,
  EventSchemaError,
  EventHandlerNotFoundError,
  EventIdempotencyError,
  EventPublishError,
  EventDeadLetterError,
  KafkaConnectionError
};
