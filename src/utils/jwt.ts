import jwt, { SignOptions } from 'jsonwebtoken';
import { Types } from 'mongoose';

interface TokenPayload {
  id: string;
  email: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate JWT access token (short-lived)
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET as string, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  } as SignOptions);
};

/**
 * Generate JWT refresh token (long-lived)
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  } as SignOptions);
};

/**
 * Generate access & refresh token pair
 */
export const generateTokenPair = (
  id: Types.ObjectId | string,
  email: string,
): TokenPair => {
  const payload: TokenPayload = { id: id.toString(),  email };
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as TokenPayload;
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as TokenPayload;
};
