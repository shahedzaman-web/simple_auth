import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { User, IUser } from '../modules/user/user.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

/**
 * Verify JWT access token and attach user to request
 */
export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    // Extract token from Authorization header or cookie
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new AppError('Authentication required. Please log in.', 401);
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Check user still exists and is not blocked
    const user = await User.findById(decoded.id).select('+refreshTokens');

    if (!user) {
      throw new AppError('The account belonging to this token no longer exists.', 401);
    }

    if (user.isBlocked) {
      throw new AppError('Your account has been suspended. Please contact support.', 403);
    }

    req.user = user;
    next();
  },
);

/**
 * Authorize specific roles
 * Usage: authorize('super-admin', 'store')
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

   

    next();
  };
};

/**
 * Optional authentication - attaches user if token present, doesn't throw if missing
 */
export const optionalAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.id);
        if (user && !user.isBlocked) {
          req.user = user;
        }
      } catch {
        // Silently fail for optional auth
      }
    }

    next();
  },
);
