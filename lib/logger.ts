import { AsyncLocalStorage } from 'async_hooks';

export interface LogContext {
  requestId?: string;
  orgId?: string;
  userId?: string;
  module?: string;
}

// Storage to thread requestId, orgId, userId across asynchronous flows
export const logContextStorage = new AsyncLocalStorage<LogContext>();

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

// Sensitive keys to redact
const SENSITIVE_KEYS = new Set([
  'password',
  'password_hash',
  'passwordConfirm',
  'mfa_secret',
  'mfa_last_otp',
  'token',
  'code',
  'secret',
  'apiKey',
  'email',
  'phone_number',
  'phone'
]);

/**
 * Deeply redacts sensitive keys to prevent logging PII or secrets
 */
function redact(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(redact);
  }

  const redacted: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      redacted[key] = '[REDACTED]';
    } else if (typeof val === 'object') {
      redacted[key] = redact(val);
    } else {
      redacted[key] = val;
    }
  }
  return redacted;
}

function writeLog(level: LogLevel, message: string, extra: Record<string, any> = {}) {
  const store = logContextStorage.getStore() || {};
  
  const logPayload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    requestId: store.requestId || extra.requestId,
    orgId: store.orgId || extra.orgId,
    userId: store.userId || extra.userId,
    module: store.module || extra.module || 'system',
    ...redact(extra)
  };

  // Enforce structured logging via stdout/stderr
  if (level === 'error' || level === 'warn') {
    console.error(JSON.stringify(logPayload));
  } else {
    console.log(JSON.stringify(logPayload));
  }
}

export const logger = {
  info(message: string, extra?: Record<string, any>) {
    writeLog('info', message, extra);
  },
  warn(message: string, extra?: Record<string, any>) {
    writeLog('warn', message, extra);
  },
  error(message: string, extra?: Record<string, any>) {
    writeLog('error', message, extra);
  },
  debug(message: string, extra?: Record<string, any>) {
    writeLog('debug', message, extra);
  },
  // Runs a function within a specific logging context (e.g. middleware setting requestId)
  runWithContext<T>(context: LogContext, fn: () => T): T {
    const parentContext = logContextStorage.getStore() || {};
    return logContextStorage.run({ ...parentContext, ...context }, fn);
  }
};
