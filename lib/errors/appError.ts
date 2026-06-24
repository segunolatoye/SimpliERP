export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public httpStatus: number,
    public meta?: Record<string, unknown>
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, meta?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, 400, meta);
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Not authenticated', meta?: Record<string, unknown>) {
    super('UNAUTHORIZED', message, 401, meta);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'You do not have permission to perform this action', meta?: Record<string, unknown>) {
    super('FORBIDDEN', message, 403, meta);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', meta?: Record<string, unknown>) {
    super('NOT_FOUND', message, 404, meta);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', meta?: Record<string, unknown>) {
    super('CONFLICT', message, 409, meta);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests, please try again later', meta?: Record<string, unknown>) {
    super('RATE_LIMITED', message, 429, meta);
  }
}

export class QuotaExceededError extends AppError {
  constructor(
    public metric: string,
    public limit: number,
    public current: number,
    public upgradeUrl: string = '/settings/billing'
  ) {
    super(
      'QUOTA_EXCEEDED',
      `You have exceeded the quota for ${metric}.`,
      402, // Payment Required
      { metric, limit, current, upgradeUrl }
    );
  }
}
