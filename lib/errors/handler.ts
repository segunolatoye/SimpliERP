import { NextResponse } from 'next/server';
import { AppError } from './appError';
import { logger, logContextStorage } from '@/lib/logger';

export interface StandardErrorResponse {
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
}

/**
 * Maps any caught error to a standard error shape and status code.
 * Used by API routes and Server Actions.
 */
export function mapError(error: unknown): { status: number; body: StandardErrorResponse } {
  const store = logContextStorage.getStore() || {};
  const requestId = store.requestId;

  if (error instanceof AppError) {
    logger.warn(`Operational error: ${error.message}`, {
      code: error.code,
      httpStatus: error.httpStatus,
      meta: error.meta,
      requestId,
    });
    return {
      status: error.httpStatus,
      body: {
        error: {
          code: error.code,
          message: error.message,
          requestId,
        },
      },
    };
  }

  // Mask internal/unexpected error details from the client
  logger.error(`Unhandled unexpected error: ${error instanceof Error ? error.message : String(error)}`, {
    stack: error instanceof Error ? error.stack : undefined,
    requestId,
  });

  return {
    status: 500,
    body: {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected internal error occurred.',
        requestId,
      },
    },
  };
}

/**
 * High-order wrapper for API route handlers to catch errors and return NextResponse.
 */
export function wrapApiHandler(
  handler: (...args: any[]) => Promise<Response>
) {
  return async (...args: any[]): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      const { status, body } = mapError(error);
      return NextResponse.json(body, { status });
    }
  };
}

/**
 * High-order wrapper for Server Actions to run safely and return unified error response.
 */
export async function runActionSafe<T>(
  action: () => Promise<T>
): Promise<{ data: T | null; error: StandardErrorResponse['error'] | null }> {
  try {
    const data = await action();
    return { data, error: null };
  } catch (error) {
    const { body } = mapError(error);
    return { data: null, error: body.error };
  }
}
