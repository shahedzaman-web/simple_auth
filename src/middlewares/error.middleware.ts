import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

/**
 * Handle Mongoose CastError (invalid ObjectId)
 */
const handleCastErrorDB = (err: mongoose.Error.CastError): AppError => {
  return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
};

/**
 * Handle Mongoose duplicate key error
 */
const handleDuplicateFieldsDB = (err: { keyValue: Record<string, unknown> }): AppError => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  return new AppError(`${field} '${value}' already exists. Please use a different value.`, 409);
};

/**
 * Handle Mongoose validation errors
 */
const handleValidationErrorDB = (err: mongoose.Error.ValidationError): AppError => {
  const errors = Object.values(err.errors).map((el) => ({
    field: el.path,
    message: el.message,
  }));
  return new AppError('Validation failed. Please check your input.', 400, errors);
};

/**
 * Handle JWT errors
 */
const handleJWTError = (): AppError => {
  return new AppError('Invalid token. Please log in again.', 401);
};

const handleJWTExpiredError = (): AppError => {
  return new AppError('Your session has expired. Please log in again.', 401);
};

/**
 * Send error in development environment (full details)
 */
const sendErrorDev = (err: AppError, res: Response): void => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    errors: err.errors,
    stack: err.stack,
    error: err,
  });
};

/**
 * Send error in production (minimal, safe details)
 */
const sendErrorProd = (err: AppError, res: Response): void => {
  if (err.isOperational) {
    // Operational, trusted error: send to client
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
  } else {
    // Programming or unknown error: don't leak details
    logger.error('UNEXPECTED ERROR:', err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.',
    });
  }
};

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: Error & { code?: number; keyValue?: Record<string, unknown>; statusCode?: number; isOperational?: boolean; errors?: Record<string, string>[] },
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let error = { ...err } as AppError;
  error.message = err.message;
  error.stack = err.stack;

  // Set default status code
  if (!(error as AppError).statusCode) {
    (error as unknown as { statusCode: number }).statusCode = 500;
    (error as unknown as { status: string }).status = 'error';
  }

  // Transform specific error types
  if (err instanceof mongoose.Error.CastError) {
    error = handleCastErrorDB(err);
  }
  if (err.code === 11000 && err.keyValue) {
    error = handleDuplicateFieldsDB(err as { keyValue: Record<string, unknown> });
  }
  if (err instanceof mongoose.Error.ValidationError) {
    error = handleValidationErrorDB(err);
  }
  if (err instanceof JsonWebTokenError) {
    error = handleJWTError();
  }
  if (err instanceof TokenExpiredError) {
    error = handleJWTExpiredError();
  }

  // Log error
  if (process.env.NODE_ENV !== 'test') {
    logger.error(`${error.statusCode || 500} - ${error.message}`);
  }

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

/**
 * Handle 404 not found routes
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
};
