/**
 * Custom operational error class for predictable, handled errors.
 * Distinguishes operational errors from programming errors.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: string;
  public readonly isOperational: boolean;
  public readonly errors?: Record<string, string>[];

  constructor(
    message: string,
    statusCode: number,
    errors?: Record<string, string>[],
  ) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors;

    // Maintains proper stack trace for V8
    Error.captureStackTrace(this, this.constructor);
  }
}
