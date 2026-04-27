import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { AppError } from '../utils/AppError';

/**
 * Run validation chains and return errors if any
 */
export const validate = (validations: ValidationChain[]) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      for (const validation of validations) {
        await validation.run(req);
      }

      const errors = validationResult(req);

      if (errors.isEmpty()) {
        return next();
      }

      const formattedErrors = errors.array().map((err) => ({
        field: "path" in err ? err.path : "unknown",
        message: err.msg,
      }));

      return next(
        new AppError("Validation failed", 400, formattedErrors)
      );
    } catch (error) {
      next(error);
    }
  };
};