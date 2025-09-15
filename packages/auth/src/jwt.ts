import jwt from 'jsonwebtoken';
import type { JWTPayload } from './types';

function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, getJWTSecret(), {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'findable',
    audience: 'findable-api',
  });
}

export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, getJWTSecret(), {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: 'findable',
    audience: 'findable-refresh',
  });
}

export function verifyAccessToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, getJWTSecret(), {
      issuer: 'findable',
      audience: 'findable-api',
    });

    if (typeof decoded === 'string') {
      throw new Error('Invalid token format');
    }

    return decoded as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
}

export function verifyRefreshToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, getJWTSecret(), {
      issuer: 'findable',
      audience: 'findable-refresh',
    });

    if (typeof decoded === 'string') {
      throw new Error('Invalid token format');
    }

    return decoded as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
}