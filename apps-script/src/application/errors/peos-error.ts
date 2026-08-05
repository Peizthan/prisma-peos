export type PeosErrorCode =
  | 'VALIDATION_ERROR'
  | 'SHEET_SCHEMA_INVALID'
  | 'LOCK_TIMEOUT'
  | 'ALERT_FAILURE'
  | 'UNEXPECTED_ERROR';

export interface PeosErrorOptions {
  code: PeosErrorCode;
  operation: string;
  retryable: boolean;
  context?: Record<string, unknown>;
  cause?: unknown;
}

export class PeosError extends Error {
  readonly code: PeosErrorCode;
  readonly operation: string;
  readonly retryable: boolean;
  readonly context: Record<string, unknown>;

  constructor(message: string, options: PeosErrorOptions) {
    super(message);
    this.name = 'PeosError';
    this.code = options.code;
    this.operation = options.operation;
    this.retryable = options.retryable;
    this.context = options.context ?? {};

    if (options.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }
}

export function toPeosError(
  error: unknown,
  fallback: Omit<PeosErrorOptions, 'cause'>
): PeosError {
  if (error instanceof PeosError) {
    return error;
  }

  if (error instanceof Error) {
    return new PeosError(error.message, {
      ...fallback,
      cause: error,
      context: {
        ...fallback.context,
        originalErrorName: error.name
      }
    });
  }

  return new PeosError('Unknown runtime error', {
    ...fallback,
    cause: error,
    context: {
      ...fallback.context,
      originalErrorType: typeof error
    }
  });
}
